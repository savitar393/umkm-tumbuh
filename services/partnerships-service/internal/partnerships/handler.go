package partnerships

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/apperror"
	"github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/response"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// Extract user ID from JWT (simulated for now - in production, extract from token)
func extractUserIDFromRequest(r *http.Request) uuid.UUID {
	// In production, extract from JWT token
	// For now, return a dummy user ID
	return uuid.MustParse("00000000-0000-0000-0000-000000000001")
}

// Extract user role from JWT (simulated for now)
func extractUserRoleFromRequest(r *http.Request) UserRole {
	// In production, extract from JWT token
	return UserRole(r.Header.Get("X-User-Role"))
}

// CreatePartnership - POST /api/v1/partnerships
func (h *Handler) CreatePartnership(w http.ResponseWriter, r *http.Request) {
	userID := extractUserIDFromRequest(r)
	userRole := extractUserRoleFromRequest(r)

	var req CreatePartnershipRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	// Validate request
	if errors := h.service.ValidatePartnershipRequest(req); len(errors) > 0 {
		response.Error(w, http.StatusUnprocessableEntity, "Validation failed", errors)
		return
	}

	partnership, err := h.service.CreatePartnership(r.Context(), userID, userRole, req)
	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			switch appErr.Code {
			case http.StatusForbidden:
				response.Error(w, http.StatusForbidden, appErr.Message, nil)
				return
			default:
				response.Error(w, appErr.Code, appErr.Message, nil)
				return
			}
		}
		response.Error(w, http.StatusInternalServerError, "Failed to create partnership", nil)
		return
	}

	response.Success(w, http.StatusOK, map[string]interface{}{
		"pengajuanID": partnership.ID.String(),
	}, "Pengajuan kemitraan berhasil dikirim.")
}

// GetPartnershipStatus - GET /api/v1/partnerships/status
func (h *Handler) GetPartnershipStatus(w http.ResponseWriter, r *http.Request) {
	userID := extractUserIDFromRequest(r)

	// Get query parameters
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 {
		limit = 10
	}
	statusStr := r.URL.Query().Get("status")

	var status *PartnershipStatus
	if statusStr != "" {
		s := PartnershipStatus(strings.ToUpper(statusStr))
		status = &s
	}

	partnerships, totalCount, err := h.service.GetPartnershipsByRequester(r.Context(), userID, status, page, limit)
	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			response.Error(w, appErr.Code, appErr.Message, nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "Failed to get partnership status", nil)
		return
	}

	// Format response data
	var formattedData []map[string]interface{}
	for _, p := range partnerships {
		formattedData = append(formattedData, map[string]interface{}{
			"pengajuanID":        p.ID.String(),
			"statusPengajuan":    p.Status,
			"tanggalPengajuan":   p.SubmittedAt,
			"mitraUmkmTujuan":    p.ReceiverName,
			"proposalTitle":      p.ProposalTitle,
		})
	}

	response.Success(w, http.StatusOK, map[string]interface{}{
		"pengajuan": formattedData,
		"pagination": map[string]int{
			"page":       page,
			"limit":      limit,
			"total":      totalCount,
			"totalPages": (totalCount + limit - 1) / limit,
		},
	}, "")
}

// GetIncomingPartnerships - GET /api/v1/partnerships/incoming
func (h *Handler) GetIncomingPartnerships(w http.ResponseWriter, r *http.Request) {
	userID := extractUserIDFromRequest(r)

	// Get query parameters
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 {
		limit = 10
	}
	statusStr := r.URL.Query().Get("status")

	var status *PartnershipStatus
	if statusStr != "" {
		s := PartnershipStatus(strings.ToUpper(statusStr))
		status = &s
	}

	partnerships, totalCount, err := h.service.GetPartnershipsByReceiver(r.Context(), userID, status, page, limit)
	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			response.Error(w, appErr.Code, appErr.Message, nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "Failed to get incoming partnerships", nil)
		return
	}

	// Format response data
	var formattedData []map[string]interface{}
	for _, p := range partnerships {
		formattedData = append(formattedData, map[string]interface{}{
			"pengajuanID":      p.ID.String(),
			"pengirim":         p.RequesterName,
			"proposal_title":   p.ProposalTitle,
			"tanggalPengajuan": p.SubmittedAt,
		})
	}

	response.Success(w, http.StatusOK, map[string]interface{}{
		"pengajuan_masuk": formattedData,
		"pagination": map[string]int{
			"page":       page,
			"limit":      limit,
			"total":      totalCount,
			"totalPages": (totalCount + limit - 1) / limit,
		},
	}, "")
}

// GetPartnershipDetail - GET /api/v1/partnerships/{id}
func (h *Handler) GetPartnershipDetail(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid partnership ID", nil)
		return
	}

	partnership, err := h.service.GetPartnershipByID(r.Context(), id)
	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			switch appErr.Code {
			case http.StatusNotFound:
				response.Error(w, http.StatusNotFound, appErr.Message, nil)
				return
			case http.StatusForbidden:
				response.Error(w, http.StatusForbidden, appErr.Message, nil)
				return
			default:
				response.Error(w, appErr.Code, appErr.Message, nil)
				return
			}
		}
		response.Error(w, http.StatusInternalServerError, "Failed to get partnership detail", nil)
		return
	}

	response.Success(w, http.StatusOK, map[string]interface{}{
		"pengajuan": partnership,
	}, "")
}

