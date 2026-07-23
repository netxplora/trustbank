-- ============================================================
-- Migration: Fix execute_order transaction type and constraint
-- Description: Updates the transaction type constraint to include 'investment'
--              and patches the execute_order RPC to use it.
-- ============================================================

-- 1. Ensure all valid transaction types are accepted, adding 'investment'
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS chk_transactions_type;
ALTER TABLE public.transactions ADD CONSTRAINT chk_transactions_type 
CHECK (type IN (
  'deposit', 'withdrawal', 'transfer', 'payment', 'fee', 'credit', 'debit', 
  'refund', 'loan_disbursement', 'loan_repayment', 'investment', 'trade'
));

-- 2. Update execute_order to use 'investment' type instead of 'payment'
CREATE OR REPLACE FUNCTION public.execute_order(order_id UUID, fill_price NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_user_id UUID;
  v_symbol TEXT;
  v_side TEXT;
  v_quantity NUMERIC;
  v_cost NUMERIC;
  v_cash NUMERIC;
  v_holding_id UUID;
  v_holding_quantity NUMERIC;
  v_holding_cost NUMERIC;
  v_asset_class TEXT;
  v_order_status TEXT;
BEGIN
  -- Get order details
  SELECT account_id, symbol, side, quantity, status
  INTO v_account_id, v_symbol, v_side, v_quantity, v_order_status
  FROM public.investment_orders
  WHERE id = order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order_status <> 'pending' THEN
    RAISE EXCEPTION 'Order is not in pending status';
  END IF;

  -- Get account details
  SELECT user_id, cash_balance
  INTO v_user_id, v_cash
  FROM public.investment_accounts
  WHERE id = v_account_id;

  v_cost := v_quantity * fill_price;

  -- Check if symbol is a bond or etf or stock
  IF v_symbol IN ('SHY', 'TLT', 'BND', 'AGG') THEN
    v_asset_class := 'bond';
  ELSIF v_symbol IN ('SPY', 'VOO', 'QQQ', 'IWM', 'VTI') THEN
    v_asset_class := 'etf';
  ELSE
    v_asset_class := 'stock';
  END IF;

  IF v_side = 'buy' THEN
    -- Validate cash
    IF v_cash < v_cost THEN
      RAISE EXCEPTION 'Sufficient cash balance not available';
    END IF;

    -- Update account cash
    UPDATE public.investment_accounts
    SET cash_balance = cash_balance - v_cost,
        balance = balance - v_cost
    WHERE id = v_account_id;

    -- Update or insert holding
    SELECT id, quantity, avg_cost
    INTO v_holding_id, v_holding_quantity, v_holding_cost
    FROM public.investment_holdings
    WHERE account_id = v_account_id AND symbol = v_symbol;

    IF FOUND THEN
      UPDATE public.investment_holdings
      SET quantity = quantity + v_quantity,
          avg_cost = ((v_holding_quantity * v_holding_cost) + v_cost) / (v_holding_quantity + v_quantity),
          current_price = fill_price,
          updated_at = now()
      WHERE id = v_holding_id;
    ELSE
      INSERT INTO public.investment_holdings (account_id, symbol, name, quantity, avg_cost, current_price, asset_class)
      VALUES (v_account_id, v_symbol, v_symbol, v_quantity, fill_price, fill_price, v_asset_class);
    END IF;

  ELSIF v_side = 'sell' THEN
    -- Check holding
    SELECT id, quantity, avg_cost
    INTO v_holding_id, v_holding_quantity, v_holding_cost
    FROM public.investment_holdings
    WHERE account_id = v_account_id AND symbol = v_symbol;

    IF NOT FOUND OR v_holding_quantity < v_quantity THEN
      RAISE EXCEPTION 'Insufficient holdings to execute sell order';
    END IF;

    -- Update account cash
    UPDATE public.investment_accounts
    SET cash_balance = cash_balance + v_cost,
        balance = balance + v_cost
    WHERE id = v_account_id;

    -- Update holding quantity
    IF v_holding_quantity = v_quantity THEN
      DELETE FROM public.investment_holdings WHERE id = v_holding_id;
    ELSE
      UPDATE public.investment_holdings
      SET quantity = quantity - v_quantity,
          current_price = fill_price,
          updated_at = now()
      WHERE id = v_holding_id;
    END IF;

  END IF;

  -- Update order
  UPDATE public.investment_orders
  SET status = 'filled',
      filled_at = now(),
      updated_at = now()
  WHERE id = order_id;

  -- Log transaction using 'investment' type instead of 'payment'
  INSERT INTO public.transactions (user_id, type, amount, description, status)
  VALUES (
    v_user_id,
    'investment',
    v_cost,
    'Investment ' || upper(v_side) || ' - ' || v_symbol,
    'completed'
  );

  RETURN true;
END;
$$;
