-- ============================================================
-- Phase 10: Payment System Enhancements
-- Adds account_id and transaction_hash to payment_sessions
-- Creates payment_audit_logs table
-- ============================================================

-- 1. Add columns to payment_sessions
ALTER TABLE public.payment_sessions 
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS transaction_hash text;

-- 2. Create payment_audit_logs table
CREATE TABLE IF NOT EXISTS public.payment_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_session_id uuid NOT NULL REFERENCES public.payment_sessions(id) ON DELETE CASCADE,
    admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL, -- e.g., 'approved', 'rejected', 'requested_evidence'
    previous_status text,
    new_status text NOT NULL,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view payment audit logs"
    ON public.payment_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert payment audit logs"
    ON public.payment_audit_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
