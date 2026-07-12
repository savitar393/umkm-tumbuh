ALTER TABLE auth.master_akunpengguna
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ NULL;

-- Backfill existing local/dev accounts so old seeded accounts and test accounts do not break.
UPDATE auth.master_akunpengguna
SET email_verified_at = COALESCE(email_verified_at, NOW())
WHERE email_verified_at IS NULL;
