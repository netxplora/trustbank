-- ============================================================
-- Phase 1: Transaction PIN Base Schema & Core RPCs
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Add PIN tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS transaction_pin_hash TEXT,
ADD COLUMN IF NOT EXISTS transaction_pin_set_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS transaction_pin_failed_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS transaction_pin_locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS transaction_pin_updated_at TIMESTAMPTZ;

-- 2. Helper function to validate PIN format
CREATE OR REPLACE FUNCTION public.is_valid_pin_format(p_pin TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Must be exactly 4 digits
  IF p_pin !~ '^[0-9]{4}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Reject obvious PINs
  IF p_pin IN ('0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '9876') THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Core Verification Logic (Internal Use)
CREATE OR REPLACE FUNCTION public.verify_transaction_pin_internal(p_user_id UUID, p_pin TEXT)
RETURNS VOID AS $$
DECLARE
  v_profile RECORD;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_profile.transaction_pin_hash IS NULL THEN
    RAISE EXCEPTION 'Transaction PIN not set up. Please set it in your Security settings.';
  END IF;

  IF v_profile.transaction_pin_locked_until IS NOT NULL AND v_profile.transaction_pin_locked_until > now() THEN
    RAISE EXCEPTION 'PIN entry locked due to too many failed attempts. Try again later.';
  END IF;

  IF v_profile.transaction_pin_hash = crypt(p_pin, v_profile.transaction_pin_hash) THEN
    -- Success: reset failed attempts
    UPDATE public.profiles 
    SET transaction_pin_failed_attempts = 0, transaction_pin_locked_until = NULL
    WHERE user_id = p_user_id;

    -- Audit log
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_user_id, 'transaction_pin_verified', 'profiles', p_user_id::TEXT, '{"status": "success"}');
    
    RETURN;
  ELSE
    -- Failure: increment failed attempts
    UPDATE public.profiles 
    SET 
      transaction_pin_failed_attempts = COALESCE(transaction_pin_failed_attempts, 0) + 1,
      transaction_pin_locked_until = CASE 
        WHEN COALESCE(transaction_pin_failed_attempts, 0) + 1 >= 3 THEN now() + interval '15 minutes'
        ELSE NULL
      END
    WHERE user_id = p_user_id;

    -- Audit log
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_user_id, 'transaction_pin_failed', 'profiles', p_user_id::TEXT, '{"status": "failed"}');

    RAISE EXCEPTION 'Invalid Transaction PIN';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Setup Transaction PIN
CREATE OR REPLACE FUNCTION public.setup_transaction_pin(p_pin TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_hash TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  IF NOT public.is_valid_pin_format(p_pin) THEN
    RAISE EXCEPTION 'Invalid PIN format. Must be 4 digits and not obvious (e.g. 1234, 0000)';
  END IF;

  -- Ensure they don't already have one
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_user_id AND transaction_pin_hash IS NOT NULL) THEN
    RAISE EXCEPTION 'Transaction PIN is already set';
  END IF;

  v_hash := crypt(p_pin, gen_salt('bf', 10));

  UPDATE public.profiles 
  SET 
    transaction_pin_hash = v_hash,
    transaction_pin_set_at = now(),
    transaction_pin_updated_at = now()
  WHERE user_id = v_user_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id)
  VALUES (v_user_id, 'transaction_pin_setup', 'profiles', v_user_id::TEXT);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Change Transaction PIN
CREATE OR REPLACE FUNCTION public.change_transaction_pin(p_old_pin TEXT, p_new_pin TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_hash TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  IF NOT public.is_valid_pin_format(p_new_pin) THEN
    RAISE EXCEPTION 'Invalid new PIN format';
  END IF;

  -- Verify old PIN (throws exception if invalid)
  PERFORM public.verify_transaction_pin_internal(v_user_id, p_old_pin);

  -- Set new PIN
  v_hash := crypt(p_new_pin, gen_salt('bf', 10));

  UPDATE public.profiles 
  SET 
    transaction_pin_hash = v_hash,
    transaction_pin_updated_at = now()
  WHERE user_id = v_user_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id)
  VALUES (v_user_id, 'transaction_pin_changed', 'profiles', v_user_id::TEXT);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Reset Transaction PIN
CREATE OR REPLACE FUNCTION public.reset_transaction_pin(p_new_pin TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_hash TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  IF NOT public.is_valid_pin_format(p_new_pin) THEN
    RAISE EXCEPTION 'Invalid new PIN format';
  END IF;

  -- In a production environment, this should ideally require verifying an OTP token
  -- sent to email. For this prototype, we allow direct resets when authenticated.
  
  v_hash := crypt(p_new_pin, gen_salt('bf', 10));

  UPDATE public.profiles 
  SET 
    transaction_pin_hash = v_hash,
    transaction_pin_updated_at = now(),
    transaction_pin_failed_attempts = 0,
    transaction_pin_locked_until = NULL
  WHERE user_id = v_user_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id)
  VALUES (v_user_id, 'transaction_pin_reset', 'profiles', v_user_id::TEXT);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
