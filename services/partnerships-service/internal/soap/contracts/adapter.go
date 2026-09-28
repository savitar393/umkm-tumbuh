package partnerships

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/apperror"
	core "github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/partnerships"
)

// Adapter hanya memetakan kontrak XML; semua aturan bisnis ada pada core.Service.
type Adapter struct{ service core.Service }

func NewAdapter(service core.Service) *Adapter { return &Adapter{service: service} }

func (a *Adapter) CreatePartnershipApplication(ctx context.Context, r *CreatePartnershipApplicationRequest) (*CreateResult, error) {
	// SOAP lama menyimpan kedua nilai asli sebagai satu proposalText dalam kolom TEXT.
	// Validasi tetap memakai batas masing-masing input, bukan panjang gabungannya.
	proposalText := r.ProposalTitle + "\n\n" + r.ProposalDescription
	request := core.CreatePartnershipRequest{
		ReceiverID: strings.TrimSpace(r.ReceiverID), ProposalTitle: strings.TrimSpace(r.ProposalTitle),
		ProposalDescription: strings.TrimSpace(r.ProposalDescription), ProposalText: &proposalText,
	}
	if validation := a.service.ValidatePartnershipRequest(request); len(validation) > 0 {
		return nil, apperror.New(http.StatusBadRequest, "Request pengajuan kemitraan tidak valid")
	}
	p, err := a.service.CreatePartnership(ctx, r.UserID, core.UserRole(r.UserRole), request)
	if err != nil {
		return nil, err
	}
	return &CreateResult{ApplicationID: p.ID, RequestCode: p.RequestCode, Status: string(p.Status)}, nil
}
func (a *Adapter) GetPartnershipApplication(ctx context.Context, r *GetPartnershipApplicationRequest) (*PartnershipRow, error) {
	if err := applicationID(r.ApplicationID); err != nil {
		return nil, err
	}
	p, err := a.service.GetPartnershipByID(ctx, r.ApplicationID)
	if err != nil {
		var app *apperror.AppError
		if errors.As(err, &app) && (app.Code == http.StatusForbidden || app.Code == http.StatusNotFound) {
			return nil, apperror.New(http.StatusNotFound, "Pengajuan kemitraan tidak ditemukan")
		}
		return nil, err
	}
	return &PartnershipRow{ID: p.ID, RequestCode: p.RequestCode, RequesterID: p.RequesterID, ReceiverID: p.ReceiverID,
		Status: p.Status, ProposalText: p.ProposalDescription, RejectionReason: p.RejectionReason, ContractDocumentID: p.ContractDocumentID,
		RequesterName: p.RequesterName, ReceiverName: p.ReceiverName, SubmittedAt: p.SubmittedAt, DecidedAt: p.DecidedAt, CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt}, nil
}
func (a *Adapter) GetPartnershipApplications(ctx context.Context, r *GetPartnershipApplicationsRequest) (*GetPartnershipApplicationsResult, error) {
	status, err := statusFilter(r.Status)
	if err != nil {
		return nil, err
	}
	rows, total, err := a.service.GetPartnershipsByRequester(ctx, r.UserID, status, r.Page, r.Limit)
	if err != nil {
		return nil, err
	}
	return listResult(rows, total), nil
}
func (a *Adapter) GetIncomingPartnerships(ctx context.Context, r *GetIncomingPartnershipsRequest) (*GetIncomingPartnershipsResult, error) {
	status, err := statusFilter(r.Status)
	if err != nil {
		return nil, err
	}
	rows, total, err := a.service.GetPartnershipsByReceiver(ctx, r.UserID, status, r.Page, r.Limit)
	if err != nil {
		return nil, err
	}
	return listResult(rows, total), nil
}
func statusFilter(s string) (*core.PartnershipStatus, error) {
	if s == "" {
		return nil, nil
	}
	v := core.PartnershipStatus(s)
	switch v {
	case core.StatusDraft, core.StatusSubmitted, core.StatusReviewed, core.StatusActive, core.StatusRejected, core.StatusCancelled, core.StatusWaitingDoc, core.StatusCompleted:
		return &v, nil
	default:
		return nil, apperror.New(http.StatusBadRequest, "status tidak valid")
	}
}
func listResult(rows []core.PartnershipListResponse, total int) *GetPartnershipApplicationsResult {
	result := &GetPartnershipApplicationsResult{TotalCount: total, Applications: make([]PartnershipListRow, 0, len(rows))}
	for _, p := range rows {
		result.Applications = append(result.Applications, PartnershipListRow{
			ID: p.ID, RequestCode: p.RequestCode, RequesterName: p.RequesterName, ReceiverName: p.ReceiverName,
			RequesterBusinessName: p.RequesterBusinessName, ReceiverBusinessName: p.ReceiverBusinessName, ProposalTitle: p.ProposalTitle,
			Status: p.Status, SubmittedAt: p.SubmittedAt, DecidedAt: p.DecidedAt,
		})
	}
	return result
}
func (a *Adapter) UpdatePartnershipStatus(ctx context.Context, r *UpdatePartnershipStatusRequest) error {
	if err := applicationID(r.ApplicationID); err != nil {
		return err
	}
	var reason *string
	if r.RejectionReason != "" {
		reason = &r.RejectionReason
	}
	return a.service.UpdatePartnershipStatus(ctx, r.ApplicationID, core.UpdatePartnershipStatus{Status: core.PartnershipStatus(r.Status), RejectionReason: reason})
}
func (a *Adapter) MarkPartnershipAsRead(ctx context.Context, r *MarkPartnershipAsReadRequest) error {
	if err := applicationID(r.ApplicationID); err != nil {
		return err
	}
	return a.service.MarkPartnershipAsRead(ctx, r.ApplicationID)
}
func (a *Adapter) SignPartnership(ctx context.Context, r *SignPartnershipRequest) error {
	if err := applicationID(r.ApplicationID); err != nil {
		return err
	}
	return a.service.SignPartnership(ctx, r.ApplicationID, core.SignPartnershipRequest{DokumenKontrak: r.DocumentID})
}
func (a *Adapter) GetPartnershipSummary(ctx context.Context, r *GetPartnershipSummaryRequest) (map[string]int, error) {
	return a.service.GetPartnershipSummary(ctx, r.UserID)
}
func (a *Adapter) GetIncomingPartnershipSummary(ctx context.Context, r *GetIncomingPartnershipSummaryRequest) (map[string]int, error) {
	return a.service.GetIncomingPartnershipSummary(ctx, r.UserID)
}
func applicationID(id string) error {
	if strings.TrimSpace(id) == "" {
		return apperror.New(http.StatusBadRequest, "applicationId wajib diisi")
	}
	return nil
}
