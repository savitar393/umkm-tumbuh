-- +goose Up
CREATE TABLE IF NOT EXISTS user_service.documents (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
    status VARCHAR(20) NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'VERIFIED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON user_service.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON user_service.documents(document_type);

-- +goose Down
DROP TABLE IF EXISTS user_service.documents;
