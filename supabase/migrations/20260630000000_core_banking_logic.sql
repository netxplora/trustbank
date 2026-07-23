-- ============================================================
-- Phase 10: Core Banking Logic and Security Hardening
-- ============================================================

-- 1. Trigger for Automated Balance Management
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status != 'completed') THEN
    IF NEW.type IN ('credit', 'deposit', 'loan_disbursement') THEN
      UPDATE public.accounts SET balance = balance + NEW.amount, updated_at = now() WHERE id = NEW.account_id;
    ELSIF NEW.type IN ('debit', 'withdrawal', 'fee', 'bill_payment') THEN
      UPDATE public.accounts SET balance = balance - NEW.amount, updated_at = now() WHERE id = NEW.account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_balance ON public.transactions;
CREATE TRIGGER trg_update_balance
AFTER INSERT OR UPDATE OF status ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_account_balance();

-- 2. Revoke Direct UPDATE on Accounts Balance from non-admins
-- (By redefining the RLS policy for accounts UPDATE)
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (
  auth.uid() = user_id 
  -- Users cannot modify their own balance or status
  AND balance = (SELECT balance FROM public.accounts WHERE id = id)
  AND status = (SELECT status FROM public.accounts WHERE id = id)
);

-- 3. Secure Transfer RPC
CREATE OR REPLACE FUNCTION public.process_transfer(
  p_user_id UUID,
  p_from_account_id UUID,
  p_to_account_number TEXT,
  p_amount NUMERIC,
  p_narration TEXT,
  p_to_name TEXT,
  p_to_bank TEXT
) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
  v_transfer_id UUID;
  v_internal_receiver_id UUID;
  v_internal_account_id UUID;
  v_reference TEXT;
  v_sender_name TEXT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  -- 1. Check Balance
  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_from_account_id AND user_id = p_user_id AND status = 'active';
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Source account not found or inactive';
  END IF;
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;
  
  -- 2. Generate Reference
  v_reference := 'TRF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));

  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = p_user_id;

  -- 3. Check if Internal Transfer (TrustBank)
  IF p_to_bank = 'TrustBank' OR p_to_bank IS NULL OR p_to_bank = '' THEN
    SELECT id, user_id INTO v_internal_account_id, v_internal_receiver_id FROM public.accounts WHERE account_number = p_to_account_number AND status = 'active';
    IF v_internal_account_id IS NULL THEN
       RAISE EXCEPTION 'Destination TrustBank account not found or inactive';
    END IF;
  END IF;

  -- 4. Create Transfer Record
  INSERT INTO public.transfers (user_id, from_account_id, to_account_number, to_name, to_bank, amount, narration, reference, status)
  VALUES (p_user_id, p_from_account_id, p_to_account_number, p_to_name, COALESCE(p_to_bank, 'TrustBank'), p_amount, p_narration, v_reference, 'completed')
  RETURNING id INTO v_transfer_id;

  -- 5. Create Debit Transaction (Trigger handles balance update)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, recipient_name, recipient_account, recipient_bank, status)
  VALUES (p_user_id, p_from_account_id, 'debit', p_amount, 'Transfer to ' || COALESCE(p_to_name, p_to_account_number), v_reference, p_to_name, p_to_account_number, COALESCE(p_to_bank, 'TrustBank'), 'completed');

  -- 6. Create Credit Transaction if Internal
  IF v_internal_account_id IS NOT NULL THEN
    INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
    VALUES (v_internal_receiver_id, v_internal_account_id, 'credit', p_amount, 'Transfer from ' || v_sender_name, v_reference, 'completed');
    
    -- Notify Receiver
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (v_internal_receiver_id, 'Funds Received', 'You received $' || p_amount || ' from ' || v_sender_name, 'success');
  END IF;
  
  -- 7. Audit Log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, 'transfer_executed', 'transfers', v_transfer_id::text, jsonb_build_object('amount', p_amount, 'to', p_to_account_number, 'bank', p_to_bank, 'ref', v_reference));

  RETURN json_build_object('success', true, 'transfer_id', v_transfer_id, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Secure Bill Payment RPC
CREATE OR REPLACE FUNCTION public.process_bill_payment(
  p_user_id UUID,
  p_account_id UUID,
  p_payee_name TEXT,
  p_category TEXT,
  p_amount NUMERIC,
  p_account_masked TEXT
) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
  v_reference TEXT;
  v_payment_id UUID;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;

  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_account_id AND user_id = p_user_id AND status = 'active';
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Account not found or inactive'; END IF;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;
  
  v_reference := 'BPY-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));

  -- Insert Payment Log
  INSERT INTO public.payments (user_id, account_id, payment_type, provider, amount, phone_or_reference, reference, status)
  VALUES (p_user_id, p_account_id, p_category, p_payee_name, p_amount, p_account_masked, v_reference, 'completed')
  RETURNING id INTO v_payment_id;

  -- Insert Debit Transaction (Trigger handles balance)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (p_user_id, p_account_id, 'bill_payment', p_amount, 'Bill Pay: ' || p_payee_name, v_reference, 'completed');

  -- Notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (p_user_id, 'Bill Payment Sent', '$' || p_amount || ' paid to ' || p_payee_name, 'transaction');

  -- Audit Log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, 'bill_payment_executed', 'payments', v_payment_id::text, jsonb_build_object('amount', p_amount, 'payee', p_payee_name, 'ref', v_reference));

  RETURN json_build_object('success', true, 'payment_id', v_payment_id, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Admin Approve Deposit RPC
CREATE OR REPLACE FUNCTION public.admin_approve_deposit(
  p_admin_id UUID,
  p_session_id UUID
) RETURNS JSON AS $$
DECLARE
  v_session RECORD;
  v_account_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Verify admin
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = p_admin_id AND role IN ('admin', 'super_admin')) INTO v_is_admin;
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_session FROM public.payment_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Session not found'; END IF;
  IF v_session.status = 'approved' THEN RAISE EXCEPTION 'Already approved'; END IF;

  -- Get target account
  IF v_session.account_id IS NOT NULL THEN
    v_account_id := v_session.account_id;
  ELSE
    SELECT id INTO v_account_id FROM public.accounts WHERE user_id = v_session.user_id AND status = 'active' ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF v_account_id IS NULL THEN RAISE EXCEPTION 'No active account found for user'; END IF;

  -- Update Session
  UPDATE public.payment_sessions SET status = 'approved', updated_at = now() WHERE id = p_session_id;

  -- Insert Transaction (Trigger adds to balance)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (v_session.user_id, v_account_id, 'deposit', v_session.amount, 'Deposit via ' || REPLACE(v_session.method, '_', ' '), v_session.reference, 'completed');

  -- Audit logs
  INSERT INTO public.payment_audit_logs (payment_session_id, admin_user_id, action, previous_status, new_status)
  VALUES (p_session_id, p_admin_id, 'approved', v_session.status, 'approved');

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_admin_id, 'admin_approved_deposit', 'payment_sessions', p_session_id::text, jsonb_build_object('user_id', v_session.user_id, 'amount', v_session.amount));

  -- Notify user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (v_session.user_id, 'Deposit Approved', 'Your deposit of $' || v_session.amount || ' has been approved and credited to your account.', 'success');

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Admin Approve Loan RPC
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

  -- Find checking account to disburse to
  SELECT id INTO v_account_id FROM public.accounts WHERE user_id = v_loan.user_id AND account_type = 'checking' AND status = 'active' LIMIT 1;
  IF v_account_id IS NULL THEN 
    -- Fallback to savings if no checking
    SELECT id INTO v_account_id FROM public.accounts WHERE user_id = v_loan.user_id AND status = 'active' ORDER BY created_at ASC LIMIT 1;
  END IF;
  IF v_account_id IS NULL THEN RAISE EXCEPTION 'No active account found to disburse funds to'; END IF;

  -- Update Loan
  UPDATE public.loans SET status = 'approved', approved_at = now(), updated_at = now() WHERE id = p_loan_id;

  -- Disburse funds via Transaction (Trigger updates balance)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (v_loan.user_id, v_account_id, 'loan_disbursement', v_loan.amount, 'Loan Disbursement - ' || UPPER(SUBSTRING(p_loan_id::text FROM 1 FOR 8)), 'LND-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)), 'completed');

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_admin_id, 'admin_approved_loan', 'loans', p_loan_id::text, jsonb_build_object('user_id', v_loan.user_id, 'amount', v_loan.amount));

  -- Notify user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (v_loan.user_id, 'Loan Approved', 'Your loan of $' || v_loan.amount || ' has been approved and funds disbursed to your account.', 'success');

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. Admin Approve Current Account RPC
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

  -- Prevent multiple current accounts
  IF EXISTS (SELECT 1 FROM public.accounts WHERE user_id = v_app.user_id AND account_type = 'current') THEN
    RAISE EXCEPTION 'User already has a current account';
  END IF;

  -- Update Application
  UPDATE public.current_account_applications SET status = 'approved', updated_at = now() WHERE id = p_application_id;

  -- Generate Account Number
  v_new_account_number := public.generate_account_number();

  -- Create Account
  INSERT INTO public.accounts (user_id, account_number, account_type, balance, status)
  VALUES (v_app.user_id, v_new_account_number, 'current', 0, 'active');

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_admin_id, 'admin_approved_current_account', 'current_account_applications', p_application_id::text, jsonb_build_object('user_id', v_app.user_id, 'account_number', v_new_account_number));

  -- Notify user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (v_app.user_id, 'Current Account Approved', 'Your application is approved. New Account Number: ' || v_new_account_number, 'success');

  RETURN json_build_object('success', true, 'account_number', v_new_account_number);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
