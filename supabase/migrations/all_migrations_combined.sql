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


-- ============================================================
-- TrustBank Portal — CMS & Brand Seed Data
-- Run this script in your Supabase SQL Editor after 001_full_schema.sql
-- ============================================================

-- ========================
-- 1. BRAND SETTINGS
-- ========================
INSERT INTO public.cms_site_settings (key, value) VALUES (
  'brand_identity',
  '{
    "platform_name": "TrustBank",
    "short_name": "TrustBank",
    "slogan": "Secure Institutional Wealth Management",
    "description": "Enterprise-grade digital banking and asset management for high-net-worth clients.",
    "company_overview": "TrustBank provides tier-1 banking facilities and comprehensive wealth advisory services to institutions globally."
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.cms_site_settings (key, value) VALUES (
  'design_system',
  '{
    "colors": {
      "primary": "hsl(222, 47%, 11%)", 
      "secondary": "hsl(217, 33%, 17%)",
      "accent": "hsl(40, 60%, 50%)",
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
    "primary_logo": "/assets/logo.png",
    "favicon": "/favicon.ico",
    "hero_image": "/assets/hero-home.jpg"
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.cms_site_settings (key, value) VALUES (
  'corporate_info',
  '{
    "phone": "+1 (800) 555-0199",
    "email": "institutional@trustbank.com",
    "headquarters": "Wall Street, New York, NY 10005",
    "support_hours": "Monday - Friday, 8:00 AM - 6:00 PM EST"
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ========================
-- 2. CMS PAGES
-- ========================
INSERT INTO public.cms_pages (slug, title, description, content_blocks, is_published)
VALUES 
(
  'home',
  'TrustBank | Institutional Banking',
  'Premier digital banking and corporate asset management facilities.',
  '[{"type": "hero", "title": "Secure Institutional Wealth Management"}, {"type": "features", "title": "Core Offerings"}]'::jsonb,
  true
),
(
  'about',
  'About TrustBank',
  'Learn about our history, regulatory compliance, and corporate governance.',
  '[{"type": "text", "content": "TrustBank was founded on the principles of security, discretion, and financial excellence."}]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_blocks = EXCLUDED.content_blocks,
  is_published = EXCLUDED.is_published;

-- ========================
-- 3. BANKING PRODUCTS
-- ========================
TRUNCATE TABLE public.cms_products CASCADE;

INSERT INTO public.cms_products (category, name, description, features, interest_rate, fee, display_order, is_active)
VALUES 
('checking', 'Private Client Checking', 'Premium transactional account for daily high-volume institutional operations.', '{"Dedicated Account Manager", "Unlimited Global Wires", "No Foreign Transaction Fees"}', 0.50, 0.00, 1, true),
('savings', 'Institutional Yield Reserve', 'High-yield cash management account designed for corporate treasuries.', '{"Tiered Interest Rates", "Same-Day Liquidity", "Automated Sweeps"}', 4.75, 0.00, 2, true),
('loans', 'Commercial Real Estate Credit', 'Flexible credit facilities for property acquisition and development.', '{"Up to $50M Capacity", "Custom Amortization", "Fixed & Variable Options"}', 6.25, 500.00, 3, true),
('investments', 'Direct Indexing Portfolio', 'Customizable algorithmic portfolios optimized for tax-loss harvesting.', '{"Algorithmic Trading", "Tax-Loss Harvesting", "ESG Filtering"}', null, 0.25, 4, true),
('cards', 'Corporate Executive Card', 'High-limit charge card for executive travel and procurement.', '{"$250k Monthly Limit", "Global Concierge", "Expense Management API"}', null, 500.00, 5, true);

-- ========================
-- 4. NEWS & INSIGHTS (POSTS)
-- ========================
CREATE TABLE IF NOT EXISTS public.cms_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'News',
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- 5. TESTIMONIALS & SUCCESS STORIES
-- ========================
CREATE TABLE IF NOT EXISTS public.cms_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  city TEXT,
  text TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.cms_testimonials (name, role, company, text, photo_url)
VALUES 
('Sarah Jenkins', 'President', 'Jenkins Logistics Group', 'Managing payroll structures and capital expenditure loans across multiple terminals was a operational obstacle. Moving our corporate credit files to TrustBank''s commercial lending team simplified our cash flow cycles.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120'),
('Dr. Amit Patel', 'Private Advisory Client', null, 'Their private wealth advisory team analyzed my family''s legacy assets and built a trust structure designed for capital protection. Direct access to our coordinator gives us security.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'),
('Marcus Thorne', 'Managing Director', 'Thorne Realty Partners', 'To close acquisitions in real estate, processing speed is critical. TrustBank structured an asset-backed commercial credit line that let me finalize acquisitions without equity liquidation.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120');

-- ========================
-- 6. FAQS
-- ========================
CREATE TABLE IF NOT EXISTS public.cms_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.cms_faqs (question, answer, category, display_order)
VALUES 
('What is your fiduciary standard?', 'TrustBank advisors operate under a strict fiduciary duty. This legal and ethical obligation mandates that we must always place your financial interests ahead of our own, eliminating conflicts of interest such as proprietary product pushing.', 'Advisory', 1),
('How are your advisory fees calculated?', 'Our management fees are calculated as an annualized percentage of the Assets Under Management (AUM). Fees are assessed and deducted on a pro-rata basis at the end of each calendar quarter.', 'Advisory', 2),
('Are there any hidden trading commissions?', 'No. For clients enrolled in our advisory tiers, all standard equity and ETF trading commissions are absorbed by TrustBank. You pay only the transparent, flat AUM fee.', 'Advisory', 3),
('Is my investment portfolio insured?', 'Investments are not FDIC-insured. However, your securities are held by TrustBank Securities Inc., a Member of SIPC, which protects securities customers of its members up to $500,000 in the event of broker-dealer failure.', 'Advisory', 4);

-- ========================
-- 7. BILL PAY (MISSING TABLES FIX)
-- ========================
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
  frequency TEXT NOT NULL CHECK (frequency IN ('one_time', 'weekly', 'bi_weekly', 'monthly')),
  next_payment_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_payments ENABLE ROW LEVEL SECURITY;

-- Payees & Scheduled Payments Policies
DROP POLICY IF EXISTS "User Manage Own Payees" ON public.payees;
CREATE POLICY "User Manage Own Payees" ON public.payees FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin View All Payees" ON public.payees;
CREATE POLICY "Admin View All Payees" ON public.payees FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "User Manage Own Scheduled Payments" ON public.scheduled_payments;
CREATE POLICY "User Manage Own Scheduled Payments" ON public.scheduled_payments FOR ALL TO authenticated USING (
  payee_id IN (SELECT id FROM public.payees WHERE user_id = auth.uid())
) WITH CHECK (
  payee_id IN (SELECT id FROM public.payees WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admin View All Scheduled Payments" ON public.scheduled_payments;
CREATE POLICY "Admin View All Scheduled Payments" ON public.scheduled_payments FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Assuming cms_posts exists from a previous migration
INSERT INTO public.cms_posts (title, summary, content, image_url, category, published_at)
VALUES 
('Navigating the 2026 Interest Rate Environment', 'What the Fed changes mean for your institutional cash reserves.', 'As interest rates shift globally, securing yield becomes crucial. We break down the top strategy tools to lock in APYs.', '/assets/news-1.jpg', 'Market Outlook', now()),
('Protecting Corporate Wealth Against Fraud', 'Essential tips to secure your treasury operations.', 'With online fraud becoming highly advanced, multi-factor verification, device biometrics, and active alert systems remain your primary shields.', '/assets/news-2.jpg', 'Security', now()),
('The Growth of Digital Investment Accounts', 'How self-directed brokerage options allow flexible corporate planning.', 'Traditional portfolios are transforming. Read about building tax-sheltered investment accounts to compound your returns efficiently.', '/assets/news-3.jpg', 'Investing', now());

-- ========================
-- 5. FAQs
-- ========================
TRUNCATE TABLE public.faqs CASCADE;

INSERT INTO public.faqs (question, answer, category, sort_order)
VALUES 
('How do I initiate an international wire?', 'International wires can be initiated directly from your dashboard under the Transfers section. Wires submitted before 3 PM EST process same-day.', 'Transactions', 1),
('What are the limits on commercial loans?', 'Our commercial credit facilities range from $1M to $50M, depending on your institutional profile and underwriting results.', 'Products', 2),
('How is my data secured?', 'We utilize AES-256 encryption at rest, TLS 1.3 in transit, and mandate FIDO2 hardware-backed authentication for all administrative actions.', 'Security', 3);



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


-- Create the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
DROP POLICY IF EXISTS "User Manage Own Payees" ON public.payees;
CREATE POLICY "User Manage Own Payees" ON public.payees FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin View All Payees" ON public.payees;
CREATE POLICY "Admin View All Payees" ON public.payees FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "User Manage Own Scheduled Payments" ON public.scheduled_payments;
CREATE POLICY "User Manage Own Scheduled Payments" ON public.scheduled_payments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admin View All Scheduled Payments" ON public.scheduled_payments;
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


-- Phase 7: Security & Audit Logging Enhancements

-- 1. Create a generic trigger function to log database actions
CREATE OR REPLACE FUNCTION public.log_database_action()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_action TEXT;
  v_entity_id TEXT;
  v_details JSONB;
  v_new_json JSONB;
  v_old_json JSONB;
BEGIN
  -- Attempt to get user ID from Supabase auth context
  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;
  
  -- Determine action type and extract entity data
  IF TG_OP = 'INSERT' THEN
    v_new_json := to_jsonb(NEW);
    v_action := 'db_insert';
    
    -- Try to extract ID (most tables have 'id' column, CMS settings has 'key')
    IF v_new_json ? 'id' THEN v_entity_id := v_new_json->>'id';
    ELSIF v_new_json ? 'key' THEN v_entity_id := v_new_json->>'key';
    ELSE v_entity_id := 'unknown'; END IF;
    
    v_details := jsonb_build_object('new', v_new_json);
    
    -- Fallback for user_id
    IF v_user_id IS NULL AND v_new_json ? 'user_id' THEN
       v_user_id := (v_new_json->>'user_id')::uuid;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    v_new_json := to_jsonb(NEW);
    v_old_json := to_jsonb(OLD);
    v_action := 'db_update';
    
    IF v_new_json ? 'id' THEN v_entity_id := v_new_json->>'id';
    ELSIF v_new_json ? 'key' THEN v_entity_id := v_new_json->>'key';
    ELSE v_entity_id := 'unknown'; END IF;
    
    v_details := jsonb_build_object('old', v_old_json, 'new', v_new_json);
    
    IF v_user_id IS NULL AND v_new_json ? 'user_id' THEN
       v_user_id := (v_new_json->>'user_id')::uuid;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_old_json := to_jsonb(OLD);
    v_action := 'db_delete';
    
    IF v_old_json ? 'id' THEN v_entity_id := v_old_json->>'id';
    ELSIF v_old_json ? 'key' THEN v_entity_id := v_old_json->>'key';
    ELSE v_entity_id := 'unknown'; END IF;
    
    v_details := jsonb_build_object('old', v_old_json);
    
    IF v_user_id IS NULL AND v_old_json ? 'user_id' THEN
       v_user_id := (v_old_json->>'user_id')::uuid;
    END IF;
  END IF;

  -- Create dummy UUID for system actions if no user found
  -- We use a known null/system UUID
  IF v_user_id IS NULL THEN
     v_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- Insert into audit_logs (append trigger prefix to distinguish from frontend logs)
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    v_user_id,
    'trigger_' || v_action,
    TG_TABLE_NAME,
    v_entity_id,
    v_details
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Attach triggers to critical tables
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();

DROP TRIGGER IF EXISTS audit_loans_trigger ON public.loans;
CREATE TRIGGER audit_loans_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();

DROP TRIGGER IF EXISTS audit_investments_trigger ON public.investment_orders;
CREATE TRIGGER audit_investments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.investment_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();

DROP TRIGGER IF EXISTS audit_cms_settings_trigger ON public.cms_site_settings;
CREATE TRIGGER audit_cms_settings_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.cms_site_settings
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();


-- 3. Add Performance Indexes for Audit Logs (to support fast filtering & pagination)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);


-- ============================================================
-- TrustBank Portal — Production Reset
-- Run this script to securely wipe all financial test data 
-- before production launch, while preserving admin accounts and CMS.
-- ============================================================

-- Safely clear all financial, conversational, and audit records
TRUNCATE TABLE 
  public.accounts,
  public.transactions,
  public.transfers,
  public.beneficiaries,
  public.cards,
  public.loans,
  public.kyc_documents,
  public.conversations,
  public.messages,
  public.investment_accounts,
  public.investment_holdings,
  public.investment_orders,
  public.notifications,
  public.audit_logs
CASCADE;

-- Note: CASCADE ensures that any dependent tables or foreign key 
-- relationships are respected and cleared alongside their parents.

-- Securely wipe ALL non-admin user profiles from auth.users.
-- Since the tables above (and public.profiles) are linked with 
-- ON DELETE CASCADE, this will safely purge all customer portfolios,
-- transactions, loans, and beneficiaries.

DELETE FROM auth.users 
WHERE id NOT IN (
  SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'super_admin')
);


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


-- ============================================================
-- Phase 10: Payment System Enhancements
-- Adds account_id and transaction_hash to payment_sessions
-- Creates payment_audit_logs table
-- ============================================================

-- 1. Add columns to payment_sessions
ALTER TABLE public.payment_sessions 
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS transaction_hash text;

-- 2. Create payment_audit_logs table
CREATE TABLE IF NOT EXISTS public.payment_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_session_id uuid NOT NULL REFERENCES public.payment_sessions(id) ON DELETE CASCADE,
    admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL, -- e.g., 'approved', 'rejected', 'requested_evidence'
    previous_status text,
    new_status text NOT NULL,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view payment audit logs"
    ON public.payment_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert payment audit logs"
    ON public.payment_audit_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );


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


-- ============================================================
-- Phase 11: Theme & Branding Engine Initialization
-- Updates the design_system CMS setting with comprehensive 
-- dark and light mode color arrays.
-- ============================================================

UPDATE public.cms_site_settings
SET value = '{
  "colors": {
    "primary": "#B4223A",
    "secondary": "#CC9933",
    "accent": "#3D4B66",
    "success": "#10B981",
    "warning": "#F59E0B",
    "error": "#EF4444",
    "info": "#3B82F6",
    "background": "#FFFFFF",
    "foreground": "#0F1626",
    "card": "#FFFFFF",
    "card_foreground": "#0F1626",
    "popover": "#FFFFFF",
    "popover_foreground": "#0F1626",
    "surface": "#F8FAFC",
    "surface_hover": "#F1F5F9",
    "muted": "#F1F5F9",
    "muted_foreground": "#64748B",
    "border": "#E2E8F0",
    "input": "#E2E8F0"
  },
  "dark_mode_colors": {
    "primary": "#D6334D",
    "secondary": "#CC9933",
    "accent": "#3D4B66",
    "success": "#10B981",
    "warning": "#F59E0B",
    "error": "#EF4444",
    "info": "#3B82F6",
    "background": "#0F1626",
    "foreground": "#F8FAFC",
    "card": "#1E293B",
    "card_foreground": "#F8FAFC",
    "popover": "#1E293B",
    "popover_foreground": "#F8FAFC",
    "surface": "#0F1626",
    "surface_hover": "#1E293B",
    "muted": "#1E293B",
    "muted_foreground": "#94A3B8",
    "border": "#334155",
    "input": "#334155"
  },
  "typography": {
    "heading_font": "Poppins",
    "body_font": "Inter"
  },
  "radius": "0.75rem",
  "shadows": {
    "elevated": "0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)",
    "card_hover": "0 20px 40px -15px rgba(180, 20, 40, 0.12), 0 1px 5px rgba(180, 20, 40, 0.04)"
  }
}'::jsonb
WHERE key = 'design_system';


-- Phase 12/14: Audit Log Verification for Core Banking Tables
-- This migration binds the existing generic audit logging trigger function
-- to the newly created banking infrastructure tables to ensure exhaustive auditing.
-- 0. Ensure the generic trigger function exists
CREATE OR REPLACE FUNCTION public.log_database_action()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_action TEXT;
  v_entity_id TEXT;
  v_details JSONB;
  v_new_json JSONB;
  v_old_json JSONB;
BEGIN
  -- Attempt to get user ID from Supabase auth context
  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;
  
  -- Determine action type and extract entity data
  IF TG_OP = 'INSERT' THEN
    v_new_json := to_jsonb(NEW);
    v_action := 'db_insert';
    
    -- Try to extract ID (most tables have 'id' column, CMS settings has 'key')
    IF v_new_json ? 'id' THEN v_entity_id := v_new_json->>'id';
    ELSIF v_new_json ? 'key' THEN v_entity_id := v_new_json->>'key';
    ELSE v_entity_id := 'unknown'; END IF;
    
    v_details := jsonb_build_object('new', v_new_json);
    
    -- Fallback for user_id
    IF v_user_id IS NULL AND v_new_json ? 'user_id' THEN
       v_user_id := (v_new_json->>'user_id')::uuid;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    v_new_json := to_jsonb(NEW);
    v_old_json := to_jsonb(OLD);
    v_action := 'db_update';
    
    IF v_new_json ? 'id' THEN v_entity_id := v_new_json->>'id';
    ELSIF v_new_json ? 'key' THEN v_entity_id := v_new_json->>'key';
    ELSE v_entity_id := 'unknown'; END IF;
    
    v_details := jsonb_build_object('old', v_old_json, 'new', v_new_json);
    
    IF v_user_id IS NULL AND v_new_json ? 'user_id' THEN
       v_user_id := (v_new_json->>'user_id')::uuid;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_old_json := to_jsonb(OLD);
    v_action := 'db_delete';
    
    IF v_old_json ? 'id' THEN v_entity_id := v_old_json->>'id';
    ELSIF v_old_json ? 'key' THEN v_entity_id := v_old_json->>'key';
    ELSE v_entity_id := 'unknown'; END IF;
    
    v_details := jsonb_build_object('old', v_old_json);
    
    IF v_user_id IS NULL AND v_old_json ? 'user_id' THEN
       v_user_id := (v_old_json->>'user_id')::uuid;
    END IF;
  END IF;

  -- Create dummy UUID for system actions if no user found
  -- We use a known null/system UUID
  IF v_user_id IS NULL THEN
     v_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- Insert into audit_logs (append trigger prefix to distinguish from frontend logs)
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    v_user_id,
    'trigger_' || v_action,
    TG_TABLE_NAME,
    v_entity_id,
    v_details
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Attach triggers to accounts
DROP TRIGGER IF EXISTS audit_accounts_trigger ON public.accounts;
CREATE TRIGGER audit_accounts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();

-- 2. Attach triggers to transactions
DROP TRIGGER IF EXISTS audit_transactions_trigger ON public.transactions;
CREATE TRIGGER audit_transactions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();

-- 3. Attach triggers to cards
DROP TRIGGER IF EXISTS audit_cards_trigger ON public.cards;
CREATE TRIGGER audit_cards_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();

-- 4. Attach triggers to payment_sessions
DROP TRIGGER IF EXISTS audit_payment_sessions_trigger ON public.payment_sessions;
CREATE TRIGGER audit_payment_sessions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_sessions
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();


-- Phase 14: TrustBank Theme System Redesign
-- Centralizes all colors globally to the new TrustBank Blue and Midnight Navy palette.

UPDATE public.cms_site_settings 
SET value = '{
    "colors": {
      "primary": "#0047FF",
      "secondary": "#071A3D",
      "accent": "#16C784",
      "success": "#16C784",
      "warning": "#F59E0B",
      "error": "#EF4444",
      "info": "#3B82F6",
      "background": "#F8FAFC",
      "foreground": "#0F172A",
      "card": "#FFFFFF",
      "card_foreground": "#0F172A",
      "popover": "#FFFFFF",
      "popover_foreground": "#0F172A",
      "surface": "#FFFFFF",
      "surface_hover": "#F1F5F9",
      "muted": "#CBD5E1",
      "muted_foreground": "#64748B",
      "border": "#E2E8F0",
      "input": "#E2E8F0"
    },
    "dark_mode_colors": {
      "primary": "#0047FF",
      "secondary": "#071A3D",
      "accent": "#16C784",
      "success": "#16C784",
      "warning": "#F59E0B",
      "error": "#EF4444",
      "info": "#3B82F6",
      "background": "#0B1220",
      "foreground": "#F8FAFC",
      "card": "#111827",
      "card_foreground": "#F8FAFC",
      "popover": "#111827",
      "popover_foreground": "#F8FAFC",
      "surface": "#111827",
      "surface_hover": "#1E293B",
      "muted": "#475569",
      "muted_foreground": "#94A3B8",
      "border": "#334155",
      "input": "#334155"
    },
    "typography": {
      "heading_font": "Poppins",
      "body_font": "Inter"
    },
    "radius": "0.75rem",
    "shadows": {
      "elevated": "0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)",
      "card_hover": "0 20px 40px -15px rgba(0, 71, 255, 0.12), 0 1px 5px rgba(0, 71, 255, 0.04)"
    }
  }'::jsonb
WHERE key = 'design_system';


-- ============================================================
-- Phase 10: Core Banking Logic and Security Hardening
-- ============================================================

-- 1. Trigger for Automated Balance Management
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status != 'completed') THEN
    IF NEW.type IN ('credit', 'deposit', 'loan_disbursement') THEN
      UPDATE public.accounts SET balance = balance + NEW.amount, updated_at = now() WHERE id = NEW.account_id;
    ELSIF NEW.type IN ('debit', 'withdrawal', 'fee', 'bill_payment') THEN
      UPDATE public.accounts SET balance = balance - NEW.amount, updated_at = now() WHERE id = NEW.account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_balance ON public.transactions;
CREATE TRIGGER trg_update_balance
AFTER INSERT OR UPDATE OF status ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_account_balance();

-- 2. Revoke Direct UPDATE on Accounts Balance from non-admins
-- (By redefining the RLS policy for accounts UPDATE)
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (
  auth.uid() = user_id 
  -- Users cannot modify their own balance or status
  AND balance = (SELECT balance FROM public.accounts WHERE id = id)
  AND status = (SELECT status FROM public.accounts WHERE id = id)
);

-- 3. Secure Transfer RPC
CREATE OR REPLACE FUNCTION public.process_transfer(
  p_user_id UUID,
  p_from_account_id UUID,
  p_to_account_number TEXT,
  p_amount NUMERIC,
  p_narration TEXT,
  p_to_name TEXT,
  p_to_bank TEXT
) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
  v_transfer_id UUID;
  v_internal_receiver_id UUID;
  v_internal_account_id UUID;
  v_reference TEXT;
  v_sender_name TEXT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  -- 1. Check Balance
  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_from_account_id AND user_id = p_user_id AND status = 'active';
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Source account not found or inactive';
  END IF;
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;
  
  -- 2. Generate Reference
  v_reference := 'TRF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));

  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = p_user_id;

  -- 3. Check if Internal Transfer (TrustBank)
  IF p_to_bank = 'TrustBank' OR p_to_bank IS NULL OR p_to_bank = '' THEN
    SELECT id, user_id INTO v_internal_account_id, v_internal_receiver_id FROM public.accounts WHERE account_number = p_to_account_number AND status = 'active';
    IF v_internal_account_id IS NULL THEN
       RAISE EXCEPTION 'Destination TrustBank account not found or inactive';
    END IF;
  END IF;

  -- 4. Create Transfer Record
  INSERT INTO public.transfers (user_id, from_account_id, to_account_number, to_name, to_bank, amount, narration, reference, status)
  VALUES (p_user_id, p_from_account_id, p_to_account_number, p_to_name, COALESCE(p_to_bank, 'TrustBank'), p_amount, p_narration, v_reference, 'completed')
  RETURNING id INTO v_transfer_id;

  -- 5. Create Debit Transaction (Trigger handles balance update)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, recipient_name, recipient_account, recipient_bank, status)
  VALUES (p_user_id, p_from_account_id, 'debit', p_amount, 'Transfer to ' || COALESCE(p_to_name, p_to_account_number), v_reference, p_to_name, p_to_account_number, COALESCE(p_to_bank, 'TrustBank'), 'completed');

  -- 6. Create Credit Transaction if Internal
  IF v_internal_account_id IS NOT NULL THEN
    INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
    VALUES (v_internal_receiver_id, v_internal_account_id, 'credit', p_amount, 'Transfer from ' || v_sender_name, v_reference, 'completed');
    
    -- Notify Receiver
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (v_internal_receiver_id, 'Funds Received', 'You received $' || p_amount || ' from ' || v_sender_name, 'success');
  END IF;
  
  -- 7. Audit Log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, 'transfer_executed', 'transfers', v_transfer_id::text, jsonb_build_object('amount', p_amount, 'to', p_to_account_number, 'bank', p_to_bank, 'ref', v_reference));

  RETURN json_build_object('success', true, 'transfer_id', v_transfer_id, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Secure Bill Payment RPC
CREATE OR REPLACE FUNCTION public.process_bill_payment(
  p_user_id UUID,
  p_account_id UUID,
  p_payee_name TEXT,
  p_category TEXT,
  p_amount NUMERIC,
  p_account_masked TEXT
) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
  v_reference TEXT;
  v_payment_id UUID;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;

  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_account_id AND user_id = p_user_id AND status = 'active';
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Account not found or inactive'; END IF;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;
  
  v_reference := 'BPY-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));

  -- Insert Payment Log
  INSERT INTO public.payments (user_id, account_id, payment_type, provider, amount, phone_or_reference, reference, status)
  VALUES (p_user_id, p_account_id, p_category, p_payee_name, p_amount, p_account_masked, v_reference, 'completed')
  RETURNING id INTO v_payment_id;

  -- Insert Debit Transaction (Trigger handles balance)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (p_user_id, p_account_id, 'bill_payment', p_amount, 'Bill Pay: ' || p_payee_name, v_reference, 'completed');

  -- Notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (p_user_id, 'Bill Payment Sent', '$' || p_amount || ' paid to ' || p_payee_name, 'transaction');

  -- Audit Log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, 'bill_payment_executed', 'payments', v_payment_id::text, jsonb_build_object('amount', p_amount, 'payee', p_payee_name, 'ref', v_reference));

  RETURN json_build_object('success', true, 'payment_id', v_payment_id, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Admin Approve Deposit RPC
CREATE OR REPLACE FUNCTION public.admin_approve_deposit(
  p_admin_id UUID,
  p_session_id UUID
) RETURNS JSON AS $$
DECLARE
  v_session RECORD;
  v_account_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Verify admin
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = p_admin_id AND role IN ('admin', 'super_admin')) INTO v_is_admin;
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_session FROM public.payment_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Session not found'; END IF;
  IF v_session.status = 'approved' THEN RAISE EXCEPTION 'Already approved'; END IF;

  -- Get target account
  IF v_session.account_id IS NOT NULL THEN
    v_account_id := v_session.account_id;
  ELSE
    SELECT id INTO v_account_id FROM public.accounts WHERE user_id = v_session.user_id AND status = 'active' ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF v_account_id IS NULL THEN RAISE EXCEPTION 'No active account found for user'; END IF;

  -- Update Session
  UPDATE public.payment_sessions SET status = 'approved', updated_at = now() WHERE id = p_session_id;

  -- Insert Transaction (Trigger adds to balance)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (v_session.user_id, v_account_id, 'deposit', v_session.amount, 'Deposit via ' || REPLACE(v_session.method, '_', ' '), v_session.reference, 'completed');

  -- Audit logs
  INSERT INTO public.payment_audit_logs (payment_session_id, admin_user_id, action, previous_status, new_status)
  VALUES (p_session_id, p_admin_id, 'approved', v_session.status, 'approved');

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_admin_id, 'admin_approved_deposit', 'payment_sessions', p_session_id::text, jsonb_build_object('user_id', v_session.user_id, 'amount', v_session.amount));

  -- Notify user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (v_session.user_id, 'Deposit Approved', 'Your deposit of $' || v_session.amount || ' has been approved and credited to your account.', 'success');

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Admin Approve Loan RPC
CREATE OR REPLACE FUNCTION public.admin_approve_loan(
  p_admin_id UUID,
  p_loan_id UUID
) RETURNS JSON AS $$
DECLARE
  v_loan RECORD;
  v_account_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = p_admin_id AND role IN ('admin', 'super_admin')) INTO v_is_admin;
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
  IF v_loan.status != 'pending' THEN RAISE EXCEPTION 'Loan is not pending'; END IF;

  -- Find checking account to disburse to
  SELECT id INTO v_account_id FROM public.accounts WHERE user_id = v_loan.user_id AND account_type = 'checking' AND status = 'active' LIMIT 1;
  IF v_account_id IS NULL THEN 
    -- Fallback to savings if no checking
    SELECT id INTO v_account_id FROM public.accounts WHERE user_id = v_loan.user_id AND status = 'active' ORDER BY created_at ASC LIMIT 1;
  END IF;
  IF v_account_id IS NULL THEN RAISE EXCEPTION 'No active account found to disburse funds to'; END IF;

  -- Update Loan
  UPDATE public.loans SET status = 'approved', approved_at = now(), updated_at = now() WHERE id = p_loan_id;

  -- Disburse funds via Transaction (Trigger updates balance)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (v_loan.user_id, v_account_id, 'loan_disbursement', v_loan.amount, 'Loan Disbursement - ' || UPPER(SUBSTRING(p_loan_id::text FROM 1 FOR 8)), 'LND-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)), 'completed');

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_admin_id, 'admin_approved_loan', 'loans', p_loan_id::text, jsonb_build_object('user_id', v_loan.user_id, 'amount', v_loan.amount));

  -- Notify user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (v_loan.user_id, 'Loan Approved', 'Your loan of $' || v_loan.amount || ' has been approved and funds disbursed to your account.', 'success');

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. Admin Approve Current Account RPC
CREATE OR REPLACE FUNCTION public.admin_approve_current_account(
  p_admin_id UUID,
  p_application_id UUID
) RETURNS JSON AS $$
DECLARE
  v_app RECORD;
  v_new_account_number TEXT;
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = p_admin_id AND role IN ('admin', 'super_admin')) INTO v_is_admin;
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_app FROM public.current_account_applications WHERE id = p_application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF v_app.status != 'submitted' AND v_app.status != 'under_review' THEN RAISE EXCEPTION 'Application is not pending'; END IF;

  -- Prevent multiple current accounts
  IF EXISTS (SELECT 1 FROM public.accounts WHERE user_id = v_app.user_id AND account_type = 'current') THEN
    RAISE EXCEPTION 'User already has a current account';
  END IF;

  -- Update Application
  UPDATE public.current_account_applications SET status = 'approved', updated_at = now() WHERE id = p_application_id;

  -- Generate Account Number
  v_new_account_number := public.generate_account_number();

  -- Create Account
  INSERT INTO public.accounts (user_id, account_number, account_type, balance, status)
  VALUES (v_app.user_id, v_new_account_number, 'current', 0, 'active');

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_admin_id, 'admin_approved_current_account', 'current_account_applications', p_application_id::text, jsonb_build_object('user_id', v_app.user_id, 'account_number', v_new_account_number));

  -- Notify user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (v_app.user_id, 'Current Account Approved', 'Your application is approved. New Account Number: ' || v_new_account_number, 'success');

  RETURN json_build_object('success', true, 'account_number', v_new_account_number);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Migration to fix data anomalies where users ended up with two 'current' accounts 
