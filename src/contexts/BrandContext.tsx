import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BrandIdentity {
  platform_name: string;
  short_name: string;
  legal_name?: string;
  slogan: string;
  description: string;
  company_overview: string;
  website_url?: string;
  document_issuer_name?: string;
  document_disclaimer?: string;
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
    portfolio_bg?: string;
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
    portfolio_bg?: string;
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
  light_theme_logo?: string;
  dark_theme_logo?: string;
  document_logo?: string;
  email_logo?: string;
  favicon: string;
  hero_image: string;
}

interface CorporateInfo {
  phone: string;
  email: string;
  support_email?: string;
  headquarters: string;
  mailing_address?: string;
  support_hours: string;
  social_facebook?: string;
  social_twitter?: string;
  social_linkedin?: string;
  social_instagram?: string;
}

interface SeoInfo {
  meta_title: string;
  meta_description: string;
  og_image: string;
}

interface ComplianceInfo {
  terms_url: string;
  privacy_url: string;
  cookie_url: string;
  legal_disclaimer: string;
  copyright_text?: string;
}

interface BrandContextType {
  identity: BrandIdentity | null;
  design: DesignSystem | null;
  visuals: VisualAssets | null;
  corporate: CorporateInfo | null;
  seo: SeoInfo | null;
  compliance: ComplianceInfo | null;
  loading: boolean;
  refreshBrandSettings: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

// Default Fallbacks
const defaultIdentity: BrandIdentity = {
  platform_name: "TrustBank Global",
  short_name: "TrustBank",
  legal_name: "TrustBank NA",
  slogan: "Secure Institutional Wealth Management",
  description: "Enterprise-grade digital banking and asset management.",
  company_overview: "TrustBank provides tier-1 banking facilities.",
  website_url: "https://trustbank.com",
  document_issuer_name: "TrustBank NA",
  document_disclaimer: "This document is issued by TrustBank and is intended solely for the named recipient. TrustBank is a member of the Federal Deposit Insurance Corporation (FDIC). Deposits are insured up to applicable limits.",
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
    input: "#E5E7EB",
    portfolio_bg: "#1DCF9F"
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
    input: "#334155",
    portfolio_bg: "#1DCF9F"
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
  light_theme_logo: "/assets/logo-B22.png",
  dark_theme_logo: "/assets/logo-B22.png",
  document_logo: "/assets/logo-B22.png",
  email_logo: "/assets/logo-B22.png",
  favicon: "/favicon.ico",
  hero_image: "/assets/hero-home.jpg",
};

const defaultCorporate: CorporateInfo = {
  phone: "+1 (800) 555-0199",
  email: "support@trustbank.com",
  support_email: "support@trustbank.com",
  headquarters: "100 Wall Street, New York, NY",
  mailing_address: "100 Wall Street, New York, NY",
  support_hours: "24/7 Global Support",
  social_facebook: "",
  social_twitter: "",
  social_linkedin: "",
  social_instagram: "",
};

const defaultSeo: SeoInfo = {
  meta_title: "TrustBank | Premium Banking & Wealth Management",
  meta_description: "Secure digital banking and asset management for individuals, families, and businesses.",
  og_image: "/logo.png"
};

const defaultCompliance: ComplianceInfo = {
  terms_url: "/terms",
  privacy_url: "/privacy",
  cookie_url: "/cookies",
  legal_disclaimer: "TrustBank is a financial technology company, not a bank. Banking services provided by partner banks.",
  copyright_text: "© 2026 TrustBank. All rights reserved."
};

export const BrandProvider = ({ children }: { children: React.ReactNode }) => {
  const [identity, setIdentity] = useState<BrandIdentity>(defaultIdentity);
  const [design, setDesign] = useState<DesignSystem>(() => {
    try {
      const cached = localStorage.getItem("brand_design_system");
      return cached ? JSON.parse(cached) : defaultDesign;
    } catch {
      return defaultDesign;
    }
  });
  const [visuals, setVisuals] = useState<VisualAssets>(defaultVisuals);
  const [corporate, setCorporate] = useState<CorporateInfo>(defaultCorporate);
  const [seo, setSeo] = useState<SeoInfo>(defaultSeo);
  const [compliance, setCompliance] = useState<ComplianceInfo>(defaultCompliance);
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
        .in("key", ["brand_identity", "design_system", "visual_assets", "corporate_info", "seo", "compliance"]);

      if (error) throw error;

      if (data) {
        data.forEach((setting) => {
          if (setting.key === "brand_identity" && setting.value) setIdentity({...defaultIdentity, ...(setting.value as any)});
          if (setting.key === "design_system" && setting.value) {
            setDesign(setting.value as any);
            localStorage.setItem("brand_design_system", JSON.stringify(setting.value));
          }
          if (setting.key === "visual_assets" && setting.value) setVisuals({...defaultVisuals, ...(setting.value as any)});
          if (setting.key === "corporate_info" && setting.value) setCorporate({...defaultCorporate, ...(setting.value as any)});
          if (setting.key === "seo" && setting.value) {
            setSeo({...defaultSeo, ...(setting.value as any)});
            localStorage.setItem("brand_seo_system", JSON.stringify(setting.value));
          }
          if (setting.key === "compliance" && setting.value) setCompliance({...defaultCompliance, ...(setting.value as any)});
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

  // Apply dynamic CSS variables when design changes (useLayoutEffect prevents FOUC)
  useLayoutEffect(() => {
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
        --ring: ${hexToHslString(c.primary)};
        --sidebar-background: ${hexToHslString(c.background)};
        --sidebar-foreground: ${hexToHslString(c.foreground)};
        --sidebar-primary: ${hexToHslString(c.primary)};
        --sidebar-primary-foreground: ${hexToHslString("#FFFFFF")};
        --sidebar-accent: ${hexToHslString(c.muted || "#F1F5F9")};
        --sidebar-accent-foreground: ${hexToHslString(c.foreground)};
        --sidebar-border: ${hexToHslString(c.border || "#E2E8F0")};
        --sidebar-ring: ${hexToHslString(c.primary)};
      `;

      let css = `
        html:root {
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
        html.dark {
          ${generateVars(dark)}
        }
      `;

      styleEl.textContent = css;
    }
  }, [design]);

  // Dynamic SEO Injection
  useEffect(() => {
    if (seo && identity) {
      document.title = seo.meta_title || identity.platform_name || "TrustBank";
      
      const setMeta = (name: string, content: string, property = false) => {
        let el = document.querySelector(property ? `meta[property="${name}"]` : `meta[name="${name}"]`);
        if (!el) {
          el = document.createElement("meta");
          if (property) el.setAttribute("property", name);
          else el.setAttribute("name", name);
          document.head.appendChild(el);
        }
        el.setAttribute("content", content);
      };

      setMeta("description", seo.meta_description || identity.description);
      setMeta("author", identity.short_name);
      setMeta("og:title", seo.meta_title || identity.platform_name, true);
      setMeta("og:description", seo.meta_description || identity.description, true);
      if (seo.og_image) setMeta("og:image", seo.og_image, true);
      setMeta("twitter:site", corporate?.social_twitter ? `@${corporate.social_twitter.split('/').pop()}` : `@${identity.short_name}`);
    }
  }, [seo, identity, corporate]);

  return (
    <BrandContext.Provider value={{ identity, design, visuals, corporate, seo, compliance, loading, refreshBrandSettings: fetchSettings }}>
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
