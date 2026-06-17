-- +goose Up
CREATE TABLE IF NOT EXISTS partnership_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_code VARCHAR(50) NOT NULL UNIQUE,
    requester_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    requester_role VARCHAR(10) NOT NULL CHECK (requester_role IN ('UMKM', 'MITRA')),
    receiver_role VARCHAR(10) NOT NULL CHECK (receiver_role IN ('UMKM', 'MITRA')),
    category VARCHAR(100) NOT NULL DEFAULT 'default',
    proposal_title VARCHAR(200) NOT NULL,
    proposal_description TEXT NOT NULL,
    business_name VARCHAR(100),
    contact_person VARCHAR(150),
    product_description TEXT,
    reason_for_partnership TEXT,
    nib_ktp_file VARCHAR(255),
    proposal_file VARCHAR(255),
    certificate_file VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' 
        CHECK (status IN ('DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'WAITING_DOCUMENT')),
    rejection_reason TEXT,
    contract_document_id UUID,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ,
    contract_signed_at TIMESTAMPTZ,
    partnership_start DATE,
    partnership_end DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS partnership_requests_request_code_idx ON partnership_requests(request_code);
CREATE INDEX IF NOT EXISTS partnership_requests_requester_id_idx ON partnership_requests(requester_id);
CREATE INDEX IF NOT EXISTS partnership_requests_receiver_id_idx ON partnership_requests(receiver_id);
CREATE INDEX IF NOT EXISTS partnership_requests_status_idx ON partnership_requests(status);
CREATE INDEX IF NOT EXISTS partnership_requests_created_at_idx ON partnership_requests(created_at);

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION partnership_requests_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
-- +goose StatementEnd

CREATE TRIGGER partnership_requests_update_trigger 
    BEFORE UPDATE ON partnership_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION partnership_requests_update_updated_at();

-- +goose Down
DROP TRIGGER IF EXISTS partnership_requests_update_trigger ON partnership_requests;
DROP TABLE IF EXISTS partnership_requests;
DROP FUNCTION IF EXISTS partnership_requests_update_updated_at();