-- +goose Down

DROP VIEW IF EXISTS dashboard.vw_umkm_dashboard_summary;
DROP VIEW IF EXISTS dashboard.vw_umkm_produk_terjual;
DROP VIEW IF EXISTS dashboard.vw_umkm_penjualan_bulanan;
DROP VIEW IF EXISTS dashboard.vw_umkm_penjualan_harian;
