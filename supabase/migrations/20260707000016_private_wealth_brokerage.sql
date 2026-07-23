-- ============================================================
-- Phase 20: Private Wealth & Brokerage Integration
-- ============================================================

-- 1. Create investment_holdings table
CREATE TABLE IF NOT EXISTS public.investment_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.investment_accounts(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity >= 0),
  avg_cost NUMERIC NOT NULL,
  asset_class TEXT NOT NULL CHECK (asset_class IN ('stock', 'etf', 'bond', 'mutual_fund', 'crypto')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, symbol)
);
ALTER TABLE public.investment_holdings ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_investment_holdings_updated_at ON public.investment_holdings;
CREATE TRIGGER update_investment_holdings_updated_at BEFORE UPDATE ON public.investment_holdings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create investment_orders table
CREATE TABLE IF NOT EXISTS public.investment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.investment_accounts(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit')),
  limit_price NUMERIC,
  execution_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investment_orders ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_investment_orders_updated_at ON public.investment_orders;
CREATE TRIGGER update_investment_orders_updated_at BEFORE UPDATE ON public.investment_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
DROP POLICY IF EXISTS "User View Own Holdings" ON public.investment_holdings;
CREATE POLICY "User View Own Holdings" ON public.investment_holdings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.investment_accounts a WHERE a.id = account_id AND a.user_id = auth.uid()));

DROP POLICY IF EXISTS "User View Own Orders" ON public.investment_orders;
CREATE POLICY "User View Own Orders" ON public.investment_orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.investment_accounts a WHERE a.id = account_id AND a.user_id = auth.uid()));

DROP POLICY IF EXISTS "User Insert Own Orders" ON public.investment_orders;
CREATE POLICY "User Insert Own Orders" ON public.investment_orders FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.investment_accounts a WHERE a.id = account_id AND a.user_id = auth.uid()));


-- 3. RPC: Fund Brokerage Account (Move cash from checking to brokerage)
CREATE OR REPLACE FUNCTION public.fund_brokerage_account(
  p_user_id UUID,
  p_checking_account_id UUID,
  p_brokerage_account_id UUID,
  p_amount NUMERIC
) RETURNS JSON AS $$
DECLARE
  v_checking_balance NUMERIC;
  v_reference TEXT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Funding amount must be greater than zero';
  END IF;

  SELECT balance INTO v_checking_balance FROM public.accounts WHERE id = p_checking_account_id AND user_id = p_user_id AND status = 'active';
  IF v_checking_balance IS NULL THEN
    RAISE EXCEPTION 'Source checking account not found or inactive';
  END IF;

  IF v_checking_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds in checking account';
  END IF;

  -- Generate Reference
  v_reference := 'FUND-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

  -- Deduct from Checking explicitly (and use type 'transfer' so the trigger doesn't double deduct)
  UPDATE public.accounts 
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE id = p_checking_account_id;

  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (p_user_id, p_checking_account_id, 'transfer', p_amount, 'Brokerage Funding Transfer', v_reference, 'completed');

  -- Add to Brokerage Cash Balance
  UPDATE public.investment_accounts
  SET cash_balance = cash_balance + p_amount, balance = balance + p_amount, updated_at = NOW()
  WHERE id = p_brokerage_account_id AND user_id = p_user_id;

  RETURN json_build_object('success', true, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC: Process Trade (Market Order Execution Simulation)
CREATE OR REPLACE FUNCTION public.process_trade(
  p_user_id UUID,
  p_account_id UUID,
  p_symbol TEXT,
  p_asset_name TEXT,
  p_side TEXT,
  p_quantity NUMERIC,
  p_current_price NUMERIC,
  p_asset_class TEXT
) RETURNS JSON AS $$
DECLARE
  v_cash_balance NUMERIC;
  v_total_cost NUMERIC;
  v_holding_qty NUMERIC;
  v_holding_avg NUMERIC;
  v_order_id UUID;
  v_commission NUMERIC := 1.99;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Order quantity must be greater than zero';
  END IF;

  -- Ensure Private Wealth free trades for Tier 3
  IF (SELECT kyc_tier FROM public.profiles WHERE user_id = p_user_id) = 3 THEN
    v_commission := 0;
  END IF;

  v_total_cost := (p_quantity * p_current_price) + v_commission;

  -- 1. Check Cash Balance for BUYS
  SELECT cash_balance INTO v_cash_balance FROM public.investment_accounts WHERE id = p_account_id AND user_id = p_user_id AND status = 'active';
  IF v_cash_balance IS NULL THEN
    RAISE EXCEPTION 'Brokerage account not found or inactive';
  END IF;

  IF p_side = 'buy' THEN
    IF v_cash_balance < v_total_cost THEN
      RAISE EXCEPTION 'Insufficient cash available to execute trade. Required: $%, Available: $%', v_total_cost, v_cash_balance;
    END IF;

    -- Update Cash Balance
    UPDATE public.investment_accounts 
    SET cash_balance = cash_balance - v_total_cost, updated_at = NOW()
    WHERE id = p_account_id;

    -- Update or Insert Holding
    SELECT quantity, avg_cost INTO v_holding_qty, v_holding_avg FROM public.investment_holdings WHERE account_id = p_account_id AND symbol = p_symbol;
    IF FOUND THEN
      UPDATE public.investment_holdings
      SET avg_cost = ((v_holding_qty * v_holding_avg) + (p_quantity * p_current_price)) / (v_holding_qty + p_quantity),
          quantity = v_holding_qty + p_quantity,
          updated_at = NOW()
      WHERE account_id = p_account_id AND symbol = p_symbol;
    ELSE
      INSERT INTO public.investment_holdings (account_id, symbol, name, quantity, avg_cost, asset_class)
      VALUES (p_account_id, p_symbol, p_asset_name, p_quantity, p_current_price, p_asset_class);
    END IF;

  ELSIF p_side = 'sell' THEN
    -- Verify Holding for SELLS
    SELECT quantity INTO v_holding_qty FROM public.investment_holdings WHERE account_id = p_account_id AND symbol = p_symbol;
    IF v_holding_qty IS NULL OR v_holding_qty < p_quantity THEN
      RAISE EXCEPTION 'Insufficient share quantity to execute sell order.';
    END IF;

    -- Update Cash Balance (Add proceeds, minus commission)
    v_total_cost := (p_quantity * p_current_price) - v_commission;
    UPDATE public.investment_accounts 
    SET cash_balance = cash_balance + v_total_cost, updated_at = NOW()
    WHERE id = p_account_id;

    -- Update Holding
    IF v_holding_qty = p_quantity THEN
      DELETE FROM public.investment_holdings WHERE account_id = p_account_id AND symbol = p_symbol;
    ELSE
      UPDATE public.investment_holdings
      SET quantity = quantity - p_quantity, updated_at = NOW()
      WHERE account_id = p_account_id AND symbol = p_symbol;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid order side';
  END IF;

  -- 2. Record Order
  INSERT INTO public.investment_orders (account_id, symbol, side, quantity, order_type, execution_price, status)
  VALUES (p_account_id, p_symbol, p_side, p_quantity, 'market', p_current_price, 'filled')
  RETURNING id INTO v_order_id;

  -- 3. Log Commission (Optional integration with bank_portfolio)
  IF v_commission > 0 THEN
    UPDATE public.bank_portfolio 
    SET total_fees_collected = total_fees_collected + v_commission, updated_at = NOW()
    WHERE id = (SELECT id FROM public.bank_portfolio LIMIT 1);
  END IF;

  RETURN json_build_object('success', true, 'order_id', v_order_id, 'execution_price', p_current_price);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
