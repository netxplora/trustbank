-- ============================================================
-- Phase 11: KYC Tier Enforcement & Privileges
-- ============================================================

-- 1. UPDATE TRANSFER RPC TO ENFORCE LIMITS
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
  v_transfer_id UUID;
  v_internal_receiver_id UUID;
  v_internal_account_id UUID;
  v_reference TEXT;
  v_sender_name TEXT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  -- KYC Tier check
  SELECT kyc_tier INTO v_kyc_tier FROM public.profiles WHERE user_id = p_user_id;
  IF v_kyc_tier IS NULL OR v_kyc_tier = 0 THEN
    RAISE EXCEPTION 'Your account is unverified. Please complete KYC Tier 1 to enable transfers.';
  END IF;
  
  IF v_kyc_tier = 1 AND p_amount > 5000 THEN
    RAISE EXCEPTION 'Transfer exceeds your Tier 1 limit of $5,000. Please upgrade your KYC tier.';
  END IF;

  IF v_kyc_tier = 2 AND p_amount > 50000 THEN
    RAISE EXCEPTION 'Transfer exceeds your Tier 2 limit of $50,000. Please upgrade your KYC tier.';
  END IF;

  IF v_kyc_tier = 3 AND p_amount > 500000 THEN
    RAISE EXCEPTION 'Transfer exceeds your Tier 3 limit of $500,000.';
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


-- 2. ENFORCE LOAN PRIVILEGES
DROP POLICY IF EXISTS "Users can insert own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can apply for loans" ON public.loans;
CREATE POLICY "Users can apply for loans" ON public.loans FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  (SELECT kyc_tier FROM public.profiles WHERE user_id = auth.uid()) >= 3
);

-- 3. ENFORCE CARDS PRIVILEGES
DROP POLICY IF EXISTS "Users can request cards" ON public.cards;
CREATE POLICY "Users can request cards" ON public.cards FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  (SELECT kyc_tier FROM public.profiles WHERE user_id = auth.uid()) >= 2
);
