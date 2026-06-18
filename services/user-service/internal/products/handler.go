package products

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
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

// Helper to get UMKM Profile ID for current user
func (h *Handler) getUMKMProfileID(r *http.Request) (string, error) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok || user.Role != "UMKM" {
		return "", errors.New("unauthorized or not UMKM")
	}

	var profileID string
	err := h.DB.QueryRow(r.Context(), `SELECT id FROM user_service.umkm_profiles WHERE user_id = $1`, user.ID).Scan(&profileID)
	return profileID, err
}

func (h *Handler) ListProducts(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getUMKMProfileID(r)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSON(w, http.StatusOK, map[string]any{"products": []any{}})
			return
		}
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	rows, err := h.DB.Query(r.Context(), `
		SELECT id, name, description, category, price, stock, image_url, created_at, updated_at
		FROM user_service.products
		WHERE umkm_profile_id = $1
		ORDER BY created_at DESC
	`, profileID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to fetch products"})
		return
	}
	defer rows.Close()

	var products []map[string]any
	for rows.Next() {
		var id, name string
		var desc, category, imageURL *string
		var price float64
		var stock int
		var createdAt, updatedAt any

		if err := rows.Scan(&id, &name, &desc, &category, &price, &stock, &imageURL, &createdAt, &updatedAt); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to scan products"})
			return
		}

		products = append(products, map[string]any{
			"id":          id,
			"name":        name,
			"description": desc,
			"category":    category,
			"price":       price,
			"stock":       stock,
			"image_url":   imageURL,
			"created_at":  createdAt,
			"updated_at":  updatedAt,
		})
	}

	if products == nil {
		products = []map[string]any{}
	}

	writeJSON(w, http.StatusOK, map[string]any{"products": products})
}

func (h *Handler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getUMKMProfileID(r)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Profile UMKM tidak ditemukan"})
		return
	}

	var req ProductPayload
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Request body tidak valid"})
		return
	}

	if strings.TrimSpace(req.Name) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Nama produk wajib diisi"})
		return
	}

	id := uuid.NewString()
	_, err = h.DB.Exec(r.Context(), `
		INSERT INTO user_service.products (id, umkm_profile_id, name, description, category, price, stock, image_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, id, profileID, trim(req.Name), trim(req.Description), trim(req.Category), req.Price, req.Stock, trim(req.ImageURL))

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal menyimpan produk"})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"message": "Produk berhasil dibuat", "id": id})
}

func (h *Handler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getUMKMProfileID(r)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Profile UMKM tidak ditemukan"})
		return
	}

	productID := chi.URLParam(r, "id")
	if productID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ID produk diperlukan"})
		return
	}

	var req ProductPayload
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Request body tidak valid"})
		return
	}

	res, err := h.DB.Exec(r.Context(), `
		UPDATE user_service.products
		SET name = $1, description = $2, category = $3, price = $4, stock = $5, image_url = $6, updated_at = NOW()
		WHERE id = $7 AND umkm_profile_id = $8
	`, trim(req.Name), trim(req.Description), trim(req.Category), req.Price, req.Stock, trim(req.ImageURL), productID, profileID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal update produk"})
		return
	}

	if res.RowsAffected() == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Produk tidak ditemukan"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Produk berhasil diupdate"})
}

func (h *Handler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	profileID, err := h.getUMKMProfileID(r)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Profile UMKM tidak ditemukan"})
		return
	}

	productID := chi.URLParam(r, "id")
	if productID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "ID produk diperlukan"})
		return
	}

	res, err := h.DB.Exec(r.Context(), `
		DELETE FROM user_service.products
		WHERE id = $1 AND umkm_profile_id = $2
	`, productID, profileID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal hapus produk"})
		return
	}

	if res.RowsAffected() == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Produk tidak ditemukan"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Produk berhasil dihapus"})
}

func trim(s string) *string {
	t := strings.TrimSpace(s)
	if t == "" {
		return nil
	}
	return &t
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}
