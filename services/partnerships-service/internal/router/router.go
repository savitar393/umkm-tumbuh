package router

import (
	"net/http"  // ⭐ Tambahkan import ini!

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/partnerships"
)

func NewRouter(
	partnershipHandler *partnerships.Handler,
	frontendURL string,
) *chi.Mux {
	r := chi.NewRouter()

	// CORS configuration - allow frontend to access
	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{frontendURL, "http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-User-Role"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	})

	r.Use(corsMiddleware.Handler)

	// Health check endpoint
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// API v1 routes
	r.Route("/api/v1", func(r chi.Router) {
		// ============================================================
		// EXISTING ENDPOINTS (untuk pengajuan kemitraan)
		// ============================================================
		r.Post("/partnerships", partnershipHandler.CreatePartnership)
		r.Get("/partnerships/status", partnershipHandler.GetPartnershipStatus)
		r.Get("/partnerships/summary", partnershipHandler.GetPartnershipSummary)
		r.Get("/partnerships/incoming", partnershipHandler.GetIncomingPartnerships)
		r.Get("/partnerships/{id}", partnershipHandler.GetPartnershipDetail)
		r.Post("/partnerships/{id}/sign", partnershipHandler.SignPartnership)
		r.Patch("/partnerships/{id}/read", partnershipHandler.MarkAsRead)
		r.Patch("/partnerships/{id}/approve", partnershipHandler.ApprovePartnership)
		r.Patch("/partnerships/{id}/reject", partnershipHandler.RejectPartnership)
		r.Patch("/partnerships/{id}/cancel", partnershipHandler.CancelPartnership)

		// ============================================================
		// NEW ENDPOINTS (untuk menampilkan list UMKM dan Mitra)
		// ============================================================
		// GET /api/v1/umkm - daftar UMKM (diakses oleh MITRA)
		r.Get("/umkm", partnershipHandler.GetUMKMList)
		// GET /api/v1/umkm/{id} - detail UMKM (diakses oleh MITRA)
		r.Get("/umkm/{id}", partnershipHandler.GetUMKMDetail)
		
		// GET /api/v1/mitra - daftar Mitra (diakses oleh UMKM)
		r.Get("/mitra", partnershipHandler.GetMitraList)
		// GET /api/v1/mitra/{id} - detail Mitra (diakses oleh UMKM)
		r.Get("/mitra/{id}", partnershipHandler.GetMitraDetail)
	})

	return r
}