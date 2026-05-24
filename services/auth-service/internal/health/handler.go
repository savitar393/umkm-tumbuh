package health

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/response"
)

type Handler struct {
	DB *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{
		DB: db,
	}
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "auth-service",
	})
}

func (h *Handler) Database(w http.ResponseWriter, r *http.Request) {
	if err := h.DB.Ping(r.Context()); err != nil {
		response.JSON(w, http.StatusServiceUnavailable, map[string]string{
			"status":  "error",
			"message": "database unavailable",
		})
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{
		"status":   "ok",
		"database": "connected",
	})
}
