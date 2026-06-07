-- +goose Up

ALTER TABLE user_mgmt.transaksi_registrasipengguna
DROP CONSTRAINT IF EXISTS ck_registrasi_owner;

ALTER TABLE user_mgmt.transaksi_registrasipengguna
ADD CONSTRAINT ck_registrasi_owner
CHECK (
    (umkm_id IS NOT NULL AND mitra_id IS NULL)
    OR (umkm_id IS NULL AND mitra_id IS NOT NULL)
    OR (umkm_id IS NULL AND mitra_id IS NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_registrasi_akun
ON user_mgmt.transaksi_registrasipengguna(akun_id);
