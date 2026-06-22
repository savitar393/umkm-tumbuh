package dashboard

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	DB *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{DB: db}
}

// ─── UMKM Lookup ─────────────────────────────────────────────────────────────

// GetUMKMByAccount — ambil umkm_id & nama dari akun_id
func (r *Repository) GetUMKMByAccount(ctx context.Context, accountID string) (umkmID, namaUMKM string, err error) {
	err = r.DB.QueryRow(ctx, `
		SELECT u.umkm_id, u.nama_umkm
		FROM user_mgmt.master_pelakuumkm p
		JOIN user_mgmt.master_umkm u ON u.pelaku_umkm_id = p.pelaku_umkm_id
		WHERE p.akun_id = $1
		  AND u.is_deleted = FALSE
		  AND p.is_deleted = FALSE
		LIMIT 1
	`, accountID).Scan(&umkmID, &namaUMKM)
	return
}

// ─── Mitra Lookup ────────────────────────────────────────────────────────────

// GetMitraByAccount — ambil mitra_id & nama dari akun_id
func (r *Repository) GetMitraByAccount(ctx context.Context, accountID string) (mitraID, namaMitra string, err error) {
	err = r.DB.QueryRow(ctx, `
		SELECT mitra_id, nama_mitra
		FROM user_mgmt.master_mitra
		WHERE akun_id = $1
		  AND is_deleted = FALSE
		LIMIT 1
	`, accountID).Scan(&mitraID, &namaMitra)
	return
}

// ─── UMKM Dashboard Queries ──────────────────────────────────────────────────

// GetOmzetSummary — omzet 2 hari terakhir dan item terjual hari ini
// Karena data dummy mungkin tidak ada hari ini, ambil 2 hari terakhir yang ada datanya
func (r *Repository) GetOmzetSummary(ctx context.Context, umkmID, dateFrom, dateTo string) (omzetPeriode, omzetPembanding float64, totalItem int64, tglTerkini string, err error) {
	err = r.DB.QueryRow(ctx, `
		WITH bounds AS (
			SELECT
				$2::date AS current_from,
				$3::date AS current_to,
				($2::date - (($3::date - $2::date + 1) * INTERVAL '1 day'))::date AS previous_from,
				($2::date - INTERVAL '1 day')::date AS previous_to
		),
		current_data AS (
			SELECT
				COALESCE(SUM(total_omzet), 0) AS omzet,
				COALESCE(SUM(total_item), 0)::bigint AS item,
				MAX(tanggal_transaksi) AS tgl
			FROM dashboard.transaksi_penjualan, bounds
			WHERE umkm_id = $1
			  AND status_transaksi <> 'CANCELLED'
			  AND tanggal_transaksi >= bounds.current_from
			  AND tanggal_transaksi <= bounds.current_to
		),
		previous_data AS (
			SELECT COALESCE(SUM(total_omzet), 0) AS omzet
			FROM dashboard.transaksi_penjualan, bounds
			WHERE umkm_id = $1
			  AND status_transaksi <> 'CANCELLED'
			  AND tanggal_transaksi >= bounds.previous_from
			  AND tanggal_transaksi <= bounds.previous_to
		)
		SELECT
			current_data.omzet::float8,
			previous_data.omzet::float8,
			current_data.item::bigint,
			COALESCE(TO_CHAR(current_data.tgl, 'YYYY-MM-DD'), '')
		FROM current_data, previous_data
	`, umkmID, dateFrom, dateTo).Scan(&omzetPeriode, &omzetPembanding, &totalItem, &tglTerkini)

	return
}

