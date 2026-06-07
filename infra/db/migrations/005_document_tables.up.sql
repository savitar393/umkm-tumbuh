-- +goose Up

-- Document service table
-- ============================================================

CREATE TABLE document.transaksi_dokumenterunggah (
    dokumen_id VARCHAR(30) PRIMARY KEY,
    jenis_dokumen_id VARCHAR(40) NOT NULL REFERENCES ref.ref_jenisdokumen(jenis_dokumen_id) ON UPDATE CASCADE,
    status_dokumen_id VARCHAR(30) NOT NULL REFERENCES ref.ref_statusdokumen(status_dokumen_id) ON UPDATE CASCADE,
    uploader_akun_id VARCHAR(30) NOT NULL REFERENCES auth.master_akunpengguna(akun_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    owner_type VARCHAR(40) NOT NULL CHECK (owner_type IN ('UMKM', 'MITRA', 'PENGAJUAN_KERJASAMA')),
    owner_id VARCHAR(50) NOT NULL,
    context_type VARCHAR(60) NOT NULL,
    context_id VARCHAR(50),
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    file_extension VARCHAR(20) NOT NULL,
    mime_type VARCHAR(150) NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    bucket_name VARCHAR(100) NOT NULL,
    object_key TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    checksum_sha256 CHAR(64) NOT NULL,
    version_id VARCHAR(100),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 1 CHECK (display_order >= 0),
    caption TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT uq_dokumenterunggah_object_key UNIQUE (bucket_name, object_key),
    CONSTRAINT ck_dokumenterunggah_checksum CHECK (checksum_sha256 ~ '^[a-f0-9]{64}$'),
    CONSTRAINT ck_dokumenterunggah_verify CHECK (verified_at IS NULL OR verified_at >= uploaded_at)
);

-- ============================================================
