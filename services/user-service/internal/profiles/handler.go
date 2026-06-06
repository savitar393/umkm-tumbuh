package profiles

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/middleware"
)

type Handler struct {
	DB *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{DB: db}
}

func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	switch user.Role {
	case "UMKM":
		profile, err := h.getUMKMProfile(r, user.ID)
		if err != nil {
			handleProfileError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"profile": profile})

	case "MITRA":
		profile, err := h.getMitraProfile(r, user.ID)
		if err != nil {
			handleProfileError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"profile": profile})

	default:
		writeJSON(w, http.StatusForbidden, map[string]string{
			"error": "Role ini tidak memiliki profil pengguna.",
		})
	}
}

func (h *Handler) UpsertMe(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	var req UpsertProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Request body tidak valid."})
		return
	}

	switch user.Role {
	case "UMKM":
		if strings.TrimSpace(req.BusinessName) == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Nama usaha wajib diisi."})
			return
		}

		profile, err := h.upsertUMKMProfile(r, user.ID, req)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal menyimpan profil UMKM."})
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{"profile": profile})

	case "MITRA":
		if strings.TrimSpace(req.OrganizationName) == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Nama organisasi wajib diisi."})
			return
		}

		profile, err := h.upsertMitraProfile(r, user.ID, req)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal menyimpan profil Mitra."})
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{"profile": profile})

	default:
		writeJSON(w, http.StatusForbidden, map[string]string{
			"error": "Role ini tidak dapat mengelola profil.",
		})
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

func (h *Handler) upsertUMKMProfile(r *http.Request, userID string, req UpsertProfileRequest) (map[string]any, error) {
	profileID := uuid.NewString()

	row := h.DB.QueryRow(r.Context(), `
		INSERT INTO user_service.umkm_profiles (
			id, user_id, business_name, business_category, business_description,
			owner_name, phone_number, address, city, province
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (user_id)
		DO UPDATE SET
			business_name = EXCLUDED.business_name,
			business_category = EXCLUDED.business_category,
			business_description = EXCLUDED.business_description,
			owner_name = EXCLUDED.owner_name,
			phone_number = EXCLUDED.phone_number,
			address = EXCLUDED.address,
			city = EXCLUDED.city,
			province = EXCLUDED.province,
			updated_at = NOW()
		RETURNING id, user_id, business_name, business_category, business_description,
		          owner_name, phone_number, address, city, province, created_at, updated_at
	`,
		profileID,
		userID,
		trim(req.BusinessName),
		trim(req.BusinessCategory),
		trim(req.BusinessDescription),
		trim(req.OwnerName),
		trim(req.PhoneNumber),
		trim(req.Address),
		trim(req.City),
		trim(req.Province),
	)

	return scanProfile(row)
}

func (h *Handler) upsertMitraProfile(r *http.Request, userID string, req UpsertProfileRequest) (map[string]any, error) {
	profileID := uuid.NewString()

	row := h.DB.QueryRow(r.Context(), `
		INSERT INTO user_service.mitra_profiles (
			id, user_id, organization_name, organization_type, description,
			contact_person, phone_number, address, city, province
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (user_id)
		DO UPDATE SET
			organization_name = EXCLUDED.organization_name,
			organization_type = EXCLUDED.organization_type,
			description = EXCLUDED.description,
			contact_person = EXCLUDED.contact_person,
			phone_number = EXCLUDED.phone_number,
			address = EXCLUDED.address,
			city = EXCLUDED.city,
			province = EXCLUDED.province,
			updated_at = NOW()
		RETURNING id, user_id, organization_name, organization_type, description,
		          contact_person, phone_number, address, city, province, created_at, updated_at
	`,
		profileID,
		userID,
		trim(req.OrganizationName),
		trim(req.OrganizationType),
		trim(req.Description),
		trim(req.ContactPerson),
		trim(req.PhoneNumber),
		trim(req.Address),
		trim(req.City),
		trim(req.Province),
	)

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

func trim(value string) string {
	return strings.TrimSpace(value)
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}
