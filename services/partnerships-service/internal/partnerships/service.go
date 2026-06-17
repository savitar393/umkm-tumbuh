package partnerships

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/apperror"
)

var (
	pgjMu      sync.Mutex
	pgjCounter int
	pgjOnce    sync.Once
)


type Service interface {
	GetPartnershipSummary(
		ctx context.Context,
		userID string,
	) (map[string]int, error)

	CreatePartnership(
		ctx context.Context,
		userID string,
		userRole UserRole,
		req CreatePartnershipRequest,
	) (*PartnershipResponse, error)

	GetPartnershipByID(
		ctx context.Context,
		id string,
	) (*PartnershipResponse, error)

	GetPartnershipsByRequester(
		ctx context.Context,
		requesterID string,
		status *PartnershipStatus,
		page,
		limit int,
	) ([]PartnershipListResponse, int, error)

	GetPartnershipsByReceiver(
		ctx context.Context,
		receiverID string,
		status *PartnershipStatus,
		page,
		limit int,
	) ([]PartnershipListResponse, int, error)

	UpdatePartnershipStatus(
		ctx context.Context,
		id string,
		req UpdatePartnershipStatus,
	) error

	SignPartnership(
		ctx context.Context,
		id string,
		req SignPartnershipRequest,
	) error

	ValidatePartnershipRequest(
		req CreatePartnershipRequest,
	) map[string]string

	GetUMKMList(
		ctx context.Context,
		search string,
		filterType string,
		page, limit int,
	) ([]UMKMListItem, int, error)

	GetMitraList(
		ctx context.Context,
		search string,
		filterType string,
		page, limit int,
	) ([]MitraListItem, int, error)

	GetUMKMDetail(
		ctx context.Context,
		umkmID string,
	) (*UMKMDetail, error)

	GetMitraDetail(
		ctx context.Context,
		mitraID string,
	) (*MitraDetail, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{
		repo: repo,
	}
}

func (s *service) ValidatePartnershipRequest(
	req CreatePartnershipRequest,
) map[string]string {

	errs := make(map[string]string)

	if req.ReceiverID == "" {
		errs["receiver_id"] = "receiver_id wajib diisi"
	}

	if len(req.ProposalTitle) < 10 {
		errs["proposal_title"] = "proposal_title minimal 10 karakter"
	}

	if len(req.ProposalTitle) > 200 {
		errs["proposal_title"] = "proposal_title maksimal 200 karakter"
	}

	if len(req.ProposalDescription) < 30 {
		errs["proposal_description"] = "proposal_description minimal 30 karakter"
	}

	if len(req.ProposalDescription) > 1000 {
		errs["proposal_description"] = "proposal_description maksimal 1000 karakter"
	}

	return errs
}

func (s *service) CreatePartnership(
	ctx context.Context,
	userID string,
	userRole UserRole,
	req CreatePartnershipRequest,
) (*PartnershipResponse, error) {

	requestCode, err := s.repo.GenerateRequestCode(ctx)
	if err != nil {
		return nil, apperror.New(500, "failed to generate request code")
	}

	receiverRole := RoleMitra
	if userRole == RoleMitra {
		receiverRole = RoleUMKM
	}

	// Convert business ID (mitra_id/umkm_id) to akun_id
	receiverAkunID, err := s.repo.FindAkunIDByBusinessID(ctx, req.ReceiverID, receiverRole)
	if err != nil {
		return nil, apperror.New(400, "Penerima tidak ditemukan: "+err.Error())
	}

	// Look up requester's business ID and receiver's business ID for FK constraints
	// These may be empty for API-registered accounts without business profiles
	requesterBusinessID, _ := s.repo.FindBusinessIDByAkunID(ctx, userID, userRole)
	receiverBusinessID := req.ReceiverID

	now := time.Now()

	partnership := &PartnershipRequest{
		ID:                   generatePGJID(ctx, s.repo),
		RequestCode:          requestCode,
		RequesterID:          userID,
		ReceiverID:           receiverAkunID,
		RequesterBusinessID:  requesterBusinessID,
		ReceiverBusinessID:   receiverBusinessID,
		RequesterRole:        userRole,
		ReceiverRole:         receiverRole,
		Category:             "default",
		ProposalTitle:        req.ProposalTitle,
		ProposalDescription:  req.ProposalDescription,
		BusinessName:         "",
		ContactPerson:        "",
		ProductDescription:   "",
		ReasonForPartnership: "",
		NIBKTPFile:           "",
		ProposalFile:         "",
		CertificateFile:      nil,
		Status:               StatusSubmitted,
		SubmittedAt:          &now,
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	if err := s.repo.Create(ctx, partnership); err != nil {
		return nil, apperror.New(
			500,
			"failed to create partnership request: "+err.Error(),
		)
	}

	return s.repo.FindByID(ctx, partnership.ID)
}

func generatePGJID(ctx context.Context, repo Repository) string {
	pgjOnce.Do(func() {
		count, err := repo.CountAll(ctx)
		if err != nil {
			pgjCounter = 0
			return
		}
		pgjCounter = count
	})

	pgjMu.Lock()
	defer pgjMu.Unlock()
	pgjCounter++
	return fmt.Sprintf("PGJ%06d", pgjCounter)
}

func (s *service) GetPartnershipByID(
	ctx context.Context,
	id string,
) (*PartnershipResponse, error) {

	return s.repo.FindByID(ctx, id)
}

func (s *service) GetPartnershipsByRequester(
	ctx context.Context,
	requesterID string,
	status *PartnershipStatus,
	page,
	limit int,
) ([]PartnershipListResponse, int, error) {

	if page < 1 {
		page = 1
	}

	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	return s.repo.FindByRequesterID(
		ctx,
		requesterID,
		status,
		limit,
		offset,
	)
}

func (s *service) GetPartnershipsByReceiver(
	ctx context.Context,
	receiverID string,
	status *PartnershipStatus,
	page,
	limit int,
) ([]PartnershipListResponse, int, error) {

	if page < 1 {
		page = 1
	}

	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	return s.repo.FindByReceiverID(
		ctx,
		receiverID,
		status,
		limit,
		offset,
	)
}

func (s *service) UpdatePartnershipStatus(
	ctx context.Context,
	id string,
	req UpdatePartnershipStatus,
) error {

	status := PartnershipStatus(req.Status)
	now := time.Now()

	err := s.repo.UpdateStatus(
		ctx,
		id,
		status,
		req.RejectionReason,
		now,
	)

	if err != nil {
		return apperror.New(
			500,
			"failed to update partnership status: "+err.Error(),
		)
	}

	return nil
}

func (s *service) SignPartnership(
	ctx context.Context,
	id string,
	req SignPartnershipRequest,
) error {

	if req.DokumenKontrak == "" {
		return apperror.New(
			400,
			"dokumen_kontrak wajib diisi",
		)
	}

	now := time.Now()

	err := s.repo.UpdateContract(
		ctx,
		id,
		req.DokumenKontrak,
		now,
	)

	if err != nil {
		return apperror.New(
			500,
			"failed to sign partnership",
		)
	}

	return nil
}

func (s *service) GetPartnershipSummary(ctx context.Context, userID string) (map[string]int, error) {
	summary, err := s.repo.GetSummary(ctx, userID)
	if err != nil {
		return nil, apperror.New(500, "failed to get partnership summary: "+err.Error())
	}
	return summary, nil
}

// ============================================================
// NEW IMPLEMENTATIONS FOR UMKM AND MITRA LISTS
// ============================================================

// GetUMKMList retrieves a paginated list of UMKM
// This is called by MITRA to see available UMKM for partnership
func (s *service) GetUMKMList(
	ctx context.Context,
	search string,
	filterType string,
	page, limit int,
) ([]UMKMListItem, int, error) {
	// Validate and normalize pagination parameters
	if page < 1 {
		page = 1
	}
	
	if limit < 1 {
		limit = 10
	}
	
	if limit > 100 {
		limit = 100
	}
	
	// Calculate offset for database query
	offset := (page - 1) * limit
	
	// Fetch UMKM list from repository
	umkmList, totalCount, err := s.repo.FindUMKMList(ctx, search, filterType, limit, offset)
	if err != nil {
		return nil, 0, apperror.New(500, "failed to fetch UMKM list: "+err.Error())
	}
	
	return umkmList, totalCount, nil
}

// GetMitraList retrieves a paginated list of Mitra
// This is called by UMKM to see available Mitra for partnership
func (s *service) GetMitraList(
	ctx context.Context,
	search string,
	filterType string,
	page, limit int,
) ([]MitraListItem, int, error) {
	// Validate and normalize pagination parameters
	if page < 1 {
		page = 1
	}
	
	if limit < 1 {
		limit = 10
	}
	
	if limit > 100 {
		limit = 100
	}
	
	// Calculate offset for database query
	offset := (page - 1) * limit
	
	// Fetch Mitra list from repository
	mitraList, totalCount, err := s.repo.FindMitraList(ctx, search, filterType, limit, offset)
	if err != nil {
		return nil, 0, apperror.New(500, "failed to fetch Mitra list: "+err.Error())
	}
	
	return mitraList, totalCount, nil
}

// GetUMKMDetail retrieves full detail of an UMKM
func (s *service) GetUMKMDetail(ctx context.Context, umkmID string) (*UMKMDetail, error) {
	detail, err := s.repo.FindUMKMDetail(ctx, umkmID)
	if err != nil {
		return nil, apperror.New(404, err.Error())
	}
	return detail, nil
}

// GetMitraDetail retrieves full detail of a Mitra
func (s *service) GetMitraDetail(ctx context.Context, mitraID string) (*MitraDetail, error) {
	detail, err := s.repo.FindMitraDetail(ctx, mitraID)
	if err != nil {
		return nil, apperror.New(404, err.Error())
	}
	return detail, nil
}