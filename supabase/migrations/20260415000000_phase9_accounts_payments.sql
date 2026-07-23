-- ============================================================
-- Phase 9: Accounts & Payments Enhancements
-- Creates payment_sessions, current_account_applications, 
-- Storage configuration, and updates handle_new_user()
-- ============================================================

-- 1. Create payment_sessions table
CREATE TABLE IF NOT EXISTS public.payment_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    method text NOT NULL,
    reference text UNIQUE NOT NULL,
    status text NOT NULL DEFAULT 'pending_payment', -- pending_payment, awaiting_confirmation, under_review, approved, rejected, expired
    proof_url text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create current_account_applications table
CREATE TABLE IF NOT EXISTS public.current_account_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    occupation text NOT NULL,
    employer text NOT NULL,
    business_name text,
    income_range text NOT NULL,
    id_document_url text,
    utility_bill_url text,
    status text NOT NULL DEFAULT 'submitted', -- submitted, under_review, approved, rejected
    rejection_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Storage Bucket Creation (Idempotent)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true) 
ON CONFLICT (id) DO NOTHING;

-- 4. Update the handle_new_user trigger to default to 'savings'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_account_number text;
BEGIN
  -- Generate unique account number
  new_account_number := public.generate_account_number();

  -- Create profile
  INSERT INTO public.profiles (user_id, email, display_name, account_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    new_account_number
  );

  -- Create default SAVINGS account (Previously checking)
  INSERT INTO public.accounts (user_id, account_number, account_type, balance)
  VALUES (NEW.id, new_account_number, 'savings', 0);

  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Send welcome notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.id,
    'Welcome to TrustBank',
    'Your account has been created. Complete your KYC verification to unlock all features.',
    'info'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Set RLS Policies
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_account_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment sessions" ON public.payment_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment sessions" ON public.payment_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment sessions" ON public.payment_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own applications" ON public.current_account_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON public.current_account_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON public.current_account_applications FOR UPDATE USING (auth.uid() = user_id);

-- Storage Policies
CREATE POLICY "Public Document Access" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "User Document Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "User Document Update" ON storage.objects FOR UPDATE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "User Document Delete" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
