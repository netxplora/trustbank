-- Migration: Add contact_messages table for the public Contact page form

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to INSERT
DROP POLICY IF EXISTS "Allow anonymous insert on contact_messages" ON public.contact_messages;
CREATE POLICY "Allow anonymous insert on contact_messages"
ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Allow admins to SELECT/UPDATE
DROP POLICY IF EXISTS "Allow admins to read contact_messages" ON public.contact_messages;
CREATE POLICY "Allow admins to read contact_messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND role IN ('admin', 'support_admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Allow admins to update contact_messages" ON public.contact_messages;
CREATE POLICY "Allow admins to update contact_messages"
ON public.contact_messages FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND role IN ('admin', 'support_admin', 'super_admin')
  )
);
