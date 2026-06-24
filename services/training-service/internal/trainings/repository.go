package trainings

import (
	"context"
	"errors"
	"net/http"
	"strconv"
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
	`

	tag, err := r.DB.Exec(ctx, query, pendaftaranID, modulSelesai, progressPersen)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperror.New(http.StatusNotFound, "Pendaftaran pelatihan tidak ditemukan")
	}
	return nil
}

// MarkTrainingComplete - tandai pelatihan selesai
func (r *Repository) MarkTrainingComplete(ctx context.Context, pendaftaranID string, dokumenEvaluasiID *string) error {
	query := `
		UPDATE training.transaksi_pendaftaranpelatihan
		SET tanggal_selesai = NOW(),
		    progress_persen = 100,
		    modul_selesai = total_modul_snapshot,
		    status_pendaftaran_pelatihan_id = 'SELESAI',
		    dokumen_evaluasi_id = $2
		WHERE pendaftaran_pelatihan_id = $1
	`

	var err error
	if dokumenEvaluasiID != nil {
		_, err = r.DB.Exec(ctx, query, pendaftaranID, *dokumenEvaluasiID)
	} else {
		_, err = r.DB.Exec(ctx, query, pendaftaranID, nil)
	}
	if err != nil {
		return apperror.New(http.StatusInternalServerError, err.Error())
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


// ============= ADMIN METHODS =============

// GetAllTrainingsAdmin returns all trainings with pagination and filters for admin
func (r *Repository) GetAllTrainingsAdmin(ctx context.Context, filters TrainingFilters) ([]TrainingProgramResponse, int, error) {
	// Build WHERE clause
	whereClause := "WHERE mpp.is_deleted = FALSE"
	args := []interface{}{}
	argCount := 1

	if filters.Status != "" && filters.Status != "ALL" {
		whereClause += " AND mpp.status_pelatihan_id = $" + strconv.Itoa(argCount)
		args = append(args, filters.Status)
		argCount++
	}

	if filters.Search != "" {
		whereClause += " AND (mpp.judul_pelatihan ILIKE $" + strconv.Itoa(argCount) + 
			" OR mpp.kode_pelatihan ILIKE $" + strconv.Itoa(argCount) + ")"
		args = append(args, "%"+filters.Search+"%")
		argCount++
	}

	// Count total
	countQuery := `
		SELECT COUNT(*)
		FROM training.master_programpelatihan mpp
		` + whereClause

	var total int
	err := r.DB.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Build ORDER BY
	orderBy := "mpp.created_at DESC"
	if filters.SortBy != "" {
		direction := "DESC"
		if strings.ToUpper(filters.SortOrder) == "ASC" {
			direction = "ASC"
		}
		orderBy = "mpp." + filters.SortBy + " " + direction
	}

	// Build main query with pagination
	offset := (filters.Page - 1) * filters.Limit
	
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
		` + whereClause + `
		ORDER BY ` + orderBy + `
		LIMIT $` + strconv.Itoa(argCount) + ` OFFSET $` + strconv.Itoa(argCount+1)

	args = append(args, filters.Limit, offset)

	rows, err := r.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

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
			return nil, 0, err
		}
		trainings = append(trainings, t)
	}

	return trainings, total, rows.Err()
}

// CreateTraining creates a new training program
func (r *Repository) CreateTraining(ctx context.Context, req CreateTrainingRequest) (*TrainingProgramResponse, error) {
	pelatihanID := generateID("PLT")
	kodePelatihan := "PLT-" + time.Now().Format("2006") + "-" + pelatihanID[3:]
	now := time.Now()

	query := `
		INSERT INTO training.master_programpelatihan (
			pelatihan_id, kode_pelatihan, dibuat_oleh_admin_id, jenis_pelatihan_id,
			status_pelatihan_id, judul_pelatihan, deskripsi_pelatihan, mentor_nama,
			durasi_jam, total_modul, harga, akses_seumur_hidup, masa_akses_hari,
			thumbnail_url, syarat_ketentuan, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, 'DRAFT', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
		)
	`

	_, err := r.DB.Exec(ctx, query,
		pelatihanID, kodePelatihan, req.DibuatOlehAdminID, req.JenisPelatihanID,
		req.JudulPelatihan, req.DeskripsiPelatihan, req.MentorNama, req.DurasiJam,
		req.TotalModul, req.Harga, req.AksesSeumurHidup, req.MasaAksesHari,
		req.ThumbnailURL, req.SyaratKetentuan, now, now,
	)
	if err != nil {
		return nil, err
	}

	// Return the created training
	return r.GetTrainingByID(ctx, pelatihanID)
}

