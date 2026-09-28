package config

import (
	"errors"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all configuration values for the SOAP service.
type Config struct {
	DatabaseURL               string
	Host                      string
	EndpointURL               string
	Port                      string
	JWTSecret                 string
	MaxRequestBytes           int64
	RequestTimeout            time.Duration
	DatabaseTimeout           time.Duration
	ReadHeaderTimeout         time.Duration
	ReadTimeout               time.Duration
	WriteTimeout              time.Duration
	IdleTimeout               time.Duration
	RequireXMLSignature       bool
	XMLSignatureCertFile      string
	WSSEMaxClockSkew          time.Duration
	WSSEMaxTimestampTTL       time.Duration
	ReplayProtection          bool
	X509TokenProfile          bool
	X509TrustMode             string
	RequestCAFile             string
	RequestIntermediatesFile  string
	SignResponses             bool
	ResponseCertFile          string
	ResponseKeyFile           string
	ResponseCAFile            string
	ResponseIntermediatesFile string
	ReplayCacheMaxEntries     int
}

// Load reads configuration from .env files and environment variables.
// It tries the project root .env first, then a local .env.
func Load() *Config {
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load(".env")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		user := getEnv("POSTGRES_USER", "umkm_user")
		pass := getEnv("POSTGRES_PASSWORD", "umkm_password")
		host := getEnv("POSTGRES_HOST", "localhost")
		port := getEnv("POSTGRES_PORT", "5432")
		db := getEnv("POSTGRES_DB", "umkm_tumbuh")
		dbURL = "postgres://" + user + ":" + pass + "@" + host + ":" + port + "/" + db + "?sslmode=disable"
	}
	requireSignature := false
	switch strings.TrimSpace(os.Getenv("SOAP_REQUIRE_XML_SIGNATURE")) {
	case "", "false":
	case "true":
		requireSignature = true
	default:
		log.Fatal("SOAP_REQUIRE_XML_SIGNATURE must be true or false")
	}
	replayProtection := false
	switch strings.TrimSpace(os.Getenv("SOAP_WSSE_REPLAY_PROTECTION")) {
	case "", "false":
	case "true":
		replayProtection = true
	default:
		log.Fatal("SOAP_WSSE_REPLAY_PROTECTION must be true or false")
	}
	x509TokenProfile := false
	switch strings.TrimSpace(os.Getenv("SOAP_WSSE_X509_TOKEN")) {
	case "", "false":
	case "true":
		x509TokenProfile = true
	default:
		log.Fatal("SOAP_WSSE_X509_TOKEN must be true or false")
	}
	signResponses := false
	switch strings.TrimSpace(os.Getenv("SOAP_WSSE_SIGN_RESPONSES")) {
	case "", "false":
	case "true":
		signResponses = true
	default:
		log.Fatal("SOAP_WSSE_SIGN_RESPONSES must be true or false")
	}
	x509TrustMode := strings.TrimSpace(os.Getenv("SOAP_WSSE_X509_TRUST_MODE"))
	if x509TrustMode == "" {
		x509TrustMode = "pin"
	}
	if x509TrustMode != "pin" && x509TrustMode != "ca" {
		log.Fatal("SOAP_WSSE_X509_TRUST_MODE must be pin or ca")
	}

	if dbURL == "" {
		log.Fatal("DATABASE_URL or individual POSTGRES_* variables are required")
	}

	return &Config{
		DatabaseURL:               dbURL,
		Host:                      getEnv("SOAP_HOST", "127.0.0.1"),
		EndpointURL:               getEnv("SOAP_ENDPOINT_URL", "http://localhost:9090/partnership"),
		Port:                      getEnv("SOAP_PORT", "9090"),
		JWTSecret:                 os.Getenv("JWT_SECRET"),
		MaxRequestBytes:           positiveInt64Env("SOAP_MAX_REQUEST_BYTES", 1<<20),
		RequestTimeout:            positiveDurationEnv("SOAP_REQUEST_TIMEOUT", 10*time.Second),
		DatabaseTimeout:           positiveDurationEnv("SOAP_DATABASE_TIMEOUT", 10*time.Second),
		ReadHeaderTimeout:         positiveDurationEnv("SOAP_READ_HEADER_TIMEOUT", 5*time.Second),
		ReadTimeout:               positiveDurationEnv("SOAP_READ_TIMEOUT", 15*time.Second),
		WriteTimeout:              positiveDurationEnv("SOAP_WRITE_TIMEOUT", 30*time.Second),
		IdleTimeout:               positiveDurationEnv("SOAP_IDLE_TIMEOUT", 60*time.Second),
		RequireXMLSignature:       requireSignature,
		XMLSignatureCertFile:      strings.TrimSpace(os.Getenv("SOAP_XML_SIGNATURE_CERT_FILE")),
		WSSEMaxClockSkew:          positiveDurationEnv("SOAP_WSSE_MAX_CLOCK_SKEW", 30*time.Second),
		WSSEMaxTimestampTTL:       positiveDurationEnv("SOAP_WSSE_MAX_TIMESTAMP_TTL", 5*time.Minute),
		ReplayProtection:          replayProtection,
		X509TokenProfile:          x509TokenProfile,
		X509TrustMode:             x509TrustMode,
		RequestCAFile:             strings.TrimSpace(os.Getenv("SOAP_WSSE_REQUEST_CA_FILE")),
		RequestIntermediatesFile:  strings.TrimSpace(os.Getenv("SOAP_WSSE_REQUEST_INTERMEDIATES_FILE")),
		SignResponses:             signResponses,
		ResponseCertFile:          strings.TrimSpace(os.Getenv("SOAP_WSSE_RESPONSE_CERT_FILE")),
		ResponseKeyFile:           strings.TrimSpace(os.Getenv("SOAP_WSSE_RESPONSE_KEY_FILE")),
		ResponseCAFile:            strings.TrimSpace(os.Getenv("SOAP_WSSE_RESPONSE_CA_FILE")),
		ResponseIntermediatesFile: strings.TrimSpace(os.Getenv("SOAP_WSSE_RESPONSE_INTERMEDIATES_FILE")),
		ReplayCacheMaxEntries:     int(positiveInt64Env("SOAP_WSSE_REPLAY_CACHE_MAX_ENTRIES", 4096)),
	}
}

