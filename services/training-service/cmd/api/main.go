package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/certificates"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/config"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/database"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/health"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/router"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/trainings"
)

func main() {
	cfg := config.Load()

	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET tidak boleh kosong")
	}

	ctx := context.Background()

	db, err := database.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	trainingRepo := trainings.NewRepository(db)
	trainingService := trainings.NewService(trainingRepo)
	trainingHandler := trainings.NewHandler(trainingService)

	certRepo := certificates.NewRepository(db)
	certService := certificates.NewService(certRepo, cfg.CertificateDir)
	certHandler := certificates.NewHandler(certService)

	healthHandler := health.NewHandler(db)

	appRouter := router.NewRouter(
		healthHandler,
		trainingHandler,
		certHandler,
		cfg.FrontendURL,
		cfg.JWTSecret,
	)

	address := fmt.Sprintf("%s:%s", cfg.ServerHost, cfg.ServerPort)

	log.Printf("Training Service running on http://%s", address)

	if err := http.ListenAndServe(address, appRouter); err != nil {
		log.Fatal(err)
	}
}
