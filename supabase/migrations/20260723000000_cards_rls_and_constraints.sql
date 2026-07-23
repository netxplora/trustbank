-- ============================================================
-- Phase 14: Fix Cards Constraint and RLS Read Policies
-- ============================================================

-- 1. Drop the restrictive constraint that was blocking premium & infinite card inserts
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_card_type_check;

-- 2. Re-add the constraint with the newly supported tier names
ALTER TABLE public.cards ADD CONSTRAINT cards_card_type_check 
CHECK (card_type IN ('virtual', 'physical', 'debit', 'premium', 'infinite', 'digital'));

-- 3. Allow users to view their own cards
DROP POLICY IF EXISTS "Users can view their own cards" ON public.cards;
CREATE POLICY "Users can view their own cards" 
ON public.cards 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Allow users to update their own cards (e.g. freezing/unfreezing)
DROP POLICY IF EXISTS "Users can update their own cards" ON public.cards;
CREATE POLICY "Users can update their own cards" 
ON public.cards 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
