package trainings

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

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

func (h *Handler) GetAllTrainings(w http.ResponseWriter, r *http.Request) {
	trainings, err := h.Service.GetAllTrainings(r.Context())
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"trainings": trainings,
	})
}

func (h *Handler) GetTrainingByID(w http.ResponseWriter, r *http.Request) {
	pelatihanID := chi.URLParam(r, "id")
	if pelatihanID == "" {
		response.Error(w, http.StatusBadRequest, "ID Pelatihan tidak valid")
		return
	}

	training, err := h.Service.GetTrainingByID(r.Context(), pelatihanID)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, training)
}

func (h *Handler) GetTrainingDetail(w http.ResponseWriter, r *http.Request) {
	pelatihanID := chi.URLParam(r, "id")
	if pelatihanID == "" {
		response.Error(w, http.StatusBadRequest, "ID Pelatihan tidak valid")
		return
	}

	detail, err := h.Service.GetTrainingDetail(r.Context(), pelatihanID)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, detail)
}

func (h *Handler) EnrollUser(w http.ResponseWriter, r *http.Request) {
	var req EnrollRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid")
		return
	}

	enrollment, err := h.Service.EnrollUser(r.Context(), req)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusCreated, map[string]any{
		"message":    "Berhasil mendaftar pelatihan",
		"enrollment": enrollment,
	})
}

func (h *Handler) GetUserEnrollments(w http.ResponseWriter, r *http.Request) {
	umkmID := chi.URLParam(r, "umkmID")
	if umkmID == "" {
		response.Error(w, http.StatusBadRequest, "UMKM ID tidak valid")
		return
	}

	enrollments, err := h.Service.GetUserEnrollments(r.Context(), umkmID)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"enrollments": enrollments,
	})
}

// UpdateProgress - update progress modul user dalam pelatihan
func (h *Handler) UpdateProgress(w http.ResponseWriter, r *http.Request) {
	var req UpdateProgressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid")
		return
	}

	if err := h.Service.UpdateProgress(r.Context(), req); err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"message": "Progress berhasil diperbarui",
	})
}

// CompleteTraining - tandai pelatihan selesai
func (h *Handler) CompleteTraining(w http.ResponseWriter, r *http.Request) {
	var req CompleteTrainingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid")
		return
	}

	if err := h.Service.CompleteTraining(r.Context(), req.PendaftaranID); err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"message": "Pelatihan berhasil diselesaikan",
	})
}

func handleError(w http.ResponseWriter, err error) {
	var appErr *apperror.AppError

	if errors.As(err, &appErr) {
		response.Error(w, appErr.StatusCode, appErr.Message)
		return
	}

	log.Printf("internal training error: %v", err)
	response.Error(w, http.StatusInternalServerError, "Terjadi kesalahan pada server")
}