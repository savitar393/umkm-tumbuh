package dashboard

import (
	"context"

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
				created_at::date AS tgl,
				SUM(laba_harian)   AS laba,
				SUM(jumlah_produk) AS produk,
				ROW_NUMBER() OVER (ORDER BY created_at::date DESC) AS rn
			FROM dashboard.transaksi_monitoringperkembangan
			WHERE umkm_id = $1
			GROUP BY created_at::date
		)
		SELECT
			COALESCE(MAX(CASE WHEN rn = 1 THEN laba   END), 0) AS hari_ini,
			COALESCE(MAX(CASE WHEN rn = 2 THEN laba   END), 0) AS kemarin,
			COALESCE(MAX(CASE WHEN rn = 1 THEN produk END), 0) AS item,
			COALESCE(MAX(CASE WHEN rn = 1 THEN tgl::text END), '') AS tgl_terkini
		FROM ranked
		WHERE rn <= 2
	`, umkmID).Scan(&omzetHariIni, &omzetKemarin, &totalItem, &tglTerkini)
	return
}

// GetLabaHarian — data laba per hari dalam rentang tanggal
func (r *Repository) GetLabaHarian(ctx context.Context, umkmID, dateFrom, dateTo string) ([]LabaHarianItem, error) {
	rows, err := r.DB.Query(ctx, `
		SELECT
			created_at::date                              AS tanggal,
			TO_CHAR(MIN(created_at), 'Day, DD Mon YYYY') AS nama_hari,
			SUM(laba_harian)                              AS laba_bersih,
			SUM(jumlah_produk)                            AS jumlah_produk
		FROM dashboard.transaksi_monitoringperkembangan
		WHERE umkm_id = $1
		  AND created_at::date >= $2::date
		  AND created_at::date <= $3::date
		GROUP BY created_at::date
		ORDER BY tanggal DESC
	`, umkmID, dateFrom, dateTo)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []LabaHarianItem
	for rows.Next() {
		var item LabaHarianItem
		if err := rows.Scan(&item.Tanggal, &item.NamaHari, &item.LabaBersih, &item.JumlahProduk); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

// GetTrenMingguan — agregasi laba per hari untuk N hari terakhir berdasarkan data terbaru
func (r *Repository) GetTrenMingguan(ctx context.Context, umkmID string, days int) ([]TrenMingguan, error) {
	rows, err := r.DB.Query(ctx, `
		WITH latest AS (
			SELECT MAX(created_at::date) AS tgl_max
			FROM dashboard.transaksi_monitoringperkembangan
			WHERE umkm_id = $1
		)
		SELECT
			TO_CHAR(mp.created_at::date, 'Dy') AS hari,
			SUM(mp.laba_harian)                AS total_laba
		FROM dashboard.transaksi_monitoringperkembangan mp, latest
		WHERE mp.umkm_id = $1
		  AND mp.created_at::date > (latest.tgl_max - ($2 || ' days')::interval)
		GROUP BY mp.created_at::date
		ORDER BY mp.created_at::date ASC
	`, umkmID, days)
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
			TO_CHAR(MIN(created_at::date), 'YYYY-MM-DD'),
			TO_CHAR(MAX(created_at::date), 'YYYY-MM-DD')
		FROM dashboard.transaksi_monitoringperkembangan
		WHERE umkm_id = $1
	`, umkmID).Scan(&minDate, &maxDate)
	return
}
