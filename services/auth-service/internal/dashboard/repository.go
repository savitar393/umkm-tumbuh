package dashboard

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	DB *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{DB: db}
}

// ─── helper: build optional WHERE clause ─────────────────────────────────────

func provinsiClause(provinsi string, argIdx int) (string, []any) {
	if strings.TrimSpace(provinsi) == "" {
		return "", nil
	}
	return fmt.Sprintf(" AND l.provinsi = $%d", argIdx), []any{provinsi}
}

func statusClauseMaster(status string, argIdx int) (string, []any) {
	if status == "" || status == "Semua Status" {
		return "", nil
	}
	return fmt.Sprintf(" AND u.status_umkm_id = $%d", argIdx), []any{status}
}

// bulanTahunClause returns SQL to filter by YYYY-MM or YYYY on a date column.
func bulanTahunClause(bulan, tahun, col string, argIdx int) (string, []any) {
	var parts []string
	var args []any

	if col == "" {
		col = "tanggal"
	}

	if tahun == "" && bulan == "" {
		return "", nil
	}

	// If only tahun is given, use full year range
	if tahun != "" && bulan == "" {
		y, err := strconv.Atoi(tahun)
		if err != nil {
			return "", nil
		}
		parts = append(parts, fmt.Sprintf(" %s >= $%d AND %s < $%d", col, argIdx, col, argIdx+1))
		args = append(args, fmt.Sprintf("%d-01-01", y), fmt.Sprintf("%d-01-01", y+1))
		return strings.Join(parts, " AND "), args
	}

	// If bulan is given (YYYY-MM), use month range
	if bulan != "" && len(bulan) == 7 {
		parts = append(parts, fmt.Sprintf(" %s >= $%d AND %s < $%d", col, argIdx, col, argIdx+1))
		start := bulan + "-01"

		y, _ := strconv.Atoi(bulan[:4])
		m, _ := strconv.Atoi(bulan[5:7])
		m2 := m + 1
		y2 := y
		if m2 > 12 {
			m2 = 1
			y2++
		}
		end := fmt.Sprintf("%04d-%02d-01", y2, m2)

		args = append(args, start, end)
		return strings.Join(parts, " AND "), args
	}

	return "", nil
}

// ─── Summary ─────────────────────────────────────────────────────────────────

func (r *Repository) GetSummary(ctx context.Context) (*SummaryResponse, error) {
	return r.GetSummaryFiltered(ctx, "", "", "", "")
}