func (r *Repository) GetLabaHarian(ctx context.Context, umkmID, dateFrom, dateTo string) ([]LabaHarianItem, error) {
	log.Printf("[DEBUG] GetLabaHarian umkmID=%s dateFrom=%s dateTo=%s", umkmID, dateFrom, dateTo)

	rows, err := r.DB.Query(ctx, `
		SELECT
			CASE
				WHEN COUNT(*) = 1 THEN MIN(penjualan_id)
				ELSE ''
			END AS penjualan_id,
			TO_CHAR(tanggal_transaksi, 'YYYY-MM-DD')       AS tanggal,
			TO_CHAR(tanggal_transaksi, 'Day, DD Mon YYYY') AS nama_hari,
			COALESCE(SUM(total_laba), 0)::float8           AS laba_bersih,
			COALESCE(SUM(total_item), 0)::bigint           AS jumlah_produk
		FROM dashboard.transaksi_penjualan
		WHERE umkm_id = $1
		  AND tanggal_transaksi >= $2::date
		  AND tanggal_transaksi <= $3::date
		  AND status_transaksi <> 'CANCELLED'
		GROUP BY tanggal_transaksi
		ORDER BY tanggal_transaksi DESC
	`, umkmID, dateFrom, dateTo)
	if err != nil {
		log.Printf("[DEBUG] GetLabaHarian query error: %v", err)
		return nil, err
	}
	defer rows.Close()

	var result []LabaHarianItem
	for rows.Next() {
		var item LabaHarianItem
		if err := rows.Scan(&item.PenjualanID, &item.Tanggal, &item.NamaHari, &item.LabaBersih, &item.JumlahProduk); err != nil {
			log.Printf("[DEBUG] GetLabaHarian scan error: %v", err)
			return nil, err
		}
		result = append(result, item)
	}

	log.Printf("[DEBUG] GetLabaHarian returning %d rows", len(result))
	return result, rows.Err()
}

// GetTrenMingguan — agregasi laba per hari untuk N hari terakhir berdasarkan data terbaru
func (r *Repository) GetTrenMingguan(ctx context.Context, umkmID, dateFrom, dateTo string, days int) ([]TrenMingguan, error) {
	rows, err := r.DB.Query(ctx, `
		SELECT
			TO_CHAR(tanggal_transaksi, 'DD Mon')    AS hari,
			COALESCE(SUM(total_laba), 0)::float8   AS total_laba
		FROM dashboard.transaksi_penjualan
		WHERE umkm_id = $1
		  AND status_transaksi <> 'CANCELLED'
		  AND tanggal_transaksi >= $2::date
		  AND tanggal_transaksi <= $3::date
		GROUP BY tanggal_transaksi
		ORDER BY tanggal_transaksi ASC
	`, umkmID, dateFrom, dateTo)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []TrenMingguan
	for rows.Next() {
		var item TrenMingguan
		if err := rows.Scan(&item.Hari, &item.TotalLaba); err != nil {
			return nil, err
		}
		result = append(result, item)
	}

	if len(result) > days {
		result = result[len(result)-days:]
	}

	return result, rows.Err()
}

