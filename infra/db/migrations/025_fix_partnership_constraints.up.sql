-- +goose Up

-- Make umkm_id and mitra_id nullable since partnership can be initiated
-- by users who haven't completed their business profile
ALTER TABLE partnership.transaksi_pengajuankerjasama
    ALTER COLUMN umkm_id DROP NOT NULL,
    ALTER COLUMN mitra_id DROP NOT NULL;

-- Drop the problematic ck_pengajuan_doc constraint that prevents rejecting
-- after document upload. The constraint enforced:
--   tanggal_upload_dokumen IS NULL OR tanggal_keputusan IS NULL OR tanggal_upload_dokumen >= tanggal_keputusan
-- This breaks the flow where sign (upload) happens before decision (approve/reject).
ALTER TABLE partnership.transaksi_pengajuankerjasama
    DROP CONSTRAINT IF EXISTS ck_pengajuan_doc;