-- and no 'savings' account during testing.

UPDATE public.accounts
SET account_type = 'savings'
WHERE id IN (
  SELECT a.id
  FROM public.accounts a
  WHERE a.account_type = 'current'
  AND NOT EXISTS (
    SELECT 1 FROM public.accounts s WHERE s.user_id = a.user_id AND s.account_type = 'savings'
  )
  AND a.id = (
    SELECT id FROM public.accounts c WHERE c.user_id = a.user_id AND c.account_type = 'current' ORDER BY created_at ASC LIMIT 1
  )
);


-- ============================================================
-- Crypto Deposit Approval RPC & Dashboard Deposit Fixes
-- ============================================================

-- 1. Admin Approve Crypto Deposit RPC
-- When an admin confirms a crypto deposit, this function:
--   a) Verifies admin role
--   b) Finds the user's first active account
--   c) Creates a completed transaction (triggers balance update)
--   d) Updates the crypto_deposits record
--   e) Logs to audit_logs
--   f) Sends a notification to the user
CREATE OR REPLACE FUNCTION public.admin_approve_crypto_deposit(
  p_admin_id UUID,
  p_deposit_id UUID
) RETURNS JSON AS $$
DECLARE
  v_deposit RECORD;
  v_account_id UUID;
  v_is_admin BOOLEAN;
  v_crypto_name TEXT;
  v_reference TEXT;
