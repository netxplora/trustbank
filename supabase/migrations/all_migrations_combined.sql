-- ============================================================
-- TrustBank Portal — Full Database Migration
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- ========================
-- 1. ENUMS
-- ========================
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'support_admin', 'super_admin');

-- ========================
-- 2. TABLES
-- ========================

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  first_name text,
  last_name text,
  email text,
  phone text,
  bvn text,
  avatar_url text,
  account_number text,
  address text,
  kyc_status text NOT NULL DEFAULT 'not_started',
  account_status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- ACCOUNTS
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number text NOT NULL,
  account_type text NOT NULL DEFAULT 'checking',
  balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  balance_after numeric,
  description text,
  reference text,
  recipient_name text,
  recipient_account text,
  recipient_bank text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- TRANSFERS
CREATE TABLE public.transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  to_account_number text NOT NULL,
  to_name text,
  to_bank text,
  amount numeric NOT NULL,
  narration text,
  reference text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- BENEFICIARIES
CREATE TABLE public.beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  account_number text NOT NULL,
  bank text NOT NULL,
  nickname text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CARDS
CREATE TABLE public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_number text NOT NULL,
  card_type text NOT NULL DEFAULT 'debit',
  card_brand text NOT NULL DEFAULT 'Visa',
  cardholder_name text NOT NULL,
  expiry_date text NOT NULL,
  cvv text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  is_frozen boolean NOT NULL DEFAULT false,
  online_enabled boolean NOT NULL DEFAULT true,
  international_enabled boolean NOT NULL DEFAULT false,
  spending_limit numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- LOANS
CREATE TABLE public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  tenure_months integer NOT NULL,
  interest_rate numeric NOT NULL DEFAULT 5.0,
  monthly_payment numeric,
  outstanding_balance numeric,
  total_repaid numeric NOT NULL DEFAULT 0,
  purpose text,
  status text NOT NULL DEFAULT 'pending',
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- KYC DOCUMENTS
CREATE TABLE public.kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_number text,
  first_name text,
  file_url text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CONVERSATIONS (Support Chat)
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text,
  status text NOT NULL DEFAULT 'open',
  assigned_admin uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- MESSAGES
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'user',
  content text,
  file_url text,
  read boolean NOT NULL DEFAULT false,
  delivered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- PAYMENTS
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  payment_type text NOT NULL,
  amount numeric NOT NULL,
  provider text,
  phone_or_reference text,
  reference text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CRYPTO WALLETS (Admin-managed deposit addresses)
CREATE TABLE public.crypto_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cryptocurrency text NOT NULL,
  wallet_address text NOT NULL,
  network text,
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CRYPTO DEPOSITS
CREATE TABLE public.crypto_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES public.crypto_wallets(id) ON DELETE CASCADE,
  amount numeric,
  tx_hash text,
  proof_url text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- FAQs
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CMS PAGES
CREATE TABLE public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  seo_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CMS PRODUCTS
CREATE TABLE public.cms_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  features text[] NOT NULL DEFAULT '{}',
  interest_rate numeric,
  fee numeric,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CMS SITE SETTINGS
CREATE TABLE public.cms_site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

-- ========================
-- 3. FUNCTIONS
-- ========================

-- Generate random 10-digit account number
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS text AS $$
BEGIN
  RETURN lpad(floor(random() * 10000000000)::bigint::text, 10, '0');
END;
$$ LANGUAGE plpgsql;

-- Check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if a user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin', 'support_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================
-- 4. TRIGGERS
-- ========================

-- Auto-create profile + default account on user signup
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

  -- Create default checking account
  INSERT INTO public.accounts (user_id, account_number, account_type, balance)
  VALUES (NEW.id, new_account_number, 'checking', 0);

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_crypto_wallets_updated_at BEFORE UPDATE ON public.crypto_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_crypto_deposits_updated_at BEFORE UPDATE ON public.crypto_deposits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_cms_pages_updated_at BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_cms_products_updated_at BEFORE UPDATE ON public.cms_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ========================
-- 5. ROW LEVEL SECURITY (RLS)
-- ========================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_site_settings ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin(auth.uid()));

-- ---- USER ROLES ----
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));

-- ---- ACCOUNTS ----
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all accounts" ON public.accounts FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage all accounts" ON public.accounts FOR ALL USING (public.is_admin(auth.uid()));

-- ---- TRANSACTIONS ----
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage transactions" ON public.transactions FOR ALL USING (public.is_admin(auth.uid()));

-- ---- TRANSFERS ----
CREATE POLICY "Users can view own transfers" ON public.transfers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transfers" ON public.transfers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transfers" ON public.transfers FOR SELECT USING (public.is_admin(auth.uid()));

