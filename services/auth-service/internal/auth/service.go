package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"log"
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
	emailpkg "github.com/savitar393/umkm-tumbuh/services/auth-service/internal/email"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/users"
)

type Service struct {
	UserRepo    *users.Repository
	Config      config.Config
	EmailSender *emailpkg.Sender
}

func NewService(userRepo *users.Repository, cfg config.Config) *Service {
	return &Service{
		UserRepo: userRepo,
		Config:   cfg,
	}
}

func (s *Service) SetEmailSender(sender *emailpkg.Sender) {
	s.EmailSender = sender
}

func (s *Service) sendCodeEmail(data emailpkg.CodeEmailData) {
	if s.EmailSender == nil {
		return
	}

	go func() {
		if err := s.EmailSender.SendCodeEmail(data); err != nil {
			log.Printf("[EMAIL][ERROR] failed to send %s code to %s: %v", data.Purpose, data.To, err)
		}
	}()
}

func (s *Service) Register(ctx context.Context, req RegisterRequest) (*RegisterResponse, error) {
	req.FullName = strings.TrimSpace(req.FullName)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Role = strings.ToUpper(strings.TrimSpace(req.Role))

	req.PhoneNumber = normalizePhoneNumber(req.PhoneNumber)
	req.NIK = normalizeNIK(req.NIK)

	if len(req.FullName) < 3 {
		return nil, apperror.New(http.StatusBadRequest, "Nama lengkap minimal 3 karakter.")
	}

	if _, err := mail.ParseAddress(req.Email); err != nil {
		return nil, apperror.New(http.StatusBadRequest, "Format email tidak valid.")
	}

	if len(req.Password) < 8 {
		return nil, apperror.New(http.StatusBadRequest, "Password minimal 8 karakter.")
	}

	if req.Role != users.RoleUMKM && req.Role != users.RoleMitra {
		return nil, apperror.New(http.StatusBadRequest, "Registrasi publik hanya untuk UMKM atau Mitra.")
	}

	if req.PhoneNumber == nil {
		return nil, apperror.New(http.StatusBadRequest, "Nomor WhatsApp wajib diisi.")
	}

	if len(*req.PhoneNumber) < 10 || len(*req.PhoneNumber) > 15 {
		return nil, apperror.New(http.StatusBadRequest, "Nomor WhatsApp wajib 8–13 digit setelah kode +62.")
	}

	if req.NIK != nil && len(*req.NIK) != 16 {
		return nil, apperror.New(http.StatusBadRequest, "NIK wajib 16 digit jika diisi.")
	}

	duplicate, err := s.UserRepo.FindDuplicate(ctx, req.Email, req.PhoneNumber, req.NIK)
	if err != nil {
		return nil, err
	}

	if duplicate != nil {
		switch {
		case duplicate.Email == req.Email:
			return nil, apperror.New(http.StatusConflict, "Email sudah terdaftar.")
		case req.PhoneNumber != nil && duplicate.PhoneNumber != nil && *duplicate.PhoneNumber == *req.PhoneNumber:
			return nil, apperror.New(http.StatusConflict, "Nomor telepon sudah terdaftar.")
		case req.NIK != nil && duplicate.NIK != nil && *duplicate.NIK == *req.NIK:
			return nil, apperror.New(http.StatusConflict, "NIK sudah terdaftar.")
		default:
			return nil, apperror.New(http.StatusConflict, "Data pengguna sudah terdaftar.")
		}
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &users.User{
		ID:           newAccountID(),
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

	token, err := s.createAccessToken(createdUser)
	if err != nil {
		return nil, err
	}

	return &RegisterResponse{
		Message:     "Akun dasar berhasil dibuat. Lengkapi data profil untuk proses validasi.",
		AccessToken: token,
		TokenType:   "bearer",
		User:        users.ToResponse(createdUser),
	}, nil
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (*TokenResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	if email == "" {
		return nil, apperror.New(http.StatusBadRequest, "Email wajib diisi.")
	}

	if _, err := mail.ParseAddress(email); err != nil {
		return nil, apperror.New(http.StatusBadRequest, "Format email tidak valid.")
	}

	if strings.TrimSpace(req.Password) == "" {
		return nil, apperror.New(http.StatusBadRequest, "Kata sandi wajib diisi.")
	}

	user, err := s.UserRepo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusUnauthorized, "Email atau password tidak valid.")
		}

		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, apperror.New(http.StatusUnauthorized, "Email atau password tidak valid.")
	}

	if !user.IsActive {
		return nil, apperror.New(http.StatusForbidden, "Akun tidak aktif.")
	}

	if user.Role != users.RoleAdmin && user.EmailVerifiedAt == nil {
		return nil, apperror.New(http.StatusForbidden, "Email belum diverifikasi. Silakan verifikasi email terlebih dahulu.")
	}

	token, err := s.createAccessToken(user)
	if err != nil {
		return nil, err
	}

	refreshToken := ""

	if req.RememberMe {
		refreshToken, err = s.createRememberToken(ctx, user.ID)
		if err != nil {
			return nil, err
		}
	}

	return &TokenResponse{
		AccessToken:  token,
		TokenType:    "bearer",
		RefreshToken: refreshToken,
		User:         users.ToResponse(user),
	}, nil
}

