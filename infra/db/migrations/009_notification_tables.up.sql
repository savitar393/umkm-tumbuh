-- +goose Up

-- Notification and audit tables not produced by the generator, but required by app requirements
-- ============================================================

CREATE TABLE notification.notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_akun_id VARCHAR(30) NOT NULL REFERENCES auth.master_akunpengguna(akun_id) ON DELETE CASCADE ON UPDATE CASCADE,
    actor_akun_id VARCHAR(30) REFERENCES auth.master_akunpengguna(akun_id) ON DELETE SET NULL ON UPDATE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    entity_type VARCHAR(80),
    entity_id VARCHAR(50),
    read_at TIMESTAMPTZ,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notification.email_outbox (
    email_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email CITEXT NOT NULL,
    recipient_akun_id VARCHAR(30) REFERENCES auth.master_akunpengguna(akun_id) ON DELETE SET NULL ON UPDATE CASCADE,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'CANCELLED')),
    retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
    last_error TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
