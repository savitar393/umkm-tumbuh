package sales

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/savitar393/umkm-tumbuh/services/user-service/internal/middleware"
)

type Handler struct {
	DB *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{DB: db}
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUMKMUser(w, r)
	if !ok {
		return
	}

	var req CreateSaleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Request body tidak valid."})
		return
	}

	if len(req.Items) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Minimal satu produk harus dipilih."})
		return
	}

	if req.TotalProfit < 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Laba tidak boleh negatif."})
		return
	}

	transactionDate, err := parseTransactionDate(req.TransactionDate)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Tanggal transaksi tidak valid. Gunakan format YYYY-MM-DD."})
		return
	}

	umkmID, err := h.getUMKMID(r.Context(), user.ID)
	if err != nil {
		handleError(w, err, "Profil UMKM belum dibuat.")
		return
	}

	tx, err := h.DB.Begin(r.Context())
	if err != nil {
		handleError(w, err, "Gagal memulai transaksi.")
		return
	}
	defer tx.Rollback(r.Context())

	saleID := ""
	transactionNumber := ""
	totalOmzet := 0.0
	totalItem := 0

	type preparedItem struct {
		ItemID      string
		ProductID   string
		ProductName string
		UnitPrice   float64
		Quantity    int
		StockBefore int
		StockAfter  int
	}

	preparedItems := make([]preparedItem, 0, len(req.Items))
	seenProducts := map[string]bool{}

	for _, item := range req.Items {
		productID := strings.TrimSpace(item.ProductID)

		if productID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Product ID wajib diisi."})
			return
		}

		if seenProducts[productID] {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Produk tidak boleh duplikat dalam satu transaksi."})
			return
		}
		seenProducts[productID] = true

		if item.Quantity <= 0 {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Jumlah produk harus lebih dari 0."})
			return
		}

		var productName string
		var unitPrice float64
		var stockBefore int

		err := tx.QueryRow(r.Context(), `
			SELECT nama_produk, harga, stok_saat_ini
			FROM user_mgmt.master_produkumkm
			WHERE produk_id = $1
			  AND umkm_id = $2
			  AND status_produk = 'AKTIF'
			  AND is_deleted = FALSE
			FOR UPDATE
		`, productID, umkmID).Scan(&productName, &unitPrice, &stockBefore)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Produk tidak ditemukan atau tidak aktif: " + productID})
				return
			}

			handleError(w, err, "Gagal membaca produk.")
			return
		}

		if item.Quantity > stockBefore {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error": fmt.Sprintf("Stok produk %s tidak cukup. Stok tersedia: %d.", productName, stockBefore),
			})
			return
		}

		stockAfter := stockBefore - item.Quantity
		totalOmzet += unitPrice * float64(item.Quantity)
		totalItem += item.Quantity

		preparedItems = append(preparedItems, preparedItem{
			ItemID:      newID("ITM"),
			ProductID:   productID,
			ProductName: productName,
			UnitPrice:   unitPrice,
			Quantity:    item.Quantity,
			StockBefore: stockBefore,
			StockAfter:  stockAfter,
		})
	}

	if totalOmzet <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Total omzet harus lebih dari 0."})
		return
	}

	if req.TotalProfit >= totalOmzet {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Laba harus lebih kecil dari omzet."})
		return
	}

	var existingTotalOmzet float64
	var existingTotalProfit float64
	var existingTotalItem int

	err = tx.QueryRow(r.Context(), `
		SELECT
			penjualan_id,
			nomor_transaksi,
			total_omzet,
			total_laba,
			total_item
		FROM dashboard.transaksi_penjualan
		WHERE umkm_id = $1
		AND tanggal_transaksi = $2
		AND status_transaksi <> 'CANCELLED'
		ORDER BY created_at ASC
		LIMIT 1
		FOR UPDATE
	`, umkmID, transactionDate).Scan(
		&saleID,
		&transactionNumber,
		&existingTotalOmzet,
		&existingTotalProfit,
		&existingTotalItem,
	)

	note := nullableTrim(req.Note)

	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			handleError(w, err, "Gagal memeriksa laporan harian.")
			return
		}

		saleID = newID("TRX")
		transactionNumber = newTransactionNumber()

		_, err = tx.Exec(r.Context(), `
			INSERT INTO dashboard.transaksi_penjualan (
				penjualan_id,
				umkm_id,
				tanggal_transaksi,
				nomor_transaksi,
				total_omzet,
				total_laba,
				total_item,
				catatan,
				status_transaksi,
				created_by_akun_id
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'FINAL', $9)
		`, saleID, umkmID, transactionDate, transactionNumber,
			totalOmzet, req.TotalProfit, totalItem, note, user.ID)
		if err != nil {
			handleError(w, err, "Gagal menyimpan laporan penjualan harian.")
			return
		}
	} else {
		_, err = tx.Exec(r.Context(), `
			UPDATE dashboard.transaksi_penjualan
			SET
				total_omzet = total_omzet + $2,
				total_laba = total_laba + $3,
				total_item = total_item + $4,
				catatan = CASE
					WHEN $5::text IS NULL THEN catatan
					WHEN catatan IS NULL OR catatan = '' THEN $5::text
					ELSE catatan || E'\n' || $5::text
				END,
				status_transaksi = 'FINAL',
				updated_at = NOW()
			WHERE penjualan_id = $1
		`, saleID, totalOmzet, req.TotalProfit, totalItem, note)
		if err != nil {
			handleError(w, err, "Gagal memperbarui laporan penjualan harian.")
			return
		}
	}

	for _, item := range preparedItems {
		_, err = tx.Exec(r.Context(), `
			INSERT INTO dashboard.transaksi_penjualan_item (
				penjualan_item_id,
				penjualan_id,
				produk_id,
				nama_produk_snapshot,
				harga_satuan_snapshot,
				jumlah
			)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, item.ItemID, saleID, item.ProductID, item.ProductName, item.UnitPrice, item.Quantity)
		if err != nil {
			handleError(w, err, "Gagal menyimpan detail transaksi.")
			return
		}

		_, err = tx.Exec(r.Context(), `
			UPDATE user_mgmt.master_produkumkm
			SET stok_saat_ini = $3, updated_at = NOW()
			WHERE produk_id = $1
			  AND umkm_id = $2
		`, item.ProductID, umkmID, item.StockAfter)
		if err != nil {
			handleError(w, err, "Gagal mengurangi stok produk.")
			return
		}

		_, err = tx.Exec(r.Context(), `
			INSERT INTO user_mgmt.transaksi_stokproduk (
				stok_mutasi_id,
				produk_id,
				umkm_id,
				tipe_mutasi,
				jumlah_perubahan,
				stok_sebelum,
				stok_sesudah,
				referensi_tipe,
				referensi_id,
				catatan,
				created_by_akun_id
			)
			VALUES ($1, $2, $3, 'SALE', $4, $5, $6, 'SALES_TRANSACTION', $7, 'Penjualan produk', $8)
		`, newID("STK"), item.ProductID, umkmID, -item.Quantity,
			item.StockBefore, item.StockAfter, saleID, user.ID)
		if err != nil {
			handleError(w, err, "Gagal mencatat mutasi stok penjualan.")
			return
		}
	}

	if err := tx.Commit(r.Context()); err != nil {
		handleError(w, err, "Gagal menyelesaikan transaksi penjualan.")
		return
	}

	detail, err := h.findSaleDetail(r.Context(), umkmID, saleID)
	if err != nil {
		handleError(w, err, "Transaksi tersimpan, tetapi gagal dibaca kembali.")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"sale": detail})
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUMKMUser(w, r)
	if !ok {
		return
	}

	umkmID, err := h.getUMKMID(r.Context(), user.ID)
	if err != nil {
		handleError(w, err, "Profil UMKM belum dibuat.")
		return
	}

	fromDate := strings.TrimSpace(r.URL.Query().Get("from"))
	toDate := strings.TrimSpace(r.URL.Query().Get("to"))

	query := `
		SELECT
			penjualan_id,
			umkm_id,
			nomor_transaksi,
			tanggal_transaksi::text,
			total_omzet,
			total_laba,
			total_item,
			catatan,
			status_transaksi,
			created_at,
			updated_at
		FROM dashboard.transaksi_penjualan
		WHERE umkm_id = $1
	`

	args := []any{umkmID}
	argPos := 2

	if fromDate != "" {
		args = append(args, fromDate)
		query += fmt.Sprintf(" AND tanggal_transaksi >= $%d::date", argPos)
		argPos++
	}

	if toDate != "" {
		args = append(args, toDate)
		query += fmt.Sprintf(" AND tanggal_transaksi <= $%d::date", argPos)
		argPos++
	}

	query += " ORDER BY tanggal_transaksi DESC, created_at DESC"

	rows, err := h.DB.Query(r.Context(), query, args...)
	if err != nil {
		handleError(w, err, "Gagal mengambil daftar transaksi.")
		return
	}
	defer rows.Close()

	sales := []SaleSummaryResponse{}

	for rows.Next() {
		sale, err := scanSaleSummary(rows)
		if err != nil {
			handleError(w, err, "Gagal membaca transaksi.")
			return
		}

		sales = append(sales, sale)
	}

	if err := rows.Err(); err != nil {
		handleError(w, err, "Gagal membaca daftar transaksi.")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"sales": sales})
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUMKMUser(w, r)
	if !ok {
		return
	}

	umkmID, err := h.getUMKMID(r.Context(), user.ID)
	if err != nil {
		handleError(w, err, "Profil UMKM belum dibuat.")
		return
	}

	saleID := chi.URLParam(r, "id")

	detail, err := h.findSaleDetail(r.Context(), umkmID, saleID)
	if err != nil {
		handleError(w, err, "Transaksi tidak ditemukan.")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"sale": detail})
}

func (h *Handler) findSaleDetail(ctx context.Context, umkmID string, saleID string) (SaleDetailResponse, error) {
	row := h.DB.QueryRow(ctx, `
		SELECT
			penjualan_id,
			umkm_id,
			nomor_transaksi,
			tanggal_transaksi::text,
			total_omzet,
			total_laba,
			total_item,
			catatan,
			status_transaksi,
			created_at,
			updated_at
		FROM dashboard.transaksi_penjualan
		WHERE penjualan_id = $1
		  AND umkm_id = $2
		LIMIT 1
	`, saleID, umkmID)

	summary, err := scanSaleSummary(row)
	if err != nil {
		return SaleDetailResponse{}, err
	}

	rows, err := h.DB.Query(ctx, `
		SELECT
			penjualan_item_id,
			produk_id,
			nama_produk_snapshot,
			harga_satuan_snapshot,
			jumlah,
			subtotal,
			created_at
		FROM dashboard.transaksi_penjualan_item
		WHERE penjualan_id = $1
		ORDER BY created_at ASC
	`, saleID)
	if err != nil {
		return SaleDetailResponse{}, err
	}
	defer rows.Close()

	items := []SaleItemResponse{}

	for rows.Next() {
		var item SaleItemResponse

		if err := rows.Scan(
			&item.ID,
			&item.ProductID,
			&item.ProductName,
			&item.UnitPrice,
			&item.Quantity,
			&item.Subtotal,
			&item.CreatedAt,
		); err != nil {
			return SaleDetailResponse{}, err
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return SaleDetailResponse{}, err
	}

	return SaleDetailResponse{
		SaleSummaryResponse: summary,
		Items:               items,
	}, nil
}

func (h *Handler) getUMKMID(ctx context.Context, accountID string) (string, error) {
	var umkmID string

	err := h.DB.QueryRow(ctx, `
		SELECT u.umkm_id
		FROM user_mgmt.master_pelakuumkm p
		JOIN user_mgmt.master_umkm u
			ON u.pelaku_umkm_id = p.pelaku_umkm_id
		WHERE p.akun_id = $1
		  AND p.is_deleted = FALSE
		  AND u.is_deleted = FALSE
		LIMIT 1
	`, accountID).Scan(&umkmID)

	return umkmID, err
}

type scanner interface {
	Scan(dest ...any) error
}

func scanSaleSummary(row scanner) (SaleSummaryResponse, error) {
	var sale SaleSummaryResponse

	err := row.Scan(
		&sale.ID,
		&sale.UMKMID,
		&sale.TransactionNumber,
		&sale.TransactionDate,
		&sale.TotalOmzet,
		&sale.TotalProfit,
		&sale.TotalItem,
		&sale.Note,
		&sale.Status,
		&sale.CreatedAt,
		&sale.UpdatedAt,
	)

	return sale, err
}

func currentUMKMUser(w http.ResponseWriter, r *http.Request) (middleware.CurrentUser, bool) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return middleware.CurrentUser{}, false
	}

	if user.Role != "UMKM" {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "Fitur ini hanya untuk UMKM."})
		return middleware.CurrentUser{}, false
	}

	return user, true
}

func parseTransactionDate(value string) (time.Time, error) {
    loc, err := time.LoadLocation("Asia/Jakarta")
    if err != nil {
        loc = time.FixedZone("WIB", 7*60*60)
    }

    value = strings.TrimSpace(value)
    if value == "" {
        now := time.Now().In(loc)
        return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc), nil
    }

    parsed, err := time.ParseInLocation("2006-01-02", value, loc)
    if err != nil {
        return time.Time{}, err
    }

    return time.Date(parsed.Year(), parsed.Month(), parsed.Day(), 0, 0, 0, 0, loc), nil
}

func nullableTrim(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}

	return &value
}

func newID(prefix string) string {
	raw := strings.ToUpper(strings.ReplaceAll(uuid.NewString(), "-", ""))
	return prefix + raw[:16]
}

func newTransactionNumber() string {
	raw := strings.ToUpper(strings.ReplaceAll(uuid.NewString(), "-", ""))
	return "TRX-" + time.Now().Format("20060102150405") + "-" + raw[:8]
}

func handleError(w http.ResponseWriter, err error, fallback string) {
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": fallback})
		return
	}

	log.Printf("sales handler error: %v", err)
	writeJSON(w, http.StatusInternalServerError, map[string]string{"error": fallback})
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}
