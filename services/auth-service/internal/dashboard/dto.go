package dashboard

import "time"

// SummaryResponse — KPI cards utama dashboard nasional
type SummaryResponse struct {
	TotalUMKM               int64     `json:"total_umkm"`
	TotalUMKMActive         int64     `json:"total_umkm_aktif"`
	TotalUMKMBerkembang     int64     `json:"total_umkm_berkembang"`
	TotalUMKMTidakAktif     int64     `json:"total_umkm_tidak_aktif"`
	TotalLaba               float64   `json:"total_laba"`
	TotalMitra              int64     `json:"total_mitra"`
	TotalProgramPelatihan   int64     `json:"total_program_pelatihan"`
	TotalPengajuanKemitraan int64     `json:"total_pengajuan_kemitraan"`
	GeneratedAt             time.Time `json:"generated_at"`
}

// MapDataItem — satu titik/wilayah di peta
type MapDataItem struct {
	Provinsi        string  `json:"provinsi"`
	KabupatenKota   string  `json:"kabupaten_kota"`
	TotalUMKM       int64   `json:"total_umkm"`
	TotalUMKMAktif  int64   `json:"total_umkm_aktif"`
	TotalLaba       float64 `json:"total_laba"`
	LatitudeAvg     float64 `json:"latitude_avg"`
	LongitudeAvg    float64 `json:"longitude_avg"`
}

// RegistrationTrendItem — satu titik tren pendaftaran per tanggal
type RegistrationTrendItem struct {
	Tanggal          string `json:"tanggal"` // YYYY-MM-DD
	TotalPendaftaran int64  `json:"total_pendaftaran"`
}

// StatusDistributionItem — distribusi status UMKM (untuk donut chart)
type StatusDistributionItem struct {
	StatusID   string  `json:"status_id"`
	NamaStatus string  `json:"nama_status"`
	Total      int64   `json:"total"`
	Persentase float64 `json:"persentase"`
}

// LabaTimeseriesItem — tren laba per tanggal
type LabaTimeseriesItem struct {
	Tanggal    string  `json:"tanggal"` // YYYY-MM-DD
	TotalLaba  float64 `json:"total_laba"`
	RataRata   float64 `json:"rata_rata_laba"`
	TotalUMKM  int64   `json:"total_umkm_tercatat"`
}

// TopWilayahItem — top wilayah berdasarkan laba
type TopWilayahItem struct {
	Provinsi        string  `json:"provinsi"`
	KabupatenKota   string  `json:"kabupaten_kota"`
	TotalLaba       float64 `json:"total_laba"`
	TotalUMKM       int64   `json:"total_umkm"`
	PeringkatNasional int64 `json:"peringkat_nasional"`
}

// KategoriPerformaItem — performa per kategori usaha
type KategoriPerformaItem struct {
	KategoriID      string  `json:"kategori_usaha_id"`
	NamaKategori    string  `json:"nama_kategori"`
	TotalUMKM       int64   `json:"total_umkm"`
	TotalLaba       float64 `json:"total_laba"`
	RataRataLaba    float64 `json:"rata_rata_laba_harian"`
}

// AtensiResponse — data atensi/alert untuk dashboard
type AtensiResponse struct {
	TotalUMKMPerluAtensi    int64     `json:"total_umkm_perlu_atensi"`
	TotalUMKMBerisiko       int64     `json:"total_umkm_berisiko"`
	TotalProvTerdampak      int64     `json:"total_provinsi_terdampak"`
	GeneratedAt             time.Time `json:"generated_at"`
}

// DashboardResponse — gabungan semua data dashboard dalam satu response
type DashboardResponse struct {
	Summary             *SummaryResponse         `json:"summary"`
	MapData             []MapDataItem            `json:"map_data"`
	RegistrationTrend   []RegistrationTrendItem  `json:"registration_trend"`
	StatusDistribution  []StatusDistributionItem `json:"status_distribution"`
	LabaTrend           []LabaTimeseriesItem     `json:"laba_trend"`
	TopWilayah          []TopWilayahItem         `json:"top_wilayah"`
	KategoriPerforma    []KategoriPerformaItem   `json:"kategori_performa"`
	Atensi              *AtensiResponse          `json:"atensi"`
}
