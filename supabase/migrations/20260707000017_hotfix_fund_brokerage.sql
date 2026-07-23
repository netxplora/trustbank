-- ============================================================
-- Hotfix: Fix Brokerage Funding Deduction
-- ============================================================

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
