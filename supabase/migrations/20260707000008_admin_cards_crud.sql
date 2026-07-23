-- ============================================================
-- Phase 12: Admin Full CRUD Policies for Cards
-- ============================================================

-- Allow admins to INSERT cards on behalf of users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'cards' AND policyname = 'Admins can insert cards'
    ) THEN
        CREATE POLICY "Admins can insert cards" 
        ON public.cards 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Allow admins to DELETE cards
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'cards' AND policyname = 'Admins can delete cards'
    ) THEN
        CREATE POLICY "Admins can delete cards" 
        ON public.cards 
        FOR DELETE 
        TO authenticated 
        USING (public.is_admin(auth.uid()));
    END IF;
END $$;
