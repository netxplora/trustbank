-- ===========================================================================
-- Account Closure System Migration
-- Implements: closure table, eligibility check, user-initiated closure RPC,
-- admin permanent deletion RPC, and session revocation.
-- ===========================================================================


-- 1. Create account_closure_requests table
-- NOTE: References profiles.id (not auth.users.id directly) so the audit
-- record survives even if the auth.users row is removed in future.
CREATE TABLE IF NOT EXISTS public.account_closure_requests (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL, -- logical reference; not FK so audit survives deletion
    reason      text NOT NULL,
    comments    text,
    status      text NOT NULL DEFAULT 'completed'
                    CHECK (status IN ('completed', 'deleted')),
    closure_date   timestamptz NOT NULL DEFAULT now(),
    deletion_date  timestamptz,
    closed_email   text         -- store email at time of closure for admin reference
);

-- Safely add closed_email column if an older version of this table already exists
ALTER TABLE public.account_closure_requests
    ADD COLUMN IF NOT EXISTS closed_email text;

-- Drop old status check constraint if it has a different definition, then re-add
ALTER TABLE public.account_closure_requests
    DROP CONSTRAINT IF EXISTS account_closure_requests_status_check;
ALTER TABLE public.account_closure_requests
    ADD CONSTRAINT account_closure_requests_status_check
    CHECK (status IN ('completed', 'deleted'));


-- Enable RLS
ALTER TABLE public.account_closure_requests ENABLE ROW LEVEL SECURITY;

-- Drop policies first to make this migration idempotent
DROP POLICY IF EXISTS "Users can view own closure requests"   ON public.account_closure_requests;
DROP POLICY IF EXISTS "Users can create own closure requests" ON public.account_closure_requests;
DROP POLICY IF EXISTS "Admins can view all closure requests"  ON public.account_closure_requests;
DROP POLICY IF EXISTS "Admins can update closure requests"    ON public.account_closure_requests;

-- Recreate policies
CREATE POLICY "Users can view own closure requests"
    ON public.account_closure_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all closure requests"
    ON public.account_closure_requests FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update closure requests"
    ON public.account_closure_requests FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- The execute_account_closure RPC inserts as SECURITY DEFINER so no INSERT policy needed for users


