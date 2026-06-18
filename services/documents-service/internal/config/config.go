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
	UploadDir   string
}

func Load() Config {
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load(".env")

	cfg := Config{
		AppEnv:      getEnv("APP_ENV", "development"),
		ServerHost:  getEnv("SERVER_HOST", "0.0.0.0"),
		ServerPort:  getEnv("SERVER_PORT", "8083"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://umkm_user:umkm_password@localhost:5432/umkm_tumbuh?sslmode=disable"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
		UploadDir:   getEnv("UPLOAD_DIR", "/app/uploads"),
	}

	if cfg.AppEnv == "development" {
		log.Printf("Config loaded: host=%s port=%s upload_dir=%s", cfg.ServerHost, cfg.ServerPort, cfg.UploadDir)
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
