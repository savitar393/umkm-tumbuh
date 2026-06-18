package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/savitar393/umkm-tumbuh/services/documents-service/internal/config"
	"github.com/savitar393/umkm-tumbuh/services/documents-service/internal/database"
	"github.com/savitar393/umkm-tumbuh/services/documents-service/internal/documents"
	"github.com/savitar393/umkm-tumbuh/services/documents-service/internal/router"
)

func main() {
	cfg := config.Load()

	ctx := context.Background()

	db, err := database.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	docRepo := documents.NewRepository(db)
	docService := documents.NewService(docRepo, cfg.UploadDir)
	docHandler := documents.NewHandler(docService)

	appRouter := router.NewRouter(docHandler, cfg.FrontendURL)

	address := fmt.Sprintf("%s:%s", cfg.ServerHost, cfg.ServerPort)

	log.Printf("Document service running on http://%s", address)

	if err := http.ListenAndServe(address, appRouter); err != nil {
		log.Fatal(err)
	}
}
