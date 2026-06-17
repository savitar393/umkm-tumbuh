package certificates

import (
	"context"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/savitar393/umkm-tumbuh/services/training-service/internal/apperror"
)

type Repository struct {
	DB *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{DB: db}
}

func (r *Repository) GetUserCertificateDashboard(ctx context.Context, umkmID string) (*CertificateDashboardResponse, error) {
	query := `
		SELECT
			umkm_id, nama_umkm, pelaku_nama,
			total_pelatihan, pelatihan_selesai,
			total_sertifikat, sertifikat_terbit,
			pelatihan_terakhir_selesai, sertifikat_terakhir_terbit
		FROM training.v_user_certificate_dashboard
		WHERE umkm_id = $1
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
			sertifikat_id, pendaftaran_pelatihan_id, nomor_sertifikat,
			tanggal_pengajuan, tanggal_terbit, status_sertifikat_id,
			nama_status_sertifikat, dokumen_id, dokumen_url, catatan_validasi,
			pelatihan_id, judul_pelatihan, jenis_pelatihan,
			tanggal_selesai, progress_persen,
			umkm_id, nama_umkm, pelaku_nama
		FROM training.v_certificate_details
		WHERE umkm_id = $1
		ORDER BY tanggal_pengajuan DESC NULLS LAST
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
			sertifikat_id, pendaftaran_pelatihan_id, nomor_sertifikat,
			tanggal_pengajuan, tanggal_terbit, status_sertifikat_id,
			nama_status_sertifikat, dokumen_id, dokumen_url, catatan_validasi,
			pelatihan_id, judul_pelatihan, jenis_pelatihan,
			tanggal_selesai, progress_persen,
			umkm_id, nama_umkm, pelaku_nama
		FROM training.v_certificate_details
		WHERE sertifikat_id = $1
	`

	var cert CertificateResponse
	err := r.DB.QueryRow(ctx, query, sertifikatID).Scan(
		&cert.SertifikatID, &cert.PendaftaranPelatihanID, &cert.NomorSertifikat,
		&cert.TanggalPengajuan, &cert.TanggalTerbit, &cert.StatusSertifikatID,
		&cert.NamaStatusSertifikat, &cert.DokumenID, &cert.DokumenURL, &cert.CatatanValidasi,
		&cert.PelatihanID, &cert.JudulPelatihan, &cert.JenisPelatihan,
		&cert.TanggalSelesai, &cert.ProgressPersen,
		&cert.UMKMID, &cert.NamaUMKM, &cert.PelakuNama,
	)

	if err != nil {
		return nil, err
	}

	return &cert, nil
}

func (r *Repository) RequestCertificate(ctx context.Context, pendaftaranPelatihanID string) (*CertificateResponse, error) {
	var statusPendaftaran string
	statusQuery := `
		SELECT status_pendaftaran_pelatihan_id
		FROM training.transaksi_pendaftaranpelatihan
		WHERE pendaftaran_pelatihan_id = $1
	`
	err := r.DB.QueryRow(ctx, statusQuery, pendaftaranPelatihanID).Scan(&statusPendaftaran)
	if err == pgx.ErrNoRows {
		return nil, apperror.New(http.StatusNotFound, "Data pendaftaran pelatihan tidak ditemukan")
	}
	if err != nil {
		return nil, err
	}
	if statusPendaftaran != "SELESAI" {
		return nil, apperror.New(http.StatusBadRequest, "Sertifikat hanya dapat diajukan untuk pelatihan yang sudah selesai")
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
