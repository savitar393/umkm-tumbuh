package partnerships_test

import (
	"context"
	"errors"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	core "github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/partnerships"
	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/rest"
	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/router"
	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/soap"
	contracts "github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/soap/contracts"
)

// Query berhasil, satu baris terbaca, lalu iterator gagal saat Next berikutnya.
type failingRows struct {
	pgx.Rows
	next, scans int
	closed      bool
	failure     error
}

func (r *failingRows) Next() bool { r.next++; return r.next == 1 }
func (r *failingRows) Scan(dest ...any) error {
	r.scans++
	for _, d := range dest {
		v := reflect.ValueOf(d).Elem()
		v.Set(reflect.Zero(v.Type()))
	}
	return nil
}
func (r *failingRows) Err() error {
	if r.next > 1 {
		return r.failure
	}
	return nil
}
func (r *failingRows) Close() { r.closed = true }

type rowsDatabase struct {
	*pgxpool.Pool
	rows *failingRows
}

func (d *rowsDatabase) Query(context.Context, string, ...any) (pgx.Rows, error) { return d.rows, nil }

func TestIterationFailureDiscardsPartialResults(t *testing.T) {
	for _, failure := range []error{context.Canceled, errors.New("connection interrupted password=secret")} {
		for _, name := range []string{"outgoing", "incoming", "summary", "incoming summary", "attachments"} {
			t.Run(name+failure.Error(), func(t *testing.T) {
				rows := &failingRows{failure: failure}
				repo := core.NewRepository(&rowsDatabase{rows: rows})
				var result any
				var err error
				switch name {
				case "outgoing":
					r, n, e := repo.FindByRequesterID(context.Background(), "A", nil, 10, 0)
					result, err = r, e
					if n != 0 {
						t.Fatal("partial count")
					}
				case "incoming":
					r, n, e := repo.FindByReceiverID(context.Background(), "A", nil, 10, 0)
					result, err = r, e
					if n != 0 {
						t.Fatal("partial count")
					}
				case "summary":
					result, err = repo.GetSummary(context.Background(), "A")
				case "incoming summary":
					result, err = repo.GetIncomingSummary(context.Background(), "A")
				case "attachments":
					result, err = repo.FindAttachmentsByPartnershipID(context.Background(), "P1")
				}
				if !errors.Is(err, failure) || !reflect.ValueOf(result).IsNil() || rows.scans != 1 || !rows.closed {
					t.Fatalf("result=%v error=%v rows=%+v", result, err, rows)
				}
			})
		}
	}
}

func TestIterationFailureIsSafeAcrossTransports(t *testing.T) {
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"sub": "A", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix()}).SignedString([]byte("secret"))
	if err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct{ operation, path string }{
		{"GetPartnershipApplications", "/partnerships/status"}, {"GetIncomingPartnerships", "/partnerships/incoming"},
		{"GetPartnershipSummary", "/partnerships/summary"}, {"GetIncomingPartnershipSummary", "/partnerships/incoming/summary"},
	} {
		for _, transport := range []string{"REST", "SOAP"} {
			t.Run(tc.operation+transport, func(t *testing.T) {
				rows := &failingRows{failure: errors.New("SQLSTATE private_table password=secret")}
				svc := core.NewService(core.NewRepository(&rowsDatabase{rows: rows}))
				rr := httptest.NewRecorder()
				if transport == "REST" {
					req := httptest.NewRequest("GET", "/api/v1"+tc.path, nil)
					req.Header.Set("Authorization", "Bearer "+token)
					router.NewRouter(rest.NewHandler(svc), "http://localhost", "secret").ServeHTTP(rr, req)
				} else {
					body := `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><p:` + tc.operation + ` xmlns:p="http://umkm-tumbuh.example.com/partnerships"><userId>A</userId><userRole>UMKM</userRole></p:` + tc.operation + `></s:Body></s:Envelope>`
					req := httptest.NewRequest("POST", "/partnership", strings.NewReader(body))
					req.Header.Set("Authorization", "Bearer "+token)
					soap.NewHandlerWithConfig(contracts.NewAdapter(svc), "", soap.HandlerConfig{JWTSecret: "secret"}).ServeHTTP(rr, req)
				}
				if rr.Code != 500 || strings.Contains(rr.Body.String(), "password") || strings.Contains(rr.Body.String(), "SQLSTATE") || rows.scans != 1 {
					t.Fatalf("status=%d body=%s scans=%d", rr.Code, rr.Body.String(), rows.scans)
				}
			})
		}
	}
}
