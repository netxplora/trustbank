-- ============================================================
-- Phase 14: Daily Velocity Limits for Transfers
-- ============================================================

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
  v_kyc_tier INTEGER;
  v_daily_total NUMERIC := 0;
  v_daily_limit NUMERIC;
  v_tx_limit NUMERIC;
  v_transfer_id UUID;
  v_internal_receiver_id UUID;
  v_internal_account_id UUID;
  v_reference TEXT;
  v_sender_name TEXT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  -- 1. KYC Tier Check
  SELECT kyc_tier INTO v_kyc_tier FROM public.profiles WHERE user_id = p_user_id;
  IF v_kyc_tier IS NULL OR v_kyc_tier = 0 THEN
    RAISE EXCEPTION 'Your account is unverified. Please complete KYC Tier 1 to enable transfers.';
  END IF;
  
  -- Assign Limits based on Tier
  IF v_kyc_tier = 1 THEN
    v_tx_limit := 5000;
    v_daily_limit := 10000;
  ELSIF v_kyc_tier = 2 THEN
    v_tx_limit := 50000;
    v_daily_limit := 100000;
  ELSIF v_kyc_tier = 3 THEN
    v_tx_limit := 500000;
    v_daily_limit := 1000000;
  END IF;

  -- 2. Per-Transaction Limit Check
  IF p_amount > v_tx_limit THEN
    RAISE EXCEPTION 'Transfer exceeds your Tier % limit of $%. Please upgrade your KYC tier.', v_kyc_tier, v_tx_limit;
  END IF;

  -- 3. Daily Velocity Limit Check
  -- Calculate total transfers sent by user in the last 24 hours
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM public.transfers
  WHERE user_id = p_user_id
  AND status = 'completed'
  AND created_at >= NOW() - INTERVAL '24 hours';

  IF (v_daily_total + p_amount) > v_daily_limit THEN
    RAISE EXCEPTION 'Transfer blocked: Exceeds your daily Tier % limit of $%. You have already transferred $% in the last 24 hours.', v_kyc_tier, v_daily_limit, v_daily_total;
  END IF;

  -- 4. Check Balance
  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_from_account_id AND user_id = p_user_id AND status = 'active';
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Source account not found or inactive';
  END IF;
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;
  
  -- 5. Generate Reference
  v_reference := 'TRF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));

  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = p_user_id;

  -- 6. Check if Internal Transfer (TrustBank)
  IF p_to_bank = 'TrustBank' OR p_to_bank IS NULL OR p_to_bank = '' THEN
    SELECT id, user_id INTO v_internal_account_id, v_internal_receiver_id FROM public.accounts WHERE account_number = p_to_account_number AND status = 'active';
    IF v_internal_account_id IS NULL THEN
       RAISE EXCEPTION 'Destination TrustBank account not found or inactive';
    END IF;
  END IF;

  -- 7. Create Transfer Record
  INSERT INTO public.transfers (user_id, from_account_id, to_account_number, to_name, to_bank, amount, narration, reference, status)
  VALUES (p_user_id, p_from_account_id, p_to_account_number, p_to_name, COALESCE(p_to_bank, 'TrustBank'), p_amount, p_narration, v_reference, 'completed')
  RETURNING id INTO v_transfer_id;

  -- 8. Create Debit Transaction (Trigger handles balance update)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, recipient_name, recipient_account, recipient_bank, status)
  VALUES (p_user_id, p_from_account_id, 'debit', p_amount, 'Transfer to ' || COALESCE(p_to_name, p_to_account_number), v_reference, p_to_name, p_to_account_number, COALESCE(p_to_bank, 'TrustBank'), 'completed');

  -- 9. Create Credit Transaction if Internal
  IF v_internal_account_id IS NOT NULL THEN
    INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
    VALUES (v_internal_receiver_id, v_internal_account_id, 'credit', p_amount, 'Transfer from ' || v_sender_name, v_reference, 'completed');
    
    -- Notify Receiver
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (v_internal_receiver_id, 'Funds Received', 'You received $' || p_amount || ' from ' || v_sender_name, 'success');
  END IF;
  
  -- 10. Audit Log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, 'transfer_executed', 'transfers', v_transfer_id::text, jsonb_build_object('amount', p_amount, 'to', p_to_account_number, 'bank', p_to_bank, 'ref', v_reference));

  RETURN json_build_object('success', true, 'transfer_id', v_transfer_id, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
