package dashboard

import (
	"context"
	"fmt"
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

// provinsiClause returns SQL fragment and arg for provinsi filter.
// argIdx is the next $N placeholder index.
func provinsiClause(provinsi string, argIdx int) (string, []any) {
	if strings.TrimSpace(provinsi) == "" {
		return "", nil
	}
	return fmt.Sprintf(" AND provinsi = $%d", argIdx), []any{provinsi}
}

func statusClause(status string, argIdx int) (string, []any) {
	if strings.TrimSpace(status) == "" {
		return "", nil
	}
	return fmt.Sprintf(" AND status_umkm_id = $%d", argIdx), []any{status}
}

// ─── Summary ─────────────────────────────────────────────────────────────────

func (r *Repository) GetSummary(ctx context.Context) (*SummaryResponse, error) {
	return r.GetSummaryFiltered(ctx, "", "", "", "")
}

func (r *Repository) GetSummaryFiltered(ctx context.Context, provinsi, statusUMKM, startDate, endDate string) (*SummaryResponse, error) {
	// Summary view is pre-aggregated — for filtered version query master tables directly
	if provinsi == "" && statusUMKM == "" && startDate == "" && endDate == "" {
		query := `
			SELECT total_umkm, total_umkm_aktif, total_umkm_berkembang,
			       total_umkm_tidak_aktif, total_laba, total_mitra,
			       total_program_pelatihan, total_pengajuan_kemitraan, generated_at
			FROM dashboard.vw_dashboard_nasional_summary LIMIT 1`
		var s SummaryResponse
		err := r.DB.QueryRow(ctx, query).Scan(
			&s.TotalUMKM, &s.TotalUMKMActive, &s.TotalUMKMBerkembang,
			&s.TotalUMKMTidakAktif, &s.TotalLaba, &s.TotalMitra,
			&s.TotalProgramPelatihan, &s.TotalPengajuanKemitraan, &s.GeneratedAt,
		)
		return &s, err
	}

	// Filtered query dari tabel master
	args := []any{}
	where := "WHERE u.is_deleted = FALSE"
	i := 1
	if provinsi != "" {
		where += fmt.Sprintf(" AND l.provinsi = $%d", i)
		args = append(args, provinsi)
		i++
	}
	if statusUMKM != "" {
		where += fmt.Sprintf(" AND u.status_umkm_id = $%d", i)
		args = append(args, statusUMKM)
	}
	if startDate != "" {
		where += fmt.Sprintf(" AND COALESCE(u.tanggal_terdaftar, u.created_at::date) >= $%d::date", i)
		args = append(args, startDate)
		i++
	}
	if endDate != "" {
		where += fmt.Sprintf(" AND COALESCE(u.tanggal_terdaftar, u.created_at::date) <= $%d::date", i)
		args = append(args, endDate)
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
		LEFT JOIN dashboard.transaksi_monitoringperkembangan mp ON mp.umkm_id = u.umkm_id
		%s`, where)

	var s SummaryResponse
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
	clause, args := provinsiClause(provinsi, 1)
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

func (r *Repository) GetRegistrationTrendFiltered(ctx context.Context, days, provinsi, startDate, endDate string) ([]RegistrationTrendItem, error) {
	args := []any{days}
	clause := ""
	argIdx := 2
	if provinsi != "" {
		clause += fmt.Sprintf(" AND provinsi = $%d", argIdx)
		args = append(args, provinsi)
		argIdx++
	}
	if startDate != "" {
		clause += fmt.Sprintf(" AND tanggal >= $%d::date", argIdx)
		args = append(args, startDate)
		argIdx++
	}
	if endDate != "" {
		clause += fmt.Sprintf(" AND tanggal <= $%d::date", argIdx)
		args = append(args, endDate)
	}
	query := `
		SELECT tanggal::text, SUM(total_pendaftaran) AS total
		FROM dashboard.vw_dashboard_nasional_pendaftaran_timeseries
		WHERE tanggal >= CURRENT_DATE - ($1 || ' days')::interval` + clause + `
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
	return r.GetStatusDistributionFiltered(ctx, "")
}

func (r *Repository) GetStatusDistributionFiltered(ctx context.Context, provinsi string) ([]StatusDistributionItem, error) {
	clause, args := provinsiClause(provinsi, 1)
	query := `
		SELECT status_umkm_id, nama_status_umkm, total_umkm, persentase
		FROM dashboard.vw_dashboard_nasional_status_umkm
		WHERE 1=1` + clause + `
		ORDER BY total_umkm DESC`
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

func (r *Repository) GetLabaTrendFiltered(ctx context.Context, days, provinsi, startDate, endDate string) ([]LabaTimeseriesItem, error) {
	args := []any{days}
	clause := ""
	argIdx := 2
	if provinsi != "" {
		clause += fmt.Sprintf(" AND provinsi = $%d", argIdx)
		args = append(args, provinsi)
		argIdx++
	}
	if startDate != "" {
		clause += fmt.Sprintf(" AND tanggal >= $%d::date", argIdx)
		args = append(args, startDate)
		argIdx++
	}
	if endDate != "" {
		clause += fmt.Sprintf(" AND tanggal <= $%d::date", argIdx)
		args = append(args, endDate)
	}
	query := `
		SELECT tanggal::text, SUM(total_laba), AVG(rata_rata_laba), SUM(total_umkm_tercatat)
		FROM dashboard.vw_dashboard_nasional_laba_timeseries
		WHERE tanggal >= CURRENT_DATE - ($1 || ' days')::interval` + clause + `
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
	args := []any{limit}
	clause := ""
	if provinsi != "" {
		clause = " AND provinsi = $2"
		args = append(args, provinsi)
	}
	query := `
		SELECT provinsi, kabupaten_kota, total_laba, total_umkm, peringkat_nasional
		FROM dashboard.vw_dashboard_nasional_top_wilayah_laba
		WHERE 1=1` + clause + `
		ORDER BY peringkat_nasional ASC LIMIT $1`
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
	clause, args := provinsiClause(provinsi, 1)
	query := `
		SELECT kategori_usaha_id, nama_kategori_usaha, total_umkm, total_laba, rata_rata_laba_harian
		FROM dashboard.vw_dashboard_nasional_performa_kategori
		WHERE 1=1` + clause + `
		ORDER BY total_laba DESC`
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
