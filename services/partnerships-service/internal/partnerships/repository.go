package partnerships

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	Create(ctx context.Context, req *PartnershipRequest) error
	FindByID(ctx context.Context, id uuid.UUID) (*PartnershipResponse, error)
	FindByRequesterID(ctx context.Context, requesterID uuid.UUID, status *PartnershipStatus, limit, offset int) ([]PartnershipListResponse, int, error)
	FindByReceiverID(ctx context.Context, receiverID uuid.UUID, status *PartnershipStatus, limit, offset int) ([]PartnershipListResponse, int, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status PartnershipStatus, rejectionReason *string, decidedAt time.Time) error
	UpdateContract(ctx context.Context, id uuid.UUID, dokumenKontrak string, signedAt time.Time) error
	GenerateRequestCode(ctx context.Context) (string, error)
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, req *PartnershipRequest) error {
	query := `
		INSERT INTO partnership.transaksi_pengajuankerjasama (
			pengajuan_id, kode_pengajuan, umkm_id, mitra_id, pengaju_akun_id, penerima_akun_id,
			status_pengajuan_id, pesan_pengajuan, catatan_keputusan, dokumen_perjanjian_id,
			tanggal_pengajuan, tanggal_keputusan, tanggal_upload_dokumen,
			tanggal_mulai_kerjasama, tanggal_selesai_kerjasama, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
		)
	`

	_, err := r.db.Exec(ctx, query,
		req.ID, req.RequestCode, "", "", req.RequesterID, req.ReceiverID,
		req.Status, req.ProposalTitle, req.RejectionReason, req.ContractDocumentID,
		req.SubmittedAt, req.DecidedAt, req.ContractSignedAt,
		req.PartnershipStart, req.PartnershipEnd,
	)

	if err != nil {
		return fmt.Errorf("failed to create partnership request: %w", err)
	}

	return nil
}

func (r *repository) FindByID(ctx context.Context, id uuid.UUID) (*PartnershipResponse, error) {
	query := `
		SELECT 
			pr.pengajuan_id as id,
			pr.kode_pengajuan as request_code,
			pr.pengaju_akun_id as requester_id,
			pr.penerima_akun_id as receiver_id,
			pr.status_pengajuan_id as status,
			pr.tanggal_pengajuan as submitted_at,
			pr.tanggal_keputusan as decided_at,
			pr.pesan_pengajuan as proposal_description,
			pr.catatan_keputusan as rejection_reason,
			pr.dokumen_perjanjian_id as contract_document_id,
			u1.full_name as requester_name,
			u2.full_name as receiver_name
		FROM partnership.transaksi_pengajuankerjasama pr
		LEFT JOIN auth.master_akunpengguna u1 ON pr.pengaju_akun_id = u1.akun_id
		LEFT JOIN auth.master_akunpengguna u2 ON pr.penerima_akun_id = u2.akun_id
		WHERE pr.pengajuan_id = $1
	`

	var resp PartnershipResponse
	err := r.db.QueryRow(ctx, query, id).Scan(
		&resp.ID, &resp.RequestCode, &resp.RequesterID, &resp.ReceiverID,
		&resp.Status, &resp.SubmittedAt, &resp.DecidedAt,
		&resp.ProposalDescription, &resp.RejectionReason, &resp.ContractDocumentID,
		&resp.RequesterName, &resp.ReceiverName,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("partnership request not found")
		}
		return nil, fmt.Errorf("failed to find partnership request: %w", err)
	}

	return &resp, nil
}

