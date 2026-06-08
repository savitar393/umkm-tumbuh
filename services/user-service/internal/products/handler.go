package products

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

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

type ProductRequest struct {
	Name        string  `json:"name"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Status      string  `json:"status"`
	Legality    string  `json:"legality"`
}

type Product struct {
	ID          string    `json:"id"`
	UMKMID      string    `json:"umkm_id"`
	Name        string    `json:"name"`
	CategoryID  string    `json:"category_id"`
	Category    string    `json:"category"`
	Description *string   `json:"description"`
	Price       float64   `json:"price"`
	Status      string    `json:"status"`
	Legality    *string   `json:"legality"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	if user.Role != "UMKM" {
		writeError(w, http.StatusForbidden, "Hanya akun UMKM yang dapat mengakses produk.")
		return
	}

	umkmID, err := h.getUMKMID(r.Context(), user.ID)
	if err != nil {
		handleUMKMError(w, err)
		return
	}

	rows, err := h.DB.Query(r.Context(), `
		SELECT
			p.produk_id,
			p.umkm_id,
			p.nama_produk,
			k.kategori_produk_id,
			k.nama_kategori_produk,
			p.deskripsi_produk,
			p.harga::float8,
			p.status_produk,
			p.legalitas_produk,
			p.created_at,
			p.updated_at
		FROM user_mgmt.master_produkumkm p
		JOIN ref.ref_kategoriproduk k
			ON k.kategori_produk_id = p.kategori_produk_id
		WHERE p.umkm_id = $1
		  AND p.is_deleted = FALSE
		ORDER BY p.created_at DESC
	`, umkmID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mengambil produk.")
		return
	}
	defer rows.Close()

	products := make([]Product, 0)

	for rows.Next() {
		product, err := scanProduct(rows)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Gagal membaca data produk.")
			return
		}

		products = append(products, product)
	}

	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal membaca data produk.")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"products": products})
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	if user.Role != "UMKM" {
		writeError(w, http.StatusForbidden, "Hanya akun UMKM yang dapat membuat produk.")
		return
	}

	var req ProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Request body tidak valid.")
		return
	}

	if err := validateProductRequest(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	product, err := h.createProduct(r.Context(), user.ID, req)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "Profil UMKM belum dibuat.")
			return
		}

		writeError(w, http.StatusInternalServerError, "Gagal membuat produk.")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"product": product})
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	if user.Role != "UMKM" {
		writeError(w, http.StatusForbidden, "Hanya akun UMKM yang dapat mengubah produk.")
		return
	}

	productID := chi.URLParam(r, "productID")
	if strings.TrimSpace(productID) == "" {
		writeError(w, http.StatusBadRequest, "ID produk tidak valid.")
		return
	}

	var req ProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Request body tidak valid.")
		return
	}

	if err := validateProductRequest(req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	product, err := h.updateProduct(r.Context(), user.ID, productID, req)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "Produk tidak ditemukan.")
			return
		}

		writeError(w, http.StatusInternalServerError, "Gagal mengubah produk.")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"product": product})
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	if user.Role != "UMKM" {
		writeError(w, http.StatusForbidden, "Hanya akun UMKM yang dapat menghapus produk.")
		return
	}

	productID := chi.URLParam(r, "productID")
	if strings.TrimSpace(productID) == "" {
		writeError(w, http.StatusBadRequest, "ID produk tidak valid.")
		return
	}

	umkmID, err := h.getUMKMID(r.Context(), user.ID)
	if err != nil {
		handleUMKMError(w, err)
		return
	}

	tag, err := h.DB.Exec(r.Context(), `
		UPDATE user_mgmt.master_produkumkm
		SET
			status_produk = 'NONAKTIF',
			is_deleted = TRUE,
			deleted_at = NOW(),
			updated_at = NOW()
		WHERE produk_id = $1
		  AND umkm_id = $2
		  AND is_deleted = FALSE
	`, productID, umkmID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal menghapus produk.")
		return
	}

	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "Produk tidak ditemukan.")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Produk berhasil dihapus."})
}

