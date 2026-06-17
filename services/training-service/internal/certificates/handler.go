package certificates

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/apperror"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/response"
)

type Handler struct {
	Service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{Service: service}
}

func (h *Handler) GetUserDashboard(w http.ResponseWriter, r *http.Request) {
	umkmID := chi.URLParam(r, "umkmID")
	if umkmID == "" {
		response.Error(w, http.StatusBadRequest, "UMKM ID tidak valid")
		return
	}

	dashboard, err := h.Service.GetUserDashboard(r.Context(), umkmID)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, dashboard)
}

func (h *Handler) GetUserCertificates(w http.ResponseWriter, r *http.Request) {
	umkmID := chi.URLParam(r, "umkmID")
	if umkmID == "" {
		response.Error(w, http.StatusBadRequest, "UMKM ID tidak valid")
		return
	}

	certificates, err := h.Service.GetUserCertificates(r.Context(), umkmID)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"certificates": certificates,
	})
}

func (h *Handler) GetCertificateByID(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	sertifikatID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID Sertifikat tidak valid")
		return
	}

	cert, err := h.Service.GetCertificateByID(r.Context(), sertifikatID)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, cert)
}

func (h *Handler) RequestCertificate(w http.ResponseWriter, r *http.Request) {
	var req RequestCertificateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid")
		return
	}

	result, err := h.Service.RequestCertificate(r.Context(), req)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusCreated, result)
}

func handleError(w http.ResponseWriter, err error) {
	var appErr *apperror.AppError

	if errors.As(err, &appErr) {
		response.Error(w, appErr.StatusCode, appErr.Message)
		return
	}

	log.Printf("internal certificate error: %v", err)
	response.Error(w, http.StatusInternalServerError, "Terjadi kesalahan pada server")
}
