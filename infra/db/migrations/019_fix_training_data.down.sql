-- Rollback 019
-- ============================================================

DROP INDEX IF EXISTS training.idx_sertifikat_nomor;
DROP INDEX IF EXISTS training.idx_sertifikat_pendaftaran;
DROP INDEX IF EXISTS training.idx_pendaftaran_umkm_pelatihan;

DELETE FROM ref.ref_statussertifikat WHERE status_sertifikat_id = 'DIAJUKAN';
DELETE FROM ref.ref_statuspendaftaranpelatihan WHERE status_pendaftaran_pelatihan_id = 'TERDAFTAR';

ALTER TABLE training.master_programpelatihan
DROP CONSTRAINT IF EXISTS master_programpelatihan_harga_check;

ALTER TABLE training.master_programpelatihan
ADD CONSTRAINT master_programpelatihan_harga_check
CHECK (harga = 0);

DROP FUNCTION IF EXISTS training.generate_certificate_number();
DROP SEQUENCE IF EXISTS training.sertifikat_number_seq;

-- ============================================================
