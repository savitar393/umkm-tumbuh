package dashboard

// ─── UMKM Dashboard ──────────────────────────────────────────────────────────

type LabaHarianItem struct {
	Tanggal      string  `json:"tanggal"`
	NamaHari     string  `json:"nama_hari"`
	LabaBersih   float64 `json:"laba_bersih"`
	JumlahProduk int64   `json:"jumlah_produk"`
}

type TrenMingguan struct {
	Hari      string  `json:"hari"`
	TotalLaba float64 `json:"total_laba"`
}

type UMKMDashboardData struct {
	NamaUMKM          string           `json:"nama_umkm"`
	TglTerkini        string           `json:"tgl_terkini"`
	TotalOmzetHariIni float64          `json:"total_omzet_hari_ini"`
	TotalOmzetKemarin float64          `json:"total_omzet_kemarin"`
	PersenVsKemarin   float64          `json:"persen_vs_kemarin"`
	TotalItemTerjual  int64            `json:"total_item_terjual"`
	RataRataPerItem   float64          `json:"rata_rata_per_item"`
	LabaHarian        []LabaHarianItem `json:"laba_harian"`
	TrenMingguan      []TrenMingguan   `json:"tren_mingguan"`
	TotalHari         int              `json:"total_hari"`
	FilterBulan       string           `json:"filter_bulan"`
	FilterTahun       int              `json:"filter_tahun"`
	DateFrom          string           `json:"date_from"`
	DateTo            string           `json:"date_to"`
}

// ─── Mitra Dashboard ─────────────────────────────────────────────────────────

type UMKMMitraItem struct {
	UMKMID   string `json:"umkm_id"`
	NamaUMKM string `json:"nama_umkm"`
}

type UMKMDashboardForMitra struct {
	UMKMID            string           `json:"umkm_id"`
	NamaUMKM          string           `json:"nama_umkm"`
	TglTerkini        string           `json:"tgl_terkini"`
	TotalOmzetHariIni float64          `json:"total_omzet_hari_ini"`
	TotalOmzetKemarin float64          `json:"total_omzet_kemarin"`
	PersenVsKemarin   float64          `json:"persen_vs_kemarin"`
	TotalItemTerjual  int64            `json:"total_item_terjual"`
	RataRataPerItem   float64          `json:"rata_rata_per_item"`
	LabaHarian        []LabaHarianItem `json:"laba_harian"`
	TrenMingguan      []TrenMingguan   `json:"tren_mingguan"`
	TotalHari         int              `json:"total_hari"`
	DateFrom          string           `json:"date_from"`
	DateTo            string           `json:"date_to"`
}

type MitraDashboardData struct {
	NamaMitra string                 `json:"nama_mitra"`
	UMKMList  []UMKMMitraItem        `json:"umkm_list"`
	Dashboard *UMKMDashboardForMitra `json:"dashboard"`
}
