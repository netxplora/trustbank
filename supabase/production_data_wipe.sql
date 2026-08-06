-- =========================================================================
-- PRODUCTION DATA WIPE SCRIPT
-- =========================================================================
-- IMPORTANT: This script will irrevocably delete all transactional and user 
-- data from the database. It is intended to be run exactly ONCE right before 
-- the platform is opened to the public, clearing all dummy accounts, 
-- test deposits, and mock CMS articles.
--
-- DO NOT RUN THIS IN A LIVE PRODUCTION ENVIRONMENT WITH REAL USERS.
-- =========================================================================

BEGIN;

-- Disable triggers temporarily to avoid cascading side-effects during mass deletion
SET session_replication_role = 'replica';

-- 1. Wipe all transactional ledgers & documents
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.account_statements CASCADE;
TRUNCATE TABLE public.tax_documents CASCADE;
TRUNCATE TABLE public.crypto_deposits CASCADE;
TRUNCATE TABLE public.payment_sessions CASCADE;

-- 2. Wipe support & notifications
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.conversations CASCADE;
TRUNCATE TABLE public.notifications CASCADE;

-- 3. Wipe Core Accounts & Profiles
-- (This cascades from auth.users if configured correctly, but we explicitly truncate public profiles)
TRUNCATE TABLE public.accounts CASCADE;

-- We don't truncate public.profiles directly if we want to keep the Super Admin.
-- Instead we delete all profiles except those whose user_id has a 'super_admin' role in user_roles.
DELETE FROM public.profiles
WHERE user_id NOT IN (
  SELECT user_id FROM public.user_roles WHERE role = 'super_admin'
);

-- 4. Wipe Dummy CMS Data
-- Note: If you want to keep your CMS layout, remove the following two lines.
TRUNCATE TABLE public.cms_posts CASCADE;
TRUNCATE TABLE public.cms_pages CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

COMMIT;

-- =========================================================================
-- POST-WIPE INSTRUCTIONS:
-- 1. To also delete users from Supabase Auth (so test users can't log in):
--    You must run this in the SQL Editor on the Supabase Dashboard:
--    DELETE FROM auth.users WHERE id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'super_admin');
-- 2. Clear the 'documents' and 'public_assets' storage buckets manually in the dashboard.
-- =========================================================================
