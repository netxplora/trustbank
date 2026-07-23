-- ============================================================
-- Crypto Deposit Approval RPC & Dashboard Deposit Fixes
-- ============================================================

-- 1. Admin Approve Crypto Deposit RPC
-- When an admin confirms a crypto deposit, this function:
--   a) Verifies admin role
--   b) Finds the user's first active account
--   c) Creates a completed transaction (triggers balance update)
--   d) Updates the crypto_deposits record
--   e) Logs to audit_logs
--   f) Sends a notification to the user
CREATE OR REPLACE FUNCTION public.admin_approve_crypto_deposit(
  p_admin_id UUID,
  p_deposit_id UUID
) RETURNS JSON AS $$
DECLARE
  v_deposit RECORD;
  v_account_id UUID;
  v_is_admin BOOLEAN;
  v_crypto_name TEXT;
  v_reference TEXT;
BEGIN
  -- Verify admin
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_admin_id AND role IN ('admin', 'super_admin')
  ) INTO v_is_admin;
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  -- Fetch the deposit
  SELECT * INTO v_deposit FROM public.crypto_deposits WHERE id = p_deposit_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deposit not found'; END IF;
  IF v_deposit.status = 'confirmed' THEN RAISE EXCEPTION 'Deposit already confirmed'; END IF;
  IF v_deposit.status = 'rejected' THEN RAISE EXCEPTION 'Deposit was already rejected'; END IF;

  -- Get cryptocurrency name for the description
  SELECT cryptocurrency INTO v_crypto_name FROM public.crypto_wallets WHERE id = v_deposit.wallet_id;

  -- Find the user's first active account
  SELECT id INTO v_account_id
  FROM public.accounts
  WHERE user_id = v_deposit.user_id AND status = 'active'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'No active account found for user';
  END IF;

  -- Generate reference
  v_reference := 'CRY-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

  -- Update the crypto deposit status
  UPDATE public.crypto_deposits
  SET status = 'confirmed', reviewed_by = p_admin_id, updated_at = now()
  WHERE id = p_deposit_id;

  -- Insert a completed transaction (the trg_update_balance trigger will credit the account)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (
    v_deposit.user_id,
    v_account_id,
    'deposit',
    v_deposit.amount,
    'Crypto Deposit (' || COALESCE(v_crypto_name, 'Digital Asset') || ')',
    v_reference,
    'completed'
  );

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    p_admin_id,
    'admin_approved_crypto_deposit',
    'crypto_deposits',
    p_deposit_id::text,
    jsonb_build_object(
      'user_id', v_deposit.user_id,
      'amount', v_deposit.amount,
      'cryptocurrency', v_crypto_name,
      'tx_hash', v_deposit.tx_hash
    )
  );

  -- Notify user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_deposit.user_id,
    'Crypto Deposit Confirmed',
    'Your ' || COALESCE(v_crypto_name, 'crypto') || ' deposit of ' || v_deposit.amount || ' has been confirmed and credited to your account.',
    'success'
  );

  RETURN json_build_object('success', true, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
