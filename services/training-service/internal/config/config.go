package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv      string
	ServerHost  string
	ServerPort  string
	DatabaseURL string
	FrontendURL string
	JWTSecret   string
}

func Load() Config {
	_ = godotenv.Load("../../.env")  // when run from cmd/api/
	_ = godotenv.Load(".env")         // when run from root

	cfg := Config{
		AppEnv:     getEnv("APP_ENV", "development"),
		ServerHost: getEnv("SERVER_HOST", "0.0.0.0"),
		ServerPort: getEnv("TRAINING_SERVICE_PORT", "8083"),
		DatabaseURL: getEnv(
			"DATABASE_URL",
			"postgres://umkm_user:umkm_password@localhost:5432/umkm_tumbuh?sslmode=disable",
		),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
		JWTSecret:   getEnv("JWT_SECRET", ""),
	}

	log.Printf("Training Service Config: Port=%s, Env=%s", cfg.ServerPort, cfg.AppEnv)

	return cfg
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}