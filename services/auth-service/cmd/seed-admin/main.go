package main

import (
	"context"
	"errors"
	"log"

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

	email := "admin@example.com"

	_, err = userRepo.FindByEmail(ctx, email)
	if err == nil {
		log.Println("Admin already exists.")
		return
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		log.Fatal(err)
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte("admin12345"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}

	adminUser := &users.User{
		ID:           "00000000-0000-0000-0000-000000000001",
		FullName:     "Admin Pemerintah",
		Email:        email,
		PasswordHash: string(passwordHash),
		Role:         users.RoleAdmin,
		Status:       users.StatusApproved,
		IsActive:     true,
	}

	if err := userRepo.Create(ctx, adminUser); err != nil {
		log.Fatal(err)
	}

	log.Println("Admin created.")
	log.Println("email: admin@example.com")
	log.Println("password: admin12345")
}
