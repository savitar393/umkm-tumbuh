package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/model"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/service"
)

type AuthHandler struct {
	AuthService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{
		AuthService: authService,
	}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req model.RegisterRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Request body tidak valid.",
		})
		return
	}

	response, err := h.AuthService.Register(r.Context(), req)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, response)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Request body tidak valid.",
		})
		return
	}

	response, err := h.AuthService.Login(r.Context(), req)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func handleServiceError(w http.ResponseWriter, err error) {
	var serviceErr *service.ServiceError

	if errors.As(err, &serviceErr) {
		writeJSON(w, serviceErr.StatusCode, map[string]string{
			"error": serviceErr.Message,
		})
		return
	}

	writeJSON(w, http.StatusInternalServerError, map[string]string{
		"error": "Terjadi kesalahan pada server.",
	})
}