BEGIN
  -- Verify admin
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_admin_id AND role IN ('admin', 'super_admin')
  ) INTO v_is_admin;
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  -- Fetch the deposit
  SELECT * INTO v_deposit FROM public.crypto_deposits WHERE id = p_deposit_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deposit not found'; END IF;
  IF v_deposit.status = 'confirmed' THEN RAISE EXCEPTION 'Deposit already confirmed'; END IF;
  IF v_deposit.status = 'rejected' THEN RAISE EXCEPTION 'Deposit was already rejected'; END IF;

  -- Get cryptocurrency name for the description
  SELECT cryptocurrency INTO v_crypto_name FROM public.crypto_wallets WHERE id = v_deposit.wallet_id;

  -- Find the user's first active account
  SELECT id INTO v_account_id
  FROM public.accounts
  WHERE user_id = v_deposit.user_id AND status = 'active'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'No active account found for user';
  END IF;

  -- Generate reference
  v_reference := 'CRY-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

  -- Update the crypto deposit status
  UPDATE public.crypto_deposits
  SET status = 'confirmed', reviewed_by = p_admin_id, updated_at = now()
  WHERE id = p_deposit_id;

  -- Insert a completed transaction (the trg_update_balance trigger will credit the account)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (
    v_deposit.user_id,
    v_account_id,
    'deposit',
    v_deposit.amount,
    'Crypto Deposit (' || COALESCE(v_crypto_name, 'Digital Asset') || ')',
    v_reference,
    'completed'
  );

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    p_admin_id,
    'admin_approved_crypto_deposit',
    'crypto_deposits',
    p_deposit_id::text,
    jsonb_build_object(
      'user_id', v_deposit.user_id,
      'amount', v_deposit.amount,
      'cryptocurrency', v_crypto_name,
      'tx_hash', v_deposit.tx_hash
    )
  );

  -- Notify user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_deposit.user_id,
    'Crypto Deposit Confirmed',
    'Your ' || COALESCE(v_crypto_name, 'crypto') || ' deposit of ' || v_deposit.amount || ' has been confirmed and credited to your account.',
    'success'
  );

  RETURN json_build_object('success', true, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Update Crypto Deposit Approval RPC to accept an amount
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_approve_crypto_deposit(
  p_admin_id UUID,
  p_deposit_id UUID,
  p_amount NUMERIC
) RETURNS JSON AS $$
DECLARE
  v_deposit RECORD;
  v_account_id UUID;
  v_is_admin BOOLEAN;
  v_crypto_name TEXT;
  v_reference TEXT;
BEGIN
  -- Verify admin
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_admin_id AND role IN ('admin', 'super_admin')
  ) INTO v_is_admin;
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'A valid confirmation amount is required';
  END IF;

  -- Fetch the deposit
  SELECT * INTO v_deposit FROM public.crypto_deposits WHERE id = p_deposit_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deposit not found'; END IF;
  IF v_deposit.status = 'confirmed' THEN RAISE EXCEPTION 'Deposit already confirmed'; END IF;
  IF v_deposit.status = 'rejected' THEN RAISE EXCEPTION 'Deposit was already rejected'; END IF;

  -- Get cryptocurrency name for the description
  SELECT cryptocurrency INTO v_crypto_name FROM public.crypto_wallets WHERE id = v_deposit.wallet_id;

  -- Find the user's first active account
  SELECT id INTO v_account_id
  FROM public.accounts
  WHERE user_id = v_deposit.user_id AND status = 'active'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'No active account found for user';
  END IF;

  -- Generate reference
  v_reference := 'CRY-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

  -- Update the crypto deposit status and amount
  UPDATE public.crypto_deposits
  SET status = 'confirmed', amount = p_amount, reviewed_by = p_admin_id, updated_at = now()
  WHERE id = p_deposit_id;

  -- Insert a completed transaction (the trg_update_balance trigger will credit the account)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (
    v_deposit.user_id,
    v_account_id,
    'deposit',
    p_amount,
    'Crypto Deposit (' || COALESCE(v_crypto_name, 'Digital Asset') || ')',
    v_reference,
    'completed'
  );

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    p_admin_id,
    'admin_approved_crypto_deposit',
    'crypto_deposits',
    p_deposit_id::text,
    jsonb_build_object(
      'user_id', v_deposit.user_id,
      'amount', p_amount,
      'cryptocurrency', v_crypto_name,
      'tx_hash', v_deposit.tx_hash
    )
  );

  -- Notify user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_deposit.user_id,
    'Crypto Deposit Confirmed',
    'Your ' || COALESCE(v_crypto_name, 'crypto') || ' deposit of $' || p_amount || ' has been confirmed and credited to your account.',
    'success'
  );

  RETURN json_build_object('success', true, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Add logo_url to crypto_wallets
-- ============================================================

ALTER TABLE public.crypto_wallets
ADD COLUMN IF NOT EXISTS logo_url text;

-- Insert default crypto third party setting if it doesn't exist
INSERT INTO public.cms_site_settings (key, value)
VALUES (
  'crypto_third_party',
  '{"name": "MoonPay", "url": "https://exchange.mercuryo.io/"}'::jsonb
) ON CONFLICT (key) DO NOTHING;



-- ============================================================
-- Extend crypto_wallets with additional management fields
-- ============================================================

ALTER TABLE public.crypto_wallets
ADD COLUMN IF NOT EXISTS wallet_name text,
ADD COLUMN IF NOT EXISTS min_deposit numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS confirmations_required integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS qr_code_url text,
ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;


-- ============================================================
-- Phase 13: Admin CRUD Operations for Users
-- Creates RPCs to allow admins to delete users safely
-- ============================================================

-- Function to safely delete a user entirely
CREATE OR REPLACE FUNCTION public.admin_delete_user(
  p_admin_id uuid,
  p_target_user_id uuid
) RETURNS void AS $$
DECLARE
  v_admin_role text;
BEGIN
  -- Verify caller is admin
  SELECT role INTO v_admin_role FROM public.user_roles WHERE user_id = p_admin_id;
  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can delete users.';
  END IF;

  IF p_admin_id = p_target_user_id THEN
    RAISE EXCEPTION 'Cannot delete your own admin account.';
  END IF;

  -- Delete from auth.users (will cascade to profiles, accounts, etc. if ON DELETE CASCADE is set)
  -- Note: this requires the function to run with privileges that can delete auth.users
  DELETE FROM auth.users WHERE id = p_target_user_id;

  -- Log action
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_admin_id, 'admin_deleted_user', 'auth.users', p_target_user_id::text, jsonb_build_object('deleted_user_id', p_target_user_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Unified Deposits View
CREATE OR REPLACE VIEW public.admin_deposits_view AS
SELECT
    f.id,
    f.user_id,
    p.display_name AS customer_name,
    p.email AS customer_email,
    f.amount,
    'USD' AS currency,
    f.method AS method,
    f.reference,
    NULL AS network,
    f.status,
    f.proof_url,
    f.created_at,
    'fiat' AS deposit_type,
    NULL AS wallet_id,
    f.account_id
FROM public.payment_sessions f
LEFT JOIN public.profiles p ON f.user_id = p.id

UNION ALL

SELECT
    c.id,
    c.user_id,
    p.display_name AS customer_name,
    p.email AS customer_email,
    c.amount,
    w.cryptocurrency AS currency,
    'crypto_transfer' AS method,
    c.tx_hash AS reference,
    w.network AS network,
    c.status,
    c.proof_url,
    c.created_at,
    'crypto' AS deposit_type,
    c.wallet_id,
    NULL AS account_id
FROM public.crypto_deposits c
LEFT JOIN public.profiles p ON c.user_id = p.id
LEFT JOIN public.crypto_wallets w ON c.wallet_id = w.id;

GRANT SELECT ON public.admin_deposits_view TO authenticated, service_role;


-- Helper RPC for rejecting either deposit type
CREATE OR REPLACE FUNCTION public.admin_reject_any_deposit(
  p_admin_id uuid,
  p_deposit_id uuid,
  p_deposit_type text, -- 'fiat' or 'crypto'
  p_reason text
) RETURNS void AS $$
DECLARE
  v_admin_role text;
  v_amount numeric;
BEGIN
  -- Verify caller is admin
  SELECT role INTO v_admin_role FROM public.user_roles WHERE user_id = p_admin_id;
  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can reject deposits.';
  END IF;

  IF p_deposit_type = 'fiat' THEN
    UPDATE public.payment_sessions 
    SET status = 'rejected', notes = p_reason, updated_at = now()
    WHERE id = p_deposit_id RETURNING amount INTO v_amount;
    
    INSERT INTO public.payment_audit_logs (payment_session_id, admin_user_id, action, previous_status, new_status, notes)
    VALUES (p_deposit_id, p_admin_id, 'admin_rejected_fiat_deposit', 'under_review', 'rejected', p_reason);
    
  ELSIF p_deposit_type = 'crypto' THEN
    UPDATE public.crypto_deposits 
    SET status = 'rejected', admin_notes = p_reason, reviewed_by = p_admin_id, updated_at = now()
    WHERE id = p_deposit_id RETURNING amount INTO v_amount;
    
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_admin_id, 'admin_rejected_crypto_deposit', 'crypto_deposits', p_deposit_id, jsonb_build_object('reason', p_reason, 'amount', v_amount));
    
  ELSE
    RAISE EXCEPTION 'Invalid deposit type';
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_reject_any_deposit(uuid, uuid, text, text) TO authenticated;


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


-- Migration: Add slug, status, revision_history to cms_posts for full CMS support
-- This enables: URL-friendly slugs for article pages, draft/published status, and revision tracking.

-- Add slug column (URL-friendly identifier)
ALTER TABLE public.cms_posts ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add status column (draft or published)
ALTER TABLE public.cms_posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft'));

-- Add revision_history column (JSON array of changes)
ALTER TABLE public.cms_posts ADD COLUMN IF NOT EXISTS revision_history JSONB DEFAULT '[]'::jsonb;

-- Backfill slugs for existing posts that don't have one
UPDATE public.cms_posts
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_cms_posts_slug ON public.cms_posts(slug);

-- Create index on status for filtered queries
CREATE INDEX IF NOT EXISTS idx_cms_posts_status ON public.cms_posts(status);


-- Migration: Add contact_messages table for the public Contact page form

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to INSERT
DROP POLICY IF EXISTS "Allow anonymous insert on contact_messages" ON public.contact_messages;
CREATE POLICY "Allow anonymous insert on contact_messages"
ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Allow admins to SELECT/UPDATE
DROP POLICY IF EXISTS "Allow admins to read contact_messages" ON public.contact_messages;
CREATE POLICY "Allow admins to read contact_messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND role IN ('admin', 'support_admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Allow admins to update contact_messages" ON public.contact_messages;
CREATE POLICY "Allow admins to update contact_messages"
ON public.contact_messages FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND role IN ('admin', 'support_admin', 'super_admin')
  )
);


-- Migration: Purge test data for production deployment
-- WARNING: This is a destructive operation that clears all user-generated data.
-- It intentionally leaves CMS tables (cms_posts, cms_products, etc.) intact as they contain seeded marketing data.

BEGIN;

-- Disable triggers temporarily to avoid cascading audit logs or notifications during wipe
SET session_replication_role = 'replica';

-- Truncate all transactional and user-specific tables
TRUNCATE TABLE 
    public.audit_logs,
    public.notifications,
    public.messages,
    public.conversations,
    public.crypto_deposits,
    public.transactions,
    public.payment_sessions,
    public.tax_documents,
    public.kyc_documents,
    public.cards,
    public.beneficiaries,
    public.loans,
    public.accounts,
    public.user_roles,
    public.profiles,
    public.contact_messages
RESTART IDENTITY CASCADE;

