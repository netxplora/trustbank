-- Unified Deposits View
CREATE OR REPLACE VIEW public.admin_deposits_view AS
SELECT
    f.id,
    f.user_id,
    p.display_name AS customer_name,
    p.email AS customer_email,
    f.amount,
    'USD' AS currency,
    f.method AS method,
    f.reference,
    NULL AS network,
    f.status,
    f.proof_url,
    f.created_at,
    'fiat' AS deposit_type,
    NULL AS wallet_id,
    f.account_id
FROM public.payment_sessions f
LEFT JOIN public.profiles p ON f.user_id = p.id

UNION ALL

SELECT
    c.id,
    c.user_id,
    p.display_name AS customer_name,
    p.email AS customer_email,
    c.amount,
    w.cryptocurrency AS currency,
    'crypto_transfer' AS method,
    c.tx_hash AS reference,
    w.network AS network,
    c.status,
    c.proof_url,
    c.created_at,
    'crypto' AS deposit_type,
    c.wallet_id,
    NULL AS account_id
FROM public.crypto_deposits c
LEFT JOIN public.profiles p ON c.user_id = p.id
LEFT JOIN public.crypto_wallets w ON c.wallet_id = w.id;

GRANT SELECT ON public.admin_deposits_view TO authenticated, service_role;


-- Helper RPC for rejecting either deposit type
CREATE OR REPLACE FUNCTION public.admin_reject_any_deposit(
  p_admin_id uuid,
  p_deposit_id uuid,
  p_deposit_type text, -- 'fiat' or 'crypto'
  p_reason text
) RETURNS void AS $$
DECLARE
  v_admin_role text;
  v_amount numeric;
BEGIN
  -- Verify caller is admin
  SELECT role INTO v_admin_role FROM public.user_roles WHERE user_id = p_admin_id;
  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can reject deposits.';
  END IF;

  IF p_deposit_type = 'fiat' THEN
    UPDATE public.payment_sessions 
    SET status = 'rejected', notes = p_reason, updated_at = now()
    WHERE id = p_deposit_id RETURNING amount INTO v_amount;
    
    INSERT INTO public.payment_audit_logs (payment_session_id, admin_user_id, action, previous_status, new_status, notes)
    VALUES (p_deposit_id, p_admin_id, 'admin_rejected_fiat_deposit', 'under_review', 'rejected', p_reason);
    
  ELSIF p_deposit_type = 'crypto' THEN
    UPDATE public.crypto_deposits 
    SET status = 'rejected', admin_notes = p_reason, reviewed_by = p_admin_id, updated_at = now()
    WHERE id = p_deposit_id RETURNING amount INTO v_amount;
    
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_admin_id, 'admin_rejected_crypto_deposit', 'crypto_deposits', p_deposit_id, jsonb_build_object('reason', p_reason, 'amount', v_amount));
    
  ELSE
    RAISE EXCEPTION 'Invalid deposit type';
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_reject_any_deposit(uuid, uuid, text, text) TO authenticated;