-- ---- BENEFICIARIES ----
CREATE POLICY "Users can manage own beneficiaries" ON public.beneficiaries FOR ALL USING (auth.uid() = user_id);

-- ---- CARDS ----
CREATE POLICY "Users can view own cards" ON public.cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON public.cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all cards" ON public.cards FOR ALL USING (public.is_admin(auth.uid()));

-- ---- LOANS ----
CREATE POLICY "Users can view own loans" ON public.loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own loans" ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all loans" ON public.loans FOR ALL USING (public.is_admin(auth.uid()));

-- ---- KYC DOCUMENTS ----
CREATE POLICY "Users can view own kyc" ON public.kyc_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kyc" ON public.kyc_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all kyc" ON public.kyc_documents FOR ALL USING (public.is_admin(auth.uid()));

-- ---- NOTIFICATIONS ----
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (public.is_admin(auth.uid()));

-- ---- CONVERSATIONS ----
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all conversations" ON public.conversations FOR ALL USING (public.is_admin(auth.uid()));

-- ---- MESSAGES ----
CREATE POLICY "Users can view messages in own conversations" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can insert messages in own conversations" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can update messages in own conversations" ON public.messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all messages" ON public.messages FOR ALL USING (public.is_admin(auth.uid()));

-- ---- PAYMENTS ----
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL USING (public.is_admin(auth.uid()));

-- ---- CRYPTO WALLETS (public read, admin write) ----
CREATE POLICY "Anyone can view enabled wallets" ON public.crypto_wallets FOR SELECT USING (enabled = true);
CREATE POLICY "Admins can manage crypto wallets" ON public.crypto_wallets FOR ALL USING (public.is_admin(auth.uid()));

-- ---- CRYPTO DEPOSITS ----
CREATE POLICY "Users can view own deposits" ON public.crypto_deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deposits" ON public.crypto_deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all deposits" ON public.crypto_deposits FOR ALL USING (public.is_admin(auth.uid()));

-- ---- FAQS (public read, admin write) ----
CREATE POLICY "Anyone can view active faqs" ON public.faqs FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage faqs" ON public.faqs FOR ALL USING (public.is_admin(auth.uid()));

-- ---- AUDIT LOGS (admin only) ----
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- ---- CMS PAGES (public read published, admin write) ----
CREATE POLICY "Anyone can view published pages" ON public.cms_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage cms pages" ON public.cms_pages FOR ALL USING (public.is_admin(auth.uid()));

-- ---- CMS PRODUCTS (public read active, admin write) ----
CREATE POLICY "Anyone can view active products" ON public.cms_products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage cms products" ON public.cms_products FOR ALL USING (public.is_admin(auth.uid()));

-- ---- CMS SITE SETTINGS (public read, admin write) ----
CREATE POLICY "Anyone can view site settings" ON public.cms_site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage site settings" ON public.cms_site_settings FOR ALL USING (public.is_admin(auth.uid()));