func (r *Repository) GetSummaryFiltered(ctx context.Context, provinsi, statusUMKM, bulan, tahun string) (*SummaryResponse, error) {
	var s SummaryResponse

	if provinsi == "" && statusUMKM == "" && bulan == "" && tahun == "" {
		query := `
			SELECT total_umkm, total_umkm_aktif, total_umkm_berkembang,
			       total_umkm_tidak_aktif, total_laba, total_mitra,
			       total_program_pelatihan, total_pengajuan_kemitraan, generated_at
			FROM dashboard.vw_dashboard_nasional_summary LIMIT 1`
		err := r.DB.QueryRow(ctx, query).Scan(
			&s.TotalUMKM, &s.TotalUMKMActive, &s.TotalUMKMBerkembang,
			&s.TotalUMKMTidakAktif, &s.TotalLaba, &s.TotalMitra,
			&s.TotalProgramPelatihan, &s.TotalPengajuanKemitraan, &s.GeneratedAt,
		)
		return &s, err
	}

	args := []any{}
	where := "WHERE u.is_deleted = FALSE"
	i := 1
	if provinsi != "" {
		where += fmt.Sprintf(" AND l.provinsi = $%d", i)
		args = append(args, provinsi)
		i++
	}
	if statusUMKM != "" && statusUMKM != "Semua Status" {
		where += fmt.Sprintf(" AND u.status_umkm_id = $%d", i)
		args = append(args, statusUMKM)
		i++
	}

	// Date filter on UMKM registration date (tanggal_terdaftar)
	btClause, btArgs := bulanTahunClause(bulan, tahun, "u.tanggal_terdaftar", i)
	if btClause != "" {
		where += " AND " + btClause
		args = append(args, btArgs...)
		i += len(btArgs)
	}

	// Date filter on monitoring data (laba) — separate arg index
	monitoringJoin := "LEFT JOIN dashboard.transaksi_monitoringperkembangan mp ON mp.umkm_id = u.umkm_id"
	btClause2, btArgs2 := bulanTahunClause(bulan, tahun, "mp.created_at", i)
	if btClause2 != "" {
		monitoringJoin += " AND " + btClause2
		args = append(args, btArgs2...)
	}

	query := fmt.Sprintf(`
		SELECT
			COUNT(DISTINCT u.umkm_id),
			COUNT(DISTINCT CASE WHEN u.status_umkm_id = 'AKTIF' THEN u.umkm_id END),
			COUNT(DISTINCT CASE WHEN u.status_umkm_id = 'BERKEMBANG' THEN u.umkm_id END),
			COUNT(DISTINCT CASE WHEN u.status_umkm_id NOT IN ('AKTIF','BERKEMBANG') THEN u.umkm_id END),
			COALESCE(SUM(mp.laba_harian), 0),
			(SELECT COUNT(*) FROM user_mgmt.master_mitra WHERE is_deleted = FALSE),
			(SELECT COUNT(*) FROM training.master_programpelatihan WHERE is_deleted = FALSE),
			(SELECT COUNT(*) FROM partnership.transaksi_pengajuankerjasama WHERE status_pengajuan_id = 'DIAJUKAN'),
			NOW()
		FROM user_mgmt.master_umkm u
		JOIN user_mgmt.master_lokasi l ON l.lokasi_id = u.lokasi_id
		%s
		%s`, monitoringJoin, where)

	err := r.DB.QueryRow(ctx, query, args...).Scan(
		&s.TotalUMKM, &s.TotalUMKMActive, &s.TotalUMKMBerkembang,
		&s.TotalUMKMTidakAktif, &s.TotalLaba, &s.TotalMitra,
		&s.TotalProgramPelatihan, &s.TotalPengajuanKemitraan, &s.GeneratedAt,
	)
	return &s, err
}

// ─── Map Data ─────────────────────────────────────────────────────────────────

func (r *Repository) GetMapData(ctx context.Context) ([]MapDataItem, error) {
	return r.GetMapDataFiltered(ctx, "")
}

func (r *Repository) GetMapDataFiltered(ctx context.Context, provinsi string) ([]MapDataItem, error) {
	var clause string
	var args []any
	if provinsi != "" {
		clause = " AND provinsi = $1"
		args = append(args, provinsi)
	}
	query := `
		SELECT provinsi, kabupaten_kota, total_umkm, total_umkm_aktif,
		       total_laba, COALESCE(latitude_avg, 0), COALESCE(longitude_avg, 0)
		FROM dashboard.vw_dashboard_nasional_map_data
		WHERE 1=1` + clause + `
		ORDER BY total_laba DESC`
	return r.queryMapData(ctx, query, args...)
}

