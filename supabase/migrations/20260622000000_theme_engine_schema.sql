-- ============================================================
-- Phase 11: Theme & Branding Engine Initialization
-- Updates the design_system CMS setting with comprehensive 
-- dark and light mode color arrays.
-- ============================================================

UPDATE public.cms_site_settings
SET value = '{
  "colors": {
    "primary": "#B4223A",
    "secondary": "#CC9933",
    "accent": "#3D4B66",
    "success": "#10B981",
    "warning": "#F59E0B",
    "error": "#EF4444",
    "info": "#3B82F6",
    "background": "#FFFFFF",
    "foreground": "#0F1626",
    "card": "#FFFFFF",
    "card_foreground": "#0F1626",
    "popover": "#FFFFFF",
    "popover_foreground": "#0F1626",
    "surface": "#F8FAFC",
    "surface_hover": "#F1F5F9",
    "muted": "#F1F5F9",
    "muted_foreground": "#64748B",
    "border": "#E2E8F0",
    "input": "#E2E8F0"
  },
  "dark_mode_colors": {
    "primary": "#D6334D",
    "secondary": "#CC9933",
    "accent": "#3D4B66",
    "success": "#10B981",
    "warning": "#F59E0B",
    "error": "#EF4444",
    "info": "#3B82F6",
    "background": "#0F1626",
    "foreground": "#F8FAFC",
    "card": "#1E293B",
    "card_foreground": "#F8FAFC",
    "popover": "#1E293B",
    "popover_foreground": "#F8FAFC",
    "surface": "#0F1626",
    "surface_hover": "#1E293B",
    "muted": "#1E293B",
    "muted_foreground": "#94A3B8",
    "border": "#334155",
    "input": "#334155"
  },
  "typography": {
    "heading_font": "Poppins",
    "body_font": "Inter"
  },
  "radius": "0.75rem",
  "shadows": {
    "elevated": "0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)",
    "card_hover": "0 20px 40px -15px rgba(180, 20, 40, 0.12), 0 1px 5px rgba(180, 20, 40, 0.04)"
  }
}'::jsonb
WHERE key = 'design_system';
