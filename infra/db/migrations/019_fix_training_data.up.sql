-- Fix training data: sequence, indexes, ref data, constraints
-- ============================================================

-- 1. Buat SEQUENCE untuk nomor sertifikat (anti race condition)
CREATE SEQUENCE IF NOT EXISTS training.sertifikat_number_seq START 1;

-- 2. Replace function generate_certificate_number pakai SEQUENCE
CREATE OR REPLACE FUNCTION training.generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
    seq_num INTEGER;
BEGIN
    seq_num := nextval('training.sertifikat_number_seq');
    RETURN 'SERT/UMKMT/' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '/' || LPAD(seq_num::TEXT, 8, '0');
END;
$$ LANGUAGE plpgsql;

-- 3. Fix constraint harga (sebelumnya CHECK harga = 0, harus >= 0)
ALTER TABLE training.master_programpelatihan
DROP CONSTRAINT IF EXISTS master_programpelatihan_harga_check;

ALTER TABLE training.master_programpelatihan
ADD CONSTRAINT master_programpelatihan_harga_check
CHECK (harga >= 0);

-- 4. Tambah missing reference data untuk enrollment status
INSERT INTO ref.ref_statuspendaftaranpelatihan (status_pendaftaran_pelatihan_id, nama_status_pendaftaran)
VALUES
    ('TERDAFTAR', 'Terdaftar')
ON CONFLICT (status_pendaftaran_pelatihan_id) DO NOTHING;

-- 5. Tambah missing reference data untuk certificate status (DIAJUKAN)
INSERT INTO ref.ref_statussertifikat (status_sertifikat_id, nama_status_sertifikat)
VALUES
    ('DIAJUKAN', 'Diajukan')
ON CONFLICT (status_sertifikat_id) DO NOTHING;

-- 6. Tambah composite index untuk query enrollment by umkm + pelatihan
CREATE INDEX IF NOT EXISTS idx_pendaftaran_umkm_pelatihan
ON training.transaksi_pendaftaranpelatihan(umkm_id, pelatihan_id);

-- 7. Tambah index untuk FK certificate ke enrollment
CREATE INDEX IF NOT EXISTS idx_sertifikat_pendaftaran
ON training.transaksi_sertifikatpelatihan(pendaftaran_pelatihan_id);

-- 8. Tambah index untuk nomor sertifikat lookup
CREATE INDEX IF NOT EXISTS idx_sertifikat_nomor
ON training.transaksi_sertifikatpelatihan(nomor_sertifikat)
WHERE nomor_sertifikat IS NOT NULL;

-- ============================================================
