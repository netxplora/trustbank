-- ============================================================
-- Phase 2: Transaction PIN Enforcement
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_transfer(p_user_id UUID,
  p_from_account_id UUID,
  p_to_account_number TEXT,
  p_amount NUMERIC,
  p_narration TEXT,
  p_to_name TEXT,
  p_to_bank TEXT,
  p_pin TEXT) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
  v_kyc_tier INTEGER;
  v_daily_total NUMERIC := 0;
  v_daily_limit NUMERIC;
  v_tx_limit NUMERIC;
  v_transfer_id UUID;
  v_internal_receiver_id UUID;
  v_internal_account_id UUID;
  v_reference TEXT;
  v_sender_name TEXT;
BEGIN

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  -- 1. KYC Tier Check
  SELECT kyc_tier INTO v_kyc_tier FROM public.profiles WHERE user_id = p_user_id;
  IF v_kyc_tier IS NULL OR v_kyc_tier = 0 THEN
    RAISE EXCEPTION 'Your account is unverified. Please complete KYC Tier 1 to enable transfers.';
  END IF;
  
  -- Assign Limits based on Tier
  IF v_kyc_tier = 1 THEN
    v_tx_limit := 5000;
    v_daily_limit := 10000;
  ELSIF v_kyc_tier = 2 THEN
    v_tx_limit := 50000;
    v_daily_limit := 100000;
  ELSIF v_kyc_tier = 3 THEN
    v_tx_limit := 500000;
    v_daily_limit := 1000000;
  END IF;

  -- 2. Per-Transaction Limit Check
  IF p_amount > v_tx_limit THEN
    RAISE EXCEPTION 'Transfer exceeds your Tier % limit of $%. Please upgrade your KYC tier.', v_kyc_tier, v_tx_limit;
  END IF;

  -- 3. Daily Velocity Limit Check
  -- Calculate total transfers sent by user in the last 24 hours
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM public.transfers
  WHERE user_id = p_user_id
  AND status = 'completed'
  AND created_at >= NOW() - INTERVAL '24 hours';

  IF (v_daily_total + p_amount) > v_daily_limit THEN
    RAISE EXCEPTION 'Transfer blocked: Exceeds your daily Tier % limit of $%. You have already transferred $% in the last 24 hours.', v_kyc_tier, v_daily_limit, v_daily_total;
  END IF;

  -- 4. Check Balance
  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_from_account_id AND user_id = p_user_id AND status = 'active';
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Source account not found or inactive';
  END IF;
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;
  
  -- 5. Generate Reference
  v_reference := 'TRF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));

  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = p_user_id;

  -- 6. Check if Internal Transfer (TrustBank)
  IF p_to_bank = 'TrustBank' OR p_to_bank IS NULL OR p_to_bank = '' THEN
    SELECT id, user_id INTO v_internal_account_id, v_internal_receiver_id FROM public.accounts WHERE account_number = p_to_account_number AND status = 'active';
    IF v_internal_account_id IS NULL THEN
       RAISE EXCEPTION 'Destination TrustBank account not found or inactive';
    END IF;
  END IF;

  -- 7. Create Transfer Record
  INSERT INTO public.transfers (user_id, from_account_id, to_account_number, to_name, to_bank, amount, narration, reference, status)
  VALUES (p_user_id, p_from_account_id, p_to_account_number, p_to_name, COALESCE(p_to_bank, 'TrustBank'), p_amount, p_narration, v_reference, 'completed')
  RETURNING id INTO v_transfer_id;

  -- 8. Create Debit Transaction (Trigger handles balance update)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, recipient_name, recipient_account, recipient_bank, status)
  VALUES (p_user_id, p_from_account_id, 'debit', p_amount, 'Transfer to ' || COALESCE(p_to_name, p_to_account_number), v_reference, p_to_name, p_to_account_number, COALESCE(p_to_bank, 'TrustBank'), 'completed');

  -- 9. Create Credit Transaction if Internal
  IF v_internal_account_id IS NOT NULL THEN
    INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
    VALUES (v_internal_receiver_id, v_internal_account_id, 'credit', p_amount, 'Transfer from ' || v_sender_name, v_reference, 'completed');
    
    -- Notify Receiver
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (v_internal_receiver_id, 'Funds Received', 'You received $' || p_amount || ' from ' || v_sender_name, 'success');
  END IF;
  
  -- 10. Audit Log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, 'transfer_executed', 'transfers', v_transfer_id::text, jsonb_build_object('amount', p_amount, 'to', p_to_account_number, 'bank', p_to_bank, 'ref', v_reference));

  RETURN json_build_object('success', true, 'transfer_id', v_transfer_id, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.process_international_wire(p_user_id UUID,
  p_from_account_id UUID,
  p_to_account_number TEXT,
  p_to_name TEXT,
  p_to_bank TEXT,
  p_swift_code TEXT,
  p_iban TEXT,
  p_target_currency TEXT,
  p_exchange_rate NUMERIC,
  p_amount_usd NUMERIC,
  p_destination_amount NUMERIC,
  p_narration TEXT,
  p_pin TEXT) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
  v_kyc_tier INTEGER;
  v_daily_total NUMERIC := 0;
  v_daily_limit NUMERIC;
  v_tx_limit NUMERIC;
  v_transfer_id UUID;
  v_reference TEXT;
  v_sender_name TEXT;
  v_wire_fee NUMERIC := 45.00;
  v_total_deduction NUMERIC;
BEGIN

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

  IF p_amount_usd <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  -- 1. KYC Tier Check
  SELECT kyc_tier INTO v_kyc_tier FROM public.profiles WHERE user_id = p_user_id;
  IF v_kyc_tier IS NULL OR v_kyc_tier = 0 THEN
    RAISE EXCEPTION 'Your account is unverified. Please complete KYC Tier 1 to enable international wires.';
  END IF;
  
  -- Assign Limits based on Tier
  IF v_kyc_tier = 1 THEN
    v_tx_limit := 5000;
    v_daily_limit := 10000;
  ELSIF v_kyc_tier = 2 THEN
    v_tx_limit := 50000;
    v_daily_limit := 100000;
  ELSIF v_kyc_tier = 3 THEN
    v_tx_limit := 500000;
    v_daily_limit := 1000000;
    v_wire_fee := 0; -- Private Wealth clients get free wires
  END IF;

  -- 2. Per-Transaction Limit Check
  IF p_amount_usd > v_tx_limit THEN
    RAISE EXCEPTION 'Transfer exceeds your Tier % limit of $%. Please upgrade your KYC tier.', v_kyc_tier, v_tx_limit;
  END IF;

  -- 3. Daily Velocity Limit Check
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM public.transfers
  WHERE user_id = p_user_id
  AND status = 'completed'
  AND created_at >= NOW() - INTERVAL '24 hours';

  IF (v_daily_total + p_amount_usd) > v_daily_limit THEN
    RAISE EXCEPTION 'Transfer blocked: Exceeds your daily Tier % limit of $%. You have already transferred $% in the last 24 hours.', v_kyc_tier, v_daily_limit, v_daily_total;
  END IF;

  -- 4. Check Balance
  v_total_deduction := p_amount_usd + v_wire_fee;
  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_from_account_id AND user_id = p_user_id AND status = 'active';
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Source account not found or inactive';
  END IF;
  IF v_balance < v_total_deduction THEN
    RAISE EXCEPTION 'Insufficient funds. A balance of $% is required including the wire fee.', v_total_deduction;
  END IF;
  
  -- 5. Generate Reference
  v_reference := 'SWIFT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));
  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = p_user_id;

  -- 6. Create Transfer Record
  INSERT INTO public.transfers (
    user_id, from_account_id, to_account_number, to_name, to_bank, 
    amount, narration, reference, status, transfer_type,
    swift_code, iban, target_currency, exchange_rate, destination_amount
  )
  VALUES (
    p_user_id, p_from_account_id, p_to_account_number, p_to_name, p_to_bank, 
    p_amount_usd, p_narration, v_reference, 'completed', 'international',
    p_swift_code, p_iban, p_target_currency, p_exchange_rate, p_destination_amount
  )
  RETURNING id INTO v_transfer_id;

  -- 7. Create Debit Transaction for Principal
  INSERT INTO public.transactions (
    user_id, account_id, type, amount, description, reference, 
    recipient_name, recipient_account, recipient_bank, status
  )
  VALUES (
    p_user_id, p_from_account_id, 'debit', p_amount_usd, 
    'International Wire to ' || COALESCE(p_to_name, 'Unknown'), v_reference, 
    p_to_name, p_to_account_number, p_to_bank, 'completed'
  );

  -- 8. Deduct Wire Fee if applicable
  IF v_wire_fee > 0 THEN
    INSERT INTO public.transactions (
      user_id, account_id, type, amount, description, reference, status
    )
    VALUES (
      p_user_id, p_from_account_id, 'fee', v_wire_fee, 
      'SWIFT International Wire Fee', v_reference || '-FEE', 'completed'
    );
    
    -- Credit the bank portfolio (assuming it exists from previous migrations)
    UPDATE public.bank_portfolio 
    SET total_fees_collected = total_fees_collected + v_wire_fee,
        updated_at = NOW()
    WHERE id = (SELECT id FROM public.bank_portfolio LIMIT 1);
  END IF;

  RETURN json_build_object('success', true, 'transfer_id', v_transfer_id, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.process_bill_payment(p_user_id UUID,
  p_account_id UUID,
  p_payee_name TEXT,
  p_category TEXT,
  p_amount NUMERIC,
  p_account_masked TEXT,
  p_pin TEXT) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
  v_reference TEXT;
  v_payment_id UUID;
BEGIN

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;

  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_account_id AND user_id = p_user_id AND status = 'active';
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Account not found or inactive'; END IF;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;
  
  v_reference := 'BPY-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));

  -- Insert Payment Log
  INSERT INTO public.payments (user_id, account_id, payment_type, provider, amount, phone_or_reference, reference, status)
  VALUES (p_user_id, p_account_id, p_category, p_payee_name, p_amount, p_account_masked, v_reference, 'completed')
  RETURNING id INTO v_payment_id;

  -- Insert Debit Transaction (Trigger handles balance)
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (p_user_id, p_account_id, 'bill_payment', p_amount, 'Bill Pay: ' || p_payee_name, v_reference, 'completed');

  -- Notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (p_user_id, 'Bill Payment Sent', '$' || p_amount || ' paid to ' || p_payee_name, 'transaction');

  -- Audit Log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, 'bill_payment_executed', 'payments', v_payment_id::text, jsonb_build_object('amount', p_amount, 'payee', p_payee_name, 'ref', v_reference));

  RETURN json_build_object('success', true, 'payment_id', v_payment_id, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.process_loan_repayment(p_loan_id UUID,
  p_amount NUMERIC,
  p_pin TEXT) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_loan RECORD;
  v_account RECORD;
  v_new_outstanding NUMERIC;
  v_new_repaid NUMERIC;
  v_new_status TEXT;
  v_new_balance NUMERIC;
BEGIN
  -- 1. Get the authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(v_user_id, p_pin);


  -- 2. Verify loan exists, belongs to user, and is active
  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id AND user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found or unauthorized';
  END IF;

  IF v_loan.status NOT IN ('active', 'approved', 'pending') THEN
    RAISE EXCEPTION 'Loan is not in an active state';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  IF p_amount > COALESCE(v_loan.outstanding_balance, 0) THEN
    RAISE EXCEPTION 'Payment amount exceeds outstanding balance';
  END IF;

  -- 3. Get user's active savings account
  SELECT * INTO v_account FROM public.accounts 
  WHERE user_id = v_user_id AND account_type = 'savings' AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active savings account found';
  END IF;

  IF v_account.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds in savings account';
  END IF;

  -- 4. Calculate new values
  v_new_outstanding := GREATEST(0, COALESCE(v_loan.outstanding_balance, 0) - p_amount);
  v_new_repaid := COALESCE(v_loan.total_repaid, 0) + p_amount;
  v_new_status := CASE WHEN v_new_outstanding <= 0 THEN 'paid' ELSE v_loan.status END;
  v_new_balance := v_account.balance - p_amount;

  -- 5. Update the loan
  UPDATE public.loans 
  SET 
    outstanding_balance = v_new_outstanding,
    total_repaid = v_new_repaid,
    status = v_new_status,
    updated_at = now()
  WHERE id = p_loan_id;

  -- 6. Update the account
  UPDATE public.accounts
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_account.id;

  -- 7. Insert the transaction log
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    reference,
    status
  ) VALUES (
    v_user_id,
    'debit',
    p_amount,
    v_new_balance,
    'Loan repayment - ' || COALESCE(v_loan.purpose, 'Credit Facility') || ' (' || upper(substr(p_loan_id::text, 1, 8)) || ')',
    'REPAY-' || upper(substr(p_loan_id::text, 1, 8)) || '-' || upper(substr(gen_random_uuid()::text, 1, 8)),
    'completed'
  );

  RETURN json_build_object(
    'success', true,
    'new_outstanding', v_new_outstanding,
    'new_status', v_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.clear_all_debt(p_pin TEXT) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_account RECORD;
  v_total_debt NUMERIC := 0;
  v_active_loans_count INTEGER := 0;
  v_loan RECORD;
BEGIN
  -- 1. Get the authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(v_user_id, p_pin);


  -- 2. Calculate total debt across all active loans
  SELECT COALESCE(SUM(outstanding_balance), 0), COUNT(id)
  INTO v_total_debt, v_active_loans_count
  FROM public.loans
  WHERE user_id = v_user_id AND status IN ('active', 'approved', 'pending') AND outstanding_balance > 0;

  IF v_total_debt <= 0 THEN
    RAISE EXCEPTION 'No outstanding debt to clear';
  END IF;

  -- 3. Get user's active savings account
  SELECT * INTO v_account FROM public.accounts 
  WHERE user_id = v_user_id AND account_type = 'savings' AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active savings account found';
  END IF;

  IF v_account.balance < v_total_debt THEN
    RAISE EXCEPTION 'Insufficient funds in savings account to clear all debt';
  END IF;

  -- 4. Update all active loans
  FOR v_loan IN 
    SELECT * FROM public.loans 
    WHERE user_id = v_user_id AND status IN ('active', 'approved', 'pending') AND outstanding_balance > 0
  LOOP
    UPDATE public.loans 
    SET 
      outstanding_balance = 0,
      total_repaid = COALESCE(total_repaid, 0) + v_loan.outstanding_balance,
      status = 'paid',
      updated_at = now()
    WHERE id = v_loan.id;
  END LOOP;

  -- 5. Update the account
  UPDATE public.accounts
  SET balance = v_account.balance - v_total_debt, updated_at = now()
  WHERE id = v_account.id;

  -- 6. Insert the transaction log
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    reference,
    status
  ) VALUES (
    v_user_id,
    'debit',
    v_total_debt,
    v_account.balance - v_total_debt,
    'Full Debt Clearance - ' || v_active_loans_count || ' Facilities',
    'CLEARALL-' || upper(substr(gen_random_uuid()::text, 1, 8)),
    'completed'
  );

  RETURN json_build_object(
    'success', true,
    'total_cleared', v_total_debt,
    'facilities_cleared', v_active_loans_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.process_card_fee(p_user_id UUID,
  p_account_id UUID,
  p_fee_amount NUMERIC,
  p_reference TEXT,
  p_pin TEXT) RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
BEGIN

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

  -- 1. Lock and check account balance
  SELECT balance INTO v_balance FROM public.accounts WHERE id = p_account_id AND user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found or not owned by user';
  END IF;

  IF v_balance < p_fee_amount THEN
    RAISE EXCEPTION 'Insufficient funds to cover physical card fee';
  END IF;

  -- 2. Deduct fee
  UPDATE public.accounts SET balance = balance - p_fee_amount WHERE id = p_account_id;

  -- 3. Record transaction log
  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (p_user_id, p_account_id, 'fee', p_fee_amount, 'Physical Card Provisioning Fee', p_reference, 'completed');

  -- 4. Credit Bank Portfolio
  INSERT INTO public.bank_portfolio (amount, source, reference_id)
  VALUES (p_fee_amount, 'physical_card_fee', p_reference);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.fund_brokerage_account(p_user_id UUID,
  p_checking_account_id UUID,
  p_brokerage_account_id UUID,
  p_amount NUMERIC,
  p_pin TEXT) RETURNS JSON AS $$
DECLARE
  v_checking_balance NUMERIC;
  v_reference TEXT;
BEGIN

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Funding amount must be greater than zero';
  END IF;

  SELECT balance INTO v_checking_balance FROM public.accounts WHERE id = p_checking_account_id AND user_id = p_user_id AND status = 'active';
  IF v_checking_balance IS NULL THEN
    RAISE EXCEPTION 'Source checking account not found or inactive';
  END IF;

  IF v_checking_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds in checking account';
  END IF;

  -- Generate Reference
  v_reference := 'FUND-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

  -- Deduct from Checking explicitly (and use type 'transfer' so the trigger doesn't double deduct)
  UPDATE public.accounts 
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE id = p_checking_account_id;

  INSERT INTO public.transactions (user_id, account_id, type, amount, description, reference, status)
  VALUES (p_user_id, p_checking_account_id, 'transfer', p_amount, 'Brokerage Funding Transfer', v_reference, 'completed');

  -- Add to Brokerage Cash Balance
  UPDATE public.investment_accounts
  SET cash_balance = cash_balance + p_amount, balance = balance + p_amount, updated_at = NOW()
  WHERE id = p_brokerage_account_id AND user_id = p_user_id;

  RETURN json_build_object('success', true, 'reference', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.process_trade(p_user_id UUID,
  p_account_id UUID,
  p_symbol TEXT,
  p_asset_name TEXT,
  p_side TEXT,
  p_quantity NUMERIC,
  p_current_price NUMERIC,
  p_asset_class TEXT,
  p_pin TEXT) RETURNS JSON AS $$
DECLARE
  v_cash_balance NUMERIC;
  v_total_cost NUMERIC;
  v_holding_qty NUMERIC;
  v_holding_avg NUMERIC;
  v_order_id UUID;
  v_commission NUMERIC := 1.99;
BEGIN

  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Order quantity must be greater than zero';
  END IF;

  -- Ensure Private Wealth free trades for Tier 3
  IF (SELECT kyc_tier FROM public.profiles WHERE user_id = p_user_id) = 3 THEN
    v_commission := 0;
  END IF;

  v_total_cost := (p_quantity * p_current_price) + v_commission;

  -- 1. Check Cash Balance for BUYS
  SELECT cash_balance INTO v_cash_balance FROM public.investment_accounts WHERE id = p_account_id AND user_id = p_user_id AND status = 'active';
  IF v_cash_balance IS NULL THEN
    RAISE EXCEPTION 'Brokerage account not found or inactive';
  END IF;

  IF p_side = 'buy' THEN
    IF v_cash_balance < v_total_cost THEN
      RAISE EXCEPTION 'Insufficient cash available to execute trade. Required: $%, Available: $%', v_total_cost, v_cash_balance;
    END IF;

    -- Update Cash Balance
    UPDATE public.investment_accounts 
    SET cash_balance = cash_balance - v_total_cost, updated_at = NOW()
    WHERE id = p_account_id;

    -- Update or Insert Holding
    SELECT quantity, avg_cost INTO v_holding_qty, v_holding_avg FROM public.investment_holdings WHERE account_id = p_account_id AND symbol = p_symbol;
    IF FOUND THEN
      UPDATE public.investment_holdings
      SET avg_cost = ((v_holding_qty * v_holding_avg) + (p_quantity * p_current_price)) / (v_holding_qty + p_quantity),
          quantity = v_holding_qty + p_quantity,
          updated_at = NOW()
      WHERE account_id = p_account_id AND symbol = p_symbol;
    ELSE
      INSERT INTO public.investment_holdings (account_id, symbol, name, quantity, avg_cost, asset_class)
      VALUES (p_account_id, p_symbol, p_asset_name, p_quantity, p_current_price, p_asset_class);
    END IF;

  ELSIF p_side = 'sell' THEN
    -- Verify Holding for SELLS
    SELECT quantity INTO v_holding_qty FROM public.investment_holdings WHERE account_id = p_account_id AND symbol = p_symbol;
    IF v_holding_qty IS NULL OR v_holding_qty < p_quantity THEN
      RAISE EXCEPTION 'Insufficient share quantity to execute sell order.';
    END IF;

    -- Update Cash Balance (Add proceeds, minus commission)
    v_total_cost := (p_quantity * p_current_price) - v_commission;
    UPDATE public.investment_accounts 
    SET cash_balance = cash_balance + v_total_cost, updated_at = NOW()
    WHERE id = p_account_id;

    -- Update Holding
    IF v_holding_qty = p_quantity THEN
      DELETE FROM public.investment_holdings WHERE account_id = p_account_id AND symbol = p_symbol;
    ELSE
      UPDATE public.investment_holdings
      SET quantity = quantity - p_quantity, updated_at = NOW()
      WHERE account_id = p_account_id AND symbol = p_symbol;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid order side';
  END IF;

  -- 2. Record Order
  INSERT INTO public.investment_orders (account_id, symbol, side, quantity, order_type, execution_price, status)
  VALUES (p_account_id, p_symbol, p_side, p_quantity, 'market', p_current_price, 'filled')
  RETURNING id INTO v_order_id;

  -- 3. Log Commission (Optional integration with bank_portfolio)
  IF v_commission > 0 THEN
    UPDATE public.bank_portfolio 
    SET total_fees_collected = total_fees_collected + v_commission, updated_at = NOW()
    WHERE id = (SELECT id FROM public.bank_portfolio LIMIT 1);
  END IF;

  RETURN json_build_object('success', true, 'order_id', v_order_id, 'execution_price', p_current_price);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

