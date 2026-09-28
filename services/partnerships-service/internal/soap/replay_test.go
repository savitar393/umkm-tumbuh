package soap

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	contracts "github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/soap/contracts"
)

func TestReplayCacheExpiryAndCapacity(t *testing.T) {
	now := time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC)
	cache := NewInMemoryReplayCache(2)
	if err := cache.CheckAndStore("first", now.Add(time.Minute), now); err != nil {
		t.Fatal(err)
	}
	if err := cache.CheckAndStore("second", now.Add(2*time.Minute), now); err != nil {
		t.Fatal(err)
	}
	if err := cache.CheckAndStore("first", now.Add(time.Minute), now); !errors.Is(err, ErrReplayDetected) {
		t.Fatalf("duplicate result=%v, want replay", err)
	}
	if err := cache.CheckAndStore("third", now.Add(2*time.Minute), now); !errors.Is(err, ErrReplayCacheFull) {
		t.Fatalf("capacity result=%v, want full", err)
	}
	// At the exact expiry boundary the signed message can still pass freshness.
	if err := cache.CheckAndStore("third", now.Add(2*time.Minute), now.Add(time.Minute)); !errors.Is(err, ErrReplayCacheFull) {
		t.Fatalf("boundary result=%v, want full", err)
	}
	if err := cache.CheckAndStore("third", now.Add(2*time.Minute), now.Add(time.Minute+time.Nanosecond)); err != nil {
		t.Fatalf("expired entry was not pruned: %v", err)
	}
	if err := cache.CheckAndStore("second", now.Add(3*time.Minute), now.Add(time.Minute+time.Nanosecond)); !errors.Is(err, ErrReplayDetected) {
		t.Fatalf("live entry was evicted: %v", err)
	}
}

func TestReplayCacheConcurrentCheckAndStore(t *testing.T) {
	cache := NewInMemoryReplayCache(32)
	now := time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC)
	const attempts = 24
	start := make(chan struct{})
	var accepted atomic.Int32
	var replayed atomic.Int32
	var wg sync.WaitGroup
	for range attempts {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			switch err := cache.CheckAndStore("same", now.Add(time.Minute), now); {
			case err == nil:
				accepted.Add(1)
			case errors.Is(err, ErrReplayDetected):
				replayed.Add(1)
			default:
				t.Errorf("unexpected cache error: %v", err)
			}
		}()
	}
	close(start)
	wg.Wait()
	if accepted.Load() != 1 || replayed.Load() != attempts-1 {
		t.Fatalf("accepted=%d replayed=%d, want 1 and %d", accepted.Load(), replayed.Load(), attempts-1)
	}
}

type concurrentSummaryService struct {
	partnershipService
	calls atomic.Int32
}

type failingSummaryService struct {
	partnershipService
	calls int
}

func (s *failingSummaryService) GetPartnershipSummary(_ context.Context, _ *contracts.GetPartnershipSummaryRequest) (map[string]int, error) {
	s.calls++
	return nil, errors.New("downstream unavailable")
}

func (s *concurrentSummaryService) GetPartnershipSummary(_ context.Context, _ *contracts.GetPartnershipSummaryRequest) (map[string]int, error) {
	s.calls.Add(1)
	return map[string]int{"DIAJUKAN": 1}, nil
}

func TestSOAPConcurrentReplayDispatchesOnce(t *testing.T) {
	now := time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC)
	key, cert := testSigningIdentity(t)
	xmlText := signedReplaySummaryXML(t, key, cert, "2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z", "urn:uuid:550e8400-e29b-41d4-a716-446655440000")
	token := signedTestJWT(t, map[string]any{
		"sub": "AKUN-001", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix(),
	}, testJWTSecret, "HS256")
	svc := &concurrentSummaryService{}
	handler := NewHandlerWithConfig(svc, "", HandlerConfig{
		JWTSecret: testJWTSecret, RequireXMLSignature: true, TrustedSignatureCert: cert, TrustVerifier: &pinnedCertificateVerifier{pinned: cert},
		ReplayProtection: true, Now: func() time.Time { return now },
	})
	const attempts = 12
	start := make(chan struct{})
	var accepted atomic.Int32
	var replayed atomic.Int32
	var wg sync.WaitGroup
	for range attempts {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			req := httptest.NewRequest(http.MethodPost, "/partnership", strings.NewReader(xmlText))
			req.Header.Set("Authorization", "Bearer "+token)
			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)
			switch rr.Code {
			case 200:
				accepted.Add(1)
			case 400:
				replayed.Add(1)
			default:
				t.Errorf("unexpected status %d: %s", rr.Code, rr.Body.String())
			}
		}()
	}
	close(start)
	wg.Wait()
	if accepted.Load() != 1 || replayed.Load() != attempts-1 || svc.calls.Load() != 1 {
		t.Fatalf("accepted=%d rejected=%d calls=%d, want 1/%d/1", accepted.Load(), replayed.Load(), svc.calls.Load(), attempts-1)
	}
}

func TestSOAPReplayCacheCapacityFailsClosed(t *testing.T) {
	now := time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC)
	key, cert := testSigningIdentity(t)
	token := signedTestJWT(t, map[string]any{
		"sub": "AKUN-001", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix(),
	}, testJWTSecret, "HS256")
	svc := &signedSummaryService{}
	handler := NewHandlerWithConfig(svc, "", HandlerConfig{
		JWTSecret: testJWTSecret, RequireXMLSignature: true, TrustedSignatureCert: cert, TrustVerifier: &pinnedCertificateVerifier{pinned: cert},
		ReplayProtection: true, ReplayCache: NewInMemoryReplayCache(1), Now: func() time.Time { return now },
	})
	first := signedReplaySummaryXML(t, key, cert, "2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z", "urn:uuid:550e8400-e29b-41d4-a716-446655440000")
	second := signedReplaySummaryXML(t, key, cert, "2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z", "urn:uuid:550e8400-e29b-41d4-a716-446655440001")
	if rr := sendSignedSummary(handler, token, first); rr.Code != 200 {
		t.Fatalf("first status=%d", rr.Code)
	}
	if rr := sendSignedSummary(handler, token, second); rr.Code != 400 {
		t.Fatalf("full cache status=%d", rr.Code)
	}
	if rr := sendSignedSummary(handler, token, first); rr.Code != 400 || svc.calls != 1 {
		t.Fatalf("original entry was evicted: status=%d calls=%d", rr.Code, svc.calls)
	}
}

func TestSOAPFailedBusinessOperationStillConsumesMessageID(t *testing.T) {
	now := time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC)
	key, cert := testSigningIdentity(t)
	token := signedTestJWT(t, map[string]any{
		"sub": "AKUN-001", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix(),
	}, testJWTSecret, "HS256")
	xmlText := signedReplaySummaryXML(t, key, cert, "2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z", "urn:uuid:550e8400-e29b-41d4-a716-446655440000")
	svc := &failingSummaryService{}
	handler := NewHandlerWithConfig(svc, "", HandlerConfig{
		JWTSecret: testJWTSecret, RequireXMLSignature: true, TrustedSignatureCert: cert, TrustVerifier: &pinnedCertificateVerifier{pinned: cert},
		ReplayProtection: true, Now: func() time.Time { return now },
	})
	if rr := sendSignedSummary(handler, token, xmlText); rr.Code != 500 {
		t.Fatalf("business failure status=%d", rr.Code)
	}
	if rr := sendSignedSummary(handler, token, xmlText); rr.Code != 400 || svc.calls != 1 {
		t.Fatalf("retry reused MessageID: status=%d calls=%d", rr.Code, svc.calls)
	}
}
