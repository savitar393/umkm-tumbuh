package main

import (
	"context"
	"errors"
	"log"
	"os"
	"strings"
	"time"

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

	// Wait for reference data to be available and stable (db-seed may be running)
	log.Println("Waiting for reference data to be available...")
	for i := 0; i < 30; i++ {
		var count int
		if err := db.QueryRow(ctx, "SELECT count(*) FROM ref.ref_peranpengguna WHERE peran_id = 'ADMIN'").Scan(&count); err != nil || count == 0 {
			log.Printf("Reference data not ready (attempt %d/30)...", i+1)
			time.Sleep(2 * time.Second)
			continue
		}
		// Verify stability — db-seed may have truncated and reloaded
		time.Sleep(2 * time.Second)
		if err := db.QueryRow(ctx, "SELECT count(*) FROM ref.ref_peranpengguna WHERE peran_id = 'ADMIN'").Scan(&count); err == nil && count > 0 {
			log.Println("Reference data confirmed stable")
			break
		}
		if i == 29 {
			log.Fatal("Reference data never stabilized")
		}
	}

	userRepo := users.NewRepository(db)

	adminID := getEnv("ADMIN_ID", "AKUNADMIN001")

	if len(adminID) > 30 {
		log.Fatal("ADMIN_ID must be 30 characters or fewer. Use a production-style ID such as AKUNADMIN001, not a UUID.")
	}

	adminFullName := getEnv("ADMIN_FULL_NAME", "Admin Pemerintah")
	adminEmail := strings.ToLower(strings.TrimSpace(getEnv("ADMIN_EMAIL", "admin@example.com")))
	adminPassword := getEnv("ADMIN_PASSWORD", "admin12345")

	if len(adminPassword) < 8 {
		log.Fatal("ADMIN_PASSWORD must be at least 8 characters")
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

	for i := 0; i < 30; i++ {
		_, err = userRepo.FindByEmail(ctx, adminEmail)
		if err == nil {
			log.Printf("Admin already exists: %s (will re-verify after db-seed window)", adminEmail)
			time.Sleep(3 * time.Second)
			_, err = userRepo.FindByEmail(ctx, adminEmail)
			if err == nil {
				log.Printf("Admin confirmed: %s", adminEmail)
				return
			}
			if !errors.Is(err, pgx.ErrNoRows) {
				log.Fatal(err)
			}
			log.Printf("Admin was deleted by seed process, retrying...")
			continue
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			log.Fatal(err)
		}

		if err := userRepo.Create(ctx, adminUser); err != nil {
			if strings.Contains(err.Error(), "23503") {
				log.Printf("Waiting for reference data (attempt %d/30)...", i+1)
				time.Sleep(1 * time.Second)
				continue
			}
			log.Fatal(err)
		}

		log.Printf("Admin created: %s", adminEmail)
		// Verify admin survived in case db-seed truncated after creation
		time.Sleep(3 * time.Second)
		_, err = userRepo.FindByEmail(ctx, adminEmail)
		if err == nil {
			log.Printf("Admin confirmed: %s", adminEmail)
			return
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			log.Fatal(err)
		}
		log.Printf("Admin was deleted by seed process, retrying...")
		continue
	}

	log.Fatal("Failed to create admin after 30 attempts")
}

func getEnv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}
