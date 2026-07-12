package documents

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/middleware"
)

type Handler struct {
	DB        *pgxpool.Pool
	Store     *Store
	UploadDir string
}

func NewHandler(db *pgxpool.Pool, uploadDir string) *Handler {
	if uploadDir == "" {
		uploadDir = "uploads"
	}
	return &Handler{
		DB:        db,
		Store:     NewStore(db),
		UploadDir: uploadDir,
	}
}

func (h *Handler) UploadDocument(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "File terlalu besar (maks 10MB)."})
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "File tidak ditemukan."})
		return
	}
	defer file.Close()

	docType := DocumentType(r.FormValue("document_type"))
	if docType == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "document_type wajib diisi."})
		return
	}

	validTypes := map[string]bool{
		"application/pdf": true, "image/jpeg": true, "image/png": true,
		"image/jpg": true, "application/msword": true,
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
	}
	mimeType := header.Header.Get("Content-Type")
	if !validTypes[mimeType] {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Format file tidak didukung. Gunakan PDF, JPG, atau PNG."})
		return
	}

	userDir := filepath.Join(h.UploadDir, user.ID, string(docType))
	if err := os.MkdirAll(userDir, 0755); err != nil {
		log.Printf("failed to create upload dir: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal menyimpan file."})
		return
	}

	fileID := uuid.NewString()
	storedPath := filepath.Join(userDir, fileID+filepath.Ext(header.Filename))

	dst, err := os.Create(storedPath)
	if err != nil {
		log.Printf("failed to create file: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal menyimpan file."})
		return
	}
	defer dst.Close()

	fileSize, err := io.Copy(dst, file)
	if err != nil {
		log.Printf("failed to write file: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal menyimpan file."})
		return
	}

	doc := &Document{
		ID:           fileID,
		UserID:       user.ID,
		DocumentType: docType,
		FileName:     header.Filename,
		FilePath:     storedPath,
		FileSize:     fileSize,
		MimeType:     mimeType,
		Status:       StatusUploaded,
	}

	if err := h.Store.Create(r.Context(), doc); err != nil {
		log.Printf("failed to save document record: %v", err)
		os.Remove(storedPath)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal menyimpan data dokumen."})
		return
	}

	resp := ToResponse(doc)

	checklist, _ := h.Store.GetChecklist(r.Context(), user.ID, user.Role)

	writeJSON(w, http.StatusCreated, map[string]any{
		"status":    "success",
		"document":  resp,
		"checklist": checklist,
	})
}

func (h *Handler) GetDocuments(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	docs, err := h.Store.FindByUserID(r.Context(), user.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal mengambil dokumen."})
		return
	}

	resp := make([]DocumentResponse, 0, len(docs))
	for i := range docs {
		resp = append(resp, ToResponse(&docs[i]))
	}

	checklist, _ := h.Store.GetChecklist(r.Context(), user.ID, user.Role)

	writeJSON(w, http.StatusOK, map[string]any{
		"documents": resp,
		"checklist": checklist,
	})
}

func (h *Handler) GetDocumentChecklist(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	checklist, err := h.Store.GetChecklist(r.Context(), user.ID, user.Role)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal mengambil checklist."})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"checklist": checklist})
}

func (h *Handler) DownloadDocument(w http.ResponseWriter, r *http.Request) {
	docID := chi.URLParam(r, "docID")

	doc, err := h.Store.FindByID(r.Context(), docID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Dokumen tidak ditemukan."})
		return
	}

	user, ok := middleware.CurrentUserFromContext(r.Context())
	if ok && user.Role != "ADMIN" && user.ID != doc.UserID {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "Anda tidak memiliki izin."})
		return
	}

	if _, err := os.Stat(doc.FilePath); os.IsNotExist(err) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "File dokumen tidak ditemukan."})
		return
	}

	w.Header().Set("Content-Type", doc.MimeType)
	w.Header().Set("Content-Disposition", `attachment; filename="`+doc.FileName+`"`)
	w.Header().Set("Content-Length", strconv.FormatInt(doc.FileSize, 10))
	http.ServeFile(w, r, doc.FilePath)
}

