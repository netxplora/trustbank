-- Allow users to update their own pending crypto deposits with proof and tx hash
DROP POLICY IF EXISTS "Users can update own pending deposits" ON public.crypto_deposits;

CREATE POLICY "Users can update own pending deposits" 
ON public.crypto_deposits 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'under_review'));
