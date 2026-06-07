-- +goose Down

DROP VIEW IF EXISTS dashboard.vw_dashboard_nasional_atensi CASCADE;
DROP VIEW IF EXISTS dashboard.vw_dashboard_nasional_performa_kategori CASCADE;
DROP VIEW IF EXISTS dashboard.vw_dashboard_nasional_top_wilayah_laba CASCADE;
DROP VIEW IF EXISTS dashboard.vw_dashboard_nasional_laba_timeseries CASCADE;
DROP VIEW IF EXISTS dashboard.vw_dashboard_nasional_status_umkm CASCADE;
DROP VIEW IF EXISTS dashboard.vw_dashboard_nasional_pendaftaran_timeseries CASCADE;
DROP VIEW IF EXISTS dashboard.vw_dashboard_nasional_map_data CASCADE;
DROP VIEW IF EXISTS dashboard.vw_dashboard_nasional_summary CASCADE;
DROP VIEW IF EXISTS dashboard.vw_status_pengajuan_kemitraan_mitra CASCADE;
DROP VIEW IF EXISTS dashboard.vw_ringkasan_pelatihan_umkm CASCADE;
DROP VIEW IF EXISTS dashboard.vw_monitoring_umkm_harian CASCADE;
