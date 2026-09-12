package router

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/certificates"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/health"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/trainings"
)

func TestTrainingAdminRoutesRequireAdmin(t *testing.T) {
	const secret = "test-secret"
	router := NewRouter(health.NewHandler(nil), trainings.NewHandler(nil), trainings.NewAdminHandler(nil), certificates.NewHandler(nil), "http://localhost:5173", secret)
	for _, tc := range []struct{ method, path string }{
		{"GET", "/admin/training/"}, {"GET", "/admin/training/stats"}, {"GET", "/admin/training/P1"},
		{"POST", "/admin/training/"}, {"PUT", "/admin/training/P1"}, {"DELETE", "/admin/training/P1"},
		{"PATCH", "/admin/training/P1/status"}, {"GET", "/certificates/list"}, {"GET", "/certificates/stats"},
		{"POST", "/certificates/1/approve"}, {"POST", "/certificates/1/reject"},
	} {
		for _, role := range []string{"", "UMKM", "MITRA"} {
			t.Run(role+tc.method+tc.path, func(t *testing.T) {
				req := httptest.NewRequest(tc.method, "/api/v1"+tc.path, strings.NewReader("{}"))
				want := http.StatusUnauthorized
				if role != "" {
					token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
						"sub": "account", "role": role, "exp": time.Now().Add(time.Hour).Unix(),
					}).SignedString([]byte(secret))
					if err != nil {
						t.Fatal(err)
					}
					req.Header.Set("Authorization", "Bearer "+token)
					want = http.StatusForbidden
				}
				req.Header.Set("X-User-Role", "ADMIN")
				rr := httptest.NewRecorder()
				router.ServeHTTP(rr, req)
				if rr.Code != want {
					t.Fatalf("status = %d, want %d", rr.Code, want)
				}
			})
		}
	}
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, httptest.NewRequest("GET", "/api/v1/health", nil))
	if rr.Code != http.StatusOK {
		t.Fatalf("health status = %d, want 200", rr.Code)
	}
}
