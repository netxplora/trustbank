-- ===========================================================================
-- Account Closure: Switch to Admin Approval Model
-- Instead of instant closure, users submit a pending request.
-- Admins then approve (which bans the user) or reject (which notifies them).
-- ===========================================================================

-- 1. Expand the allowed status values on account_closure_requests
ALTER TABLE public.account_closure_requests
    DROP CONSTRAINT IF EXISTS account_closure_requests_status_check;
ALTER TABLE public.account_closure_requests
    ADD CONSTRAINT account_closure_requests_status_check
    CHECK (status IN ('pending', 'completed', 'rejected', 'deleted'));

-- Add columns for admin review metadata
ALTER TABLE public.account_closure_requests
    ADD COLUMN IF NOT EXISTS reviewed_by uuid,
    ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
    ADD COLUMN IF NOT EXISTS admin_notes text,
    ADD COLUMN IF NOT EXISTS created_at  timestamptz NOT NULL DEFAULT now();


-- ===========================================================================
-- 2. User-facing RPC: request_account_closure
-- Creates a pending request. Does NOT ban or close the account.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.request_account_closure(
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
    v_existing     uuid;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated. Please sign in and try again.';
    END IF;

    -- Check for an already-pending request
    SELECT id INTO v_existing
    FROM public.account_closure_requests
    WHERE user_id = v_uid AND status = 'pending'
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
        RAISE EXCEPTION 'You already have a pending closure request under review.';
    END IF;

    -- Run eligibility check server-side
    v_eligibility := public.check_account_closure_eligibility(v_uid);
    v_is_eligible := (v_eligibility->>'eligible')::boolean;

    IF NOT v_is_eligible THEN
        RAISE EXCEPTION 'Account cannot be closed: outstanding obligations exist. Please resolve them first.';
    END IF;

    -- Fetch email for audit
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_uid;

    -- Insert a PENDING closure request
    INSERT INTO public.account_closure_requests
        (user_id, reason, comments, status, closed_email, created_at)
    VALUES
        (v_uid, p_reason, p_comments, 'pending', v_user_email, now());

    -- Audit log
    INSERT INTO public.audit_logs
        (user_id, action, entity_type, entity_id, details)
    VALUES
        (v_uid, 'account_closure_requested', 'profile', v_uid,
         jsonb_build_object('reason', p_reason, 'email', v_user_email));

    -- Notify user
    INSERT INTO public.notifications
        (user_id, title, message, type)
    VALUES
        (v_uid,
         'Account Closure Request Submitted',
         'Your account closure request has been submitted and is under review. You will be notified once a decision has been made.',
         'info');

    RETURN json_build_object('success', true, 'message', 'Your closure request has been submitted for review.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_account_closure(text, text) TO authenticated;


-- ===========================================================================
-- 3. Admin-only RPC: admin_approve_account_closure
-- Approves the pending request, bans the user, and marks profile as closed.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.admin_approve_account_closure(
    p_request_id  uuid,
    p_admin_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_uid   uuid := auth.uid();
    v_is_admin    boolean;
    v_request     RECORD;
BEGIN
    IF v_admin_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated.';
    END IF;

    SELECT public.is_admin(v_admin_uid) INTO v_is_admin;
    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized. Admin privileges required.';
    END IF;

    -- Fetch the request
    SELECT * INTO v_request
    FROM public.account_closure_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Closure request not found.';
    END IF;

    IF v_request.status != 'pending' THEN
        RAISE EXCEPTION 'This request has already been processed (status: %).', v_request.status;
    END IF;

    -- Mark the request as completed
    UPDATE public.account_closure_requests
    SET status       = 'completed',
        closure_date = now(),
        reviewed_by  = v_admin_uid,
        reviewed_at  = now(),
        admin_notes  = p_admin_notes
    WHERE id = p_request_id;

    -- Mark the user profile as closed
    UPDATE public.profiles
    SET account_status = 'closed',
        updated_at     = now()
    WHERE user_id = v_request.user_id;

    -- Ban the user in auth.users (invalidates all sessions immediately)
    UPDATE auth.users
    SET banned_until = 'infinity'::timestamptz
    WHERE id = v_request.user_id;

    -- Audit log
    INSERT INTO public.audit_logs
        (user_id, action, entity_type, entity_id, details)
    VALUES
        (v_admin_uid, 'admin_approved_account_closure', 'profile', v_request.user_id,
         jsonb_build_object(
             'request_id', p_request_id,
             'target_user', v_request.user_id,
             'reason', v_request.reason,
             'admin_notes', p_admin_notes
         ));

    -- Notify the user (they won't see it since they're banned, but it's on record)
    INSERT INTO public.notifications
        (user_id, title, message, type)
    VALUES
        (v_request.user_id,
         'Account Closed',
         'Your account closure request has been approved. Your account is now permanently closed.',
         'security');

    RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_account_closure(uuid, text) TO authenticated;


-- ===========================================================================
-- 4. Admin-only RPC: admin_reject_account_closure
-- Rejects the pending request and notifies the user.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.admin_reject_account_closure(
    p_request_id  uuid,
    p_admin_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_uid   uuid := auth.uid();
    v_is_admin    boolean;
    v_request     RECORD;
BEGIN
    IF v_admin_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated.';
    END IF;

    SELECT public.is_admin(v_admin_uid) INTO v_is_admin;
    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized. Admin privileges required.';
    END IF;

    SELECT * INTO v_request
    FROM public.account_closure_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Closure request not found.';
    END IF;

    IF v_request.status != 'pending' THEN
        RAISE EXCEPTION 'This request has already been processed (status: %).', v_request.status;
    END IF;

    -- Mark the request as rejected
    UPDATE public.account_closure_requests
    SET status       = 'rejected',
        reviewed_by  = v_admin_uid,
        reviewed_at  = now(),
        admin_notes  = p_admin_notes
    WHERE id = p_request_id;

    -- Audit log
    INSERT INTO public.audit_logs
        (user_id, action, entity_type, entity_id, details)
    VALUES
        (v_admin_uid, 'admin_rejected_account_closure', 'profile', v_request.user_id,
         jsonb_build_object(
             'request_id', p_request_id,
             'target_user', v_request.user_id,
             'reason', v_request.reason,
             'admin_notes', p_admin_notes
         ));

    -- Notify the user
    INSERT INTO public.notifications
        (user_id, title, message, type)
    VALUES
        (v_request.user_id,
         'Account Closure Request Declined',
         COALESCE('Your account closure request has been declined. Reason: ' || p_admin_notes,
                  'Your account closure request has been declined. Please contact support for more information.'),
         'info');

    RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reject_account_closure(uuid, text) TO authenticated;
