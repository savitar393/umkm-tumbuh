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
	inactiveMonths, _ := strconv.Atoi(r.URL.Query().Get("inactive_months"))
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	result, err := h.AdminService.ListRegistrations(r.Context(), statusFilter, search, roleFilter, inactiveMonths, page, limit)
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

	var req DeactivateAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid.")
		return
	}

	result, err := h.AdminService.DeactivateAccount(r.Context(), userID, req.Alasan, req.CatatanValidasi)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) RequestReactivation(w http.ResponseWriter, r *http.Request) {
	var req ReactivationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid.")
		return
	}

	result, err := h.AdminService.RequestReactivation(r.Context(), req.Email, req.Password)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) ListReactivationRequests(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	result, err := h.AdminService.ListReactivationRequests(r.Context(), page, limit)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) ReactivateAccount(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}

	userID := chi.URLParam(r, "userID")

	result, err := h.AdminService.ReactivateAccount(r.Context(), userID)
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
		response.ErrorWithCode(w, http.StatusForbidden, "ERR-AUTH-03", "Akses hanya untuk Pemerintah/Admin.")
		return false
	}

	return true
}

func handleError(w http.ResponseWriter, err error) {
	var appErr *apperror.AppError

	if errors.As(err, &appErr) {
		if appErr.Code != "" {
			response.ErrorWithCode(w, appErr.StatusCode, appErr.Code, appErr.Message)
		} else {
			response.Error(w, appErr.StatusCode, appErr.Message)
		}
		return
	}

	response.ErrorWithCode(w, http.StatusInternalServerError, "ERR-SYS-01", "Terjadi kesalahan pada server.")
}
