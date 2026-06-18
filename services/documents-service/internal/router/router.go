package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/savitar393/umkm-tumbuh/services/documents-service/internal/documents"
)

func NewRouter(
	docHandler *documents.Handler,
	frontendURL string,
) *chi.Mux {
	r := chi.NewRouter()

	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{frontendURL, "http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-User-Role"},
		ExposedHeaders:   []string{"Link", "Content-Disposition"},
		AllowCredentials: true,
		MaxAge:           300,
	})

	r.Use(corsMiddleware.Handler)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	r.Route("/api/v1/documents", func(r chi.Router) {
		r.Post("/upload", docHandler.Upload)
		r.Get("/{id}", docHandler.Download)
		r.Get("/{id}/metadata", docHandler.GetMetadata)
	})

	return r
}
