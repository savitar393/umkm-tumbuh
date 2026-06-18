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

func Error(w http.ResponseWriter, statusCode int, message string, details ...any) {
	resp := map[string]any{
		"success": false,
		"message": message,
	}
	// Only add details if explicitly provided (not nil)
	if len(details) > 0 && details[0] != nil {
		resp["details"] = details[0]
	}
	JSON(w, statusCode, resp)
}

func Success(w http.ResponseWriter, statusCode int, data any, message string) {
	JSON(w, statusCode, map[string]any{
		"success": true,
		"message": message,
		"data":    data,
	})
}
