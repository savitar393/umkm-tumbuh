package partnerships

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"testing"

	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/apperror"
	core "github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/partnerships"
)

type captureService struct {
	core.Service
	request core.CreatePartnershipRequest
	err     error
	calls   int
}

func (s *captureService) CreatePartnership(_ context.Context, _ string, _ core.UserRole, r core.CreatePartnershipRequest) (*core.PartnershipResponse, error) {
	s.calls++
	s.request = r
	return &core.PartnershipResponse{}, nil
}
func (s *captureService) GetPartnershipByID(context.Context, string) (*core.PartnershipResponse, error) {
	return nil, s.err
}
func (s *captureService) ValidatePartnershipRequest(r core.CreatePartnershipRequest) map[string]string {
	return core.NewService(nil).ValidatePartnershipRequest(r)
}
func TestSOAPCreateValidation(t *testing.T) {
	for _, tc := range []struct{ title, description string }{
		{strings.Repeat(" ", 20), strings.Repeat("d", 40)},
		{strings.Repeat("t", 20), strings.Repeat(" \t", 30)},
		{"  short  ", strings.Repeat("d", 40)},
	} {
		s := &captureService{}
		_, err := NewAdapter(s).CreatePartnershipApplication(context.Background(), &CreatePartnershipApplicationRequest{ReceiverID: "R", ProposalTitle: tc.title, ProposalDescription: tc.description})
		if err == nil || s.calls != 0 {
			t.Fatalf("invalid SOAP input reached service: %v", err)
		}
	}
}
func TestSOAPDetailHidesExistence(t *testing.T) {
	for _, code := range []int{http.StatusForbidden, http.StatusNotFound} {
		s := &captureService{err: apperror.New(code, "sensitive distinction")}
		_, err := NewAdapter(s).GetPartnershipApplication(context.Background(), &GetPartnershipApplicationRequest{ApplicationID: "P1"})
		var app *apperror.AppError
		if !errors.As(err, &app) || app.Code != 404 || app.Message != "Pengajuan kemitraan tidak ditemukan" {
			t.Fatalf("error=%v", err)
		}
	}
}
func TestSOAPRejectsUnknownFilters(t *testing.T) {
	a := NewAdapter(nil)
	for _, filter := range []string{"UNKNOWN", " ", "aktif"} {
		_, err := a.GetPartnershipApplications(context.Background(), &GetPartnershipApplicationsRequest{Status: filter})
		if err == nil {
			t.Fatal("unknown filter accepted")
		}
		_, err = a.GetIncomingPartnerships(context.Background(), &GetIncomingPartnershipsRequest{Status: filter})
		if err == nil {
			t.Fatal("unknown incoming filter accepted")
		}
	}
}

func TestSOAPPreservesOriginalValuesAfterTrimmedValidation(t *testing.T) {
	s := &captureService{}
	title := "  " + strings.Repeat("T", 200) + "  "
	description := "\t" + strings.Repeat("D", 1000) + "\t"
	_, err := NewAdapter(s).CreatePartnershipApplication(context.Background(), &CreatePartnershipApplicationRequest{
		UserID: "A", UserRole: "UMKM", ReceiverID: "R", ProposalTitle: title, ProposalDescription: description,
	})
	if err != nil || s.request.ProposalText == nil || *s.request.ProposalText != title+"\n\n"+description {
		t.Fatalf("proposal content lost: %v", err)
	}
	if len(s.request.ProposalTitle) != 200 || len(s.request.ProposalDescription) != 1000 {
		t.Fatal("individual validation limits changed")
	}
}
