-- +goose Down

DROP INDEX IF EXISTS user_mgmt.uq_registrasi_akun;

ALTER TABLE user_mgmt.transaksi_registrasipengguna
DROP CONSTRAINT IF EXISTS ck_registrasi_owner;

ALTER TABLE user_mgmt.transaksi_registrasipengguna
ADD CONSTRAINT ck_registrasi_owner
CHECK (
    (umkm_id IS NOT NULL AND mitra_id IS NULL)
    OR (umkm_id IS NULL AND mitra_id IS NOT NULL)
);