func (h *Handler) ViewDocument(w http.ResponseWriter, r *http.Request) {
	docID := chi.URLParam(r, "docID")

	doc, err := h.Store.FindByID(r.Context(), docID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Dokumen tidak ditemukan."})
		return
	}

	if _, err := os.Stat(doc.FilePath); os.IsNotExist(err) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "File dokumen tidak ditemukan."})
		return
	}

	w.Header().Set("Content-Type", doc.MimeType)
	w.Header().Set("Content-Disposition", `inline; filename="`+doc.FileName+`"`)
	w.Header().Set("Content-Length", strconv.FormatInt(doc.FileSize, 10))
	http.ServeFile(w, r, doc.FilePath)
}

func (h *Handler) DeleteDocument(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	docID := chi.URLParam(r, "docID")

	doc, err := h.Store.FindByID(r.Context(), docID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Dokumen tidak ditemukan."})
		return
	}

	if user.ID != doc.UserID {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "Anda tidak memiliki izin."})
		return
	}

	if err := h.Store.Delete(r.Context(), docID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal menghapus dokumen."})
		return
	}

	os.Remove(doc.FilePath)

	writeJSON(w, http.StatusOK, map[string]string{"status": "success", "message": "Dokumen berhasil dihapus."})
}

func (h *Handler) AdminGetUserDocuments(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	role := strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("role")))

	rows, err := h.DB.Query(r.Context(), `
		SELECT
			dokumen_id,
			uploader_akun_id,
			kategori_dokumen,
			original_filename,
			content_type,
			size_bytes,
			status,
			created_at,
			updated_at
		FROM documents.master_dokumen
		WHERE uploader_akun_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		log.Printf("failed to get admin uploaded documents: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal mengambil dokumen."})
		return
	}
	defer rows.Close()

	docs := make([]map[string]any, 0)
	uploadedCategories := map[string]int{}

	for rows.Next() {
		var (
			id               string
			uploaderID       string
			category         string
			originalFilename string
			contentType      string
			sizeBytes        int64
			status           string
			createdAt        any
			updatedAt        any
		)

		if err := rows.Scan(
			&id,
			&uploaderID,
			&category,
			&originalFilename,
			&contentType,
			&sizeBytes,
			&status,
			&createdAt,
			&updatedAt,
		); err != nil {
			log.Printf("failed to scan admin uploaded document: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal membaca dokumen."})
			return
		}

		uploadedCategories[category]++

		docs = append(docs, map[string]any{
			"id":                id,
			"dokumen_id":        id,
			"user_id":           uploaderID,
			"kategori_dokumen":  category,
			"category":          category,
			"original_filename": originalFilename,
			"file_name":         originalFilename,
			"content_type":      contentType,
			"size_bytes":        sizeBytes,
			"status":            status,
			"created_at":        createdAt,
			"updated_at":        updatedAt,
		})
	}

	if err := rows.Err(); err != nil {
		log.Printf("failed to iterate admin uploaded documents: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Gagal membaca daftar dokumen."})
		return
	}

	checklist := buildAdminDocumentChecklist(role, uploadedCategories)

	writeJSON(w, http.StatusOK, map[string]any{
		"documents": docs,
		"checklist": checklist,
	})
}

func buildAdminDocumentChecklist(role string, uploadedCategories map[string]int) []map[string]any {
	hasProductImage := uploadedCategories["PRODUCT_IMAGE"] > 0
	hasGeneralDocument := uploadedCategories["GENERAL_DOCUMENT"] > 0

	switch role {
	case "UMKM":
		return []map[string]any{
			{
				"label":    "Foto usaha",
				"uploaded": hasProductImage,
			},
			{
				"label":    "Dokumen pendukung",
				"uploaded": hasGeneralDocument,
			},
		}

	case "MITRA":
		return []map[string]any{
			{
				"label":    "Legalitas perusahaan",
				"uploaded": uploadedCategories["CERTIFICATE"] > 0,
			},
			{
				"label":    "Surat komitmen",
				"uploaded": uploadedCategories["PARTNERSHIP_FILE"] > 0,
			},
			{
				"label":    "Profil perusahaan",
				"uploaded": uploadedCategories["GENERAL_DOCUMENT"] > 0,
			},
		}

	default:
		return []map[string]any{}
	}
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

func trim(s string) string {
	return strings.TrimSpace(s)
}
