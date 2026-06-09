package products

import "time"

type CreateProductRequest struct {
	Name         string  `json:"name"`
	CategoryName string  `json:"category_name"`
	Description  string  `json:"description"`
	Price        float64 `json:"price"`
	InitialStock int     `json:"initial_stock"`
	Status       string  `json:"status"`
	Legalitas    string  `json:"legalitas"`
}

type UpdateProductRequest struct {
	Name         string  `json:"name"`
	CategoryName string  `json:"category_name"`
	Description  string  `json:"description"`
	Price        float64 `json:"price"`
	Status       string  `json:"status"`
	Legalitas    string  `json:"legalitas"`
}

type UpdateStockRequest struct {
	Type     string `json:"type"` // RESTOCK or ADJUSTMENT
	Quantity int    `json:"quantity"`
	Note     string `json:"note"`
}

type ProductResponse struct {
	ID                   string     `json:"id"`
	UMKMID               string     `json:"umkm_id"`
	CategoryID           string     `json:"category_id"`
	CategoryName         string     `json:"category_name"`
	Name                 string     `json:"name"`
	Description          *string    `json:"description"`
	Price                float64    `json:"price"`
	Stock                int        `json:"stock"`
	Status               string     `json:"status"`
	Legalitas            *string    `json:"legalitas"`
	ThumbnailObjectKey   *string    `json:"thumbnail_object_key"`
	ThumbnailURL         *string    `json:"thumbnail_url"`
	ThumbnailContentType *string    `json:"thumbnail_content_type"`
	ThumbnailSizeBytes   *int64     `json:"thumbnail_size_bytes"`
	ThumbnailUpdatedAt   *time.Time `json:"thumbnail_updated_at"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}
