package dashboard

import (
	"context"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

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

func (h *Handler) UMKMSummary(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUMKMUser(w, r)
	if !ok {
		return
	}

	from, to, rangeLabel, err := resolvePeriod(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Filter periode tidak valid. Gunakan format YYYY-MM-DD."})
		return
	}

	umkmID, err := h.getUMKMID(r.Context(), user.ID)
	if err != nil {
		handleError(w, err, "Profil UMKM belum dibuat.")
		return
	}

	metrics, err := h.loadMetrics(r.Context(), umkmID, from, to)
	if err != nil {
		handleError(w, err, "Gagal memuat ringkasan dashboard.")
		return
	}

	recentSales, err := h.loadRecentSales(r.Context(), umkmID, from, to)
	if err != nil {
		handleError(w, err, "Gagal memuat transaksi terbaru.")
		return
	}

	topProducts, err := h.loadTopProducts(r.Context(), umkmID, from, to)
	if err != nil {
		handleError(w, err, "Gagal memuat produk terlaris.")
		return
	}

	dailySales, err := h.loadDailySales(r.Context(), umkmID, from, to)
	if err != nil {
		handleError(w, err, "Gagal memuat tren penjualan harian.")
		return
	}

	lowStockProducts, err := h.loadLowStockProducts(r.Context(), umkmID)
	if err != nil {
		handleError(w, err, "Gagal memuat produk stok rendah.")
		return
	}

	response := UMKMSummaryResponse{
		Period: PeriodResponse{
			From:  from.Format("2006-01-02"),
			To:    to.Format("2006-01-02"),
			Range: rangeLabel,
		},
		Metrics:          metrics,
		RecentSales:      recentSales,
		TopProducts:      topProducts,
		DailySales:       dailySales,
		LowStockProducts: lowStockProducts,
	}

	writeJSON(w, http.StatusOK, map[string]any{"summary": response})
}

func (h *Handler) loadMetrics(ctx context.Context, umkmID string, from time.Time, to time.Time) (MetricsResponse, error) {
	var metrics MetricsResponse

	err := h.DB.QueryRow(ctx, `
		SELECT
			COALESCE(SUM(total_omzet), 0),
			COALESCE(SUM(total_laba), 0),
			COALESCE(SUM(total_item), 0),
			COUNT(*)
		FROM dashboard.transaksi_penjualan
		WHERE umkm_id = $1
		  AND tanggal_transaksi BETWEEN $2::date AND $3::date
		  AND status_transaksi = 'FINAL'
	`, umkmID, from.Format("2006-01-02"), to.Format("2006-01-02")).Scan(
		&metrics.TotalOmzet,
		&metrics.TotalProfit,
		&metrics.TotalItem,
		&metrics.TransactionCount,
	)
	if err != nil {
		return MetricsResponse{}, err
	}

	if metrics.TransactionCount > 0 {
		metrics.AverageOrder = metrics.TotalOmzet / float64(metrics.TransactionCount)
	}

	err = h.DB.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE status_produk = 'AKTIF'),
			COALESCE(SUM(stok_saat_ini) FILTER (WHERE status_produk = 'AKTIF'), 0),
			COUNT(*) FILTER (WHERE status_produk = 'AKTIF' AND stok_saat_ini <= 10)
		FROM user_mgmt.master_produkumkm
		WHERE umkm_id = $1
		  AND is_deleted = FALSE
	`, umkmID).Scan(
		&metrics.ActiveProducts,
		&metrics.TotalStock,
		&metrics.LowStockCount,
	)

	return metrics, err
}

func (h *Handler) loadRecentSales(ctx context.Context, umkmID string, from time.Time, to time.Time) ([]RecentSaleResponse, error) {
	rows, err := h.DB.Query(ctx, `
		SELECT
			penjualan_id,
			nomor_transaksi,
			tanggal_transaksi::text,
			total_omzet,
			total_laba,
			total_item,
			status_transaksi
		FROM dashboard.transaksi_penjualan
		WHERE umkm_id = $1
		  AND tanggal_transaksi BETWEEN $2::date AND $3::date
		  AND status_transaksi = 'FINAL'
		ORDER BY tanggal_transaksi DESC, created_at DESC
		LIMIT 5
	`, umkmID, from.Format("2006-01-02"), to.Format("2006-01-02"))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []RecentSaleResponse{}

	for rows.Next() {
		var item RecentSaleResponse

		if err := rows.Scan(
			&item.ID,
			&item.TransactionNumber,
			&item.TransactionDate,
			&item.TotalOmzet,
			&item.TotalProfit,
			&item.TotalItem,
			&item.Status,
		); err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	return items, rows.Err()
}

func (h *Handler) loadTopProducts(ctx context.Context, umkmID string, from time.Time, to time.Time) ([]TopProductResponse, error) {
	rows, err := h.DB.Query(ctx, `
		SELECT
			i.produk_id,
			i.nama_produk_snapshot,
			COALESCE(SUM(i.jumlah), 0),
			COALESCE(SUM(i.subtotal), 0)
		FROM dashboard.transaksi_penjualan_item i
		JOIN dashboard.transaksi_penjualan p
			ON p.penjualan_id = i.penjualan_id
		WHERE p.umkm_id = $1
		  AND p.tanggal_transaksi BETWEEN $2::date AND $3::date
		  AND p.status_transaksi = 'FINAL'
		GROUP BY i.produk_id, i.nama_produk_snapshot
		ORDER BY SUM(i.jumlah) DESC, SUM(i.subtotal) DESC
		LIMIT 5
	`, umkmID, from.Format("2006-01-02"), to.Format("2006-01-02"))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []TopProductResponse{}

	for rows.Next() {
		var item TopProductResponse

		if err := rows.Scan(
			&item.ProductID,
			&item.ProductName,
			&item.TotalSold,
			&item.TotalRevenue,
		); err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	return items, rows.Err()
}

func (h *Handler) loadDailySales(ctx context.Context, umkmID string, from time.Time, to time.Time) ([]DailySalesResponse, error) {
	rows, err := h.DB.Query(ctx, `
		SELECT
			d.day::date::text,
			COALESCE(SUM(p.total_omzet), 0),
			COALESCE(SUM(p.total_laba), 0),
			COALESCE(SUM(p.total_item), 0)
		FROM generate_series($2::date, $3::date, interval '1 day') AS d(day)
		LEFT JOIN dashboard.transaksi_penjualan p
			ON p.umkm_id = $1
		   AND p.tanggal_transaksi = d.day::date
		   AND p.status_transaksi = 'FINAL'
		GROUP BY d.day
		ORDER BY d.day ASC
	`, umkmID, from.Format("2006-01-02"), to.Format("2006-01-02"))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []DailySalesResponse{}

	for rows.Next() {
		var item DailySalesResponse

		if err := rows.Scan(
			&item.Date,
			&item.TotalOmzet,
			&item.TotalProfit,
			&item.TotalItem,
		); err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	return items, rows.Err()
}

func (h *Handler) loadLowStockProducts(ctx context.Context, umkmID string) ([]LowStockProductResponse, error) {
	rows, err := h.DB.Query(ctx, `
		SELECT
			produk_id,
			nama_produk,
			stok_saat_ini,
			status_produk
		FROM user_mgmt.master_produkumkm
		WHERE umkm_id = $1
		  AND is_deleted = FALSE
		  AND status_produk = 'AKTIF'
		  AND stok_saat_ini <= 10
		ORDER BY stok_saat_ini ASC, nama_produk ASC
		LIMIT 5
	`, umkmID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []LowStockProductResponse{}

	for rows.Next() {
		var item LowStockProductResponse

		if err := rows.Scan(
			&item.ProductID,
			&item.ProductName,
			&item.Stock,
			&item.Status,
		); err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	return items, rows.Err()
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

func resolvePeriod(r *http.Request) (time.Time, time.Time, string, error) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	rangeLabel := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("range")))
	if rangeLabel == "" {
		rangeLabel = "7d"
	}

	from := today.AddDate(0, 0, -6)
	to := today

	switch rangeLabel {
	case "today":
		from = today
		to = today
	case "7d":
		from = today.AddDate(0, 0, -6)
		to = today
	case "30d":
		from = today.AddDate(0, 0, -29)
		to = today
	case "month":
		from = time.Date(today.Year(), today.Month(), 1, 0, 0, 0, 0, today.Location())
		to = today
	default:
		rangeLabel = "custom"
	}

	if rawFrom := strings.TrimSpace(r.URL.Query().Get("from")); rawFrom != "" {
		parsedFrom, err := time.Parse("2006-01-02", rawFrom)
		if err != nil {
			return time.Time{}, time.Time{}, "", err
		}

		from = parsedFrom
		rangeLabel = "custom"
	}

	if rawTo := strings.TrimSpace(r.URL.Query().Get("to")); rawTo != "" {
		parsedTo, err := time.Parse("2006-01-02", rawTo)
		if err != nil {
			return time.Time{}, time.Time{}, "", err
		}

		to = parsedTo
		rangeLabel = "custom"
	}

	if from.After(to) {
		return time.Time{}, time.Time{}, "", errors.New("from date is after to date")
	}

	return from, to, rangeLabel, nil
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

func currentMitraUser(w http.ResponseWriter, r *http.Request) (middleware.CurrentUser, bool) {
	user, ok := middleware.CurrentUserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return middleware.CurrentUser{}, false
	}

	if user.Role != "MITRA" {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "Fitur ini hanya untuk Mitra."})
		return middleware.CurrentUser{}, false
	}

	return user, true
}

func handleError(w http.ResponseWriter, err error, fallback string) {
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": fallback})
		return
	}

	log.Printf("dashboard handler error: %v", err)
	writeJSON(w, http.StatusInternalServerError, map[string]string{"error": fallback})
}

// GetUMKMDashboard — GET /api/v1/dashboard/umkm?from=YYYY-MM-DD&to=YYYY-MM-DD
func (h *Handler) GetUMKMDashboard(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUMKMUser(w, r)
	if !ok {
		return
	}

	dateFrom := r.URL.Query().Get("from")
	dateTo := r.URL.Query().Get("to")

	repo := NewRepository(h.DB)
	svc := NewService(repo)

	data, err := svc.GetUMKMDashboard(r.Context(), user.ID, dateFrom, dateTo)
	if err != nil {
		handleError(w, err, "Gagal memuat data dashboard.")
		return
	}

	writeJSON(w, http.StatusOK, data)
}

// GetMitraDashboard — GET /api/v1/dashboard/mitra?umkm_id=...
func (h *Handler) GetMitraDashboard(w http.ResponseWriter, r *http.Request) {
	user, ok := currentMitraUser(w, r)
	if !ok {
		return
	}

	selectedUMKMID := r.URL.Query().Get("umkm_id")
	dateFrom := r.URL.Query().Get("from")
	dateTo := r.URL.Query().Get("to")

	repo := NewRepository(h.DB)
	svc := NewService(repo)

	data, err := svc.GetMitraDashboard(r.Context(), user.ID, selectedUMKMID, dateFrom, dateTo)
	if err != nil {
		handleError(w, err, "Gagal memuat data dashboard mitra.")
		return
	}

	writeJSON(w, http.StatusOK, data)
}
