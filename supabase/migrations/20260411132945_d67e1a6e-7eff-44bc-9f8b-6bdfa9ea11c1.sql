
-- Create beneficiaries table
CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  account_number TEXT NOT NULL,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='beneficiaries' AND policyname='Users can view own beneficiaries') THEN
    CREATE POLICY "Users can view own beneficiaries" ON public.beneficiaries FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='beneficiaries' AND policyname='Users can insert own beneficiaries') THEN
    CREATE POLICY "Users can insert own beneficiaries" ON public.beneficiaries FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='beneficiaries' AND policyname='Users can delete own beneficiaries') THEN
    CREATE POLICY "Users can delete own beneficiaries" ON public.beneficiaries FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='beneficiaries' AND policyname='Admins can view all beneficiaries') THEN
    CREATE POLICY "Admins can view all beneficiaries" ON public.beneficiaries FOR SELECT USING (is_admin(auth.uid()));
  END IF;
END $$;

-- Add address to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- Enable realtime on tables not already in the publication
DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['transactions','notifications','messages','conversations','cards','loans','kyc_documents']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
