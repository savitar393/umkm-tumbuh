-- +goose Up

-- ============================================================
-- UMKM sales reporting views
-- ============================================================

CREATE OR REPLACE VIEW dashboard.vw_umkm_penjualan_harian AS
SELECT
    p.umkm_id,
    p.tanggal_transaksi,
    COUNT(*) AS total_transaksi,
    COALESCE(SUM(p.total_omzet), 0) AS total_omzet,
    COALESCE(SUM(p.total_laba), 0) AS total_laba,
    COALESCE(SUM(p.total_item), 0) AS total_item
FROM dashboard.transaksi_penjualan p
WHERE p.status_transaksi = 'FINAL'
GROUP BY p.umkm_id, p.tanggal_transaksi;

CREATE OR REPLACE VIEW dashboard.vw_umkm_penjualan_bulanan AS
SELECT
    p.umkm_id,
    EXTRACT(YEAR FROM p.tanggal_transaksi)::INTEGER AS tahun,
    EXTRACT(MONTH FROM p.tanggal_transaksi)::INTEGER AS bulan,
    COUNT(*) AS total_transaksi,
    COALESCE(SUM(p.total_omzet), 0) AS total_omzet,
    COALESCE(SUM(p.total_laba), 0) AS total_laba,
    COALESCE(SUM(p.total_item), 0) AS total_item
FROM dashboard.transaksi_penjualan p
WHERE p.status_transaksi = 'FINAL'
GROUP BY
    p.umkm_id,
    EXTRACT(YEAR FROM p.tanggal_transaksi),
    EXTRACT(MONTH FROM p.tanggal_transaksi);

CREATE OR REPLACE VIEW dashboard.vw_umkm_produk_terjual AS
SELECT
    p.umkm_id,
    i.produk_id,
    i.nama_produk_snapshot AS nama_produk,
    SUM(i.jumlah) AS total_terjual,
    SUM(i.subtotal) AS total_omzet_produk,
    MIN(p.tanggal_transaksi) AS tanggal_awal,
    MAX(p.tanggal_transaksi) AS tanggal_akhir
FROM dashboard.transaksi_penjualan_item i
JOIN dashboard.transaksi_penjualan p
    ON p.penjualan_id = i.penjualan_id
WHERE p.status_transaksi = 'FINAL'
GROUP BY
    p.umkm_id,
    i.produk_id,
    i.nama_produk_snapshot;

CREATE OR REPLACE VIEW dashboard.vw_umkm_dashboard_summary AS
SELECT
    u.umkm_id,
    u.nama_umkm,

    COALESCE(SUM(p.total_omzet) FILTER (
        WHERE p.tanggal_transaksi = CURRENT_DATE
          AND p.status_transaksi = 'FINAL'
    ), 0) AS omzet_hari_ini,

    COALESCE(SUM(p.total_laba) FILTER (
        WHERE p.tanggal_transaksi = CURRENT_DATE
          AND p.status_transaksi = 'FINAL'
    ), 0) AS laba_hari_ini,

    COALESCE(SUM(p.total_item) FILTER (
        WHERE p.tanggal_transaksi = CURRENT_DATE
          AND p.status_transaksi = 'FINAL'
    ), 0) AS item_terjual_hari_ini,

    COALESCE(COUNT(p.penjualan_id) FILTER (
        WHERE p.tanggal_transaksi = CURRENT_DATE
          AND p.status_transaksi = 'FINAL'
    ), 0) AS transaksi_hari_ini,

    COALESCE(SUM(p.total_omzet) FILTER (
        WHERE date_trunc('month', p.tanggal_transaksi::timestamp) = date_trunc('month', CURRENT_DATE::timestamp)
          AND p.status_transaksi = 'FINAL'
    ), 0) AS omzet_bulan_ini,

    COALESCE(SUM(p.total_laba) FILTER (
        WHERE date_trunc('month', p.tanggal_transaksi::timestamp) = date_trunc('month', CURRENT_DATE::timestamp)
          AND p.status_transaksi = 'FINAL'
    ), 0) AS laba_bulan_ini

FROM user_mgmt.master_umkm u
LEFT JOIN dashboard.transaksi_penjualan p
    ON p.umkm_id = u.umkm_id
WHERE u.is_deleted = FALSE
GROUP BY u.umkm_id, u.nama_umkm;

-- ============================================================
