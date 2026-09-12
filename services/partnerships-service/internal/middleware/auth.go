package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/response"
)

type contextKey string

const UserIDKey contextKey = "user_id"
const UserRoleKey contextKey = "user_role"

type accessClaims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

func AuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.TrimSpace(jwtSecret) == "" {
				response.Error(w, http.StatusInternalServerError, "JWT secret belum dikonfigurasi")
				return
			}
			parts := strings.Fields(r.Header.Get("Authorization"))
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				response.Error(w, http.StatusUnauthorized, "Authorization header tidak valid")
				return
			}

			claims := &accessClaims{}
			token, err := jwt.ParseWithClaims(parts[1], claims, func(_ *jwt.Token) (any, error) {
				return []byte(jwtSecret), nil
			}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}), jwt.WithExpirationRequired())
			if err != nil || token == nil || !token.Valid || strings.TrimSpace(claims.Subject) == "" {
				response.Error(w, http.StatusUnauthorized, "Token tidak valid atau sudah kedaluwarsa")
				return
			}
			switch claims.Role {
			case "ADMIN", "UMKM", "MITRA":
			default:
				response.Error(w, http.StatusUnauthorized, "Peran pada token tidak valid")
				return
			}

			ctx := context.WithValue(r.Context(), UserIDKey, claims.Subject)
			ctx = context.WithValue(ctx, UserRoleKey, claims.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRoles(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if _, ok := GetUserID(r.Context()); !ok {
				response.Error(w, http.StatusUnauthorized, "User belum terautentikasi")
				return
			}
			role, _ := GetUserRole(r.Context())
			for _, allowed := range roles {
				if role == allowed {
					next.ServeHTTP(w, r)
					return
				}
			}
			response.Error(w, http.StatusForbidden, "Anda tidak memiliki izin untuk tindakan ini")
		})
	}
}

func GetUserID(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(UserIDKey).(string)
	return id, ok && strings.TrimSpace(id) != ""
}

func GetUserRole(ctx context.Context) (string, bool) {
	role, ok := ctx.Value(UserRoleKey).(string)
	return role, ok && role != ""
}
