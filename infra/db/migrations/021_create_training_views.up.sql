-- +goose Up

-- Training service views for certificate and dashboard queries
-- ============================================================

-- Drop views first to allow type changes (CREATE OR REPLACE cannot change column types)
DO $$
BEGIN
    IF to_regclass('training.v_user_certificate_dashboard') IS NOT NULL THEN
        DROP VIEW v_user_certificate_dashboard;
    END IF;

    IF to_regclass('training.v_certificate_details') IS NOT NULL THEN
        DROP VIEW v_certificate_details;
    END IF;
END $$;

-- 1. v_certificate_details - detailed certificate info with enrollment, training, and user data
CREATE VIEW training.v_certificate_details AS
SELECT
    ts.sertifikat_id,
    ts.pendaftaran_pelatihan_id,
    ts.nomor_sertifikat,
    ts.tanggal_pengajuan,
    ts.tanggal_terbit,
    ts.status_sertifikat_id,
    rss.nama_status_sertifikat,
    ts.dokumen_id,
    tdu.public_url AS dokumen_url,
    ts.catatan_validasi,
    mpp.pelatihan_id,
    mpp.judul_pelatihan,
    rjp.nama_jenis_pelatihan AS jenis_pelatihan,
    tp.tanggal_selesai,
    tp.progress_persen,
    tp.umkm_id,
    mu.nama_umkm,
    mpu.nama_pelaku AS pelaku_nama
FROM training.transaksi_sertifikatpelatihan ts
JOIN training.transaksi_pendaftaranpelatihan tp ON ts.pendaftaran_pelatihan_id = tp.pendaftaran_pelatihan_id
JOIN training.master_programpelatihan mpp ON tp.pelatihan_id = mpp.pelatihan_id
JOIN ref.ref_statussertifikat rss ON ts.status_sertifikat_id = rss.status_sertifikat_id
JOIN ref.ref_jenispelatihan rjp ON mpp.jenis_pelatihan_id = rjp.jenis_pelatihan_id
JOIN user_mgmt.master_umkm mu ON tp.umkm_id = mu.umkm_id
JOIN user_mgmt.master_pelakuumkm mpu ON mu.pelaku_umkm_id = mpu.pelaku_umkm_id
LEFT JOIN document.transaksi_dokumenterunggah tdu ON ts.dokumen_id = tdu.dokumen_id;

COMMENT ON VIEW training.v_certificate_details IS 'Detail sertifikat dengan join ke enrollment, pelatihan, dan user UMKM';

-- 2. v_user_certificate_dashboard - user dashboard summary for certificates
CREATE VIEW training.v_user_certificate_dashboard AS
SELECT
    mu.umkm_id,
    mu.nama_umkm,
    mpu.nama_pelaku AS pelaku_nama,
    COUNT(DISTINCT tp.pendaftaran_pelatihan_id) AS total_pelatihan,
    COUNT(DISTINCT CASE WHEN tp.status_pendaftaran_pelatihan_id = 'SELESAI' THEN tp.pendaftaran_pelatihan_id END) AS pelatihan_selesai,
    COUNT(DISTINCT ts.sertifikat_id) AS total_sertifikat,
    COUNT(DISTINCT CASE WHEN ts.status_sertifikat_id = 'TERBIT' THEN ts.sertifikat_id END) AS sertifikat_terbit,
    MAX(CASE WHEN tp.status_pendaftaran_pelatihan_id = 'SELESAI' THEN tp.tanggal_selesai END) AS pelatihan_terakhir_selesai,
    MAX(CASE WHEN ts.status_sertifikat_id = 'TERBIT' THEN ts.tanggal_terbit END) AS sertifikat_terakhir_terbit
FROM user_mgmt.master_umkm mu
JOIN user_mgmt.master_pelakuumkm mpu ON mu.pelaku_umkm_id = mpu.pelaku_umkm_id
LEFT JOIN training.transaksi_pendaftaranpelatihan tp ON mu.umkm_id = tp.umkm_id
LEFT JOIN training.transaksi_sertifikatpelatihan ts ON tp.pendaftaran_pelatihan_id = ts.pendaftaran_pelatihan_id
GROUP BY mu.umkm_id, mu.nama_umkm, mpu.nama_pelaku;

COMMENT ON VIEW training.v_user_certificate_dashboard IS 'Ringkasan dashboard sertifikat per user UMKM';

-- ============================================================
