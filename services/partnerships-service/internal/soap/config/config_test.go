package config

import (
	"testing"
	"time"
)

func TestLoadUsesSecureTransportDefaults(t *testing.T) {
	clearTransportEnvironment(t)
	t.Setenv("DATABASE_URL", "postgres://test:test@localhost/test")

	cfg := Load()

	if cfg.MaxRequestBytes != 1<<20 {
		t.Fatalf("MaxRequestBytes = %d, want %d", cfg.MaxRequestBytes, int64(1<<20))
	}
	if cfg.RequireXMLSignature || cfg.XMLSignatureCertFile != "" {
		t.Fatal("XML signatures must be off without configuration")
	}
	assertDuration(t, "RequestTimeout", cfg.RequestTimeout, 10*time.Second)
	assertDuration(t, "DatabaseTimeout", cfg.DatabaseTimeout, 10*time.Second)
	assertDuration(t, "ReadHeaderTimeout", cfg.ReadHeaderTimeout, 5*time.Second)
	assertDuration(t, "ReadTimeout", cfg.ReadTimeout, 15*time.Second)
	assertDuration(t, "WriteTimeout", cfg.WriteTimeout, 30*time.Second)
	assertDuration(t, "IdleTimeout", cfg.IdleTimeout, 60*time.Second)
	assertDuration(t, "WSSEMaxClockSkew", cfg.WSSEMaxClockSkew, 30*time.Second)
	assertDuration(t, "WSSEMaxTimestampTTL", cfg.WSSEMaxTimestampTTL, 5*time.Minute)
}

func TestLoadAcceptsPositiveTransportOverrides(t *testing.T) {
	clearTransportEnvironment(t)
	t.Setenv("DATABASE_URL", "postgres://test:test@localhost/test")
	t.Setenv("JWT_SECRET", "configured-secret")
	t.Setenv("SOAP_MAX_REQUEST_BYTES", "2048")
	t.Setenv("SOAP_REQUEST_TIMEOUT", "3s")
	t.Setenv("SOAP_DATABASE_TIMEOUT", "4s")
	t.Setenv("SOAP_READ_HEADER_TIMEOUT", "2s")
	t.Setenv("SOAP_READ_TIMEOUT", "5s")
	t.Setenv("SOAP_WRITE_TIMEOUT", "8s")
	t.Setenv("SOAP_IDLE_TIMEOUT", "45s")
	t.Setenv("SOAP_REQUIRE_XML_SIGNATURE", "true")
	t.Setenv("SOAP_XML_SIGNATURE_CERT_FILE", "/run/secrets/signing-cert.pem")
	t.Setenv("SOAP_WSSE_MAX_CLOCK_SKEW", "45s")
	t.Setenv("SOAP_WSSE_MAX_TIMESTAMP_TTL", "7m")

	cfg := Load()

	if cfg.JWTSecret != "configured-secret" {
		t.Fatalf("JWTSecret = %q, want configured value", cfg.JWTSecret)
	}
	if !cfg.RequireXMLSignature || cfg.XMLSignatureCertFile != "/run/secrets/signing-cert.pem" {
		t.Fatal("XML signature configuration not loaded")
	}
	if cfg.MaxRequestBytes != 2048 {
		t.Fatalf("MaxRequestBytes = %d, want 2048", cfg.MaxRequestBytes)
	}
	assertDuration(t, "RequestTimeout", cfg.RequestTimeout, 3*time.Second)
	assertDuration(t, "DatabaseTimeout", cfg.DatabaseTimeout, 4*time.Second)
	assertDuration(t, "ReadHeaderTimeout", cfg.ReadHeaderTimeout, 2*time.Second)
	assertDuration(t, "ReadTimeout", cfg.ReadTimeout, 5*time.Second)
	assertDuration(t, "WriteTimeout", cfg.WriteTimeout, 8*time.Second)
	assertDuration(t, "IdleTimeout", cfg.IdleTimeout, 45*time.Second)
	assertDuration(t, "WSSEMaxClockSkew", cfg.WSSEMaxClockSkew, 45*time.Second)
	assertDuration(t, "WSSEMaxTimestampTTL", cfg.WSSEMaxTimestampTTL, 7*time.Minute)
}

func TestLoadRejectsUnsafeTransportOverrides(t *testing.T) {
	clearTransportEnvironment(t)
	t.Setenv("DATABASE_URL", "postgres://test:test@localhost/test")
	t.Setenv("SOAP_MAX_REQUEST_BYTES", "-1")
	t.Setenv("SOAP_REQUEST_TIMEOUT", "0")
	t.Setenv("SOAP_DATABASE_TIMEOUT", "invalid")
	t.Setenv("SOAP_READ_HEADER_TIMEOUT", "-2s")
	t.Setenv("SOAP_READ_TIMEOUT", "0s")
	t.Setenv("SOAP_WRITE_TIMEOUT", "invalid")
	t.Setenv("SOAP_IDLE_TIMEOUT", "-1s")
	t.Setenv("SOAP_WSSE_MAX_CLOCK_SKEW", "-1s")
	t.Setenv("SOAP_WSSE_MAX_TIMESTAMP_TTL", "invalid")

	cfg := Load()

	if cfg.MaxRequestBytes != 1<<20 {
		t.Fatalf("MaxRequestBytes = %d, want safe default", cfg.MaxRequestBytes)
	}
	assertDuration(t, "RequestTimeout", cfg.RequestTimeout, 10*time.Second)
	assertDuration(t, "DatabaseTimeout", cfg.DatabaseTimeout, 10*time.Second)
	assertDuration(t, "ReadHeaderTimeout", cfg.ReadHeaderTimeout, 5*time.Second)
	assertDuration(t, "ReadTimeout", cfg.ReadTimeout, 15*time.Second)
	assertDuration(t, "WriteTimeout", cfg.WriteTimeout, 30*time.Second)
	assertDuration(t, "IdleTimeout", cfg.IdleTimeout, 60*time.Second)
	assertDuration(t, "WSSEMaxClockSkew", cfg.WSSEMaxClockSkew, 30*time.Second)
	assertDuration(t, "WSSEMaxTimestampTTL", cfg.WSSEMaxTimestampTTL, 5*time.Minute)
}

func clearTransportEnvironment(t *testing.T) {
	t.Helper()
	for _, key := range []string{
		"JWT_SECRET",
		"SOAP_MAX_REQUEST_BYTES",
		"SOAP_REQUEST_TIMEOUT",
		"SOAP_DATABASE_TIMEOUT",
		"SOAP_READ_HEADER_TIMEOUT",
		"SOAP_READ_TIMEOUT",
		"SOAP_WRITE_TIMEOUT",
		"SOAP_IDLE_TIMEOUT",
		"SOAP_REQUIRE_XML_SIGNATURE",
		"SOAP_XML_SIGNATURE_CERT_FILE",
		"SOAP_WSSE_MAX_CLOCK_SKEW",
		"SOAP_WSSE_MAX_TIMESTAMP_TTL",
	} {
		t.Setenv(key, "")
	}
}

func assertDuration(t *testing.T, name string, got, want time.Duration) {
	t.Helper()
	if got != want {
		t.Fatalf("%s = %s, want %s", name, got, want)
	}
}
