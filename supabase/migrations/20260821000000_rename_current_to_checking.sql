-- ============================================================
-- Migration: Rename account_type 'current' to 'checking'
-- ============================================================

-- 1. Update existing rows
UPDATE public.accounts SET account_type = 'checking' WHERE account_type = 'current';

-- 2. Update admin_approve_current_account RPC to create 'checking' type accounts
CREATE OR REPLACE FUNCTION public.admin_approve_current_account(
  p_admin_id UUID,
  p_application_id UUID
) RETURNS JSON AS $$
DECLARE
  v_app RECORD;
  v_new_account_number TEXT;
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = p_admin_id AND role IN ('admin', 'super_admin')) INTO v_is_admin;
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_app FROM public.current_account_applications WHERE id = p_application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF v_app.status != 'submitted' AND v_app.status != 'under_review' THEN RAISE EXCEPTION 'Application is not pending'; END IF;

  IF EXISTS (SELECT 1 FROM public.accounts WHERE user_id = v_app.user_id AND account_type = 'checking') THEN
    RAISE EXCEPTION 'User already has a checking account';
  END IF;

  UPDATE public.current_account_applications SET status = 'approved', updated_at = now() WHERE id = p_application_id;
  v_new_account_number := public.generate_account_number();

  INSERT INTO public.accounts (user_id, account_number, account_type, balance, status)
  VALUES (v_app.user_id, v_new_account_number, 'checking', 0, 'active');

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_admin_id, 'admin_approved_checking_account', 'current_account_applications', p_application_id::text,
    jsonb_build_object('user_id', v_app.user_id, 'account_number', v_new_account_number));

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (v_app.user_id, 'Checking Account Approved',
    'Your Checking Account application is approved. Account Number: ' || v_new_account_number, 'success');

  RETURN json_build_object('success', true, 'account_number', v_new_account_number);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update admin_approve_loan to use 'checking' type
CREATE OR REPLACE FUNCTION public.admin_approve_loan(
  p_admin_id UUID,
  p_loan_id UUID
) RETURNS JSON AS $$
DECLARE
  v_loan RECORD;
  v_account_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = p_admin_id AND role IN ('admin', 'super_admin')) INTO v_is_admin;
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
  IF v_loan.status != 'pending' THEN RAISE EXCEPTION 'Loan is not pending'; END IF;

  SELECT id INTO v_account_id FROM public.accounts
  WHERE user_id = v_loan.user_id AND account_type = 'checking' AND status = 'active' LIMIT 1;

  IF v_account_id IS NULL THEN
    SELECT id INTO v_account_id FROM public.accounts
    WHERE user_id = v_loan.user_id AND status = 'active' ORDER BY created_at ASC LIMIT 1;
  END IF;
  IF v_account_id IS NULL THEN RAISE EXCEPTION 'No active account found to disburse funds to'; END IF;

  UPDATE public.loans SET status = 'approved', approved_at = now(), updated_at = now() WHERE id = p_loan_id;

  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (v_loan.user_id, v_account_id, 'loan_disbursement', v_loan.amount,
    'Loan Disbursement - ' || UPPER(SUBSTRING(p_loan_id::text FROM 1 FOR 8)),
    'LND-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)), 'completed');

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_admin_id, 'admin_approved_loan', 'loans', p_loan_id::text,
    jsonb_build_object('user_id', v_loan.user_id, 'amount', v_loan.amount));

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (v_loan.user_id, 'Loan Approved',
    'Your loan of $' || v_loan.amount || ' has been approved and disbursed to your account.', 'success');

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
