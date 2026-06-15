package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"

	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/partnerships"
)

func NewRouter(
	partnershipHandler *partnerships.Handler,
	frontendURL string,
) http.Handler {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{frontendURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"ok"}`))
		})

		r.Route("/partnerships", func(r chi.Router) {
			r.Post("/", partnershipHandler.CreatePartnership)
			r.Get("/status", partnershipHandler.GetPartnershipStatus)
			r.Get("/incoming", partnershipHandler.GetIncomingPartnerships)
			r.Get("/{id}", partnershipHandler.GetPartnershipDetail)
			r.Post("/{id}/sign", partnershipHandler.SignPartnership)
			r.Patch("/{id}/approve", partnershipHandler.ApprovePartnership)
			r.Patch("/{id}/reject", partnershipHandler.RejectPartnership)
		})
	})

	return r
}
