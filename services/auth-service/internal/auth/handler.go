package auth

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/apperror"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/response"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/users"
)

type Handler struct {
	AuthService *Service
}

func NewHandler(authService *Service) *Handler {
	return &Handler{
		AuthService: authService,
	}
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid.")
		return
	}

	result, err := h.AuthService.Register(r.Context(), req)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusCreated, result)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid.")
		return
	}

	result, err := h.AuthService.Login(r.Context(), req)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	user, err := h.AuthService.CurrentUserFromHeader(
		r.Context(),
		r.Header.Get("Authorization"),
	)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, users.ToResponse(user))
}

func handleError(w http.ResponseWriter, err error) {
	var appErr *apperror.AppError

	if errors.As(err, &appErr) {
		response.Error(w, appErr.StatusCode, appErr.Message)
		return
	}

	log.Printf("internal auth error: %v", err)
	response.Error(w, http.StatusInternalServerError, "Terjadi kesalahan pada server.")
}

func (h *Handler) RequestEmailVerification(w http.ResponseWriter, r *http.Request) {
	var req RequestEmailVerificationRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid.")
		return
	}

	result, err := h.AuthService.RequestEmailVerification(r.Context(), req)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) ConfirmEmailVerification(w http.ResponseWriter, r *http.Request) {
	var req ConfirmEmailVerificationRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid.")
		return
	}

	result, err := h.AuthService.ConfirmEmailVerification(r.Context(), req)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, result)
}