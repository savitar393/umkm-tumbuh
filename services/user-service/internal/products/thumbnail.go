package products

import (
	"bytes"
	"context"
	"database/sql"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

const maxThumbnailSizeBytes int64 = 2 * 1024 * 1024

func (h *Handler) UploadThumbnail(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUMKMUser(w, r)
	if !ok {
		return
	}

	if h.Storage == nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Object storage belum dikonfigurasi.",
		})
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxThumbnailSizeBytes+1024)

	if err := r.ParseMultipartForm(maxThumbnailSizeBytes); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "File terlalu besar atau form-data tidak valid. Maksimal 2MB.",
		})
		return
	}

	file, header, err := r.FormFile("thumbnail")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Field file 'thumbnail' wajib diisi.",
		})
		return
	}
	defer file.Close()

	var buf bytes.Buffer

	head := make([]byte, 512)
	n, _ := file.Read(head)
	contentType := http.DetectContentType(head[:n])

	if !isAllowedImageContentType(contentType) {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Format gambar harus JPEG, PNG, atau WEBP.",
		})
		return
	}

	buf.Write(head[:n])

	written, err := io.Copy(&buf, file)
	if err != nil {
		handleError(w, err, "Gagal membaca file gambar.")
		return
	}

	sizeBytes := int64(n) + written
	if sizeBytes <= 0 || sizeBytes > maxThumbnailSizeBytes {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Ukuran gambar harus lebih dari 0 dan maksimal 2MB.",
		})
		return
	}

	umkmID, err := h.getUMKMID(r.Context(), user.ID)
	if err != nil {
		handleError(w, err, "Profil UMKM belum dibuat.")
		return
	}

	productID := chi.URLParam(r, "id")

	oldObjectKey, err := h.getProductThumbnailObjectKey(r.Context(), umkmID, productID)
	if err != nil {
		handleError(w, err, "Produk tidak ditemukan.")
		return
	}

	objectKey := buildThumbnailObjectKey(umkmID, productID, contentType)
	thumbnailURL := fmt.Sprintf("/api/v1/public/products/%s/thumbnail", productID)

	if err := h.Storage.PutObject(r.Context(), objectKey, bytes.NewReader(buf.Bytes()), contentType); err != nil {
		handleError(w, err, "Gagal mengunggah gambar produk.")
		return
	}

	tag, err := h.DB.Exec(r.Context(), `
		UPDATE user_mgmt.master_produkumkm
		SET
			thumbnail_object_key = $3,
			thumbnail_url = $4,
			thumbnail_content_type = $5,
			thumbnail_size_bytes = $6,
			thumbnail_updated_at = NOW(),
			updated_at = NOW()
		WHERE produk_id = $1
		  AND umkm_id = $2
		  AND is_deleted = FALSE
	`, productID, umkmID, objectKey, thumbnailURL, contentType, sizeBytes)
	if err != nil {
		_ = h.Storage.DeleteObject(r.Context(), objectKey)
		handleError(w, err, "Gagal menyimpan metadata gambar produk.")
		return
	}

	if tag.RowsAffected() == 0 {
		_ = h.Storage.DeleteObject(r.Context(), objectKey)
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Produk tidak ditemukan."})
		return
	}

	if oldObjectKey.Valid && oldObjectKey.String != "" && oldObjectKey.String != objectKey {
		if err := h.Storage.DeleteObject(r.Context(), oldObjectKey.String); err != nil {
			// Do not fail the request only because cleanup failed.
			// Old unused files can be cleaned later.
			fmt.Printf("failed to delete old thumbnail object %s: %v\n", oldObjectKey.String, err)
		}
	}

	product, err := h.findProductByID(r.Context(), umkmID, productID)
	if err != nil {
		handleError(w, err, "Gambar tersimpan, tetapi produk gagal dibaca kembali.")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"message":  "Thumbnail produk berhasil diunggah.",
		"filename": header.Filename,
		"product":  product,
	})
}

func (h *Handler) GetThumbnail(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUMKMUser(w, r)
	if !ok {
		return
	}

	if h.Storage == nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Object storage belum dikonfigurasi.",
		})
		return
	}

	umkmID, err := h.getUMKMID(r.Context(), user.ID)
	if err != nil {
		handleError(w, err, "Profil UMKM belum dibuat.")
		return
	}

	productID := chi.URLParam(r, "id")

	objectKey, contentType, sizeBytes, err := h.getProductThumbnailMetadata(r.Context(), umkmID, productID)
	if err != nil {
		handleError(w, err, "Thumbnail produk tidak ditemukan.")
		return
	}

	if !objectKey.Valid || objectKey.String == "" {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Thumbnail produk belum diunggah.",
		})
		return
	}

	object, err := h.Storage.GetObject(r.Context(), objectKey.String)
	if err != nil {
		handleError(w, err, "Gagal mengambil file thumbnail.")
		return
	}
	defer object.Body.Close()

	if contentType.Valid {
		w.Header().Set("Content-Type", contentType.String)
	}

	if sizeBytes.Valid {
		w.Header().Set("Content-Length", fmt.Sprintf("%d", sizeBytes.Int64))
	}

	w.Header().Set("Cache-Control", "private, max-age=300")
	w.WriteHeader(http.StatusOK)

	_, _ = io.Copy(w, object.Body)
}

