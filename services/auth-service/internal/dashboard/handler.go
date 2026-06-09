package dashboard

import (
	"errors"
	"log"
	"net/http"

	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/apperror"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/auth"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/response"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/users"
)

type Handler struct {
	DashboardService *Service
	AuthService      *auth.Service
}

func NewHandler(dashboardService *Service, authService *auth.Service) *Handler {
	return &Handler{
		DashboardService: dashboardService,
		AuthService:      authService,
	}
}

func (h *Handler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}

	data, err := h.DashboardService.GetDashboard(r.Context())
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, data)
}

func (h *Handler) requireAdmin(w http.ResponseWriter, r *http.Request) bool {
	currentUser, err := h.AuthService.CurrentUserFromHeader(
		r.Context(),
		r.Header.Get("Authorization"),
	)
	if err != nil {
		handleError(w, err)
		return false
	}

	if currentUser.Role != users.RoleAdmin {
		response.Error(w, http.StatusForbidden, "Akses hanya untuk Pemerintah/Admin.")
		return false
	}

	return true
}

func handleError(w http.ResponseWriter, err error) {
	var appErr *apperror.AppError

	if errors.As(err, &appErr) {
		response.Error(w, appErr.StatusCode, appErr.Message)
		return
	}

	log.Printf("internal dashboard error: %v", err)
	response.Error(w, http.StatusInternalServerError, "Terjadi kesalahan pada server.")
}
