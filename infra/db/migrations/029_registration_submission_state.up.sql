ALTER TABLE user_mgmt.transaksi_registrasipengguna
ADD COLUMN IF NOT EXISTS sudah_submit BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE user_mgmt.transaksi_registrasipengguna
SET sudah_submit = TRUE
WHERE status_verifikasi_id IN ('DISETUJUI', 'DITOLAK')
   OR tanggal_review IS NOT NULL;
