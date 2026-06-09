package dashboard

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	DB *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{DB: db}
}

func (r *Repository) GetSummary(ctx context.Context) (*SummaryResponse, error) {
	query := `
		SELECT
			total_umkm,
			total_umkm_aktif,
			total_umkm_berkembang,
			total_umkm_tidak_aktif,
			total_laba,
			total_mitra,
			total_program_pelatihan,
			total_pengajuan_kemitraan,
			generated_at
		FROM dashboard.vw_dashboard_nasional_summary
		LIMIT 1
	`

	var s SummaryResponse
	err := r.DB.QueryRow(ctx, query).Scan(
		&s.TotalUMKM,
		&s.TotalUMKMActive,
		&s.TotalUMKMBerkembang,
		&s.TotalUMKMTidakAktif,
		&s.TotalLaba,
		&s.TotalMitra,
		&s.TotalProgramPelatihan,
		&s.TotalPengajuanKemitraan,
		&s.GeneratedAt,
	)
	if err != nil {
		return nil, err
	}

	return &s, nil
}

func (r *Repository) GetMapData(ctx context.Context) ([]MapDataItem, error) {
	query := `
		SELECT
			provinsi,
			kabupaten_kota,
			total_umkm,
			total_umkm_aktif,
			total_laba,
			COALESCE(latitude_avg, 0),
			COALESCE(longitude_avg, 0)
		FROM dashboard.vw_dashboard_nasional_map_data
		ORDER BY total_laba DESC
	`

	rows, err := r.DB.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []MapDataItem
	for rows.Next() {
		var item MapDataItem
		if err := rows.Scan(
			&item.Provinsi,
			&item.KabupatenKota,
			&item.TotalUMKM,
			&item.TotalUMKMAktif,
			&item.TotalLaba,
			&item.LatitudeAvg,
			&item.LongitudeAvg,
		); err != nil {
			return nil, err
		}
		result = append(result, item)
	}

	return result, rows.Err()
}

func (r *Repository) GetRegistrationTrend(ctx context.Context, days string) ([]RegistrationTrendItem, error) {
	query := `
		SELECT
			tanggal::text,
			SUM(total_pendaftaran) AS total
		FROM dashboard.vw_dashboard_nasional_pendaftaran_timeseries
		WHERE tanggal >= CURRENT_DATE - ($1 || ' days')::interval
		GROUP BY tanggal
		ORDER BY tanggal ASC
	`

	rows, err := r.DB.Query(ctx, query, days)
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

func (r *Repository) GetStatusDistribution(ctx context.Context) ([]StatusDistributionItem, error) {
	query := `
		SELECT
			status_umkm_id,
			nama_status_umkm,
			total_umkm,
			persentase
		FROM dashboard.vw_dashboard_nasional_status_umkm
		ORDER BY total_umkm DESC
	`

	rows, err := r.DB.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []StatusDistributionItem
	for rows.Next() {
		var item StatusDistributionItem
		if err := rows.Scan(
			&item.StatusID,
			&item.NamaStatus,
			&item.Total,
			&item.Persentase,
		); err != nil {
			return nil, err
		}
		result = append(result, item)
	}

	return result, rows.Err()
}

func (r *Repository) GetLabaTrend(ctx context.Context, days string) ([]LabaTimeseriesItem, error) {
	query := `
		SELECT
			tanggal::text,
			SUM(total_laba),
			AVG(rata_rata_laba),
			SUM(total_umkm_tercatat)
		FROM dashboard.vw_dashboard_nasional_laba_timeseries
		WHERE tanggal >= CURRENT_DATE - ($1 || ' days')::interval
		GROUP BY tanggal
		ORDER BY tanggal ASC
	`

	rows, err := r.DB.Query(ctx, query, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []LabaTimeseriesItem
	for rows.Next() {
		var item LabaTimeseriesItem
		if err := rows.Scan(
			&item.Tanggal,
			&item.TotalLaba,
			&item.RataRata,
			&item.TotalUMKM,
		); err != nil {
			return nil, err
		}
		result = append(result, item)
	}

	return result, rows.Err()
}

func (r *Repository) GetTopWilayah(ctx context.Context, limit int) ([]TopWilayahItem, error) {
	query := `
		SELECT
			provinsi,
			kabupaten_kota,
			total_laba,
			total_umkm,
			peringkat_nasional
		FROM dashboard.vw_dashboard_nasional_top_wilayah_laba
		ORDER BY peringkat_nasional ASC
		LIMIT $1
	`

	rows, err := r.DB.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []TopWilayahItem
	for rows.Next() {
		var item TopWilayahItem
		if err := rows.Scan(
			&item.Provinsi,
			&item.KabupatenKota,
			&item.TotalLaba,
			&item.TotalUMKM,
			&item.PeringkatNasional,
		); err != nil {
			return nil, err
		}
		result = append(result, item)
	}

	return result, rows.Err()
}

func (r *Repository) GetKategoriPerforma(ctx context.Context) ([]KategoriPerformaItem, error) {
	query := `
		SELECT
			kategori_usaha_id,
			nama_kategori_usaha,
			total_umkm,
			total_laba,
			rata_rata_laba_harian
		FROM dashboard.vw_dashboard_nasional_performa_kategori
		ORDER BY total_laba DESC
	`

	rows, err := r.DB.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []KategoriPerformaItem
	for rows.Next() {
		var item KategoriPerformaItem
		if err := rows.Scan(
			&item.KategoriID,
			&item.NamaKategori,
			&item.TotalUMKM,
			&item.TotalLaba,
			&item.RataRataLaba,
		); err != nil {
			return nil, err
		}
		result = append(result, item)
	}

	return result, rows.Err()
}

func (r *Repository) GetAtensi(ctx context.Context) (*AtensiResponse, error) {
	query := `
		SELECT
			total_umkm_perlu_atensi,
			total_umkm_berisiko,
			total_provinsi_terdampak,
			generated_at
		FROM dashboard.vw_dashboard_nasional_atensi
		LIMIT 1
	`

	var a AtensiResponse
	err := r.DB.QueryRow(ctx, query).Scan(
		&a.TotalUMKMPerluAtensi,
		&a.TotalUMKMBerisiko,
		&a.TotalProvTerdampak,
		&a.GeneratedAt,
	)
	if err != nil {
		return nil, err
	}

	return &a, nil
}
