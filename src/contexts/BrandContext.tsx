import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BrandIdentity {
  platform_name: string;
  short_name: string;
  legal_name?: string;
  slogan: string;
  description: string;
  company_overview: string;
}

interface DesignSystem {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    foreground: string;
    card: string;
    card_foreground: string;
    popover: string;
    popover_foreground: string;
    surface: string;
    surface_hover: string;
    muted: string;
    muted_foreground: string;
    border: string;
    input: string;
  };
  dark_mode_colors?: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    foreground: string;
    card: string;
    card_foreground: string;
    popover: string;
    popover_foreground: string;
    surface: string;
    surface_hover: string;
    muted: string;
    muted_foreground: string;
    border: string;
    input: string;
  };
  typography: {
    heading_font: string;
    body_font: string;
  };
  radius: string;
  shadows?: {
    elevated: string;
    card_hover: string;
  };
}

interface VisualAssets {
  primary_logo: string;
  favicon: string;
  hero_image: string;
}

interface CorporateInfo {
  phone: string;
  email: string;
  headquarters: string;
  support_hours: string;
}

interface BrandContextType {
  identity: BrandIdentity | null;
  design: DesignSystem | null;
  visuals: VisualAssets | null;
  corporate: CorporateInfo | null;
  loading: boolean;
  refreshBrandSettings: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

// Default Fallbacks
const defaultIdentity: BrandIdentity = {
  platform_name: "TrustBank Global",
  short_name: "TrustBank",
  slogan: "Secure Institutional Wealth Management",
  description: "Enterprise-grade digital banking and asset management.",
  company_overview: "TrustBank provides tier-1 banking facilities.",
};

const defaultDesign: DesignSystem = {
  colors: {
    primary: "#3B82F6",
    secondary: "#F97171",
    accent: "#34D399",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#EF4444",
    info: "#3B82F6",
    background: "#FFFFFF",
    foreground: "#111827",
    card: "#F9FAFB",
    card_foreground: "#111827",
    popover: "#FFFFFF",
    popover_foreground: "#111827",
    surface: "#F9FAFB",
    surface_hover: "#F3F4F6",
    muted: "#F3F4F6",
    muted_foreground: "#6B7280",
    border: "#E5E7EB",
    input: "#E5E7EB"
  },
  dark_mode_colors: {
    primary: "#3B82F6",
    secondary: "#F97171",
    accent: "#34D399",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#EF4444",
    info: "#3B82F6",
    background: "#0B1220",
    foreground: "#F8FAFC",
    card: "#111827",
    card_foreground: "#F8FAFC",
    popover: "#111827",
    popover_foreground: "#F8FAFC",
    surface: "#111827",
    surface_hover: "#1E293B",
    muted: "#475569",
    muted_foreground: "#94A3B8",
    border: "#334155",
    input: "#334155"
  },
  typography: {
    heading_font: "Figtree",
    body_font: "DM Sans",
  },
  radius: "1rem",
  shadows: {
    elevated: "0 4px 12px rgba(0, 0, 0, 0.08)",
    card_hover: "0 8px 24px rgba(0, 0, 0, 0.12)"
  }
};

const defaultVisuals: VisualAssets = {
  primary_logo: "/assets/logo-B22.png",
  favicon: "/favicon.ico",
  hero_image: "/assets/hero-home.jpg",
};

const defaultCorporate: CorporateInfo = {
  phone: "+1 (800) 555-0199",
  email: "support@trustbank.com",
  headquarters: "100 Wall Street, New York, NY",
  support_hours: "24/7 Global Support",
};

export const BrandProvider = ({ children }: { children: React.ReactNode }) => {
  const [identity, setIdentity] = useState<BrandIdentity>(defaultIdentity);
  const [design, setDesign] = useState<DesignSystem>(defaultDesign);
  const [visuals, setVisuals] = useState<VisualAssets>(defaultVisuals);
  const [corporate, setCorporate] = useState<CorporateInfo>(defaultCorporate);
  const [loading, setLoading] = useState(true);

  // Helper to convert HEX to Space-Separated HSL for Tailwind CSS variable injection
  const hexToHslString = (hex: string) => {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
    if (hex.length !== 6) return "0 0% 0%"; // fallback

    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("cms_site_settings")
        .select("key, value")
        .in("key", ["brand_identity", "design_system", "visual_assets", "corporate_info"]);

      if (error) throw error;

      if (data) {
        data.forEach((setting) => {
          if (setting.key === "brand_identity" && setting.value) setIdentity(setting.value as any);
          if (setting.key === "design_system" && setting.value) setDesign(setting.value as any);
          if (setting.key === "visual_assets" && setting.value) setVisuals(setting.value as any);
          if (setting.key === "corporate_info" && setting.value) setCorporate(setting.value as any);
        });
      }
    } catch (err) {
      console.error("Error loading brand settings:", err);
      // Fallbacks will remain active if error occurs
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel("brand-settings-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "cms_site_settings" }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Apply dynamic CSS variables when design changes
  useEffect(() => {
    if (design) {
      let styleEl = document.getElementById("theme-engine") as HTMLStyleElement;
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "theme-engine";
        document.head.appendChild(styleEl);
      }
      
      const light = design.colors;
      const dark = design.dark_mode_colors || light;
      
      const generateVars = (c: any) => `
        --primary: ${hexToHslString(c.primary)};
        --secondary: ${hexToHslString(c.secondary)};
        --accent: ${hexToHslString(c.accent)};
        --background: ${hexToHslString(c.background)};
        --foreground: ${hexToHslString(c.foreground)};
        --card: ${hexToHslString(c.card || c.background || "#FFFFFF")};
        --card-foreground: ${hexToHslString(c.card_foreground || c.foreground || "#0F1626")};
        --popover: ${hexToHslString(c.popover || c.background || "#FFFFFF")};
        --popover-foreground: ${hexToHslString(c.popover_foreground || c.foreground || "#0F1626")};
        --surface: ${hexToHslString(c.surface || "#F8FAFC")};
        --surface-hover: ${hexToHslString(c.surface_hover || "#F1F5F9")};
        --muted: ${hexToHslString(c.muted || "#F1F5F9")};
        --muted-foreground: ${hexToHslString(c.muted_foreground || "#64748B")};
        --border: ${hexToHslString(c.border || "#E2E8F0")};
        --input: ${hexToHslString(c.input || "#E2E8F0")};
        --success: ${hexToHslString(c.success || "#10B981")};
        --warning: ${hexToHslString(c.warning || "#F59E0B")};
        --error: ${hexToHslString(c.error || "#EF4444")};
        --info: ${hexToHslString(c.info || "#3B82F6")};
      `;

      let css = `
        :root {
          ${generateVars(light)}
          --radius: ${design.radius};
      `;
      if (design.shadows) {
        css += `
          --shadow-elevated: ${design.shadows.elevated};
          --shadow-card-hover: ${design.shadows.card_hover};
        `;
      }
      css += `
        }
        .dark {
          ${generateVars(dark)}
        }
      `;

      styleEl.textContent = css;
    }
  }, [design]);

  return (
    <BrandContext.Provider value={{ identity, design, visuals, corporate, loading, refreshBrandSettings: fetchSettings }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
};
