-- ============================================================
-- Migration: Account Rules + Internal Transfer System
-- ============================================================

-- 1. Account Rules Table (centralized limits per account type)
CREATE TABLE IF NOT EXISTS public.account_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type TEXT NOT NULL UNIQUE, -- 'savings' | 'checking'
  daily_transfer_limit NUMERIC(15,2) NOT NULL DEFAULT 10000,
  per_tx_limit NUMERIC(15,2) NOT NULL DEFAULT 5000,
  max_daily_tx_count INTEGER NOT NULL DEFAULT 10,
  min_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  max_balance NUMERIC(15,2),
  internal_transfer_min NUMERIC(15,2) NOT NULL DEFAULT 1,
  internal_transfer_max NUMERIC(15,2) NOT NULL DEFAULT 50000,
  internal_transfer_daily_limit NUMERIC(15,2) NOT NULL DEFAULT 50000,
  internal_transfers_per_day INTEGER NOT NULL DEFAULT 10,
  quote_lock_seconds INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.account_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view account rules" ON public.account_rules;
CREATE POLICY "Authenticated users can view account rules" ON public.account_rules
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage account rules" ON public.account_rules;
CREATE POLICY "Admins can manage account rules" ON public.account_rules
  FOR ALL USING (public.is_admin(auth.uid()));

-- Seed default rules
INSERT INTO public.account_rules (account_type, daily_transfer_limit, per_tx_limit, max_daily_tx_count, min_balance, internal_transfer_min, internal_transfer_max, internal_transfer_daily_limit, internal_transfers_per_day)
VALUES
  ('savings',  10000,  5000, 5,  0, 1, 25000, 25000, 5),
  ('checking', 50000, 25000, 20, 0, 1, 50000, 50000, 10)
ON CONFLICT (account_type) DO NOTHING;

-- 2. Internal Transfers Table
CREATE TABLE IF NOT EXISTS public.internal_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES public.accounts(id),
  to_account_id UUID NOT NULL REFERENCES public.accounts(id),
  from_account_type TEXT NOT NULL,
  to_account_type TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  fee NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(15,2) NOT NULL,
  reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  debit_tx_id UUID,
  credit_tx_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.internal_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own internal transfers" ON public.internal_transfers;
CREATE POLICY "Users can view own internal transfers" ON public.internal_transfers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all internal transfers" ON public.internal_transfers;
CREATE POLICY "Admins can view all internal transfers" ON public.internal_transfers
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 3. Seed internal transfer fees into platform_fees
INSERT INTO public.platform_fees (fee_name, fee_type, amount, description)
VALUES
  ('savings_to_checking_fee', 'flat', 0.00, 'Fee for transferring from Savings to Checking Account'),
  ('checking_to_savings_fee', 'flat', 0.00, 'Fee for transferring from Checking to Savings Account')
ON CONFLICT (fee_name) DO NOTHING;

-- 4. Process Internal Transfer RPC
CREATE OR REPLACE FUNCTION public.process_internal_transfer(
  p_user_id UUID,
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_amount NUMERIC,
  p_pin TEXT
) RETURNS JSON AS $$
DECLARE
  v_from_acct RECORD;
  v_to_acct RECORD;
  v_rules RECORD;
  v_fee NUMERIC := 0;
  v_fee_name TEXT;
  v_net NUMERIC;
  v_daily_total NUMERIC := 0;
  v_daily_count INTEGER := 0;
  v_reference TEXT;
  v_transfer_id UUID;
  v_debit_tx_id UUID;
  v_credit_tx_id UUID;
  v_sender_name TEXT;
