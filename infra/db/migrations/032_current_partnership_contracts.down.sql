-- +goose Down

-- Refuse to discard contract references created since this migration.
-- +goose StatementBegin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM partnership.transaksi_pengajuankerjasama
        WHERE dokumen_kontrak_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Current contract references exist; retain migration 032 or migrate these references before rollback';
    END IF;
END;
$$;
-- +goose StatementEnd

ALTER TABLE partnership.transaksi_pengajuankerjasama
    DROP COLUMN IF EXISTS dokumen_kontrak_id;
