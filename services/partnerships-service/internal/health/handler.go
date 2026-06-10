package health

import (
	"net/http"

	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/response"
)

type Handler struct {
	// Add dependencies if needed
}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]string{
		"status": "healthy",
	})
}

func (h *Handler) Database(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]string{
		"status": "ok",
	})
}