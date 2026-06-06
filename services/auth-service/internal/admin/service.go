package admin

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"

	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/apperror"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/users"
)

type Service struct {
	UserRepo *users.Repository
}

func NewService(userRepo *users.Repository) *Service {
	return &Service{
		UserRepo: userRepo,
	}
}

func (s *Service) ListRegistrations(ctx context.Context, statusFilter string) ([]users.Response, error) {
	statusFilter = normalizeRegistrationStatusFilter(statusFilter)

	if statusFilter != "" &&
		statusFilter != users.StatusPending &&
		statusFilter != users.StatusApproved &&
		statusFilter != users.StatusRejected {
		return nil, apperror.New(http.StatusBadRequest, "Status filter tidak valid.")
	}

	result, err := s.UserRepo.ListRegistrations(ctx, statusFilter)
	if err != nil {
		return nil, err
	}

	responses := make([]users.Response, 0, len(result))

	for i := range result {
		responses = append(responses, users.ToResponse(&result[i]))
	}

	return responses, nil
}

func (s *Service) ApproveRegistration(ctx context.Context, userID string) (*users.Response, error) {
	user, err := s.UserRepo.UpdateRegistrationStatus(ctx, userID, users.StatusApproved, nil)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusNotFound, "Data pendaftaran tidak ditemukan.")
		}

		return nil, err
	}

	response := users.ToResponse(user)

	return &response, nil
}

func (s *Service) RejectRegistration(
	ctx context.Context,
	userID string,
	rejectionReason string,
) (*users.Response, error) {
	rejectionReason = strings.TrimSpace(rejectionReason)

	if len(rejectionReason) < 3 {
		return nil, apperror.New(http.StatusBadRequest, "Alasan penolakan minimal 3 karakter.")
	}

	user, err := s.UserRepo.UpdateRegistrationStatus(
		ctx,
		userID,
		users.StatusRejected,
		&rejectionReason,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.New(http.StatusNotFound, "Data pendaftaran tidak ditemukan.")
		}

		return nil, err
	}

	response := users.ToResponse(user)

	return &response, nil
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