func (h *Handler) GetPublicThumbnail(w http.ResponseWriter, r *http.Request) {
	if h.Storage == nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Object storage belum dikonfigurasi.",
		})
		return
	}

	productID := chi.URLParam(r, "id")

	objectKey, contentType, sizeBytes, err := h.getPublicProductThumbnailMetadata(r.Context(), productID)
	if err != nil {
		handleError(w, err, "Thumbnail produk tidak ditemukan.")
		return
	}

	if !objectKey.Valid || objectKey.String == "" {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Thumbnail produk belum diunggah.",
		})
		return
	}

	object, err := h.Storage.GetObject(r.Context(), objectKey.String)
	if err != nil {
		handleError(w, err, "Gagal mengambil file thumbnail.")
		return
	}
	defer object.Body.Close()

	if contentType.Valid {
		w.Header().Set("Content-Type", contentType.String)
	}

	if sizeBytes.Valid {
		w.Header().Set("Content-Length", fmt.Sprintf("%d", sizeBytes.Int64))
	}

	w.Header().Set("Cache-Control", "public, max-age=300")
	w.WriteHeader(http.StatusOK)

	_, _ = io.Copy(w, object.Body)
}

func (h *Handler) DeleteThumbnail(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUMKMUser(w, r)
	if !ok {
		return
	}

	if h.Storage == nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Object storage belum dikonfigurasi.",
		})
		return
	}

	umkmID, err := h.getUMKMID(r.Context(), user.ID)
	if err != nil {
		handleError(w, err, "Profil UMKM belum dibuat.")
		return
	}

	productID := chi.URLParam(r, "id")

	oldObjectKey, err := h.getProductThumbnailObjectKey(r.Context(), umkmID, productID)
	if err != nil {
		handleError(w, err, "Produk tidak ditemukan.")
		return
	}

	tag, err := h.DB.Exec(r.Context(), `
		UPDATE user_mgmt.master_produkumkm
		SET
			thumbnail_object_key = NULL,
			thumbnail_url = NULL,
			thumbnail_content_type = NULL,
			thumbnail_size_bytes = NULL,
			thumbnail_updated_at = NULL,
			updated_at = NOW()
		WHERE produk_id = $1
		  AND umkm_id = $2
		  AND is_deleted = FALSE
	`, productID, umkmID)
	if err != nil {
		handleError(w, err, "Gagal menghapus metadata thumbnail.")
		return
	}

	if tag.RowsAffected() == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Produk tidak ditemukan."})
		return
	}

	if oldObjectKey.Valid && oldObjectKey.String != "" {
		if err := h.Storage.DeleteObject(r.Context(), oldObjectKey.String); err != nil {
			handleError(w, err, "Metadata terhapus, tetapi file thumbnail gagal dihapus.")
			return
		}
	}

	product, err := h.findProductByID(r.Context(), umkmID, productID)
	if err != nil {
		handleError(w, err, "Thumbnail dihapus, tetapi produk gagal dibaca kembali.")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"message": "Thumbnail produk berhasil dihapus.",
		"product": product,
	})
}

func (h *Handler) getProductThumbnailObjectKey(ctx context.Context, umkmID string, productID string) (sql.NullString, error) {
	var objectKey sql.NullString

	err := h.DB.QueryRow(ctx, `
		SELECT thumbnail_object_key
		FROM user_mgmt.master_produkumkm
		WHERE produk_id = $1
		  AND umkm_id = $2
		  AND is_deleted = FALSE
		LIMIT 1
	`, productID, umkmID).Scan(&objectKey)

	return objectKey, err
}

func (h *Handler) getProductThumbnailMetadata(
	ctx context.Context,
	umkmID string,
	productID string,
) (sql.NullString, sql.NullString, sql.NullInt64, error) {
	var objectKey sql.NullString
	var contentType sql.NullString
	var sizeBytes sql.NullInt64

	err := h.DB.QueryRow(ctx, `
		SELECT thumbnail_object_key, thumbnail_content_type, thumbnail_size_bytes
		FROM user_mgmt.master_produkumkm
		WHERE produk_id = $1
		  AND umkm_id = $2
		  AND is_deleted = FALSE
		LIMIT 1
	`, productID, umkmID).Scan(&objectKey, &contentType, &sizeBytes)

	return objectKey, contentType, sizeBytes, err
}

func (h *Handler) getPublicProductThumbnailMetadata(
	ctx context.Context,
	productID string,
) (sql.NullString, sql.NullString, sql.NullInt64, error) {
	var objectKey sql.NullString
	var contentType sql.NullString
	var sizeBytes sql.NullInt64

	err := h.DB.QueryRow(ctx, `
		SELECT
			p.thumbnail_object_key,
			p.thumbnail_content_type,
			p.thumbnail_size_bytes
		FROM user_mgmt.master_produkumkm p
		JOIN user_mgmt.master_umkm u
			ON u.umkm_id = p.umkm_id
		WHERE p.produk_id = $1
		  AND p.status_produk = 'AKTIF'
		  AND p.is_deleted = FALSE
		  AND u.status_verified = TRUE
		  AND u.is_deleted = FALSE
		LIMIT 1
	`, productID).Scan(&objectKey, &contentType, &sizeBytes)

	return objectKey, contentType, sizeBytes, err
}

func isAllowedImageContentType(contentType string) bool {
	switch strings.ToLower(contentType) {
	case "image/jpeg", "image/png", "image/webp":
		return true
	default:
		return false
	}
}

func buildThumbnailObjectKey(umkmID string, productID string, contentType string) string {
	extension := "bin"

	switch strings.ToLower(contentType) {
	case "image/jpeg":
		extension = "jpg"
	case "image/png":
		extension = "png"
	case "image/webp":
		extension = "webp"
	}

	return fmt.Sprintf(
		"products/%s/%s/%d-%s.%s",
		umkmID,
		productID,
		time.Now().UnixNano(),
		strings.ToLower(newID("IMG")),
		extension,
	)
}