func (r *Repository) GetUMKMPartnersOfMitra(ctx context.Context, mitraID string) ([]UMKMMitraItem, error) {
	rows, err := r.DB.Query(ctx, `
		SELECT DISTINCT u.umkm_id, u.nama_umkm
		FROM partnership.transaksi_pengajuankerjasama pk
		JOIN user_mgmt.master_umkm u
			ON u.umkm_id = pk.umkm_id
		JOIN user_mgmt.master_mitra m
			ON m.mitra_id = pk.mitra_id
		WHERE pk.mitra_id = $1
		  AND pk.status_pengajuan_id = 'AKTIF'
		  AND pk.umkm_id IS NOT NULL
		  AND pk.mitra_id IS NOT NULL
		  AND u.is_deleted = FALSE
		  AND m.is_deleted = FALSE
		ORDER BY u.nama_umkm ASC
	`, mitraID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []UMKMMitraItem
	for rows.Next() {
		var item UMKMMitraItem
		if err := rows.Scan(&item.UMKMID, &item.NamaUMKM); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

// GetUMKMNameByID — ambil nama UMKM dari umkm_id
func (r *Repository) GetUMKMNameByID(ctx context.Context, umkmID string) (string, error) {
	var nama string
	err := r.DB.QueryRow(ctx, `
		SELECT nama_umkm FROM user_mgmt.master_umkm
		WHERE umkm_id = $1 AND is_deleted = FALSE
	`, umkmID).Scan(&nama)
	if err == pgx.ErrNoRows {
		return umkmID, nil
	}
	return nama, err
}

// GetDefaultDateRange — ambil tanggal min & max data untuk UMKM tertentu
func (r *Repository) GetDefaultDateRange(ctx context.Context, umkmID string) (minDate, maxDate string, err error) {
	err = r.DB.QueryRow(ctx, `
		SELECT
			TO_CHAR(MIN(tanggal_transaksi), 'YYYY-MM-DD'),
			TO_CHAR(MAX(tanggal_transaksi), 'YYYY-MM-DD')
		FROM dashboard.transaksi_penjualan
		WHERE umkm_id = $1
		  AND status_transaksi <> 'CANCELLED'
	`, umkmID).Scan(&minDate, &maxDate)

	if err != nil {
		log.Printf("[DEBUG] GetDefaultDateRange error for umkmID=%s: %v", umkmID, err)
	} else {
		log.Printf("[DEBUG] GetDefaultDateRange umkmID=%s min=%s max=%s", umkmID, minDate, maxDate)
	}

	return
}

// GetOmzetBulanan — omzet bulan ini dan bulan lalu
func (r *Repository) GetOmzetBulanan(ctx context.Context, umkmID, dateFrom, dateTo string) (omzetBulanIni, omzetBulanLalu float64, err error) {
	err = r.DB.QueryRow(ctx, `
		WITH bounds AS (
			SELECT
				$2::date AS current_from,
				$3::date AS current_to,
				DATE_TRUNC('month', $2::date - INTERVAL '1 month')::date AS previous_from,
				(DATE_TRUNC('month', $2::date)::date - INTERVAL '1 day')::date AS previous_to
		),
		current_data AS (
			SELECT COALESCE(SUM(total_omzet), 0) AS total
			FROM dashboard.transaksi_penjualan, bounds
			WHERE umkm_id = $1
			  AND status_transaksi <> 'CANCELLED'
			  AND tanggal_transaksi >= bounds.current_from
			  AND tanggal_transaksi <= bounds.current_to
		),
		previous_data AS (
			SELECT COALESCE(SUM(total_omzet), 0) AS total
			FROM dashboard.transaksi_penjualan, bounds
			WHERE umkm_id = $1
			  AND status_transaksi <> 'CANCELLED'
			  AND tanggal_transaksi >= bounds.previous_from
			  AND tanggal_transaksi <= bounds.previous_to
		)
		SELECT current_data.total::float8, previous_data.total::float8
		FROM current_data, previous_data
	`, umkmID, dateFrom, dateTo).Scan(&omzetBulanIni, &omzetBulanLalu)

	return
}

func (r *Repository) GetKategoriUsaha(ctx context.Context, umkmID string) (string, error) {
	var nama string
	err := r.DB.QueryRow(ctx, `
		SELECT COALESCE(k.nama_kategori_usaha, '')
		FROM user_mgmt.master_umkm u
		LEFT JOIN ref.ref_kategoriusaha k ON k.kategori_usaha_id = u.kategori_usaha_id
		WHERE u.umkm_id = $1 AND u.is_deleted = FALSE
	`, umkmID).Scan(&nama)
	return nama, err
}

// GetStatusPerkembangan — ambil status perkembangan terakhir UMKM
func (r *Repository) GetStatusPerkembangan(ctx context.Context, umkmID string) (string, error) {
	var status string
	err := r.DB.QueryRow(ctx, `
		SELECT COALESCE(s.nama_status_perkembangan, '')
		FROM dashboard.transaksi_monitoringperkembangan m
		LEFT JOIN ref.ref_statusperkembangan s ON s.status_perkembangan_id = m.status_perkembangan_id
		WHERE m.umkm_id = $1
		ORDER BY m.created_at DESC
		LIMIT 1
	`, umkmID).Scan(&status)
	return status, err
}
