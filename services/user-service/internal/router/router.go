package router

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/dashboard"
	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/health"
	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/middleware"
	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/products"
	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/profiles"
	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/sales"
)

func New(db *pgxpool.Pool, frontendURL string, jwtSecret string) http.Handler {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{frontendURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(timeoutMiddleware(10 * time.Second))

	healthHandler := health.NewHandler(db)
	profileHandler := profiles.NewHandler(db)
	productHandler := products.NewHandler(db)
	salesHandler := sales.NewHandler(db)
	dashboardHandler := dashboard.NewHandler(db)

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", healthHandler.ServiceHealth)
		r.Get("/health/db", healthHandler.DatabaseHealth)

		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(jwtSecret))

			r.Route("/profiles", func(r chi.Router) {
				r.Get("/me", profileHandler.GetMe)
				r.Put("/me", profileHandler.UpsertMe)
				r.Get("/mitra", profileHandler.ListMitra)
				r.Get("/umkm", profileHandler.ListUMKM)
			})

			r.Route("/products", func(r chi.Router) {
				r.Get("/", productHandler.List)
				r.Post("/", productHandler.Create)
				r.Get("/{id}", productHandler.Get)
				r.Put("/{id}", productHandler.Update)
				r.Patch("/{id}/stock", productHandler.UpdateStock)
				r.Delete("/{id}", productHandler.Delete)
				r.Get("/{id}/thumbnail", productHandler.GetThumbnail)
				r.Post("/{id}/thumbnail", productHandler.UploadThumbnail)
				r.Patch("/{id}/thumbnail", productHandler.AttachThumbnail)
				r.Delete("/{id}/thumbnail", productHandler.DeleteThumbnail)
			})

			r.Route("/sales", func(r chi.Router) {
				r.Get("/", salesHandler.List)
				r.Post("/", salesHandler.Create)
				r.Get("/{id}", salesHandler.Get)
			})

			r.Route("/dashboard", func(r chi.Router) {
				r.Get("/umkm/summary", dashboardHandler.UMKMSummary)
			})
		})

	})

	return r
}

func timeoutMiddleware(timeout time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.TimeoutHandler(next, timeout, `{"error":"request timeout"}`)
	}
}
