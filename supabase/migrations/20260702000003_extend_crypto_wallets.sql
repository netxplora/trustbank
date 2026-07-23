
-- ============================================================
-- Extend crypto_wallets with additional management fields
-- ============================================================

ALTER TABLE public.crypto_wallets
ADD COLUMN IF NOT EXISTS wallet_name text,
ADD COLUMN IF NOT EXISTS min_deposit numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS confirmations_required integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS qr_code_url text,
ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;
