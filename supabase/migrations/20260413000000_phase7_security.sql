-- Phase 7: Security & Audit Logging Enhancements

-- 1. Create a generic trigger function to log database actions
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


-- 2. Attach triggers to critical tables
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();

DROP TRIGGER IF EXISTS audit_loans_trigger ON public.loans;
CREATE TRIGGER audit_loans_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();

DROP TRIGGER IF EXISTS audit_investments_trigger ON public.investment_orders;
CREATE TRIGGER audit_investments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.investment_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();

DROP TRIGGER IF EXISTS audit_cms_settings_trigger ON public.cms_site_settings;
CREATE TRIGGER audit_cms_settings_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.cms_site_settings
  FOR EACH ROW EXECUTE FUNCTION public.log_database_action();


-- 3. Add Performance Indexes for Audit Logs (to support fast filtering & pagination)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