BEGIN
  -- Verify PIN
  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  -- Verify from account belongs to user and is active
  SELECT * INTO v_from_acct FROM public.accounts
  WHERE id = p_from_account_id AND user_id = p_user_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source account not found, inactive, or does not belong to you';
  END IF;

  -- Verify to account belongs to same user and is active
  SELECT * INTO v_to_acct FROM public.accounts
  WHERE id = p_to_account_id AND user_id = p_user_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destination account not found, inactive, or does not belong to you';
  END IF;

  -- Must be different accounts
  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Source and destination accounts must be different';
  END IF;

  -- Load rules for source account type
  SELECT * INTO v_rules FROM public.account_rules WHERE account_type = v_from_acct.account_type;

  -- Min transfer check
  IF p_amount < v_rules.internal_transfer_min THEN
    RAISE EXCEPTION 'Minimum transfer amount is $%', v_rules.internal_transfer_min;
  END IF;

  -- Max per-transaction check
  IF p_amount > v_rules.internal_transfer_max THEN
    RAISE EXCEPTION 'Transfer exceeds the maximum of $% per transaction for % accounts', v_rules.internal_transfer_max, v_from_acct.account_type;
  END IF;

  -- Daily limit + count check
  SELECT COALESCE(SUM(amount), 0), COUNT(*)
  INTO v_daily_total, v_daily_count
  FROM public.internal_transfers
  WHERE user_id = p_user_id
    AND from_account_id = p_from_account_id
    AND status = 'completed'
    AND created_at >= NOW() - INTERVAL '24 hours';

  IF v_daily_count >= v_rules.internal_transfers_per_day THEN
    RAISE EXCEPTION 'Daily internal transfer limit of % transactions reached', v_rules.internal_transfers_per_day;
  END IF;

  IF (v_daily_total + p_amount) > v_rules.internal_transfer_daily_limit THEN
    RAISE EXCEPTION 'Transfer would exceed your daily internal transfer limit of $%', v_rules.internal_transfer_daily_limit;
  END IF;

  -- Balance check (after fee)
  v_fee_name := v_from_acct.account_type || '_to_' || v_to_acct.account_type || '_fee';
  SELECT amount INTO v_fee FROM public.platform_fees WHERE fee_name = v_fee_name;
  v_fee := COALESCE(v_fee, 0);
  v_net := p_amount - v_fee;

  IF v_net <= 0 THEN
    RAISE EXCEPTION 'Transfer amount does not cover the fee';
  END IF;

  IF v_from_acct.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds. Available balance: $%', v_from_acct.balance;
  END IF;

  -- Generate reference
  v_reference := 'INT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));
  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = p_user_id;

  -- Create transfer record first (to get ID)
  INSERT INTO public.internal_transfers (
    user_id, from_account_id, to_account_id,
    from_account_type, to_account_type,
    amount, fee, net_amount, reference, status
  ) VALUES (
    p_user_id, p_from_account_id, p_to_account_id,
    v_from_acct.account_type, v_to_acct.account_type,
    p_amount, v_fee, v_net, v_reference, 'completed'
  ) RETURNING id INTO v_transfer_id;

  -- Debit transaction (trigger updates balance)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (p_user_id, p_from_account_id, 'internal_transfer_debit', p_amount,
    'Internal Transfer to ' || initcap(v_to_acct.account_type) || ' Account', v_reference, 'completed')
  RETURNING id INTO v_debit_tx_id;

  -- Fee transaction if applicable
  IF v_fee > 0 THEN
    INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
    VALUES (p_user_id, p_from_account_id, 'fee', v_fee,
      'Transfer Fee', v_reference, 'completed');
  END IF;

  -- Credit transaction (trigger updates balance) — credits net amount
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (p_user_id, p_to_account_id, 'internal_transfer_credit', v_net,
    'Internal Transfer from ' || initcap(v_from_acct.account_type) || ' Account', v_reference, 'completed')
  RETURNING id INTO v_credit_tx_id;

  -- Update internal_transfers with tx IDs
  UPDATE public.internal_transfers
  SET debit_tx_id = v_debit_tx_id, credit_tx_id = v_credit_tx_id
  WHERE id = v_transfer_id;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, 'internal_transfer', 'internal_transfers', v_transfer_id::text,
    jsonb_build_object(
      'from_type', v_from_acct.account_type,
      'to_type', v_to_acct.account_type,
      'amount', p_amount,
      'fee', v_fee,
      'net', v_net,
      'reference', v_reference
    ));

  -- Notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (p_user_id, 'Internal Transfer Complete',
    '$' || v_net || ' transferred from your ' || initcap(v_from_acct.account_type) ||
    ' to your ' || initcap(v_to_acct.account_type) || ' account. Ref: ' || v_reference,
    'success');

  RETURN json_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'reference', v_reference,
    'amount', p_amount,
    'fee', v_fee,
    'net_amount', v_net
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Ensure balance trigger handles new internal transfer types
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status != 'completed') THEN
    IF NEW.type IN ('credit', 'deposit', 'loan_disbursement', 'internal_transfer_credit', 'crypto_conversion_credit') THEN
      UPDATE public.accounts SET balance = balance + NEW.amount, updated_at = now() WHERE id = NEW.account_id;
    ELSIF NEW.type IN ('debit', 'withdrawal', 'fee', 'bill_payment', 'internal_transfer_debit', 'crypto_conversion_debit') THEN
      UPDATE public.accounts SET balance = balance - NEW.amount, updated_at = now() WHERE id = NEW.account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
