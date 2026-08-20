-- ============================================================
-- Update KYC Tier requirement for cards
-- ============================================================

DROP POLICY IF EXISTS "Users can request cards" ON public.cards;
CREATE POLICY "Users can request cards" ON public.cards FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  (SELECT kyc_tier FROM public.profiles WHERE user_id = auth.uid()) >= 1
);
