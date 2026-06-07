-- +goose Up

-- Dashboard service table
-- ============================================================

CREATE TABLE dashboard.transaksi_monitoringperkembangan (
    monitoring_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    umkm_id VARCHAR(30) NOT NULL REFERENCES user_mgmt.master_umkm(umkm_id) ON DELETE CASCADE ON UPDATE CASCADE,
    status_perkembangan_id VARCHAR(30) NOT NULL REFERENCES ref.ref_statusperkembangan(status_perkembangan_id) ON UPDATE CASCADE,
    laba_harian NUMERIC(16,2) NOT NULL DEFAULT 0,
    jumlah_produk INTEGER NOT NULL DEFAULT 0 CHECK (jumlah_produk >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
