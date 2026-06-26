package certificates

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/apperror"
)

var allowedSortColumns = map[string]bool{
	"tanggal_pengajuan": true,
	"tanggal_terbit":    true,
	"pelaku_nama":       true,
	"nama_umkm":         true,
	"judul_pelatihan":   true,
	"progress_persen":   true,
	"status_sertifikat_id": true,
}

type Repository struct {
	DB *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{DB: db}
}

func (r *Repository) GetUserCertificateDashboard(ctx context.Context, umkmID string) (*CertificateDashboardResponse, error) {
	query := `
		SELECT
			mu.umkm_id,
			mu.nama_umkm,
			COALESCE(mpu.nama_pelaku, '') AS pelaku_nama,
			COUNT(DISTINCT tp.pendaftaran_pelatihan_id)::int AS total_pelatihan,
			COUNT(DISTINCT tp.pendaftaran_pelatihan_id) FILTER (
				WHERE tp.progress_persen >= 100
				   OR tp.status_pendaftaran_pelatihan_id = 'SELESAI'
			)::int AS pelatihan_selesai,
			COUNT(DISTINCT ts.sertifikat_id)::int AS total_sertifikat,
			COUNT(DISTINCT ts.sertifikat_id) FILTER (
				WHERE ts.status_sertifikat_id = 'TERBIT'
			)::int AS sertifikat_terbit,
			MAX(tp.tanggal_selesai) AS pelatihan_terakhir_selesai,
			MAX(ts.tanggal_terbit) AS sertifikat_terakhir_terbit
		FROM user_mgmt.master_umkm mu
		LEFT JOIN user_mgmt.master_pelakuumkm mpu
			ON mpu.pelaku_umkm_id = mu.pelaku_umkm_id
		LEFT JOIN training.transaksi_pendaftaranpelatihan tp
			ON tp.umkm_id = mu.umkm_id
		LEFT JOIN training.transaksi_sertifikatpelatihan ts
			ON ts.pendaftaran_pelatihan_id = tp.pendaftaran_pelatihan_id
		WHERE mu.umkm_id = $1
		  AND mu.is_deleted = FALSE
		GROUP BY mu.umkm_id, mu.nama_umkm, mpu.nama_pelaku
	`

	var dashboard CertificateDashboardResponse
	err := r.DB.QueryRow(ctx, query, umkmID).Scan(
		&dashboard.UMKMID, &dashboard.NamaUMKM, &dashboard.PelakuNama,
		&dashboard.TotalPelatihan, &dashboard.PelatihanSelesai,
		&dashboard.TotalSertifikat, &dashboard.SertifikatTerbit,
		&dashboard.PelatihanTerakhirSelesai, &dashboard.SertifikatTerakhirTerbit,
	)

	if err == pgx.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return &dashboard, nil
}

