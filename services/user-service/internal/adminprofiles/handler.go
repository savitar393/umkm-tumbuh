package adminprofiles

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	DB *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{DB: db}
}

func (h *Handler) GetProfileByUserID(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	role := r.URL.Query().Get("role")

	if userID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "userID required"})
		return
	}

	switch role {
	case "UMKM":
		profile, err := h.getUMKMProfile(r, userID)
		if err != nil {
			handleProfileError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"profile": profile})

	case "MITRA":
		profile, err := h.getMitraProfile(r, userID)
		if err != nil {
			handleProfileError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"profile": profile})

	default:
		profile, umkmErr := h.getUMKMProfile(r, userID)
		if umkmErr == nil {
			writeJSON(w, http.StatusOK, map[string]any{"profile": profile})
			return
		}

		profile, mitraErr := h.getMitraProfile(r, userID)
		if mitraErr == nil {
			writeJSON(w, http.StatusOK, map[string]any{"profile": profile})
			return
		}

		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Profil tidak ditemukan."})
	}
}

func (h *Handler) getUMKMProfile(r *http.Request, userID string) (map[string]any, error) {
	row := h.DB.QueryRow(r.Context(), `
		SELECT id, user_id, business_name, business_category, business_description,
		       owner_name, phone_number, address, city, province, created_at, updated_at
		FROM user_service.umkm_profiles
		WHERE user_id = $1
	`, userID)

	return scanProfile(row)
}

func (h *Handler) getMitraProfile(r *http.Request, userID string) (map[string]any, error) {
	row := h.DB.QueryRow(r.Context(), `
		SELECT id, user_id, organization_name, organization_type, description,
		       contact_person, phone_number, address, city, province, created_at, updated_at
		FROM user_service.mitra_profiles
		WHERE user_id = $1
	`, userID)

	return scanProfile(row)
}

type scanner interface {
	Scan(dest ...any) error
}

func scanProfile(row scanner) (map[string]any, error) {
	var (
		id        string
		userID    string
		name      string
		category  *string
		desc      *string
		person    *string
		phone     *string
		address   *string
		city      *string
		province  *string
		createdAt any
		updatedAt any
	)

	if err := row.Scan(
		&id,
		&userID,
		&name,
		&category,
		&desc,
		&person,
		&phone,
		&address,
		&city,
		&province,
		&createdAt,
		&updatedAt,
	); err != nil {
		return nil, err
	}

	return map[string]any{
		"id":           id,
		"user_id":      userID,
		"name":         name,
		"category":     category,
		"description":  desc,
		"person":       person,
		"phone_number": phone,
		"address":      address,
		"city":         city,
		"province":     province,
		"created_at":   createdAt,
		"updated_at":   updatedAt,
	}, nil
}

func handleProfileError(w http.ResponseWriter, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Profil belum dibuat.",
		})
		return
	}

	writeJSON(w, http.StatusInternalServerError, map[string]string{
		"error": "Gagal mengambil profil.",
	})
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}
