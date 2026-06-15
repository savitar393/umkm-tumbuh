package products

import "time"

type CreateProductRequest struct {
	Name string `json:"name"`

	// Preferred backend field.
	CategoryName string `json:"category_name"`

	// Compatibility with frontend from feat/umkm-products.
	Category string `json:"category"`

	Description string  `json:"description"`
	Price       float64 `json:"price"`

	InitialStock int    `json:"initial_stock"`
	Status       string `json:"status"`

	// Preferred backend field.
	Legalitas string `json:"legalitas"`

	// Compatibility with frontend from feat/umkm-products.
	Legality string `json:"legality"`
}

type UpdateProductRequest struct {
	Name string `json:"name"`

	CategoryName string `json:"category_name"`
	Category     string `json:"category"`

	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Status      string  `json:"status"`

	Legalitas string `json:"legalitas"`
	Legality  string `json:"legality"`
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
	Category             string     `json:"category"`
	Name                 string     `json:"name"`
	Description          *string    `json:"description"`
	Price                float64    `json:"price"`
	Stock                int        `json:"stock"`
	Status               string     `json:"status"`
	Legalitas            *string    `json:"legalitas"`
	Legality             *string    `json:"legality"`
	ThumbnailObjectKey   *string    `json:"thumbnail_object_key"`
	ThumbnailURL         *string    `json:"thumbnail_url"`
	ThumbnailContentType *string    `json:"thumbnail_content_type"`
	ThumbnailSizeBytes   *int64     `json:"thumbnail_size_bytes"`
	ThumbnailUpdatedAt   *time.Time `json:"thumbnail_updated_at"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}
