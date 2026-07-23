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