-- ========================
-- 6. STORAGE BUCKETS
-- ========================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc_documents', 'kyc_documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('chat_attachments', 'chat_attachments', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('cms_media', 'cms_media', true);

-- Storage Policies: Avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Storage Policies: KYC Documents
CREATE POLICY "Users can upload own kyc docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc_documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own kyc docs" ON storage.objects FOR SELECT USING (bucket_id = 'kyc_documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all kyc docs" ON storage.objects FOR SELECT USING (bucket_id = 'kyc_documents' AND public.is_admin(auth.uid()));

-- Storage Policies: Chat Attachments
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat_attachments' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view chat files" ON storage.objects FOR SELECT USING (bucket_id = 'chat_attachments' AND auth.role() = 'authenticated');

-- Storage Policies: CMS Media
CREATE POLICY "Anyone can view cms media" ON storage.objects FOR SELECT USING (bucket_id = 'cms_media');
CREATE POLICY "Admins can manage cms media" ON storage.objects FOR ALL USING (bucket_id = 'cms_media' AND public.is_admin(auth.uid()));

-- ========================
-- 7. REALTIME
-- ========================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- ========================
-- MIGRATION COMPLETE
-- ========================

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'support_admin', 'super_admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is any admin type
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'support_admin', 'super_admin')
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  bvn TEXT,
  avatar_url TEXT,
  account_number TEXT UNIQUE,
  kyc_status TEXT NOT NULL DEFAULT 'not_started' CHECK (kyc_status IN ('not_started','pending','approved','rejected')),
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active','frozen','blocked','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Accounts table
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_number TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL DEFAULT 'savings' CHECK (account_type IN ('savings','current','fixed_deposit','domiciliary')),
  balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','frozen','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit','debit','transfer','payment','deposit','withdrawal','loan_disbursement','loan_repayment')),
  amount NUMERIC(15,2) NOT NULL,
  balance_after NUMERIC(15,2),
  description TEXT,
  reference TEXT UNIQUE DEFAULT ('TXN-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  recipient_name TEXT,
  recipient_account TEXT,
  recipient_bank TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','reversed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transfers table
CREATE TABLE public.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_account_id UUID REFERENCES public.accounts(id),
  to_account_number TEXT NOT NULL,
  to_bank TEXT,
  to_name TEXT,
  amount NUMERIC(15,2) NOT NULL,
  narration TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  reference TEXT UNIQUE DEFAULT ('TRF-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('airtime','data','electricity','tv','water','internet','other')),
  provider TEXT,
  amount NUMERIC(15,2) NOT NULL,
  phone_or_reference TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed')),
  reference TEXT UNIQUE DEFAULT ('PAY-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Loans table
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  tenure_months INTEGER NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  monthly_payment NUMERIC(15,2),
  total_repaid NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  outstanding_balance NUMERIC(15,2),
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','active','rejected','completed','defaulted')),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Cards table
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_number TEXT NOT NULL,
  card_type TEXT NOT NULL DEFAULT 'virtual' CHECK (card_type IN ('virtual','physical')),
  card_brand TEXT NOT NULL DEFAULT 'Visa' CHECK (card_brand IN ('Visa','Mastercard')),
  expiry_date TEXT NOT NULL,
  cvv TEXT NOT NULL,
  cardholder_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','blocked','expired')),
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  spending_limit NUMERIC(15,2) DEFAULT 500000.00,
  online_enabled BOOLEAN NOT NULL DEFAULT true,
  international_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- KYC Documents table
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('bvn','nin','passport','drivers_license','utility_bill','voter_card')),
  document_number TEXT,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error','transaction','security','kyc','loan','card')),
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Crypto Wallets (admin-managed)
CREATE TABLE public.crypto_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cryptocurrency TEXT NOT NULL,
  network TEXT,
  wallet_address TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;

-- Crypto Deposits
CREATE TABLE public.crypto_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wallet_id UUID REFERENCES public.crypto_wallets(id) NOT NULL,
  amount NUMERIC(18,8),
  tx_hash TEXT,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crypto_deposits ENABLE ROW LEVEL SECURITY;

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending','resolved','closed')),
  assigned_admin UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'user' CHECK (sender_role IN ('user','admin','support_admin')),
  content TEXT,
  file_url TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  delivered BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- FAQs
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============= RLS POLICIES =============

-- user_roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));

-- profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin(auth.uid()));

-- accounts policies
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all accounts" ON public.accounts FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage accounts" ON public.accounts FOR ALL USING (public.is_admin(auth.uid()));

-- transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage transactions" ON public.transactions FOR ALL USING (public.is_admin(auth.uid()));

-- transfers policies
CREATE POLICY "Users can view own transfers" ON public.transfers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create transfers" ON public.transfers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transfers" ON public.transfers FOR SELECT USING (public.is_admin(auth.uid()));

-- payments policies
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (public.is_admin(auth.uid()));

-- loans policies
CREATE POLICY "Users can view own loans" ON public.loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can apply for loans" ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all loans" ON public.loans FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage loans" ON public.loans FOR UPDATE USING (public.is_admin(auth.uid()));

-- cards policies
CREATE POLICY "Users can view own cards" ON public.cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own cards" ON public.cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can request cards" ON public.cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all cards" ON public.cards FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage cards" ON public.cards FOR UPDATE USING (public.is_admin(auth.uid()));

-- kyc_documents policies
CREATE POLICY "Users can view own kyc" ON public.kyc_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit kyc" ON public.kyc_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all kyc" ON public.kyc_documents FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can review kyc" ON public.kyc_documents FOR UPDATE USING (public.is_admin(auth.uid()));

-- notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- crypto_wallets policies
CREATE POLICY "Authenticated can view enabled wallets" ON public.crypto_wallets FOR SELECT TO authenticated USING (enabled = true);
CREATE POLICY "Admins can manage wallets" ON public.crypto_wallets FOR ALL USING (public.is_admin(auth.uid()));

-- crypto_deposits policies
CREATE POLICY "Users can view own deposits" ON public.crypto_deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create deposits" ON public.crypto_deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all deposits" ON public.crypto_deposits FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage deposits" ON public.crypto_deposits FOR UPDATE USING (public.is_admin(auth.uid()));

-- conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all conversations" ON public.conversations FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update conversations" ON public.conversations FOR UPDATE USING (public.is_admin(auth.uid()));

-- messages policies
CREATE POLICY "Users can view messages in own conversations" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR public.is_admin(auth.uid())))
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Message recipients can update read status" ON public.messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR public.is_admin(auth.uid())))
);

-- faqs policies
CREATE POLICY "Anyone can view active faqs" ON public.faqs FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage faqs" ON public.faqs FOR ALL USING (public.is_admin(auth.uid()));

-- audit_logs policies
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============= TRIGGERS =============

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crypto_wallets_updated_at BEFORE UPDATE ON public.crypto_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crypto_deposits_updated_at BEFORE UPDATE ON public.crypto_deposits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  acct_num TEXT;
BEGIN
  acct_num := '30' || lpad(floor(random() * 100000000)::text, 8, '0');
  
  INSERT INTO public.profiles (user_id, email, first_name, last_name, display_name, account_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    acct_num
  );
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  INSERT INTO public.accounts (user_id, account_number, account_type, balance)
  VALUES (NEW.id, acct_num, 'savings', 0.00);
  
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (NEW.id, 'Welcome to TrustBank!', 'Your account has been created successfully. Complete your KYC to unlock all features.', 'info');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generate account number function
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS TEXT AS $$
BEGIN
  RETURN '30' || lpad(floor(random() * 100000000)::text, 8, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============= REALTIME =============
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crypto_deposits;

-- ============= INDEXES =============
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transfers_user_id ON public.transfers(user_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_loans_user_id ON public.loans(user_id);
CREATE INDEX idx_cards_user_id ON public.cards(user_id);
CREATE INDEX idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_crypto_deposits_user_id ON public.crypto_deposits(user_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);

DROP POLICY "Authenticated can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert own audit logs" ON public.audit_logs 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Create beneficiaries table
CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  account_number TEXT NOT NULL,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='beneficiaries' AND policyname='Users can view own beneficiaries') THEN
    CREATE POLICY "Users can view own beneficiaries" ON public.beneficiaries FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='beneficiaries' AND policyname='Users can insert own beneficiaries') THEN
    CREATE POLICY "Users can insert own beneficiaries" ON public.beneficiaries FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='beneficiaries' AND policyname='Users can delete own beneficiaries') THEN
    CREATE POLICY "Users can delete own beneficiaries" ON public.beneficiaries FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='beneficiaries' AND policyname='Admins can view all beneficiaries') THEN
    CREATE POLICY "Admins can view all beneficiaries" ON public.beneficiaries FOR SELECT USING (is_admin(auth.uid()));
  END IF;
END $$;

