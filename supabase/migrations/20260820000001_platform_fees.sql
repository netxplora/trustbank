-- ============================================================
-- Platform Fees Configuration
-- ============================================================

CREATE TABLE IF NOT EXISTS public.platform_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_name TEXT UNIQUE NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('flat', 'percentage')),
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform_fees" 
ON public.platform_fees 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage platform_fees" 
ON public.platform_fees 
FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Seed initial data
INSERT INTO public.platform_fees (fee_name, fee_type, amount, description) VALUES
('physical_card_fee', 'flat', 15.00, 'Fee for issuing a standard physical debit card'),
('infinite_metal_card_fee', 'flat', 75.00, 'Fee for issuing an Infinite Metal physical card'),
('internal_transfer_fee', 'flat', 0.00, 'Fee for TrustBank to TrustBank transfers'),
('domestic_wire_fee', 'flat', 25.00, 'Fee for outgoing domestic wires'),
('international_wire_fee', 'flat', 45.00, 'Fee for outgoing international wires'),
('crypto_swap_fee', 'percentage', 1.5, 'Percentage fee for swapping crypto to fiat'),
('crypto_withdrawal_fee', 'flat', 10.00, 'Flat fee for external crypto withdrawals')
ON CONFLICT (fee_name) DO NOTHING;
