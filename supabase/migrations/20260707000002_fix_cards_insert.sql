-- Add INSERT policy for cards so users can request new cards from the dashboard
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'cards' AND policyname = 'Users can request cards'
    ) THEN
        CREATE POLICY "Users can request cards" 
        ON public.cards 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
