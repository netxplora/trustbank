-- ============================================================
-- Phase 18: Bank Portfolio & Fee RPC
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bank_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(15,2) NOT NULL,
  source TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view bank portfolio" ON public.bank_portfolio FOR SELECT USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.process_card_fee(
  p_user_id UUID,
  p_account_id UUID,
  p_fee_amount NUMERIC,
  p_reference TEXT
) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  -- 1. Get the account balance and row-lock it
  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_account_id AND user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found or not owned by user';
  END IF;

  IF v_balance < p_fee_amount THEN
    RAISE EXCEPTION 'Insufficient funds to cover the fee';
  END IF;

  -- 2. Deduct fee
  UPDATE public.accounts SET balance = balance - p_fee_amount WHERE id = p_account_id;

  -- 3. Log transaction
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (p_user_id, p_account_id, 'fee', p_fee_amount, 'Physical Card Provisioning Fee', p_reference, 'completed');

  -- 4. Credit Bank Portfolio
  INSERT INTO public.bank_portfolio (amount, source, reference_id)
  VALUES (p_fee_amount, 'physical_card_fee', p_reference);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
