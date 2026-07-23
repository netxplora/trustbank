-- ============================================================
-- Phase 16: Admin Update Loan RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_update_loan(
  p_admin_id UUID,
  p_loan_id UUID,
  p_amount NUMERIC,
  p_tenure_months INTEGER,
  p_interest_rate NUMERIC,
  p_monthly_payment NUMERIC,
  p_outstanding_balance NUMERIC
) RETURNS JSON AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_loan RECORD;
BEGIN
  -- 1. Check if the user is an admin
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = p_admin_id AND role IN ('admin', 'super_admin')) INTO v_is_admin;
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  -- 2. Verify loan exists and is pending
  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
  IF v_loan.status != 'pending' THEN RAISE EXCEPTION 'Only pending loans can be modified'; END IF;

  -- 3. Update the loan
  UPDATE public.loans 
  SET 
    amount = p_amount,
    tenure_months = p_tenure_months,
    interest_rate = p_interest_rate,
    monthly_payment = p_monthly_payment,
    outstanding_balance = p_outstanding_balance,
    updated_at = now()
  WHERE id = p_loan_id;

  -- 4. Log the action
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    p_admin_id, 
    'admin_updated_loan_terms', 
    'loans', 
    p_loan_id::text, 
    jsonb_build_object(
      'old_amount', v_loan.amount, 
      'new_amount', p_amount, 
      'old_rate', v_loan.interest_rate, 
      'new_rate', p_interest_rate
    )
  );

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
