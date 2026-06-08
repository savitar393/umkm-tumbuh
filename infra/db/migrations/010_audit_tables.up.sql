-- +goose Up

CREATE TABLE audit.audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_akun_id VARCHAR(30) REFERENCES auth.master_akunpengguna(akun_id) ON DELETE SET NULL ON UPDATE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_schema VARCHAR(80),
    entity_table VARCHAR(80),
    entity_id VARCHAR(80),
    ip_address INET,
    user_agent TEXT,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