-- Add address to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- Enable realtime on tables not already in the publication
DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['transactions','notifications','messages','conversations','cards','loans','kyc_documents']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
-- Create CMS Tables if they do not exist
CREATE TABLE IF NOT EXISTS public.cms_site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cms_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'News',
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cms_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  city TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default public rates
INSERT INTO public.cms_site_settings (key, value) VALUES (
  'public_rates',
  '{
    "savings_apy": 4.75,
    "cd_12mo_apy": 5.15,
    "personal_loan_apr": 6.99,
    "mortgage_30yr_apr": 6.25
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Seed default testimonials
INSERT INTO public.cms_testimonials (name, role, city, rating, text, photo_url) VALUES
('Sarah Jenkins', 'Financial Analyst', 'Boston, MA', 5, 'Switching my investment portfolio to TrustBank has been the best choice for my retirement planning. The platform interface is clean and straightforward.', '/assets/home/testimonial-1.jpg'),
('David Vance', 'Real Estate Agent', 'Austin, TX', 5, 'The e-statement download and payee systems are incredibly seamless. The loan calculator let me estimate my payments and secure a commercial loan within days.', '/assets/home/testimonial-2.jpg'),
('Maria Rodriguez', 'Small Business Owner', 'Miami, FL', 5, 'Managing scheduled payroll and payments for my store is finally stress-free. The recurring bill pay option has completely automated our bills.', '/assets/home/testimonial-3.jpg')
ON CONFLICT DO NOTHING;

-- Seed default posts
INSERT INTO public.cms_posts (title, summary, content, image_url, category) VALUES
('Navigating the 2026 Interest Rate Environment', 'What the Fed changes mean for your high-yield savings account and CD options.', 'As interest rates shift globally, securing yield becomes crucial. We break down the top strategy tools to lock in APYs with certificates of deposit and high-yield checks.', '/assets/home/news-1.jpg', 'Market Outlook'),
('Protecting Your Wealth Against Fraud', 'Essential tips to secure your mobile device and monitor account activity.', 'With online fraud becoming highly advanced, multi-factor verification, device biometrics, and active alert systems remain your primary shields.', '/assets/home/news-2.jpg', 'Security'),
('The Growth of Digital Investment Accounts', 'How self-directed brokerage options allow flexible retirement planning.', 'Traditional portfolios are transforming. Read about building tax-sheltered investment accounts to compound your returns efficiently.', '/assets/home/news-3.jpg', 'Investing')
ON CONFLICT DO NOTHING;

-- Create Investments Tables
CREATE TABLE IF NOT EXISTS public.investment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('brokerage', 'ira_traditional', 'ira_roth')),
  account_number TEXT UNIQUE NOT NULL,
  balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  cash_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.investment_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.investment_accounts(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC(12,4) NOT NULL DEFAULT 0.0000,
  avg_cost NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  current_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  asset_class TEXT NOT NULL CHECK (asset_class IN ('stock', 'etf', 'bond', 'mutual_fund')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (account_id, symbol)
);

CREATE TABLE IF NOT EXISTS public.investment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.investment_accounts(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity NUMERIC(12,4) NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit')),
  limit_price NUMERIC(15,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled')),
  filled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Statements & Tax Documents
CREATE TABLE IF NOT EXISTS public.account_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  opening_balance NUMERIC(15,2) NOT NULL,
  closing_balance NUMERIC(15,2) NOT NULL,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  form_type TEXT NOT NULL CHECK (form_type IN ('1099-INT', '1099-DIV', '1098')),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Payees & Scheduled Payments
CREATE TABLE IF NOT EXISTS public.payees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nickname TEXT,
  payee_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('utility', 'credit_card', 'mortgage', 'insurance', 'telecom', 'other')),
  account_number_masked TEXT NOT NULL,
  address JSONB,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('ach', 'check')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scheduled_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payee_id UUID REFERENCES public.payees(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('once', 'weekly', 'monthly')),
  next_run_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Triggers for updated_at column
CREATE TRIGGER update_cms_site_settings_updated_at BEFORE UPDATE ON public.cms_site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_posts_updated_at BEFORE UPDATE ON public.cms_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_investment_accounts_updated_at BEFORE UPDATE ON public.investment_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_investment_holdings_updated_at BEFORE UPDATE ON public.investment_holdings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_investment_orders_updated_at BEFORE UPDATE ON public.investment_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.cms_site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_payments ENABLE ROW LEVEL SECURITY;

-- CMS Policies
CREATE POLICY "Public Read for CMS Site Settings" ON public.cms_site_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admin Write for CMS Site Settings" ON public.cms_site_settings FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Public Read for CMS Posts" ON public.cms_posts FOR SELECT TO public USING (true);
CREATE POLICY "Admin Write for CMS Posts" ON public.cms_posts FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Public Read for CMS Testimonials" ON public.cms_testimonials FOR SELECT TO public USING (true);
CREATE POLICY "Admin Write for CMS Testimonials" ON public.cms_testimonials FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Investment Policies
CREATE POLICY "User View Own Investment Accounts" ON public.investment_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin View All Investment Accounts" ON public.investment_accounts FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin Manage Investment Accounts" ON public.investment_accounts FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "User View Own Investment Holdings" ON public.investment_holdings FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.investment_accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
);
CREATE POLICY "Admin View All Investment Holdings" ON public.investment_holdings FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin Manage Investment Holdings" ON public.investment_holdings FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "User Create/View Own Investment Orders" ON public.investment_orders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.investment_accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
);
CREATE POLICY "User Insert Own Investment Orders" ON public.investment_orders FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.investment_accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
);
CREATE POLICY "Admin View All Investment Orders" ON public.investment_orders FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin Manage Investment Orders" ON public.investment_orders FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- eStatements Policies
CREATE POLICY "User View Own Account Statements" ON public.account_statements FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
);
CREATE POLICY "Admin Manage Account Statements" ON public.account_statements FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "User View Own Tax Documents" ON public.tax_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin Manage Tax Documents" ON public.tax_documents FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Payees & Scheduled Payments Policies
CREATE POLICY "User Manage Own Payees" ON public.payees FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin View All Payees" ON public.payees FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "User Manage Own Scheduled Payments" ON public.scheduled_payments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
);
CREATE POLICY "Admin View All Scheduled Payments" ON public.scheduled_payments FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Realtime Publication Additions
ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_holdings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.account_statements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tax_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_payments;