-- Delete all users from Supabase Auth schema (auth.users)
-- Note: This requires superuser privileges. In a hosted Supabase project,
-- this might need to be run via the SQL Editor in the Dashboard.
DELETE FROM auth.users;

-- Re-enable triggers
SET session_replication_role = 'origin';

COMMIT;

-- Notice:
-- After running this script, you must manually create a new admin user 
-- via the Supabase Dashboard -> Authentication -> Add User.
-- Then manually insert their ID into `public.user_roles` with role 'super_admin'.


-- Fix audit_logs RLS policies

-- Allow users to view their own audit logs (needed for SecurityPage)
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Ensure users can insert their own audit logs
DROP POLICY IF EXISTS "Authenticated can insert own audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert own audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Explicitly grant permissions
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;


-- Add INSERT policy for investment_accounts so users can open new accounts from the dashboard
CREATE POLICY "User Insert Own Investment Account" 
ON public.investment_accounts 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);


-- Add INSERT policy for cards so users can request new cards from the dashboard
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'cards' AND policyname = 'Users can request cards'
    ) THEN
        CREATE POLICY "Users can request cards" 
        ON public.cards 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;


-- Expand cards table for physical card requests
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS is_physical BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS request_status TEXT;

-- Add physical card fee to site settings
INSERT INTO public.cms_site_settings (key, value)
VALUES ('physical_card_fee', '15.00')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- Migration: Phase 13 - Tiered KYC
-- Description: Extends the profiles table with comprehensive fields and tiered KYC support

-- 1. Add new columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS mailing_address text,
  ADD COLUMN IF NOT EXISTS state_province text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS employer_name text,
  ADD COLUMN IF NOT EXISTS annual_income_range text,
  ADD COLUMN IF NOT EXISTS source_of_funds text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS kyc_tier integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS membership_level text DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_preferences boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb;

-- 2. Modify kyc_status constraints if needed
-- Currently it allows 'not_started', 'pending', 'approved', 'rejected'.
-- We will keep the same statuses, but map them to tiers in the application logic.

-- 3. Notify existing profiles that they might need to update info
-- This can be an optional insert into notifications, but omitted here to avoid spamming all users.


-- Migration: Phase 14 - Strict Database Validation Constraints
-- Description: Applies rigorous server-side validation to core tables to prevent invalid states.

-- 1. Profiles Constraints
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_kyc_tier CHECK (kyc_tier >= 0 AND kyc_tier <= 3),
  ADD CONSTRAINT chk_profiles_email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');

-- 2. Accounts Constraints
-- (Assuming standard accounts cannot go negative unless explicitly an overdraft facility)
ALTER TABLE public.accounts
  ADD CONSTRAINT chk_accounts_balance_positive CHECK (balance >= 0),
  ADD CONSTRAINT chk_accounts_status CHECK (status IN ('active', 'suspended', 'closed', 'frozen'));

-- 3. Transactions Constraints
ALTER TABLE public.transactions
  ADD CONSTRAINT chk_transactions_amount_positive CHECK (amount > 0),
  ADD CONSTRAINT chk_transactions_type CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'payment', 'fee', 'credit', 'debit', 'refund')),
  ADD CONSTRAINT chk_transactions_status CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'reversed'));

-- 4. Loans Constraints
ALTER TABLE public.loans
  ADD CONSTRAINT chk_loans_amount_positive CHECK (amount > 0),
  ADD CONSTRAINT chk_loans_interest_rate_positive CHECK (interest_rate >= 0),
  ADD CONSTRAINT chk_loans_status CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'paid', 'defaulted'));

-- 5. Cards Constraints
ALTER TABLE public.cards
  ADD CONSTRAINT chk_cards_spending_limit_positive CHECK (spending_limit IS NULL OR spending_limit >= 0),
  ADD CONSTRAINT chk_cards_status CHECK (status IN ('active', 'inactive', 'pending', 'rejected', 'frozen'));

-- 6. Current Account Applications Constraints
ALTER TABLE public.current_account_applications
  ADD CONSTRAINT chk_current_account_apps_status CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'more_info_required'));

-- 7. Payment Sessions Constraints
ALTER TABLE public.payment_sessions
  ADD CONSTRAINT chk_payment_sessions_amount_positive CHECK (amount > 0),
  ADD CONSTRAINT chk_payment_sessions_status CHECK (status IN ('pending', 'under_review', 'completed', 'failed', 'cancelled'));

-- 8. KYC Documents Constraints
ALTER TABLE public.kyc_documents
  ADD CONSTRAINT chk_kyc_documents_status CHECK (status IN ('pending', 'approved', 'rejected'));


-- ============================================================
-- Phase 2/3/4: Security Hardening - RBAC, Fraud Detection, RLS
-- ============================================================

-- 1. EXPANDED RBAC ROLES
-- Add new granular roles for enterprise compliance
DO $$
BEGIN
  -- Ensure user_roles table accepts new role values
  ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS chk_user_roles_role;
  ALTER TABLE public.user_roles ADD CONSTRAINT chk_user_roles_role 
    CHECK (role IN (
      'customer', 'support_admin', 'relationship_manager', 'compliance_officer',
      'finance_officer', 'operations_officer', 'auditor', 'admin', 'super_admin'
    ));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Role constraint already exists or table not ready: %', SQLERRM;
END $$;

-- 2. FRAUD DETECTION: High-Velocity Transaction Alert Trigger
-- Flags users making more than 10 transactions within a 5-minute window
CREATE OR REPLACE FUNCTION public.detect_high_velocity_transactions()
RETURNS TRIGGER AS $$
DECLARE
  v_recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_recent_count
  FROM public.transactions
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '5 minutes';

  IF v_recent_count > 10 THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.user_id, 'Security Alert', 'Unusual transaction activity detected on your account. If this was not you, please contact support immediately.', 'security');

    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, 'fraud_alert_high_velocity', 'transactions', NEW.id::text,
      jsonb_build_object('count_5min', v_recent_count, 'amount', NEW.amount, 'type', NEW.type));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_fraud_high_velocity ON public.transactions;
CREATE TRIGGER trg_fraud_high_velocity
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.detect_high_velocity_transactions();

-- 3. FRAUD DETECTION: Large Transaction Alert
-- Flags individual transactions over $50,000
CREATE OR REPLACE FUNCTION public.detect_large_transactions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount > 50000 THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, 'fraud_alert_large_transaction', 'transactions', NEW.id::text,
      jsonb_build_object('amount', NEW.amount, 'type', NEW.type, 'threshold', 50000));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_fraud_large_tx ON public.transactions;
CREATE TRIGGER trg_fraud_large_tx
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.detect_large_transactions();

-- 4. RLS HARDENING: Ensure DELETE is restricted on critical tables
-- Prevent users from deleting their own transactions (immutable ledger)
DROP POLICY IF EXISTS "Users cannot delete transactions" ON public.transactions;
CREATE POLICY "Users cannot delete transactions" ON public.transactions
  FOR DELETE USING (false);

-- Prevent users from deleting their own accounts
DROP POLICY IF EXISTS "Users cannot delete accounts" ON public.accounts;
CREATE POLICY "Users cannot delete accounts" ON public.accounts
  FOR DELETE USING (false);

-- Prevent users from deleting audit logs (immutable)
DROP POLICY IF EXISTS "Nobody can delete audit logs" ON public.audit_logs;
CREATE POLICY "Nobody can delete audit logs" ON public.audit_logs
  FOR DELETE USING (false);

-- Prevent users from updating audit logs (immutable)
DROP POLICY IF EXISTS "Nobody can update audit logs" ON public.audit_logs;
CREATE POLICY "Nobody can update audit logs" ON public.audit_logs
  FOR UPDATE USING (false);

-- 5. ADDITIONAL INDICES for query performance under load
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_user_status ON public.accounts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_tier ON public.profiles(kyc_tier);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_status ON public.payment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_transfers_user_created ON public.transfers(user_id, created_at DESC);

-- 6. PREVENT SELF-TRANSFER
-- Add a check constraint to the transfers table
ALTER TABLE public.transfers
  ADD CONSTRAINT chk_no_self_transfer CHECK (
    from_account_id IS NULL OR to_account_number IS NULL OR
    from_account_id::text != to_account_number
  );


-- ============================================================
-- Phase 11: KYC Tier Enforcement & Privileges
-- ============================================================

-- 1. UPDATE TRANSFER RPC TO ENFORCE LIMITS
CREATE OR REPLACE FUNCTION public.process_transfer(
  p_user_id UUID,
  p_from_account_id UUID,
  p_to_account_number TEXT,
  p_amount NUMERIC,
  p_narration TEXT,
  p_to_name TEXT,
  p_to_bank TEXT
) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
  v_kyc_tier INTEGER;
  v_transfer_id UUID;
  v_internal_receiver_id UUID;
  v_internal_account_id UUID;
  v_reference TEXT;
  v_sender_name TEXT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  -- KYC Tier check
  SELECT kyc_tier INTO v_kyc_tier FROM public.profiles WHERE user_id = p_user_id;
  IF v_kyc_tier IS NULL OR v_kyc_tier = 0 THEN
    RAISE EXCEPTION 'Your account is unverified. Please complete KYC Tier 1 to enable transfers.';
  END IF;
  
  IF v_kyc_tier = 1 AND p_amount > 5000 THEN
    RAISE EXCEPTION 'Transfer exceeds your Tier 1 limit of $5,000. Please upgrade your KYC tier.';
  END IF;

  IF v_kyc_tier = 2 AND p_amount > 50000 THEN
    RAISE EXCEPTION 'Transfer exceeds your Tier 2 limit of $50,000. Please upgrade your KYC tier.';
  END IF;

  IF v_kyc_tier = 3 AND p_amount > 500000 THEN
    RAISE EXCEPTION 'Transfer exceeds your Tier 3 limit of $500,000.';
  END IF;

  -- 1. Check Balance
  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_from_account_id AND user_id = p_user_id AND status = 'active';
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Source account not found or inactive';
  END IF;
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;
  
  -- 2. Generate Reference
  v_reference := 'TRF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));

  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = p_user_id;

  -- 3. Check if Internal Transfer (TrustBank)
  IF p_to_bank = 'TrustBank' OR p_to_bank IS NULL OR p_to_bank = '' THEN
    SELECT id, user_id INTO v_internal_account_id, v_internal_receiver_id FROM public.accounts WHERE account_number = p_to_account_number AND status = 'active';
    IF v_internal_account_id IS NULL THEN
       RAISE EXCEPTION 'Destination TrustBank account not found or inactive';
    END IF;
  END IF;

  -- 4. Create Transfer Record
  INSERT INTO public.transfers (user_id, from_account_id, to_account_number, to_name, to_bank, amount, narration, reference, status)
  VALUES (p_user_id, p_from_account_id, p_to_account_number, p_to_name, COALESCE(p_to_bank, 'TrustBank'), p_amount, p_narration, v_reference, 'completed')
  RETURNING id INTO v_transfer_id;

  -- 5. Create Debit Transaction (Trigger handles balance update)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, recipient_name, recipient_account, recipient_bank, status)
  VALUES (p_user_id, p_from_account_id, 'debit', p_amount, 'Transfer to ' || COALESCE(p_to_name, p_to_account_number), v_reference, p_to_name, p_to_account_number, COALESCE(p_to_bank, 'TrustBank'), 'completed');

  -- 6. Create Credit Transaction if Internal
  IF v_internal_account_id IS NOT NULL THEN
    INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
    VALUES (v_internal_receiver_id, v_internal_account_id, 'credit', p_amount, 'Transfer from ' || v_sender_name, v_reference, 'completed');
    
    -- Notify Receiver
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (v_internal_receiver_id, 'Funds Received', 'You received $' || p_amount || ' from ' || v_sender_name, 'success');
  END IF;
  
  -- 7. Audit Log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, 'transfer_executed', 'transfers', v_transfer_id::text, jsonb_build_object('amount', p_amount, 'to', p_to_account_number, 'bank', p_to_bank, 'ref', v_reference));

  RETURN json_build_object('success', true, 'transfer_id', v_transfer_id, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. ENFORCE LOAN PRIVILEGES
DROP POLICY IF EXISTS "Users can insert own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can apply for loans" ON public.loans;
CREATE POLICY "Users can apply for loans" ON public.loans FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  (SELECT kyc_tier FROM public.profiles WHERE user_id = auth.uid()) >= 3
);

-- 3. ENFORCE CARDS PRIVILEGES
DROP POLICY IF EXISTS "Users can request cards" ON public.cards;
CREATE POLICY "Users can request cards" ON public.cards FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  (SELECT kyc_tier FROM public.profiles WHERE user_id = auth.uid()) >= 2
);


-- ============================================================
-- Phase 12: Admin Full CRUD Policies for Cards
-- ============================================================

-- Allow admins to INSERT cards on behalf of users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'cards' AND policyname = 'Admins can insert cards'
    ) THEN
        CREATE POLICY "Admins can insert cards" 
        ON public.cards 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Allow admins to DELETE cards
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'cards' AND policyname = 'Admins can delete cards'
    ) THEN
        CREATE POLICY "Admins can delete cards" 
        ON public.cards 
        FOR DELETE 
        TO authenticated 
        USING (public.is_admin(auth.uid()));
    END IF;
END $$;