func (r *Repository) queryMapData(ctx context.Context, query string, args ...any) ([]MapDataItem, error) {
	rows, err := r.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []MapDataItem
	for rows.Next() {
		var item MapDataItem
		if err := rows.Scan(&item.Provinsi, &item.KabupatenKota, &item.TotalUMKM,
			&item.TotalUMKMAktif, &item.TotalLaba, &item.LatitudeAvg, &item.LongitudeAvg); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

// ─── Registration Trend ───────────────────────────────────────────────────────

func (r *Repository) GetRegistrationTrend(ctx context.Context, days string) ([]RegistrationTrendItem, error) {
	return r.GetRegistrationTrendFiltered(ctx, days, "", "", "")
}

func (r *Repository) GetRegistrationTrendFiltered(ctx context.Context, days, provinsi, bulan, tahun string) ([]RegistrationTrendItem, error) {
	args := []any{days}
	clauses := []string{}
	i := 2

	if provinsi != "" {
		clauses = append(clauses, fmt.Sprintf(" provinsi = $%d", i))
		args = append(args, provinsi)
		i++
	}

	btClause, btArgs := bulanTahunClause(bulan, tahun, "tanggal", i)
	if btClause != "" {
		clauses = append(clauses, "("+btClause+")")
		args = append(args, btArgs...)
	}

	whereExtra := ""
	if len(clauses) > 0 {
		whereExtra = " AND " + strings.Join(clauses, " AND ")
	}

	query := `
		SELECT tanggal::text, SUM(total_pendaftaran) AS total
		FROM dashboard.vw_dashboard_nasional_pendaftaran_timeseries
		WHERE tanggal >= CURRENT_DATE - ($1 || ' days')::interval` + whereExtra + `
		GROUP BY tanggal ORDER BY tanggal ASC`
	rows, err := r.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []RegistrationTrendItem
	for rows.Next() {
		var item RegistrationTrendItem
		if err := rows.Scan(&item.Tanggal, &item.TotalPendaftaran); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

// ─── Status Distribution ─────────────────────────────────────────────────────

func (r *Repository) GetStatusDistribution(ctx context.Context) ([]StatusDistributionItem, error) {
	return r.GetStatusDistributionFiltered(ctx, "", "")
}

func (r *Repository) GetStatusDistributionFiltered(ctx context.Context, provinsi, statusUMKM string) ([]StatusDistributionItem, error) {
	var query string
	var args []any

	if provinsi == "" && (statusUMKM == "" || statusUMKM == "Semua Status") {
		query = `
			SELECT status_umkm_id, nama_status_umkm, total_umkm, persentase
			FROM dashboard.vw_dashboard_nasional_status_umkm
			ORDER BY total_umkm DESC`
	} else {
		where := "WHERE u.is_deleted = FALSE"
		i := 1
		if provinsi != "" {
			where += fmt.Sprintf(" AND l.provinsi = $%d", i)
			args = append(args, provinsi)
			i++
		}
		if statusUMKM != "" && statusUMKM != "Semua Status" {
			where += fmt.Sprintf(" AND u.status_umkm_id = $%d", i)
			args = append(args, statusUMKM)
		}
		query = fmt.Sprintf(`
			SELECT u.status_umkm_id, s.nama_status_umkm,
			       COUNT(*) AS total_umkm,
			       ROUND(100.0 * COUNT(*)::numeric / NULLIF(SUM(COUNT(*)) OVER (), 0), 2) AS persentase
			FROM user_mgmt.master_umkm u
			JOIN ref.ref_statusumkm s ON s.status_umkm_id = u.status_umkm_id
			JOIN user_mgmt.master_lokasi l ON l.lokasi_id = u.lokasi_id
			%s
			GROUP BY u.status_umkm_id, s.nama_status_umkm
			ORDER BY total_umkm DESC`, where)
	}

	rows, err := r.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []StatusDistributionItem
	for rows.Next() {
		var item StatusDistributionItem
		if err := rows.Scan(&item.StatusID, &item.NamaStatus, &item.Total, &item.Persentase); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

// ─── Laba Trend ──────────────────────────────────────────────────────────────

func (r *Repository) GetLabaTrend(ctx context.Context, days string) ([]LabaTimeseriesItem, error) {
	return r.GetLabaTrendFiltered(ctx, days, "", "", "")
}

func (r *Repository) GetLabaTrendFiltered(ctx context.Context, days, provinsi, bulan, tahun string) ([]LabaTimeseriesItem, error) {
	args := []any{days}
	clauses := []string{}
	i := 2

	if provinsi != "" {
		clauses = append(clauses, fmt.Sprintf(" provinsi = $%d", i))
		args = append(args, provinsi)
		i++
	}

	btClause, btArgs := bulanTahunClause(bulan, tahun, "tanggal", i)
	if btClause != "" {
		clauses = append(clauses, "("+btClause+")")
		args = append(args, btArgs...)
	}

	whereExtra := ""
	if len(clauses) > 0 {
		whereExtra = " AND " + strings.Join(clauses, " AND ")
	}

	query := `
		SELECT tanggal::text, SUM(total_laba), AVG(rata_rata_laba), SUM(total_umkm_tercatat)
		FROM dashboard.vw_dashboard_nasional_laba_timeseries
		WHERE tanggal >= CURRENT_DATE - ($1 || ' days')::interval` + whereExtra + `
		GROUP BY tanggal ORDER BY tanggal ASC`
	rows, err := r.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []LabaTimeseriesItem
	for rows.Next() {
		var item LabaTimeseriesItem
		if err := rows.Scan(&item.Tanggal, &item.TotalLaba, &item.RataRata, &item.TotalUMKM); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

// ─── Top Wilayah ─────────────────────────────────────────────────────────────

func (r *Repository) GetTopWilayah(ctx context.Context, limit int) ([]TopWilayahItem, error) {
	return r.GetTopWilayahFiltered(ctx, limit, "")
}

func (r *Repository) GetTopWilayahFiltered(ctx context.Context, limit int, provinsi string) ([]TopWilayahItem, error) {
	var query string
	var args []any

	if provinsi == "" {
		query = `
			SELECT provinsi, kabupaten_kota, total_laba, total_umkm, peringkat_nasional
			FROM dashboard.vw_dashboard_nasional_top_wilayah_laba
			ORDER BY peringkat_nasional ASC LIMIT $1`
		args = append(args, limit)
	} else {
		query = `
			SELECT provinsi, kabupaten_kota, total_laba, total_umkm, peringkat_nasional
			FROM dashboard.vw_dashboard_nasional_top_wilayah_laba
			WHERE provinsi = $1
			ORDER BY peringkat_nasional ASC LIMIT $2`
		args = append(args, provinsi, limit)
	}

	rows, err := r.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []TopWilayahItem
	for rows.Next() {
		var item TopWilayahItem
		if err := rows.Scan(&item.Provinsi, &item.KabupatenKota, &item.TotalLaba,
			&item.TotalUMKM, &item.PeringkatNasional); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

// ─── Kategori Performa ────────────────────────────────────────────────────────

func (r *Repository) GetKategoriPerforma(ctx context.Context) ([]KategoriPerformaItem, error) {
	return r.GetKategoriPerformaFiltered(ctx, "")
}

func (r *Repository) GetKategoriPerformaFiltered(ctx context.Context, provinsi string) ([]KategoriPerformaItem, error) {
	var query string
	var args []any

	if provinsi == "" {
		query = `
			SELECT kategori_usaha_id, nama_kategori_usaha, total_umkm, total_laba, rata_rata_laba_harian
			FROM dashboard.vw_dashboard_nasional_performa_kategori
			ORDER BY total_laba DESC`
	} else {
		query = `
			SELECT u.kategori_usaha_id, k.nama_kategori_usaha,
			       COUNT(DISTINCT u.umkm_id),
			       COALESCE(SUM(m.laba_harian), 0) AS total_laba,
			       COALESCE(AVG(m.laba_harian), 0) AS rata_rata_laba
			FROM user_mgmt.master_umkm u
			JOIN ref.ref_kategoriusaha k ON k.kategori_usaha_id = u.kategori_usaha_id
			JOIN user_mgmt.master_lokasi l ON l.lokasi_id = u.lokasi_id
			LEFT JOIN dashboard.transaksi_monitoringperkembangan m ON m.umkm_id = u.umkm_id
			WHERE u.is_deleted = FALSE AND l.provinsi = $1
			GROUP BY u.kategori_usaha_id, k.nama_kategori_usaha
			ORDER BY total_laba DESC`
		args = append(args, provinsi)
	}

	rows, err := r.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []KategoriPerformaItem
	for rows.Next() {
		var item KategoriPerformaItem
		if err := rows.Scan(&item.KategoriID, &item.NamaKategori, &item.TotalUMKM,
			&item.TotalLaba, &item.RataRataLaba); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

// ─── Atensi ───────────────────────────────────────────────────────────────────

func (r *Repository) GetAtensi(ctx context.Context) (*AtensiResponse, error) {
	query := `
		SELECT total_umkm_perlu_atensi, total_umkm_berisiko, total_provinsi_terdampak, generated_at
		FROM dashboard.vw_dashboard_nasional_atensi LIMIT 1`
	var a AtensiResponse
	err := r.DB.QueryRow(ctx, query).Scan(
		&a.TotalUMKMPerluAtensi, &a.TotalUMKMBerisiko, &a.TotalProvTerdampak, &a.GeneratedAt,
	)
	return &a, err
}
