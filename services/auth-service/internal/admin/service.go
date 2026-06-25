package admin

import (
	"context"
	"errors"
	"math"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"

	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/apperror"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/email"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/users"
)

type Service struct {
	UserRepo    *users.Repository
	Client      *Client
	EmailSender *email.Sender
}

func NewService(userRepo *users.Repository) *Service {
	return &Service{
		UserRepo: userRepo,
	}
}

func (s *Service) SetClient(client *Client) {
	s.Client = client
}

func (s *Service) SetEmailSender(sender *email.Sender) {
	s.EmailSender = sender
}

func (s *Service) ListRegistrations(
	ctx context.Context,
	statusFilter string,
	search string,
	roleFilter string,
	page int,
	limit int,
) (*UserListResponse, error) {
	statusFilter = normalizeRegistrationStatusFilter(statusFilter)
	roleFilter = strings.ToUpper(strings.TrimSpace(roleFilter))

	if roleFilter != "" && roleFilter != users.RoleUMKM && roleFilter != users.RoleMitra {
		return nil, apperror.New(http.StatusBadRequest, "Role filter tidak valid.")
	}
	if statusFilter != "" &&
		statusFilter != users.StatusPending &&
		statusFilter != users.StatusApproved &&
		statusFilter != users.StatusRejected {
		return nil, apperror.New(http.StatusBadRequest, "Status filter tidak valid.")
	}

	if roleFilter != "" &&
		roleFilter != users.RoleUMKM &&
		roleFilter != users.RoleMitra {
		return nil, apperror.New(http.StatusBadRequest, "Role filter tidak valid.")
	}

	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	if page < 1 {
		page = 1
	}

	result, err := s.UserRepo.ListRegistrations(ctx, statusFilter, search, roleFilter, page, limit)
	if err != nil {
		return nil, err
	}

	responses := make([]any, 0, len(result.Users))
	for i := range result.Users {
		responses = append(responses, users.ToResponse(&result.Users[i]))
	}

	totalPages := int(math.Ceil(float64(result.TotalCount) / float64(limit)))

	resp := &UserListResponse{
		Status: "success",
	}
	resp.Data.Users = responses
	resp.Data.Pagination.Page = page
	resp.Data.Pagination.Limit = limit
	resp.Data.Pagination.Total = result.TotalCount
	resp.Data.Pagination.TotalPages = totalPages

	return resp, nil
}

func (s *Service) GetStats(ctx context.Context) (*StatsResponse, error) {
	counts, err := s.UserRepo.CountByStatus(ctx)
	if err != nil {
		return nil, err
	}

	resp := &StatsResponse{Status: "success"}
	for _, c := range counts {
		switch c.Status {
		case users.StatusPending:
			resp.Data.Pending = c.Count
		case users.StatusApproved:
			resp.Data.Approved = c.Count
		case users.StatusRejected:
			resp.Data.Rejected = c.Count
		}
		resp.Data.Total += c.Count
	}

	return resp, nil
}

func (s *Service) ApproveRegistration(ctx context.Context, userID string, reviewedBy string, catatanValidasi string) (*MessageResponse, error) {
	var catatan *string
	if catatanValidasi != "" {
		catatan = &catatanValidasi
	}

	user, err := s.UserRepo.UpdateRegistrationStatus(ctx, userID, users.StatusApproved, nil, catatan, reviewedBy)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusNotFound, "Data pendaftaran tidak ditemukan.")
		}
		return nil, err
	}

	s.sendNotification(ctx, email.NotificationData{
		To:       user.Email,
		FullName: user.FullName,
		Subject:  "Pendaftaran UMKM Tumbuh Disetujui",
		Status:   "APPROVED",
	})

	return &MessageResponse{
		Status:  "success",
		Message: "Registrasi disetujui. Akun diaktifkan.",
	}, nil
}

func (s *Service) RejectRegistration(
	ctx context.Context,
	userID string,
	rejectionReason string,
	catatanValidasi string,
	reviewedBy string,
) (*MessageResponse, error) {
	rejectionReason = strings.TrimSpace(rejectionReason)

	if len(rejectionReason) < 3 {
		return nil, apperror.New(http.StatusBadRequest, "Alasan penolakan minimal 3 karakter.")
	}

	catatan := rejectionReason
	if catatanValidasi != "" {
		catatan = catatanValidasi
	}

	user, err := s.UserRepo.UpdateRegistrationStatus(
		ctx,
		userID,
		users.StatusRejected,
		&rejectionReason,
		&catatan,
		reviewedBy,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusNotFound, "Data pendaftaran tidak ditemukan.")
		}
		return nil, err
	}

	reason := ""
	if user.RejectionReason != nil {
		reason = *user.RejectionReason
	}

	s.sendNotification(ctx, email.NotificationData{
		To:              user.Email,
		FullName:        user.FullName,
		Subject:         "Pendaftaran UMKM Tumbuh Belum Disetujui",
		Status:          "REJECTED",
		RejectionReason: reason,
	})

	return &MessageResponse{
		Status:  "success",
		Message: "Registrasi ditolak.",
	}, nil
}

func (s *Service) sendNotification(ctx context.Context, data email.NotificationData) {
	if s.EmailSender == nil {
		return
	}

	go func() {
		if err := s.EmailSender.SendRegistrationNotification(data); err != nil {
			_ = err
		}
	}()
	_ = ctx
}

func (s *Service) DeactivateAccount(ctx context.Context, userID string) (*MessageResponse, error) {
	_, err := s.UserRepo.UpdateAccountStatus(ctx, userID, false)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusNotFound, "Data pengguna tidak ditemukan.")
		}
		return nil, err
	}

	return &MessageResponse{
		Status:  "success",
		Message: "Akun dinonaktifkan.",
	}, nil
}

func (s *Service) GetRegistrationDetail(ctx context.Context, userID string, authorizationHeader string) (*UserDetailResponse, error) {
	user, err := s.UserRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusNotFound, "Data pendaftaran tidak ditemukan.")
		}
		return nil, err
	}

	detail := &users.RegistrationDetailResponse{
		User: users.ToResponse(user),
	}

	if s.Client != nil {
		profile, profileErr := s.Client.GetProfile(ctx, userID, user.Role, authorizationHeader)
		if profileErr == nil {
			detail.Profile = profile
		}

		docs, docsErr := s.Client.GetDocuments(ctx, userID, authorizationHeader)
		if docsErr == nil {
			detail.Documents = docs
			detail.Checklist = s.Client.GetDocumentChecklist(ctx, userID, user.Role, authorizationHeader)
		}
	}

	return &UserDetailResponse{
		Status: "success",
		Data:   detail,
	}, nil
}

func normalizeRegistrationStatusFilter(status string) string {
	status = strings.ToUpper(strings.TrimSpace(status))

	switch status {
	case "", "PENDING":
		return users.StatusPending
	case "ALL":
		return ""
	case "APPROVED":
		return users.StatusApproved
	case "REJECTED":
		return users.StatusRejected
	default:
		return status
	}
}
