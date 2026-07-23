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
