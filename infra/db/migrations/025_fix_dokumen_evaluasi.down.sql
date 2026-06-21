-- Revert: restore VARCHAR(30) + old FK to document.transaksi_dokumenterunggah

ALTER TABLE training.transaksi_pendaftaranpelatihan
DROP CONSTRAINT IF EXISTS fk_dokumen_evaluasi;

ALTER TABLE training.transaksi_pendaftaranpelatihan
ALTER COLUMN dokumen_evaluasi_id TYPE VARCHAR(30);

ALTER TABLE training.transaksi_pendaftaranpelatihan
ADD CONSTRAINT transaksi_pendaftaranpelatihan_dokumen_evaluasi_id_fkey
FOREIGN KEY (dokumen_evaluasi_id)
REFERENCES document.transaksi_dokumenterunggah(dokumen_id)
ON DELETE SET NULL ON UPDATE CASCADE;
