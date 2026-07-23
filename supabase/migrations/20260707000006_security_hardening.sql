-- ============================================================
-- Phase 2/3/4: Security Hardening - RBAC, Fraud Detection, RLS
-- ============================================================

-- 1. EXPANDED RBAC ROLES
-- Add new granular roles for enterprise compliance
DO $$
BEGIN
  -- Ensure user_roles table accepts new role values
  ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS chk_user_roles_role;
  ALTER TABLE public.user_roles ADD CONSTRAINT chk_user_roles_role 
    CHECK (role IN (
      'customer', 'support_admin', 'relationship_manager', 'compliance_officer',
      'finance_officer', 'operations_officer', 'auditor', 'admin', 'super_admin'
    ));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Role constraint already exists or table not ready: %', SQLERRM;
END $$;

-- 2. FRAUD DETECTION: High-Velocity Transaction Alert Trigger
-- Flags users making more than 10 transactions within a 5-minute window
CREATE OR REPLACE FUNCTION public.detect_high_velocity_transactions()
RETURNS TRIGGER AS $$
DECLARE
  v_recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_recent_count
  FROM public.transactions
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '5 minutes';

  IF v_recent_count > 10 THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.user_id, 'Security Alert', 'Unusual transaction activity detected on your account. If this was not you, please contact support immediately.', 'security');

    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, 'fraud_alert_high_velocity', 'transactions', NEW.id::text,
      jsonb_build_object('count_5min', v_recent_count, 'amount', NEW.amount, 'type', NEW.type));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_fraud_high_velocity ON public.transactions;
CREATE TRIGGER trg_fraud_high_velocity
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.detect_high_velocity_transactions();

-- 3. FRAUD DETECTION: Large Transaction Alert
-- Flags individual transactions over $50,000
CREATE OR REPLACE FUNCTION public.detect_large_transactions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount > 50000 THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, 'fraud_alert_large_transaction', 'transactions', NEW.id::text,
      jsonb_build_object('amount', NEW.amount, 'type', NEW.type, 'threshold', 50000));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_fraud_large_tx ON public.transactions;
CREATE TRIGGER trg_fraud_large_tx
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.detect_large_transactions();

-- 4. RLS HARDENING: Ensure DELETE is restricted on critical tables
-- Prevent users from deleting their own transactions (immutable ledger)
DROP POLICY IF EXISTS "Users cannot delete transactions" ON public.transactions;
CREATE POLICY "Users cannot delete transactions" ON public.transactions
  FOR DELETE USING (false);

-- Prevent users from deleting their own accounts
DROP POLICY IF EXISTS "Users cannot delete accounts" ON public.accounts;
CREATE POLICY "Users cannot delete accounts" ON public.accounts
  FOR DELETE USING (false);

-- Prevent users from deleting audit logs (immutable)
DROP POLICY IF EXISTS "Nobody can delete audit logs" ON public.audit_logs;
CREATE POLICY "Nobody can delete audit logs" ON public.audit_logs
  FOR DELETE USING (false);

-- Prevent users from updating audit logs (immutable)
DROP POLICY IF EXISTS "Nobody can update audit logs" ON public.audit_logs;
CREATE POLICY "Nobody can update audit logs" ON public.audit_logs
  FOR UPDATE USING (false);

-- 5. ADDITIONAL INDICES for query performance under load
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_user_status ON public.accounts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_tier ON public.profiles(kyc_tier);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_status ON public.payment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_transfers_user_created ON public.transfers(user_id, created_at DESC);

-- 6. PREVENT SELF-TRANSFER
-- Add a check constraint to the transfers table
ALTER TABLE public.transfers
  ADD CONSTRAINT chk_no_self_transfer CHECK (
    from_account_id IS NULL OR to_account_number IS NULL OR
    from_account_id::text != to_account_number
  );
