-- +goose Down
-- Kebijakan rollback: state alokasi yang pernah dipakai tidak boleh dihapus.
-- Hanya allocator kosong yang belum pernah dipakai boleh dihapus, setelah
-- operator menghentikan/drain REST, SOAP, dan importer serta mengganti kode
-- yang bergantung pada sequence. Konfirmasi eksplisit dalam sesi rollback:
-- SET app.partnership_allocator_retired = 'on';
-- Jika sudah dipakai, pertahankan 033 sampai ada migrasi pengganti yang
-- memindahkan state nomor; rollback otomatis sengaja ditolak.
BEGIN;
SELECT pg_advisory_xact_lock(74103, 33);
LOCK TABLE partnership.transaksi_pengajuankerjasama IN SHARE ROW EXCLUSIVE MODE;
-- +goose StatementBegin
DO $$
BEGIN
    IF to_regclass('partnership.application_number_seq') IS NULL THEN
        RETURN;
    END IF;
    IF current_setting('app.partnership_allocator_retired', true) IS DISTINCT FROM 'on' THEN
        RAISE EXCEPTION 'Rollback 033 ditolak: hentikan/drain penulis, ganti kode allocator, lalu konfirmasi app.partnership_allocator_retired=on';
    END IF;
    IF EXISTS (SELECT 1 FROM partnership.transaksi_pengajuankerjasama)
       OR (SELECT is_called OR last_value <> 1 FROM partnership.application_number_seq) THEN
        RAISE EXCEPTION 'Rollback 033 ditolak: state allocator sudah dipakai atau data kemitraan masih ada; pertahankan sequence sampai state dimigrasikan';
    END IF;
    DROP SEQUENCE partnership.application_number_seq;
END;
$$;
-- +goose StatementEnd
COMMIT;
