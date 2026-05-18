package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/config"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/database"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/handler"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/repository"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/router"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/service"
)

func main() {
	cfg := config.Load()

	ctx := context.Background()

	db, err := database.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo, cfg)

	healthHandler := handler.NewHealthHandler(db)
	authHandler := handler.NewAuthHandler(authService)

	appRouter := router.NewRouter(healthHandler, authHandler, cfg.FrontendURL)

	address := fmt.Sprintf("%s:%s", cfg.ServerHost, cfg.ServerPort)

	log.Printf("Server running on http://%s", address)

	if err := http.ListenAndServe(address, appRouter); err != nil {
		log.Fatal(err)
	}
}
