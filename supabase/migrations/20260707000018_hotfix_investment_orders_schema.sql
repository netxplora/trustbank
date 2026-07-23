-- ============================================================
-- Hotfix: Add missing columns to investment tables
-- ============================================================

ALTER TABLE public.investment_orders 
  ADD COLUMN IF NOT EXISTS execution_price NUMERIC;

ALTER TABLE public.investment_holdings
  ADD COLUMN IF NOT EXISTS asset_class TEXT DEFAULT 'stock' CHECK (asset_class IN ('stock', 'etf', 'bond', 'mutual_fund', 'crypto'));

-- Also ensure any other columns exist, just in case phase 6 created an incomplete schema:
ALTER TABLE public.investment_orders
  ADD COLUMN IF NOT EXISTS limit_price NUMERIC;

ALTER TABLE public.investment_holdings
  ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Unknown Asset';
