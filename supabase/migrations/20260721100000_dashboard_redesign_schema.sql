-- ============================================================
-- Dashboard Redesign & Feature Expansion Migration
-- ============================================================

-- Ensure public.is_admin helper function exists
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check user_roles table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'super_admin', 'support_admin')) THEN
      RETURN TRUE;
    END IF;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Digital Currency Wallets
CREATE TABLE IF NOT EXISTS public.digital_currency_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_symbol VARCHAR(10) NOT NULL, -- e.g. BTC, ETH, USDT, USDC, SOL
  asset_name VARCHAR(50) NOT NULL,
  balance NUMERIC(20, 8) DEFAULT 0.00000000 CHECK (balance >= 0),
  wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, asset_symbol)
);

ALTER TABLE public.digital_currency_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own digital wallets" ON public.digital_currency_wallets;
CREATE POLICY "Users can view own digital wallets" ON public.digital_currency_wallets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all digital wallets" ON public.digital_currency_wallets;
CREATE POLICY "Admins can view all digital wallets" ON public.digital_currency_wallets
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 2. Swap Fee Settings
CREATE TABLE IF NOT EXISTS public.swap_fee_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_fee NUMERIC(10, 2) DEFAULT 1.50 CHECK (flat_fee >= 0),
  percentage_fee NUMERIC(5, 2) DEFAULT 0.50 CHECK (percentage_fee >= 0), -- e.g. 0.5%
  min_fee NUMERIC(10, 2) DEFAULT 0.50 CHECK (min_fee >= 0),
  max_fee NUMERIC(10, 2) DEFAULT 50.00 CHECK (max_fee >= min_fee),
  promotional_discount NUMERIC(5, 2) DEFAULT 0.00 CHECK (promotional_discount >= 0 AND promotional_discount <= 100),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.swap_fee_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view swap fee settings" ON public.swap_fee_settings;
CREATE POLICY "Anyone authenticated can view swap fee settings" ON public.swap_fee_settings
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can update swap fee settings" ON public.swap_fee_settings;
CREATE POLICY "Admins can update swap fee settings" ON public.swap_fee_settings
  FOR ALL USING (public.is_admin(auth.uid()));

-- Seed default swap fee settings if empty
INSERT INTO public.swap_fee_settings (flat_fee, percentage_fee, min_fee, max_fee, promotional_discount)
SELECT 1.50, 0.50, 0.50, 50.00, 0.00
WHERE NOT EXISTS (SELECT 1 FROM public.swap_fee_settings);

-- 3. Tax Refund Applications
CREATE TABLE IF NOT EXISTS public.tax_refund_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_number VARCHAR(20) NOT NULL UNIQUE,
  tax_year INT NOT NULL,
  filing_status VARCHAR(50) DEFAULT 'Single',
  estimated_refund_amount NUMERIC(12, 2) NOT NULL CHECK (estimated_refund_amount >= 0),
  status VARCHAR(30) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'action_required', 'approved', 'disbursed', 'rejected')),
  documents JSONB DEFAULT '[]'::jsonb,
  user_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tax_refund_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tax refund apps" ON public.tax_refund_applications;
CREATE POLICY "Users can view own tax refund apps" ON public.tax_refund_applications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tax refund apps" ON public.tax_refund_applications;
CREATE POLICY "Users can insert own tax refund apps" ON public.tax_refund_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage tax refund apps" ON public.tax_refund_applications;
CREATE POLICY "Admins can manage tax refund apps" ON public.tax_refund_applications
  FOR ALL USING (public.is_admin(auth.uid()));

-- 4. Grant Programs
CREATE TABLE IF NOT EXISTS public.grant_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  funding_amount NUMERIC(12, 2) NOT NULL CHECK (funding_amount > 0),
  eligibility_criteria TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'upcoming')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.grant_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view active grant programs" ON public.grant_programs;
CREATE POLICY "Authenticated users can view active grant programs" ON public.grant_programs
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage grant programs" ON public.grant_programs;
CREATE POLICY "Admins can manage grant programs" ON public.grant_programs
  FOR ALL USING (public.is_admin(auth.uid()));

-- Ensure image_url column exists if table was previously created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='grant_programs' AND column_name='image_url'
  ) THEN
    ALTER TABLE public.grant_programs ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Seed default grant programs if none exist
