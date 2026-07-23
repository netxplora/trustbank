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