func (s *Service) Logout(ctx context.Context, authorizationHeader string) (map[string]string, error) {
	claims, err := s.parseAccessToken(authorizationHeader)
	if err != nil {
		return nil, err
	}

	userID, _ := claims["sub"].(string)
	jti, _ := claims["jti"].(string)

	expFloat, ok := claims["exp"].(float64)
	if !ok || userID == "" || jti == "" {
		return nil, apperror.New(http.StatusUnauthorized, "Token tidak valid.")
	}

	expiresAt := time.Unix(int64(expFloat), 0).UTC()

	_, err = s.UserRepo.DB.Exec(ctx, `
		INSERT INTO auth.transaksi_revoked_jwts (
			akun_id,
			jwt_id,
			expires_at
		)
		VALUES ($1, $2, $3)
		ON CONFLICT (jwt_id) DO NOTHING
	`, userID, jti, expiresAt)
	if err != nil {
		return nil, err
	}

	return map[string]string{
		"message": "Logout berhasil.",
	}, nil
}

func (s *Service) RequestEmailVerification(ctx context.Context, req RequestEmailVerificationRequest) (map[string]any, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	if email == "" {
		return nil, apperror.New(http.StatusBadRequest, "Email wajib diisi.")
	}

	if _, err := mail.ParseAddress(email); err != nil {
		return nil, apperror.New(http.StatusBadRequest, "Format email tidak valid.")
	}

	user, err := s.UserRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, apperror.New(http.StatusNotFound, "Akun tidak ditemukan.")
	}

	code, err := generateVerificationCode()
	if err != nil {
		return nil, err
	}

	codeHash := hashVerificationCode(code)

	_, err = s.UserRepo.DB.Exec(ctx, `
		INSERT INTO auth.email_verification_tokens (
			token_id,
			akun_id,
			code_hash,
			expires_at
		)
		VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '15 minutes')
	`, user.ID, codeHash)
	if err != nil {
		return nil, err
	}

	log.Printf("DEV email verification code for %s: %s", email, code)

	s.sendCodeEmail(emailpkg.CodeEmailData{
		To:       user.Email,
		FullName: user.FullName,
		Subject:  "Kode Verifikasi Email UMKM Tumbuh",
		Code:     code,
		Purpose:  "EMAIL_VERIFICATION",
	})

	return map[string]any{
		"message":  "Kode verifikasi email berhasil dibuat.",
		"dev_code": code,
	}, nil
}

