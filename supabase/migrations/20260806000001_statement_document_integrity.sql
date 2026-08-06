-- Migration: Add document integrity columns to account_statements
-- Allows re-generated PDFs to preserve original reference/verification codes

ALTER TABLE public.account_statements
  ADD COLUMN IF NOT EXISTS reference_number TEXT,
  ADD COLUMN IF NOT EXISTS verification_code TEXT;

-- Index for fast lookup by verification code
CREATE INDEX IF NOT EXISTS idx_account_statements_verification_code
  ON public.account_statements (verification_code)
  WHERE verification_code IS NOT NULL;
