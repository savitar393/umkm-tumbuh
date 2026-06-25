ALTER TABLE user_mgmt.master_produkumkm
ADD COLUMN IF NOT EXISTS tampil_di_profil BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS urutan_tampil_profil INTEGER,
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_master_produkumkm_tampil_di_profil
ON user_mgmt.master_produkumkm (
  umkm_id,
  urutan_tampil_profil,
  featured_at DESC,
  updated_at DESC
)
WHERE tampil_di_profil = TRUE
  AND is_deleted = FALSE;