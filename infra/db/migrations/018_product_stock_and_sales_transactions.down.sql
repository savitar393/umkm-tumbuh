-- +goose Down

DROP INDEX IF EXISTS user_mgmt.idx_transaksi_stokproduk_umkm_created;
DROP INDEX IF EXISTS user_mgmt.idx_transaksi_stokproduk_produk_created;
DROP INDEX IF EXISTS dashboard.idx_transaksi_penjualan_item_produk;
DROP INDEX IF EXISTS dashboard.idx_transaksi_penjualan_item_penjualan;
DROP INDEX IF EXISTS dashboard.idx_transaksi_penjualan_status;
DROP INDEX IF EXISTS dashboard.idx_transaksi_penjualan_umkm_tanggal;
DROP INDEX IF EXISTS user_mgmt.idx_master_produkumkm_umkm_status;

DROP TABLE IF EXISTS user_mgmt.transaksi_stokproduk;
DROP TABLE IF EXISTS dashboard.transaksi_penjualan_item;
DROP TABLE IF EXISTS dashboard.transaksi_penjualan;

ALTER TABLE user_mgmt.master_produkumkm
DROP CONSTRAINT IF EXISTS ck_master_produkumkm_thumbnail_size;

ALTER TABLE user_mgmt.master_produkumkm
DROP CONSTRAINT IF EXISTS ck_master_produkumkm_stok_saat_ini;

ALTER TABLE user_mgmt.master_produkumkm
DROP COLUMN IF EXISTS thumbnail_updated_at,
DROP COLUMN IF EXISTS thumbnail_size_bytes,
DROP COLUMN IF EXISTS thumbnail_content_type,
DROP COLUMN IF EXISTS thumbnail_url,
DROP COLUMN IF EXISTS thumbnail_object_key,
DROP COLUMN IF EXISTS stok_saat_ini;
