-- Update the handle_new_user trigger to properly extract first_name, last_name, and phone from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_account_number text;
  v_first_name text;
  v_last_name text;
  v_phone text;
  v_display_name text;
BEGIN
  -- Generate unique account number
  new_account_number := public.generate_account_number();

  -- Extract metadata safely
  v_first_name := NULLIF(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := NULLIF(NEW.raw_user_meta_data->>'last_name', '');
  v_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');

  -- Construct a display name: First Last, OR fallback to metadata display_name, OR fallback to email prefix
  v_display_name := COALESCE(
    NULLIF(TRIM(CONCAT_WS(' ', v_first_name, v_last_name)), ''),
    NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
    split_part(NEW.email, '@', 1)
  );

  -- Create profile
  INSERT INTO public.profiles (
    user_id, 
    email, 
    display_name, 
    first_name, 
    last_name, 
    phone, 
    account_number
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_display_name,
    v_first_name,
    v_last_name,
    v_phone,
    new_account_number
  );

  -- Create default SAVINGS account
  INSERT INTO public.accounts (user_id, account_number, account_type, balance)
  VALUES (NEW.id, new_account_number, 'savings', 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
