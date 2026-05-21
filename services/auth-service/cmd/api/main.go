package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/admin"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/auth"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/config"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/database"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/health"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/router"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/users"
)

func main() {
	cfg := config.Load()

	ctx := context.Background()

	db, err := database.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	userRepo := users.NewRepository(db)

	authService := auth.NewService(userRepo, cfg)
	adminService := admin.NewService(userRepo)

	healthHandler := health.NewHandler(db)
	authHandler := auth.NewHandler(authService)
	adminHandler := admin.NewHandler(adminService, authService)

	appRouter := router.NewRouter(
		healthHandler,
		authHandler,
		adminHandler,
		cfg.FrontendURL,
	)

	address := fmt.Sprintf("%s:%s", cfg.ServerHost, cfg.ServerPort)

	log.Printf("Server running on http://%s", address)

	if err := http.ListenAndServe(address, appRouter); err != nil {
		log.Fatal(err)
	}
}
