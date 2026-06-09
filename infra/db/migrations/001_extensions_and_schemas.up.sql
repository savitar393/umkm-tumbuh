-- +goose Up

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS app_private;
CREATE SCHEMA IF NOT EXISTS ref;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS user_mgmt;
CREATE SCHEMA IF NOT EXISTS document;
CREATE SCHEMA IF NOT EXISTS training;
CREATE SCHEMA IF NOT EXISTS partnership;
CREATE SCHEMA IF NOT EXISTS dashboard;
CREATE SCHEMA IF NOT EXISTS notification;
CREATE SCHEMA IF NOT EXISTS audit;

COMMENT ON SCHEMA ref IS 'Reference and time dimension data shared by all services.';
COMMENT ON SCHEMA auth IS 'Owned by auth-service: accounts, admins, session/remember-token, verification/reset-token, revoked JWT support.';
COMMENT ON SCHEMA user_mgmt IS 'Owned by user-service: locations, UMKM owners, UMKM profiles, products, mitra profiles, registration review lifecycle.';
COMMENT ON SCHEMA document IS 'Owned by document-service: object storage metadata for Garage/S3 files.';
COMMENT ON SCHEMA training IS 'Owned by training-service: programs, modules, file-upload assignments, enrollments, submissions, certificates.';
COMMENT ON SCHEMA partnership IS 'Owned by partnership-service: UMKM-Mitra partnership request lifecycle.';
COMMENT ON SCHEMA dashboard IS 'Owned by dashboard-service: monitoring facts and reporting views.';
COMMENT ON SCHEMA notification IS 'Owned by notification-service: in-app notifications and email outbox.';
COMMENT ON SCHEMA audit IS 'Owned by audit/logging concern: immutable activity trail.';

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION app_private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
-- +goose StatementEnd

-- ============================================================
