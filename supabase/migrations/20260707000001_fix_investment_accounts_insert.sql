-- Add INSERT policy for investment_accounts so users can open new accounts from the dashboard
CREATE POLICY "User Insert Own Investment Account" 
ON public.investment_accounts 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);
