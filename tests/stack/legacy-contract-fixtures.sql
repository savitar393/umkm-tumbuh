\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
    uploaded documents.master_dokumen%ROWTYPE;
BEGIN
    IF current_database() <> 'umkm_tumbuh_test' THEN
        RAISE EXCEPTION 'Fixtures require the isolated umkm_tumbuh_test database';
    END IF;

    -- Reuse bytes uploaded to real Garage storage by stack-check prepare.
    SELECT * INTO STRICT uploaded FROM documents.master_dokumen
    WHERE uploader_akun_id = 'TEST_UMKM_A' AND original_filename = 'stage1.txt'
      AND kategori_dokumen = 'GENERAL_DOCUMENT' AND status = 'AKTIF'
    ORDER BY created_at DESC LIMIT 1;

    UPDATE document.transaksi_dokumenterunggah
    SET bucket_name = uploaded.bucket_name, object_key = uploaded.object_key,
        original_file_name = uploaded.original_filename, stored_file_name = uploaded.original_filename,
        storage_path = uploaded.object_key, file_extension = 'txt',
        mime_type = uploaded.content_type, file_size_bytes = uploaded.size_bytes,
        checksum_sha256 = encode(digest(E'Stage 1 document: upload, download, and restart.\n', 'sha256'), 'hex')
    WHERE dokumen_id = 'TEST_CONTRACT_A';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Run the base fixtures before the legacy contract fixtures';
    END IF;
END $$;

INSERT INTO partnership.transaksi_pengajuankerjasama
    (pengajuan_id, kode_pengajuan, umkm_id, mitra_id, pengaju_akun_id, penerima_akun_id,
     status_pengajuan_id, pesan_pengajuan, dokumen_perjanjian_id, tanggal_pengajuan, tanggal_upload_dokumen)
SELECT id, id, 'TEST_BUSINESS_A', 'TEST_PARTNER_A', 'TEST_UMKM_A', 'TEST_MITRA_A',
       'DIAJUKAN', 'Pengajuan sintetis dengan kontrak lama untuk pengujian kompatibilitas.',
       'TEST_CONTRACT_A', now(), now()
FROM (VALUES ('TEST_LEGACY_A'), ('TEST_LEGACY_REPLACE')) AS fixtures(id)
ON CONFLICT (pengajuan_id) DO NOTHING;

-- An unrelated current document deliberately has the same ID as the legacy one.
-- Metadata access must not resolve across namespaces. This row needs no S3 bytes.
INSERT INTO documents.master_dokumen
    (dokumen_id, uploader_akun_id, uploader_role, kategori_dokumen, bucket_name,
     object_key, original_filename, content_type, size_bytes)
VALUES ('TEST_CONTRACT_A', 'TEST_UMKM_B', 'UMKM', 'GENERAL_DOCUMENT', 'test-documents',
        'stage3-id-collision', 'unrelated.txt', 'text/plain', 1)
ON CONFLICT (dokumen_id) DO NOTHING;

COMMIT;