func (c *Config) Validate() error {
	if c.ReplayProtection && !c.RequireXMLSignature {
		return errors.New("SOAP_WSSE_REPLAY_PROTECTION requires SOAP_REQUIRE_XML_SIGNATURE=true")
	}
	if c.X509TokenProfile && (!c.RequireXMLSignature || !c.ReplayProtection) {
		return errors.New("SOAP_WSSE_X509_TOKEN requires XML signatures and replay protection")
	}
	if c.SignResponses && (!c.RequireXMLSignature || !c.ReplayProtection || !c.X509TokenProfile) {
		return errors.New("SOAP_WSSE_SIGN_RESPONSES requires the complete signed request profile")
	}
	if c.SignResponses && (c.ResponseCertFile == "" || c.ResponseKeyFile == "") {
		return errors.New("SOAP_WSSE_SIGN_RESPONSES requires response certificate and key files")
	}
	if c.X509TrustMode == "ca" {
		if !c.RequireXMLSignature || !c.X509TokenProfile {
			return errors.New("ca trust mode requires XML signatures and X.509 token profile")
		}
		if c.RequestCAFile == "" {
			return errors.New("ca trust mode requires SOAP_WSSE_REQUEST_CA_FILE")
		}
		if c.SignResponses && c.ResponseCAFile == "" {
			return errors.New("ca trust mode with response signing requires SOAP_WSSE_RESPONSE_CA_FILE")
		}
	}
	return nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func positiveInt64Env(key string, fallback int64) int64 {
	value, err := strconv.ParseInt(strings.TrimSpace(os.Getenv(key)), 10, 64)
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}

func positiveDurationEnv(key string, fallback time.Duration) time.Duration {
	value, err := time.ParseDuration(strings.TrimSpace(os.Getenv(key)))
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}
