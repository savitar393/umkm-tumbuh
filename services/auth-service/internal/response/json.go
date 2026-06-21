package response

import (
	"encoding/json"
	"net/http"
)

func JSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	if err := json.NewEncoder(w).Encode(payload); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
}

func Error(w http.ResponseWriter, statusCode int, message string) {
	JSON(w, statusCode, map[string]string{
		"error": message,
	})
}

func ErrorWithCode(w http.ResponseWriter, statusCode int, code string, message string) {
	JSON(w, statusCode, map[string]string{
		"error":      message,
		"error_code": code,
	})
}
