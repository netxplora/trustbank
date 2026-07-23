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
