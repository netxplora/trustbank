-- Create the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create CMS Tables if they do not exist
CREATE TABLE IF NOT EXISTS public.cms_site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cms_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'News',
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cms_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  city TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default public rates
INSERT INTO public.cms_site_settings (key, value) VALUES (
  'public_rates',
  '{
    "savings_apy": 4.75,
    "cd_12mo_apy": 5.15,
    "personal_loan_apr": 6.99,
    "mortgage_30yr_apr": 6.25
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Seed default testimonials
INSERT INTO public.cms_testimonials (name, role, city, rating, text, photo_url) VALUES
('Sarah Jenkins', 'Financial Analyst', 'Boston, MA', 5, 'Switching my investment portfolio to TrustBank has been the best choice for my retirement planning. The platform interface is clean and straightforward.', '/assets/home/testimonial-1.jpg'),
('David Vance', 'Real Estate Agent', 'Austin, TX', 5, 'The e-statement download and payee systems are incredibly seamless. The loan calculator let me estimate my payments and secure a commercial loan within days.', '/assets/home/testimonial-2.jpg'),
('Maria Rodriguez', 'Small Business Owner', 'Miami, FL', 5, 'Managing scheduled payroll and payments for my store is finally stress-free. The recurring bill pay option has completely automated our bills.', '/assets/home/testimonial-3.jpg')
ON CONFLICT DO NOTHING;

-- Seed default posts
INSERT INTO public.cms_posts (title, summary, content, image_url, category) VALUES
('Navigating the 2026 Interest Rate Environment', 'What the Fed changes mean for your high-yield savings account and CD options.', 'As interest rates shift globally, securing yield becomes crucial. We break down the top strategy tools to lock in APYs with certificates of deposit and high-yield checks.', '/assets/home/news-1.jpg', 'Market Outlook'),
('Protecting Your Wealth Against Fraud', 'Essential tips to secure your mobile device and monitor account activity.', 'With online fraud becoming highly advanced, multi-factor verification, device biometrics, and active alert systems remain your primary shields.', '/assets/home/news-2.jpg', 'Security'),
('The Growth of Digital Investment Accounts', 'How self-directed brokerage options allow flexible retirement planning.', 'Traditional portfolios are transforming. Read about building tax-sheltered investment accounts to compound your returns efficiently.', '/assets/home/news-3.jpg', 'Investing')
ON CONFLICT DO NOTHING;

-- Create Investments Tables
CREATE TABLE IF NOT EXISTS public.investment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('brokerage', 'ira_traditional', 'ira_roth')),
  account_number TEXT UNIQUE NOT NULL,
  balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  cash_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.investment_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.investment_accounts(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC(12,4) NOT NULL DEFAULT 0.0000,
  avg_cost NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  current_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  asset_class TEXT NOT NULL CHECK (asset_class IN ('stock', 'etf', 'bond', 'mutual_fund')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (account_id, symbol)
);

CREATE TABLE IF NOT EXISTS public.investment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.investment_accounts(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity NUMERIC(12,4) NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit')),
  limit_price NUMERIC(15,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled')),
  filled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Statements & Tax Documents
CREATE TABLE IF NOT EXISTS public.account_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  opening_balance NUMERIC(15,2) NOT NULL,
  closing_balance NUMERIC(15,2) NOT NULL,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  form_type TEXT NOT NULL CHECK (form_type IN ('1099-INT', '1099-DIV', '1098')),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Payees & Scheduled Payments
CREATE TABLE IF NOT EXISTS public.payees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nickname TEXT,
  payee_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('utility', 'credit_card', 'mortgage', 'insurance', 'telecom', 'other')),
  account_number_masked TEXT NOT NULL,
  address JSONB,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('ach', 'check')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scheduled_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payee_id UUID REFERENCES public.payees(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('once', 'weekly', 'monthly')),
  next_run_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Triggers for updated_at column
CREATE TRIGGER update_cms_site_settings_updated_at BEFORE UPDATE ON public.cms_site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_posts_updated_at BEFORE UPDATE ON public.cms_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_investment_accounts_updated_at BEFORE UPDATE ON public.investment_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_investment_holdings_updated_at BEFORE UPDATE ON public.investment_holdings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_investment_orders_updated_at BEFORE UPDATE ON public.investment_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.cms_site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_payments ENABLE ROW LEVEL SECURITY;

-- CMS Policies
CREATE POLICY "Public Read for CMS Site Settings" ON public.cms_site_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admin Write for CMS Site Settings" ON public.cms_site_settings FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Public Read for CMS Posts" ON public.cms_posts FOR SELECT TO public USING (true);
CREATE POLICY "Admin Write for CMS Posts" ON public.cms_posts FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Public Read for CMS Testimonials" ON public.cms_testimonials FOR SELECT TO public USING (true);
CREATE POLICY "Admin Write for CMS Testimonials" ON public.cms_testimonials FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Investment Policies
CREATE POLICY "User View Own Investment Accounts" ON public.investment_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin View All Investment Accounts" ON public.investment_accounts FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin Manage Investment Accounts" ON public.investment_accounts FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "User View Own Investment Holdings" ON public.investment_holdings FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.investment_accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
);
CREATE POLICY "Admin View All Investment Holdings" ON public.investment_holdings FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin Manage Investment Holdings" ON public.investment_holdings FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "User Create/View Own Investment Orders" ON public.investment_orders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.investment_accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
);
CREATE POLICY "User Insert Own Investment Orders" ON public.investment_orders FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.investment_accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
);
CREATE POLICY "Admin View All Investment Orders" ON public.investment_orders FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin Manage Investment Orders" ON public.investment_orders FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- eStatements Policies
CREATE POLICY "User View Own Account Statements" ON public.account_statements FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
);
CREATE POLICY "Admin Manage Account Statements" ON public.account_statements FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "User View Own Tax Documents" ON public.tax_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin Manage Tax Documents" ON public.tax_documents FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Payees & Scheduled Payments Policies
DROP POLICY IF EXISTS "User Manage Own Payees" ON public.payees;
CREATE POLICY "User Manage Own Payees" ON public.payees FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin View All Payees" ON public.payees;
CREATE POLICY "Admin View All Payees" ON public.payees FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "User Manage Own Scheduled Payments" ON public.scheduled_payments;
CREATE POLICY "User Manage Own Scheduled Payments" ON public.scheduled_payments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admin View All Scheduled Payments" ON public.scheduled_payments;
CREATE POLICY "Admin View All Scheduled Payments" ON public.scheduled_payments FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Realtime Publication Additions
ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_holdings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.account_statements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tax_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_payments;