-- ============================================================
-- Phase 14: Daily Velocity Limits for Transfers
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_transfer(
  p_user_id UUID,
  p_from_account_id UUID,
  p_to_account_number TEXT,
  p_amount NUMERIC,
  p_narration TEXT,
  p_to_name TEXT,
  p_to_bank TEXT
) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
  v_kyc_tier INTEGER;
  v_daily_total NUMERIC := 0;
  v_daily_limit NUMERIC;
  v_tx_limit NUMERIC;
  v_transfer_id UUID;
  v_internal_receiver_id UUID;
  v_internal_account_id UUID;
  v_reference TEXT;
  v_sender_name TEXT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  -- 1. KYC Tier Check
  SELECT kyc_tier INTO v_kyc_tier FROM public.profiles WHERE user_id = p_user_id;
  IF v_kyc_tier IS NULL OR v_kyc_tier = 0 THEN
    RAISE EXCEPTION 'Your account is unverified. Please complete KYC Tier 1 to enable transfers.';
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
  END IF;

  -- 2. Per-Transaction Limit Check
  IF p_amount > v_tx_limit THEN
    RAISE EXCEPTION 'Transfer exceeds your Tier % limit of $%. Please upgrade your KYC tier.', v_kyc_tier, v_tx_limit;
  END IF;

  -- 3. Daily Velocity Limit Check
  -- Calculate total transfers sent by user in the last 24 hours
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM public.transfers
  WHERE user_id = p_user_id
  AND status = 'completed'
  AND created_at >= NOW() - INTERVAL '24 hours';

  IF (v_daily_total + p_amount) > v_daily_limit THEN
    RAISE EXCEPTION 'Transfer blocked: Exceeds your daily Tier % limit of $%. You have already transferred $% in the last 24 hours.', v_kyc_tier, v_daily_limit, v_daily_total;
  END IF;

  -- 4. Check Balance
  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_from_account_id AND user_id = p_user_id AND status = 'active';
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Source account not found or inactive';
  END IF;
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;
  
  -- 5. Generate Reference
  v_reference := 'TRF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));

  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = p_user_id;

  -- 6. Check if Internal Transfer (TrustBank)
  IF p_to_bank = 'TrustBank' OR p_to_bank IS NULL OR p_to_bank = '' THEN
    SELECT id, user_id INTO v_internal_account_id, v_internal_receiver_id FROM public.accounts WHERE account_number = p_to_account_number AND status = 'active';
    IF v_internal_account_id IS NULL THEN
       RAISE EXCEPTION 'Destination TrustBank account not found or inactive';
    END IF;
  END IF;

  -- 7. Create Transfer Record
  INSERT INTO public.transfers (user_id, from_account_id, to_account_number, to_name, to_bank, amount, narration, reference, status)
  VALUES (p_user_id, p_from_account_id, p_to_account_number, p_to_name, COALESCE(p_to_bank, 'TrustBank'), p_amount, p_narration, v_reference, 'completed')
  RETURNING id INTO v_transfer_id;

  -- 8. Create Debit Transaction (Trigger handles balance update)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, recipient_name, recipient_account, recipient_bank, status)
  VALUES (p_user_id, p_from_account_id, 'debit', p_amount, 'Transfer to ' || COALESCE(p_to_name, p_to_account_number), v_reference, p_to_name, p_to_account_number, COALESCE(p_to_bank, 'TrustBank'), 'completed');

  -- 9. Create Credit Transaction if Internal
  IF v_internal_account_id IS NOT NULL THEN
    INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
    VALUES (v_internal_receiver_id, v_internal_account_id, 'credit', p_amount, 'Transfer from ' || v_sender_name, v_reference, 'completed');
    
    -- Notify Receiver
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (v_internal_receiver_id, 'Funds Received', 'You received $' || p_amount || ' from ' || v_sender_name, 'success');
  END IF;
  
  -- 10. Audit Log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, 'transfer_executed', 'transfers', v_transfer_id::text, jsonb_build_object('amount', p_amount, 'to', p_to_account_number, 'bank', p_to_bank, 'ref', v_reference));

  RETURN json_build_object('success', true, 'transfer_id', v_transfer_id, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Phase 15: Dynamic Loan Limits
-- ============================================================

-- 1. Add loan_limit to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS loan_limit NUMERIC DEFAULT 0;

-- 2. Create trigger function to auto-assign default limit for Tier 3
CREATE OR REPLACE FUNCTION public.auto_assign_loan_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- If KYC tier is upgraded to 3, and loan limit is 0 (or null), set to default $10,000
  IF NEW.kyc_tier = 3 AND (OLD.kyc_tier IS DISTINCT FROM 3) THEN
    IF NEW.loan_limit IS NULL OR NEW.loan_limit = 0 THEN
      NEW.loan_limit := 10000;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_assign_loan_limit ON public.profiles;
CREATE TRIGGER trigger_auto_assign_loan_limit
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_loan_limit();

-- 4. Retroactively apply limit to existing Tier 3 users
UPDATE public.profiles
SET loan_limit = 10000
WHERE kyc_tier = 3 AND (loan_limit IS NULL OR loan_limit = 0);


-- ============================================================
-- Phase 16: Admin Update Loan RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_update_loan(
  p_admin_id UUID,
  p_loan_id UUID,
  p_amount NUMERIC,
  p_tenure_months INTEGER,
  p_interest_rate NUMERIC,
  p_monthly_payment NUMERIC,
  p_outstanding_balance NUMERIC
) RETURNS JSON AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_loan RECORD;
BEGIN
  -- 1. Check if the user is an admin
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = p_admin_id AND role IN ('admin', 'super_admin')) INTO v_is_admin;
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  -- 2. Verify loan exists and is pending
  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
  IF v_loan.status != 'pending' THEN RAISE EXCEPTION 'Only pending loans can be modified'; END IF;

  -- 3. Update the loan
  UPDATE public.loans 
  SET 
    amount = p_amount,
    tenure_months = p_tenure_months,
    interest_rate = p_interest_rate,
    monthly_payment = p_monthly_payment,
    outstanding_balance = p_outstanding_balance,
    updated_at = now()
  WHERE id = p_loan_id;

  -- 4. Log the action
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    p_admin_id, 
    'admin_updated_loan_terms', 
    'loans', 
    p_loan_id::text, 
    jsonb_build_object(
      'old_amount', v_loan.amount, 
      'new_amount', p_amount, 
      'old_rate', v_loan.interest_rate, 
      'new_rate', p_interest_rate
    )
  );

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Phase 17: Fix Transactions Type Constraint
-- ============================================================

-- The previous strict validation constraint missed 'loan_disbursement' and 'loan_repayment',
-- causing loan approvals to fail when inserting the disbursement transaction.

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS chk_transactions_type;

ALTER TABLE public.transactions
  ADD CONSTRAINT chk_transactions_type 
  CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'payment', 'fee', 'credit', 'debit', 'refund', 'loan_disbursement', 'loan_repayment'));


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


-- ============================================================
-- Phase 19: Cards Delete Policies
-- ============================================================

CREATE POLICY "Users can delete own cards" ON public.cards FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete all cards" ON public.cards FOR DELETE USING (public.is_admin(auth.uid()));


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


-- ============================================================
-- Phase 20: Private Wealth & Brokerage Integration
-- ============================================================

-- 1. Create investment_holdings table
CREATE TABLE IF NOT EXISTS public.investment_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.investment_accounts(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity >= 0),
  avg_cost NUMERIC NOT NULL,
  asset_class TEXT NOT NULL CHECK (asset_class IN ('stock', 'etf', 'bond', 'mutual_fund', 'crypto')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, symbol)
);
ALTER TABLE public.investment_holdings ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_investment_holdings_updated_at ON public.investment_holdings;
CREATE TRIGGER update_investment_holdings_updated_at BEFORE UPDATE ON public.investment_holdings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create investment_orders table
CREATE TABLE IF NOT EXISTS public.investment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.investment_accounts(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit')),
  limit_price NUMERIC,
  execution_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investment_orders ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS update_investment_orders_updated_at ON public.investment_orders;
CREATE TRIGGER update_investment_orders_updated_at BEFORE UPDATE ON public.investment_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
DROP POLICY IF EXISTS "User View Own Holdings" ON public.investment_holdings;
CREATE POLICY "User View Own Holdings" ON public.investment_holdings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.investment_accounts a WHERE a.id = account_id AND a.user_id = auth.uid()));

DROP POLICY IF EXISTS "User View Own Orders" ON public.investment_orders;
CREATE POLICY "User View Own Orders" ON public.investment_orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.investment_accounts a WHERE a.id = account_id AND a.user_id = auth.uid()));

DROP POLICY IF EXISTS "User Insert Own Orders" ON public.investment_orders;
CREATE POLICY "User Insert Own Orders" ON public.investment_orders FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.investment_accounts a WHERE a.id = account_id AND a.user_id = auth.uid()));


