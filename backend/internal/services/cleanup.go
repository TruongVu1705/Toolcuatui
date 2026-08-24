package services

import (
	"log"
	"os"
	"path/filepath"
	"time"
)

// StartBackgroundCleaner runs a goroutine every 15 mins to delete old uploads/outputs files
func StartBackgroundCleaner(uploadDir, outputDir string) {
	go func() {
		ticker := time.NewTicker(15 * time.Minute)
		defer ticker.Stop()

		for range ticker.C {
			log.Println("[Cleaner Worker] Running scheduled file cleanup...")
			cleanDirectory(uploadDir, 1*time.Hour)
			cleanDirectory(outputDir, 1*time.Hour)
		}
	}()
}

func cleanDirectory(dirPath string, maxAge time.Duration) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return
	}

	now := time.Now()
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		filePath := filepath.Join(dirPath, entry.Name())
		info, err := entry.Info()
		if err != nil {
			continue
		}

		if now.Sub(info.ModTime()) > maxAge {
			_ = os.Remove(filePath)
			log.Printf("[Cleaner Worker] Deleted expired file: %s\n", entry.Name())
		}
	}
}
