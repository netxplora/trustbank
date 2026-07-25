-- ============================================================
-- Migration: Rebuild Cards System Schema, RLS, Indexes & RPC
-- ============================================================

-- 1. Create cards table if not existing
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_number TEXT NOT NULL,
  card_type TEXT NOT NULL DEFAULT 'debit',
  card_brand TEXT NOT NULL DEFAULT 'Visa',
  cardholder_name TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  cvv TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  is_physical BOOLEAN NOT NULL DEFAULT false,
  online_enabled BOOLEAN NOT NULL DEFAULT true,
  international_enabled BOOLEAN NOT NULL DEFAULT false,
  spending_limit NUMERIC,
  delivery_address TEXT,
  request_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Update card_type check constraint
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_card_type_check;
ALTER TABLE public.cards ADD CONSTRAINT cards_card_type_check 
  CHECK (card_type IN ('virtual', 'physical', 'debit', 'premium', 'infinite', 'digital'));

-- 3. Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_status ON public.cards(status);
CREATE INDEX IF NOT EXISTS idx_cards_request_status ON public.cards(request_status);

-- 4. Enable RLS
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can view their own cards" ON public.cards;
DROP POLICY IF EXISTS "Users can view own cards" ON public.cards;
DROP POLICY IF EXISTS "Users can request cards" ON public.cards;
DROP POLICY IF EXISTS "Users can insert own cards" ON public.cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON public.cards;
DROP POLICY IF EXISTS "Users can update own cards" ON public.cards;
DROP POLICY IF EXISTS "Users can delete own cards" ON public.cards;
DROP POLICY IF EXISTS "Admins can view all cards" ON public.cards;
DROP POLICY IF EXISTS "Admins can insert cards" ON public.cards;
DROP POLICY IF EXISTS "Admins can update all cards" ON public.cards;
DROP POLICY IF EXISTS "Admins can delete cards" ON public.cards;
DROP POLICY IF EXISTS "Admins can delete all cards" ON public.cards;

-- User Policies
CREATE POLICY "Users can view own cards" 
  ON public.cards FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards" 
  ON public.cards FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" 
  ON public.cards FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" 
  ON public.cards FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Admin Policies
CREATE POLICY "Admins can view all cards" 
  ON public.cards FOR SELECT 
  TO authenticated 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert cards" 
  ON public.cards FOR INSERT 
  TO authenticated 
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all cards" 
  ON public.cards FOR UPDATE 
  TO authenticated 
  USING (public.is_admin(auth.uid())) 
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all cards" 
  ON public.cards FOR DELETE 
  TO authenticated 
  USING (public.is_admin(auth.uid()));

-- 5. Ensure bank_portfolio table & RPC for processing card fees
CREATE TABLE IF NOT EXISTS public.bank_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(15,2) NOT NULL,
  source TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_portfolio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view bank portfolio" ON public.bank_portfolio;
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
  -- 1. Lock and check account balance
  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_account_id AND user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found or not owned by user';
  END IF;

  IF v_balance < p_fee_amount THEN
    RAISE EXCEPTION 'Insufficient funds to cover physical card fee';
  END IF;

  -- 2. Deduct fee
  UPDATE public.accounts SET balance = balance - p_fee_amount WHERE id = p_account_id;

  -- 3. Record transaction log
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (p_user_id, p_account_id, 'fee', p_fee_amount, 'Physical Card Provisioning Fee', p_reference, 'completed');

  -- 4. Credit Bank Portfolio
  INSERT INTO public.bank_portfolio (amount, source, reference_id)
  VALUES (p_fee_amount, 'physical_card_fee', p_reference);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
