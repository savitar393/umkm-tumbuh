package dashboard

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/apperror"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/auth"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/response"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/users"
)

// parseDateRange konversi bulan (YYYY-MM) dan tahun (YYYY) ke startDate/endDate
// Jika kedua params kosong, return empty strings (no filter).
func parseDateRange(bulan, tahun string) (start, end string) {
	if bulan == "" && tahun == "" {
		return "", ""
	}

	now := time.Now()
	y := now.Year()
	m := now.Month()

	if bulan != "" {
		var mm int
		if t, err := fmt.Sscanf(bulan, "%d-%d", &y, &mm); err == nil && t == 2 {
			m = time.Month(mm)
		}
		// bulan tanpa tahun? parse di atas tetap pakai y = now.Year()
	} else if tahun != "" {
		// hanya tahun → full year (Jan - Dec)
		if t, err := fmt.Sscanf(tahun, "%d", &y); err == nil && t == 1 {
			m = 1
		}
	} else {
		// hanya bulan (tanpa tahun) — fallback ke current year, sudah di-set di atas
	}

	first := time.Date(y, m, 1, 0, 0, 0, 0, time.UTC)
	last := first.AddDate(0, 1, -1)
	return first.Format("2006-01-02"), last.Format("2006-01-02")
}

type Handler struct {
	DashboardService *Service
	AuthService      *auth.Service
}

func NewHandler(dashboardService *Service, authService *auth.Service) *Handler {
	return &Handler{
		DashboardService: dashboardService,
		AuthService:      authService,
	}
}

func (h *Handler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}

	// Query params filter — semua opsional
	bulan := r.URL.Query().Get("bulan")       // e.g. "2026-06" (YYYY-MM)
	tahun := r.URL.Query().Get("tahun")       // e.g. "2026"
	startDate, endDate := parseDateRange(bulan, tahun)

	filter := DashboardFilter{
		Provinsi:   r.URL.Query().Get("provinsi"),    // e.g. "Jawa Tengah"
		StatusUMKM: r.URL.Query().Get("status_umkm"), // e.g. "AKTIF"
		Days:       r.URL.Query().Get("days"),        // e.g. "180" untuk tren
		StartDate:  startDate,
		EndDate:    endDate,
	}

	data, err := h.DashboardService.GetDashboardWithFilter(r.Context(), filter)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, data)
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
		response.Error(w, http.StatusForbidden, "Akses hanya untuk Pemerintah/Admin.")
		return false
	}

	return true
}

func handleError(w http.ResponseWriter, err error) {
	var appErr *apperror.AppError

	if errors.As(err, &appErr) {
		response.Error(w, appErr.StatusCode, appErr.Message)
		return
	}

	log.Printf("internal dashboard error: %v", err)
	response.Error(w, http.StatusInternalServerError, "Terjadi kesalahan pada server.")
}
