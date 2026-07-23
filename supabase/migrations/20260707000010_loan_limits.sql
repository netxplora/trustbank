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
