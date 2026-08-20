-- ============================================================
-- Migration: Crypto Quote + Conversion + Transfer RPCs
-- ============================================================

-- Helper: Get latest rate for an asset
CREATE OR REPLACE FUNCTION public.get_latest_crypto_rate(p_symbol TEXT)
RETURNS NUMERIC AS $$
DECLARE
  v_rate NUMERIC;
BEGIN
  SELECT rate_usd INTO v_rate
  FROM public.crypto_exchange_rates
  WHERE asset_symbol = p_symbol
  ORDER BY recorded_at DESC
  LIMIT 1;

  IF v_rate IS NULL THEN
    RAISE EXCEPTION 'No exchange rate available for %. Please refresh rates.', p_symbol;
  END IF;
  RETURN v_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 1. Get Crypto Quote RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_crypto_quote(
  p_user_id UUID,
  p_conversion_type TEXT,   -- 'fiat_to_crypto' | 'crypto_to_fiat' | 'crypto_to_crypto'
  p_from_asset TEXT,        -- 'USD' | 'BTC' | 'ETH' etc.
  p_to_asset TEXT,
  p_from_amount NUMERIC,
  p_from_account_id UUID DEFAULT NULL,   -- required when from_asset = 'USD'
  p_to_account_id UUID DEFAULT NULL      -- required when to_asset = 'USD'
) RETURNS JSON AS $$
DECLARE
  v_fee_config RECORD;
  v_from_rate NUMERIC := 1;    -- USD per unit of from_asset
  v_to_rate NUMERIC := 1;      -- USD per unit of to_asset
  v_amount_usd NUMERIC;
  v_fee_usd NUMERIC;
  v_to_amount NUMERIC;
  v_quote_id UUID;
  v_lock_seconds INTEGER := 30;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF p_from_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  IF p_conversion_type NOT IN ('fiat_to_crypto', 'crypto_to_fiat', 'crypto_to_crypto') THEN
    RAISE EXCEPTION 'Invalid conversion type: %', p_conversion_type;
  END IF;

  -- Load fee config
  SELECT * INTO v_fee_config FROM public.crypto_conversion_fees WHERE conversion_type = p_conversion_type;
  IF NOT FOUND OR NOT v_fee_config.is_active THEN
    RAISE EXCEPTION 'Conversion type % is not available at this time', p_conversion_type;
  END IF;

  -- Get lock duration from account_rules
  SELECT COALESCE(MIN(quote_lock_seconds), 30) INTO v_lock_seconds FROM public.account_rules;

  -- Determine rates
  IF p_conversion_type = 'fiat_to_crypto' THEN
    -- from_asset = USD (rate = 1), to_asset = crypto
    v_from_rate := 1;
    v_to_rate := public.get_latest_crypto_rate(p_to_asset);
    v_amount_usd := p_from_amount;

  ELSIF p_conversion_type = 'crypto_to_fiat' THEN
    -- from_asset = crypto, to_asset = USD
    v_from_rate := public.get_latest_crypto_rate(p_from_asset);
    v_to_rate := 1;
    v_amount_usd := p_from_amount * v_from_rate;

  ELSIF p_conversion_type = 'crypto_to_crypto' THEN
    v_from_rate := public.get_latest_crypto_rate(p_from_asset);
    v_to_rate := public.get_latest_crypto_rate(p_to_asset);
    v_amount_usd := p_from_amount * v_from_rate;
  END IF;

  -- Min/Max conversion check
  IF v_amount_usd < v_fee_config.min_conversion_usd THEN
    RAISE EXCEPTION 'Minimum conversion is $%. Please enter a larger amount.', v_fee_config.min_conversion_usd;
  END IF;
  IF v_fee_config.max_conversion_usd IS NOT NULL AND v_amount_usd > v_fee_config.max_conversion_usd THEN
    RAISE EXCEPTION 'Maximum conversion is $%.', v_fee_config.max_conversion_usd;
  END IF;

  -- Calculate fee (percentage + flat, clamped to min/max)
  v_fee_usd := (v_amount_usd * v_fee_config.percentage_fee) + v_fee_config.flat_fee;
  v_fee_usd := GREATEST(v_fee_config.min_fee, LEAST(v_fee_config.max_fee, v_fee_usd));
  v_fee_usd := ROUND(v_fee_usd, 2);

  -- Calculate to_amount
  IF p_conversion_type = 'fiat_to_crypto' THEN
    v_to_amount := (v_amount_usd - v_fee_usd) / v_to_rate;
  ELSIF p_conversion_type = 'crypto_to_fiat' THEN
    v_to_amount := v_amount_usd - v_fee_usd;
  ELSIF p_conversion_type = 'crypto_to_crypto' THEN
    v_to_amount := (v_amount_usd - v_fee_usd) / v_to_rate;
  END IF;

  v_to_amount := GREATEST(0, v_to_amount);
  v_expires_at := now() + (v_lock_seconds || ' seconds')::INTERVAL;

  -- Expire any existing pending quotes for this user
  UPDATE public.crypto_quotes SET status = 'expired' WHERE user_id = p_user_id AND status = 'pending' AND expires_at < now();

  -- Insert locked quote
  INSERT INTO public.crypto_quotes (
    user_id, conversion_type, from_asset, to_asset,
    from_amount, to_amount, rate_usd, to_rate_usd, fee_usd,
    from_account_id, to_account_id, expires_at, status
  ) VALUES (
    p_user_id, p_conversion_type, p_from_asset, p_to_asset,
    p_from_amount, v_to_amount, v_from_rate, v_to_rate, v_fee_usd,
    p_from_account_id, p_to_account_id, v_expires_at, 'pending'
  ) RETURNING id INTO v_quote_id;

  RETURN json_build_object(
    'quote_id', v_quote_id,
    'conversion_type', p_conversion_type,
    'from_asset', p_from_asset,
    'to_asset', p_to_asset,
    'from_amount', p_from_amount,
    'to_amount', ROUND(v_to_amount::NUMERIC, 8),
    'rate_usd', v_from_rate,
    'to_rate_usd', v_to_rate,
    'fee_usd', v_fee_usd,
    'expires_at', v_expires_at,
    'lock_seconds', v_lock_seconds
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. Execute Crypto Conversion RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.execute_crypto_conversion(
  p_user_id UUID,
  p_quote_id UUID,
  p_pin TEXT
) RETURNS JSON AS $$
DECLARE
  v_quote RECORD;
  v_from_wallet RECORD;
  v_to_wallet_id UUID;
  v_fiat_account RECORD;
  v_fiat_balance NUMERIC;
  v_reference TEXT;
  v_fiat_tx_id UUID;
  v_new_from_balance NUMERIC;
  v_new_to_balance NUMERIC;
BEGIN
  -- Verify PIN
  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

  -- Load and validate quote
  SELECT * INTO v_quote FROM public.crypto_quotes
  WHERE id = p_quote_id AND user_id = p_user_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found or has already been used';
  END IF;

  IF now() > v_quote.expires_at THEN
    UPDATE public.crypto_quotes SET status = 'expired' WHERE id = p_quote_id;
    RAISE EXCEPTION 'Quote expired. Please get a new rate to continue.';
  END IF;

  -- Generate reference
  v_reference := 'CCV-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));

  -- ---- FIAT TO CRYPTO ----
  IF v_quote.conversion_type = 'fiat_to_crypto' THEN
    -- Check fiat account balance
    SELECT * INTO v_fiat_account FROM public.accounts
    WHERE id = v_quote.from_account_id AND user_id = p_user_id AND status = 'active';
    IF NOT FOUND THEN RAISE EXCEPTION 'Fiat source account not found or inactive'; END IF;
    IF v_fiat_account.balance < v_quote.from_amount THEN
      RAISE EXCEPTION 'Insufficient fiat balance. Available: $%', v_fiat_account.balance;
    END IF;

    -- Debit fiat account
    INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
    VALUES (p_user_id, v_quote.from_account_id, 'crypto_conversion_debit', v_quote.from_amount,
      'Fiat to Crypto: Buy ' || v_quote.to_asset || ' for $' || v_quote.from_amount, v_reference, 'completed')
    RETURNING id INTO v_fiat_tx_id;

    -- Credit crypto wallet (upsert)
    INSERT INTO public.digital_currency_wallets (user_id, asset_symbol, asset_name, balance)
    VALUES (p_user_id, v_quote.to_asset, v_quote.to_asset, v_quote.to_amount)
    ON CONFLICT (user_id, asset_symbol) DO UPDATE
      SET balance = digital_currency_wallets.balance + v_quote.to_amount,
          updated_at = now()
    RETURNING balance INTO v_new_to_balance;

    SELECT balance INTO v_new_to_balance FROM public.digital_currency_wallets
    WHERE user_id = p_user_id AND asset_symbol = v_quote.to_asset;

    SELECT balance INTO v_new_from_balance FROM public.accounts WHERE id = v_quote.from_account_id;

    -- Ledger entry for crypto credit
    INSERT INTO public.crypto_ledger_entries (
      user_id, asset_symbol, entry_type, quantity, balance_after,
      rate_usd, value_usd, reference, quote_id, related_fiat_tx_id,
      metadata
    ) VALUES (
      p_user_id, v_quote.to_asset, 'conversion_in', v_quote.to_amount, v_new_to_balance,
      v_quote.to_rate_usd, v_quote.from_amount, v_reference, p_quote_id, v_fiat_tx_id,
      jsonb_build_object('from_asset', 'USD', 'from_amount', v_quote.from_amount, 'fee_usd', v_quote.fee_usd)
    );

  -- ---- CRYPTO TO FIAT ----
  ELSIF v_quote.conversion_type = 'crypto_to_fiat' THEN
    -- Check crypto wallet balance
    SELECT * INTO v_from_wallet FROM public.digital_currency_wallets
    WHERE user_id = p_user_id AND asset_symbol = v_quote.from_asset;
    IF NOT FOUND OR v_from_wallet.balance < v_quote.from_amount THEN
      RAISE EXCEPTION 'Insufficient % balance', v_quote.from_asset;
    END IF;

    -- Check destination fiat account
    SELECT * INTO v_fiat_account FROM public.accounts
    WHERE id = v_quote.to_account_id AND user_id = p_user_id AND status = 'active';
    IF NOT FOUND THEN RAISE EXCEPTION 'Destination fiat account not found or inactive'; END IF;

    -- Debit crypto wallet
    UPDATE public.digital_currency_wallets
    SET balance = balance - v_quote.from_amount, updated_at = now()
    WHERE user_id = p_user_id AND asset_symbol = v_quote.from_asset;

    SELECT balance INTO v_new_from_balance FROM public.digital_currency_wallets
    WHERE user_id = p_user_id AND asset_symbol = v_quote.from_asset;

    -- Credit fiat account
    INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
    VALUES (p_user_id, v_quote.to_account_id, 'crypto_conversion_credit', v_quote.to_amount,
      'Crypto to Fiat: Sold ' || v_quote.from_amount || ' ' || v_quote.from_asset, v_reference, 'completed')
    RETURNING id INTO v_fiat_tx_id;

    -- Ledger entry for crypto debit
    INSERT INTO public.crypto_ledger_entries (
      user_id, asset_symbol, entry_type, quantity, balance_after,
      rate_usd, value_usd, reference, quote_id, related_fiat_tx_id, metadata
    ) VALUES (
      p_user_id, v_quote.from_asset, 'conversion_out', -v_quote.from_amount, v_new_from_balance,
      v_quote.rate_usd, v_quote.to_amount, v_reference, p_quote_id, v_fiat_tx_id,
      jsonb_build_object('to_asset', 'USD', 'to_amount', v_quote.to_amount, 'fee_usd', v_quote.fee_usd)
    );

  -- ---- CRYPTO TO CRYPTO ----
  ELSIF v_quote.conversion_type = 'crypto_to_crypto' THEN
    -- Check source wallet
    SELECT * INTO v_from_wallet FROM public.digital_currency_wallets
    WHERE user_id = p_user_id AND asset_symbol = v_quote.from_asset;
    IF NOT FOUND OR v_from_wallet.balance < v_quote.from_amount THEN
      RAISE EXCEPTION 'Insufficient % balance', v_quote.from_asset;
    END IF;

    -- Debit source crypto
    UPDATE public.digital_currency_wallets
    SET balance = balance - v_quote.from_amount, updated_at = now()
    WHERE user_id = p_user_id AND asset_symbol = v_quote.from_asset;

    SELECT balance INTO v_new_from_balance FROM public.digital_currency_wallets
    WHERE user_id = p_user_id AND asset_symbol = v_quote.from_asset;

    -- Credit destination crypto (upsert)
    INSERT INTO public.digital_currency_wallets (user_id, asset_symbol, asset_name, balance)
    VALUES (p_user_id, v_quote.to_asset, v_quote.to_asset, v_quote.to_amount)
    ON CONFLICT (user_id, asset_symbol) DO UPDATE
      SET balance = digital_currency_wallets.balance + v_quote.to_amount, updated_at = now();

    SELECT balance INTO v_new_to_balance FROM public.digital_currency_wallets
    WHERE user_id = p_user_id AND asset_symbol = v_quote.to_asset;

    -- Ledger: debit from source
    INSERT INTO public.crypto_ledger_entries (
      user_id, asset_symbol, entry_type, quantity, balance_after,
      rate_usd, value_usd, reference, quote_id, metadata
    ) VALUES (
      p_user_id, v_quote.from_asset, 'conversion_out', -v_quote.from_amount, v_new_from_balance,
      v_quote.rate_usd, v_quote.from_amount * v_quote.rate_usd, v_reference, p_quote_id,
      jsonb_build_object('to_asset', v_quote.to_asset, 'to_amount', v_quote.to_amount, 'fee_usd', v_quote.fee_usd)
    );

    -- Ledger: credit to destination
    INSERT INTO public.crypto_ledger_entries (
      user_id, asset_symbol, entry_type, quantity, balance_after,
      rate_usd, value_usd, reference, quote_id, metadata
    ) VALUES (
      p_user_id, v_quote.to_asset, 'conversion_in', v_quote.to_amount, v_new_to_balance,
      v_quote.to_rate_usd, v_quote.to_amount * v_quote.to_rate_usd, v_reference, p_quote_id,
      jsonb_build_object('from_asset', v_quote.from_asset, 'from_amount', v_quote.from_amount, 'fee_usd', v_quote.fee_usd)
    );
  END IF;

  -- Mark quote as used
  UPDATE public.crypto_quotes SET status = 'used' WHERE id = p_quote_id;

  -- Audit
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, 'crypto_conversion', 'crypto_quotes', p_quote_id::text,
    jsonb_build_object(
      'type', v_quote.conversion_type,
      'from', v_quote.from_asset,
      'to', v_quote.to_asset,
      'from_amount', v_quote.from_amount,
      'to_amount', v_quote.to_amount,
      'fee_usd', v_quote.fee_usd,
      'reference', v_reference
    ));

  -- Notify
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (p_user_id, 'Conversion Complete',
    'Converted ' || v_quote.from_amount || ' ' || v_quote.from_asset ||
    ' to ' || ROUND(v_quote.to_amount::NUMERIC, 6) || ' ' || v_quote.to_asset ||
    '. Fee: $' || v_quote.fee_usd || '. Ref: ' || v_reference,
    'success');

  RETURN json_build_object(
    'success', true,
    'reference', v_reference,
    'from_asset', v_quote.from_asset,
    'to_asset', v_quote.to_asset,
    'from_amount', v_quote.from_amount,
    'to_amount', v_quote.to_amount,
    'fee_usd', v_quote.fee_usd
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. Execute External Crypto Transfer RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.execute_crypto_transfer(
  p_user_id UUID,
  p_asset_symbol TEXT,
  p_network TEXT,
  p_destination_address TEXT,
  p_amount NUMERIC,
  p_pin TEXT
) RETURNS JSON AS $$
DECLARE
  v_wallet RECORD;
  v_new_balance NUMERIC;
  v_reference TEXT;
  v_kyc_tier INTEGER;
BEGIN
  -- Verify PIN
  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  IF p_destination_address IS NULL OR trim(p_destination_address) = '' THEN
    RAISE EXCEPTION 'Destination wallet address is required';
  END IF;

  IF p_network IS NULL OR trim(p_network) = '' THEN
    RAISE EXCEPTION 'Network selection is required';
  END IF;

  -- KYC check
  SELECT kyc_tier INTO v_kyc_tier FROM public.profiles WHERE user_id = p_user_id;
  IF v_kyc_tier IS NULL OR v_kyc_tier < 2 THEN
    RAISE EXCEPTION 'KYC Tier 2 or higher is required for external crypto transfers';
  END IF;

  -- Check wallet and balance
  SELECT * INTO v_wallet FROM public.digital_currency_wallets
  WHERE user_id = p_user_id AND asset_symbol = p_asset_symbol;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No % wallet found', p_asset_symbol;
  END IF;
  IF v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient % balance. Available: %', p_asset_symbol, v_wallet.balance;
  END IF;

  -- Debit wallet
  UPDATE public.digital_currency_wallets
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id AND asset_symbol = p_asset_symbol;

  SELECT balance INTO v_new_balance FROM public.digital_currency_wallets
  WHERE user_id = p_user_id AND asset_symbol = p_asset_symbol;

  v_reference := 'CTX-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));

  -- Ledger entry
  INSERT INTO public.crypto_ledger_entries (
    user_id, asset_symbol, entry_type, quantity, balance_after,
    reference, metadata
  ) VALUES (
    p_user_id, p_asset_symbol, 'transfer_out', -p_amount, v_new_balance,
    v_reference,
    jsonb_build_object('network', p_network, 'destination', p_destination_address, 'status', 'pending_broadcast')
  );

  -- Audit
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, 'crypto_external_transfer', 'digital_currency_wallets', v_wallet.id::text,
    jsonb_build_object(
      'asset', p_asset_symbol, 'network', p_network,
      'destination', p_destination_address, 'amount', p_amount, 'reference', v_reference
    ));

  -- Notify
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (p_user_id, 'Crypto Transfer Submitted',
    p_amount || ' ' || p_asset_symbol || ' sent to ' || LEFT(p_destination_address, 8) || '...' ||
    RIGHT(p_destination_address, 6) || ' on ' || p_network || ' network. Ref: ' || v_reference,
    'transaction');

  RETURN json_build_object(
    'success', true,
    'reference', v_reference,
    'asset', p_asset_symbol,
    'amount', p_amount,
    'network', p_network,
    'destination', p_destination_address,
    'status', 'pending_broadcast'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
