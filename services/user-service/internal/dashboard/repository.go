package dashboard

import (
	"context"
	"fmt"
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
func (r *Repository) GetOmzetSummary(ctx context.Context, umkmID string) (omzetHariIni, omzetKemarin float64, totalItem int64, tglTerkini string, err error) {
	err = r.DB.QueryRow(ctx, `
		WITH ranked AS (
			SELECT
				tanggal_transaksi AS tgl,
				SUM(total_omzet) AS omzet,
				SUM(total_item) AS item,
				ROW_NUMBER() OVER (ORDER BY tanggal_transaksi DESC) AS rn
			FROM dashboard.transaksi_penjualan
			WHERE umkm_id = $1
			  AND status_transaksi = 'FINAL'
			GROUP BY tanggal_transaksi
		)
		SELECT
			COALESCE(MAX(CASE WHEN rn = 1 THEN omzet END), 0) AS hari_ini,
			COALESCE(MAX(CASE WHEN rn = 2 THEN omzet END), 0) AS kemarin,
			COALESCE(MAX(CASE WHEN rn = 1 THEN item END), 0) AS item,
			COALESCE(MAX(CASE WHEN rn = 1 THEN TO_CHAR(tgl, 'YYYY-MM-DD') END), '') AS tgl_terkini
		FROM ranked
		WHERE rn <= 2
	`, umkmID).Scan(&omzetHariIni, &omzetKemarin, &totalItem, &tglTerkini)
	return
}

// GetLabaHarian — data laba per hari dalam rentang tanggal
func (r *Repository) GetLabaHarian(ctx context.Context, umkmID, dateFrom, dateTo string) ([]LabaHarianItem, error) {
	log.Printf("[DEBUG] GetLabaHarian umkmID=%s dateFrom=%s dateTo=%s", umkmID, dateFrom, dateTo)

	rows, err := r.DB.Query(ctx, `
		SELECT
			TO_CHAR(tanggal_transaksi, 'YYYY-MM-DD')       AS tanggal,
			TO_CHAR(tanggal_transaksi, 'Day, DD Mon YYYY') AS nama_hari,
			COALESCE(SUM(total_laba), 0)::float8           AS laba_bersih,
			COALESCE(SUM(total_item), 0)::bigint           AS jumlah_produk
		FROM dashboard.transaksi_penjualan
		WHERE umkm_id = $1
		  AND tanggal_transaksi >= $2::date
		  AND tanggal_transaksi <= $3::date
		  AND status_transaksi = 'FINAL'
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
		if err := rows.Scan(&item.Tanggal, &item.NamaHari, &item.LabaBersih, &item.JumlahProduk); err != nil {
			log.Printf("[DEBUG] GetLabaHarian scan error: %v", err)
			return nil, err
		}
		result = append(result, item)
	}

	log.Printf("[DEBUG] GetLabaHarian returning %d rows", len(result))
	return result, rows.Err()
}

// GetTrenMingguan — agregasi laba per hari untuk N hari terakhir berdasarkan data terbaru
func (r *Repository) GetTrenMingguan(ctx context.Context, umkmID string, days int) ([]TrenMingguan, error) {
	daysInterval := fmt.Sprintf("%d days", days)

	rows, err := r.DB.Query(ctx, `
		WITH latest AS (
			SELECT MAX(tanggal_transaksi) AS tgl_max
			FROM dashboard.transaksi_penjualan
			WHERE umkm_id = $1
			  AND status_transaksi = 'FINAL'
		)
		SELECT
			TO_CHAR(p.tanggal_transaksi, 'Dy') AS hari,
			COALESCE(SUM(p.total_laba), 0)::float8 AS total_laba
		FROM dashboard.transaksi_penjualan p, latest
		WHERE p.umkm_id = $1
		  AND p.status_transaksi = 'FINAL'
		  AND latest.tgl_max IS NOT NULL
		  AND p.tanggal_transaksi > (latest.tgl_max - $2::interval)
		GROUP BY p.tanggal_transaksi
		ORDER BY p.tanggal_transaksi ASC
	`, umkmID, daysInterval)
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
	return result, rows.Err()
}

// ─── Mitra — daftar UMKM partner ─────────────────────────────────────────────

// GetUMKMPartnersOfMitra — UMKM yang punya kerjasama aktif/selesai dengan mitra ini
func (r *Repository) GetUMKMPartnersOfMitra(ctx context.Context, mitraID string) ([]UMKMMitraItem, error) {
	rows, err := r.DB.Query(ctx, `
		SELECT DISTINCT u.umkm_id, u.nama_umkm
		FROM partnership.transaksi_pengajuankerjasama pk
		JOIN user_mgmt.master_umkm u ON u.umkm_id = pk.umkm_id
		WHERE pk.mitra_id = $1
		  AND pk.status_pengajuan_id IN ('AKTIF', 'SELESAI', 'DISETUJUI', 'MENUNGGU_DOKUMEN_TTD')
		  AND u.is_deleted = FALSE
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
		  AND status_transaksi = 'FINAL'
	`, umkmID).Scan(&minDate, &maxDate)

	if err != nil {
		log.Printf("[DEBUG] GetDefaultDateRange error for umkmID=%s: %v", umkmID, err)
	} else {
		log.Printf("[DEBUG] GetDefaultDateRange umkmID=%s min=%s max=%s", umkmID, minDate, maxDate)
	}
	return
}

// GetOmzetBulanan — omzet bulan ini dan bulan lalu
func (r *Repository) GetOmzetBulanan(ctx context.Context, umkmID string) (omzetBulanIni, omzetBulanLalu float64, err error) {
	err = r.DB.QueryRow(ctx, `
		WITH monthly AS (
			SELECT
				DATE_TRUNC('month', tanggal_transaksi)::date AS bulan,
				SUM(total_omzet) AS total
			FROM dashboard.transaksi_penjualan
			WHERE umkm_id = $1
			  AND status_transaksi = 'FINAL'
			GROUP BY DATE_TRUNC('month', tanggal_transaksi)::date
			ORDER BY bulan DESC
			LIMIT 2
		)
		SELECT
			COALESCE(MAX(CASE WHEN rn = 1 THEN total END), 0),
			COALESCE(MAX(CASE WHEN rn = 2 THEN total END), 0)
		FROM (
			SELECT *, ROW_NUMBER() OVER (ORDER BY bulan DESC) AS rn FROM monthly
		) sub
	`, umkmID).Scan(&omzetBulanIni, &omzetBulanLalu)
	return
}

// GetKategoriUsaha — ambil nama kategori usaha UMKM
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