func (s *Service) ConfirmEmailVerification(ctx context.Context, req ConfirmEmailVerificationRequest) (map[string]any, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	code := strings.TrimSpace(req.Code)

	if email == "" {
		return nil, apperror.New(http.StatusBadRequest, "Email wajib diisi.")
	}

	if code == "" {
		return nil, apperror.New(http.StatusBadRequest, "Kode verifikasi wajib diisi.")
	}

	user, err := s.UserRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, apperror.New(http.StatusNotFound, "Akun tidak ditemukan.")
	}

	codeHash := hashVerificationCode(code)

	var tokenID string
	err = s.UserRepo.DB.QueryRow(ctx, `
		SELECT token_id::text
		FROM auth.email_verification_tokens
		WHERE akun_id = $1
		  AND code_hash = $2
		  AND used_at IS NULL
		  AND expires_at > NOW()
		ORDER BY created_at DESC
		LIMIT 1
	`, user.ID, codeHash).Scan(&tokenID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusBadRequest, "Kode verifikasi tidak valid atau sudah kedaluwarsa.")
		}

		return nil, err
	}

	_, err = s.UserRepo.DB.Exec(ctx, `
		UPDATE auth.email_verification_tokens
		SET used_at = NOW()
		WHERE token_id = $1::uuid
	`, tokenID)
	if err != nil {
		return nil, err
	}

	_, err = s.UserRepo.DB.Exec(ctx, `
		UPDATE auth.master_akunpengguna
		SET
			email_verified_at = COALESCE(email_verified_at, NOW()),
			updated_at = NOW()
		WHERE akun_id = $1
	`, user.ID)
	if err != nil {
		return nil, err
	}

	return map[string]any{
		"message": "Email berhasil diverifikasi.",
	}, nil
}

func (s *Service) RequestPasswordReset(ctx context.Context, req RequestPasswordResetRequest) (map[string]string, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	if email == "" {
		return nil, apperror.New(http.StatusBadRequest, "Email wajib diisi.")
	}

	if _, err := mail.ParseAddress(email); err != nil {
		return nil, apperror.New(http.StatusBadRequest, "Format email tidak valid.")
	}

	user, err := s.UserRepo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return passwordResetGenericResponse(), nil
		}

		return nil, err
	}

	code, err := generateVerificationCode()
	if err != nil {
		return nil, err
	}

	codeHash := hashVerificationCode(code)

	_, err = s.UserRepo.DB.Exec(ctx, `
		INSERT INTO auth.transaksi_kode_verifikasi (
			akun_id,
			email,
			purpose,
			code_hash,
			expires_at
		)
		VALUES ($1, $2, 'PASSWORD_RESET', $3, NOW() + INTERVAL '15 minutes')
	`, user.ID, email, codeHash)
	if err != nil {
		return nil, err
	}

	log.Printf("DEV password reset code for %s: %s", email, code)

	s.sendCodeEmail(emailpkg.CodeEmailData{
		To:       user.Email,
		FullName: user.FullName,
		Subject:  "Kode Reset Password UMKM Tumbuh",
		Code:     code,
		Purpose:  "PASSWORD_RESET",
	})

	return map[string]string{
		"message":  "Jika email terdaftar, instruksi reset password telah dikirim.",
		"dev_code": code,
	}, nil
}

