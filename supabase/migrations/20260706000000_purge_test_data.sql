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
