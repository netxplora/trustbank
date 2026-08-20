-- ============================================================
-- Update process_card_fee to use platform_fees
-- ============================================================

DROP FUNCTION IF EXISTS public.process_card_fee(uuid, uuid, numeric, text);
DROP FUNCTION IF EXISTS public.process_card_fee(uuid, uuid, numeric, text, text);

CREATE OR REPLACE FUNCTION public.process_card_fee(
  p_user_id UUID,
  p_account_id UUID,
  p_fee_amount NUMERIC, -- Kept for frontend compatibility (ignored)
  p_reference TEXT,
  p_pin TEXT,
  p_card_type TEXT DEFAULT 'physical'
) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
  v_actual_fee NUMERIC;
  v_fee_name TEXT;
BEGIN
  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

  -- Determine actual fee from DB
  IF p_card_type = 'infinite' THEN
    v_fee_name := 'infinite_metal_card_fee';
  ELSIF p_card_type = 'virtual' THEN
    v_actual_fee := 0;
  ELSE
    v_fee_name := 'physical_card_fee';
  END IF;

  IF v_actual_fee IS NULL THEN
    SELECT amount INTO v_actual_fee FROM public.platform_fees WHERE fee_name = v_fee_name;
    IF v_actual_fee IS NULL THEN
      v_actual_fee := 15.00; -- fallback
    END IF;
  END IF;

  IF v_actual_fee > 0 THEN
    -- 1. Lock and check account balance
    SELECT balance INTO v_balance FROM public.accounts WHERE id = p_account_id AND user_id = p_user_id FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Account not found or not owned by user';
    END IF;

    IF v_balance < v_actual_fee THEN
      RAISE EXCEPTION 'Insufficient funds to cover card fee. Required: %', v_actual_fee;
    END IF;

    -- 2. Deduct fee
    UPDATE public.accounts SET balance = balance - v_actual_fee WHERE id = p_account_id;

    -- 3. Record transaction log
    INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
    VALUES (p_user_id, p_account_id, 'debit', v_actual_fee, 'Card Provisioning Fee', p_reference, 'completed');
  END IF;

  RETURN json_build_object('success', true, 'fee_deducted', v_actual_fee);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
