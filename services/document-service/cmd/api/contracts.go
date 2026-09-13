package main

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"strings"
)

type partnershipContract struct {
	documentResponse
	Source      string `json:"source"`
	RequesterID string `json:"-"`
	ReceiverID  string `json:"-"`
}

func canReadContract(user currentUser, contract partnershipContract) bool {
	if user.ID == "" {
		return false
	}
	return user.Role == "ADMIN" || user.ID == contract.RequesterID || user.ID == contract.ReceiverID
}

// Resolve through the proposal, not through an unqualified document ID: current
// and legacy metadata have independent ID namespaces and can contain the same ID.
func (a *app) findPartnershipContract(ctx context.Context, partnershipID string) (partnershipContract, error) {
	const query = `
		SELECT d.*, p.pengaju_akun_id, p.penerima_akun_id
		FROM partnership.transaksi_pengajuankerjasama p
		JOIN LATERAL (
		    SELECT d.dokumen_id, d.uploader_akun_id, d.uploader_role,
		           d.kategori_dokumen, d.bucket_name, d.object_key,
		           d.original_filename, d.content_type, d.size_bytes, d.public_url,
		           d.status, d.created_at, d.updated_at, d.deleted_at, 'CURRENT' AS source
		    FROM documents.master_dokumen d
		    WHERE p.dokumen_kontrak_id = d.dokumen_id
		    UNION ALL
		    SELECT d.dokumen_id, d.uploader_akun_id, '',
		           'PARTNERSHIP_FILE', d.bucket_name, d.object_key,
		           d.original_file_name, d.mime_type, d.file_size_bytes, d.public_url,
		           CASE WHEN d.status_dokumen_id = 'DIHAPUS' THEN 'DIHAPUS' ELSE 'AKTIF' END,
		           d.uploaded_at, d.uploaded_at, NULL::timestamptz, 'LEGACY'
		    FROM document.transaksi_dokumenterunggah d
		    WHERE p.dokumen_kontrak_id IS NULL AND p.dokumen_perjanjian_id = d.dokumen_id
		) d ON TRUE
		WHERE p.pengajuan_id = $1
	`
	var contract partnershipContract
	err := a.db.QueryRow(ctx, query, partnershipID).Scan(
		&contract.ID, &contract.UploaderAccount, &contract.UploaderRole,
		&contract.Category, &contract.Bucket, &contract.ObjectKey,
		&contract.OriginalFilename, &contract.ContentType, &contract.SizeBytes,
		&contract.PublicURL, &contract.Status, &contract.CreatedAt,
		&contract.UpdatedAt, &contract.DeletedAt, &contract.Source,
		&contract.RequesterID, &contract.ReceiverID,
	)
	return contract, err
}

func (a *app) handlePartnershipContract(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", http.MethodGet)
		writeJSON(w, http.StatusMethodNotAllowed, errorResponse{Error: "Method not allowed."})
		return
	}
	parts := strings.Split(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/partnership-contracts/"), "/"), "/")
	if parts[0] == "" || len(parts) > 2 || (len(parts) == 2 && parts[1] != "download") {
		a.handleNotFound(w, r)
		return
	}
	user, ok := userFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, errorResponse{Error: "User tidak ditemukan pada konteks."})
		return
	}
	contract, err := a.findPartnershipContract(r.Context(), parts[0])
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeJSON(w, http.StatusNotFound, errorResponse{Error: "Kontrak kemitraan tidak ditemukan."})
			return
		}
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: "Gagal memuat kontrak kemitraan."})
		return
	}
	if !canReadContract(user, contract) {
		writeJSON(w, http.StatusForbidden, errorResponse{Error: "Anda tidak memiliki akses ke kontrak ini."})
		return
	}
	if contract.Status == "DIHAPUS" {
		writeJSON(w, http.StatusNotFound, errorResponse{Error: "Kontrak kemitraan tidak ditemukan."})
		return
	}
	w.Header().Set("Cache-Control", "private, no-store")
	if len(parts) == 1 {
		writeJSON(w, http.StatusOK, map[string]any{"document": contract})
		return
	}
	a.streamDocument(w, r, contract.documentResponse, false)
}
