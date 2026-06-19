CREATE SCHEMA IF NOT EXISTS documents;

CREATE TABLE IF NOT EXISTS documents.master_dokumen (
    dokumen_id VARCHAR(64) PRIMARY KEY,
    uploader_akun_id VARCHAR(64) NOT NULL,
    uploader_role VARCHAR(20) NOT NULL CHECK (uploader_role IN ('ADMIN', 'UMKM', 'MITRA')),
    kategori_dokumen VARCHAR(50) NOT NULL CHECK (
        kategori_dokumen IN (
            'GENERAL_DOCUMENT',
            'PRODUCT_IMAGE',
            'CERTIFICATE',
            'PARTNERSHIP_FILE'
        )
    ),
    bucket_name VARCHAR(100) NOT NULL,
    object_key TEXT NOT NULL UNIQUE,
    original_filename TEXT NOT NULL,
    content_type VARCHAR(150) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
    public_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'DIHAPUS')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_master_dokumen_uploader
    ON documents.master_dokumen(uploader_akun_id);

CREATE INDEX IF NOT EXISTS idx_master_dokumen_kategori
    ON documents.master_dokumen(kategori_dokumen);

CREATE INDEX IF NOT EXISTS idx_master_dokumen_status
    ON documents.master_dokumen(status);

CREATE OR REPLACE FUNCTION documents.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'trg_master_dokumen_updated_at'
          AND n.nspname = 'documents'
          AND c.relname = 'master_dokumen'
          AND NOT t.tgisinternal
    ) THEN
        DROP TRIGGER trg_master_dokumen_updated_at ON documents.master_dokumen;
    END IF;
END $$;

CREATE TRIGGER trg_master_dokumen_updated_at
BEFORE UPDATE ON documents.master_dokumen
FOR EACH ROW
EXECUTE FUNCTION documents.set_updated_at();
