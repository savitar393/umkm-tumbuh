package health

import (
	"context"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/response"
)

type Handler struct {
	DB *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{DB: db}
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]any{
		"status":  "ok",
		"service": "training-service",
		"time":    time.Now().Format(time.RFC3339),
	})
}

func (h *Handler) Database(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	if err := h.DB.Ping(ctx); err != nil {
		response.Error(w, http.StatusServiceUnavailable, "Database tidak dapat diakses")
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"status":   "ok",
		"database": "connected",
	})
}