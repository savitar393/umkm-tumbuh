package admin

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/apperror"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/auth"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/response"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/users"
)

type Handler struct {
	AdminService *Service
	AuthService  *auth.Service
}

func NewHandler(adminService *Service, authService *auth.Service) *Handler {
	return &Handler{
		AdminService: adminService,
		AuthService:  authService,
	}
}

func (h *Handler) ListRegistrations(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}

	statusFilter := r.URL.Query().Get("status")

	result, err := h.AdminService.ListRegistrations(r.Context(), statusFilter)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) ApproveRegistration(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}

	userID := chi.URLParam(r, "userID")

	result, err := h.AdminService.ApproveRegistration(r.Context(), userID)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) RejectRegistration(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}

	userID := chi.URLParam(r, "userID")

	var req RejectRegistrationRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid.")
		return
	}

	result, err := h.AdminService.RejectRegistration(
		r.Context(),
		userID,
		req.RejectionReason,
	)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, result)
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

	log.Printf("internal admin error: %v", err)
	response.Error(w, http.StatusInternalServerError, "Terjadi kesalahan pada server.")
}
