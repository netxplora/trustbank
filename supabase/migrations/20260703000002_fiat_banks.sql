-- Migration: fiat_banks
-- Description: Create a table for managing institutional fiat deposit bank accounts.

CREATE TABLE public.fiat_banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_name text NOT NULL,
  account_number text NOT NULL,
  routing_number text,
  swift_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fiat_banks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active fiat banks" ON public.fiat_banks FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage fiat banks" ON public.fiat_banks FOR ALL USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_fiat_banks_updated_at BEFORE UPDATE ON public.fiat_banks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed the initial hardcoded data so functionality doesn't break
INSERT INTO public.fiat_banks (bank_name, account_name, account_number, is_active)
VALUES (
  'Federal Reserve Central (FRC)',
  'TrustBank Custodial Accounts',
  '0123999485',
  true
);
