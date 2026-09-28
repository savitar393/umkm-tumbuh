-- Alokasi nomor bersama untuk proses REST dan SOAP tanpa mengubah ID lama.
BEGIN;
SELECT pg_advisory_xact_lock(74103, 33);
LOCK TABLE partnership.transaksi_pengajuankerjasama IN SHARE ROW EXCLUSIVE MODE;
CREATE SEQUENCE IF NOT EXISTS partnership.application_number_seq;
SELECT setval('partnership.application_number_seq', GREATEST(
    COALESCE((SELECT MAX(substring(pengajuan_id FROM '^PGJ([0-9]+)$')::bigint)
              FROM partnership.transaksi_pengajuankerjasama), 0) + 1,
    COALESCE((SELECT MAX(substring(kode_pengajuan FROM '^PKS-[0-9]{4}-([0-9]+)$')::bigint)
              FROM partnership.transaksi_pengajuankerjasama), 0) + 1,
    (SELECT last_value + CASE WHEN is_called THEN 1 ELSE 0 END
     FROM partnership.application_number_seq)
), false);
COMMIT;
