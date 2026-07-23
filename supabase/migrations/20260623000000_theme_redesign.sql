-- Phase 14: TrustBank Theme System Redesign
-- Centralizes all colors globally to the new TrustBank Blue and Midnight Navy palette.

UPDATE public.cms_site_settings 
SET value = '{
    "colors": {
      "primary": "#0047FF",
      "secondary": "#071A3D",
      "accent": "#16C784",
      "success": "#16C784",
      "warning": "#F59E0B",
      "error": "#EF4444",
      "info": "#3B82F6",
      "background": "#F8FAFC",
      "foreground": "#0F172A",
      "card": "#FFFFFF",
      "card_foreground": "#0F172A",
      "popover": "#FFFFFF",
      "popover_foreground": "#0F172A",
      "surface": "#FFFFFF",
      "surface_hover": "#F1F5F9",
      "muted": "#CBD5E1",
      "muted_foreground": "#64748B",
      "border": "#E2E8F0",
      "input": "#E2E8F0"
    },
    "dark_mode_colors": {
      "primary": "#0047FF",
      "secondary": "#071A3D",
      "accent": "#16C784",
      "success": "#16C784",
      "warning": "#F59E0B",
      "error": "#EF4444",
      "info": "#3B82F6",
      "background": "#0B1220",
      "foreground": "#F8FAFC",
      "card": "#111827",
      "card_foreground": "#F8FAFC",
      "popover": "#111827",
      "popover_foreground": "#F8FAFC",
      "surface": "#111827",
      "surface_hover": "#1E293B",
      "muted": "#475569",
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
      "card_hover": "0 20px 40px -15px rgba(0, 71, 255, 0.12), 0 1px 5px rgba(0, 71, 255, 0.04)"
    }
  }'::jsonb
WHERE key = 'design_system';
