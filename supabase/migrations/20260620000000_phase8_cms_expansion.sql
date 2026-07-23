-- Phase 8: Enterprise CMS & Brand Management Expansion

-- 1. Create Media Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media_assets', 'media_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for media_assets
-- Public read access
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media_assets');

-- Admin write access
CREATE POLICY "Admin Upload Access" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'media_assets' AND 
  public.is_admin(auth.uid())
);

CREATE POLICY "Admin Update Access" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'media_assets' AND 
  public.is_admin(auth.uid())
);

CREATE POLICY "Admin Delete Access" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'media_assets' AND 
  public.is_admin(auth.uid())
);


-- 2. Create CMS Pages Table
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER update_cms_pages_updated_at 
BEFORE UPDATE ON public.cms_pages 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

-- Policies for cms_pages
CREATE POLICY "Public Read for Published Pages" 
ON public.cms_pages FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admin All Access for Pages" 
ON public.cms_pages FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()));


-- 3. Create CMS Products Table
CREATE TABLE IF NOT EXISTS public.cms_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('checking', 'savings', 'loans', 'cards', 'investments', 'business')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  interest_rate NUMERIC(5,2),
  fee NUMERIC(10,2),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER update_cms_products_updated_at 
BEFORE UPDATE ON public.cms_products 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.cms_products ENABLE ROW LEVEL SECURITY;

-- Policies for cms_products
CREATE POLICY "Public Read for Active Products" 
ON public.cms_products FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin All Access for Products" 
ON public.cms_products FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()));


-- 4. Seed Default CMS Site Settings (Brand & Design)
INSERT INTO public.cms_site_settings (key, value) VALUES (
  'brand_identity',
  '{
    "platform_name": "Netxplora Global Banking",
    "short_name": "Netxplora",
    "slogan": "Secure Institutional Wealth Management",
    "description": "Enterprise-grade digital banking and asset management for high-net-worth clients.",
    "company_overview": "Netxplora provides tier-1 banking facilities and comprehensive wealth advisory services to institutions globally."
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.cms_site_settings (key, value) VALUES (
  'design_system',
  '{
    "colors": {
      "primary": "hsl(350, 65%, 38%)", 
      "secondary": "hsl(40, 60%, 50%)",
      "accent": "hsl(220, 20%, 30%)",
      "background": "hsl(0, 0%, 100%)",
      "foreground": "hsl(222, 47%, 11%)"
    },
    "typography": {
      "heading_font": "Poppins",
      "body_font": "Inter"
    },
    "radius": "0.5rem"
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.cms_site_settings (key, value) VALUES (
  'visual_assets',
  '{
    "primary_logo": "/assets/logo-B22.png",
    "favicon": "/favicon.ico",
    "hero_image": "/assets/hero-home.jpg"
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.cms_site_settings (key, value) VALUES (
  'corporate_info',
  '{
    "phone": "+1 (212) 555-0180",
    "email": "institutional@netxplora.com",
    "headquarters": "350 Fifth Avenue, Suite 4500, New York, NY 10118",
    "support_hours": "Monday - Friday, 8:00 AM - 6:00 PM EST"
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.cms_site_settings (key, value) VALUES (
  'seo_defaults',
  '{
    "meta_title": "Netxplora | Institutional Banking & Wealth Management",
    "meta_description": "Premier digital banking, global wire transfers, and corporate asset management facilities.",
    "og_image": "/assets/logo-B22.png"
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.cms_pages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cms_products;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
