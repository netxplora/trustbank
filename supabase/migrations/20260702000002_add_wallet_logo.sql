-- ============================================================
-- Add logo_url to crypto_wallets
-- ============================================================

ALTER TABLE public.crypto_wallets
ADD COLUMN IF NOT EXISTS logo_url text;

-- Insert default crypto third party setting if it doesn't exist
INSERT INTO public.cms_site_settings (key, value)
VALUES (
  'crypto_third_party',
  '{"name": "MoonPay", "url": "https://exchange.mercuryo.io/"}'::jsonb
) ON CONFLICT (key) DO NOTHING;
