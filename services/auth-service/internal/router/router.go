package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"

	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/admin"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/auth"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/dashboard"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/health"
)

func NewRouter(
	healthHandler *health.Handler,
	authHandler *auth.Handler,
	adminHandler *admin.Handler,
	dashboardHandler *dashboard.Handler,
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
		r.Get("/health", healthHandler.Health)
		r.Get("/health/db", healthHandler.Database)

		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
			r.Get("/me", authHandler.Me)
		})

		r.Route("/admin", func(r chi.Router) {
			r.Get("/registrations", adminHandler.ListRegistrations)
			r.Patch("/registrations/{userID}/approve", adminHandler.ApproveRegistration)
			r.Patch("/registrations/{userID}/reject", adminHandler.RejectRegistration)

			r.Get("/dashboard", dashboardHandler.GetDashboard)
		})
	})

	return r
}
