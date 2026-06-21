package admin

import (
	"context"
	"errors"
	"math"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"

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
	inactiveMonths int,
	page int,
	limit int,
) (*UserListResponse, error) {
	statusFilter = strings.ToUpper(strings.TrimSpace(statusFilter))
	roleFilter = strings.ToUpper(strings.TrimSpace(roleFilter))

	if statusFilter == "" || statusFilter == "ALL" {
		statusFilter = ""
	}

	if statusFilter != "" &&
		statusFilter != users.StatusPending &&
		statusFilter != users.StatusApproved &&
		statusFilter != users.StatusRejected {
		return nil, apperror.New(http.StatusBadRequest, "ERR-VAL-01", "Status filter tidak valid.")
	}

	if roleFilter != "" &&
		roleFilter != users.RoleUMKM &&
		roleFilter != users.RoleMitra {
		return nil, apperror.New(http.StatusBadRequest, "ERR-VAL-01", "Role filter tidak valid.")
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

	result, err := s.UserRepo.ListRegistrations(ctx, statusFilter, search, roleFilter, inactiveMonths, page, limit)
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

	reactivationCount, err := s.UserRepo.CountReactivationRequests(ctx)
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
	resp.Data.ReactivationRequested = reactivationCount

	return resp, nil
}

func (s *Service) ListReactivationRequests(ctx context.Context, page int, limit int) (*UserListResponse, error) {
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	if page < 1 {
		page = 1
	}

	result, err := s.UserRepo.ListReactivationRequests(ctx, page, limit)
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

func (s *Service) RequestReactivation(ctx context.Context, email string, password string) (*MessageResponse, error) {
	user, err := s.UserRepo.FindByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusUnauthorized, "ERR-AUTH-02", "Email atau password tidak valid.")
		}
		return nil, err
	}

	if user.IsActive {
		return nil, apperror.New(http.StatusBadRequest, "ERR-VAL-01", "Akun sudah aktif.")
	}

	if user.Status != users.StatusApproved {
		return nil, apperror.New(http.StatusBadRequest, "ERR-VAL-01", "Akun yang dinonaktifkan hanya yang berstatus APPROVED.")
	}

	if user.ReactivationRequestedAt != nil {
		return nil, apperror.New(http.StatusBadRequest, "ERR-VAL-01", "Permintaan aktivasi sudah diajukan. Silakan tunggu konfirmasi Admin.")
	}

	if err := s.authCheckPassword(user.PasswordHash, password); err != nil {
		return nil, apperror.New(http.StatusUnauthorized, "ERR-AUTH-02", "Email atau password tidak valid.")
	}

	if err := s.UserRepo.RequestReactivation(ctx, user.ID); err != nil {
		return nil, apperror.NewInternal("Gagal mengajukan permintaan aktivasi.")
	}

	return &MessageResponse{
		Status:  "success",
		Message: "Permintaan aktivasi akun berhasil diajukan. Silakan tunggu konfirmasi Admin.",
	}, nil
}

func (s *Service) ReactivateAccount(ctx context.Context, userID string) (*MessageResponse, error) {
	user, err := s.UserRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusNotFound, "ERR-DATA-02", "Data pengguna tidak ditemukan.")
		}
		return nil, apperror.NewInternal("Gagal mengambil data pengguna.")
	}

	if user.IsActive {
		return nil, apperror.New(http.StatusBadRequest, "ERR-VAL-01", "Akun sudah aktif.")
	}

	if user.ReactivationRequestedAt == nil {
		return nil, apperror.New(http.StatusBadRequest, "ERR-VAL-01", "Tidak ada permintaan aktivasi untuk akun ini.")
	}

	if err := s.UserRepo.ReactivateAccount(ctx, userID); err != nil {
		return nil, apperror.NewInternal("Gagal mengaktifkan akun.")
	}

	return &MessageResponse{
		Status:  "success",
		Message: "Akun berhasil diaktifkan kembali.",
	}, nil
}

func (s *Service) authCheckPassword(hash string, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

func (s *Service) ApproveRegistration(ctx context.Context, userID string, reviewedBy string, catatanValidasi string) (*MessageResponse, error) {
	var catatan *string
	if catatanValidasi != "" {
		catatan = &catatanValidasi
	}

	user, err := s.UserRepo.UpdateRegistrationStatus(ctx, userID, users.StatusApproved, nil, catatan, reviewedBy)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusNotFound, "ERR-DATA-02", "Data pendaftaran tidak ditemukan.")
		}
		return nil, apperror.NewInternal("Gagal memperbarui status pendaftaran.")
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
		return nil, apperror.New(http.StatusBadRequest, "ERR-VAL-02", "Alasan penolakan minimal 3 karakter.")
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
			return nil, apperror.New(http.StatusNotFound, "ERR-DATA-02", "Data pendaftaran tidak ditemukan.")
		}
		return nil, apperror.NewInternal("Gagal memperbarui status pendaftaran.")
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

func (s *Service) DeactivateAccount(ctx context.Context, userID string, alasan string, catatanValidasi string) (*MessageResponse, error) {
	alasan = strings.TrimSpace(alasan)
	if len(alasan) < 3 {
		return nil, apperror.New(http.StatusBadRequest, "ERR-VAL-02", "Alasan penonaktifan minimal 3 karakter.")
	}

	user, err := s.UserRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusNotFound, "ERR-DATA-02", "Data pengguna tidak ditemukan.")
		}
		return nil, apperror.NewInternal("Gagal mengambil data pengguna.")
	}

	if user.Role == users.RoleAdmin {
		return nil, apperror.New(http.StatusForbidden, "ERR-AUTH-03", "Tidak dapat menonaktifkan akun Admin.")
	}

	if user.Status != users.StatusApproved {
		return nil, apperror.New(http.StatusBadRequest, "ERR-VAL-01", "Hanya akun dengan status APPROVED yang dapat dinonaktifkan.")
	}

	if !user.IsActive {
		return nil, apperror.New(http.StatusBadRequest, "ERR-VAL-01", "Akun sudah dalam status tidak aktif.")
	}

	catatan := alasan
	if catatanValidasi != "" {
		catatan = catatanValidasi
	}

	_, err = s.UserRepo.DeactivateAccountWithReason(ctx, userID, alasan, catatan)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusNotFound, "ERR-DATA-02", "Data pengguna tidak ditemukan atau sudah tidak aktif.")
		}
		return nil, apperror.NewInternal("Gagal menonaktifkan akun.")
	}

	return &MessageResponse{
		Status:  "success",
		Message: "Akun berhasil dinonaktifkan.",
	}, nil
}

func (s *Service) GetRegistrationDetail(ctx context.Context, userID string) (*UserDetailResponse, error) {
	user, err := s.UserRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusNotFound, "ERR-DATA-02", "Data pendaftaran tidak ditemukan.")
		}
		return nil, apperror.NewInternal("Gagal mengambil detail pendaftaran.")
	}

	detail := &users.RegistrationDetailResponse{
		User: users.ToResponse(user),
	}

	if s.Client != nil {
		profile, profileErr := s.Client.GetProfile(ctx, userID, user.Role)
		if profileErr == nil {
			detail.Profile = profile
		}

		docs, docsErr := s.Client.GetDocuments(ctx, userID)
		if docsErr == nil {
			detail.Documents = docs
			detail.Checklist = s.Client.GetDocumentChecklist(ctx, userID, user.Role)
		}
	}

	return &UserDetailResponse{
		Status: "success",
		Data:   detail,
	}, nil
}
