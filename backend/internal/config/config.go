package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv      string
	ServerHost string
	ServerPort string
	DatabaseURL string
	FrontendURL string
	JWTSecret   string
}

func Load() Config {
	// Works when running from backend/
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")

	cfg := Config{
		AppEnv:      getEnv("APP_ENV", "development"),
		ServerHost: getEnv("SERVER_HOST", "0.0.0.0"),
		ServerPort: getEnv("SERVER_PORT", "8080"),
		DatabaseURL: getEnv(
			"DATABASE_URL",
			"postgres://umkm_user:umkm_password@localhost:5432/umkm_tumbuh?sslmode=disable",
		),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
		JWTSecret:   getEnv("JWT_SECRET", "change-me"),
	}

	if cfg.JWTSecret == "change-me" {
		log.Println("WARNING: JWT_SECRET is using default value. Change this before production.")
	}

	return cfg
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}