-- ===========================================================================
-- 2. Eligibility check RPC (can be called by anyone; checks the passed uid)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.check_account_closure_eligibility(uid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance              numeric;
    v_has_pending_txns     boolean;
    v_has_unpaid_loans     boolean;
    v_has_active_investments boolean;
    blockers               text[] := '{}';
BEGIN
    -- 1. Total balance across all accounts must be zero
    SELECT COALESCE(SUM(balance), 0) INTO v_balance
    FROM public.accounts
    WHERE user_id = uid;

    IF v_balance > 0 THEN
        blockers := array_append(
            blockers,
            format('You have a remaining balance of %s. Please withdraw or transfer all funds before closing.', v_balance)
        );
    END IF;

    -- 2. No pending transactions
    SELECT EXISTS (
        SELECT 1 FROM public.transactions
        WHERE user_id = uid AND status = 'pending'
    ) INTO v_has_pending_txns;

    IF v_has_pending_txns THEN
        blockers := array_append(blockers, 'You have pending transactions. Please wait for them to complete.');
    END IF;

    -- 3. No active or unpaid loans
    SELECT EXISTS (
        SELECT 1 FROM public.loans
        WHERE user_id = uid AND status IN ('active', 'pending', 'defaulted')
    ) INTO v_has_unpaid_loans;

    IF v_has_unpaid_loans THEN
        blockers := array_append(blockers, 'You have an outstanding loan. Please repay it in full before closing.');
    END IF;

    -- 4. No active investments
    SELECT EXISTS (
        SELECT 1 FROM public.investments
        WHERE user_id = uid AND status IN ('active', 'pending')
    ) INTO v_has_active_investments;

    IF v_has_active_investments THEN
        blockers := array_append(blockers, 'You have active investments. Please liquidate or withdraw them first.');
    END IF;

    IF array_length(blockers, 1) > 0 THEN
        RETURN json_build_object('eligible', false, 'blockers', blockers);
    END IF;

    RETURN json_build_object('eligible', true, 'blockers', '[]'::json);
END;
$$;


-- ===========================================================================
-- 3. User-initiated account closure RPC
-- Authentication is enforced by auth.uid() — the call must come from a valid
-- signed-in session. After closure we ban the user in auth.users so all
-- existing tokens become invalid immediately (Supabase JWT checks banned_until).
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.execute_account_closure(
    p_reason   text,
    p_comments text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_user_email   text;
    v_eligibility  json;
    v_is_eligible  boolean;
BEGIN
    -- Must be authenticated
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated. Please sign in and try again.';
    END IF;

    -- Fetch current email for audit record
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_uid;

    -- Re-run eligibility check server-side (cannot be bypassed from frontend)
    v_eligibility := public.check_account_closure_eligibility(v_uid);
    v_is_eligible  := (v_eligibility->>'eligible')::boolean;

    IF NOT v_is_eligible THEN
        RAISE EXCEPTION 'Account cannot be closed: outstanding obligations exist. Please resolve them first.';
    END IF;

    -- Mark profile as closed
    UPDATE public.profiles
    SET    account_status = 'closed',
           updated_at     = now()
    WHERE  user_id = v_uid;

    -- Write closure audit record (survives future auth.users deletion)
    INSERT INTO public.account_closure_requests
        (user_id, reason, comments, status, closure_date, closed_email)
    VALUES
        (v_uid, p_reason, p_comments, 'completed', now(), v_user_email);

    -- Write to platform audit log
    INSERT INTO public.audit_logs
        (user_id, action, entity_type, entity_id, details)
    VALUES
        (v_uid, 'account_closure', 'profile', v_uid,
         jsonb_build_object('reason', p_reason, 'email', v_user_email));

    -- -----------------------------------------------------------------------
    -- Revoke all active sessions:
    -- Setting banned_until = 'infinity' on auth.users immediately invalidates
    -- all JWTs and refresh tokens for this user across every device.
    -- This is the Supabase-supported session invalidation mechanism.
    -- -----------------------------------------------------------------------
    UPDATE auth.users
    SET    banned_until = 'infinity'::timestamptz
    WHERE  id = v_uid;

    RETURN json_build_object('success', true);
END;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.execute_account_closure(text, text) TO authenticated;


-- ===========================================================================
-- 4. Admin-only permanent deletion RPC
-- Permanently anonymizes PII while retaining financial records.
-- Requires the calling user to be an admin (enforced server-side).
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.permanently_delete_account(
    target_user_id uuid,
    p_admin_reason text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_uid      uuid := auth.uid();
    v_is_admin       boolean;
    v_profile_status text;
    v_eligibility    json;
    v_is_eligible    boolean;
BEGIN
    -- Must be authenticated
    IF v_admin_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated.';
    END IF;

    -- Must be an admin
    SELECT public.is_admin(v_admin_uid) INTO v_is_admin;
    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized. Admin privileges required.';
    END IF;

    -- Target account must already be in closed state
    SELECT account_status INTO v_profile_status
    FROM   public.profiles
    WHERE  user_id = target_user_id;

    IF v_profile_status IS DISTINCT FROM 'closed' THEN
        RAISE EXCEPTION 'The target account must be closed by the user before it can be permanently deleted.';
    END IF;

    -- Final financial obligation safety check
    v_eligibility := public.check_account_closure_eligibility(target_user_id);
    v_is_eligible  := (v_eligibility->>'eligible')::boolean;

    IF NOT v_is_eligible THEN
        RAISE EXCEPTION 'Permanent deletion blocked: the account still has unresolved financial obligations.';
    END IF;

    -- Anonymize PII in profiles (retain row for FK integrity with transactions)
    UPDATE public.profiles
    SET
        display_name   = 'Deleted User',
        first_name     = 'Deleted',
        last_name      = 'User',
        email          = 'deleted_' || target_user_id::text || '@redacted.local',
        phone          = '0000000000',
        bvn            = '00000000000',
        address        = 'Redacted',
        city           = 'Redacted',
        state_province = 'Redacted',
        postal_code    = '00000',
        avatar_url     = NULL,
        account_status = 'closed',
        updated_at     = now()
    WHERE user_id = target_user_id;

    -- Mark closure request as permanently deleted
    UPDATE public.account_closure_requests
    SET    status        = 'deleted',
           deletion_date = now()
    WHERE  user_id = target_user_id;

    -- Write permanent deletion audit entry (admin ID is recorded, not erased)
    INSERT INTO public.audit_logs
        (user_id, action, entity_type, entity_id, details)
    VALUES
        (v_admin_uid, 'permanent_account_deletion', 'profile', target_user_id,
         jsonb_build_object(
             'admin_id',    v_admin_uid,
             'target_id',   target_user_id,
             'reason',      p_admin_reason,
             'action_time', now()
         ));

    -- Ensure the auth account remains banned (in case it was not already)
    UPDATE auth.users
    SET    banned_until = 'infinity'::timestamptz
    WHERE  id = target_user_id;

    RETURN json_build_object('success', true, 'message', 'User PII anonymized and financial records retained.');
END;
$$;

-- Grant execute to authenticated users — server-side admin check enforces restriction
GRANT EXECUTE ON FUNCTION public.permanently_delete_account(uuid, text) TO authenticated;