// SignPartnership - POST /api/v1/partnerships/{id}/sign
func (h *Handler) SignPartnership(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid partnership ID", nil)
		return
	}

	// Get user info from JWT - TODO: use for authorization
	_ = extractUserIDFromRequest(r)

	var req SignPartnershipRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	err = h.service.SignPartnership(r.Context(), id, req)
	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			switch appErr.Code {
			case http.StatusForbidden:
				response.Error(w, http.StatusForbidden, appErr.Message, nil)
				return
			case http.StatusNotFound:
				response.Error(w, http.StatusNotFound, appErr.Message, nil)
				return
			default:
				response.Error(w, appErr.Code, appErr.Message, nil)
				return
			}
		}
		response.Error(w, http.StatusInternalServerError, "Failed to sign partnership", nil)
		return
	}

	response.Success(w, http.StatusOK, nil, "Dokumen berhasil diunggah. Pengajuan siap disetujui.")
}

// ApprovePartnership - PATCH /api/v1/partnerships/{id}/approve
func (h *Handler) ApprovePartnership(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid partnership ID", nil)
		return
	}

	// Get user info from JWT - TODO: use for authorization
	_ = extractUserIDFromRequest(r)

	var req UpdatePartnershipStatus
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	// Set status to APPROVED
	req.Status = "APPROVED"

	err = h.service.UpdatePartnershipStatus(r.Context(), id, req)
	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			switch appErr.Code {
			case http.StatusForbidden:
				response.Error(w, http.StatusForbidden, appErr.Message, nil)
				return
			case http.StatusNotFound:
				response.Error(w, http.StatusNotFound, appErr.Message, nil)
				return
			default:
				response.Error(w, appErr.Code, appErr.Message, nil)
				return
			}
		}
		response.Error(w, http.StatusInternalServerError, "Failed to approve partnership", nil)
		return
	}

	response.Success(w, http.StatusOK, nil, "Pengajuan disetujui. Kemitraan aktif.")
}

// RejectPartnership - PATCH /api/v1/partnerships/{id}/reject
func (h *Handler) RejectPartnership(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid partnership ID", nil)
		return
	}

	// Get user info from JWT - TODO: use for authorization
	_ = extractUserIDFromRequest(r)

	var req UpdatePartnershipStatus
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	if req.RejectionReason == nil || *req.RejectionReason == "" {
		response.Error(w, http.StatusUnprocessableEntity, "Alasan penolakan wajib diisi", nil)
		return
	}

	// Set status to REJECTED
	req.Status = "REJECTED"

	err = h.service.UpdatePartnershipStatus(r.Context(), id, req)
	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			switch appErr.Code {
			case http.StatusForbidden:
				response.Error(w, http.StatusForbidden, appErr.Message, nil)
				return
			case http.StatusNotFound:
				response.Error(w, http.StatusNotFound, appErr.Message, nil)
				return
			default:
				response.Error(w, appErr.Code, appErr.Message, nil)
				return
			}
		}
		response.Error(w, http.StatusInternalServerError, "Failed to reject partnership", nil)
		return
	}

	response.Success(w, http.StatusOK, nil, "Pengajuan ditolak.")
}

// ============================================================
// NEW HANDLERS FOR UMKM AND MITRA LISTS
// ============================================================

// GetUMKMList - GET /api/v1/umkm
// Menampilkan daftar UMKM yang bisa diajak kerjasama (diakses oleh MITRA)
func (h *Handler) GetUMKMList(w http.ResponseWriter, r *http.Request) {
	// Get query parameters
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}
	
	search := r.URL.Query().Get("q")
	
	// Extract user role - hanya MITRA yang bisa melihat UMKM
	userRole := extractUserRoleFromRequest(r)
	if userRole != RoleMitra {
		response.Error(w, http.StatusForbidden, "Hanya mitra yang dapat melihat daftar UMKM", nil)
		return
	}
	
	// Get UMKM list from service
	umkmList, totalCount, err := h.service.GetUMKMList(r.Context(), search, page, limit)
	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			response.Error(w, appErr.Code, appErr.Message, nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "Gagal mengambil daftar UMKM", nil)
		return
	}
	
	// Calculate total pages
	totalPages := 0
	if totalCount > 0 {
		totalPages = (totalCount + limit - 1) / limit
	}
	
	// Return success response
	response.Success(w, http.StatusOK, map[string]interface{}{
		"umkm": umkmList,
		"pagination": map[string]int{
			"page":       page,
			"limit":      limit,
			"total":      totalCount,
			"totalPages": totalPages,
		},
	}, "")
}

// GetMitraList - GET /api/v1/mitra
// Menampilkan daftar mitra yang bisa diajak kerjasama (diakses oleh UMKM)
func (h *Handler) GetMitraList(w http.ResponseWriter, r *http.Request) {
	// Get query parameters
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}
	
	search := r.URL.Query().Get("q")
	
	// Extract user role - hanya UMKM yang bisa melihat mitra
	userRole := extractUserRoleFromRequest(r)
	if userRole != RoleUMKM {
		response.Error(w, http.StatusForbidden, "Hanya UMKM yang dapat melihat daftar mitra", nil)
		return
	}
	
	// Get Mitra list from service
	mitraList, totalCount, err := h.service.GetMitraList(r.Context(), search, page, limit)
	if err != nil {
		if appErr, ok := err.(*apperror.AppError); ok {
			response.Error(w, appErr.Code, appErr.Message, nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "Gagal mengambil daftar mitra", nil)
		return
	}
	
	// Calculate total pages
	totalPages := 0
	if totalCount > 0 {
		totalPages = (totalCount + limit - 1) / limit
	}
	
	// Return success response
	response.Success(w, http.StatusOK, map[string]interface{}{
		"mitra": mitraList,
		"pagination": map[string]int{
			"page":       page,
			"limit":      limit,
			"total":      totalCount,
			"totalPages": totalPages,
		},
	}, "")
}