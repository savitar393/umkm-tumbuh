-- +goose Down

-- Keep shared reference data on rollback: these rows may predate this migration
-- and may be referenced by existing partnership requests.
SELECT 1;
