package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"

	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/certificates"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/health"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/middleware"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/trainings"
)

func NewRouter(
	healthHandler *health.Handler,
	trainingHandler *trainings.Handler,
	adminTrainingHandler *trainings.AdminHandler,
	certHandler *certificates.Handler,
	frontendURL string,
	jwtSecret string,
) http.Handler {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{frontendURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	r.Route("/api/v1", func(r chi.Router) {
		// Health check (public)
		r.Get("/health", healthHandler.Health)
		r.Get("/health/db", healthHandler.Database)

		// Training endpoints (read public, write with auth)
		r.Route("/trainings", func(r chi.Router) {
			r.Get("/", trainingHandler.GetAllTrainings)
			r.Get("/{id}", trainingHandler.GetTrainingByID)
			r.Get("/{id}/detail", trainingHandler.GetTrainingDetail)
			r.With(middleware.AuthMiddleware(jwtSecret)).Post("/enroll", trainingHandler.EnrollUser)
		})

		// Enrollment endpoints (protected)
		r.Route("/enrollments", func(r chi.Router) {
			r.Use(middleware.AuthMiddleware(jwtSecret))
			r.Get("/user/{umkmID}", trainingHandler.GetUserEnrollments)
			r.Patch("/progress", trainingHandler.UpdateProgress)
			r.Patch("/complete", trainingHandler.CompleteTraining)
		})

		// Certificate endpoints (protected)
		r.Route("/certificates", func(r chi.Router) {
			r.Use(middleware.AuthMiddleware(jwtSecret))
			r.Get("/list", certHandler.ListCertificates)
			r.Get("/stats", certHandler.GetCertificateStats)
			r.Post("/{id}/approve", certHandler.ApproveCertificateByAdmin)
			r.Post("/{id}/reject", certHandler.RejectCertificate)
			r.Get("/user/{umkmID}/dashboard", certHandler.GetUserDashboard)
			r.Get("/user/{umkmID}", certHandler.GetUserCertificates)
			r.Get("/{id}", certHandler.GetCertificateByID)
			r.Get("/{id}/download", certHandler.DownloadCertificate)
			r.Post("/request", certHandler.RequestCertificate)
		})

		// Admin endpoints (protected)
		r.Route("/admin/training", func(r chi.Router) {
			r.Use(middleware.AuthMiddleware(jwtSecret))
			r.Get("/", adminTrainingHandler.GetAllTrainingsAdmin)
			r.Get("/stats", adminTrainingHandler.GetTrainingStats)
			r.Post("/", adminTrainingHandler.CreateTraining)
			r.Put("/{id}", adminTrainingHandler.UpdateTraining)
			r.Delete("/{id}", adminTrainingHandler.DeleteTraining)
			r.Patch("/{id}/status", adminTrainingHandler.UpdateTrainingStatus)
		})
	})

	return r
}