-- 3. RPC: Fund Brokerage Account (Move cash from checking to brokerage)
CREATE OR REPLACE FUNCTION public.fund_brokerage_account(
  p_user_id UUID,
  p_checking_account_id UUID,
  p_brokerage_account_id UUID,
  p_amount NUMERIC
) RETURNS JSON AS $$
DECLARE
  v_checking_balance NUMERIC;
  v_reference TEXT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Funding amount must be greater than zero';
  END IF;

  SELECT balance INTO v_checking_balance FROM public.accounts WHERE id = p_checking_account_id AND user_id = p_user_id AND status = 'active';
  IF v_checking_balance IS NULL THEN
    RAISE EXCEPTION 'Source checking account not found or inactive';
  END IF;

  IF v_checking_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds in checking account';
  END IF;

  -- Generate Reference
  v_reference := 'FUND-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

  -- Deduct from Checking explicitly (and use type 'transfer' so the trigger doesn't double deduct)
  UPDATE public.accounts 
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE id = p_checking_account_id;

  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (p_user_id, p_checking_account_id, 'transfer', p_amount, 'Brokerage Funding Transfer', v_reference, 'completed');

  -- Add to Brokerage Cash Balance
  UPDATE public.investment_accounts
  SET cash_balance = cash_balance + p_amount, balance = balance + p_amount, updated_at = NOW()
  WHERE id = p_brokerage_account_id AND user_id = p_user_id;

  RETURN json_build_object('success', true, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC: Process Trade (Market Order Execution Simulation)
CREATE OR REPLACE FUNCTION public.process_trade(
  p_user_id UUID,
  p_account_id UUID,
  p_symbol TEXT,
  p_asset_name TEXT,
  p_side TEXT,
  p_quantity NUMERIC,
  p_current_price NUMERIC,
  p_asset_class TEXT
) RETURNS JSON AS $$
DECLARE
  v_cash_balance NUMERIC;
  v_total_cost NUMERIC;
  v_holding_qty NUMERIC;
  v_holding_avg NUMERIC;
  v_order_id UUID;
  v_commission NUMERIC := 1.99;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Order quantity must be greater than zero';
  END IF;

  -- Ensure Private Wealth free trades for Tier 3
  IF (SELECT kyc_tier FROM public.profiles WHERE user_id = p_user_id) = 3 THEN
    v_commission := 0;
  END IF;

  v_total_cost := (p_quantity * p_current_price) + v_commission;

  -- 1. Check Cash Balance for BUYS
  SELECT cash_balance INTO v_cash_balance FROM public.investment_accounts WHERE id = p_account_id AND user_id = p_user_id AND status = 'active';
  IF v_cash_balance IS NULL THEN
    RAISE EXCEPTION 'Brokerage account not found or inactive';
  END IF;

  IF p_side = 'buy' THEN
    IF v_cash_balance < v_total_cost THEN
      RAISE EXCEPTION 'Insufficient cash available to execute trade. Required: $%, Available: $%', v_total_cost, v_cash_balance;
    END IF;

    -- Update Cash Balance
    UPDATE public.investment_accounts 
    SET cash_balance = cash_balance - v_total_cost, updated_at = NOW()
    WHERE id = p_account_id;

    -- Update or Insert Holding
    SELECT quantity, avg_cost INTO v_holding_qty, v_holding_avg FROM public.investment_holdings WHERE account_id = p_account_id AND symbol = p_symbol;
    IF FOUND THEN
      UPDATE public.investment_holdings
      SET avg_cost = ((v_holding_qty * v_holding_avg) + (p_quantity * p_current_price)) / (v_holding_qty + p_quantity),
          quantity = v_holding_qty + p_quantity,
          updated_at = NOW()
      WHERE account_id = p_account_id AND symbol = p_symbol;
    ELSE
      INSERT INTO public.investment_holdings (account_id, symbol, name, quantity, avg_cost, asset_class)
      VALUES (p_account_id, p_symbol, p_asset_name, p_quantity, p_current_price, p_asset_class);
    END IF;

  ELSIF p_side = 'sell' THEN
    -- Verify Holding for SELLS
    SELECT quantity INTO v_holding_qty FROM public.investment_holdings WHERE account_id = p_account_id AND symbol = p_symbol;
    IF v_holding_qty IS NULL OR v_holding_qty < p_quantity THEN
      RAISE EXCEPTION 'Insufficient share quantity to execute sell order.';
    END IF;

    -- Update Cash Balance (Add proceeds, minus commission)
    v_total_cost := (p_quantity * p_current_price) - v_commission;
    UPDATE public.investment_accounts 
    SET cash_balance = cash_balance + v_total_cost, updated_at = NOW()
    WHERE id = p_account_id;

    -- Update Holding
    IF v_holding_qty = p_quantity THEN
      DELETE FROM public.investment_holdings WHERE account_id = p_account_id AND symbol = p_symbol;
    ELSE
      UPDATE public.investment_holdings
      SET quantity = quantity - p_quantity, updated_at = NOW()
      WHERE account_id = p_account_id AND symbol = p_symbol;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid order side';
  END IF;

  -- 2. Record Order
  INSERT INTO public.investment_orders (account_id, symbol, side, quantity, order_type, execution_price, status)
  VALUES (p_account_id, p_symbol, p_side, p_quantity, 'market', p_current_price, 'filled')
  RETURNING id INTO v_order_id;

  -- 3. Log Commission (Optional integration with bank_portfolio)
  IF v_commission > 0 THEN
    UPDATE public.bank_portfolio 
    SET total_fees_collected = total_fees_collected + v_commission, updated_at = NOW()
    WHERE id = (SELECT id FROM public.bank_portfolio LIMIT 1);
  END IF;

  RETURN json_build_object('success', true, 'order_id', v_order_id, 'execution_price', p_current_price);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Hotfix: Fix Brokerage Funding Deduction
-- ============================================================

CREATE OR REPLACE FUNCTION public.fund_brokerage_account(
  p_user_id UUID,
  p_checking_account_id UUID,
  p_brokerage_account_id UUID,
  p_amount NUMERIC
) RETURNS JSON AS $$
DECLARE
  v_checking_balance NUMERIC;
  v_reference TEXT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Funding amount must be greater than zero';
  END IF;

  SELECT balance INTO v_checking_balance FROM public.accounts WHERE id = p_checking_account_id AND user_id = p_user_id AND status = 'active';
  IF v_checking_balance IS NULL THEN
    RAISE EXCEPTION 'Source checking account not found or inactive';
  END IF;

  IF v_checking_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds in checking account';
  END IF;

  -- Generate Reference
  v_reference := 'FUND-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

  -- Deduct from Checking explicitly (and use type 'transfer' so the trigger doesn't double deduct)
  UPDATE public.accounts 
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE id = p_checking_account_id;

  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (p_user_id, p_checking_account_id, 'transfer', p_amount, 'Brokerage Funding Transfer', v_reference, 'completed');

  -- Add to Brokerage Cash Balance
  UPDATE public.investment_accounts
  SET cash_balance = cash_balance + p_amount, balance = balance + p_amount, updated_at = NOW()
  WHERE id = p_brokerage_account_id AND user_id = p_user_id;

  RETURN json_build_object('success', true, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Hotfix: Add missing columns to investment tables
-- ============================================================

ALTER TABLE public.investment_orders 
  ADD COLUMN IF NOT EXISTS execution_price NUMERIC;

ALTER TABLE public.investment_holdings
  ADD COLUMN IF NOT EXISTS asset_class TEXT DEFAULT 'stock' CHECK (asset_class IN ('stock', 'etf', 'bond', 'mutual_fund', 'crypto'));

-- Also ensure any other columns exist, just in case phase 6 created an incomplete schema:
ALTER TABLE public.investment_orders
  ADD COLUMN IF NOT EXISTS limit_price NUMERIC;

ALTER TABLE public.investment_holdings
  ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Unknown Asset';


CREATE POLICY "Admins can view current account applications" ON public.current_account_applications FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update current account applications" ON public.current_account_applications FOR UPDATE USING (public.is_admin(auth.uid()));

INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat_attachments', 'chat_attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Authenticated users can upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view chat files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat files securely" ON storage.objects;

CREATE POLICY "Authenticated users can upload chat files securely"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat_attachments'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (
    right(name, 4) IN ('.png', '.jpg', '.pdf') OR 
    right(name, 5) IN ('.jpeg', '.webp')
  )
);

CREATE POLICY "Authenticated users can view chat files securely"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat_attachments'
  AND auth.role() = 'authenticated'
);


-- ============================================================
-- Migration: Available Stocks Catalog
-- Description: Creates a platform-wide stock catalog that admin
--              can manage via CRUD. Replaces hardcoded SYMBOLS_LIST.
-- ============================================================

-- 1. Create the available_stocks table
CREATE TABLE IF NOT EXISTS public.available_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  asset_class TEXT NOT NULL CHECK (asset_class IN ('stock', 'etf', 'bond', 'mutual_fund')),
  current_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Seed with default stocks (matching the previous hardcoded list)
INSERT INTO public.available_stocks (symbol, name, asset_class, current_price) VALUES
  ('AAPL', 'Apple Inc.', 'stock', 185.20),
  ('MSFT', 'Microsoft Corp.', 'stock', 420.50),
  ('GOOGL', 'Alphabet Inc.', 'stock', 175.80),
  ('AMZN', 'Amazon.com Inc.', 'stock', 182.10),
  ('SPY', 'SPDR S&P 500 ETF Trust', 'etf', 510.30),
  ('QQQ', 'Invesco QQQ Trust', 'etf', 435.60),
  ('BND', 'Vanguard Total Bond Market ETF', 'bond', 72.40)
ON CONFLICT (symbol) DO NOTHING;

-- 3. RLS Policies
ALTER TABLE public.available_stocks ENABLE ROW LEVEL SECURITY;

-- Admin full access
DROP POLICY IF EXISTS "Admins have full access to available_stocks" ON public.available_stocks;
CREATE POLICY "Admins have full access to available_stocks"
ON public.available_stocks FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Authenticated users can read active stocks
DROP POLICY IF EXISTS "Authenticated users can view active stocks" ON public.available_stocks;
CREATE POLICY "Authenticated users can view active stocks"
ON public.available_stocks FOR SELECT
USING (
  auth.role() = 'authenticated' AND is_active = true
);


-- ============================================================
-- Migration: Fix execute_order transaction type and constraint
-- Description: Updates the transaction type constraint to include 'investment'
--              and patches the execute_order RPC to use it.
-- ============================================================

-- 1. Ensure all valid transaction types are accepted, adding 'investment'
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS chk_transactions_type;
ALTER TABLE public.transactions ADD CONSTRAINT chk_transactions_type 
CHECK (type IN (
  'deposit', 'withdrawal', 'transfer', 'payment', 'fee', 'credit', 'debit', 
  'refund', 'loan_disbursement', 'loan_repayment', 'investment', 'trade'
));

-- 2. Update execute_order to use 'investment' type instead of 'payment'
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

  -- Log transaction using 'investment' type instead of 'payment'
  INSERT INTO public.transactions (user_id, type, amount, description, status)
  VALUES (
    v_user_id,
    'investment',
    v_cost,
    'Investment ' || upper(v_side) || ' - ' || v_symbol,
    'completed'
  );

  RETURN true;
END;
$$;


-- ============================================================
-- Migration: Remove overly restrictive transaction type constraint
-- Description: The `chk_transactions_type` constraint prevents new valid transaction types
--              like 'investment', 'bill_payment', and 'international_wire' from being logged.
--              We drop it completely here to allow normal operations and avoid conflicts with old data.
-- ============================================================

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS chk_transactions_type;


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


-- Migration: Add Performance Indexes
-- Purpose: Optimize database read queries for frequently accessed data

-- Create index on user_id for faster lookups in the dashboard
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards (user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans (user_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user_id ON public.beneficiaries (user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON public.kyc_documents (user_id);

-- Create index on created_at for faster sorting (e.g. recent transactions)
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions (created_at DESC);

-- CMS performance indexes for public data
CREATE INDEX IF NOT EXISTS idx_cms_site_settings_key ON public.cms_site_settings (key);
CREATE INDEX IF NOT EXISTS idx_cms_faqs_category ON public.cms_faqs (category);

-- Notify Postgres statistics engine to analyze and update execution plans
ANALYZE public.accounts;
ANALYZE public.transactions;
ANALYZE public.cards;
ANALYZE public.cms_site_settings;


-- ============================================================
-- Phase 14: Fix Cards Constraint and RLS Read Policies
-- ============================================================

-- 1. Drop the restrictive constraint that was blocking premium & infinite card inserts
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_card_type_check;

-- 2. Re-add the constraint with the newly supported tier names
ALTER TABLE public.cards ADD CONSTRAINT cards_card_type_check 
CHECK (card_type IN ('virtual', 'physical', 'debit', 'premium', 'infinite', 'digital'));

-- 3. Allow users to view their own cards
DROP POLICY IF EXISTS "Users can view their own cards" ON public.cards;
CREATE POLICY "Users can view their own cards" 
ON public.cards 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Allow users to update their own cards (e.g. freezing/unfreezing)
DROP POLICY IF EXISTS "Users can update their own cards" ON public.cards;
CREATE POLICY "Users can update their own cards" 
ON public.cards 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Add new columns for business information
ALTER TABLE public.grant_applications
ADD COLUMN IF NOT EXISTS business_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS business_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS year_started INTEGER;

-- Drop the old constraint if it exists (usually auto-named table_column_check)
ALTER TABLE public.grant_applications DROP CONSTRAINT IF EXISTS grant_applications_status_check;

-- Update status constraint to include the new workflow statuses
ALTER TABLE public.grant_applications 
ADD CONSTRAINT grant_applications_status_check 
CHECK (status IN ('draft', 'submitted', 'under_review', 'info_required', 'approved', 'rejected', 'processed', 'closed', 'awarded'));

-- Update trigger function to handle 'processed' instead of 'awarded' (or keep 'awarded' compatibility).
-- Let's update the trigger if necessary later, but we rely on the service layer to do the disbursement right now.


-- Add new columns for tax refund information
ALTER TABLE public.tax_refund_applications
ADD COLUMN IF NOT EXISTS tax_refund_program VARCHAR(150),
ADD COLUMN IF NOT EXISTS refund_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS claim_description TEXT,
ADD COLUMN IF NOT EXISTS requested_amount NUMERIC(12, 2);

-- Drop the old constraint if it exists
ALTER TABLE public.tax_refund_applications DROP CONSTRAINT IF EXISTS tax_refund_applications_status_check;

-- Update status constraint to include the new workflow statuses (including old ones for backward compatibility)
ALTER TABLE public.tax_refund_applications 
ADD CONSTRAINT tax_refund_applications_status_check 
CHECK (status IN (
  'draft', 'submitted', 'under_review', 'info_required', 
  'approved', 'rejected', 'processing', 'completed', 
  'closed', 'action_required', 'disbursed'
));


-- Add refund_method and ssn_tin columns
ALTER TABLE public.tax_refund_applications
ADD COLUMN IF NOT EXISTS refund_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS ssn_tin VARCHAR(100);


-- Add gov_id_type and gov_id_number columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gov_id_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS gov_id_number VARCHAR(100);


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


-- ============================================================
-- Migration: Expand Available Stocks
-- Description: Adds rich metadata and live pricing toggles 
--              to the available_stocks table.
-- ============================================================

-- 1. Add new columns for rich metadata
ALTER TABLE public.available_stocks
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS change_24h NUMERIC(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS change_percent_24h NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS market_cap TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS pe_ratio TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS dividend_yield TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS high_52w NUMERIC(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS low_52w NUMERIC(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS volume TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS analyst_rating TEXT DEFAULT 'Hold',
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS chart_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS use_live_price BOOLEAN DEFAULT false;

-- 2. Update existing seed data to match the rich UI
UPDATE public.available_stocks SET
  category = 'tech',
  market_cap = '$3.42 Trillion',
  pe_ratio = '33.8',
  dividend_yield = '0.44%',
  high_52w = 237.23,
  low_52w = 164.08,
  volume = '48.2M',
  analyst_rating = 'Strong Buy',
  description = 'Global technology leader in consumer electronics, software, and services including iPhone, Mac, and iCloud ecosystems.',
  chart_data = '[{"day": "Mon", "price": 218.1}, {"day": "Tue", "price": 220.4}, {"day": "Wed", "price": 219.8}, {"day": "Thu", "price": 222.1}, {"day": "Fri", "price": 221.9}, {"day": "Sat", "price": 223.4}, {"day": "Sun", "price": 224.5}]'::jsonb,
  change_24h = 3.20,
  change_percent_24h = 1.45,
  use_live_price = true
WHERE symbol = 'AAPL';

UPDATE public.available_stocks SET
  category = 'tech',
  market_cap = '$3.33 Trillion',
  pe_ratio = '36.2',
  dividend_yield = '0.67%',
  high_52w = 468.35,
  low_52w = 309.45,
  volume = '22.1M',
  analyst_rating = 'Strong Buy',
  description = 'Enterprise software giant specializing in Azure cloud platform, Windows OS, Productivity Software, and OpenAI partnership.',
  chart_data = '[{"day": "Mon", "price": 442.1}, {"day": "Tue", "price": 444.5}, {"day": "Wed", "price": 443.2}, {"day": "Thu", "price": 447.8}, {"day": "Fri", "price": 446.1}, {"day": "Sat", "price": 448.2}, {"day": "Sun", "price": 448.9}]'::jsonb,
  change_24h = 2.75,
  change_percent_24h = 0.62,
  use_live_price = true
WHERE symbol = 'MSFT';

UPDATE public.available_stocks SET
  category = 'tech',
  market_cap = '$2.18 Trillion',
  pe_ratio = '26.5',
  dividend_yield = '0.45%',
  high_52w = 193.31,
  low_52w = 120.21,
  volume = '28.4M',
  analyst_rating = 'Buy',
  description = 'Multinational technology company focusing on search engine technology, online advertising, cloud computing, and AI.',
  chart_data = '[{"day": "Mon", "price": 172.1}, {"day": "Tue", "price": 171.5}, {"day": "Wed", "price": 173.2}, {"day": "Thu", "price": 174.8}, {"day": "Fri", "price": 174.1}, {"day": "Sat", "price": 175.2}, {"day": "Sun", "price": 175.8}]'::jsonb,
  change_24h = 1.70,
  change_percent_24h = 0.98,
  use_live_price = true
WHERE symbol = 'GOOGL';

UPDATE public.available_stocks SET
  category = 'tech',
  market_cap = '$1.91 Trillion',
  pe_ratio = '52.1',
  dividend_yield = '0.00%',
  high_52w = 191.70,
  low_52w = 118.35,
  volume = '35.6M',
  analyst_rating = 'Buy',
  description = 'E-commerce and cloud computing behemoth providing AWS, Prime retail network, and digital streaming.',
  chart_data = '[{"day": "Mon", "price": 178.1}, {"day": "Tue", "price": 179.5}, {"day": "Wed", "price": 178.2}, {"day": "Thu", "price": 180.8}, {"day": "Fri", "price": 181.1}, {"day": "Sat", "price": 182.2}, {"day": "Sun", "price": 182.1}]'::jsonb,
  change_24h = 1.00,
  change_percent_24h = 0.55,
  use_live_price = true
WHERE symbol = 'AMZN';

UPDATE public.available_stocks SET
  category = 'index',
  market_cap = '$520.5 Billion',
  pe_ratio = 'N/A',
  dividend_yield = '1.35%',
  high_52w = 518.22,
  low_52w = 410.15,
  volume = '75.2M',
  analyst_rating = 'Buy',
  description = 'Exchange-traded fund that tracks the S&P 500 index, representing 500 of the largest U.S. publicly traded companies.',
  chart_data = '[{"day": "Mon", "price": 505.1}, {"day": "Tue", "price": 506.5}, {"day": "Wed", "price": 504.2}, {"day": "Thu", "price": 508.8}, {"day": "Fri", "price": 509.1}, {"day": "Sat", "price": 510.2}, {"day": "Sun", "price": 510.3}]'::jsonb,
  change_24h = -1.20,
  change_percent_24h = -0.23,
  use_live_price = true
WHERE symbol = 'SPY';

-- 3. Insert new seed data from EXTENDED_STOCKS not previously in DB
INSERT INTO public.available_stocks (
  symbol, name, category, asset_class, current_price, change_24h, change_percent_24h, 
  market_cap, pe_ratio, dividend_yield, high_52w, low_52w, volume, analyst_rating, description, chart_data, use_live_price
) VALUES 
('NVDA', 'NVIDIA Corporation', 'tech', 'stock', 128.80, 4.15, 3.33, '$3.16 Trillion', '68.4', '0.03%', 140.76, 39.23, '82.4M', 'Strong Buy', 'Pioneer in GPU design, accelerated computing architectures, data center chips, and artificial intelligence hardware.', '[{"day": "Mon", "price": 121.5}, {"day": "Tue", "price": 123.8}, {"day": "Wed", "price": 122.9}, {"day": "Thu", "price": 125.6}, {"day": "Fri", "price": 127.1}, {"day": "Sat", "price": 126.8}, {"day": "Sun", "price": 128.8}]'::jsonb, true),
('TSLA', 'Tesla, Inc.', 'growth', 'stock', 178.50, -2.45, -1.35, '$570.2 Billion', '42.1', '0.00%', 299.29, 138.80, '95.1M', 'Hold', 'Leading electric vehicle manufacturer and clean energy company specializing in battery energy storage and solar products.', '[{"day": "Mon", "price": 182.1}, {"day": "Tue", "price": 180.5}, {"day": "Wed", "price": 181.2}, {"day": "Thu", "price": 178.8}, {"day": "Fri", "price": 179.1}, {"day": "Sat", "price": 177.2}, {"day": "Sun", "price": 178.5}]'::jsonb, true),
('JPM', 'JPMorgan Chase & Co.', 'finance', 'stock', 195.20, 1.25, 0.64, '$560.1 Billion', '11.5', '2.35%', 200.30, 135.10, '12.4M', 'Buy', 'Global financial services firm and the largest bank in the United States by total assets.', '[{"day": "Mon", "price": 192.1}, {"day": "Tue", "price": 191.5}, {"day": "Wed", "price": 193.2}, {"day": "Thu", "price": 194.8}, {"day": "Fri", "price": 194.1}, {"day": "Sat", "price": 195.2}, {"day": "Sun", "price": 195.2}]'::jsonb, true)
ON CONFLICT (symbol) DO UPDATE SET 
  category = EXCLUDED.category,
  change_24h = EXCLUDED.change_24h,
  change_percent_24h = EXCLUDED.change_percent_24h,
  market_cap = EXCLUDED.market_cap,
  description = EXCLUDED.description,
  chart_data = EXCLUDED.chart_data,
  use_live_price = EXCLUDED.use_live_price;


-- ============================================================
-- Migration: Platform Document Management System
-- Description: Creates the platform_documents registry table
--              for tracking all generated receipts, statements,
--              certificates, and letters.
-- ============================================================

-- 1. Document Registry Table
CREATE TABLE IF NOT EXISTS public.platform_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_category TEXT NOT NULL,
  reference_number TEXT NOT NULL UNIQUE,
  verification_code TEXT NOT NULL UNIQUE,
  entity_type TEXT,
  entity_id UUID,
  title TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'issued',
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_platform_docs_user ON public.platform_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_docs_ref ON public.platform_documents(reference_number);
CREATE INDEX IF NOT EXISTS idx_platform_docs_verification ON public.platform_documents(verification_code);
CREATE INDEX IF NOT EXISTS idx_platform_docs_entity ON public.platform_documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_platform_docs_category ON public.platform_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_platform_docs_created ON public.platform_documents(created_at DESC);

-- 3. Row Level Security
ALTER TABLE public.platform_documents ENABLE ROW LEVEL SECURITY;

-- Customers can view their own documents
CREATE POLICY "Users can view own documents"
  ON public.platform_documents FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all documents
CREATE POLICY "Admins can view all documents"
  ON public.platform_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin', 'support_admin')
    )
  );

-- System (authenticated users) can insert their own documents
CREATE POLICY "Users can insert own documents"
  ON public.platform_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can insert documents for any user
CREATE POLICY "Admins can insert any documents"
  ON public.platform_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin', 'support_admin')
    )
  );

-- Admins can update document status (void, supersede)
CREATE POLICY "Admins can update documents"
  ON public.platform_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin', 'support_admin')
    )
  );

-- 4. Constraint to validate status values
ALTER TABLE public.platform_documents
  ADD CONSTRAINT chk_document_status
  CHECK (status IN ('issued', 'void', 'superseded'));

-- 5. Constraint to validate category values
ALTER TABLE public.platform_documents
  ADD CONSTRAINT chk_document_category
  CHECK (document_category IN (
    'banking', 'accounts', 'investments', 'loans',
    'grants', 'tax', 'kyc', 'security', 'general'
  ));


-- ============================================================
-- Add RPC for processing loan repayments securely
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_loan_repayment(
  p_loan_id UUID,
  p_amount NUMERIC
) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_loan RECORD;
  v_account RECORD;
  v_new_outstanding NUMERIC;
  v_new_repaid NUMERIC;
  v_new_status TEXT;
  v_new_balance NUMERIC;
BEGIN
  -- 1. Get the authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Verify loan exists, belongs to user, and is active
  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id AND user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found or unauthorized';
  END IF;

  IF v_loan.status NOT IN ('active', 'approved', 'pending') THEN
    RAISE EXCEPTION 'Loan is not in an active state';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  IF p_amount > COALESCE(v_loan.outstanding_balance, 0) THEN
    RAISE EXCEPTION 'Payment amount exceeds outstanding balance';
  END IF;

  -- 3. Get user's active savings account
  SELECT * INTO v_account FROM public.accounts 
  WHERE user_id = v_user_id AND account_type = 'savings' AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active savings account found';
  END IF;

  IF v_account.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds in savings account';
  END IF;

  -- 4. Calculate new values
  v_new_outstanding := GREATEST(0, COALESCE(v_loan.outstanding_balance, 0) - p_amount);
  v_new_repaid := COALESCE(v_loan.total_repaid, 0) + p_amount;
  v_new_status := CASE WHEN v_new_outstanding <= 0 THEN 'paid' ELSE v_loan.status END;
  v_new_balance := v_account.balance - p_amount;

  -- 5. Update the loan
  UPDATE public.loans 
  SET 
    outstanding_balance = v_new_outstanding,
    total_repaid = v_new_repaid,
    status = v_new_status,
    updated_at = now()
  WHERE id = p_loan_id;

  -- 6. Update the account
  UPDATE public.accounts
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_account.id;

  -- 7. Insert the transaction log
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    reference,
    status
  ) VALUES (
    v_user_id,
    'debit',
    p_amount,
    v_new_balance,
    'Loan repayment - ' || COALESCE(v_loan.purpose, 'Credit Facility') || ' (' || upper(substr(p_loan_id::text, 1, 8)) || ')',
    'REPAY-' || upper(substr(p_loan_id::text, 1, 8)) || '-' || upper(substr(gen_random_uuid()::text, 1, 8)),
    'completed'
  );

  RETURN json_build_object(
    'success', true,
    'new_outstanding', v_new_outstanding,
    'new_status', v_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Add RPC for processing full debt clearance securely
-- ============================================================

CREATE OR REPLACE FUNCTION public.clear_all_debt() RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_account RECORD;
  v_total_debt NUMERIC := 0;
  v_active_loans_count INTEGER := 0;
  v_loan RECORD;
BEGIN
  -- 1. Get the authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Calculate total debt across all active loans
  SELECT COALESCE(SUM(outstanding_balance), 0), COUNT(id)
  INTO v_total_debt, v_active_loans_count
  FROM public.loans
  WHERE user_id = v_user_id AND status IN ('active', 'approved', 'pending') AND outstanding_balance > 0;

  IF v_total_debt <= 0 THEN
    RAISE EXCEPTION 'No outstanding debt to clear';
  END IF;

  -- 3. Get user's active savings account
  SELECT * INTO v_account FROM public.accounts 
  WHERE user_id = v_user_id AND account_type = 'savings' AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active savings account found';
  END IF;

  IF v_account.balance < v_total_debt THEN
    RAISE EXCEPTION 'Insufficient funds in savings account to clear all debt';
  END IF;

  -- 4. Update all active loans
  FOR v_loan IN 
    SELECT * FROM public.loans 
    WHERE user_id = v_user_id AND status IN ('active', 'approved', 'pending') AND outstanding_balance > 0
  LOOP
    UPDATE public.loans 
    SET 
      outstanding_balance = 0,
      total_repaid = COALESCE(total_repaid, 0) + v_loan.outstanding_balance,
      status = 'paid',
      updated_at = now()
    WHERE id = v_loan.id;
  END LOOP;

  -- 5. Update the account
  UPDATE public.accounts
  SET balance = v_account.balance - v_total_debt, updated_at = now()
  WHERE id = v_account.id;

  -- 6. Insert the transaction log
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    reference,
    status
  ) VALUES (
    v_user_id,
    'debit',
    v_total_debt,
    v_account.balance - v_total_debt,
    'Full Debt Clearance - ' || v_active_loans_count || ' Facilities',
    'CLEARALL-' || upper(substr(gen_random_uuid()::text, 1, 8)),
    'completed'
  );

  RETURN json_build_object(
    'success', true,
    'total_cleared', v_total_debt,
    'facilities_cleared', v_active_loans_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Phase 1: Transaction PIN Base Schema & Core RPCs
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Add PIN tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS transaction_pin_hash TEXT,
ADD COLUMN IF NOT EXISTS transaction_pin_set_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS transaction_pin_failed_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS transaction_pin_locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS transaction_pin_updated_at TIMESTAMPTZ;

-- 2. Helper function to validate PIN format
CREATE OR REPLACE FUNCTION public.is_valid_pin_format(p_pin TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Must be exactly 4 digits
  IF p_pin !~ '^[0-9]{4}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Reject obvious PINs
  IF p_pin IN ('0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '9876') THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Core Verification Logic (Internal Use)
CREATE OR REPLACE FUNCTION public.verify_transaction_pin_internal(p_user_id UUID, p_pin TEXT)
RETURNS VOID AS $$
DECLARE
  v_profile RECORD;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_profile.transaction_pin_hash IS NULL THEN
    RAISE EXCEPTION 'Transaction PIN not set up. Please set it in your Security settings.';
  END IF;

  IF v_profile.transaction_pin_locked_until IS NOT NULL AND v_profile.transaction_pin_locked_until > now() THEN
    RAISE EXCEPTION 'PIN entry locked due to too many failed attempts. Try again later.';
  END IF;

  IF v_profile.transaction_pin_hash = crypt(p_pin, v_profile.transaction_pin_hash) THEN
    -- Success: reset failed attempts
    UPDATE public.profiles 
    SET transaction_pin_failed_attempts = 0, transaction_pin_locked_until = NULL
    WHERE user_id = p_user_id;

    -- Audit log
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_user_id, 'transaction_pin_verified', 'profiles', p_user_id::TEXT, '{"status": "success"}');
    
    RETURN;
  ELSE
    -- Failure: increment failed attempts
    UPDATE public.profiles 
    SET 
      transaction_pin_failed_attempts = COALESCE(transaction_pin_failed_attempts, 0) + 1,
      transaction_pin_locked_until = CASE 
        WHEN COALESCE(transaction_pin_failed_attempts, 0) + 1 >= 3 THEN now() + interval '15 minutes'
        ELSE NULL
      END
    WHERE user_id = p_user_id;

    -- Audit log
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_user_id, 'transaction_pin_failed', 'profiles', p_user_id::TEXT, '{"status": "failed"}');

    RAISE EXCEPTION 'Invalid Transaction PIN';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Setup Transaction PIN
CREATE OR REPLACE FUNCTION public.setup_transaction_pin(p_pin TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_hash TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  IF NOT public.is_valid_pin_format(p_pin) THEN
    RAISE EXCEPTION 'Invalid PIN format. Must be 4 digits and not obvious (e.g. 1234, 0000)';
  END IF;

  -- Ensure they don't already have one
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_user_id AND transaction_pin_hash IS NOT NULL) THEN
    RAISE EXCEPTION 'Transaction PIN is already set';
  END IF;

  v_hash := crypt(p_pin, gen_salt('bf', 10));

  UPDATE public.profiles 
  SET 
    transaction_pin_hash = v_hash,
    transaction_pin_set_at = now(),
    transaction_pin_updated_at = now()
  WHERE user_id = v_user_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id)
  VALUES (v_user_id, 'transaction_pin_setup', 'profiles', v_user_id::TEXT);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Change Transaction PIN
