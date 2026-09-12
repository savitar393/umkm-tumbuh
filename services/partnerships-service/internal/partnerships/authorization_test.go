package partnerships

import (
	"context"
	"errors"
	"net/http"
	"testing"
	"time"

	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/apperror"
	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/middleware"
)

type permissionRepository struct {
	Repository
	partnership   PartnershipResponse
	ownedDocument bool
	changed       bool
	wantConflict  bool
}

func (r *permissionRepository) FindByID(context.Context, string) (*PartnershipResponse, error) {
	return &r.partnership, nil
}

func (r *permissionRepository) OwnsDocument(context.Context, string, string, bool) (bool, error) {
	return r.ownedDocument, nil
}

func (r *permissionRepository) UpdateStatus(_ context.Context, _ string, actor string, expected, next PartnershipStatus, _ *string, _ time.Time) error {
	if r.wantConflict || expected != r.partnership.Status {
		return apperror.New(http.StatusConflict, "changed concurrently")
	}
	r.changed = true
	r.partnership.Status = next
	return nil
}

func (r *permissionRepository) UpdateContract(_ context.Context, _ string, _ string, _ PartnershipStatus, document string, _ time.Time) error {
	r.changed = true
	r.partnership.ContractDocumentID = &document
	return nil
}

func actorContext(id, role string) context.Context {
	ctx := context.WithValue(context.Background(), middleware.UserIDKey, id)
	return context.WithValue(ctx, middleware.UserRoleKey, role)
}

func requireStatus(t *testing.T, err error, want int) {
	t.Helper()
	if want == 0 {
		if err != nil {
			t.Fatal(err)
		}
		return
	}
	var appErr *apperror.AppError
	if !errors.As(err, &appErr) || appErr.Code != want {
		t.Fatalf("error = %v, want HTTP %d", err, want)
	}
}

func TestPartnershipParticipants(t *testing.T) {
	for _, tc := range []struct {
		id, role string
		want     int
	}{
		{"requester", "UMKM", 0}, {"receiver", "MITRA", 0},
		{"stranger", "UMKM", 403}, {"admin", "ADMIN", 403}, {"", "UMKM", 401},
	} {
		t.Run(tc.id+tc.role, func(t *testing.T) {
			repo := &permissionRepository{partnership: PartnershipResponse{PartnershipRequest: PartnershipRequest{
				ID: "P1", RequesterID: "requester", ReceiverID: "receiver", Status: StatusSubmitted,
			}}}
			_, err := NewService(repo).GetPartnershipByID(actorContext(tc.id, tc.role), "P1")
			requireStatus(t, err, tc.want)
		})
	}
}

func TestPartnershipDecisions(t *testing.T) {
	for _, tc := range []struct {
		name, actor  string
		before, next PartnershipStatus
		want         int
		conflict     bool
	}{
		{"receiver approves", "receiver", StatusSubmitted, StatusActive, 0, false},
		{"receiver rejects", "receiver", StatusReviewed, StatusRejected, 0, false},
		{"requester cancels", "requester", StatusDraft, StatusCancelled, 0, false},
		{"requester cannot approve", "requester", StatusSubmitted, StatusActive, 403, false},
		{"receiver cannot cancel", "receiver", StatusSubmitted, StatusCancelled, 403, false},
		{"stranger cannot reject", "stranger", StatusSubmitted, StatusRejected, 403, false},
		{"active cannot be cancelled", "requester", StatusActive, StatusCancelled, 409, false},
		{"cancelled cannot be approved", "receiver", StatusCancelled, StatusActive, 409, false},
		{"decision cannot be replayed", "receiver", StatusActive, StatusActive, 409, false},
		{"stale decision is rejected", "receiver", StatusSubmitted, StatusActive, 409, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			repo := &permissionRepository{wantConflict: tc.conflict, partnership: PartnershipResponse{PartnershipRequest: PartnershipRequest{
				ID: "P1", RequesterID: "requester", ReceiverID: "receiver", Status: tc.before,
			}}}
			reason := "Tidak sesuai kebutuhan"
			err := NewService(repo).UpdatePartnershipStatus(actorContext(tc.actor, "UMKM"), "P1", UpdatePartnershipStatus{Status: tc.next, RejectionReason: &reason})
			requireStatus(t, err, tc.want)
			if repo.changed != (tc.want == 0) {
				t.Fatal("denied operation changed the partnership")
			}
		})
	}
}

func TestContractSubmission(t *testing.T) {
	for _, tc := range []struct {
		name, actor string
		status      PartnershipStatus
		owned       bool
		want        int
	}{
		{"requester owns document", "requester", StatusSubmitted, true, 0},
		{"receiver cannot submit", "receiver", StatusSubmitted, true, 403},
		{"unrelated account", "stranger", StatusSubmitted, true, 403},
		{"another accounts document", "requester", StatusSubmitted, false, 403},
		{"closed partnership", "requester", StatusCompleted, true, 409},
	} {
		t.Run(tc.name, func(t *testing.T) {
			repo := &permissionRepository{ownedDocument: tc.owned, partnership: PartnershipResponse{PartnershipRequest: PartnershipRequest{
				ID: "P1", RequesterID: "requester", ReceiverID: "receiver", Status: tc.status,
			}}}
			err := NewService(repo).SignPartnership(actorContext(tc.actor, "UMKM"), "P1", SignPartnershipRequest{DokumenKontrak: "D1"})
			requireStatus(t, err, tc.want)
			if repo.changed != (tc.want == 0) {
				t.Fatal("denied operation changed the contract")
			}
		})
	}
}

func TestCreateRejectsForeignAttachmentsBeforeWriting(t *testing.T) {
	repo := &permissionRepository{ownedDocument: false}
	_, err := NewService(repo).CreatePartnership(actorContext("requester", "UMKM"), "requester", RoleUMKM,
		CreatePartnershipRequest{ReceiverID: "business", AttachmentFiles: []string{"foreign-document"}})
	requireStatus(t, err, http.StatusForbidden)
}
