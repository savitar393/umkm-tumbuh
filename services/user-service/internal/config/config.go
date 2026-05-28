package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv      string
	ServerHost  string
	ServerPort  string
	FrontendURL string
	DatabaseURL string
	JWTSecret   string
}

func Load() Config {
	_ = godotenv.Load()

	return Config{
		AppEnv:      getEnv("APP_ENV", "development"),
		ServerHost:  getEnv("USER_SERVICE_HOST", "0.0.0.0"),
		ServerPort:  getEnv("USER_SERVICE_PORT", "8081"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
		DatabaseURL: getEnv("DATABASE_URL", ""),
		JWTSecret:   getEnv("JWT_SECRET", ""),
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}
