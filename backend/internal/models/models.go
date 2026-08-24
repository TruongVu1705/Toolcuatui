package models

import "time"

// URLShortener represents a shortened URL mapping with analytics
type URLShortener struct {
	ID          string    `json:"id"`
	ShortCode   string    `json:"short_code"`
	OriginalURL string    `json:"original_url"`
	ClicksCount int64     `json:"clicks_count"`
	CreatedAt   time.Time `json:"created_at"`
}

// MediaInfo represents metadata extracted from social videos/audios
type MediaInfo struct {
	Title       string `json:"title"`
	Uploader    string `json:"uploader"`
	Duration    string `json:"duration"`
	Thumbnail   string `json:"thumbnail"`
	DownloadURL string `json:"download_url"`
	Type        string `json:"type"`
}

// TaskRecord represents an asynchronous conversion or media processing task
type TaskRecord struct {
	ID        string    `json:"id"`
	TaskType  string    `json:"task_type"`
	Status    string    `json:"status"` // pending, processing, completed, failed
	Progress  int       `json:"progress"`
	ResultURL string    `json:"result_url"`
	ErrorMsg  string    `json:"error_msg,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
