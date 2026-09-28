package soap

import (
	"errors"
	"sync"
	"time"
)

const DefaultReplayCacheMaxEntries = 4096

var (
	ErrReplayDetected  = errors.New("SOAP MessageID has already been used")
	ErrReplayCacheFull = errors.New("SOAP replay cache is full")
)

// ReplayCache atomically records a verified MessageID for its acceptance window.
type ReplayCache interface {
	CheckAndStore(messageID string, expiresAt, now time.Time) error
}

type inMemoryReplayCache struct {
	mu         sync.Mutex
	entries    map[string]time.Time
	maxEntries int
}

func NewInMemoryReplayCache(maxEntries int) ReplayCache {
	return &inMemoryReplayCache{entries: make(map[string]time.Time), maxEntries: maxEntries}
}

func (c *inMemoryReplayCache) CheckAndStore(messageID string, expiresAt, now time.Time) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	for id, expiry := range c.entries {
		if now.After(expiry) {
			delete(c.entries, id)
		}
	}
	if _, exists := c.entries[messageID]; exists {
		return ErrReplayDetected
	}
	if len(c.entries) >= c.maxEntries {
		return ErrReplayCacheFull
	}
	c.entries[messageID] = expiresAt
	return nil
}