-- SECURITY DEFINER order execution function
CREATE OR REPLACE FUNCTION public.execute_order(order_id UUID, fill_price NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_user_id UUID;
  v_symbol TEXT;
  v_side TEXT;
  v_quantity NUMERIC;
  v_cost NUMERIC;
  v_cash NUMERIC;
  v_holding_id UUID;
  v_holding_quantity NUMERIC;
  v_holding_cost NUMERIC;
  v_asset_class TEXT;
  v_order_status TEXT;
BEGIN
  -- Get order details
  SELECT account_id, symbol, side, quantity, status
  INTO v_account_id, v_symbol, v_side, v_quantity, v_order_status
  FROM public.investment_orders
  WHERE id = order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order_status <> 'pending' THEN
    RAISE EXCEPTION 'Order is not in pending status';
  END IF;

  -- Get account details
  SELECT user_id, cash_balance
  INTO v_user_id, v_cash
  FROM public.investment_accounts
  WHERE id = v_account_id;

  v_cost := v_quantity * fill_price;

  -- Check if symbol is a bond or etf or stock
  IF v_symbol IN ('SHY', 'TLT', 'BND', 'AGG') THEN
    v_asset_class := 'bond';
  ELSIF v_symbol IN ('SPY', 'VOO', 'QQQ', 'IWM', 'VTI') THEN
    v_asset_class := 'etf';
  ELSE
    v_asset_class := 'stock';
  END IF;

  IF v_side = 'buy' THEN
    -- Validate cash
    IF v_cash < v_cost THEN
      RAISE EXCEPTION 'Sufficient cash balance not available';
    END IF;

    -- Update account cash
    UPDATE public.investment_accounts
    SET cash_balance = cash_balance - v_cost,
        balance = balance - v_cost
    WHERE id = v_account_id;

    -- Update or insert holding
    SELECT id, quantity, avg_cost
    INTO v_holding_id, v_holding_quantity, v_holding_cost
    FROM public.investment_holdings
    WHERE account_id = v_account_id AND symbol = v_symbol;

    IF FOUND THEN
      UPDATE public.investment_holdings
      SET quantity = quantity + v_quantity,
          avg_cost = ((v_holding_quantity * v_holding_cost) + v_cost) / (v_holding_quantity + v_quantity),
          current_price = fill_price,
          updated_at = now()
      WHERE id = v_holding_id;
    ELSE
      INSERT INTO public.investment_holdings (account_id, symbol, name, quantity, avg_cost, current_price, asset_class)
      VALUES (v_account_id, v_symbol, v_symbol, v_quantity, fill_price, fill_price, v_asset_class);
    END IF;

  ELSIF v_side = 'sell' THEN
    -- Check holding
    SELECT id, quantity, avg_cost
    INTO v_holding_id, v_holding_quantity, v_holding_cost
    FROM public.investment_holdings
    WHERE account_id = v_account_id AND symbol = v_symbol;

    IF NOT FOUND OR v_holding_quantity < v_quantity THEN
      RAISE EXCEPTION 'Insufficient holdings to execute sell order';
    END IF;

    -- Update account cash
    UPDATE public.investment_accounts
    SET cash_balance = cash_balance + v_cost,
        balance = balance + v_cost
    WHERE id = v_account_id;

    -- Update holding quantity
    IF v_holding_quantity = v_quantity THEN
      DELETE FROM public.investment_holdings WHERE id = v_holding_id;
    ELSE
      UPDATE public.investment_holdings
      SET quantity = quantity - v_quantity,
          current_price = fill_price,
          updated_at = now()
      WHERE id = v_holding_id;
    END IF;

  END IF;

  -- Update order
  UPDATE public.investment_orders
  SET status = 'filled',
      filled_at = now(),
      updated_at = now()
  WHERE id = order_id;

  -- Log transaction
  INSERT INTO public.transactions (user_id, type, amount, description, status)
  VALUES (
    v_user_id,
    'payment',
    v_cost,
    'Investment ' || upper(v_side) || ' - ' || v_symbol,
    'completed'
  );

  RETURN true;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.execute_order(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_order(UUID, NUMERIC) TO service_role;
