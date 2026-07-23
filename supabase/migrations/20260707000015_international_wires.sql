-- ============================================================
-- Phase 19: International SWIFT Wire Transfers
-- ============================================================

-- 1. Extend the transfers table
ALTER TABLE public.transfers
ADD COLUMN IF NOT EXISTS swift_code TEXT,
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS target_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS destination_amount NUMERIC,
ADD COLUMN IF NOT EXISTS transfer_type TEXT DEFAULT 'domestic' CHECK (transfer_type IN ('internal', 'domestic', 'international'));

-- Set existing internal transfers correctly based on to_bank
UPDATE public.transfers 
SET transfer_type = 'internal' 
WHERE to_bank = 'TrustBank' AND transfer_type = 'domestic';

-- 2. Create the International Wire RPC
CREATE OR REPLACE FUNCTION public.process_international_wire(
  p_user_id UUID,
  p_from_account_id UUID,
  p_to_account_number TEXT,
  p_to_name TEXT,
  p_to_bank TEXT,
  p_swift_code TEXT,
  p_iban TEXT,
  p_target_currency TEXT,
  p_exchange_rate NUMERIC,
  p_amount_usd NUMERIC,
  p_destination_amount NUMERIC,
  p_narration TEXT
) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
  v_kyc_tier INTEGER;
  v_daily_total NUMERIC := 0;
  v_daily_limit NUMERIC;
  v_tx_limit NUMERIC;
  v_transfer_id UUID;
  v_reference TEXT;
  v_sender_name TEXT;
  v_wire_fee NUMERIC := 45.00;
  v_total_deduction NUMERIC;
BEGIN
  IF p_amount_usd <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  -- 1. KYC Tier Check
  SELECT kyc_tier INTO v_kyc_tier FROM public.profiles WHERE user_id = p_user_id;
  IF v_kyc_tier IS NULL OR v_kyc_tier = 0 THEN
    RAISE EXCEPTION 'Your account is unverified. Please complete KYC Tier 1 to enable international wires.';
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
    v_wire_fee := 0; -- Private Wealth clients get free wires
  END IF;

  -- 2. Per-Transaction Limit Check
  IF p_amount_usd > v_tx_limit THEN
    RAISE EXCEPTION 'Transfer exceeds your Tier % limit of $%. Please upgrade your KYC tier.', v_kyc_tier, v_tx_limit;
  END IF;

  -- 3. Daily Velocity Limit Check
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM public.transfers
  WHERE user_id = p_user_id
  AND status = 'completed'
  AND created_at >= NOW() - INTERVAL '24 hours';

  IF (v_daily_total + p_amount_usd) > v_daily_limit THEN
    RAISE EXCEPTION 'Transfer blocked: Exceeds your daily Tier % limit of $%. You have already transferred $% in the last 24 hours.', v_kyc_tier, v_daily_limit, v_daily_total;
  END IF;

  -- 4. Check Balance
  v_total_deduction := p_amount_usd + v_wire_fee;
  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_from_account_id AND user_id = p_user_id AND status = 'active';
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Source account not found or inactive';
  END IF;
  IF v_balance < v_total_deduction THEN
    RAISE EXCEPTION 'Insufficient funds. A balance of $% is required including the wire fee.', v_total_deduction;
  END IF;
  
  -- 5. Generate Reference
  v_reference := 'SWIFT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));
  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = p_user_id;

  -- 6. Create Transfer Record
  INSERT INTO public.transfers (
    user_id, from_account_id, to_account_number, to_name, to_bank, 
    amount, narration, reference, status, transfer_type,
    swift_code, iban, target_currency, exchange_rate, destination_amount
  )
  VALUES (
    p_user_id, p_from_account_id, p_to_account_number, p_to_name, p_to_bank, 
    p_amount_usd, p_narration, v_reference, 'completed', 'international',
    p_swift_code, p_iban, p_target_currency, p_exchange_rate, p_destination_amount
  )
  RETURNING id INTO v_transfer_id;

  -- 7. Create Debit Transaction for Principal
  INSERT INTO public.transactions (
    user_id, account_id, type, amount, description, reference, 
    recipient_name, recipient_account, recipient_bank, status
  )
  VALUES (
    p_user_id, p_from_account_id, 'debit', p_amount_usd, 
    'International Wire to ' || COALESCE(p_to_name, 'Unknown'), v_reference, 
    p_to_name, p_to_account_number, p_to_bank, 'completed'
  );

  -- 8. Deduct Wire Fee if applicable
  IF v_wire_fee > 0 THEN
    INSERT INTO public.transactions (
      user_id, account_id, type, amount, description, reference, status
    )
    VALUES (
      p_user_id, p_from_account_id, 'fee', v_wire_fee, 
      'SWIFT International Wire Fee', v_reference || '-FEE', 'completed'
    );
    
    -- Credit the bank portfolio (assuming it exists from previous migrations)
    UPDATE public.bank_portfolio 
    SET total_fees_collected = total_fees_collected + v_wire_fee,
        updated_at = NOW()
    WHERE id = (SELECT id FROM public.bank_portfolio LIMIT 1);
  END IF;

  RETURN json_build_object('success', true, 'transfer_id', v_transfer_id, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
