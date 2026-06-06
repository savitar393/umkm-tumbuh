package main

import (
	"context"
	"errors"
	"log"
	"os"
	"strings"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/config"
	"github.com/savitar393/umkm-tumbuh/services/auth-service/internal/database"
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

	adminID := getEnv("ADMIN_ID", "AKUNADMIN001")
	adminFullName := getEnv("ADMIN_FULL_NAME", "Admin Pemerintah")
	adminEmail := strings.ToLower(strings.TrimSpace(getEnv("ADMIN_EMAIL", "admin@example.com")))
	adminPassword := getEnv("ADMIN_PASSWORD", "admin12345")

	if len(adminPassword) < 8 {
		log.Fatal("ADMIN_PASSWORD must be at least 8 characters")
	}

	_, err = userRepo.FindByEmail(ctx, adminEmail)
	if err == nil {
		log.Printf("Admin already exists: %s", adminEmail)
		return
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		log.Fatal(err)
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}

	adminUser := &users.User{
		ID:           adminID,
		FullName:     adminFullName,
		Email:        adminEmail,
		PasswordHash: string(passwordHash),
		Role:         users.RoleAdmin,
		Status:       users.StatusApproved,
		IsActive:     true,
	}

	if err := userRepo.Create(ctx, adminUser); err != nil {
		log.Fatal(err)
	}

	log.Printf("Admin created: %s", adminEmail)
}

func getEnv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}
