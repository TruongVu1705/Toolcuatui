package db

import (
	"crypto/rand"
	"math/big"
	"sync"
	"time"
	"tool-platform/internal/models"
)

const base62Chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

type MemoryStore struct {
	mu    sync.RWMutex
	urls  map[string]*models.URLShortener
	tasks map[string]*models.TaskRecord
}

var Store = &MemoryStore{
	urls:  make(map[string]*models.URLShortener),
	tasks: make(map[string]*models.TaskRecord),
}

// GenerateBase62Code creates a random 6-character short code
func GenerateBase62Code(length int) string {
	b := make([]byte, length)
	for i := range b {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(base62Chars))))
		b[i] = base62Chars[n.Int64()]
	}
	return string(b)
}

func (s *MemoryStore) SaveURL(originalURL, customAlias string) (*models.URLShortener, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	shortCode := customAlias
	if shortCode == "" {
		shortCode = GenerateBase62Code(6)
	}

	record := &models.URLShortener{
		ID:          GenerateBase62Code(12),
		ShortCode:   shortCode,
		OriginalURL: originalURL,
		ClicksCount: 0,
		CreatedAt:   time.Now(),
	}

	s.urls[shortCode] = record
	return record, nil
}

func (s *MemoryStore) GetURL(shortCode string) (*models.URLShortener, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	record, found := s.urls[shortCode]
	if found {
		record.ClicksCount++
	}
	return record, found
}
