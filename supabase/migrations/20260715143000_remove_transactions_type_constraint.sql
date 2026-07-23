-- ============================================================
-- Migration: Remove overly restrictive transaction type constraint
-- Description: The `chk_transactions_type` constraint prevents new valid transaction types
--              like 'investment', 'bill_payment', and 'international_wire' from being logged.
--              We drop it completely here to allow normal operations and avoid conflicts with old data.
-- ============================================================

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS chk_transactions_type;
