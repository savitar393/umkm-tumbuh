package documents

import (
	"net/http"
	"os"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/savitar393/umkm-tumbuh/services/documents-service/internal/apperror"
	"github.com/savitar393/umkm-tumbuh/services/documents-service/internal/response"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// POST /api/v1/documents/upload
func (h *Handler) Upload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		response.Error(w, http.StatusBadRequest, "Failed to parse multipart form", nil)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		response.Error(w, http.StatusBadRequest, "File is required", nil)
		return
	}
	defer file.Close()

	displayOrder, _ := strconv.Atoi(r.FormValue("display_order"))

	var contextID *string
	if cid := r.FormValue("context_id"); cid != "" {
		contextID = &cid
	}

	var caption *string
	if cap := r.FormValue("caption"); cap != "" {
		caption = &cap
	}

	isPublic := r.FormValue("is_public") == "true"

	userRole := r.Header.Get("X-User-Role")

	req := UploadRequest{
		JenisDokumenID: r.FormValue("jenis_dokumen_id"),
		UploaderAkunID: r.FormValue("uploader_akun_id"),
		OwnerType:      OwnerType(r.FormValue("owner_type")),
		OwnerID:        r.FormValue("owner_id"),
		ContextType:    r.FormValue("context_type"),
		ContextID:      contextID,
		Caption:        caption,
		DisplayOrder:   displayOrder,
		IsPublic:       isPublic,
	}

	if userRole == "" {
		response.Error(w, http.StatusBadRequest, "X-User-Role header is required", nil)
		return
	}
	if req.UploaderAkunID == "" {
		response.Error(w, http.StatusBadRequest, "uploader_akun_id is required", nil)
		return
	}
	if req.JenisDokumenID == "" {
		response.Error(w, http.StatusBadRequest, "jenis_dokumen_id is required", nil)
		return
	}
	if req.OwnerType == "" {
		response.Error(w, http.StatusBadRequest, "owner_type is required", nil)
		return
	}
	if req.OwnerID == "" {
		response.Error(w, http.StatusBadRequest, "owner_id is required", nil)
		return
	}
	if req.ContextType == "" {
		response.Error(w, http.StatusBadRequest, "context_type is required", nil)
		return
	}

	resp, err := h.service.Upload(r.Context(), file, header, req)
	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			response.Error(w, appErr.Code, appErr.Message, nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "Failed to upload document", nil)
		return
	}

	response.Success(w, http.StatusCreated, resp, "Document uploaded successfully")
}

// GET /api/v1/documents/{id}
func (h *Handler) Download(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	doc, filePath, err := h.service.Download(r.Context(), id)
	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			response.Error(w, appErr.Code, appErr.Message, nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "Failed to download document", nil)
		return
	}

	file, err := os.Open(filePath)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Failed to open file", nil)
		return
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Failed to stat file", nil)
		return
	}

	w.Header().Set("Content-Type", doc.MimeType)
	w.Header().Set("Content-Disposition", "attachment; filename=\""+doc.OriginalFileName+"\"")
	w.Header().Set("Content-Length", strconv.FormatInt(stat.Size(), 64))
	http.ServeContent(w, r, doc.OriginalFileName, doc.UploadedAt, file)
}

// GET /api/v1/documents/{id}/metadata
func (h *Handler) GetMetadata(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	doc, err := h.service.GetMetadata(r.Context(), id)
	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			response.Error(w, appErr.Code, appErr.Message, nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "Failed to get document metadata", nil)
		return
	}

	response.Success(w, http.StatusOK, doc, "")
}
