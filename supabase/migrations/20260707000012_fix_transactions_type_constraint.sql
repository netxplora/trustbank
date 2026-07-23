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
