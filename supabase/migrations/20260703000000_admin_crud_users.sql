-- ============================================================
-- Phase 13: Admin CRUD Operations for Users
-- Creates RPCs to allow admins to delete users safely
-- ============================================================

-- Function to safely delete a user entirely
CREATE OR REPLACE FUNCTION public.admin_delete_user(
  p_admin_id uuid,
  p_target_user_id uuid
) RETURNS void AS $$
DECLARE
  v_admin_role text;
BEGIN
  -- Verify caller is admin
  SELECT role INTO v_admin_role FROM public.user_roles WHERE user_id = p_admin_id;
  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can delete users.';
  END IF;

  IF p_admin_id = p_target_user_id THEN
    RAISE EXCEPTION 'Cannot delete your own admin account.';
  END IF;

  -- Delete from auth.users (will cascade to profiles, accounts, etc. if ON DELETE CASCADE is set)
  -- Note: this requires the function to run with privileges that can delete auth.users
  DELETE FROM auth.users WHERE id = p_target_user_id;

  -- Log action
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_admin_id, 'admin_deleted_user', 'auth.users', p_target_user_id::text, jsonb_build_object('deleted_user_id', p_target_user_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
