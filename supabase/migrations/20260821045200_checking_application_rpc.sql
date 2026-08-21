-- Create secure RPC for submitting checking account applications

CREATE OR REPLACE FUNCTION public.submit_checking_application(
    p_user_id uuid,
    p_pin text,
    p_occupation text,
    p_employer text,
    p_business_name text,
    p_income_range text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile record;
    v_kyc record;
    v_active_accounts integer;
    v_pending_apps integer;
    v_app_id uuid;
BEGIN
    -- 1. Check KYC eligibility
    SELECT * INTO v_profile FROM public.profiles WHERE user_id = p_user_id;
    IF v_profile IS NULL THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    IF v_profile.kyc_status NOT LIKE 'approved%' THEN
        RAISE EXCEPTION 'KYC verification is required to apply for a checking account.';
    END IF;

    -- 2. Verify PIN
    PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

    -- 3. Prevent Duplicates
    SELECT count(*) INTO v_active_accounts FROM public.accounts 
    WHERE user_id = p_user_id AND account_type = 'checking' AND status = 'active';
    IF v_active_accounts > 0 THEN
        RAISE EXCEPTION 'You already have an active checking account.';
    END IF;

    SELECT count(*) INTO v_pending_apps FROM public.current_account_applications 
    WHERE user_id = p_user_id AND status IN ('submitted', 'under_review', 'approved');
    IF v_pending_apps > 0 THEN
        RAISE EXCEPTION 'You already have a pending or approved checking account application.';
    END IF;

    -- 4. Get a document URL from KYC as snapshot (optional, can be null)
    SELECT file_url INTO v_kyc FROM public.kyc_documents 
    WHERE user_id = p_user_id AND status = 'approved' AND document_type = 'id_document' LIMIT 1;
    
    -- 5. Insert Application Snapshot
    INSERT INTO public.current_account_applications (
        user_id,
        full_name,
        phone,
        email,
        occupation,
        employer,
        business_name,
        income_range,
        id_document_url,
        utility_bill_url,
        status
    ) VALUES (
        p_user_id,
        v_profile.first_name || ' ' || COALESCE(v_profile.last_name, ''),
        COALESCE(v_profile.phone, ''),
        COALESCE(v_profile.email, ''),
        p_occupation,
        p_employer,
        p_business_name,
        p_income_range,
        v_kyc.file_url,
        NULL,
        'submitted'
    ) RETURNING id INTO v_app_id;

    RETURN jsonb_build_object('success', true, 'application_id', v_app_id);
END;
$$;
