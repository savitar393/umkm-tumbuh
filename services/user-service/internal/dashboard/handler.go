package dashboard

import (
	"net/http"

	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/middleware"
)

type Handler struct {
	Service *Service
}

func NewHandlerWithService(svc *Service) *Handler {
	return &Handler{Service: svc}
}

// GetUMKMDashboard — GET /api/v1/dashboard/umkm?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
func (h *Handler) GetUMKMDashboard(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	if user.Role != "UMKM" {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "Hanya untuk role UMKM"})
		return
	}

	dateFrom := r.URL.Query().Get("date_from")
	dateTo := r.URL.Query().Get("date_to")

	// ✅ TAMBAHKAN VALIDASI INI
	if dateFrom == "" || dateTo == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "date_from and date_to are required"})
		return
	}

	data, err := h.Service.GetUMKMDashboard(r.Context(), user.ID, dateFrom, dateTo)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal memuat data dashboard: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, data)
}

// GetMitraDashboard — GET /api/v1/dashboard/mitra?umkm_id=UMK000001 (optional)
func (h *Handler) GetMitraDashboard(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	if user.Role != "MITRA" {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "Hanya untuk role MITRA"})
		return
	}

	umkmID := r.URL.Query().Get("umkm_id")

	// ✅ umkm_id sekarang OPTIONAL — kalau kosong, service return list UMKM saja
	data, err := h.Service.GetMitraDashboard(r.Context(), user.ID, umkmID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal memuat data dashboard mitra: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, data)
}
