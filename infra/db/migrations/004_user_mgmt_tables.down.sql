-- +goose Down

DROP TABLE IF EXISTS user_mgmt.transaksi_registrasipengguna CASCADE;
DROP TABLE IF EXISTS user_mgmt.master_mitrabentukdukungan CASCADE;
DROP TABLE IF EXISTS user_mgmt.master_mitrabidangkemitraan CASCADE;
DROP TABLE IF EXISTS user_mgmt.master_mitra CASCADE;
DROP TABLE IF EXISTS user_mgmt.master_produkumkm CASCADE;
DROP TABLE IF EXISTS user_mgmt.master_umkm CASCADE;
DROP TABLE IF EXISTS user_mgmt.master_pelakuumkm CASCADE;
DROP TABLE IF EXISTS user_mgmt.master_lokasi CASCADE;
