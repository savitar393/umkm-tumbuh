-- +goose Down

ALTER TABLE partnership.transaksi_pengajuankerjasama
    ALTER COLUMN umkm_id SET NOT NULL,
    ALTER COLUMN mitra_id SET NOT NULL;

ALTER TABLE partnership.transaksi_pengajuankerjasama
    ADD CONSTRAINT ck_pengajuan_doc CHECK (tanggal_upload_dokumen IS NULL OR tanggal_keputusan IS NULL OR tanggal_upload_dokumen >= tanggal_keputusan);
