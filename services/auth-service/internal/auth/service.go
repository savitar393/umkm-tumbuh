package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/apperror"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/config"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/users"
)

type Service struct {
	UserRepo *users.Repository
	Config   config.Config
}

func NewService(userRepo *users.Repository, cfg config.Config) *Service {
	return &Service{
		UserRepo: userRepo,
		Config:   cfg,
	}
}

func (s *Service) Register(ctx context.Context, req RegisterRequest) (*RegisterResponse, error) {
	req.FullName = strings.TrimSpace(req.FullName)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Role = strings.ToUpper(strings.TrimSpace(req.Role))

	req.PhoneNumber = cleanOptionalString(req.PhoneNumber)
	req.NIK = cleanOptionalString(req.NIK)

	if len(req.FullName) < 3 {
		return nil, apperror.New(http.StatusBadRequest, "ERR-VAL-01", "Nama lengkap minimal 3 karakter.")
	}

	if _, err := mail.ParseAddress(req.Email); err != nil {
		return nil, apperror.New(http.StatusBadRequest, "ERR-VAL-01", "Format email tidak valid.")
	}

	if len(req.Password) < 8 {
		return nil, apperror.New(http.StatusBadRequest, "ERR-VAL-01", "Password minimal 8 karakter.")
	}

	if req.Role != users.RoleUMKM && req.Role != users.RoleMitra {
		return nil, apperror.New(http.StatusBadRequest, "ERR-VAL-01", "Registrasi publik hanya untuk UMKM atau Mitra.")
	}

	duplicate, err := s.UserRepo.FindDuplicate(ctx, req.Email, req.PhoneNumber, req.NIK)
	if err != nil {
		return nil, err
	}

	if duplicate != nil {
		switch {
		case duplicate.Email == req.Email:
			return nil, apperror.New(http.StatusConflict, "ERR-DATA-01", "Email sudah terdaftar.")
		case req.PhoneNumber != nil && duplicate.PhoneNumber != nil && *duplicate.PhoneNumber == *req.PhoneNumber:
			return nil, apperror.New(http.StatusConflict, "ERR-DATA-01", "Nomor telepon sudah terdaftar.")
		case req.NIK != nil && duplicate.NIK != nil && *duplicate.NIK == *req.NIK:
			return nil, apperror.New(http.StatusConflict, "ERR-DATA-01", "NIK sudah terdaftar.")
		default:
			return nil, apperror.New(http.StatusConflict, "ERR-DATA-01", "Data pengguna sudah terdaftar.")
		}
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &users.User{
		ID:           uuid.NewString(),
		FullName:     req.FullName,
		Email:        req.Email,
		PhoneNumber:  req.PhoneNumber,
		NIK:          req.NIK,
		PasswordHash: string(hashedPassword),
		Role:         req.Role,
		Status:       users.StatusPending,
		IsActive:     true,
	}

	if err := s.UserRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	createdUser, err := s.UserRepo.FindByEmail(ctx, user.Email)
	if err != nil {
		return nil, err
	}

	return &RegisterResponse{
		Message: "Pendaftaran berhasil dikirim. Akun menunggu validasi Pemerintah/Admin.",
		User:    users.ToResponse(createdUser),
	}, nil
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (*TokenResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	user, err := s.UserRepo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusUnauthorized, "ERR-AUTH-02", "Email atau password tidak valid.")
		}

		return nil, err
	}

	if user.AccountLockedUntil != nil && user.AccountLockedUntil.After(time.Now()) {
		return nil, apperror.New(http.StatusLocked, "ERR-LOCK-01", "Akun dikunci. Coba lagi dalam 15 menit.")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		_ = s.UserRepo.IncrementFailedAttempts(ctx, user.ID)
		updatedUser, _ := s.UserRepo.FindByID(ctx, user.ID)
		if updatedUser != nil && updatedUser.FailedAttempts >= 3 {
			_ = s.UserRepo.LockAccount(ctx, user.ID)
		}
		return nil, apperror.New(http.StatusUnauthorized, "ERR-AUTH-02", "Email atau password tidak valid.")
	}

	if !user.IsActive {
		return nil, apperror.New(http.StatusForbidden, "ERR-AUTH-03", "Akun tidak aktif.")
	}

	if user.Status == users.StatusPending {
		return nil, apperror.New(http.StatusForbidden, "ERR-AUTH-04", "Akun masih menunggu validasi Pemerintah/Admin.")
	}

	if user.Status == users.StatusRejected {
		return nil, apperror.New(http.StatusForbidden, "ERR-AUTH-04", "Akun ditolak. Silakan hubungi Pemerintah/Admin.")
	}

	_ = s.UserRepo.ResetFailedAttempts(ctx, user.ID)
	_ = s.UserRepo.UpdateLastLoginAt(ctx, user.ID)

	token, err := s.createAccessToken(user)
	if err != nil {
		return nil, err
	}

	return &TokenResponse{
		AccessToken: token,
		TokenType:   "bearer",
		User:        users.ToResponse(user),
	}, nil
}

func (s *Service) CurrentUserFromHeader(ctx context.Context, authorizationHeader string) (*users.User, error) {
	tokenString, err := extractBearerToken(authorizationHeader)
	if err != nil {
		return nil, err
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}

		return []byte(s.Config.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, apperror.New(http.StatusUnauthorized, "ERR-AUTH-01", "Token tidak valid atau sudah kedaluwarsa.")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, apperror.New(http.StatusUnauthorized, "ERR-AUTH-01", "Token tidak valid.")
	}

	userID, ok := claims["sub"].(string)
	if !ok || userID == "" {
		return nil, apperror.New(http.StatusUnauthorized, "ERR-AUTH-01", "Token tidak valid.")
	}

	user, err := s.UserRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusUnauthorized, "ERR-AUTH-01", "Pengguna tidak ditemukan.")
		}

		return nil, err
	}

	if !user.IsActive {
		return nil, apperror.New(http.StatusForbidden, "ERR-AUTH-03", "Akun tidak aktif.")
	}

	return user, nil
}

func (s *Service) createAccessToken(user *users.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp": time.Now().
			Add(time.Duration(s.Config.JWTExpireMinutes) * time.Minute).
			Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(s.Config.JWTSecret))
}

func extractBearerToken(authorizationHeader string) (string, error) {
	authorizationHeader = strings.TrimSpace(authorizationHeader)

	const prefix = "Bearer "

	if !strings.HasPrefix(authorizationHeader, prefix) {
		return "", apperror.New(http.StatusUnauthorized, "ERR-AUTH-01", "Authorization header tidak valid.")
	}

	token := strings.TrimSpace(strings.TrimPrefix(authorizationHeader, prefix))
	if token == "" {
		return "", apperror.New(http.StatusUnauthorized, "ERR-AUTH-01", "Token tidak ditemukan.")
	}

	return token, nil
}

func cleanOptionalString(value *string) *string {
	if value == nil {
		return nil
	}

	cleaned := strings.TrimSpace(*value)
	if cleaned == "" {
		return nil
	}

	return &cleaned
}