CREATE OR REPLACE FUNCTION public.change_transaction_pin(p_old_pin TEXT, p_new_pin TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_hash TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  IF NOT public.is_valid_pin_format(p_new_pin) THEN
    RAISE EXCEPTION 'Invalid new PIN format';
  END IF;

  -- Verify old PIN (throws exception if invalid)
  PERFORM public.verify_transaction_pin_internal(v_user_id, p_old_pin);

  -- Set new PIN
  v_hash := crypt(p_new_pin, gen_salt('bf', 10));

  UPDATE public.profiles 
  SET 
    transaction_pin_hash = v_hash,
    transaction_pin_updated_at = now()
  WHERE user_id = v_user_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id)
  VALUES (v_user_id, 'transaction_pin_changed', 'profiles', v_user_id::TEXT);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Reset Transaction PIN
CREATE OR REPLACE FUNCTION public.reset_transaction_pin(p_new_pin TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_hash TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  IF NOT public.is_valid_pin_format(p_new_pin) THEN
    RAISE EXCEPTION 'Invalid new PIN format';
  END IF;

  -- In a production environment, this should ideally require verifying an OTP token
  -- sent to email. For this prototype, we allow direct resets when authenticated.
  
  v_hash := crypt(p_new_pin, gen_salt('bf', 10));

  UPDATE public.profiles 
  SET 
    transaction_pin_hash = v_hash,
    transaction_pin_updated_at = now(),
    transaction_pin_failed_attempts = 0,
    transaction_pin_locked_until = NULL
  WHERE user_id = v_user_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id)
  VALUES (v_user_id, 'transaction_pin_reset', 'profiles', v_user_id::TEXT);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Phase 2: Transaction PIN Enforcement
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_transfer(p_user_id UUID,
  p_from_account_id UUID,
  p_to_account_number TEXT,
  p_amount NUMERIC,
  p_narration TEXT,
  p_to_name TEXT,
  p_to_bank TEXT,
  p_pin TEXT) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
  v_kyc_tier INTEGER;
  v_daily_total NUMERIC := 0;
  v_daily_limit NUMERIC;
  v_tx_limit NUMERIC;
  v_transfer_id UUID;
  v_internal_receiver_id UUID;
  v_internal_account_id UUID;
  v_reference TEXT;
  v_sender_name TEXT;
