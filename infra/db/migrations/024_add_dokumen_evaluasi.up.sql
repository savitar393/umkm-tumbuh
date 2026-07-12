ALTER TABLE training.transaksi_pendaftaranpelatihan
ADD COLUMN dokumen_evaluasi_id VARCHAR(30) REFERENCES document.transaksi_dokumenterunggah(dokumen_id) ON DELETE SET NULL ON UPDATE CASCADE;
