package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/savitar393/umkm-tumbuh/backend/internal/config"
	"github.com/savitar393/umkm-tumbuh/backend/internal/database"
	"github.com/savitar393/umkm-tumbuh/backend/internal/handler"
	"github.com/savitar393/umkm-tumbuh/backend/internal/router"
)

func main() {
	cfg := config.Load()

	ctx := context.Background()

	db, err := database.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	healthHandler := handler.NewHealthHandler(db)
	appRouter := router.NewRouter(healthHandler, cfg.FrontendURL)

	address := fmt.Sprintf("%s:%s", cfg.ServerHost, cfg.ServerPort)

	log.Printf("Server running on http://%s", address)

	if err := http.ListenAndServe(address, appRouter); err != nil {
		log.Fatal(err)
	}
}