INSERT INTO public.grant_programs (id, title, category, description, funding_amount, eligibility_criteria, deadline, status, image_url)
VALUES 
  (
    '11111111-1111-4111-a111-111111111111',
    'Small Business Expansion & Tech Grant',
    'Small Business',
    'Financial assistance for small businesses upgrading digital infrastructure, POS systems, and ecommerce capabilities.',
    15000.00,
    'Registered business entity in operation for at least 6 months with verified transaction history.',
    NOW() + INTERVAL '180 days',
    'active',
    'https://images.unsplash.com/photo-1664575602276-acd073f104c1?w=800&auto=format&fit=crop&q=60'
  ),
  (
    '22222222-2222-4222-a222-222222222222',
    'Green Energy & Clean Tech Innovation Grant',
    'Sustainability',
    'Funding support for businesses and commercial entities adopting renewable solar, energy-efficient HVAC, or EV fleet solutions.',
    25000.00,
    'Commercial or residential property owners implementing verified green energy initiatives.',
    NOW() + INTERVAL '150 days',
    'active',
    'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=60'
  ),
  (
    '33333333-3333-4333-a333-333333333333',
    'Community Entrepreneurship & Equity Fund',
    'Community',
    'Grant assistance for underrepresented founders, local community enterprises, and youth-led innovation initiatives.',
    10000.00,
    'Community-oriented business proposal with clear local economic impact statement.',
    NOW() + INTERVAL '120 days',
    'active',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60'
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Grant Applications
CREATE TABLE IF NOT EXISTS public.grant_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_program_id UUID NOT NULL REFERENCES public.grant_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_number VARCHAR(20) NOT NULL UNIQUE,
  project_title VARCHAR(150) NOT NULL,
  requested_amount NUMERIC(12, 2) NOT NULL CHECK (requested_amount > 0),
  proposal_summary TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'awarded')),
  documents JSONB DEFAULT '[]'::jsonb,
  admin_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.grant_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own grant apps" ON public.grant_applications;
CREATE POLICY "Users can view own grant apps" ON public.grant_applications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create grant apps" ON public.grant_applications;
CREATE POLICY "Users can create grant apps" ON public.grant_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage grant apps" ON public.grant_applications;
CREATE POLICY "Admins can manage grant apps" ON public.grant_applications
  FOR ALL USING (public.is_admin(auth.uid()));

-- 6. Trigger for Automatic Grant Fund Dispensing & User Notification
CREATE OR REPLACE FUNCTION public.handle_grant_disbursement()
RETURNS TRIGGER AS $$
DECLARE
  v_account_id UUID;
  v_current_balance NUMERIC(15, 2);
  v_new_balance NUMERIC(15, 2);
  v_ref TEXT;
BEGIN
  -- Trigger only when status transitions to 'approved' or 'awarded' from any other status
  IF (NEW.status IN ('approved', 'awarded')) AND (OLD.status IS NULL OR OLD.status NOT IN ('approved', 'awarded')) THEN
    
    -- Find user's savings account (fallback to any account)
    SELECT id, balance INTO v_account_id, v_current_balance
    FROM public.accounts
    WHERE user_id = NEW.user_id AND account_type = 'savings'
    LIMIT 1;

    IF v_account_id IS NULL THEN
      SELECT id, balance INTO v_account_id, v_current_balance
      FROM public.accounts
      WHERE user_id = NEW.user_id
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;

    -- Dispense funds to account if found
    IF v_account_id IS NOT NULL THEN
      v_new_balance := COALESCE(v_current_balance, 0) + NEW.requested_amount;

      UPDATE public.accounts
      SET balance = v_new_balance,
          updated_at = NOW()
      WHERE id = v_account_id;

      v_ref := 'GRT-' || UPPER(SUBSTR(GEN_RANDOM_UUID()::TEXT, 1, 8));

      INSERT INTO public.transactions (
        user_id,
        account_id,
        type,
        amount,
        balance_after,
        description,
        reference,
        status
      ) VALUES (
        NEW.user_id,
        v_account_id,
        'credit',
        NEW.requested_amount,
        v_new_balance,
        'Grant Funding Disbursement: ' || NEW.project_title,
        v_ref,
        'completed'
      );
    END IF;

    -- Dispatch real-time user notification
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type
    ) VALUES (
      NEW.user_id,
      'Grant Application Approved!',
      'Congratulations! Your grant application for "' || NEW.project_title || '" has been ' || NEW.status || '. Grant funds of $' || TRIM(TO_CHAR(NEW.requested_amount, '999,999,999.00')) || ' have been credited to your savings account.',
      'success'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_grant_disbursement ON public.grant_applications;
CREATE TRIGGER trg_grant_disbursement
  AFTER UPDATE OF status ON public.grant_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_grant_disbursement();
