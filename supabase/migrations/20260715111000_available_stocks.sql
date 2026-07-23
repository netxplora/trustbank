-- ============================================================
-- Migration: Available Stocks Catalog
-- Description: Creates a platform-wide stock catalog that admin
--              can manage via CRUD. Replaces hardcoded SYMBOLS_LIST.
-- ============================================================

-- 1. Create the available_stocks table
CREATE TABLE IF NOT EXISTS public.available_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  asset_class TEXT NOT NULL CHECK (asset_class IN ('stock', 'etf', 'bond', 'mutual_fund')),
  current_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Seed with default stocks (matching the previous hardcoded list)
INSERT INTO public.available_stocks (symbol, name, asset_class, current_price) VALUES
  ('AAPL', 'Apple Inc.', 'stock', 185.20),
  ('MSFT', 'Microsoft Corp.', 'stock', 420.50),
  ('GOOGL', 'Alphabet Inc.', 'stock', 175.80),
  ('AMZN', 'Amazon.com Inc.', 'stock', 182.10),
  ('SPY', 'SPDR S&P 500 ETF Trust', 'etf', 510.30),
  ('QQQ', 'Invesco QQQ Trust', 'etf', 435.60),
  ('BND', 'Vanguard Total Bond Market ETF', 'bond', 72.40)
ON CONFLICT (symbol) DO NOTHING;

-- 3. RLS Policies
ALTER TABLE public.available_stocks ENABLE ROW LEVEL SECURITY;

-- Admin full access
DROP POLICY IF EXISTS "Admins have full access to available_stocks" ON public.available_stocks;
CREATE POLICY "Admins have full access to available_stocks"
ON public.available_stocks FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Authenticated users can read active stocks
DROP POLICY IF EXISTS "Authenticated users can view active stocks" ON public.available_stocks;
CREATE POLICY "Authenticated users can view active stocks"
ON public.available_stocks FOR SELECT
USING (
  auth.role() = 'authenticated' AND is_active = true
);
