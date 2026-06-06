-- +goose Up

-- Reporting views
-- ============================================================

CREATE OR REPLACE VIEW dashboard.vw_monitoring_umkm_harian AS
SELECT
    m.umkm_id,
    u.nama_umkm,
    u.kategori_usaha_id,
    u.skala_usaha_id,
    u.lokasi_id,
    l.provinsi,
    l.kabupaten_kota,
    m.status_perkembangan_id,
    m.laba_harian,
    m.jumlah_produk,
    m.created_at::date AS tanggal,
    m.created_at
FROM dashboard.transaksi_monitoringperkembangan m
JOIN user_mgmt.master_umkm u ON u.umkm_id = m.umkm_id
JOIN user_mgmt.master_lokasi l ON l.lokasi_id = u.lokasi_id;

CREATE OR REPLACE VIEW dashboard.vw_ringkasan_pelatihan_umkm AS
SELECT
    p.umkm_id,
    COUNT(*) AS total_pendaftaran,
    COUNT(*) FILTER (WHERE p.status_pendaftaran_pelatihan_id = 'SELESAI') AS total_selesai,
    AVG(p.progress_persen) AS rata_rata_progress
FROM training.transaksi_pendaftaranpelatihan p
GROUP BY p.umkm_id;

CREATE OR REPLACE VIEW dashboard.vw_status_pengajuan_kemitraan_mitra AS
SELECT
    k.mitra_id,
    mt.nama_mitra,
    k.status_pengajuan_id,
    COUNT(*) AS total_pengajuan,
    MAX(k.created_at) AS terakhir_pengajuan
FROM partnership.transaksi_pengajuankerjasama k
JOIN user_mgmt.master_mitra mt ON mt.mitra_id = k.mitra_id
GROUP BY k.mitra_id, mt.nama_mitra, k.status_pengajuan_id;

-- ============================================================

-- National dashboard views for admin dashboard.
-- These views are read models for:
-- KPI cards, Indonesia map density, registration trend, status distribution,
-- laba trend, top regions, category performance, and attention/alert cards.

CREATE OR REPLACE VIEW dashboard.vw_dashboard_nasional_summary AS
WITH latest_monitoring AS (
    SELECT DISTINCT ON (m.umkm_id)
        m.umkm_id,
        m.status_perkembangan_id,
        m.laba_harian,
        m.jumlah_produk,
        m.created_at
    FROM dashboard.transaksi_monitoringperkembangan m
    ORDER BY m.umkm_id, m.created_at DESC
),
monitoring_total AS (
    SELECT COALESCE(SUM(laba_harian), 0) AS total_laba
    FROM dashboard.transaksi_monitoringperkembangan
)
SELECT
    (SELECT COUNT(*) FROM user_mgmt.master_umkm u WHERE u.is_deleted = FALSE) AS total_umkm,
    (SELECT COUNT(*) FROM user_mgmt.master_umkm u WHERE u.is_deleted = FALSE AND u.status_umkm_id = 'AKTIF') AS total_umkm_aktif,
    (
        SELECT COUNT(*)
        FROM user_mgmt.master_umkm u
        JOIN latest_monitoring lm ON lm.umkm_id = u.umkm_id
        WHERE u.is_deleted = FALSE
          AND lm.status_perkembangan_id IN ('NAIK', 'EKSPANSI')
    ) AS total_umkm_berkembang,
    (
        SELECT COUNT(*)
        FROM user_mgmt.master_umkm u
        WHERE u.is_deleted = FALSE
          AND u.status_umkm_id IN ('NONAKTIF', 'SUSPEND', 'ARSIP')
    ) AS total_umkm_tidak_aktif,
    (SELECT total_laba FROM monitoring_total) AS total_laba,
    (SELECT COUNT(*) FROM user_mgmt.master_mitra mt WHERE mt.is_deleted = FALSE) AS total_mitra,
    (SELECT COUNT(*) FROM training.master_programpelatihan p WHERE p.is_deleted = FALSE) AS total_program_pelatihan,
    (SELECT COUNT(*) FROM partnership.transaksi_pengajuankerjasama k) AS total_pengajuan_kemitraan,
    now() AS generated_at;

CREATE OR REPLACE VIEW dashboard.vw_dashboard_nasional_map_data AS
SELECT
    l.provinsi,
    l.kabupaten_kota,
    COUNT(DISTINCT u.umkm_id) AS total_umkm,
    COUNT(DISTINCT u.umkm_id) FILTER (WHERE u.status_umkm_id = 'AKTIF') AS total_umkm_aktif,
    COALESCE(SUM(m.laba_harian), 0) AS total_laba,
    AVG(l.latitude) AS latitude_avg,
    AVG(l.longitude) AS longitude_avg,
    MIN(m.created_at)::date AS tanggal_awal_data,
    MAX(m.created_at)::date AS tanggal_akhir_data
