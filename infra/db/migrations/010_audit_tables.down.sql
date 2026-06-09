-- +goose Down

DROP TABLE IF EXISTS audit.audit_logs CASCADE;
