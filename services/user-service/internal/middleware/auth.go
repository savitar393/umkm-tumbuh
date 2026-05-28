package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const currentUserKey contextKey = "current_user"

type CurrentUser struct {
	ID    string
	Email string
	Role  string
}

func Auth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if jwtSecret == "" {
				writeError(w, http.StatusInternalServerError, "JWT secret belum dikonfigurasi.")
				return
			}

			tokenString, err := extractBearerToken(r.Header.Get("Authorization"))
			if err != nil {
				writeError(w, http.StatusUnauthorized, err.Error())
				return
			}

			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
				return []byte(jwtSecret), nil
			})

			if err != nil || !token.Valid {
				writeError(w, http.StatusUnauthorized, "Token tidak valid atau sudah kedaluwarsa.")
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				writeError(w, http.StatusUnauthorized, "Token tidak valid.")
				return
			}

			userID, _ := claims["sub"].(string)
			email, _ := claims["email"].(string)
			role, _ := claims["role"].(string)

			if userID == "" || role == "" {
				writeError(w, http.StatusUnauthorized, "Token tidak valid.")
				return
			}

			currentUser := CurrentUser{
				ID:    userID,
				Email: email,
				Role:  strings.ToUpper(role),
			}

			ctx := context.WithValue(r.Context(), currentUserKey, currentUser)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func CurrentUserFromContext(ctx context.Context) (CurrentUser, bool) {
	user, ok := ctx.Value(currentUserKey).(CurrentUser)
	return user, ok
}

func extractBearerToken(authorizationHeader string) (string, error) {
	authorizationHeader = strings.TrimSpace(authorizationHeader)

	const prefix = "Bearer "
	if !strings.HasPrefix(authorizationHeader, prefix) {
		return "", errString("Authorization header tidak valid.")
	}

	token := strings.TrimSpace(strings.TrimPrefix(authorizationHeader, prefix))
	if token == "" {
		return "", errString("Token tidak ditemukan.")
	}

	return token, nil
}

type errString string

func (e errString) Error() string {
	return string(e)
}

func writeError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	})
}
