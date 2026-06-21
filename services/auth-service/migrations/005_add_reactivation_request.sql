-- +goose Up
ALTER TABLE users ADD COLUMN IF NOT EXISTS reactivation_requested_at TIMESTAMPTZ;

-- +goose Down
ALTER TABLE users DROP COLUMN IF EXISTS reactivation_requested_at;
