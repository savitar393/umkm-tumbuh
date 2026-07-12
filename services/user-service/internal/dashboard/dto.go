package dashboard

type PeriodResponse struct {
	From  string `json:"from"`
	To    string `json:"to"`
	Range string `json:"range"`
}

type MetricsResponse struct {
	TotalOmzet       float64 `json:"total_omzet"`
	TotalProfit      float64 `json:"total_profit"`
	TotalItem        int     `json:"total_item"`
	TransactionCount int     `json:"transaction_count"`
	AverageOrder     float64 `json:"average_order"`
	ActiveProducts   int     `json:"active_products"`
	TotalStock       int     `json:"total_stock"`
	LowStockCount    int     `json:"low_stock_count"`
}

type RecentSaleResponse struct {
	ID                string  `json:"id"`
	TransactionNumber string  `json:"transaction_number"`
	TransactionDate   string  `json:"transaction_date"`
	TotalOmzet        float64 `json:"total_omzet"`
	TotalProfit       float64 `json:"total_profit"`
	TotalItem         int     `json:"total_item"`
	Status            string  `json:"status"`
}

type TopProductResponse struct {
	ProductID    string  `json:"product_id"`
	ProductName  string  `json:"product_name"`
	TotalSold    int     `json:"total_sold"`
	TotalRevenue float64 `json:"total_revenue"`
}

type DailySalesResponse struct {
	Date        string  `json:"date"`
	TotalOmzet  float64 `json:"total_omzet"`
	TotalProfit float64 `json:"total_profit"`
	TotalItem   int     `json:"total_item"`
}

type LowStockProductResponse struct {
	ProductID   string `json:"product_id"`
	ProductName string `json:"product_name"`
	Stock       int    `json:"stock"`
	Status      string `json:"status"`
}

type UMKMSummaryResponse struct {
	Period           PeriodResponse            `json:"period"`
	Metrics          MetricsResponse           `json:"metrics"`
	RecentSales      []RecentSaleResponse      `json:"recent_sales"`
	TopProducts      []TopProductResponse      `json:"top_products"`
	DailySales       []DailySalesResponse      `json:"daily_sales"`
	LowStockProducts []LowStockProductResponse `json:"low_stock_products"`
}

// ─── Detail Dashboard Types (for GET /dashboard/umkm) ────────────────────

type LabaHarianItem struct {
	PenjualanID  string  `json:"penjualan_id"`
	Tanggal      string  `json:"tanggal"`
	NamaHari     string  `json:"nama_hari"`
	LabaBersih   float64 `json:"laba_bersih"`
	JumlahProduk int64   `json:"jumlah_produk"`
	CreatedAt     string  `json:"created_at"`
	LastUpdatedAt string  `json:"last_updated_at"`
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
	OmzetBulanIni     float64          `json:"omzet_bulan_ini"`
	OmzetBulanLalu    float64          `json:"omzet_bulan_lalu"`
	PersenVsBulanLalu float64          `json:"persen_vs_bulan_lalu"`
	TotalItemTerjual  int              `json:"total_item_terjual"`
	RataRataPerItem   float64          `json:"rata_rata_per_item"`
	LabaHarian        []LabaHarianItem `json:"laba_harian"`
	TrenMingguan      []TrenMingguan   `json:"tren_mingguan"`
	TotalHari         int              `json:"total_hari"`
	FilterBulan       string           `json:"filter_bulan"`
	FilterTahun       int              `json:"filter_tahun"`
	DateFrom          string           `json:"date_from"`
	DateTo            string           `json:"date_to"`
	TrendDays         int              `json:"trend_days"`
}

type UMKMMitraItem struct {
	UMKMID  string `json:"umkm_id"`
	NamaUMKM string `json:"nama_umkm"`
}

type UMKMDashboardForMitra struct {
	UMKMID            string           `json:"umkm_id"`
	NamaUMKM          string           `json:"nama_umkm"`
	KategoriUsaha     string           `json:"kategori_usaha"`
	TglTerkini        string           `json:"tgl_terkini"`
	TotalOmzetHariIni float64          `json:"total_omzet_hari_ini"`
	TotalOmzetKemarin float64          `json:"total_omzet_kemarin"`
	PersenVsKemarin   float64          `json:"persen_vs_kemarin"`
	OmzetBulanIni     float64          `json:"omzet_bulan_ini"`
	OmzetBulanLalu    float64          `json:"omzet_bulan_lalu"`
	PersenVsBulanLalu float64          `json:"persen_vs_bulan_lalu"`
	TotalItemTerjual  int              `json:"total_item_terjual"`
	RataRataPerItem   float64          `json:"rata_rata_per_item"`
	LabaHarian        []LabaHarianItem `json:"laba_harian"`
	TrenMingguan      []TrenMingguan   `json:"tren_mingguan"`
	TotalHari         int              `json:"total_hari"`
	DateFrom          string           `json:"date_from"`
	DateTo            string           `json:"date_to"`
	TrendDays         int              `json:"trend_days"`
}

type MitraDashboardData struct {
	NamaMitra string                `json:"nama_mitra"`
	UMKMList  []UMKMMitraItem       `json:"umkm_list"`
	Dashboard *UMKMDashboardForMitra `json:"dashboard"`
}