-- SECURITY DEFINER order execution function
CREATE OR REPLACE FUNCTION public.execute_order(order_id UUID, fill_price NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_user_id UUID;
  v_symbol TEXT;
  v_side TEXT;
  v_quantity NUMERIC;
  v_cost NUMERIC;
  v_cash NUMERIC;
  v_holding_id UUID;
  v_holding_quantity NUMERIC;
  v_holding_cost NUMERIC;
  v_asset_class TEXT;
  v_order_status TEXT;
BEGIN
  -- Get order details
  SELECT account_id, symbol, side, quantity, status
  INTO v_account_id, v_symbol, v_side, v_quantity, v_order_status
  FROM public.investment_orders
  WHERE id = order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order_status <> 'pending' THEN
    RAISE EXCEPTION 'Order is not in pending status';
  END IF;

  -- Get account details
  SELECT user_id, cash_balance
  INTO v_user_id, v_cash
  FROM public.investment_accounts
  WHERE id = v_account_id;

  v_cost := v_quantity * fill_price;

  -- Check if symbol is a bond or etf or stock
  IF v_symbol IN ('SHY', 'TLT', 'BND', 'AGG') THEN
    v_asset_class := 'bond';
  ELSIF v_symbol IN ('SPY', 'VOO', 'QQQ', 'IWM', 'VTI') THEN
    v_asset_class := 'etf';
  ELSE
    v_asset_class := 'stock';
  END IF;

  IF v_side = 'buy' THEN
    -- Validate cash
    IF v_cash < v_cost THEN
      RAISE EXCEPTION 'Sufficient cash balance not available';
    END IF;

    -- Update account cash
    UPDATE public.investment_accounts
    SET cash_balance = cash_balance - v_cost,
        balance = balance - v_cost
    WHERE id = v_account_id;

    -- Update or insert holding
    SELECT id, quantity, avg_cost
    INTO v_holding_id, v_holding_quantity, v_holding_cost
    FROM public.investment_holdings
    WHERE account_id = v_account_id AND symbol = v_symbol;

    IF FOUND THEN
      UPDATE public.investment_holdings
      SET quantity = quantity + v_quantity,
          avg_cost = ((v_holding_quantity * v_holding_cost) + v_cost) / (v_holding_quantity + v_quantity),
          current_price = fill_price,
          updated_at = now()
      WHERE id = v_holding_id;
    ELSE
      INSERT INTO public.investment_holdings (account_id, symbol, name, quantity, avg_cost, current_price, asset_class)
      VALUES (v_account_id, v_symbol, v_symbol, v_quantity, fill_price, fill_price, v_asset_class);
    END IF;

  ELSIF v_side = 'sell' THEN
    -- Check holding
    SELECT id, quantity, avg_cost
    INTO v_holding_id, v_holding_quantity, v_holding_cost
    FROM public.investment_holdings
    WHERE account_id = v_account_id AND symbol = v_symbol;

    IF NOT FOUND OR v_holding_quantity < v_quantity THEN
      RAISE EXCEPTION 'Insufficient holdings to execute sell order';
    END IF;

    -- Update account cash
    UPDATE public.investment_accounts
    SET cash_balance = cash_balance + v_cost,
        balance = balance + v_cost
    WHERE id = v_account_id;

    -- Update holding quantity
    IF v_holding_quantity = v_quantity THEN
      DELETE FROM public.investment_holdings WHERE id = v_holding_id;
    ELSE
      UPDATE public.investment_holdings
      SET quantity = quantity - v_quantity,
          current_price = fill_price,
          updated_at = now()
      WHERE id = v_holding_id;
    END IF;

  END IF;

  -- Update order
  UPDATE public.investment_orders
  SET status = 'filled',
      filled_at = now(),
      updated_at = now()
  WHERE id = order_id;

  -- Log transaction
  INSERT INTO public.transactions (user_id, type, amount, description, status)
  VALUES (
    v_user_id,
    'payment',
    v_cost,
    'Investment ' || upper(v_side) || ' - ' || v_symbol,
    'completed'
  );

  RETURN true;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.execute_order(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_order(UUID, NUMERIC) TO service_role;
-- Phase 8: Enterprise CMS & Brand Management Expansion

-- 1. Create Media Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media_assets', 'media_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for media_assets
-- Public read access
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media_assets');

-- Admin write access
CREATE POLICY "Admin Upload Access" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'media_assets' AND 
  public.is_admin(auth.uid())
);

CREATE POLICY "Admin Update Access" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'media_assets' AND 
  public.is_admin(auth.uid())
);

CREATE POLICY "Admin Delete Access" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'media_assets' AND 
  public.is_admin(auth.uid())
);