FROM user_mgmt.master_umkm u
JOIN user_mgmt.master_lokasi l ON l.lokasi_id = u.lokasi_id
LEFT JOIN dashboard.transaksi_monitoringperkembangan m ON m.umkm_id = u.umkm_id
WHERE u.is_deleted = FALSE
GROUP BY l.provinsi, l.kabupaten_kota;

CREATE OR REPLACE VIEW dashboard.vw_dashboard_nasional_pendaftaran_timeseries AS
SELECT
    COALESCE(u.tanggal_terdaftar, u.created_at::date) AS tanggal,
    l.provinsi,
    l.kabupaten_kota,
    u.status_umkm_id,
    COUNT(*) AS total_pendaftaran
FROM user_mgmt.master_umkm u
JOIN user_mgmt.master_lokasi l ON l.lokasi_id = u.lokasi_id
WHERE u.is_deleted = FALSE
GROUP BY COALESCE(u.tanggal_terdaftar, u.created_at::date), l.provinsi, l.kabupaten_kota, u.status_umkm_id;

CREATE OR REPLACE VIEW dashboard.vw_dashboard_nasional_status_umkm AS
SELECT
    u.status_umkm_id,
    s.nama_status_umkm,
    COUNT(*) AS total_umkm,
    ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 2) AS persentase
FROM user_mgmt.master_umkm u
JOIN ref.ref_statusumkm s ON s.status_umkm_id = u.status_umkm_id
WHERE u.is_deleted = FALSE
GROUP BY u.status_umkm_id, s.nama_status_umkm;

CREATE OR REPLACE VIEW dashboard.vw_dashboard_nasional_laba_timeseries AS
SELECT
    m.created_at::date AS tanggal,
    l.provinsi,
    l.kabupaten_kota,
    u.kategori_usaha_id,
    u.status_umkm_id,
    SUM(m.laba_harian) AS total_laba,
    AVG(m.laba_harian) AS rata_rata_laba,
    COUNT(DISTINCT m.umkm_id) AS total_umkm_tercatat
FROM dashboard.transaksi_monitoringperkembangan m
JOIN user_mgmt.master_umkm u ON u.umkm_id = m.umkm_id
JOIN user_mgmt.master_lokasi l ON l.lokasi_id = u.lokasi_id
WHERE u.is_deleted = FALSE
GROUP BY m.created_at::date, l.provinsi, l.kabupaten_kota, u.kategori_usaha_id, u.status_umkm_id;

CREATE OR REPLACE VIEW dashboard.vw_dashboard_nasional_top_wilayah_laba AS
SELECT
    l.provinsi,
    l.kabupaten_kota,
    SUM(m.laba_harian) AS total_laba,
    COUNT(DISTINCT u.umkm_id) AS total_umkm,
    RANK() OVER (ORDER BY SUM(m.laba_harian) DESC) AS peringkat_nasional
FROM dashboard.transaksi_monitoringperkembangan m
JOIN user_mgmt.master_umkm u ON u.umkm_id = m.umkm_id
JOIN user_mgmt.master_lokasi l ON l.lokasi_id = u.lokasi_id
WHERE u.is_deleted = FALSE
GROUP BY l.provinsi, l.kabupaten_kota;

CREATE OR REPLACE VIEW dashboard.vw_dashboard_nasional_performa_kategori AS
SELECT
    u.kategori_usaha_id,
    k.nama_kategori_usaha,
    COUNT(DISTINCT u.umkm_id) AS total_umkm,
    COALESCE(SUM(m.laba_harian), 0) AS total_laba,
    COALESCE(AVG(m.laba_harian), 0) AS rata_rata_laba_harian
FROM user_mgmt.master_umkm u
JOIN ref.ref_kategoriusaha k ON k.kategori_usaha_id = u.kategori_usaha_id
LEFT JOIN dashboard.transaksi_monitoringperkembangan m ON m.umkm_id = u.umkm_id
WHERE u.is_deleted = FALSE
GROUP BY u.kategori_usaha_id, k.nama_kategori_usaha;

CREATE OR REPLACE VIEW dashboard.vw_dashboard_nasional_atensi AS
SELECT
    COUNT(DISTINCT u.umkm_id) FILTER (WHERE u.status_umkm_id IN ('NONAKTIF', 'SUSPEND', 'ARSIP')) AS total_umkm_perlu_atensi,
    COUNT(DISTINCT u.umkm_id) FILTER (WHERE m.status_perkembangan_id IN ('TURUN', 'BERISIKO', 'PASIF')) AS total_umkm_berisiko,
    COUNT(DISTINCT l.provinsi) FILTER (WHERE u.status_umkm_id IN ('NONAKTIF', 'SUSPEND', 'ARSIP')) AS total_provinsi_terdampak,
    now() AS generated_at
FROM user_mgmt.master_umkm u
JOIN user_mgmt.master_lokasi l ON l.lokasi_id = u.lokasi_id
LEFT JOIN dashboard.transaksi_monitoringperkembangan m ON m.umkm_id = u.umkm_id
WHERE u.is_deleted = FALSE;
