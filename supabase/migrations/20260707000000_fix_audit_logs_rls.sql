-- Fix audit_logs RLS policies

-- Allow users to view their own audit logs (needed for SecurityPage)
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Ensure users can insert their own audit logs
DROP POLICY IF EXISTS "Authenticated can insert own audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert own audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Explicitly grant permissions
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
