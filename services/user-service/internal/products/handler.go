package products

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/middleware"
	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/storage"
)

type Handler struct {
	DB      *pgxpool.Pool
	Storage *storage.Client
}

func NewHandler(db *pgxpool.Pool) *Handler {
	storageClient, err := storage.NewFromEnv(context.Background())
	if err != nil {
		log.Printf("object storage disabled: %v", err)
	}

	return &Handler{
		DB:      db,
		Storage: storageClient,
	}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUMKMUser(w, r)
	if !ok {
		return
	}

	umkmID, err := h.getUMKMID(r.Context(), user.ID)
	if err != nil {
		handleError(w, err, "Gagal mengambil data UMKM.")
		return
	}

	status := strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("status")))
	search := strings.TrimSpace(r.URL.Query().Get("q"))

	query := `
		SELECT
			p.produk_id,
			p.umkm_id,
			p.kategori_produk_id,
			k.nama_kategori_produk,
			p.nama_produk,
			p.deskripsi_produk,
			p.harga,
			p.stok_saat_ini,
			p.status_produk,
			p.legalitas_produk,
			p.thumbnail_object_key,
			p.thumbnail_url,
			p.thumbnail_content_type,
			p.thumbnail_size_bytes,
			p.thumbnail_updated_at,
			p.created_at,
			p.updated_at
		FROM user_mgmt.master_produkumkm p
		JOIN ref.ref_kategoriproduk k
			ON k.kategori_produk_id = p.kategori_produk_id
		WHERE p.umkm_id = $1
		  AND p.is_deleted = FALSE
	`

	args := []any{umkmID}
	argPos := 2

	if status != "" && status != "ALL" {
		args = append(args, status)
		query += fmt.Sprintf(" AND p.status_produk = $%d", argPos)
		argPos++
	}

	if search != "" {
		args = append(args, "%"+search+"%")
		query += fmt.Sprintf(" AND p.nama_produk ILIKE $%d", argPos)
		argPos++
	}

	query += " ORDER BY p.created_at DESC"

	rows, err := h.DB.Query(r.Context(), query, args...)
	if err != nil {
		handleError(w, err, "Gagal mengambil daftar produk.")
		return
	}
	defer rows.Close()

	products := []ProductResponse{}

	for rows.Next() {
		product, err := scanProduct(rows)
		if err != nil {
			handleError(w, err, "Gagal membaca data produk.")
			return
		}

		products = append(products, product)
	}

	if err := rows.Err(); err != nil {
		handleError(w, err, "Gagal membaca daftar produk.")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"products": products})
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUMKMUser(w, r)
	if !ok {
		return
	}

	var req CreateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Request body tidak valid."})
		return
	}

	if err := validateCreateRequest(req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	umkmID, err := h.getUMKMID(r.Context(), user.ID)
	if err != nil {
		handleError(w, err, "Profil UMKM belum dibuat.")
		return
	}

	tx, err := h.DB.Begin(r.Context())
	if err != nil {
		handleError(w, err, "Gagal memulai transaksi.")
		return
	}
	defer tx.Rollback(r.Context())

	categoryID, err := ensureProductCategory(r.Context(), tx, req.CategoryName)
	if err != nil {
		handleError(w, err, "Gagal menyiapkan kategori produk.")
		return
	}

	productID := newID("PRD")
	status := normalizeProductStatus(req.Status)
	description := nullableTrim(req.Description)
	legalitas := nullableTrim(req.Legalitas)

	_, err = tx.Exec(r.Context(), `
		INSERT INTO user_mgmt.master_produkumkm (
			produk_id, umkm_id, kategori_produk_id, nama_produk,
			deskripsi_produk, harga, stok_saat_ini, status_produk, legalitas_produk
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, productID, umkmID, categoryID, strings.TrimSpace(req.Name),
		description, req.Price, req.InitialStock, status, legalitas)
	if err != nil {
		handleError(w, err, "Gagal menyimpan produk.")
		return
	}

	if req.InitialStock > 0 {
		_, err = tx.Exec(r.Context(), `
			INSERT INTO user_mgmt.transaksi_stokproduk (
				stok_mutasi_id, produk_id, umkm_id, tipe_mutasi,
				jumlah_perubahan, stok_sebelum, stok_sesudah,
				referensi_tipe, referensi_id, catatan, created_by_akun_id
			)
			VALUES ($1, $2, $3, 'RESTOCK', $4, 0, $4, 'PRODUCT_CREATE', $2, 'Stok awal produk', $5)
		`, newID("STK"), productID, umkmID, req.InitialStock, user.ID)
		if err != nil {
			handleError(w, err, "Gagal mencatat stok awal.")
			return
		}
	}

	if err := tx.Commit(r.Context()); err != nil {
		handleError(w, err, "Gagal menyimpan transaksi produk.")
		return
	}

	product, err := h.findProductByID(r.Context(), umkmID, productID)
	if err != nil {
		handleError(w, err, "Produk tersimpan, tetapi gagal dibaca kembali.")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"product": product})
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUMKMUser(w, r)
	if !ok {
		return
	}

	umkmID, err := h.getUMKMID(r.Context(), user.ID)
	if err != nil {
		handleError(w, err, "Gagal mengambil data UMKM.")
		return
	}

	productID := chi.URLParam(r, "id")

	product, err := h.findProductByID(r.Context(), umkmID, productID)
	if err != nil {
		handleError(w, err, "Produk tidak ditemukan.")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"product": product})
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUMKMUser(w, r)
	if !ok {
		return
	}

	var req UpdateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Request body tidak valid."})
		return
	}

	if err := validateUpdateRequest(req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	umkmID, err := h.getUMKMID(r.Context(), user.ID)
	if err != nil {
		handleError(w, err, "Gagal mengambil data UMKM.")
		return
	}

	tx, err := h.DB.Begin(r.Context())
	if err != nil {
		handleError(w, err, "Gagal memulai transaksi.")
		return
	}
	defer tx.Rollback(r.Context())

	categoryID, err := ensureProductCategory(r.Context(), tx, req.CategoryName)
	if err != nil {
		handleError(w, err, "Gagal menyiapkan kategori produk.")
		return
	}

	productID := chi.URLParam(r, "id")
	status := normalizeProductStatus(req.Status)

	tag, err := tx.Exec(r.Context(), `
		UPDATE user_mgmt.master_produkumkm
		SET
			kategori_produk_id = $3,
			nama_produk = $4,
			deskripsi_produk = $5,
			harga = $6,
			status_produk = $7,
			legalitas_produk = $8,
			updated_at = NOW()
		WHERE produk_id = $1
		  AND umkm_id = $2
		  AND is_deleted = FALSE
	`, productID, umkmID, categoryID, strings.TrimSpace(req.Name),
		nullableTrim(req.Description), req.Price, status, nullableTrim(req.Legalitas))
	if err != nil {
		handleError(w, err, "Gagal memperbarui produk.")
		return
	}

	if tag.RowsAffected() == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Produk tidak ditemukan."})
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		handleError(w, err, "Gagal menyimpan perubahan produk.")
		return
	}

	product, err := h.findProductByID(r.Context(), umkmID, productID)
	if err != nil {
		handleError(w, err, "Produk diperbarui, tetapi gagal dibaca kembali.")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"product": product})
}

func (h *Handler) UpdateStock(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUMKMUser(w, r)
	if !ok {
		return
	}

	var req UpdateStockRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Request body tidak valid."})
		return
	}

	mutationType := strings.ToUpper(strings.TrimSpace(req.Type))
	if mutationType == "" {
		mutationType = "RESTOCK"
	}

	if mutationType != "RESTOCK" && mutationType != "ADJUSTMENT" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Tipe stok harus RESTOCK atau ADJUSTMENT."})
		return
	}

	if req.Quantity == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Quantity tidak boleh 0."})
		return
	}

	umkmID, err := h.getUMKMID(r.Context(), user.ID)
	if err != nil {
		handleError(w, err, "Gagal mengambil data UMKM.")
		return
	}

	productID := chi.URLParam(r, "id")

	tx, err := h.DB.Begin(r.Context())
	if err != nil {
		handleError(w, err, "Gagal memulai transaksi.")
		return
	}
	defer tx.Rollback(r.Context())

	var stockBefore int
	err = tx.QueryRow(r.Context(), `
		SELECT stok_saat_ini
		FROM user_mgmt.master_produkumkm
		WHERE produk_id = $1
		  AND umkm_id = $2
		  AND is_deleted = FALSE
		FOR UPDATE
	`, productID, umkmID).Scan(&stockBefore)
	if err != nil {
		handleError(w, err, "Produk tidak ditemukan.")
		return
	}

	stockAfter := stockBefore + req.Quantity
	if stockAfter < 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Stok tidak boleh menjadi negatif."})
		return
	}

	_, err = tx.Exec(r.Context(), `
		UPDATE user_mgmt.master_produkumkm
		SET stok_saat_ini = $3, updated_at = NOW()
		WHERE produk_id = $1
		  AND umkm_id = $2
	`, productID, umkmID, stockAfter)
	if err != nil {
		handleError(w, err, "Gagal memperbarui stok.")
		return
	}

	_, err = tx.Exec(r.Context(), `
		INSERT INTO user_mgmt.transaksi_stokproduk (
			stok_mutasi_id, produk_id, umkm_id, tipe_mutasi,
			jumlah_perubahan, stok_sebelum, stok_sesudah,
			referensi_tipe, referensi_id, catatan, created_by_akun_id
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'MANUAL_STOCK_UPDATE', $2, $8, $9)
	`, newID("STK"), productID, umkmID, mutationType,
		req.Quantity, stockBefore, stockAfter, nullableTrim(req.Note), user.ID)
	if err != nil {
		handleError(w, err, "Gagal mencatat mutasi stok.")
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		handleError(w, err, "Gagal menyimpan perubahan stok.")
		return
	}

	product, err := h.findProductByID(r.Context(), umkmID, productID)
	if err != nil {
		handleError(w, err, "Stok diperbarui, tetapi gagal membaca produk.")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"product": product})
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUMKMUser(w, r)
	if !ok {
		return
	}

	umkmID, err := h.getUMKMID(r.Context(), user.ID)
	if err != nil {
		handleError(w, err, "Gagal mengambil data UMKM.")
		return
	}

	productID := chi.URLParam(r, "id")

	tag, err := h.DB.Exec(r.Context(), `
		UPDATE user_mgmt.master_produkumkm
		SET is_deleted = TRUE, deleted_at = NOW(), updated_at = NOW()
		WHERE produk_id = $1
		  AND umkm_id = $2
		  AND is_deleted = FALSE
	`, productID, umkmID)
	if err != nil {
		handleError(w, err, "Gagal menghapus produk.")
		return
	}

	if tag.RowsAffected() == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Produk tidak ditemukan."})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Produk berhasil dihapus."})
}

func currentUMKMUser(w http.ResponseWriter, r *http.Request) (middleware.CurrentUser, bool) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return middleware.CurrentUser{}, false
	}

	if user.Role != "UMKM" {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "Fitur ini hanya untuk UMKM."})
		return middleware.CurrentUser{}, false
	}

	return user, true
}

func (h *Handler) getUMKMID(ctx context.Context, accountID string) (string, error) {
	var umkmID string

	err := h.DB.QueryRow(ctx, `
		SELECT u.umkm_id
		FROM user_mgmt.master_pelakuumkm p
		JOIN user_mgmt.master_umkm u
			ON u.pelaku_umkm_id = p.pelaku_umkm_id
		WHERE p.akun_id = $1
		  AND p.is_deleted = FALSE
		  AND u.is_deleted = FALSE
		LIMIT 1
	`, accountID).Scan(&umkmID)

	return umkmID, err
}

func (h *Handler) findProductByID(ctx context.Context, umkmID string, productID string) (ProductResponse, error) {
	row := h.DB.QueryRow(ctx, `
		SELECT
			p.produk_id,
			p.umkm_id,
			p.kategori_produk_id,
			k.nama_kategori_produk,
			p.nama_produk,
			p.deskripsi_produk,
			p.harga,
			p.stok_saat_ini,
			p.status_produk,
			p.legalitas_produk,
			p.thumbnail_object_key,
			p.thumbnail_url,
			p.thumbnail_content_type,
			p.thumbnail_size_bytes,
			p.thumbnail_updated_at,
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

func ensureProductCategory(ctx context.Context, tx pgx.Tx, categoryName string) (string, error) {
	categoryName = strings.TrimSpace(categoryName)
	if categoryName == "" {
		categoryName = "Umum"
	}

	var existingID string
	err := tx.QueryRow(ctx, `
		SELECT kategori_produk_id
		FROM ref.ref_kategoriproduk
		WHERE lower(nama_kategori_produk) = lower($1)
		LIMIT 1
	`, categoryName).Scan(&existingID)

	if err == nil {
		return existingID, nil
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}

	categoryID := makeIDFromName(categoryName)

	_, err = tx.Exec(ctx, `
		INSERT INTO ref.ref_kategoriproduk (
			kategori_produk_id, nama_kategori_produk
		)
		VALUES ($1, $2)
		ON CONFLICT (kategori_produk_id)
		DO UPDATE SET nama_kategori_produk = EXCLUDED.nama_kategori_produk
	`, categoryID, categoryName)

	return categoryID, err
}

type scanner interface {
	Scan(dest ...any) error
}

func scanProduct(row scanner) (ProductResponse, error) {
	var p ProductResponse

	err := row.Scan(
		&p.ID,
		&p.UMKMID,
		&p.CategoryID,
		&p.CategoryName,
		&p.Name,
		&p.Description,
		&p.Price,
		&p.Stock,
		&p.Status,
		&p.Legalitas,
		&p.ThumbnailObjectKey,
		&p.ThumbnailURL,
		&p.ThumbnailContentType,
		&p.ThumbnailSizeBytes,
		&p.ThumbnailUpdatedAt,
		&p.CreatedAt,
		&p.UpdatedAt,
	)

	return p, err
}

func validateCreateRequest(req CreateProductRequest) error {
	if strings.TrimSpace(req.Name) == "" {
		return errors.New("Nama produk wajib diisi.")
	}

	if req.Price < 0 {
		return errors.New("Harga produk tidak boleh negatif.")
	}

	if req.InitialStock < 0 {
		return errors.New("Stok awal tidak boleh negatif.")
	}

	return nil
}

func validateUpdateRequest(req UpdateProductRequest) error {
	if strings.TrimSpace(req.Name) == "" {
		return errors.New("Nama produk wajib diisi.")
	}

	if req.Price < 0 {
		return errors.New("Harga produk tidak boleh negatif.")
	}

	return nil
}

func normalizeProductStatus(status string) string {
	status = strings.ToUpper(strings.TrimSpace(status))

	switch status {
	case "DRAFT", "NONAKTIF":
		return status
	default:
		return "AKTIF"
	}
}

func nullableTrim(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return &value
}

func newID(prefix string) string {
	raw := strings.ToUpper(strings.ReplaceAll(uuid.NewString(), "-", ""))
	return prefix + raw[:16]
}

func makeIDFromName(value string) string {
	value = strings.ToUpper(strings.TrimSpace(value))
	value = strings.ReplaceAll(value, " ", "_")

	var builder strings.Builder
	for _, r := range value {
		if (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' {
			builder.WriteRune(r)
		}
	}

	result := builder.String()
	if result == "" {
		result = "UMUM"
	}

	if len(result) > 30 {
		result = result[:30]
	}

	return result
}

func handleError(w http.ResponseWriter, err error, fallback string) {
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": fallback})
		return
	}

	log.Printf("product handler error: %v", err)
	writeJSON(w, http.StatusInternalServerError, map[string]string{"error": fallback})
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

var _ = time.Time{}
