package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/config"
	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/database"
	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/router"
)

func main() {
	cfg := config.Load()

	if cfg.UploadDir != "" {
		if err := os.MkdirAll(cfg.UploadDir, 0755); err != nil {
			log.Printf("warning: failed to create upload dir: %v", err)
		}
	}

	ctx := context.Background()

	db, err := database.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	defer db.Close()

	handler := router.New(db, cfg.FrontendURL, cfg.JWTSecret, cfg.UploadDir)

	server := &http.Server{
		Addr:         cfg.ServerHost + ":" + cfg.ServerPort,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("user-service running on %s:%s", cfg.ServerHost, cfg.ServerPort)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}
