package trainings

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/response"
)

// AdminHandler handles admin-only training management endpoints
type AdminHandler struct {
	Service *Service
}

func NewAdminHandler(service *Service) *AdminHandler {
	return &AdminHandler{Service: service}
}

// GetAllTrainingsAdmin returns all trainings with pagination and filters
func (h *AdminHandler) GetAllTrainingsAdmin(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 {
		limit = 10
	}

	status := r.URL.Query().Get("status")
	search := r.URL.Query().Get("search")
	sortBy := r.URL.Query().Get("sort_by")
	if sortBy == "" {
		sortBy = "created_at"
	}
	sortOrder := r.URL.Query().Get("sort_order")
	if sortOrder == "" {
		sortOrder = "desc"
	}

	filters := TrainingFilters{
		Page:      page,
		Limit:     limit,
		Status:    status,
		Search:    search,
		SortBy:    sortBy,
		SortOrder: sortOrder,
	}

	trainings, total, err := h.Service.GetAllTrainingsAdmin(r.Context(), filters)
	if err != nil {
		handleError(w, err)
		return
	}

	totalPages := (total + limit - 1) / limit

	response.JSON(w, http.StatusOK, map[string]any{
		"trainings": trainings,
		"pagination": map[string]any{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": totalPages,
		},
	})
}

// GetTrainingDetailAdmin gets a single training detail for admin
func (h *AdminHandler) GetTrainingDetailAdmin(w http.ResponseWriter, r *http.Request) {
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

// CreateTraining creates a new training program
func (h *AdminHandler) CreateTraining(w http.ResponseWriter, r *http.Request) {
	var req CreateTrainingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid")
		return
	}

	training, err := h.Service.CreateTraining(r.Context(), req)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusCreated, map[string]any{
		"message":  "Pelatihan berhasil dibuat",
		"training": training,
	})
}

// UpdateTraining updates an existing training
func (h *AdminHandler) UpdateTraining(w http.ResponseWriter, r *http.Request) {
	pelatihanID := chi.URLParam(r, "id")
	if pelatihanID == "" {
		response.Error(w, http.StatusBadRequest, "ID Pelatihan tidak valid")
		return
	}

	var req UpdateTrainingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid")
		return
	}

	training, err := h.Service.UpdateTraining(r.Context(), pelatihanID, req)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"message":  "Pelatihan berhasil diperbarui",
		"training": training,
	})
}

// DeleteTraining soft deletes a training
func (h *AdminHandler) DeleteTraining(w http.ResponseWriter, r *http.Request) {
	pelatihanID := chi.URLParam(r, "id")
	if pelatihanID == "" {
		response.Error(w, http.StatusBadRequest, "ID Pelatihan tidak valid")
		return
	}

	if err := h.Service.DeleteTraining(r.Context(), pelatihanID); err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"message": "Pelatihan berhasil dihapus",
	})
}

// UpdateTrainingStatus updates training status (DRAFT, PUBLISHED, ARCHIVED, etc.)
func (h *AdminHandler) UpdateTrainingStatus(w http.ResponseWriter, r *http.Request) {
	pelatihanID := chi.URLParam(r, "id")
	if pelatihanID == "" {
		response.Error(w, http.StatusBadRequest, "ID Pelatihan tidak valid")
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid")
		return
	}

	if err := h.Service.UpdateTrainingStatus(r.Context(), pelatihanID, req.Status); err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"message": "Status pelatihan berhasil diperbarui",
	})
}

// GetTrainingStats returns statistics for admin dashboard
func (h *AdminHandler) GetTrainingStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.Service.GetTrainingStats(r.Context())
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, stats)
}
