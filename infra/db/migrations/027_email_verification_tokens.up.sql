CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS auth.email_verification_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  akun_id VARCHAR(20) NOT NULL REFERENCES auth.master_akunpengguna(akun_id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_akun_id
  ON auth.email_verification_tokens(akun_id);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at
  ON auth.email_verification_tokens(expires_at);
