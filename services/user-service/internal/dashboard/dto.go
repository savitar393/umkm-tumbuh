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
