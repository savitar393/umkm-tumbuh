package service

import (
	"context"
	"errors"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/config"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/model"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/repository"
)

type ServiceError struct {
	StatusCode int
	Message    string
}

func (e *ServiceError) Error() string {
	return e.Message
}

type AuthService struct {
	UserRepo *repository.UserRepository
	Config   config.Config
}

func NewAuthService(userRepo *repository.UserRepository, cfg config.Config) *AuthService {
	return &AuthService{
		UserRepo: userRepo,
		Config:   cfg,
	}
}

func (s *AuthService) Register(ctx context.Context, req model.RegisterRequest) (*model.RegisterResponse, error) {
	req.FullName = strings.TrimSpace(req.FullName)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Role = strings.ToUpper(strings.TrimSpace(req.Role))

	req.PhoneNumber = cleanOptionalString(req.PhoneNumber)
	req.NIK = cleanOptionalString(req.NIK)

	if len(req.FullName) < 3 {
		return nil, newServiceError(http.StatusBadRequest, "Nama lengkap minimal 3 karakter.")
	}

	if _, err := mail.ParseAddress(req.Email); err != nil {
		return nil, newServiceError(http.StatusBadRequest, "Format email tidak valid.")
	}

	if len(req.Password) < 8 {
		return nil, newServiceError(http.StatusBadRequest, "Password minimal 8 karakter.")
	}

	if req.Role != model.RoleUMKM && req.Role != model.RoleMitra {
		return nil, newServiceError(http.StatusBadRequest, "Registrasi publik hanya untuk UMKM atau Mitra.")
	}

	duplicate, err := s.UserRepo.FindDuplicate(ctx, req.Email, req.PhoneNumber, req.NIK)
	if err != nil {
		return nil, err
	}

	if duplicate != nil {
		switch {
		case duplicate.Email == req.Email:
			return nil, newServiceError(http.StatusConflict, "Email sudah terdaftar.")
		case req.PhoneNumber != nil && duplicate.PhoneNumber != nil && *duplicate.PhoneNumber == *req.PhoneNumber:
			return nil, newServiceError(http.StatusConflict, "Nomor telepon sudah terdaftar.")
		case req.NIK != nil && duplicate.NIK != nil && *duplicate.NIK == *req.NIK:
			return nil, newServiceError(http.StatusConflict, "NIK sudah terdaftar.")
		default:
			return nil, newServiceError(http.StatusConflict, "Data pengguna sudah terdaftar.")
		}
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		ID:           uuid.NewString(),
		FullName:     req.FullName,
		Email:        req.Email,
		PhoneNumber:  req.PhoneNumber,
		NIK:          req.NIK,
		PasswordHash: string(hashedPassword),
		Role:         req.Role,
		Status:       model.StatusPending,
		IsActive:     true,
	}

	if err := s.UserRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	createdUser, err := s.UserRepo.FindByEmail(ctx, user.Email)
	if err != nil {
		return nil, err
	}

	return &model.RegisterResponse{
		Message: "Pendaftaran berhasil dikirim. Akun menunggu validasi Pemerintah/Admin.",
		User:    model.ToUserResponse(createdUser),
	}, nil
}

func (s *AuthService) Login(ctx context.Context, req model.LoginRequest) (*model.TokenResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	user, err := s.UserRepo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, newServiceError(http.StatusUnauthorized, "Email atau password tidak valid.")
		}

		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, newServiceError(http.StatusUnauthorized, "Email atau password tidak valid.")
	}

	if !user.IsActive {
		return nil, newServiceError(http.StatusForbidden, "Akun tidak aktif.")
	}

	if user.Status == model.StatusPending {
		return nil, newServiceError(http.StatusForbidden, "Akun masih menunggu validasi Pemerintah/Admin.")
	}

	if user.Status == model.StatusRejected {
		return nil, newServiceError(http.StatusForbidden, "Akun ditolak. Silakan hubungi Pemerintah/Admin.")
	}

	token, err := s.createAccessToken(user)
	if err != nil {
		return nil, err
	}

	return &model.TokenResponse{
		AccessToken: token,
		TokenType:   "bearer",
		User:        model.ToUserResponse(user),
	}, nil
}

func (s *AuthService) createAccessToken(user *model.User) (string, error) {
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

func newServiceError(statusCode int, message string) *ServiceError {
	return &ServiceError{
		StatusCode: statusCode,
		Message:    message,
	}
}
