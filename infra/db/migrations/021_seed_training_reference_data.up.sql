-- +goose Up

-- Seed reference data for training service
-- ============================================================

-- 1. ref_jenispelatihan - jenis/jenis pelatihan
INSERT INTO ref.ref_jenispelatihan (jenis_pelatihan_id, nama_jenis_pelatihan)
VALUES
    ('ONLINE', 'Online'),
    ('OFFLINE', 'Offline'),
    ('HYBRID', 'Hybrid')
ON CONFLICT (jenis_pelatihan_id) DO UPDATE
SET nama_jenis_pelatihan = EXCLUDED.nama_jenis_pelatihan;

-- 2. ref_statuspelatihan - status program pelatihan
INSERT INTO ref.ref_statuspelatihan (status_pelatihan_id, nama_status_pelatihan)
VALUES
    ('DRAFT', 'Draft'),
    ('PUBLISHED', 'Published'),
    ('ONGOING', 'Ongoing'),
    ('ARCHIVED', 'Archived')
ON CONFLICT (status_pelatihan_id) DO UPDATE
SET nama_status_pelatihan = EXCLUDED.nama_status_pelatihan;

-- 3. ref_statuspendaftaranpelatihan - status pendaftaran/enrollment
INSERT INTO ref.ref_statuspendaftaranpelatihan (status_pendaftaran_pelatihan_id, nama_status_pendaftaran)
VALUES
    ('SELESAI', 'Selesai'),
    ('EXPIRED', 'Expired')
ON CONFLICT (status_pendaftaran_pelatihan_id) DO UPDATE
SET nama_status_pendaftaran = EXCLUDED.nama_status_pendaftaran;

-- 4. ref_statussubmission - status submission assignment
INSERT INTO ref.ref_statussubmission (status_submission_id, nama_status_submission)
VALUES
    ('BELUM_DIUPLOAD', 'Belum Diupload'),
    ('DIREVIEW', 'Direview'),
    ('LULUS', 'Lulus'),
    ('TIDAK_LULUS', 'Tidak Lulus')
ON CONFLICT (status_submission_id) DO UPDATE
SET nama_status_submission = EXCLUDED.nama_status_submission;

-- 5. ref_statussertifikat - status sertifikat (DIAJUKAN sudah di 019_fix_training_data)
INSERT INTO ref.ref_statussertifikat (status_sertifikat_id, nama_status_sertifikat)
VALUES
    ('TERBIT', 'Terbit'),
    ('DITOLAK', 'Ditolak')
ON CONFLICT (status_sertifikat_id) DO UPDATE
SET nama_status_sertifikat = EXCLUDED.nama_status_sertifikat;

-- ============================================================
