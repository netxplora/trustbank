-- ============================================================
-- Migration: Crypto Ledger, Quotes, Exchange Rates, Conversion Fees
-- ============================================================

-- 1. Crypto Exchange Rates (backend rate snapshots)
CREATE TABLE IF NOT EXISTS public.crypto_exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_symbol VARCHAR(10) NOT NULL,
  rate_usd NUMERIC(20, 8) NOT NULL CHECK (rate_usd > 0),
  source TEXT NOT NULL DEFAULT 'coingecko',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(asset_symbol, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_crypto_rates_symbol_time ON public.crypto_exchange_rates(asset_symbol, recorded_at DESC);

ALTER TABLE public.crypto_exchange_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view rates" ON public.crypto_exchange_rates;
CREATE POLICY "Authenticated users can view rates" ON public.crypto_exchange_rates
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage rates" ON public.crypto_exchange_rates;
CREATE POLICY "Admins can manage rates" ON public.crypto_exchange_rates
  FOR ALL USING (public.is_admin(auth.uid()));

-- Allow service role (edge functions) to insert rates
DROP POLICY IF EXISTS "Service role can insert rates" ON public.crypto_exchange_rates;
CREATE POLICY "Service role can insert rates" ON public.crypto_exchange_rates
  FOR INSERT WITH CHECK (true);

-- Seed fallback rates (will be overwritten by live data)
INSERT INTO public.crypto_exchange_rates (asset_symbol, rate_usd, source)
VALUES
  ('BTC',  64250.00, 'seed_fallback'),
  ('ETH',   3480.50, 'seed_fallback'),
  ('USDT',     1.00, 'seed_fallback'),
  ('USDC',     1.00, 'seed_fallback'),
  ('SOL',    148.20, 'seed_fallback')
ON CONFLICT DO NOTHING;

-- 2. Crypto Conversion Fees (replaces swap_fee_settings for conversion-specific rules)
CREATE TABLE IF NOT EXISTS public.crypto_conversion_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversion_type TEXT NOT NULL UNIQUE, -- 'fiat_to_crypto' | 'crypto_to_fiat' | 'crypto_to_crypto'
  flat_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (flat_fee >= 0),
  percentage_fee NUMERIC(5, 4) NOT NULL DEFAULT 0.005 CHECK (percentage_fee >= 0), -- stored as decimal, e.g. 0.005 = 0.5%
  min_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.50,
  max_fee NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
  min_conversion_usd NUMERIC(15, 2) NOT NULL DEFAULT 5.00,
  max_conversion_usd NUMERIC(15, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crypto_conversion_fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view crypto fees" ON public.crypto_conversion_fees;
CREATE POLICY "Authenticated users can view crypto fees" ON public.crypto_conversion_fees
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage crypto fees" ON public.crypto_conversion_fees;
CREATE POLICY "Admins can manage crypto fees" ON public.crypto_conversion_fees
  FOR ALL USING (public.is_admin(auth.uid()));

-- Seed defaults
INSERT INTO public.crypto_conversion_fees (conversion_type, flat_fee, percentage_fee, min_fee, max_fee, min_conversion_usd)
VALUES
  ('fiat_to_crypto',    1.50, 0.005, 0.50, 50.00, 5.00),
  ('crypto_to_fiat',    1.50, 0.005, 0.50, 50.00, 5.00),
  ('crypto_to_crypto',  0.00, 0.003, 0.50, 30.00, 5.00)
ON CONFLICT (conversion_type) DO NOTHING;

-- 3. Crypto Quotes (locked quotes with expiry)
CREATE TABLE IF NOT EXISTS public.crypto_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversion_type TEXT NOT NULL, -- 'fiat_to_crypto' | 'crypto_to_fiat' | 'crypto_to_crypto'
  from_asset TEXT NOT NULL,      -- 'USD', 'BTC', 'ETH', etc.
  to_asset TEXT NOT NULL,
  from_amount NUMERIC(20, 8) NOT NULL,
  to_amount NUMERIC(20, 8) NOT NULL,
  rate_usd NUMERIC(20, 8) NOT NULL,    -- USD rate of the from_asset at quote time
  to_rate_usd NUMERIC(20, 8),          -- USD rate of to_asset (for crypto-to-crypto)
  fee_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
  fee_asset_amount NUMERIC(20, 8),     -- fee expressed in the from_asset
  from_account_id UUID REFERENCES public.accounts(id), -- populated for fiat sources
  to_account_id UUID REFERENCES public.accounts(id),   -- populated for fiat destinations
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crypto_quotes_user ON public.crypto_quotes(user_id, status, expires_at);

ALTER TABLE public.crypto_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quotes" ON public.crypto_quotes;
CREATE POLICY "Users can view own quotes" ON public.crypto_quotes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all quotes" ON public.crypto_quotes;
CREATE POLICY "Admins can view all quotes" ON public.crypto_quotes
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 4. Crypto Ledger Entries (full audit trail for holdings)
CREATE TABLE IF NOT EXISTS public.crypto_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_symbol TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'deposit', 'withdrawal', 'conversion_in', 'conversion_out',
    'fee', 'transfer_in', 'transfer_out', 'adjustment'
  )),
  quantity NUMERIC(20, 8) NOT NULL,         -- signed: positive = credit, negative = debit
  balance_after NUMERIC(20, 8) NOT NULL,
  rate_usd NUMERIC(20, 8),                  -- rate at time of entry
  value_usd NUMERIC(15, 2),                 -- USD equivalent at time of entry
  reference TEXT,
  quote_id UUID REFERENCES public.crypto_quotes(id),
  related_fiat_tx_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_user ON public.crypto_ledger_entries(user_id, asset_symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON public.crypto_ledger_entries(reference);

ALTER TABLE public.crypto_ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ledger" ON public.crypto_ledger_entries;
CREATE POLICY "Users can view own ledger" ON public.crypto_ledger_entries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all ledger entries" ON public.crypto_ledger_entries;
CREATE POLICY "Admins can view all ledger entries" ON public.crypto_ledger_entries
  FOR SELECT USING (public.is_admin(auth.uid()));
