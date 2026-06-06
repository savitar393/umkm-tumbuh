-- +goose Up
CREATE SCHEMA IF NOT EXISTS user_service;

CREATE TABLE IF NOT EXISTS user_service.umkm_profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    business_name VARCHAR(150) NOT NULL,
    business_category VARCHAR(100),
    business_description TEXT,
    owner_name VARCHAR(150),
    phone_number VARCHAR(30),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_service.mitra_profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    organization_name VARCHAR(150) NOT NULL,
    organization_type VARCHAR(100),
    description TEXT,
    contact_person VARCHAR(150),
    phone_number VARCHAR(30),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_service.products (
    id UUID PRIMARY KEY,
    umkm_profile_id UUID NOT NULL REFERENCES user_service.umkm_profiles(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(14, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_umkm_profile_id
ON user_service.products(umkm_profile_id);

-- +goose Down
DROP TABLE IF EXISTS user_service.products;
DROP TABLE IF EXISTS user_service.mitra_profiles;
DROP TABLE IF EXISTS user_service.umkm_profiles;
DROP SCHEMA IF EXISTS user_service;