func (r *repository) FindByRequesterID(ctx context.Context, requesterID uuid.UUID, status *PartnershipStatus, limit, offset int) ([]PartnershipListResponse, int, error) {
	var whereClause string
	var args []interface{}
	args = append(args, requesterID)
	argIndex := 2

	if status != nil {
		whereClause = fmt.Sprintf(" AND pr.status_pengajuan_id = $%d", argIndex)
		args = append(args, *status)
		argIndex++
	}

	query := fmt.Sprintf(`
		SELECT 
			pr.pengajuan_id as id,
			pr.kode_pengajuan as request_code,
			u1.full_name as requester_name,
			u2.full_name as receiver_name,
			pr.pesan_pengajuan as proposal_title,
			pr.status_pengajuan_id as status,
			pr.tanggal_pengajuan as submitted_at,
			pr.tanggal_keputusan as decided_at,
			COUNT(*) OVER() as total_count
		FROM partnership.transaksi_pengajuankerjasama pr
		LEFT JOIN auth.master_akunpengguna u1 ON pr.pengaju_akun_id = u1.akun_id
		LEFT JOIN auth.master_akunpengguna u2 ON pr.penerima_akun_id = u2.akun_id
		WHERE pr.pengaju_akun_id = $1%s
		ORDER BY pr.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch partnership requests: %w", err)
	}
	defer rows.Close()

	var partnerships []PartnershipListResponse
	var totalCount int

	for rows.Next() {
		var p PartnershipListResponse
		err := rows.Scan(
			&p.ID, &p.RequestCode, &p.RequesterName, &p.ReceiverName,
			&p.ProposalTitle, &p.Status, &p.SubmittedAt, &p.DecidedAt,
			&totalCount,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan partnership request: %w", err)
		}
		partnerships = append(partnerships, p)
	}

	return partnerships, totalCount, nil
}

func (r *repository) FindByReceiverID(ctx context.Context, receiverID uuid.UUID, status *PartnershipStatus, limit, offset int) ([]PartnershipListResponse, int, error) {
	var whereClause string
	var args []interface{}
	args = append(args, receiverID)
	argIndex := 2

	if status != nil {
		whereClause = fmt.Sprintf(" AND pr.status_pengajuan_id = $%d", argIndex)
		args = append(args, *status)
		argIndex++
	}

	query := fmt.Sprintf(`
		SELECT 
			pr.pengajuan_id as id,
			pr.kode_pengajuan as request_code,
			u1.full_name as requester_name,
			u2.full_name as receiver_name,
			pr.pesan_pengajuan as proposal_title,
			pr.status_pengajuan_id as status,
			pr.tanggal_pengajuan as submitted_at,
			pr.tanggal_keputusan as decided_at,
			COUNT(*) OVER() as total_count
		FROM partnership.transaksi_pengajuankerjasama pr
		LEFT JOIN auth.master_akunpengguna u1 ON pr.pengaju_akun_id = u1.akun_id
		LEFT JOIN auth.master_akunpengguna u2 ON pr.penerima_akun_id = u2.akun_id
		WHERE pr.penerima_akun_id = $1%s
		ORDER BY pr.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch partnership requests: %w", err)
	}
	defer rows.Close()

	var partnerships []PartnershipListResponse
	var totalCount int

	for rows.Next() {
		var p PartnershipListResponse
		err := rows.Scan(
			&p.ID, &p.RequestCode, &p.RequesterName, &p.ReceiverName,
			&p.ProposalTitle, &p.Status, &p.SubmittedAt, &p.DecidedAt,
			&totalCount,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan partnership request: %w", err)
		}
		partnerships = append(partnerships, p)
	}

	return partnerships, totalCount, nil
}

func (r *repository) UpdateStatus(ctx context.Context, id uuid.UUID, status PartnershipStatus, rejectionReason *string, decidedAt time.Time) error {
	query := `
		UPDATE partnership.transaksi_pengajuankerjasama 
		SET status_pengajuan_id = $1, catatan_keputusan = $2, 
			tanggal_keputusan = $3, updated_at = NOW()
		WHERE pengajuan_id = $4
	`

	result, err := r.db.Exec(ctx, query, status, rejectionReason, decidedAt, id)
	if err != nil {
		return fmt.Errorf("failed to update partnership status: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("partnership request not found")
	}

	return nil
}

func (r *repository) UpdateContract(ctx context.Context, id uuid.UUID, dokumenKontrak string, signedAt time.Time) error {
	query := `
		UPDATE partnership.transaksi_pengajuankerjasama 
		SET dokumen_perjanjian_id = $1, tanggal_upload_dokumen = $2, updated_at = NOW()
		WHERE pengajuan_id = $3
	`

	result, err := r.db.Exec(ctx, query, dokumenKontrak, signedAt, id)
	if err != nil {
		return fmt.Errorf("failed to update contract document: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("partnership request not found")
	}

	return nil
}

func (r *repository) GenerateRequestCode(ctx context.Context) (string, error) {
	// This would need to query the partnership schema
	// For now, return a simple format
	return "PKS-" + time.Now().Format("2006") + "-00000001", nil
}