-- 2. Create CMS Pages Table
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER update_cms_pages_updated_at 
BEFORE UPDATE ON public.cms_pages 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

-- Policies for cms_pages
CREATE POLICY "Public Read for Published Pages" 
ON public.cms_pages FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admin All Access for Pages" 
ON public.cms_pages FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()));


-- 3. Create CMS Products Table
CREATE TABLE IF NOT EXISTS public.cms_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('checking', 'savings', 'loans', 'cards', 'investments', 'business')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  interest_rate NUMERIC(5,2),
  fee NUMERIC(10,2),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER update_cms_products_updated_at 
BEFORE UPDATE ON public.cms_products 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.cms_products ENABLE ROW LEVEL SECURITY;

-- Policies for cms_products
CREATE POLICY "Public Read for Active Products" 
ON public.cms_products FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin All Access for Products" 
ON public.cms_products FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()));


-- 4. Seed Default CMS Site Settings (Brand & Design)
INSERT INTO public.cms_site_settings (key, value) VALUES (
  'brand_identity',
  '{
    "platform_name": "Netxplora Global Banking",
    "short_name": "Netxplora",
    "slogan": "Secure Institutional Wealth Management",
    "description": "Enterprise-grade digital banking and asset management for high-net-worth clients.",
    "company_overview": "Netxplora provides tier-1 banking facilities and comprehensive wealth advisory services to institutions globally."
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.cms_site_settings (key, value) VALUES (
  'design_system',
  '{
    "colors": {
      "primary": "hsl(350, 65%, 38%)", 
      "secondary": "hsl(40, 60%, 50%)",
      "accent": "hsl(220, 20%, 30%)",
      "background": "hsl(0, 0%, 100%)",
      "foreground": "hsl(222, 47%, 11%)"
    },
    "typography": {
      "heading_font": "Poppins",
      "body_font": "Inter"
    },
    "radius": "0.5rem"
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.cms_site_settings (key, value) VALUES (
  'visual_assets',
  '{
    "primary_logo": "/assets/logo-B22.png",
    "favicon": "/favicon.ico",
    "hero_image": "/assets/hero-home.jpg"
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.cms_site_settings (key, value) VALUES (
  'corporate_info',
  '{
    "phone": "+1 (212) 555-0180",
    "email": "institutional@netxplora.com",
    "headquarters": "350 Fifth Avenue, Suite 4500, New York, NY 10118",
    "support_hours": "Monday - Friday, 8:00 AM - 6:00 PM EST"
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.cms_site_settings (key, value) VALUES (
  'seo_defaults',
  '{
    "meta_title": "Netxplora | Institutional Banking & Wealth Management",
    "meta_description": "Premier digital banking, global wire transfers, and corporate asset management facilities.",
    "og_image": "/assets/logo-B22.png"
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.cms_pages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cms_products;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
-- Migration: Phase 9 - KYC Storage Setup
-- Description: Creates the kyc_documents storage bucket and appropriate RLS policies.

-- 1. Create the kyc_documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc_documents', 'kyc_documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects if not already enabled (usually enabled by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2.5 Add file_url column to kyc_documents
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS file_url text;

-- 3. Policy: Users can upload their own KYC documents
-- The folder structure will be: {user_id}/{filename}
CREATE POLICY "Users can upload their own KYC documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'kyc_documents' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- 4. Policy: Users can view their own KYC documents
CREATE POLICY "Users can view their own KYC documents" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'kyc_documents' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- 5. Policy: Admins can view all KYC documents
CREATE POLICY "Admins can view all KYC documents" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'kyc_documents' AND 
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'support_admin')
    )
);
- -   M i g r a t i o n :   A d d   P e r f o r m a n c e   I n d e x e s  
 - -   P u r p o s e :   O p t i m i z e   d a t a b a s e   r e a d   q u e r i e s   f o r   f r e q u e n t l y   a c c e s s e d   d a t a  
  
 - -   C r e a t e   i n d e x   o n   u s e r _ i d   f o r   f a s t e r   l o o k u p s   i n   t h e   d a s h b o a r d  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ a c c o u n t s _ u s e r _ i d   O N   p u b l i c . a c c o u n t s   ( u s e r _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ t r a n s a c t i o n s _ u s e r _ i d   O N   p u b l i c . t r a n s a c t i o n s   ( u s e r _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ c a r d s _ u s e r _ i d   O N   p u b l i c . c a r d s   ( u s e r _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ l o a n s _ u s e r _ i d   O N   p u b l i c . l o a n s   ( u s e r _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ b e n e f i c i a r i e s _ u s e r _ i d   O N   p u b l i c . b e n e f i c i a r i e s   ( u s e r _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ k y c _ d o c u m e n t s _ u s e r _ i d   O N   p u b l i c . k y c _ d o c u m e n t s   ( u s e r _ i d ) ;  
  
 - -   C r e a t e   i n d e x   o n   c r e a t e d _ a t   f o r   f a s t e r   s o r t i n g   ( e . g .   r e c e n t   t r a n s a c t i o n s )  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ t r a n s a c t i o n s _ c r e a t e d _ a t   O N   p u b l i c . t r a n s a c t i o n s   ( c r e a t e d _ a t   D E S C ) ;  
  
 - -   C M S   p e r f o r m a n c e   i n d e x e s   f o r   p u b l i c   d a t a  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ c m s _ s i t e _ s e t t i n g s _ k e y   O N   p u b l i c . c m s _ s i t e _ s e t t i n g s   ( k e y ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ c m s _ f a q s _ c a t e g o r y   O N   p u b l i c . c m s _ f a q s   ( c a t e g o r y ) ;  
  
 - -   N o t i f y   P o s t g r e s   s t a t i s t i c s   e n g i n e   t o   a n a l y z e   a n d   u p d a t e   e x e c u t i o n   p l a n s  
 A N A L Y Z E   p u b l i c . a c c o u n t s ;  
 A N A L Y Z E   p u b l i c . t r a n s a c t i o n s ;  
 A N A L Y Z E   p u b l i c . c a r d s ;  
 A N A L Y Z E   p u b l i c . c m s _ s i t e _ s e t t i n g s ;  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   P h a s e   1 4 :   F i x   C a r d s   C o n s t r a i n t   a n d   R L S   R e a d   P o l i c i e s  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 - -   1 .   D r o p   t h e   r e s t r i c t i v e   c o n s t r a i n t   t h a t   w a s   b l o c k i n g   p r e m i u m   &   i n f i n i t e   c a r d   i n s e r t s  
 A L T E R   T A B L E   p u b l i c . c a r d s   D R O P   C O N S T R A I N T   I F   E X I S T S   c a r d s _ c a r d _ t y p e _ c h e c k ;  
  
 - -   2 .   R e - a d d   t h e   c o n s t r a i n t   w i t h   t h e   n e w l y   s u p p o r t e d   t i e r   n a m e s  
 A L T E R   T A B L E   p u b l i c . c a r d s   A D D   C O N S T R A I N T   c a r d s _ c a r d _ t y p e _ c h e c k    
 C H E C K   ( c a r d _ t y p e   I N   ( ' v i r t u a l ' ,   ' p h y s i c a l ' ,   ' d e b i t ' ,   ' p r e m i u m ' ,   ' i n f i n i t e ' ,   ' d i g i t a l ' ) ) ;  
  
 - -   3 .   A l l o w   u s e r s   t o   v i e w   t h e i r   o w n   c a r d s  
 D O   $ $  
 B E G I N  
         I F   N O T   E X I S T S   (  
                 S E L E C T   1   F R O M   p g _ p o l i c i e s    
                 W H E R E   t a b l e n a m e   =   ' c a r d s '   A N D   p o l i c y n a m e   =   ' U s e r s   c a n   v i e w   t h e i r   o w n   c a r d s '  
         )   T H E N  
                 C R E A T E   P O L I C Y   " U s e r s   c a n   v i e w   t h e i r   o w n   c a r d s "    
                 O N   p u b l i c . c a r d s    
                 F O R   S E L E C T    
                 T O   a u t h e n t i c a t e d    
                 U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d ) ;  
         E N D   I F ;  
 E N D   $ $ ;  
  
 - -   4 .   A l l o w   u s e r s   t o   u p d a t e   t h e i r   o w n   c a r d s   ( e . g .   f r e e z i n g / u n f r e e z i n g )  
 D O   $ $  
 B E G I N  
         I F   N O T   E X I S T S   (  
                 S E L E C T   1   F R O M   p g _ p o l i c i e s    
                 W H E R E   t a b l e n a m e   =   ' c a r d s '   A N D   p o l i c y n a m e   =   ' U s e r s   c a n   u p d a t e   t h e i r   o w n   c a r d s '  
         )   T H E N  
                 C R E A T E   P O L I C Y   " U s e r s   c a n   u p d a t e   t h e i r   o w n   c a r d s "    
                 O N   p u b l i c . c a r d s    
                 F O R   U P D A T E    
                 T O   a u t h e n t i c a t e d    
                 U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d )  
                 W I T H   C H E C K   ( a u t h . u i d ( )   =   u s e r _ i d ) ;  
         E N D   I F ;  
 E N D   $ $ ;  
 