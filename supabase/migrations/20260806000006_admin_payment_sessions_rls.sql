-- ==============================================================================
-- Admin RLS Policies for payment_sessions
-- ==============================================================================
-- Currently, payment_sessions only has user-scoped policies.
-- Admins cannot read or update any payment sessions, which means
-- the Admin Deposits page shows empty. This migration adds the
-- missing admin policies.
-- ==============================================================================

-- Admin SELECT: admins can view all payment sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_sessions'
      AND policyname = 'Admins can view all payment sessions'
  ) THEN
    CREATE POLICY "Admins can view all payment sessions"
      ON public.payment_sessions
      FOR SELECT
      USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Admin UPDATE: admins can update any payment session (approve/reject)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_sessions'
      AND policyname = 'Admins can update all payment sessions'
  ) THEN
    CREATE POLICY "Admins can update all payment sessions"
      ON public.payment_sessions
      FOR UPDATE
      USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Admin DELETE: admins can delete payment sessions if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_sessions'
      AND policyname = 'Admins can delete payment sessions'
  ) THEN
    CREATE POLICY "Admins can delete payment sessions"
      ON public.payment_sessions
      FOR DELETE
      USING (public.is_admin(auth.uid()));
  END IF;
END $$;
