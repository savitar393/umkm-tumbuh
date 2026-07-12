CREATE TABLE IF NOT EXISTS partnership.transaksi_pengajuankerjasama_lampiran (
    lampiran_id BIGSERIAL PRIMARY KEY,
    pengajuan_id VARCHAR(32) NOT NULL
        REFERENCES partnership.transaksi_pengajuankerjasama(pengajuan_id)
        ON DELETE CASCADE,
    dokumen_id VARCHAR(32) NOT NULL
        REFERENCES documents.master_dokumen(dokumen_id)
        ON DELETE RESTRICT,
    jenis_lampiran VARCHAR(50) NOT NULL DEFAULT 'LAINNYA',
    nama_file VARCHAR(255),
    urutan INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (pengajuan_id, dokumen_id)
);

CREATE INDEX IF NOT EXISTS idx_pengajuan_lampiran_pengajuan
    ON partnership.transaksi_pengajuankerjasama_lampiran(pengajuan_id);

CREATE INDEX IF NOT EXISTS idx_pengajuan_lampiran_dokumen
    ON partnership.transaksi_pengajuankerjasama_lampiran(dokumen_id);
