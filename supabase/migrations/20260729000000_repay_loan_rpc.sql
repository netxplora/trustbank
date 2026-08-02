-- ============================================================
-- Add RPC for processing loan repayments securely
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_loan_repayment(
  p_loan_id UUID,
  p_amount NUMERIC
) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_loan RECORD;
  v_account RECORD;
  v_new_outstanding NUMERIC;
  v_new_repaid NUMERIC;
  v_new_status TEXT;
  v_new_balance NUMERIC;
BEGIN
  -- 1. Get the authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Verify loan exists, belongs to user, and is active
  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id AND user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found or unauthorized';
  END IF;

  IF v_loan.status NOT IN ('active', 'approved', 'pending') THEN
    RAISE EXCEPTION 'Loan is not in an active state';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  IF p_amount > COALESCE(v_loan.outstanding_balance, 0) THEN
    RAISE EXCEPTION 'Payment amount exceeds outstanding balance';
  END IF;

  -- 3. Get user's active savings account
  SELECT * INTO v_account FROM public.accounts 
  WHERE user_id = v_user_id AND account_type = 'savings' AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active savings account found';
  END IF;

  IF v_account.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds in savings account';
  END IF;

  -- 4. Calculate new values
  v_new_outstanding := GREATEST(0, COALESCE(v_loan.outstanding_balance, 0) - p_amount);
  v_new_repaid := COALESCE(v_loan.total_repaid, 0) + p_amount;
  v_new_status := CASE WHEN v_new_outstanding <= 0 THEN 'paid' ELSE v_loan.status END;
  v_new_balance := v_account.balance - p_amount;

  -- 5. Update the loan
  UPDATE public.loans 
  SET 
    outstanding_balance = v_new_outstanding,
    total_repaid = v_new_repaid,
    status = v_new_status,
    updated_at = now()
  WHERE id = p_loan_id;

  -- 6. Update the account
  UPDATE public.accounts
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_account.id;

  -- 7. Insert the transaction log
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
    p_amount,
    v_new_balance,
    'Loan repayment - ' || COALESCE(v_loan.purpose, 'Credit Facility') || ' (' || upper(substr(p_loan_id::text, 1, 8)) || ')',
    'REPAY-' || upper(substr(p_loan_id::text, 1, 8)) || '-' || upper(substr(gen_random_uuid()::text, 1, 8)),
    'completed'
  );

  RETURN json_build_object(
    'success', true,
    'new_outstanding', v_new_outstanding,
    'new_status', v_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
