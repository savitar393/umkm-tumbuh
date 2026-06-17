package certificates

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/apperror"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/middleware"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/response"
)

type Handler struct {
	Service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{Service: service}
}

func (h *Handler) GetUserDashboard(w http.ResponseWriter, r *http.Request) {
	umkmID := chi.URLParam(r, "umkmID")
	if umkmID == "" {
		response.Error(w, http.StatusBadRequest, "UMKM ID tidak valid")
		return
	}

	dashboard, err := h.Service.GetUserDashboard(r.Context(), umkmID)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, dashboard)
}

func (h *Handler) GetUserCertificates(w http.ResponseWriter, r *http.Request) {
	umkmID := chi.URLParam(r, "umkmID")
	if umkmID == "" {
		response.Error(w, http.StatusBadRequest, "UMKM ID tidak valid")
		return
	}

	certificates, err := h.Service.GetUserCertificates(r.Context(), umkmID)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"certificates": certificates,
	})
}

func (h *Handler) GetCertificateByID(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	sertifikatID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID Sertifikat tidak valid")
		return
	}

	cert, err := h.Service.GetCertificateByID(r.Context(), sertifikatID)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, cert)
}

func (h *Handler) RequestCertificate(w http.ResponseWriter, r *http.Request) {
	var req RequestCertificateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid")
		return
	}

	result, err := h.Service.RequestCertificate(r.Context(), req)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusCreated, result)
}

func (h *Handler) DownloadCertificate(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	sertifikatID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID Sertifikat tidak valid")
		return
	}

	filePath, err := h.Service.GetCertificatePDFPath(r.Context(), sertifikatID)
	if err != nil {
		handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=sertifikat.pdf")
	http.ServeFile(w, r, filePath)
}

func (h *Handler) ListCertificates(w http.ResponseWriter, r *http.Request) {
	if !isAdmin(r) {
		response.Error(w, http.StatusForbidden, "Akses hanya untuk Admin")
		return
	}
	q := r.URL.Query()
	status := q.Get("status")
	search := q.Get("search")
	sortBy := q.Get("sort_by")
	sortOrder := q.Get("sort_order")
	page, limit := parsePagination(q.Get("page"), q.Get("limit"))
	result, err := h.Service.ListCertificatesByStatus(r.Context(), status, search, sortBy, sortOrder, page, limit)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *Handler) GetCertificateStats(w http.ResponseWriter, r *http.Request) {
	if !isAdmin(r) {
		response.Error(w, http.StatusForbidden, "Akses hanya untuk Admin")
		return
	}
	stats, err := h.Service.GetCertificateStats(r.Context())
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, stats)
}

func (h *Handler) ApproveCertificateByAdmin(w http.ResponseWriter, r *http.Request) {
	if !isAdmin(r) {
		response.Error(w, http.StatusForbidden, "Akses hanya untuk Admin")
		return
	}
	idParam := chi.URLParam(r, "id")
	sertifikatID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID Sertifikat tidak valid")
		return
	}

	cert, err := h.Service.ApproveCertificate(r.Context(), sertifikatID)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{
		"message":     "Sertifikat berhasil disetujui",
		"certificate": cert,
	})
}

func (h *Handler) RejectCertificate(w http.ResponseWriter, r *http.Request) {
	if !isAdmin(r) {
		response.Error(w, http.StatusForbidden, "Akses hanya untuk Admin")
		return
	}
	idParam := chi.URLParam(r, "id")
	sertifikatID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "ID Sertifikat tidak valid")
		return
	}

	var req RejectCertificateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Request body tidak valid")
		return
	}

	cert, err := h.Service.RejectCertificate(r.Context(), sertifikatID, req.Catatan)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{
		"message":     "Sertifikat ditolak",
		"certificate": cert,
	})
}

func parsePagination(pageStr, limitStr string) (page, limit int) {
	page = 1
	limit = 20
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
		limit = l
	}
	return
}

func isAdmin(r *http.Request) bool {
	role, ok := r.Context().Value(middleware.UserRoleKey).(string)
	return ok && role == "ADMIN"
}

func handleError(w http.ResponseWriter, err error) {
	var appErr *apperror.AppError

	if errors.As(err, &appErr) {
		response.Error(w, appErr.StatusCode, appErr.Message)
		return
	}

	log.Printf("internal certificate error: %v", err)
	response.Error(w, http.StatusInternalServerError, "Terjadi kesalahan pada server")
}
