-- +goose Down

DROP TABLE IF EXISTS notification.email_outbox CASCADE;
DROP TABLE IF EXISTS notification.notifications CASCADE;