func (r *Repository) GetUserCertificates(ctx context.Context, umkmID string) ([]CertificateResponse, error) {
	query := `
		SELECT
			ts.sertifikat_id, ts.pendaftaran_pelatihan_id, ts.nomor_sertifikat,
			ts.tanggal_pengajuan, ts.tanggal_terbit, ts.status_sertifikat_id,
			rss.nama_status_sertifikat, ts.dokumen_id, tdu.public_url, ts.catatan_validasi,
			mpp.pelatihan_id, mpp.judul_pelatihan,
			rjp.nama_jenis_pelatihan,
			tp.tanggal_selesai, tp.progress_persen,
			tp.umkm_id, mu.nama_umkm, mpu.nama_pelaku,
			COALESCE(mpp.mentor_nama, 'Mentor') AS mentor_nama
		FROM training.transaksi_sertifikatpelatihan ts
		JOIN training.transaksi_pendaftaranpelatihan tp ON ts.pendaftaran_pelatihan_id = tp.pendaftaran_pelatihan_id
		JOIN training.master_programpelatihan mpp ON tp.pelatihan_id = mpp.pelatihan_id
		JOIN ref.ref_statussertifikat rss ON ts.status_sertifikat_id = rss.status_sertifikat_id
		JOIN ref.ref_jenispelatihan rjp ON mpp.jenis_pelatihan_id = rjp.jenis_pelatihan_id
		JOIN user_mgmt.master_umkm mu ON tp.umkm_id = mu.umkm_id
		JOIN user_mgmt.master_pelakuumkm mpu ON mu.pelaku_umkm_id = mpu.pelaku_umkm_id
		LEFT JOIN document.transaksi_dokumenterunggah tdu ON ts.dokumen_id = tdu.dokumen_id
		WHERE tp.umkm_id = $1
		ORDER BY ts.tanggal_pengajuan DESC NULLS LAST
	`

	rows, err := r.DB.Query(ctx, query, umkmID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var certificates []CertificateResponse
	for rows.Next() {
		var cert CertificateResponse
		err := rows.Scan(
			&cert.SertifikatID, &cert.PendaftaranPelatihanID, &cert.NomorSertifikat,
			&cert.TanggalPengajuan, &cert.TanggalTerbit, &cert.StatusSertifikatID,
			&cert.NamaStatusSertifikat, &cert.DokumenID, &cert.DokumenURL, &cert.CatatanValidasi,
			&cert.PelatihanID, &cert.JudulPelatihan, &cert.JenisPelatihan,
			&cert.TanggalSelesai, &cert.ProgressPersen,
			&cert.UMKMID, &cert.NamaUMKM, &cert.PelakuNama,
			&cert.MentorNama,
		)
		if err != nil {
			return nil, err
		}
		certificates = append(certificates, cert)
	}

	return certificates, rows.Err()
}

func (r *Repository) GetCertificateByID(ctx context.Context, sertifikatID int64) (*CertificateResponse, error) {
	query := `
		SELECT
			ts.sertifikat_id, ts.pendaftaran_pelatihan_id, ts.nomor_sertifikat,
			ts.tanggal_pengajuan, ts.tanggal_terbit, ts.status_sertifikat_id,
			rss.nama_status_sertifikat, ts.dokumen_id, tdu.public_url, ts.catatan_validasi,
			mpp.pelatihan_id, mpp.judul_pelatihan,
			rjp.nama_jenis_pelatihan,
			tp.tanggal_selesai, tp.progress_persen,
			tp.umkm_id, mu.nama_umkm, mpu.nama_pelaku,
			COALESCE(mpp.mentor_nama, 'Mentor') AS mentor_nama
		FROM training.transaksi_sertifikatpelatihan ts
		JOIN training.transaksi_pendaftaranpelatihan tp ON ts.pendaftaran_pelatihan_id = tp.pendaftaran_pelatihan_id
		JOIN training.master_programpelatihan mpp ON tp.pelatihan_id = mpp.pelatihan_id
		JOIN ref.ref_statussertifikat rss ON ts.status_sertifikat_id = rss.status_sertifikat_id
		JOIN ref.ref_jenispelatihan rjp ON mpp.jenis_pelatihan_id = rjp.jenis_pelatihan_id
		JOIN user_mgmt.master_umkm mu ON tp.umkm_id = mu.umkm_id
		JOIN user_mgmt.master_pelakuumkm mpu ON mu.pelaku_umkm_id = mpu.pelaku_umkm_id
		LEFT JOIN document.transaksi_dokumenterunggah tdu ON ts.dokumen_id = tdu.dokumen_id
		WHERE ts.sertifikat_id = $1
	`

	var cert CertificateResponse
	err := r.DB.QueryRow(ctx, query, sertifikatID).Scan(
		&cert.SertifikatID, &cert.PendaftaranPelatihanID, &cert.NomorSertifikat,
		&cert.TanggalPengajuan, &cert.TanggalTerbit, &cert.StatusSertifikatID,
		&cert.NamaStatusSertifikat, &cert.DokumenID, &cert.DokumenURL, &cert.CatatanValidasi,
		&cert.PelatihanID, &cert.JudulPelatihan, &cert.JenisPelatihan,
		&cert.TanggalSelesai, &cert.ProgressPersen,
		&cert.UMKMID, &cert.NamaUMKM, &cert.PelakuNama,
		&cert.MentorNama,
	)

	if err != nil {
		return nil, err
	}

	return &cert, nil
}

func (r *Repository) ApproveCertificate(ctx context.Context, sertifikatID int64) error {
	query := `
		UPDATE training.transaksi_sertifikatpelatihan
		SET status_sertifikat_id = 'TERBIT',
		    tanggal_terbit = NOW()
		WHERE sertifikat_id = $1
	`
	_, err := r.DB.Exec(ctx, query, sertifikatID)
	if err != nil {
		return err
	}
	return nil
}
func (r *Repository) buildSearchCondition(search string, startIdx int) (string, []any) {
	if search == "" {
		return "", nil
	}
	cond := fmt.Sprintf(`AND (nama_umkm ILIKE '%%' || $%d::text || '%%' OR pelaku_nama ILIKE '%%' || $%d::text || '%%' OR judul_pelatihan ILIKE '%%' || $%d::text || '%%')`, startIdx, startIdx, startIdx)
	return cond, []any{search}
}

func (r *Repository) buildOrderClause(sortBy, sortOrder string) string {
	if !allowedSortColumns[sortBy] {
		sortBy = "tanggal_pengajuan"
	}
	sortOrder = strings.ToUpper(sortOrder)
	if sortOrder != "ASC" && sortOrder != "DESC" {
		sortOrder = "DESC"
	}
	return fmt.Sprintf("ORDER BY %s %s NULLS LAST", sortBy, sortOrder)
}

func (r *Repository) ListCertificatesByStatus(ctx context.Context, status, search, sortBy, sortOrder string, limit, offset int) ([]CertificateResponse, error) {
	searchCond, searchArgs := r.buildSearchCondition(search, 2)
	orderClause := r.buildOrderClause(sortBy, sortOrder)

	args := []any{status}
	if searchArgs != nil {
		args = append(args, searchArgs...)
	}
	argIdx := len(args) + 1
	args = append(args, limit, offset)

	query := fmt.Sprintf(`
		SELECT
			ts.sertifikat_id, ts.pendaftaran_pelatihan_id, ts.nomor_sertifikat,
			ts.tanggal_pengajuan, ts.tanggal_terbit, ts.status_sertifikat_id,
			rss.nama_status_sertifikat, ts.dokumen_id, tdu.public_url, ts.catatan_validasi,
			mpp.pelatihan_id, mpp.judul_pelatihan,
			rjp.nama_jenis_pelatihan,
			tp.tanggal_selesai, tp.progress_persen,
			tp.umkm_id, mu.nama_umkm, mpu.nama_pelaku,
			COALESCE(mpp.mentor_nama, 'Mentor') AS mentor_nama
		FROM training.transaksi_sertifikatpelatihan ts
		JOIN training.transaksi_pendaftaranpelatihan tp ON ts.pendaftaran_pelatihan_id = tp.pendaftaran_pelatihan_id
		JOIN training.master_programpelatihan mpp ON tp.pelatihan_id = mpp.pelatihan_id
		JOIN ref.ref_statussertifikat rss ON ts.status_sertifikat_id = rss.status_sertifikat_id
		JOIN ref.ref_jenispelatihan rjp ON mpp.jenis_pelatihan_id = rjp.jenis_pelatihan_id
		JOIN user_mgmt.master_umkm mu ON tp.umkm_id = mu.umkm_id
		JOIN user_mgmt.master_pelakuumkm mpu ON mu.pelaku_umkm_id = mpu.pelaku_umkm_id
		LEFT JOIN document.transaksi_dokumenterunggah tdu ON ts.dokumen_id = tdu.dokumen_id
		WHERE ($1 = '' OR ts.status_sertifikat_id = $1)
		%s
		%s
		LIMIT $%d OFFSET $%d
	`, searchCond, orderClause, argIdx, argIdx+1)

	rows, err := r.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	certificates := make([]CertificateResponse, 0)
	for rows.Next() {
		var cert CertificateResponse
		err := rows.Scan(
			&cert.SertifikatID, &cert.PendaftaranPelatihanID, &cert.NomorSertifikat,
			&cert.TanggalPengajuan, &cert.TanggalTerbit, &cert.StatusSertifikatID,
			&cert.NamaStatusSertifikat, &cert.DokumenID, &cert.DokumenURL, &cert.CatatanValidasi,
			&cert.PelatihanID, &cert.JudulPelatihan, &cert.JenisPelatihan,
			&cert.TanggalSelesai, &cert.ProgressPersen,
			&cert.UMKMID, &cert.NamaUMKM, &cert.PelakuNama,
			&cert.MentorNama,
		)
		if err != nil {
			return nil, err
		}
		certificates = append(certificates, cert)
	}
	return certificates, rows.Err()
}

func (r *Repository) CountCertificatesByStatus(ctx context.Context, status, search string) (int, error) {
	searchCond, searchArgs := r.buildSearchCondition(search, 2)

	args := []any{status}
	if searchArgs != nil {
		args = append(args, searchArgs...)
	}

	query := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM training.v_certificate_details
		WHERE ($1 = '' OR status_sertifikat_id = $1)
		%s
	`, searchCond)

	var count int
	err := r.DB.QueryRow(ctx, query, args...).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *Repository) GetCertificateStats(ctx context.Context) (*CertificateStatsResponse, error) {
	query := `
		SELECT
			COALESCE(SUM(CASE WHEN status_sertifikat_id = 'DIAJUKAN' THEN 1 ELSE 0 END), 0) AS diajukan,
			COALESCE(SUM(CASE WHEN status_sertifikat_id = 'TERBIT' THEN 1 ELSE 0 END), 0) AS terbit,
			COALESCE(SUM(CASE WHEN status_sertifikat_id = 'DITOLAK' THEN 1 ELSE 0 END), 0) AS ditolak
		FROM training.v_certificate_details
	`
	var stats CertificateStatsResponse
	err := r.DB.QueryRow(ctx, query).Scan(&stats.Diajukan, &stats.Terbit, &stats.Ditolak)
	if err != nil {
		return nil, err
	}
	return &stats, nil
}

func (r *Repository) RejectCertificate(ctx context.Context, sertifikatID int64, catatan string) error {
	query := `
		UPDATE training.transaksi_sertifikatpelatihan
		SET status_sertifikat_id = 'DITOLAK',
		    catatan_validasi = $2
		WHERE sertifikat_id = $1
	`
	_, err := r.DB.Exec(ctx, query, sertifikatID, catatan)
	return err
}

func (r *Repository) RequestCertificate(ctx context.Context, pendaftaranPelatihanID string) (*CertificateResponse, error) {
	var statusPendaftaran string
	var progressPersen float64

	statusQuery := `
		SELECT status_pendaftaran_pelatihan_id, COALESCE(progress_persen, 0)
		FROM training.transaksi_pendaftaranpelatihan
		WHERE pendaftaran_pelatihan_id = $1
	`
	err := r.DB.QueryRow(ctx, statusQuery, pendaftaranPelatihanID).Scan(&statusPendaftaran, &progressPersen)
	if err == pgx.ErrNoRows {
		return nil, apperror.New(http.StatusNotFound, "Data pendaftaran pelatihan tidak ditemukan")
	}
	if err != nil {
		return nil, err
	}

	if statusPendaftaran != "SELESAI" && progressPersen < 100 {
		return nil, apperror.New(http.StatusBadRequest, "Sertifikat hanya dapat diajukan untuk pelatihan dengan progress 100%")
	}

	if statusPendaftaran != "SELESAI" && progressPersen >= 100 {
		_, err = r.DB.Exec(ctx, `
			UPDATE training.transaksi_pendaftaranpelatihan
			SET status_pendaftaran_pelatihan_id = 'SELESAI',
			    progress_persen = 100,
			    tanggal_selesai = COALESCE(tanggal_selesai, NOW())
			WHERE pendaftaran_pelatihan_id = $1
		`, pendaftaranPelatihanID)
		if err != nil {
			return nil, err
		}
	}

	var existingID *int64
	checkQuery := `
		SELECT sertifikat_id
		FROM training.transaksi_sertifikatpelatihan
		WHERE pendaftaran_pelatihan_id = $1
	`
	err = r.DB.QueryRow(ctx, checkQuery, pendaftaranPelatihanID).Scan(&existingID)
	if err != nil && err != pgx.ErrNoRows {
		return nil, err
	}

	if existingID != nil {
		return r.GetCertificateByID(ctx, *existingID)
	}

	var nomorSertifikat string
	genQuery := `SELECT training.generate_certificate_number()`
	err = r.DB.QueryRow(ctx, genQuery).Scan(&nomorSertifikat)
	if err != nil {
		return nil, err
	}

	insertQuery := `
		INSERT INTO training.transaksi_sertifikatpelatihan (
			pendaftaran_pelatihan_id, status_sertifikat_id,
			nomor_sertifikat, tanggal_pengajuan
		) VALUES ($1, 'DIAJUKAN', $2, NOW())
		RETURNING sertifikat_id
	`

	var sertifikatID int64
	err = r.DB.QueryRow(ctx, insertQuery, pendaftaranPelatihanID, nomorSertifikat).Scan(&sertifikatID)
	if err != nil {
		return nil, err
	}

	return r.GetCertificateByID(ctx, sertifikatID)
}
