-- +goose Up
ALTER TABLE user_service.umkm_profiles ADD COLUMN IF NOT EXISTS omzet NUMERIC(14,2) DEFAULT 0;
ALTER TABLE user_service.products ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- +goose Down
ALTER TABLE user_service.products DROP COLUMN category;
ALTER TABLE user_service.umkm_profiles DROP COLUMN omzet;
