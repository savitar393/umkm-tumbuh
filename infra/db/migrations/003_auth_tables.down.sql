-- +goose Down

DROP TABLE IF EXISTS auth.transaksi_revoked_jwts CASCADE;
DROP TABLE IF EXISTS auth.transaksi_kode_verifikasi CASCADE;
DROP TABLE IF EXISTS auth.transaksi_remember_tokens CASCADE;
DROP TABLE IF EXISTS auth.master_admin CASCADE;
DROP TABLE IF EXISTS auth.master_akunpengguna CASCADE;
