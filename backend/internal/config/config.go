package config

import (
	"os"
	"path/filepath"
)

type Config struct {
	Port         string
	UploadDir    string
	OutputDir    string
	PostgresURL  string
	RedisAddr    string
	BaseDomain   string
}

func LoadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = filepath.Join(".", "uploads")
	}

	outputDir := os.Getenv("OUTPUT_DIR")
	if outputDir == "" {
		outputDir = filepath.Join(".", "outputs")
	}

	baseDomain := os.Getenv("BASE_DOMAIN")
	if baseDomain == "" {
		baseDomain = "http://localhost:" + port
	}

	_ = os.MkdirAll(uploadDir, 0755)
	_ = os.MkdirAll(outputDir, 0755)

	return &Config{
		Port:        port,
		UploadDir:   uploadDir,
		OutputDir:   outputDir,
		PostgresURL: os.Getenv("POSTGRES_URL"),
		RedisAddr:   os.Getenv("REDIS_ADDR"),
		BaseDomain:  baseDomain,
	}
}
