-- Fix dokumen_evaluasi_id: VARCHAR(30) -> VARCHAR(64), retarget FK to documents.master_dokumen

ALTER TABLE training.transaksi_pendaftaranpelatihan
DROP CONSTRAINT IF EXISTS transaksi_pendaftaranpelatihan_dokumen_evaluasi_id_fkey;

ALTER TABLE training.transaksi_pendaftaranpelatihan
ALTER COLUMN dokumen_evaluasi_id TYPE VARCHAR(64);

ALTER TABLE training.transaksi_pendaftaranpelatihan
ADD CONSTRAINT fk_dokumen_evaluasi
FOREIGN KEY (dokumen_evaluasi_id)
REFERENCES documents.master_dokumen(dokumen_id)
ON DELETE SET NULL ON UPDATE CASCADE;