func (h *Handler) createProduct(ctx context.Context, accountID string, req ProductRequest) (Product, error) {
	tx, err := h.DB.Begin(ctx)
	if err != nil {
		return Product{}, err
	}
	defer tx.Rollback(ctx)

	umkmID, err := getUMKMIDTx(ctx, tx, accountID)
	if err != nil {
		return Product{}, err
	}

	categoryID, err := ensureProductCategory(ctx, tx, req.Category)
	if err != nil {
		return Product{}, err
	}

	productID := newID("PRD")
	status := normalizeStatus(req.Status)

	_, err = tx.Exec(ctx, `
		INSERT INTO user_mgmt.master_produkumkm (
			produk_id, umkm_id, kategori_produk_id,
			nama_produk, deskripsi_produk, harga,
			status_produk, legalitas_produk
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, productID, umkmID, categoryID, trim(req.Name), nullableTrim(req.Description), req.Price, status, nullableTrim(req.Legality))
	if err != nil {
		return Product{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Product{}, err
	}

	return h.getProductByID(ctx, umkmID, productID)
}

func (h *Handler) updateProduct(ctx context.Context, accountID string, productID string, req ProductRequest) (Product, error) {
	tx, err := h.DB.Begin(ctx)
	if err != nil {
		return Product{}, err
	}
	defer tx.Rollback(ctx)

	umkmID, err := getUMKMIDTx(ctx, tx, accountID)
	if err != nil {
		return Product{}, err
	}

	categoryID, err := ensureProductCategory(ctx, tx, req.Category)
	if err != nil {
		return Product{}, err
	}

	status := normalizeStatus(req.Status)

	tag, err := tx.Exec(ctx, `
		UPDATE user_mgmt.master_produkumkm
		SET
			kategori_produk_id = $3,
			nama_produk = $4,
			deskripsi_produk = $5,
			harga = $6,
			status_produk = $7,
			legalitas_produk = $8,
			is_deleted = FALSE,
			deleted_at = NULL,
			updated_at = NOW()
		WHERE produk_id = $1
		  AND umkm_id = $2
		  AND is_deleted = FALSE
	`, productID, umkmID, categoryID, trim(req.Name), nullableTrim(req.Description), req.Price, status, nullableTrim(req.Legality))
	if err != nil {
		return Product{}, err
	}

	if tag.RowsAffected() == 0 {
		return Product{}, pgx.ErrNoRows
	}

	if err := tx.Commit(ctx); err != nil {
		return Product{}, err
	}

	return h.getProductByID(ctx, umkmID, productID)
}

func (h *Handler) getProductByID(ctx context.Context, umkmID string, productID string) (Product, error) {
	row := h.DB.QueryRow(ctx, `
		SELECT
			p.produk_id,
			p.umkm_id,
			p.nama_produk,
			k.kategori_produk_id,
			k.nama_kategori_produk,
			p.deskripsi_produk,
			p.harga::float8,
			p.status_produk,
			p.legalitas_produk,
			p.created_at,
			p.updated_at
		FROM user_mgmt.master_produkumkm p
		JOIN ref.ref_kategoriproduk k
			ON k.kategori_produk_id = p.kategori_produk_id
		WHERE p.produk_id = $1
		  AND p.umkm_id = $2
		  AND p.is_deleted = FALSE
		LIMIT 1
	`, productID, umkmID)

	return scanProduct(row)
}

func (h *Handler) getUMKMID(ctx context.Context, accountID string) (string, error) {
	row := h.DB.QueryRow(ctx, `
		SELECT u.umkm_id
		FROM user_mgmt.master_pelakuumkm p
		JOIN user_mgmt.master_umkm u
			ON u.pelaku_umkm_id = p.pelaku_umkm_id
		WHERE p.akun_id = $1
		  AND p.is_deleted = FALSE
		  AND u.is_deleted = FALSE
		LIMIT 1
	`, accountID)

	var umkmID string
	err := row.Scan(&umkmID)
	return umkmID, err
}

func getUMKMIDTx(ctx context.Context, tx pgx.Tx, accountID string) (string, error) {
	row := tx.QueryRow(ctx, `
		SELECT u.umkm_id
		FROM user_mgmt.master_pelakuumkm p
		JOIN user_mgmt.master_umkm u
			ON u.pelaku_umkm_id = p.pelaku_umkm_id
		WHERE p.akun_id = $1
		  AND p.is_deleted = FALSE
		  AND u.is_deleted = FALSE
		LIMIT 1
	`, accountID)

	var umkmID string
	err := row.Scan(&umkmID)
	return umkmID, err
}

func ensureProductCategory(ctx context.Context, tx pgx.Tx, categoryName string) (string, error) {
	categoryName = trim(categoryName)
	if categoryName == "" {
		categoryName = "Umum"
	}

	var categoryID string
	err := tx.QueryRow(ctx, `
		SELECT kategori_produk_id
		FROM ref.ref_kategoriproduk
		WHERE lower(nama_kategori_produk) = lower($1)
		LIMIT 1
	`, categoryName).Scan(&categoryID)
	if err == nil {
		return categoryID, nil
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}

	categoryID = newID("KPR")

	err = tx.QueryRow(ctx, `
		INSERT INTO ref.ref_kategoriproduk (
			kategori_produk_id, nama_kategori_produk
		)
		VALUES ($1, $2)
		ON CONFLICT (nama_kategori_produk)
		DO UPDATE SET nama_kategori_produk = EXCLUDED.nama_kategori_produk
		RETURNING kategori_produk_id
	`, categoryID, categoryName).Scan(&categoryID)

	return categoryID, err
}

type productScanner interface {
	Scan(dest ...any) error
}

func scanProduct(row productScanner) (Product, error) {
	var (
		product     Product
		description sql.NullString
		legality    sql.NullString
	)

	err := row.Scan(
		&product.ID,
		&product.UMKMID,
		&product.Name,
		&product.CategoryID,
		&product.Category,
		&description,
		&product.Price,
		&product.Status,
		&legality,
		&product.CreatedAt,
		&product.UpdatedAt,
	)
	if err != nil {
		return Product{}, err
	}

	if description.Valid {
		product.Description = &description.String
	}

	if legality.Valid {
		product.Legality = &legality.String
	}

	return product, nil
}

func validateProductRequest(req ProductRequest) error {
	if trim(req.Name) == "" {
		return errors.New("Nama produk wajib diisi.")
	}

	if req.Price < 0 {
		return errors.New("Harga produk tidak boleh negatif.")
	}

	status := normalizeStatus(req.Status)
	if status != "AKTIF" && status != "DRAFT" && status != "NONAKTIF" {
		return errors.New("Status produk tidak valid.")
	}

	return nil
}

func normalizeStatus(status string) string {
	status = strings.ToUpper(strings.TrimSpace(status))
	if status == "" {
		return "AKTIF"
	}

	return status
}

func trim(value string) string {
	return strings.TrimSpace(value)
}

func nullableTrim(value string) any {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}

	return value
}

func newID(prefix string) string {
	raw := strings.ToUpper(strings.ReplaceAll(uuid.NewString(), "-", ""))
	if len(raw) > 18 {
		raw = raw[:18]
	}

	return prefix + raw
}

func handleUMKMError(w http.ResponseWriter, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "Profil UMKM belum dibuat.")
		return
	}

	writeError(w, http.StatusInternalServerError, "Gagal mengambil profil UMKM.")
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