// UpdateTraining updates an existing training
func (r *Repository) UpdateTraining(ctx context.Context, pelatihanID string, req UpdateTrainingRequest) (*TrainingProgramResponse, error) {
	query := `
		UPDATE training.master_programpelatihan
		SET jenis_pelatihan_id = $2,
		    judul_pelatihan = $3,
		    deskripsi_pelatihan = $4,
		    mentor_nama = $5,
		    durasi_jam = $6,
		    total_modul = $7,
		    harga = $8,
		    akses_seumur_hidup = $9,
		    masa_akses_hari = $10,
		    thumbnail_url = $11,
		    syarat_ketentuan = $12,
		    updated_at = NOW()
		WHERE pelatihan_id = $1 AND is_deleted = FALSE
	`

	tag, err := r.DB.Exec(ctx, query,
		pelatihanID, req.JenisPelatihanID, req.JudulPelatihan, req.DeskripsiPelatihan,
		req.MentorNama, req.DurasiJam, req.TotalModul, req.Harga,
		req.AksesSeumurHidup, req.MasaAksesHari, req.ThumbnailURL, req.SyaratKetentuan,
	)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, apperror.New(http.StatusNotFound, "Pelatihan tidak ditemukan")
	}

	return r.GetTrainingByID(ctx, pelatihanID)
}

// DeleteTraining soft deletes a training
func (r *Repository) DeleteTraining(ctx context.Context, pelatihanID string) error {
	query := `
		UPDATE training.master_programpelatihan
		SET is_deleted = TRUE, deleted_at = NOW(), updated_at = NOW()
		WHERE pelatihan_id = $1 AND is_deleted = FALSE
	`

	tag, err := r.DB.Exec(ctx, query, pelatihanID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperror.New(http.StatusNotFound, "Pelatihan tidak ditemukan")
	}

	return nil
}

// UpdateTrainingStatus updates the status of a training
func (r *Repository) UpdateTrainingStatus(ctx context.Context, pelatihanID, status string) error {
	var tanggalPublish *time.Time
	if status == "PUBLISHED" {
		now := time.Now()
		tanggalPublish = &now
	}

	query := `
		UPDATE training.master_programpelatihan
		SET status_pelatihan_id = $2,
		    tanggal_publish = COALESCE($3, tanggal_publish),
		    updated_at = NOW()
		WHERE pelatihan_id = $1 AND is_deleted = FALSE
	`

	tag, err := r.DB.Exec(ctx, query, pelatihanID, status, tanggalPublish)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperror.New(http.StatusNotFound, "Pelatihan tidak ditemukan")
	}

	return nil
}

// GetTrainingStats returns statistics for admin dashboard
func (r *Repository) GetTrainingStats(ctx context.Context) (*TrainingStatsResponse, error) {
	query := `
		SELECT 
			COUNT(*) as total_trainings,
			COUNT(*) FILTER (WHERE status_pelatihan_id = 'PUBLISHED') as published_count,
			COUNT(*) FILTER (WHERE status_pelatihan_id = 'DRAFT') as draft_count,
			COUNT(*) FILTER (WHERE status_pelatihan_id = 'ARCHIVED') as archived_count
		FROM training.master_programpelatihan
		WHERE is_deleted = FALSE
	`

	var stats TrainingStatsResponse
	err := r.DB.QueryRow(ctx, query).Scan(
		&stats.TotalTrainings,
		&stats.PublishedCount,
		&stats.DraftCount,
		&stats.ArchivedCount,
	)
	if err != nil {
		return nil, err
	}

	// Get enrollment stats
	enrollQuery := `
		SELECT 
			COUNT(*) as total_enrollments,
			COUNT(*) FILTER (WHERE tanggal_selesai IS NOT NULL) as total_completions
		FROM training.transaksi_pendaftaranpelatihan
	`

	err = r.DB.QueryRow(ctx, enrollQuery).Scan(
		&stats.TotalEnrollments,
		&stats.TotalCompletions,
	)
	if err != nil {
		return nil, err
	}

	return &stats, nil
}
