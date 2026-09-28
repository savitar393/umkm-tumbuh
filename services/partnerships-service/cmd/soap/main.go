package main

import (
	"context"
	"crypto/x509"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/database"
	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/partnerships"
	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/soap"
	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/soap/config"
	contracts "github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/soap/contracts"
)

func main() {
	cfg := config.Load()
	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET is required")
	}
	var trustedCert *x509.Certificate
	if cfg.RequireXMLSignature {
		var err error
		trustedCert, err = soap.LoadTrustedSignatureCertificate(cfg.XMLSignatureCertFile)
		if err != nil {
			log.Fatalf("XML signature configuration: %v", err)
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), cfg.DatabaseTimeout)
	pool, err := database.NewPostgresPool(ctx, cfg.DatabaseURL)
	cancel()
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer pool.Close()
	log.Println("Database connected.")

	wsdlContent, err := soap.WSDL(cfg.EndpointURL)
	if err != nil {
		log.Fatal(err)
	}

	// Wire up layers
	repo := partnerships.NewRepository(pool)
	svc := partnerships.NewService(repo)
	handler := soap.NewHandlerWithConfig(contracts.NewAdapter(svc), wsdlContent, soap.HandlerConfig{
		JWTSecret:            cfg.JWTSecret,
		MaxRequestBytes:      cfg.MaxRequestBytes,
		RequestTimeout:       cfg.RequestTimeout,
		RequireXMLSignature:  cfg.RequireXMLSignature,
		TrustedSignatureCert: trustedCert,
		WSSEMaxClockSkew:     cfg.WSSEMaxClockSkew,
		WSSEMaxTimestampTTL:  cfg.WSSEMaxTimestampTTL,
	})

	// Register route
	mux := http.NewServeMux()
	mux.Handle("/partnership", handler)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if err := pool.Ping(ctx); err != nil {
			http.Error(w, "Database unavailable", http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	addr := cfg.Host + ":" + cfg.Port
	log.Printf("SOAP Partnership Service listening on %s", addr)
	log.Printf("WSDL available at: %s?wsdl", cfg.EndpointURL)
	log.Printf("SOAP endpoint: %s", cfg.EndpointURL)

	server := newHTTPServer(addr, mux, cfg)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("Server error: %v", err)
	}
}

func newHTTPServer(addr string, handler http.Handler, cfg *config.Config) *http.Server {
	return &http.Server{
		Addr:              addr,
		Handler:           handler,
		ReadHeaderTimeout: cfg.ReadHeaderTimeout,
		ReadTimeout:       cfg.ReadTimeout,
		WriteTimeout:      cfg.WriteTimeout,
		IdleTimeout:       cfg.IdleTimeout,
	}
}
