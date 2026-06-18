package certificates

import "time"

type CertificateResponse struct {
	SertifikatID           int64      `json:"sertifikat_id"`
	PendaftaranPelatihanID string     `json:"pendaftaran_pelatihan_id"`
	NomorSertifikat        *string    `json:"nomor_sertifikat"`
	TanggalPengajuan       *time.Time `json:"tanggal_pengajuan"`
	TanggalTerbit          *time.Time `json:"tanggal_terbit"`
	StatusSertifikatID     string     `json:"status_sertifikat_id"`
	NamaStatusSertifikat   string     `json:"nama_status_sertifikat"`
	DokumenID              *string    `json:"dokumen_id"`
	DokumenURL             *string    `json:"dokumen_url"`
	CatatanValidasi        *string    `json:"catatan_validasi"`
	PelatihanID            string     `json:"pelatihan_id"`
	JudulPelatihan         string     `json:"judul_pelatihan"`
	JenisPelatihan         string     `json:"jenis_pelatihan"`
	TanggalSelesai         *time.Time `json:"tanggal_selesai_pelatihan"`
	ProgressPersen         float64    `json:"progress_persen"`
	UMKMID                 string     `json:"umkm_id"`
	NamaUMKM               string     `json:"nama_umkm"`
	PelakuNama             string     `json:"pelaku_nama"`
}

type CertificateDashboardResponse struct {
	UMKMID                   string     `json:"umkm_id"`
	NamaUMKM                 string     `json:"nama_umkm"`
	PelakuNama               string     `json:"pelaku_nama"`
	TotalPelatihan           int        `json:"total_pelatihan"`
	PelatihanSelesai         int        `json:"pelatihan_selesai"`
	TotalSertifikat          int        `json:"total_sertifikat"`
	SertifikatTerbit         int        `json:"sertifikat_terbit"`
	PelatihanTerakhirSelesai *time.Time `json:"pelatihan_terakhir_selesai"`
	SertifikatTerakhirTerbit *time.Time `json:"sertifikat_terakhir_terbit"`
}

type RequestCertificateRequest struct {
	PendaftaranPelatihanID string `json:"pendaftaran_pelatihan_id"`
}

type RequestCertificateResponse struct {
	Message     string              `json:"message"`
	Certificate CertificateResponse `json:"certificate"`
}

type RejectCertificateRequest struct {
	Catatan string `json:"catatan_validasi"`
}

type ListCertificatesResponse struct {
	Certificates []CertificateResponse `json:"certificates"`
	Total        int                   `json:"total"`
	Page         int                   `json:"page"`
	Limit        int                   `json:"limit"`
}

type CertificateStatsResponse struct {
	Diajukan int `json:"diajukan"`
	Terbit   int `json:"terbit"`
	Ditolak  int `json:"ditolak"`
}
