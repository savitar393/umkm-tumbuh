package trainings

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
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

// GetAllTrainings - ambil semua program pelatihan yang aktif
func (r *Repository) GetAllTrainings(ctx context.Context) ([]TrainingProgramResponse, error) {
	query := `
		SELECT 
			mpp.pelatihan_id,
			mpp.kode_pelatihan,
			mpp.judul_pelatihan,
			mpp.deskripsi_pelatihan,
			mpp.mentor_nama,
			mpp.durasi_jam,
			mpp.total_modul,
			mpp.harga,
			mpp.akses_seumur_hidup,
			mpp.masa_akses_hari,
			mpp.rating_rata_rata,
			mpp.jumlah_alumni,
			mpp.thumbnail_url,
			mpp.syarat_ketentuan,
			mpp.tanggal_publish,
			rjp.nama_jenis_pelatihan,
			rsp.nama_status_pelatihan,
			mpp.created_at,
			mpp.updated_at
		FROM training.master_programpelatihan mpp
		INNER JOIN ref.ref_jenispelatihan rjp ON mpp.jenis_pelatihan_id = rjp.jenis_pelatihan_id
		INNER JOIN ref.ref_statuspelatihan rsp ON mpp.status_pelatihan_id = rsp.status_pelatihan_id
		WHERE mpp.is_deleted = FALSE 
			AND mpp.tanggal_publish IS NOT NULL
			AND mpp.status_pelatihan_id IN ('PUBLISHED', 'ONGOING')
		ORDER BY mpp.created_at DESC
	`

	rows, err := r.DB.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Gunakan make agar hasil selalu array, bukan null di JSON
	trainings := make([]TrainingProgramResponse, 0)
	for rows.Next() {
		var t TrainingProgramResponse
		err := rows.Scan(
			&t.PelatihanID, &t.KodePelatihan, &t.JudulPelatihan, &t.DeskripsiPelatihan,
			&t.MentorNama, &t.DurasiJam, &t.TotalModul, &t.Harga, &t.AksesSeumurHidup,
			&t.MasaAksesHari, &t.RatingRataRata, &t.JumlahAlumni, &t.ThumbnailURL,
			&t.SyaratKetentuan, &t.TanggalPublish, &t.JenisPelatihan, &t.StatusPelatihan,
			&t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		trainings = append(trainings, t)
	}

	return trainings, rows.Err()
}

// GetTrainingByID - ambil detail program pelatihan
func (r *Repository) GetTrainingByID(ctx context.Context, pelatihanID string) (*TrainingProgramResponse, error) {
	query := `
		SELECT 
			mpp.pelatihan_id, mpp.kode_pelatihan, mpp.judul_pelatihan, 
			mpp.deskripsi_pelatihan, mpp.mentor_nama, mpp.durasi_jam, 
			mpp.total_modul, mpp.harga, mpp.akses_seumur_hidup, 
			mpp.masa_akses_hari, mpp.rating_rata_rata, mpp.jumlah_alumni, 
			mpp.thumbnail_url, mpp.syarat_ketentuan, mpp.tanggal_publish,
			rjp.nama_jenis_pelatihan, rsp.nama_status_pelatihan,
			mpp.created_at, mpp.updated_at
		FROM training.master_programpelatihan mpp
		INNER JOIN ref.ref_jenispelatihan rjp ON mpp.jenis_pelatihan_id = rjp.jenis_pelatihan_id
		INNER JOIN ref.ref_statuspelatihan rsp ON mpp.status_pelatihan_id = rsp.status_pelatihan_id
		WHERE mpp.pelatihan_id = $1 AND mpp.is_deleted = FALSE
	`

	var t TrainingProgramResponse
	err := r.DB.QueryRow(ctx, query, pelatihanID).Scan(
		&t.PelatihanID, &t.KodePelatihan, &t.JudulPelatihan, &t.DeskripsiPelatihan,
		&t.MentorNama, &t.DurasiJam, &t.TotalModul, &t.Harga, &t.AksesSeumurHidup,
		&t.MasaAksesHari, &t.RatingRataRata, &t.JumlahAlumni, &t.ThumbnailURL,
		&t.SyaratKetentuan, &t.TanggalPublish, &t.JenisPelatihan, &t.StatusPelatihan,
		&t.CreatedAt, &t.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &t, nil
}

// GetModulesByTrainingID - ambil modul-modul dari suatu pelatihan
func (r *Repository) GetModulesByTrainingID(ctx context.Context, pelatihanID string) ([]TrainingModuleResponse, error) {
	query := `
		SELECT 
			mm.modul_id, mm.pelatihan_id, mm.urutan_modul, 
			mm.judul_modul, mm.deskripsi_modul, mm.durasi_menit, 
			mm.materi_url, mm.is_preview, mm.status_aktif,
			mpp.judul_pelatihan
		FROM training.master_modulpelatihan mm
		INNER JOIN training.master_programpelatihan mpp ON mm.pelatihan_id = mpp.pelatihan_id
		WHERE mm.pelatihan_id = $1 AND mm.status_aktif = TRUE
		ORDER BY mm.urutan_modul ASC
	`

	rows, err := r.DB.Query(ctx, query, pelatihanID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Gunakan make agar hasil selalu array kosong [], bukan null di JSON
	modules := make([]TrainingModuleResponse, 0)
	for rows.Next() {
		var m TrainingModuleResponse
		err := rows.Scan(
			&m.ModulID, &m.PelatihanID, &m.UrutanModul, &m.JudulModul,
			&m.DeskripsiModul, &m.DurasiMenit, &m.MateriURL, &m.IsPreview,
			&m.StatusAktif, &m.JudulPelatihan,
		)
		if err != nil {
			return nil, err
		}
		modules = append(modules, m)
	}

	return modules, rows.Err()
}

// EnrollUser - daftarkan user ke pelatihan
func (r *Repository) EnrollUser(ctx context.Context, umkmID, pelatihanID string, training *TrainingProgramResponse) (*EnrollmentResponse, error) {
	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	existing, err := r.GetEnrollmentByUserAndTrainingTx(ctx, tx, umkmID, pelatihanID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	if existing != nil {
		return existing, nil
	}

	pendaftaranID := generateID("DFTR")
	now := time.Now()

	var aksesMulai, aksesAkhir *time.Time
	aksesMulai = &now

	if training.MasaAksesHari != nil && *training.MasaAksesHari > 0 {
		end := now.AddDate(0, 0, *training.MasaAksesHari)
		aksesAkhir = &end
	}

	query := `
		INSERT INTO training.transaksi_pendaftaranpelatihan (
			pendaftaran_pelatihan_id, umkm_id, pelatihan_id, 
			status_pendaftaran_pelatihan_id, tanggal_daftar, 
			akses_mulai_at, akses_berakhir_at, total_modul_snapshot
		) VALUES ($1, $2, $3, 'TERDAFTAR', $4, $5, $6, $7)
		RETURNING pendaftaran_pelatihan_id, tanggal_daftar, akses_mulai_at, akses_berakhir_at
	`

	var enrollment EnrollmentResponse
	err = tx.QueryRow(ctx, query,
		pendaftaranID, umkmID, pelatihanID, now, aksesMulai, aksesAkhir, training.TotalModul,
	).Scan(
		&enrollment.PendaftaranPelatihanID,
		&enrollment.TanggalDaftar,
		&enrollment.AksesMulaiAt,
		&enrollment.AksesBerakhirAt,
	)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	enrollment.UMKMID = umkmID
	enrollment.PelatihanID = pelatihanID
	enrollment.StatusPendaftaran = "TERDAFTAR"
	enrollment.ProgressPersen = 0
	enrollment.ModulSelesai = 0
	enrollment.TotalModulSnapshot = training.TotalModul
	enrollment.JudulPelatihan = training.JudulPelatihan

	return &enrollment, nil
}

// GetEnrollmentByUserAndTrainingTx - cek enrollment dalam transaksi
func (r *Repository) GetEnrollmentByUserAndTrainingTx(ctx context.Context, tx pgx.Tx, umkmID, pelatihanID string) (*EnrollmentResponse, error) {
	query := `
		SELECT 
			tp.pendaftaran_pelatihan_id, tp.umkm_id, tp.pelatihan_id,
			mpp.judul_pelatihan, rsp.nama_status_pendaftaran,
			tp.tanggal_daftar, tp.akses_mulai_at, tp.akses_berakhir_at,
			tp.terakhir_diakses_at, tp.progress_persen, tp.modul_selesai,
			tp.total_modul_snapshot, tp.tanggal_selesai
		FROM training.transaksi_pendaftaranpelatihan tp
		INNER JOIN training.master_programpelatihan mpp ON tp.pelatihan_id = mpp.pelatihan_id
		INNER JOIN ref.ref_statuspendaftaranpelatihan rsp ON tp.status_pendaftaran_pelatihan_id = rsp.status_pendaftaran_pelatihan_id
		WHERE tp.umkm_id = $1 AND tp.pelatihan_id = $2
	`

	var e EnrollmentResponse
	err := tx.QueryRow(ctx, query, umkmID, pelatihanID).Scan(
		&e.PendaftaranPelatihanID, &e.UMKMID, &e.PelatihanID, &e.JudulPelatihan,
		&e.StatusPendaftaran, &e.TanggalDaftar, &e.AksesMulaiAt, &e.AksesBerakhirAt,
		&e.TerakhirDiaksesAt, &e.ProgressPersen, &e.ModulSelesai, &e.TotalModulSnapshot,
		&e.TanggalSelesai,
	)
	if err != nil {
		return nil, err
	}

	return &e, nil
}

// GetEnrollmentByUserAndTraining - cek apakah user sudah enroll
func (r *Repository) GetEnrollmentByUserAndTraining(ctx context.Context, umkmID, pelatihanID string) (*EnrollmentResponse, error) {
	query := `
		SELECT 
			tp.pendaftaran_pelatihan_id, tp.umkm_id, tp.pelatihan_id,
			mpp.judul_pelatihan, rsp.nama_status_pendaftaran,
			tp.tanggal_daftar, tp.akses_mulai_at, tp.akses_berakhir_at,
			tp.terakhir_diakses_at, tp.progress_persen, tp.modul_selesai,
			tp.total_modul_snapshot, tp.tanggal_selesai
		FROM training.transaksi_pendaftaranpelatihan tp
		INNER JOIN training.master_programpelatihan mpp ON tp.pelatihan_id = mpp.pelatihan_id
		INNER JOIN ref.ref_statuspendaftaranpelatihan rsp ON tp.status_pendaftaran_pelatihan_id = rsp.status_pendaftaran_pelatihan_id
		WHERE tp.umkm_id = $1 AND tp.pelatihan_id = $2
	`

	var e EnrollmentResponse
	err := r.DB.QueryRow(ctx, query, umkmID, pelatihanID).Scan(
		&e.PendaftaranPelatihanID, &e.UMKMID, &e.PelatihanID, &e.JudulPelatihan,
		&e.StatusPendaftaran, &e.TanggalDaftar, &e.AksesMulaiAt, &e.AksesBerakhirAt,
		&e.TerakhirDiaksesAt, &e.ProgressPersen, &e.ModulSelesai, &e.TotalModulSnapshot,
		&e.TanggalSelesai,
	)

	if err == pgx.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return &e, nil
}

// GetUserEnrollments - ambil semua enrollment user
func (r *Repository) GetUserEnrollments(ctx context.Context, umkmID string) ([]EnrollmentResponse, error) {
	query := `
		SELECT 
			tp.pendaftaran_pelatihan_id, tp.umkm_id, tp.pelatihan_id,
			mpp.judul_pelatihan, rsp.nama_status_pendaftaran,
			tp.tanggal_daftar, tp.akses_mulai_at, tp.akses_berakhir_at,
			tp.terakhir_diakses_at, tp.progress_persen, tp.modul_selesai,
			tp.total_modul_snapshot, tp.tanggal_selesai
		FROM training.transaksi_pendaftaranpelatihan tp
		INNER JOIN training.master_programpelatihan mpp ON tp.pelatihan_id = mpp.pelatihan_id
		INNER JOIN ref.ref_statuspendaftaranpelatihan rsp ON tp.status_pendaftaran_pelatihan_id = rsp.status_pendaftaran_pelatihan_id
		WHERE tp.umkm_id = $1
		ORDER BY tp.tanggal_daftar DESC
	`

	rows, err := r.DB.Query(ctx, query, umkmID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Gunakan make agar hasil selalu array kosong [], bukan null di JSON
	enrollments := make([]EnrollmentResponse, 0)
	for rows.Next() {
		var e EnrollmentResponse
		err := rows.Scan(
			&e.PendaftaranPelatihanID, &e.UMKMID, &e.PelatihanID, &e.JudulPelatihan,
			&e.StatusPendaftaran, &e.TanggalDaftar, &e.AksesMulaiAt, &e.AksesBerakhirAt,
			&e.TerakhirDiaksesAt, &e.ProgressPersen, &e.ModulSelesai, &e.TotalModulSnapshot,
			&e.TanggalSelesai,
		)
		if err != nil {
			return nil, err
		}
		enrollments = append(enrollments, e)
	}

	return enrollments, rows.Err()
}

// UpdateProgress - update progress user dalam pelatihan
func (r *Repository) UpdateProgress(ctx context.Context, pendaftaranID string, modulSelesai int, progressPersen float64) error {
	query := `
		UPDATE training.transaksi_pendaftaranpelatihan
		SET modul_selesai = $2,
		    progress_persen = $3,
		    terakhir_diakses_at = NOW()
		WHERE pendaftaran_pelatihan_id = $1
		  AND $2 <= total_modul_snapshot
	`

	_, err := r.DB.Exec(ctx, query, pendaftaranID, modulSelesai, progressPersen)
	return err
}

// MarkTrainingComplete - tandai pelatihan selesai
// Hanya bisa jika semua modul sudah dikerjakan
func (r *Repository) MarkTrainingComplete(ctx context.Context, pendaftaranID string) error {
	query := `
		UPDATE training.transaksi_pendaftaranpelatihan
		SET tanggal_selesai = NOW(),
		    progress_persen = 100,
		    modul_selesai = total_modul_snapshot,
		    status_pendaftaran_pelatihan_id = 'SELESAI'
		WHERE pendaftaran_pelatihan_id = $1
		  AND modul_selesai >= total_modul_snapshot
	`

	res, err := r.DB.Exec(ctx, query, pendaftaranID)
	if err != nil {
		return err
	}

	if res.RowsAffected() == 0 {
		return apperror.New(http.StatusBadRequest, "pelatihan belum dapat diselesaikan, selesaikan semua modul terlebih dahulu")
	}

	return nil
}

// generateID - buat ID dengan prefix, bebas dash
// UUID asli: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 char dengan dash)
// Setelah hapus dash: 32 char hex murni
// Ambil 16 char pertama agar tidak melebihi batas kolom DB
func generateID(prefix string) string {
	raw := strings.ReplaceAll(uuid.New().String(), "-", "")
	return prefix + raw[:16]
}