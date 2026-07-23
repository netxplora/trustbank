-- Expand cards table for physical card requests
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS is_physical BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS request_status TEXT;

-- Add physical card fee to site settings
INSERT INTO public.cms_site_settings (key, value)
VALUES ('physical_card_fee', '15.00')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
