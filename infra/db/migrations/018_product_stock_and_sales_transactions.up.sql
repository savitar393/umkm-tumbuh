-- +goose Up

-- ============================================================
-- Product stock, product image metadata, and sales transaction notes
-- ============================================================

ALTER TABLE user_mgmt.master_produkumkm
ADD COLUMN IF NOT EXISTS stok_saat_ini INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS thumbnail_object_key TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_content_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS thumbnail_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS thumbnail_updated_at TIMESTAMPTZ;

ALTER TABLE user_mgmt.master_produkumkm
ADD CONSTRAINT ck_master_produkumkm_stok_saat_ini
CHECK (stok_saat_ini >= 0);

ALTER TABLE user_mgmt.master_produkumkm
ADD CONSTRAINT ck_master_produkumkm_thumbnail_size
CHECK (thumbnail_size_bytes IS NULL OR thumbnail_size_bytes >= 0);

CREATE TABLE IF NOT EXISTS dashboard.transaksi_penjualan (
    penjualan_id VARCHAR(30) PRIMARY KEY,
    umkm_id VARCHAR(30) NOT NULL
        REFERENCES user_mgmt.master_umkm(umkm_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    tanggal_transaksi DATE NOT NULL,
    nomor_transaksi VARCHAR(50) NOT NULL UNIQUE,

    total_omzet NUMERIC(16,2) NOT NULL DEFAULT 0,
    total_laba NUMERIC(16,2) NOT NULL DEFAULT 0,
    total_item INTEGER NOT NULL DEFAULT 0,

    catatan TEXT,
    status_transaksi VARCHAR(30) NOT NULL DEFAULT 'FINAL',

    created_by_akun_id VARCHAR(30)
        REFERENCES auth.master_akunpengguna(akun_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_transaksi_penjualan_total_omzet
        CHECK (total_omzet >= 0),

    CONSTRAINT ck_transaksi_penjualan_total_laba
        CHECK (total_laba >= 0),

    CONSTRAINT ck_transaksi_penjualan_laba_less_than_omzet
        CHECK (
            total_omzet = 0 AND total_laba = 0
            OR total_laba < total_omzet
        ),

    CONSTRAINT ck_transaksi_penjualan_total_item
        CHECK (total_item >= 0),

    CONSTRAINT ck_transaksi_penjualan_status
        CHECK (status_transaksi IN ('DRAFT', 'FINAL', 'CANCELLED'))
);

CREATE TABLE IF NOT EXISTS dashboard.transaksi_penjualan_item (
    penjualan_item_id VARCHAR(30) PRIMARY KEY,
    penjualan_id VARCHAR(30) NOT NULL
        REFERENCES dashboard.transaksi_penjualan(penjualan_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    produk_id VARCHAR(30) NOT NULL
        REFERENCES user_mgmt.master_produkumkm(produk_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    nama_produk_snapshot VARCHAR(150) NOT NULL,
    harga_satuan_snapshot NUMERIC(14,2) NOT NULL,
    jumlah INTEGER NOT NULL,
    subtotal NUMERIC(16,2)
        GENERATED ALWAYS AS (harga_satuan_snapshot * jumlah) STORED,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_transaksi_penjualan_item_harga
        CHECK (harga_satuan_snapshot >= 0),

    CONSTRAINT ck_transaksi_penjualan_item_jumlah
        CHECK (jumlah > 0)
);

CREATE TABLE IF NOT EXISTS user_mgmt.transaksi_stokproduk (
    stok_mutasi_id VARCHAR(30) PRIMARY KEY,

    produk_id VARCHAR(30) NOT NULL
        REFERENCES user_mgmt.master_produkumkm(produk_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    umkm_id VARCHAR(30) NOT NULL
        REFERENCES user_mgmt.master_umkm(umkm_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    tipe_mutasi VARCHAR(30) NOT NULL,
    jumlah_perubahan INTEGER NOT NULL,
    stok_sebelum INTEGER NOT NULL,
    stok_sesudah INTEGER NOT NULL,

    referensi_tipe VARCHAR(50),
    referensi_id VARCHAR(30),
    catatan TEXT,

    created_by_akun_id VARCHAR(30)
        REFERENCES auth.master_akunpengguna(akun_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_transaksi_stokproduk_tipe
        CHECK (tipe_mutasi IN ('RESTOCK', 'SALE', 'ADJUSTMENT', 'CANCEL_SALE')),

    CONSTRAINT ck_transaksi_stokproduk_stok
        CHECK (stok_sebelum >= 0 AND stok_sesudah >= 0),

    CONSTRAINT ck_transaksi_stokproduk_jumlah_perubahan
        CHECK (jumlah_perubahan <> 0)
);

CREATE INDEX IF NOT EXISTS idx_master_produkumkm_umkm_status
ON user_mgmt.master_produkumkm(umkm_id, status_produk)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_transaksi_penjualan_umkm_tanggal
ON dashboard.transaksi_penjualan(umkm_id, tanggal_transaksi);

CREATE INDEX IF NOT EXISTS idx_transaksi_penjualan_status
ON dashboard.transaksi_penjualan(status_transaksi);

CREATE INDEX IF NOT EXISTS idx_transaksi_penjualan_item_penjualan
ON dashboard.transaksi_penjualan_item(penjualan_id);

CREATE INDEX IF NOT EXISTS idx_transaksi_penjualan_item_produk
ON dashboard.transaksi_penjualan_item(produk_id);

CREATE INDEX IF NOT EXISTS idx_transaksi_stokproduk_produk_created
ON user_mgmt.transaksi_stokproduk(produk_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transaksi_stokproduk_umkm_created
ON user_mgmt.transaksi_stokproduk(umkm_id, created_at DESC);

-- ============================================================
