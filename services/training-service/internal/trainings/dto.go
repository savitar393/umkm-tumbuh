package trainings

import "time"

// Training Program DTOs
type TrainingProgramResponse struct {
	PelatihanID        string     `json:"pelatihan_id"`
	KodePelatihan      string     `json:"kode_pelatihan"`
	JudulPelatihan     string     `json:"judul_pelatihan"`
	DeskripsiPelatihan *string    `json:"deskripsi_pelatihan"`
	MentorNama         *string    `json:"mentor_nama"`
	DurasiJam          int        `json:"durasi_jam"`
	TotalModul         int        `json:"total_modul"`
	Harga              float64    `json:"harga"`
	AksesSeumurHidup    bool       `json:"akses_seumur_hidup"`
	MasaAksesHari      *int       `json:"masa_akses_hari"`
	RatingRataRata     *float64   `json:"rating_rata_rata"`
	JumlahAlumni       int        `json:"jumlah_alumni"`
	ThumbnailURL       *string    `json:"thumbnail_url"`
	SyaratKetentuan    *string    `json:"syarat_ketentuan"`
	TanggalPublish     *time.Time `json:"tanggal_publish"`
	JenisPelatihan     string     `json:"jenis_pelatihan"`
	StatusPelatihan    string     `json:"status_pelatihan"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

type TrainingModuleResponse struct {
	ModulID        string  `json:"modul_id"`
	PelatihanID    string  `json:"pelatihan_id"`
	UrutanModul    int     `json:"urutan_modul"`
	JudulModul     string  `json:"judul_modul"`
	DeskripsiModul *string `json:"deskripsi_modul"`
	DurasiMenit    int     `json:"durasi_menit"`
	MateriURL      *string `json:"materi_url"`
	IsPreview      bool    `json:"is_preview"`
	StatusAktif    bool    `json:"status_aktif"`
	JudulPelatihan string  `json:"judul_pelatihan"`
}

type EnrollmentResponse struct {
	PendaftaranPelatihanID string     `json:"pendaftaran_pelatihan_id"`
	UMKMID                 string     `json:"umkm_id"`
	PelatihanID            string     `json:"pelatihan_id"`
	JudulPelatihan         string     `json:"judul_pelatihan"`
	StatusPendaftaran      string     `json:"status_pendaftaran"`
	TanggalDaftar          time.Time  `json:"tanggal_daftar"`
	AksesMulaiAt           *time.Time `json:"akses_mulai_at"`
	AksesBerakhirAt        *time.Time `json:"akses_berakhir_at"`
	TerakhirDiaksesAt      *time.Time `json:"terakhir_diakses_at"`
	ProgressPersen         float64    `json:"progress_persen"`
	ModulSelesai           int        `json:"modul_selesai"`
	TotalModulSnapshot     int        `json:"total_modul_snapshot"`
	TanggalSelesai         *time.Time `json:"tanggal_selesai"`
}

// EnrollRequest - request body untuk mendaftar pelatihan
type EnrollRequest struct {
	UMKMID      string `json:"umkm_id"`
	PelatihanID string `json:"pelatihan_id"`
}

// UpdateProgressRequest - request body untuk update progress modul
// TotalModul diambil dari enrollment snapshot agar konsisten
type UpdateProgressRequest struct {
	PendaftaranID string `json:"pendaftaran_pelatihan_id"`
	ModulSelesai  int    `json:"modul_selesai"`
	TotalModul    int    `json:"total_modul"`
}

// CompleteTrainingRequest - request body untuk menandai pelatihan selesai
type CompleteTrainingRequest struct {
	PendaftaranID    string  `json:"pendaftaran_pelatihan_id"`
	DokumenEvaluasiID *string `json:"dokumen_evaluasi_id"`
}

// TrainingDetailResponse - response detail pelatihan beserta modulnya
type TrainingDetailResponse struct {
	Training TrainingProgramResponse  `json:"training"`
	Modules  []TrainingModuleResponse `json:"modules"`
}


// Admin DTOs

type TrainingFilters struct {
	Page      int
	Limit     int
	Status    string
	Search    string
	SortBy    string
	SortOrder string
}

type CreateTrainingRequest struct {
	DibuatOlehAdminID   string   `json:"dibuat_oleh_admin_id"`
	JenisPelatihanID    string   `json:"jenis_pelatihan_id"`
	JudulPelatihan      string   `json:"judul_pelatihan"`
	DeskripsiPelatihan  *string  `json:"deskripsi_pelatihan"`
	MentorNama          *string  `json:"mentor_nama"`
	DurasiJam           int      `json:"durasi_jam"`
	TotalModul          int      `json:"total_modul"`
	Harga               float64  `json:"harga"`
	AksesSeumurHidup    bool     `json:"akses_seumur_hidup"`
	MasaAksesHari       *int     `json:"masa_akses_hari"`
	ThumbnailURL        *string  `json:"thumbnail_url"`
	SyaratKetentuan     *string  `json:"syarat_ketentuan"`
}

type UpdateTrainingRequest struct {
	JenisPelatihanID    string   `json:"jenis_pelatihan_id"`
	JudulPelatihan      string   `json:"judul_pelatihan"`
	DeskripsiPelatihan  *string  `json:"deskripsi_pelatihan"`
	MentorNama          *string  `json:"mentor_nama"`
	DurasiJam           int      `json:"durasi_jam"`
	TotalModul          int      `json:"total_modul"`
	Harga               float64  `json:"harga"`
	AksesSeumurHidup    bool     `json:"akses_seumur_hidup"`
	MasaAksesHari       *int     `json:"masa_akses_hari"`
	ThumbnailURL        *string  `json:"thumbnail_url"`
	SyaratKetentuan     *string  `json:"syarat_ketentuan"`
}

type TrainingStatsResponse struct {
	TotalTrainings    int `json:"total_trainings"`
	PublishedCount    int `json:"published_count"`
	DraftCount        int `json:"draft_count"`
	ArchivedCount     int `json:"archived_count"`
	TotalEnrollments  int `json:"total_enrollments"`
	TotalCompletions  int `json:"total_completions"`
}
