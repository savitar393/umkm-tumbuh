DROP INDEX IF EXISTS user_mgmt.idx_master_produkumkm_tampil_di_profil;

ALTER TABLE user_mgmt.master_produkumkm
DROP COLUMN IF EXISTS featured_at,
DROP COLUMN IF EXISTS urutan_tampil_profil,
DROP COLUMN IF EXISTS tampil_di_profil;