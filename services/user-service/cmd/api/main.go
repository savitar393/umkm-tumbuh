package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/config"
	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/database"
	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/router"
)

func main() {
	cfg := config.Load()

	ctx := context.Background()

	db, err := database.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	defer db.Close()

	handler := router.New(db, cfg.FrontendURL, cfg.JWTSecret)

	server := &http.Server{
		Addr:         cfg.ServerHost + ":" + cfg.ServerPort,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("user-service running on %s:%s", cfg.ServerHost, cfg.ServerPort)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}
