package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestContractReadAccessDoesNotGrantDeleteAccess(t *testing.T) {
	document := documentResponse{ID: "D1", UploaderAccount: "requester"}
	contract := partnershipContract{documentResponse: document, RequesterID: "requester", ReceiverID: "receiver"}
	for _, tc := range []struct {
		id, role    string
		read, erase bool
	}{
		{"requester", "UMKM", true, true},
		{"receiver", "MITRA", true, false},
		{"other-business", "UMKM", false, false},
		{"other-partner", "MITRA", false, false},
		{"admin", "ADMIN", true, true},
		{"", "", false, false},
	} {
		t.Run(tc.id+tc.role, func(t *testing.T) {
			user := currentUser{ID: tc.id, Role: tc.role}
			if got := canReadContract(user, contract); got != tc.read {
				t.Fatalf("read = %v, want %v", got, tc.read)
			}
			if got := canDeleteDocument(user, document); got != tc.erase {
				t.Fatalf("delete = %v, want %v", got, tc.erase)
			}
		})
	}
}

func TestContractDownloadsRequireVerifiedExpiringTokens(t *testing.T) {
	const secret = "contract-unit-test-secret"
	valid := func() jwt.MapClaims {
		return jwt.MapClaims{"sub": "requester", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix()}
	}
	for _, tc := range []struct {
		name   string
		method jwt.SigningMethod
		key    any
		edit   func(jwt.MapClaims)
		want   int
	}{
		{"valid", jwt.SigningMethodHS256, []byte(secret), nil, 204},
		{"forged", jwt.SigningMethodHS256, []byte("other-secret"), nil, 401},
		{"wrong algorithm", jwt.SigningMethodHS384, []byte(secret), nil, 401},
		{"unsigned", jwt.SigningMethodNone, jwt.UnsafeAllowNoneSignatureType, nil, 401},
		{"expired", jwt.SigningMethodHS256, []byte(secret), func(c jwt.MapClaims) { c["exp"] = time.Now().Add(-time.Minute).Unix() }, 401},
		{"missing expiry", jwt.SigningMethodHS256, []byte(secret), func(c jwt.MapClaims) { delete(c, "exp") }, 401},
		{"empty subject", jwt.SigningMethodHS256, []byte(secret), func(c jwt.MapClaims) { c["sub"] = " " }, 401},
		{"unknown role", jwt.SigningMethodHS256, []byte(secret), func(c jwt.MapClaims) { c["role"] = "UNKNOWN" }, 401},
	} {
		t.Run(tc.name, func(t *testing.T) {
			claims := valid()
			if tc.edit != nil {
				tc.edit(claims)
			}
			token, err := jwt.NewWithClaims(tc.method, claims).SignedString(tc.key)
			if err != nil {
				t.Fatal(err)
			}
			a := &app{jwtSecret: secret}
			req := httptest.NewRequest(http.MethodGet, "/api/v1/partnership-contracts/P1/download", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			req.Header.Set("X-User-Role", "ADMIN")
			rr := httptest.NewRecorder()
			a.withAuth(func(w http.ResponseWriter, r *http.Request) {
				user, ok := userFromContext(r.Context())
				if !ok || user.ID != "requester" || user.Role != "UMKM" {
					t.Fatal("identity was not taken from the verified token")
				}
				w.WriteHeader(http.StatusNoContent)
			})(rr, req)
			if rr.Code != tc.want {
				t.Fatalf("status = %d, want %d", rr.Code, tc.want)
			}
		})
	}
}

func TestAnonymousContractDownloadNeverReachesDatabase(t *testing.T) {
	a := &app{jwtSecret: "contract-unit-test-secret"}
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/partnership-contracts/P1/download", nil)
	a.withAuth(a.handlePartnershipContract)(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rr.Code)
	}
}
