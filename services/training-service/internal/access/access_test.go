package access

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/apperror"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/middleware"
)

type ownershipDB struct {
	owned bool
	err   error
	calls int
}

func (db *ownershipDB) QueryRow(context.Context, string, ...any) pgx.Row {
	db.calls++
	return db
}

func (db *ownershipDB) Scan(dest ...any) error {
	if db.err != nil {
		return db.err
	}
	*(dest[0].(*bool)) = db.owned
	return nil
}

func TestOwnershipPolicy(t *testing.T) {
	for _, resource := range []string{"business", "enrollment", "certificate", "document"} {
		for _, tc := range []struct {
			name, id, role    string
			owned, allowAdmin bool
			want, queries     int
		}{
			{"anonymous", "", "", false, true, 401, 0},
			{"owner", "account-a", "UMKM", true, false, 0, 1},
			{"different owner or missing record", "account-b", "UMKM", false, false, 403, 1},
			{"mitra", "mitra", "MITRA", true, true, 403, 0},
			{"admin cannot act as learner", "admin", "ADMIN", false, false, 403, 0},
			{"admin read", "admin", "ADMIN", false, true, 0, 0},
		} {
			if resource == "document" && tc.name == "admin read" {
				continue
			}
			t.Run(resource+"/"+tc.name, func(t *testing.T) {
				ctx := context.WithValue(context.Background(), middleware.UserIDKey, tc.id)
				ctx = context.WithValue(ctx, middleware.UserRoleKey, tc.role)
				db := &ownershipDB{owned: tc.owned}
				a := New(db)
				var err error
				switch resource {
				case "business":
					err = a.UMKM(ctx, "business-a", tc.allowAdmin)
				case "enrollment":
					err = a.Enrollment(ctx, "enrollment-a", tc.allowAdmin)
				case "certificate":
					err = a.Certificate(ctx, 1, tc.allowAdmin)
				case "document":
					err = a.Document(ctx, "document-a")
				}
				if tc.want == 0 {
					if err != nil {
						t.Fatal(err)
					}
				} else {
					var appErr *apperror.AppError
					if !errors.As(err, &appErr) || appErr.StatusCode != tc.want {
						t.Fatalf("error = %v, want HTTP %d", err, tc.want)
					}
				}
				if db.calls != tc.queries {
					t.Fatalf("queries = %d, want %d", db.calls, tc.queries)
				}
			})
		}
	}
}

func TestOwnershipDatabaseFailureDoesNotGrantAccess(t *testing.T) {
	ctx := context.WithValue(context.Background(), middleware.UserIDKey, "account-a")
	ctx = context.WithValue(ctx, middleware.UserRoleKey, "UMKM")
	unavailable := errors.New("database unavailable")
	a := New(&ownershipDB{err: unavailable})
	if err := a.Enrollment(ctx, "enrollment-a", false); !errors.Is(err, unavailable) {
		t.Fatalf("error = %v, want database failure", err)
	}
}
