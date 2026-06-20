-- +goose Down

DROP VIEW IF EXISTS training.v_user_certificate_dashboard CASCADE;
DROP VIEW IF EXISTS training.v_certificate_details CASCADE;

-- ============================================================
