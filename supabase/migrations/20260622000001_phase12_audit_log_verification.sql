-- Phase 12/14: Audit Log Verification for Core Banking Tables
-- This migration binds the existing generic audit logging trigger function
-- to the newly created banking infrastructure tables to ensure exhaustive auditing.
-- 0. Ensure the generic trigger function exists
CREATE OR REPLACE FUNCTION public.log_database_action()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_action TEXT;
  v_entity_id TEXT;
  v_details JSONB;
  v_new_json JSONB;
  v_old_json JSONB;
BEGIN
  -- Attempt to get user ID from Supabase auth context
  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;
  
  -- Determine action type and extract entity data
  IF TG_OP = 'INSERT' THEN
    v_new_json := to_jsonb(NEW);
    v_action := 'db_insert';
    
    -- Try to extract ID (most tables have 'id' column, CMS settings has 'key')
    IF v_new_json ? 'id' THEN v_entity_id := v_new_json->>'id';
    ELSIF v_new_json ? 'key' THEN v_entity_id := v_new_json->>'key';
    ELSE v_entity_id := 'unknown'; END IF;
    
    v_details := jsonb_build_object('new', v_new_json);
    
    -- Fallback for user_id
    IF v_user_id IS NULL AND v_new_json ? 'user_id' THEN
       v_user_id := (v_new_json->>'user_id')::uuid;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    v_new_json := to_jsonb(NEW);
    v_old_json := to_jsonb(OLD);
    v_action := 'db_update';
    
    IF v_new_json ? 'id' THEN v_entity_id := v_new_json->>'id';
    ELSIF v_new_json ? 'key' THEN v_entity_id := v_new_json->>'key';
    ELSE v_entity_id := 'unknown'; END IF;
    
    v_details := jsonb_build_object('old', v_old_json, 'new', v_new_json);
    
    IF v_user_id IS NULL AND v_new_json ? 'user_id' THEN
       v_user_id := (v_new_json->>'user_id')::uuid;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_old_json := to_jsonb(OLD);
    v_action := 'db_delete';
    
    IF v_old_json ? 'id' THEN v_entity_id := v_old_json->>'id';
    ELSIF v_old_json ? 'key' THEN v_entity_id := v_old_json->>'key';
    ELSE v_entity_id := 'unknown'; END IF;
    
    v_details := jsonb_build_object('old', v_old_json);
    
    IF v_user_id IS NULL AND v_old_json ? 'user_id' THEN
       v_user_id := (v_old_json->>'user_id')::uuid;
    END IF;
  END IF;

  -- Create dummy UUID for system actions if no user found
  -- We use a known null/system UUID
  IF v_user_id IS NULL THEN
     v_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- Insert into audit_logs (append trigger prefix to distinguish from frontend logs)
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    v_user_id,
    'trigger_' || v_action,
    TG_TABLE_NAME,
    v_entity_id,
    v_details
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Attach triggers to accounts
DROP TRIGGER IF EXISTS audit_accounts_trigger ON public.accounts;
CREATE TRIGGER audit_accounts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();

-- 2. Attach triggers to transactions
DROP TRIGGER IF EXISTS audit_transactions_trigger ON public.transactions;
CREATE TRIGGER audit_transactions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();

-- 3. Attach triggers to cards
DROP TRIGGER IF EXISTS audit_cards_trigger ON public.cards;
CREATE TRIGGER audit_cards_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();

-- 4. Attach triggers to payment_sessions
DROP TRIGGER IF EXISTS audit_payment_sessions_trigger ON public.payment_sessions;
CREATE TRIGGER audit_payment_sessions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_sessions
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();