BEGIN

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  -- 1. KYC Tier Check
  SELECT kyc_tier INTO v_kyc_tier FROM public.profiles WHERE user_id = p_user_id;
  IF v_kyc_tier IS NULL OR v_kyc_tier = 0 THEN
    RAISE EXCEPTION 'Your account is unverified. Please complete KYC Tier 1 to enable transfers.';
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
  END IF;

  -- 2. Per-Transaction Limit Check
  IF p_amount > v_tx_limit THEN
    RAISE EXCEPTION 'Transfer exceeds your Tier % limit of $%. Please upgrade your KYC tier.', v_kyc_tier, v_tx_limit;
  END IF;

  -- 3. Daily Velocity Limit Check
  -- Calculate total transfers sent by user in the last 24 hours
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM public.transfers
  WHERE user_id = p_user_id
  AND status = 'completed'
  AND created_at >= NOW() - INTERVAL '24 hours';

  IF (v_daily_total + p_amount) > v_daily_limit THEN
    RAISE EXCEPTION 'Transfer blocked: Exceeds your daily Tier % limit of $%. You have already transferred $% in the last 24 hours.', v_kyc_tier, v_daily_limit, v_daily_total;
  END IF;

  -- 4. Check Balance
  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_from_account_id AND user_id = p_user_id AND status = 'active';
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Source account not found or inactive';
  END IF;
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;
  
  -- 5. Generate Reference
  v_reference := 'TRF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));

  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = p_user_id;

  -- 6. Check if Internal Transfer (TrustBank)
  IF p_to_bank = 'TrustBank' OR p_to_bank IS NULL OR p_to_bank = '' THEN
    SELECT id, user_id INTO v_internal_account_id, v_internal_receiver_id FROM public.accounts WHERE account_number = p_to_account_number AND status = 'active';
    IF v_internal_account_id IS NULL THEN
       RAISE EXCEPTION 'Destination TrustBank account not found or inactive';
    END IF;
  END IF;

  -- 7. Create Transfer Record
  INSERT INTO public.transfers (user_id, from_account_id, to_account_number, to_name, to_bank, amount, narration, reference, status)
  VALUES (p_user_id, p_from_account_id, p_to_account_number, p_to_name, COALESCE(p_to_bank, 'TrustBank'), p_amount, p_narration, v_reference, 'completed')
  RETURNING id INTO v_transfer_id;

  -- 8. Create Debit Transaction (Trigger handles balance update)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, recipient_name, recipient_account, recipient_bank, status)
  VALUES (p_user_id, p_from_account_id, 'debit', p_amount, 'Transfer to ' || COALESCE(p_to_name, p_to_account_number), v_reference, p_to_name, p_to_account_number, COALESCE(p_to_bank, 'TrustBank'), 'completed');

  -- 9. Create Credit Transaction if Internal
  IF v_internal_account_id IS NOT NULL THEN
    INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
    VALUES (v_internal_receiver_id, v_internal_account_id, 'credit', p_amount, 'Transfer from ' || v_sender_name, v_reference, 'completed');
    
    -- Notify Receiver
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (v_internal_receiver_id, 'Funds Received', 'You received $' || p_amount || ' from ' || v_sender_name, 'success');
  END IF;
  
  -- 10. Audit Log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, 'transfer_executed', 'transfers', v_transfer_id::text, jsonb_build_object('amount', p_amount, 'to', p_to_account_number, 'bank', p_to_bank, 'ref', v_reference));

  RETURN json_build_object('success', true, 'transfer_id', v_transfer_id, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.process_international_wire(p_user_id UUID,
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
  p_narration TEXT,
  p_pin TEXT) RETURNS JSON AS $$
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

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

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

CREATE OR REPLACE FUNCTION public.process_bill_payment(p_user_id UUID,
  p_account_id UUID,
  p_payee_name TEXT,
  p_category TEXT,
  p_amount NUMERIC,
  p_account_masked TEXT,
  p_pin TEXT) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
  v_reference TEXT;
  v_payment_id UUID;
BEGIN

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;

  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_account_id AND user_id = p_user_id AND status = 'active';
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Account not found or inactive'; END IF;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;
  
  v_reference := 'BPY-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));

  -- Insert Payment Log
  INSERT INTO public.payments (user_id, account_id, payment_type, provider, amount, phone_or_reference, reference, status)
  VALUES (p_user_id, p_account_id, p_category, p_payee_name, p_amount, p_account_masked, v_reference, 'completed')
  RETURNING id INTO v_payment_id;

  -- Insert Debit Transaction (Trigger handles balance)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (p_user_id, p_account_id, 'bill_payment', p_amount, 'Bill Pay: ' || p_payee_name, v_reference, 'completed');

  -- Notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (p_user_id, 'Bill Payment Sent', '$' || p_amount || ' paid to ' || p_payee_name, 'transaction');

  -- Audit Log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, 'bill_payment_executed', 'payments', v_payment_id::text, jsonb_build_object('amount', p_amount, 'payee', p_payee_name, 'ref', v_reference));

  RETURN json_build_object('success', true, 'payment_id', v_payment_id, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.process_loan_repayment(p_loan_id UUID,
  p_amount NUMERIC,
  p_pin TEXT) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_loan RECORD;
  v_account RECORD;
  v_new_outstanding NUMERIC;
  v_new_repaid NUMERIC;
  v_new_status TEXT;
  v_new_balance NUMERIC;
BEGIN
  -- 1. Get the authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(v_user_id, p_pin);


  -- 2. Verify loan exists, belongs to user, and is active
  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id AND user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found or unauthorized';
  END IF;

  IF v_loan.status NOT IN ('active', 'approved', 'pending') THEN
    RAISE EXCEPTION 'Loan is not in an active state';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  IF p_amount > COALESCE(v_loan.outstanding_balance, 0) THEN
    RAISE EXCEPTION 'Payment amount exceeds outstanding balance';
  END IF;

  -- 3. Get user's active savings account
  SELECT * INTO v_account FROM public.accounts 
  WHERE user_id = v_user_id AND account_type = 'savings' AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active savings account found';
  END IF;

  IF v_account.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds in savings account';
  END IF;

  -- 4. Calculate new values
  v_new_outstanding := GREATEST(0, COALESCE(v_loan.outstanding_balance, 0) - p_amount);
  v_new_repaid := COALESCE(v_loan.total_repaid, 0) + p_amount;
  v_new_status := CASE WHEN v_new_outstanding <= 0 THEN 'paid' ELSE v_loan.status END;
  v_new_balance := v_account.balance - p_amount;

  -- 5. Update the loan
  UPDATE public.loans 
  SET 
    outstanding_balance = v_new_outstanding,
    total_repaid = v_new_repaid,
    status = v_new_status,
    updated_at = now()
  WHERE id = p_loan_id;

  -- 6. Update the account
  UPDATE public.accounts
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_account.id;

  -- 7. Insert the transaction log
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    reference,
    status
  ) VALUES (
    v_user_id,
    'debit',
    p_amount,
    v_new_balance,
    'Loan repayment - ' || COALESCE(v_loan.purpose, 'Credit Facility') || ' (' || upper(substr(p_loan_id::text, 1, 8)) || ')',
    'REPAY-' || upper(substr(p_loan_id::text, 1, 8)) || '-' || upper(substr(gen_random_uuid()::text, 1, 8)),
    'completed'
  );

  RETURN json_build_object(
    'success', true,
    'new_outstanding', v_new_outstanding,
    'new_status', v_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.clear_all_debt(p_pin TEXT) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_account RECORD;
  v_total_debt NUMERIC := 0;
  v_active_loans_count INTEGER := 0;
  v_loan RECORD;
BEGIN
  -- 1. Get the authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(v_user_id, p_pin);


  -- 2. Calculate total debt across all active loans
  SELECT COALESCE(SUM(outstanding_balance), 0), COUNT(id)
  INTO v_total_debt, v_active_loans_count
  FROM public.loans
  WHERE user_id = v_user_id AND status IN ('active', 'approved', 'pending') AND outstanding_balance > 0;

  IF v_total_debt <= 0 THEN
    RAISE EXCEPTION 'No outstanding debt to clear';
  END IF;

  -- 3. Get user's active savings account
  SELECT * INTO v_account FROM public.accounts 
  WHERE user_id = v_user_id AND account_type = 'savings' AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active savings account found';
  END IF;

  IF v_account.balance < v_total_debt THEN
    RAISE EXCEPTION 'Insufficient funds in savings account to clear all debt';
  END IF;

  -- 4. Update all active loans
  FOR v_loan IN 
    SELECT * FROM public.loans 
    WHERE user_id = v_user_id AND status IN ('active', 'approved', 'pending') AND outstanding_balance > 0
  LOOP
    UPDATE public.loans 
    SET 
      outstanding_balance = 0,
      total_repaid = COALESCE(total_repaid, 0) + v_loan.outstanding_balance,
      status = 'paid',
      updated_at = now()
    WHERE id = v_loan.id;
  END LOOP;

  -- 5. Update the account
  UPDATE public.accounts
  SET balance = v_account.balance - v_total_debt, updated_at = now()
  WHERE id = v_account.id;

  -- 6. Insert the transaction log
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    reference,
    status
  ) VALUES (
    v_user_id,
    'debit',
    v_total_debt,
    v_account.balance - v_total_debt,
    'Full Debt Clearance - ' || v_active_loans_count || ' Facilities',
    'CLEARALL-' || upper(substr(gen_random_uuid()::text, 1, 8)),
    'completed'
  );

  RETURN json_build_object(
    'success', true,
    'total_cleared', v_total_debt,
    'facilities_cleared', v_active_loans_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.process_card_fee(p_user_id UUID,
  p_account_id UUID,
  p_fee_amount NUMERIC,
  p_reference TEXT,
  p_pin TEXT) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
BEGIN

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

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

CREATE OR REPLACE FUNCTION public.fund_brokerage_account(p_user_id UUID,
  p_checking_account_id UUID,
  p_brokerage_account_id UUID,
  p_amount NUMERIC,
  p_pin TEXT) RETURNS JSON AS $$
DECLARE
  v_checking_balance NUMERIC;
  v_reference TEXT;
BEGIN

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Funding amount must be greater than zero';
  END IF;

  SELECT balance INTO v_checking_balance FROM public.accounts WHERE id = p_checking_account_id AND user_id = p_user_id AND status = 'active';
  IF v_checking_balance IS NULL THEN
    RAISE EXCEPTION 'Source checking account not found or inactive';
  END IF;

  IF v_checking_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds in checking account';
  END IF;

  -- Generate Reference
  v_reference := 'FUND-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

  -- Deduct from Checking explicitly (and use type 'transfer' so the trigger doesn't double deduct)
  UPDATE public.accounts 
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE id = p_checking_account_id;

  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (p_user_id, p_checking_account_id, 'transfer', p_amount, 'Brokerage Funding Transfer', v_reference, 'completed');

  -- Add to Brokerage Cash Balance
  UPDATE public.investment_accounts
  SET cash_balance = cash_balance + p_amount, balance = balance + p_amount, updated_at = NOW()
  WHERE id = p_brokerage_account_id AND user_id = p_user_id;

  RETURN json_build_object('success', true, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.process_trade(p_user_id UUID,
  p_account_id UUID,
  p_symbol TEXT,
  p_asset_name TEXT,
  p_side TEXT,
  p_quantity NUMERIC,
  p_current_price NUMERIC,
  p_asset_class TEXT,
  p_pin TEXT) RETURNS JSON AS $$
DECLARE
  v_cash_balance NUMERIC;
  v_total_cost NUMERIC;
  v_holding_qty NUMERIC;
  v_holding_avg NUMERIC;
  v_order_id UUID;
  v_commission NUMERIC := 1.99;
BEGIN

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Order quantity must be greater than zero';
  END IF;

  -- Ensure Private Wealth free trades for Tier 3
  IF (SELECT kyc_tier FROM public.profiles WHERE user_id = p_user_id) = 3 THEN
    v_commission := 0;
  END IF;

  v_total_cost := (p_quantity * p_current_price) + v_commission;

  -- 1. Check Cash Balance for BUYS
  SELECT cash_balance INTO v_cash_balance FROM public.investment_accounts WHERE id = p_account_id AND user_id = p_user_id AND status = 'active';
  IF v_cash_balance IS NULL THEN
    RAISE EXCEPTION 'Brokerage account not found or inactive';
  END IF;

  IF p_side = 'buy' THEN
    IF v_cash_balance < v_total_cost THEN
      RAISE EXCEPTION 'Insufficient cash available to execute trade. Required: $%, Available: $%', v_total_cost, v_cash_balance;
    END IF;

    -- Update Cash Balance
    UPDATE public.investment_accounts 
    SET cash_balance = cash_balance - v_total_cost, updated_at = NOW()
    WHERE id = p_account_id;

    -- Update or Insert Holding
    SELECT quantity, avg_cost INTO v_holding_qty, v_holding_avg FROM public.investment_holdings WHERE account_id = p_account_id AND symbol = p_symbol;
    IF FOUND THEN
      UPDATE public.investment_holdings
      SET avg_cost = ((v_holding_qty * v_holding_avg) + (p_quantity * p_current_price)) / (v_holding_qty + p_quantity),
          quantity = v_holding_qty + p_quantity,
          updated_at = NOW()
      WHERE account_id = p_account_id AND symbol = p_symbol;
    ELSE
      INSERT INTO public.investment_holdings (account_id, symbol, name, quantity, avg_cost, asset_class)
      VALUES (p_account_id, p_symbol, p_asset_name, p_quantity, p_current_price, p_asset_class);
    END IF;

  ELSIF p_side = 'sell' THEN
    -- Verify Holding for SELLS
    SELECT quantity INTO v_holding_qty FROM public.investment_holdings WHERE account_id = p_account_id AND symbol = p_symbol;
    IF v_holding_qty IS NULL OR v_holding_qty < p_quantity THEN
      RAISE EXCEPTION 'Insufficient share quantity to execute sell order.';
    END IF;

    -- Update Cash Balance (Add proceeds, minus commission)
    v_total_cost := (p_quantity * p_current_price) - v_commission;
    UPDATE public.investment_accounts 
    SET cash_balance = cash_balance + v_total_cost, updated_at = NOW()
    WHERE id = p_account_id;

    -- Update Holding
    IF v_holding_qty = p_quantity THEN
      DELETE FROM public.investment_holdings WHERE account_id = p_account_id AND symbol = p_symbol;
    ELSE
      UPDATE public.investment_holdings
      SET quantity = quantity - p_quantity, updated_at = NOW()
      WHERE account_id = p_account_id AND symbol = p_symbol;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid order side';
  END IF;

  -- 2. Record Order
  INSERT INTO public.investment_orders (account_id, symbol, side, quantity, order_type, execution_price, status)
  VALUES (p_account_id, p_symbol, p_side, p_quantity, 'market', p_current_price, 'filled')
  RETURNING id INTO v_order_id;

  -- 3. Log Commission (Optional integration with bank_portfolio)
  IF v_commission > 0 THEN
    UPDATE public.bank_portfolio 
    SET total_fees_collected = total_fees_collected + v_commission, updated_at = NOW()
    WHERE id = (SELECT id FROM public.bank_portfolio LIMIT 1);
  END IF;

  RETURN json_build_object('success', true, 'order_id', v_order_id, 'execution_price', p_current_price);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;




CREATE TABLE IF NOT EXISTS public.stock_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number TEXT UNIQUE NOT NULL,
    verification_code TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES public.investment_accounts(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    ticker TEXT NOT NULL,
    shares_held NUMERIC NOT NULL,
    total_value NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    issue_date TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stock_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
    ON public.stock_certificates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Public can view certificates by verification_code"
    ON public.stock_certificates FOR SELECT
    USING (true);

CREATE OR REPLACE FUNCTION generate_stock_certificate(
    p_holding_id UUID
) RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_account_id UUID;
    v_company_name TEXT;
    v_ticker TEXT;
    v_shares_held NUMERIC;
    v_current_price NUMERIC;
    v_total_value NUMERIC;
    v_cert_id UUID;
    v_cert_number TEXT;
    v_verification_code TEXT;
    v_result JSON;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT 
        h.account_id,
        h.symbol,
        h.name,
        h.quantity,
        COALESCE(s.current_price, 0)
    INTO
        v_account_id,
        v_ticker,
        v_company_name,
        v_shares_held,
        v_current_price
    FROM public.investment_holdings h
    JOIN public.investment_accounts a ON h.account_id = a.id
    LEFT JOIN public.available_stocks s ON h.symbol = s.symbol
    WHERE h.id = p_holding_id AND a.user_id = v_user_id;

    IF v_account_id IS NULL THEN
        RAISE EXCEPTION 'Holding not found or does not belong to user';
    END IF;

    v_total_value := v_shares_held * v_current_price;

    v_cert_number := 'CERT-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text), 1, 6));
    v_verification_code := upper(substring(md5(random()::text), 1, 16));

    INSERT INTO public.stock_certificates (
        certificate_number,
        verification_code,
        user_id,
        account_id,
        company_name,
        ticker,
        shares_held,
        total_value
    ) VALUES (
        v_cert_number,
        v_verification_code,
        v_user_id,
        v_account_id,
        v_company_name,
        v_ticker,
        v_shares_held,
        v_total_value
    ) RETURNING id INTO v_cert_id;

    v_result := json_build_object(
        'success', true,
        'certificate_id', v_cert_id,
        'verification_code', v_verification_code,
        'certificate_number', v_cert_number
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
