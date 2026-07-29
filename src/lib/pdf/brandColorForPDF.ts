/**
 * brandColorForPDF.ts
 *
 * Fetches the admin-configured primary brand colour from cms_site_settings
 * and converts it to the [R, G, B] tuple required by jsPDF.
 *
 * Usage:
 *   const brand = await fetchBrandPDFColors();
 *   generateDocument({ ..., brandColors: brand });
 */

import { supabase } from "@/integrations/supabase/client";

export interface PDFBrandColors {
  /** Primary brand colour as [R, G, B] */
  primary: [number, number, number];
  /** A slightly lighter variant for secondary accents */
  primaryLight: [number, number, number];
}

/** Default fallback — matches TrustBank crimson used before branding was dynamic */
const DEFAULT_BRAND: PDFBrandColors = {
  primary: [130, 20, 40],
  primaryLight: [180, 40, 60],
};

/**
 * Parse a CSS hex colour (#RRGGBB or #RGB) into an [R, G, B] tuple.
 * Returns the default primary if parsing fails.
 */
function hexToRgb(hex: string): [number, number, number] {
  if (!hex) return DEFAULT_BRAND.primary;
  const clean = hex.replace("#", "").trim();

  let r: number, g: number, b: number;

  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  } else {
    return DEFAULT_BRAND.primary;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return DEFAULT_BRAND.primary;
  return [r, g, b];
}

/**
 * Produce a lightened variant of an RGB colour by blending toward white.
 * `amount` = 0 (no change) … 1 (pure white)
 */
function lightenRgb(
  rgb: [number, number, number],
  amount = 0.25
): [number, number, number] {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * amount),
    Math.round(rgb[1] + (255 - rgb[1]) * amount),
    Math.round(rgb[2] + (255 - rgb[2]) * amount),
  ] as [number, number, number];
}

/**
 * Fetches brand colours from the CMS and returns them as jsPDF-ready RGB tuples.
 * Falls back to the default crimson palette if the setting cannot be loaded.
 */
export async function fetchBrandPDFColors(): Promise<PDFBrandColors> {
  try {
    const { data, error } = await supabase
      .from("cms_site_settings")
      .select("value")
      .eq("key", "brand_settings")
      .maybeSingle();

    if (error || !data?.value) return DEFAULT_BRAND;

    const settings = data.value as {
      colors?: { primary?: string };
    };

    const primaryHex = settings?.colors?.primary;
    if (!primaryHex) return DEFAULT_BRAND;

    const primary = hexToRgb(primaryHex);
    const primaryLight = lightenRgb(primary, 0.25);

    return { primary, primaryLight };
  } catch {
    return DEFAULT_BRAND;
  }
}
