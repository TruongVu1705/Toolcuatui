package main

import (
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"tool-platform/internal/config"
	"tool-platform/internal/handlers"
	"tool-platform/internal/services"
)

func main() {
	cfg := config.LoadConfig()
	h := handlers.NewHandler(cfg)

	// Start background cleanup worker
	services.StartBackgroundCleaner(cfg.UploadDir, cfg.OutputDir)

	mux := http.NewServeMux()

	// REST API Routes
	mux.HandleFunc("/api/v1/health", h.HealthCheckHandler)
	mux.HandleFunc("/api/v1/shorten", h.ShortenURLHandler)
	mux.HandleFunc("/s/", h.RedirectHandler)
	mux.HandleFunc("/api/v1/qr/generate", h.GenerateQRHandler)
	mux.HandleFunc("/api/v1/pdf/convert-word", h.ConvertPDFHandler)
	mux.HandleFunc("/api/v1/pdf/convert-pptx", h.ConvertPDFHandler)
	mux.HandleFunc("/api/v1/media/download-info", h.MediaDownloadInfoHandler)
	mux.HandleFunc("/api/v1/image/remove-bg", h.RemoveBackgroundHandler)

	// Static Frontend File Server
	frontendDir := filepath.Join("..", "frontend")
	fs := http.FileServer(http.Dir(frontendDir))
	mux.Handle("/", fs)

	// Wrap with CORS & Logging Middleware
	handler := corsMiddleware(loggingMiddleware(mux))

	serverAddr := ":" + cfg.Port
	fmt.Printf("\n🚀 [OmniTool Hub Backend Golang] Server running at http://localhost%s\n", serverAddr)
	fmt.Printf("📁 Static frontend serving from: %s\n", frontendDir)

	if err := http.ListenAndServe(serverAddr, handler); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[%s] %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}
