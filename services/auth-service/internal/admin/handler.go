package admin

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

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

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}

	statusFilter := r.URL.Query().Get("status")
	search := r.URL.Query().Get("search")
	roleFilter := r.URL.Query().Get("role")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	result, err := h.AdminService.ListRegistrations(r.Context(), statusFilter, search, roleFilter, page, limit)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) GetUsersStats(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}

	result, err := h.AdminService.GetStats(r.Context())
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) ApproveUser(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}

	currentUser, _ := h.AuthService.CurrentUserFromHeader(
		r.Context(),
		r.Header.Get("Authorization"),
	)

	userID := chi.URLParam(r, "userID")

	var req ApproveRegistrationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req = ApproveRegistrationRequest{}
	}

	reviewedBy := ""
	if currentUser != nil {
		reviewedBy = currentUser.ID
	}

	result, err := h.AdminService.ApproveRegistration(r.Context(), userID, reviewedBy, req.CatatanValidasi)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) GetUserDetail(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}

	userID := chi.URLParam(r, "userID")
	result, err := h.AdminService.GetRegistrationDetail(r.Context(), userID)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) RejectUser(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}

	currentUser, _ := h.AuthService.CurrentUserFromHeader(
		r.Context(),
		r.Header.Get("Authorization"),
	)

	userID := chi.URLParam(r, "userID")

	var req RejectRegistrationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid.")
		return
	}

	reviewedBy := ""
	if currentUser != nil {
		reviewedBy = currentUser.ID
	}

	result, err := h.AdminService.RejectRegistration(
		r.Context(),
		userID,
		req.RejectionReason,
		req.CatatanValidasi,
		reviewedBy,
	)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) DeactivateAccount(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}

	userID := chi.URLParam(r, "userID")
	result, err := h.AdminService.DeactivateAccount(r.Context(), userID)
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

	response.Error(w, http.StatusInternalServerError, "Terjadi kesalahan pada server.")
}
