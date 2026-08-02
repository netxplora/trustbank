-- ============================================================
-- Add RPC for processing full debt clearance securely
-- ============================================================

CREATE OR REPLACE FUNCTION public.clear_all_debt() RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_account RECORD;
  v_total_debt NUMERIC := 0;
  v_active_loans_count INTEGER := 0;
  v_loan RECORD;
BEGIN
  -- 1. Get the authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Calculate total debt across all active loans
  SELECT COALESCE(SUM(outstanding_balance), 0), COUNT(id)
  INTO v_total_debt, v_active_loans_count
  FROM public.loans
  WHERE user_id = v_user_id AND status IN ('active', 'approved', 'pending') AND outstanding_balance > 0;

  IF v_total_debt <= 0 THEN
    RAISE EXCEPTION 'No outstanding debt to clear';
  END IF;

  -- 3. Get user's active savings account
  SELECT * INTO v_account FROM public.accounts 
  WHERE user_id = v_user_id AND account_type = 'savings' AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active savings account found';
  END IF;

  IF v_account.balance < v_total_debt THEN
    RAISE EXCEPTION 'Insufficient funds in savings account to clear all debt';
  END IF;

  -- 4. Update all active loans
  FOR v_loan IN 
    SELECT * FROM public.loans 
    WHERE user_id = v_user_id AND status IN ('active', 'approved', 'pending') AND outstanding_balance > 0
  LOOP
    UPDATE public.loans 
    SET 
      outstanding_balance = 0,
      total_repaid = COALESCE(total_repaid, 0) + v_loan.outstanding_balance,
      status = 'paid',
      updated_at = now()
    WHERE id = v_loan.id;
  END LOOP;

  -- 5. Update the account
  UPDATE public.accounts
  SET balance = v_account.balance - v_total_debt, updated_at = now()
  WHERE id = v_account.id;

  -- 6. Insert the transaction log
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    reference,
    status
  ) VALUES (
    v_user_id,
    'debit',
    v_total_debt,
    v_account.balance - v_total_debt,
    'Full Debt Clearance - ' || v_active_loans_count || ' Facilities',
    'CLEARALL-' || upper(substr(gen_random_uuid()::text, 1, 8)),
    'completed'
  );

  RETURN json_build_object(
    'success', true,
    'total_cleared', v_total_debt,
    'facilities_cleared', v_active_loans_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
