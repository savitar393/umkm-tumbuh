-- +goose Down

DROP FUNCTION IF EXISTS app_private.set_updated_at() CASCADE;
DROP SCHEMA IF EXISTS app_private CASCADE;
-- Service schemas are dropped in 999_drop_all.down.sql if a full reset is needed.
