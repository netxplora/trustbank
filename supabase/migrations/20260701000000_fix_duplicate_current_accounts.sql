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