func (s *Service) ResetPassword(ctx context.Context, req ResetPasswordRequest) (map[string]string, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	code := strings.TrimSpace(req.Code)
	newPassword := strings.TrimSpace(req.NewPassword)

	if email == "" {
		return nil, apperror.New(http.StatusBadRequest, "Email wajib diisi.")
	}

	if _, err := mail.ParseAddress(email); err != nil {
		return nil, apperror.New(http.StatusBadRequest, "Format email tidak valid.")
	}

	if code == "" {
		return nil, apperror.New(http.StatusBadRequest, "Kode reset password wajib diisi.")
	}

	if len(newPassword) < 8 {
		return nil, apperror.New(http.StatusBadRequest, "Password baru minimal 8 karakter.")
	}

	user, err := s.UserRepo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusBadRequest, "Kode reset password tidak valid atau sudah kedaluwarsa.")
		}

		return nil, err
	}

	codeHash := hashVerificationCode(code)

	tx, err := s.UserRepo.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var codeID string
	err = tx.QueryRow(ctx, `
		SELECT kode_verifikasi_id::text
		FROM auth.transaksi_kode_verifikasi
		WHERE akun_id = $1
		  AND email = $2
		  AND purpose = 'PASSWORD_RESET'
		  AND code_hash = $3
		  AND used_at IS NULL
		  AND expires_at > NOW()
		ORDER BY created_at DESC
		LIMIT 1
		FOR UPDATE
	`, user.ID, email, codeHash).Scan(&codeID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusBadRequest, "Kode reset password tidak valid atau sudah kedaluwarsa.")
		}

		return nil, err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, `
		UPDATE auth.master_akunpengguna
		SET
			password_hash = $2,
			updated_at = NOW()
		WHERE akun_id = $1
	`, user.ID, string(hashedPassword))
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, `
		UPDATE auth.transaksi_kode_verifikasi
		SET used_at = NOW()
		WHERE kode_verifikasi_id = $1::uuid
	`, codeID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return map[string]string{
		"message": "Password berhasil direset. Silakan login dengan password baru.",
	}, nil
}

func (s *Service) CurrentUserFromHeader(ctx context.Context, authorizationHeader string) (*users.User, error) {
	claims, err := s.parseAccessToken(authorizationHeader)
	if err != nil {
		return nil, err
	}

	jti, _ := claims["jti"].(string)
	if jti != "" {
		var exists bool

		err = s.UserRepo.DB.QueryRow(ctx, `
			SELECT EXISTS (
				SELECT 1
				FROM auth.transaksi_revoked_jwts
				WHERE jwt_id = $1
				  AND expires_at > NOW()
			)
		`, jti).Scan(&exists)
		if err != nil {
			return nil, err
		}

		if exists {
			return nil, apperror.New(http.StatusUnauthorized, "Token sudah logout.")
		}
	}

	userID, ok := claims["sub"].(string)
	if !ok || userID == "" {
		return nil, apperror.New(http.StatusUnauthorized, "Token tidak valid.")
	}

	user, err := s.UserRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusUnauthorized, "Pengguna tidak ditemukan.")
		}

		return nil, err
	}

	if !user.IsActive {
		return nil, apperror.New(http.StatusForbidden, "Akun tidak aktif.")
	}

	return user, nil
}

func (s *Service) createAccessToken(user *users.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"role":  user.Role,
		"jti":   uuid.NewString(),
		"exp": time.Now().
			Add(time.Duration(s.Config.JWTExpireMinutes) * time.Minute).
			Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(s.Config.JWTSecret))
}

func (s *Service) createRememberToken(ctx context.Context, userID string) (string, error) {
	rawToken, err := generateOpaqueToken(32)
	if err != nil {
		return "", err
	}

	tokenHash := hashOpaqueToken(rawToken)

	_, err = s.UserRepo.DB.Exec(ctx, `
		INSERT INTO auth.transaksi_remember_tokens (
			akun_id,
			token_hash,
			expires_at
		)
		VALUES ($1, $2, NOW() + INTERVAL '30 days')
	`, userID, tokenHash)
	if err != nil {
		return "", err
	}

	return rawToken, nil
}

