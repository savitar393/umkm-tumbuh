-- +goose Up

-- Keep the legacy FK and its values intact. The two document tables have
-- independent ID namespaces, so a current upload needs its own typed reference.
ALTER TABLE partnership.transaksi_pengajuankerjasama
    ADD COLUMN IF NOT EXISTS dokumen_kontrak_id VARCHAR(64)
    REFERENCES documents.master_dokumen(dokumen_id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pengajuan_dokumen_kontrak
    ON partnership.transaksi_pengajuankerjasama(dokumen_kontrak_id)
    WHERE dokumen_kontrak_id IS NOT NULL;
