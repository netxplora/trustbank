
CREATE TABLE IF NOT EXISTS public.stock_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number TEXT UNIQUE NOT NULL,
    verification_code TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES public.investment_accounts(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    ticker TEXT NOT NULL,
    shares_held NUMERIC NOT NULL,
    total_value NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    issue_date TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stock_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
    ON public.stock_certificates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Public can view certificates by verification_code"
    ON public.stock_certificates FOR SELECT
    USING (true);

CREATE OR REPLACE FUNCTION generate_stock_certificate(
    p_holding_id UUID
) RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_account_id UUID;
    v_company_name TEXT;
    v_ticker TEXT;
    v_shares_held NUMERIC;
    v_current_price NUMERIC;
    v_total_value NUMERIC;
    v_cert_id UUID;
    v_cert_number TEXT;
    v_verification_code TEXT;
    v_result JSON;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT 
        h.account_id,
        h.symbol,
        h.name,
        h.quantity,
        COALESCE(s.current_price, 0)
    INTO
        v_account_id,
        v_ticker,
        v_company_name,
        v_shares_held,
        v_current_price
    FROM public.investment_holdings h
    JOIN public.investment_accounts a ON h.account_id = a.id
    LEFT JOIN public.available_stocks s ON h.symbol = s.symbol
    WHERE h.id = p_holding_id AND a.user_id = v_user_id;

    IF v_account_id IS NULL THEN
        RAISE EXCEPTION 'Holding not found or does not belong to user';
    END IF;

    v_total_value := v_shares_held * v_current_price;

    v_cert_number := 'CERT-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text), 1, 6));
    v_verification_code := upper(substring(md5(random()::text), 1, 16));

    INSERT INTO public.stock_certificates (
        certificate_number,
        verification_code,
        user_id,
        account_id,
        company_name,
        ticker,
        shares_held,
        total_value
    ) VALUES (
        v_cert_number,
        v_verification_code,
        v_user_id,
        v_account_id,
        v_company_name,
        v_ticker,
        v_shares_held,
        v_total_value
    ) RETURNING id INTO v_cert_id;

    v_result := json_build_object(
        'success', true,
        'certificate_id', v_cert_id,
        'verification_code', v_verification_code,
        'certificate_number', v_cert_number
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