func (s *Service) RefreshToken(ctx context.Context, req RefreshTokenRequest) (*TokenResponse, error) {
	rawRefreshToken := strings.TrimSpace(req.RefreshToken)

	if rawRefreshToken == "" {
		return nil, apperror.New(http.StatusBadRequest, "Refresh token wajib diisi.")
	}

	tokenHash := hashOpaqueToken(rawRefreshToken)

	tx, err := s.UserRepo.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var userID string
	err = tx.QueryRow(ctx, `
		SELECT akun_id
		FROM auth.transaksi_remember_tokens
		WHERE token_hash = $1
		  AND revoked_at IS NULL
		  AND expires_at > NOW()
		FOR UPDATE
	`, tokenHash).Scan(&userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusUnauthorized, "Refresh token tidak valid atau sudah kedaluwarsa.")
		}

		return nil, err
	}

	_, err = tx.Exec(ctx, `
		UPDATE auth.transaksi_remember_tokens
		SET revoked_at = NOW()
		WHERE token_hash = $1
	`, tokenHash)
	if err != nil {
		return nil, err
	}

	user, err := s.UserRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusUnauthorized, "Pengguna tidak ditemukan.")
		}

		return nil, err
	}

	if !user.IsActive {
		return nil, apperror.New(http.StatusForbidden, "Akun tidak aktif.")
	}

	accessToken, err := s.createAccessToken(user)
	if err != nil {
		return nil, err
	}

	newRefreshToken, err := generateOpaqueToken(32)
	if err != nil {
		return nil, err
	}

	newRefreshTokenHash := hashOpaqueToken(newRefreshToken)

	_, err = tx.Exec(ctx, `
		INSERT INTO auth.transaksi_remember_tokens (
			akun_id,
			token_hash,
			expires_at
		)
		VALUES ($1, $2, NOW() + INTERVAL '30 days')
	`, user.ID, newRefreshTokenHash)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &TokenResponse{
		AccessToken:  accessToken,
		TokenType:    "bearer",
		RefreshToken: newRefreshToken,
		User:         users.ToResponse(user),
	}, nil
}

func extractBearerToken(authorizationHeader string) (string, error) {
	authorizationHeader = strings.TrimSpace(authorizationHeader)

	const prefix = "Bearer "

	if !strings.HasPrefix(authorizationHeader, prefix) {
		return "", apperror.New(http.StatusUnauthorized, "Authorization header tidak valid.")
	}

	token := strings.TrimSpace(strings.TrimPrefix(authorizationHeader, prefix))
	if token == "" {
		return "", apperror.New(http.StatusUnauthorized, "Token tidak ditemukan.")
	}

	return token, nil
}

func (s *Service) parseAccessToken(authorizationHeader string) (jwt.MapClaims, error) {
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
		return nil, apperror.New(http.StatusUnauthorized, "Token tidak valid atau sudah kedaluwarsa.")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, apperror.New(http.StatusUnauthorized, "Token tidak valid.")
	}

	return claims, nil
}

func newAccountID() string {
	raw := strings.ToUpper(strings.ReplaceAll(uuid.NewString(), "-", ""))
	return "AKUN" + raw[:16]
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

func digitsOnly(value string) string {
	var builder strings.Builder

	for _, char := range value {
		if char >= '0' && char <= '9' {
			builder.WriteRune(char)
		}
	}

	return builder.String()
}

func normalizePhoneNumber(value *string) *string {
	if value == nil {
		return nil
	}

	digits := digitsOnly(strings.TrimSpace(*value))
	if digits == "" {
		return nil
	}

	if strings.HasPrefix(digits, "0") {
		digits = "62" + strings.TrimPrefix(digits, "0")
	} else if strings.HasPrefix(digits, "8") {
		digits = "62" + digits
	}

	return &digits
}

func normalizeNIK(value *string) *string {
	if value == nil {
		return nil
	}

	digits := digitsOnly(strings.TrimSpace(*value))
	if digits == "" {
		return nil
	}

	return &digits
}

func generateVerificationCode() (string, error) {
	var bytes [4]byte

	if _, err := rand.Read(bytes[:]); err != nil {
		return "", err
	}

	n := int(bytes[0])<<24 | int(bytes[1])<<16 | int(bytes[2])<<8 | int(bytes[3])
	if n < 0 {
		n = -n
	}

	return fmt.Sprintf("%06d", n%1000000), nil
}

func hashVerificationCode(code string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(code)))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func passwordResetGenericResponse() map[string]string {
	return map[string]string{
		"message": "Jika email terdaftar, instruksi reset password telah dikirim.",
	}
}

func generateOpaqueToken(byteSize int) (string, error) {
	bytes := make([]byte, byteSize)

	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func hashOpaqueToken(token string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(token)))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}
