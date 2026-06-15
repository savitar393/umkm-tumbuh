package sales

import "time"

type CreateSaleRequest struct {
	TransactionDate string           `json:"transaction_date"`
	TotalProfit     float64          `json:"total_profit"`
	Note            string           `json:"note"`
	Items           []CreateSaleItem `json:"items"`
}

type CreateSaleItem struct {
	ProductID string `json:"product_id"`
	Quantity  int    `json:"quantity"`
}

type SaleSummaryResponse struct {
	ID                string    `json:"id"`
	UMKMID            string    `json:"umkm_id"`
	TransactionNumber string    `json:"transaction_number"`
	TransactionDate   string    `json:"transaction_date"`
	TotalOmzet        float64   `json:"total_omzet"`
	TotalProfit       float64   `json:"total_profit"`
	TotalItem         int       `json:"total_item"`
	Note              *string   `json:"note"`
	Status            string    `json:"status"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type SaleDetailResponse struct {
	SaleSummaryResponse
	Items []SaleItemResponse `json:"items"`
}

type SaleItemResponse struct {
	ID          string    `json:"id"`
	ProductID   string    `json:"product_id"`
	ProductName string    `json:"product_name"`
	UnitPrice   float64   `json:"unit_price"`
	Quantity    int       `json:"quantity"`
	Subtotal    float64   `json:"subtotal"`
	CreatedAt   time.Time `json:"created_at"`
}
