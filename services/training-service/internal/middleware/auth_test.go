package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestAuthMiddleware(t *testing.T) {
	const secret = "test-only-jwt-secret"
	sign := func(method jwt.SigningMethod, key any, changes map[string]any) string {
		t.Helper()
		claims := jwt.MapClaims{"sub": "ACCOUNT_A", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix()}
		for name, value := range changes {
			if value == nil {
				delete(claims, name)
			} else {
				claims[name] = value
			}
		}
		token, err := jwt.NewWithClaims(method, claims).SignedString(key)
		if err != nil {
			t.Fatal(err)
		}
		return token
	}
	valid := sign(jwt.SigningMethodHS256, []byte(secret), nil)
	cases := []struct {
		name   string
		header string
		secret string
		want   int
	}{
		{"valid token ignores spoofed role header", "Bearer " + valid, secret, http.StatusNoContent},
		{"lowercase bearer scheme", "bearer " + valid, secret, http.StatusNoContent},
		{"anonymous with role header", "", secret, http.StatusUnauthorized},
		{"wrong scheme", "Basic " + valid, secret, http.StatusUnauthorized},
		{"extra header field", "Bearer " + valid + " extra", secret, http.StatusUnauthorized},
		{"malformed token", "Bearer invalid", secret, http.StatusUnauthorized},
		{"forged signature", "Bearer " + sign(jwt.SigningMethodHS256, []byte("wrong-key"), nil), secret, http.StatusUnauthorized},
		{"unsigned token", "Bearer " + sign(jwt.SigningMethodNone, jwt.UnsafeAllowNoneSignatureType, nil), secret, http.StatusUnauthorized},
		{"wrong algorithm", "Bearer " + sign(jwt.SigningMethodHS384, []byte(secret), nil), secret, http.StatusUnauthorized},
		{"expired token", "Bearer " + sign(jwt.SigningMethodHS256, []byte(secret), map[string]any{"exp": time.Now().Add(-time.Hour).Unix()}), secret, http.StatusUnauthorized},
		{"missing expiry", "Bearer " + sign(jwt.SigningMethodHS256, []byte(secret), map[string]any{"exp": nil}), secret, http.StatusUnauthorized},
		{"future not-before", "Bearer " + sign(jwt.SigningMethodHS256, []byte(secret), map[string]any{"nbf": time.Now().Add(time.Hour).Unix()}), secret, http.StatusUnauthorized},
		{"blank subject", "Bearer " + sign(jwt.SigningMethodHS256, []byte(secret), map[string]any{"sub": " "}), secret, http.StatusUnauthorized},
		{"missing subject", "Bearer " + sign(jwt.SigningMethodHS256, []byte(secret), map[string]any{"sub": nil}), secret, http.StatusUnauthorized},
		{"missing role", "Bearer " + sign(jwt.SigningMethodHS256, []byte(secret), map[string]any{"role": nil}), secret, http.StatusUnauthorized},
		{"unknown role", "Bearer " + sign(jwt.SigningMethodHS256, []byte(secret), map[string]any{"role": "OWNER"}), secret, http.StatusUnauthorized},
		{"empty server secret", "Bearer " + valid, "", http.StatusInternalServerError},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			called := false
			next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				called = true
				id, ok := GetUserID(r.Context())
				role, roleOK := GetUserRole(r.Context())
				if !ok || !roleOK || id != "ACCOUNT_A" || role != "UMKM" {
					t.Fatal("identity must come from verified claims")
				}
				w.WriteHeader(http.StatusNoContent)
			})
			req := httptest.NewRequest(http.MethodGet, "/protected", nil)
			req.Header.Set("Authorization", tc.header)
			req.Header.Set("X-User-Role", "ADMIN")
			rr := httptest.NewRecorder()
			AuthMiddleware(tc.secret)(next).ServeHTTP(rr, req)
			if rr.Code != tc.want {
				t.Fatalf("status = %d, want %d", rr.Code, tc.want)
			}
			if called != (tc.want == http.StatusNoContent) {
				t.Fatal("invalid token reached protected handler")
			}
		})
	}
}
