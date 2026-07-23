import { useState, useEffect } from "react";
import { Paintbrush, Globe, Box, Image, Phone, Sliders, Save, CheckCircle, Shield, Bell, CreditCard } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { Textarea } from "@trustbank/shared-ui/components/ui/textarea";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { useBrand } from "@trustbank/shared-utils/contexts/BrandContext";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { logAdminAction } from "@trustbank/shared-utils/lib/audit";
import { FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const { identity, design, visuals, corporate, refreshBrandSettings } = useBrand();
  const [activeTab, setActiveTab] = useState("identity");
  const [saving, setSaving] = useState(false);

  // Local States for forms (Initialized with current context values or defaults)
  const [brandIdentity, setBrandIdentity] = useState(identity || {
    platform_name: "", short_name: "", slogan: "", description: "", company_overview: ""
  });

  const [designSystem, setDesignSystem] = useState(design || {
    colors: { primary: "", secondary: "", accent: "", background: "", foreground: "" },
    typography: { heading_font: "", body_font: "" },
    radius: "0.5rem"
  });

  const [brandVisuals, setBrandVisuals] = useState(visuals || {
    primary_logo: "", favicon: "", hero_image: ""
  });

  const [corpInfo, setCorpInfo] = useState(corporate || {
    phone: "", email: "", headquarters: "", support_hours: ""
  });

  const [seoInfo, setSeoInfo] = useState({
    meta_title: "", meta_description: "", og_image: ""
  });

  const [complianceInfo, setComplianceInfo] = useState({
    terms_url: "/terms", privacy_url: "/privacy", cookie_url: "/cookies", legal_disclaimer: ""
  });

  const [notificationInfo, setNotificationInfo] = useState({
    support_email: "support@trustbank.com", noreply_email: "noreply@trustbank.com", enable_sms_alerts: false, webhook_url: ""
  });

  const [platformFees, setPlatformFees] = useState({
    physical_card_fee: "15.00"
  });

  useEffect(() => {
    // Fetch non-brand settings that aren't in context
    const fetchExtraSettings = async () => {
      const { data } = await supabase.from("cms_site_settings").select("key, value").in("key", ["seo", "compliance", "notifications", "physical_card_fee"]);
      data?.forEach(setting => {
        if (setting.key === "seo") setSeoInfo(setting.value as any);
        if (setting.key === "compliance") setComplianceInfo(setting.value as any);
        if (setting.key === "notifications") setNotificationInfo(setting.value as any);
        if (setting.key === "physical_card_fee") setPlatformFees({ physical_card_fee: setting.value as string });
      });
    };
    fetchExtraSettings();
  }, []);

  const handleSave = async (key: string, value: any) => {
    setSaving(true);
    try {
      // Ensure the value is a clean JSON object
      const safeValue = JSON.parse(JSON.stringify(value));
      
      // Bypass potential upsert bugs by doing a select then update/insert
      const { data: existing } = await supabase
        .from("cms_site_settings")
        .select("key")
        .eq("key", key)
        .maybeSingle();

      let opError;
      if (existing) {
        const { error } = await supabase
          .from("cms_site_settings")
          .update({ value: safeValue })
          .eq("key", key);
        opError = error;
      } else {
        const { error } = await supabase
          .from("cms_site_settings")
          .insert({ key, value: safeValue });
        opError = error;
      }

      if (opError) throw opError;

      await logAdminAction(`update_brand_settings`, "cms_site_settings", key, value);
      
      toast({
        title: "Settings Saved",
        description: `The ${key.replace("_", " ")} settings have been successfully updated.`,
      });

      // Refresh context to apply globally
      await refreshBrandSettings();
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefaults = async () => {
    const defaultTheme = {
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
      typography: { heading_font: "Figtree", body_font: "DM Sans" },
      radius: "1rem",
      shadows: {
        elevated: "0 4px 12px rgba(0, 0, 0, 0.08)",
        card_hover: "0 8px 24px rgba(0, 0, 0, 0.12)"
      }
    };
    
    setDesignSystem(defaultTheme);
    await handleSave("design_system", defaultTheme);
  };

  const tabs = [
    { key: "identity", label: "Brand Identity", icon: Globe },
    { key: "visuals", label: "Visual Assets", icon: Image },
    { key: "design", label: "Design System", icon: Paintbrush },
    { key: "corporate", label: "Contact Info", icon: Phone },
    { key: "compliance", label: "Compliance & Legal", icon: Shield },
    { key: "notifications", label: "Notifications & Alerts", icon: Bell },
    { key: "seo", label: "Global SEO", icon: Sliders },
    { key: "fees", label: "Platform Fees", icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">Brand & Platform Settings</h1>
        <p className="text-sm text-muted-foreground font-sans">Manage global branding, design tokens, and corporate information.</p>
      </div>

      <div className="flex gap-2 flex-wrap font-sans">
        {tabs.map(({ key, label, icon: Icon }) => (
          <Button key={key} variant={activeTab === key ? "default" : "outline"} size="sm" onClick={() => setActiveTab(key)} className="font-bold">
            <Icon className="h-4 w-4 mr-1.5" /> {label}
          </Button>
        ))}
      </div>

      <SlideUp>
      <div className="bg-card rounded-xl border p-6 max-w-3xl shadow-sm font-sans relative">
        <FadeIn key={activeTab}>
        {activeTab === "identity" && (
          <div className="space-y-5">
            <h2 className="font-bold font-poppins text-foreground mb-4 border-b pb-2">Platform Identity</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Platform Full Name</label><Input value={brandIdentity.platform_name} onChange={e => setBrandIdentity({...brandIdentity, platform_name: e.target.value})} className="font-semibold" /></div>
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Short Brand Name</label><Input value={brandIdentity.short_name} onChange={e => setBrandIdentity({...brandIdentity, short_name: e.target.value})} className="font-semibold" /></div>
            </div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Brand Slogan</label><Input value={brandIdentity.slogan} onChange={e => setBrandIdentity({...brandIdentity, slogan: e.target.value})} className="font-semibold" /></div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Short Description</label><Textarea value={brandIdentity.description} onChange={e => setBrandIdentity({...brandIdentity, description: e.target.value})} className="font-semibold h-20" /></div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Company Overview</label><Textarea value={brandIdentity.company_overview} onChange={e => setBrandIdentity({...brandIdentity, company_overview: e.target.value})} className="font-semibold h-32" /></div>
            
            <Button onClick={() => handleSave("brand_identity", brandIdentity)} disabled={saving} className="font-bold mt-4"><Save className="h-4 w-4 mr-1.5" /> {saving ? "Saving..." : "Save Identity Settings"}</Button>
          </div>
        )}

        {activeTab === "visuals" && (
          <div className="space-y-5">
            <h2 className="font-bold font-poppins text-foreground mb-4 border-b pb-2">Visual Assets</h2>
            <p className="text-xs text-muted-foreground mb-4">Provide URLs to the media library assets you want to use globally.</p>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Primary Logo URL</label><Input value={brandVisuals.primary_logo} onChange={e => setBrandVisuals({...brandVisuals, primary_logo: e.target.value})} className="font-mono text-sm" /></div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Favicon URL</label><Input value={brandVisuals.favicon} onChange={e => setBrandVisuals({...brandVisuals, favicon: e.target.value})} className="font-mono text-sm" /></div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Default Hero Image URL</label><Input value={brandVisuals.hero_image} onChange={e => setBrandVisuals({...brandVisuals, hero_image: e.target.value})} className="font-mono text-sm" /></div>
            
            <Button onClick={() => handleSave("visual_assets", brandVisuals)} disabled={saving} className="font-bold mt-4"><Save className="h-4 w-4 mr-1.5" /> {saving ? "Saving..." : "Save Visual Assets"}</Button>
          </div>
        )}

        {activeTab === "design" && (
          <div className="space-y-8">
            <div>
              <h2 className="font-bold font-poppins text-foreground mb-1 border-b pb-2">Design System Controls</h2>
              <p className="text-xs text-muted-foreground mt-2">Manage the global brand palette for Light and Dark modes. Changes automatically sync to all modules without deployment.</p>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Light Mode Column */}
              <div className="space-y-6 bg-muted/10 p-5 rounded-xl border">
                <h3 className="text-sm font-bold border-b pb-2 flex items-center gap-2">☀️ Light Mode Palette</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "primary", label: "Primary" },
                    { key: "secondary", label: "Secondary" },
                    { key: "accent", label: "Accent" },
                    { key: "background", label: "Background" },
                    { key: "foreground", label: "Text/Foreground" },
                    { key: "card", label: "Card Base" },
                    { key: "surface", label: "Surface/Modal" },
                    { key: "border", label: "Borders" },
                    { key: "muted", label: "Muted Background" },
                  ].map((color) => (
                    <div key={`light-${color.key}`} className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">{color.label}</label>
                      <div className="flex items-center gap-2">
                        <div className="relative shrink-0 border rounded-md overflow-hidden h-8 w-10 cursor-pointer shadow-sm">
                          <input 
                            type="color" 
                            value={(designSystem.colors as any)?.[color.key] || "#FFFFFF"} 
                            onChange={e => setDesignSystem({...designSystem, colors: {...designSystem.colors, [color.key]: e.target.value.toUpperCase()}})}
                            className="absolute inset-[-10px] w-20 h-20 cursor-pointer"
                          />
                        </div>
                        <Input 
                          value={(designSystem.colors as any)?.[color.key] || ""} 
                          onChange={e => setDesignSystem({...designSystem, colors: {...designSystem.colors, [color.key]: e.target.value.toUpperCase()}})} 
                          className="font-mono text-xs uppercase h-8" 
                          placeholder="#HEX" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dark Mode Column */}
              <div className="space-y-6 bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold border-b border-slate-800 pb-2 flex items-center gap-2">🌙 Dark Mode Palette</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "primary", label: "Primary" },
                    { key: "secondary", label: "Secondary" },
                    { key: "accent", label: "Accent" },
                    { key: "background", label: "Background" },
                    { key: "foreground", label: "Text/Foreground" },
                    { key: "card", label: "Card Base" },
                    { key: "surface", label: "Surface/Modal" },
                    { key: "border", label: "Borders" },
                    { key: "muted", label: "Muted Background" },
                  ].map((color) => (
                    <div key={`dark-${color.key}`} className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-400">{color.label}</label>
                      <div className="flex items-center gap-2">
                        <div className="relative shrink-0 border border-slate-700 rounded-md overflow-hidden h-8 w-10 cursor-pointer shadow-sm">
                          <input 
                            type="color" 
                            value={(designSystem as any)?.dark_mode_colors?.[color.key] || "#000000"} 
                            onChange={e => setDesignSystem({...designSystem, dark_mode_colors: {...((designSystem as any)?.dark_mode_colors || (designSystem as any)?.colors), [color.key]: e.target.value.toUpperCase()}})}
                            className="absolute inset-[-10px] w-20 h-20 cursor-pointer"
                          />
                        </div>
                        <Input 
                          value={(designSystem as any)?.dark_mode_colors?.[color.key] || ""} 
                          onChange={e => setDesignSystem({...designSystem, dark_mode_colors: {...((designSystem as any)?.dark_mode_colors || (designSystem as any)?.colors), [color.key]: e.target.value.toUpperCase()}})} 
                          className="font-mono text-xs uppercase h-8 bg-slate-800 border-slate-700 text-slate-100" 
                          placeholder="#HEX" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase tracking-wider">Border Radius</label>
                <select 
                  value={designSystem.radius || "0.5rem"} 
                  onChange={e => setDesignSystem({...designSystem, radius: e.target.value})} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="0rem">0rem (Square)</option>
                  <option value="0.3rem">0.3rem (Slight)</option>
                  <option value="0.5rem">0.5rem (Normal)</option>
                  <option value="0.75rem">0.75rem (Large)</option>
                  <option value="1rem">1rem (Extra Large)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button onClick={() => handleSave("design_system", designSystem)} disabled={saving} className="font-bold w-full sm:w-auto">
                <Save className="h-4 w-4 mr-1.5" /> {saving ? "Syncing Global Theme..." : "Apply Global Theme Updates"}
              </Button>
              <Button variant="outline" onClick={handleRestoreDefaults} disabled={saving} className="font-bold w-full sm:w-auto border-dashed">
                Restore Default Theme
              </Button>
            </div>
          </div>
        )}

        {activeTab === "corporate" && (
          <div className="space-y-5">
            <h2 className="font-bold font-poppins text-foreground mb-4 border-b pb-2">Contact & Corporate Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Primary Phone</label><Input value={corpInfo.phone} onChange={e => setCorpInfo({...corpInfo, phone: e.target.value})} className="font-semibold" /></div>
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Support Email</label><Input value={corpInfo.email} onChange={e => setCorpInfo({...corpInfo, email: e.target.value})} className="font-semibold" /></div>
            </div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Corporate Headquarters Address</label><Input value={corpInfo.headquarters} onChange={e => setCorpInfo({...corpInfo, headquarters: e.target.value})} className="font-semibold" /></div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Support Hours</label><Input value={corpInfo.support_hours} onChange={e => setCorpInfo({...corpInfo, support_hours: e.target.value})} className="font-semibold" /></div>
            
            <Button onClick={() => handleSave("corporate", corpInfo)} disabled={saving} className="font-bold mt-4"><Save className="h-4 w-4 mr-1.5" /> {saving ? "Saving..." : "Save Contact Info"}</Button>
          </div>
        )}

        {activeTab === "compliance" && (
          <div className="space-y-5">
            <h2 className="font-bold font-poppins text-foreground mb-4 border-b pb-2">Compliance & Legal Settings</h2>
            <p className="text-xs text-muted-foreground mb-4">Manage legal document URLs and mandatory footer disclaimers.</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Terms of Service URL</label><Input value={complianceInfo.terms_url} onChange={e => setComplianceInfo({...complianceInfo, terms_url: e.target.value})} className="font-mono text-sm" /></div>
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Privacy Policy URL</label><Input value={complianceInfo.privacy_url} onChange={e => setComplianceInfo({...complianceInfo, privacy_url: e.target.value})} className="font-mono text-sm" /></div>
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Cookie Policy URL</label><Input value={complianceInfo.cookie_url} onChange={e => setComplianceInfo({...complianceInfo, cookie_url: e.target.value})} className="font-mono text-sm" /></div>
            </div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Global Legal Disclaimer (Footer)</label><Textarea value={complianceInfo.legal_disclaimer} onChange={e => setComplianceInfo({...complianceInfo, legal_disclaimer: e.target.value})} className="font-sans text-xs h-32" placeholder="e.g. TrustBank is a financial technology company, not a bank. Banking services provided by..." /></div>
            
            <Button onClick={() => handleSave("compliance", complianceInfo)} disabled={saving} className="font-bold mt-4"><Save className="h-4 w-4 mr-1.5" /> {saving ? "Saving..." : "Save Compliance Settings"}</Button>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-5">
            <h2 className="font-bold font-poppins text-foreground mb-4 border-b pb-2">Notifications & Alerts</h2>
            <p className="text-xs text-muted-foreground mb-4">Configure system notification channels and webhooks.</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">System Support Email</label><Input value={notificationInfo.support_email} onChange={e => setNotificationInfo({...notificationInfo, support_email: e.target.value})} className="font-semibold text-sm" /></div>
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">No-Reply Email</label><Input value={notificationInfo.noreply_email} onChange={e => setNotificationInfo({...notificationInfo, noreply_email: e.target.value})} className="font-semibold text-sm" /></div>
            </div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Critical Alert Webhook URL</label><Input value={notificationInfo.webhook_url} onChange={e => setNotificationInfo({...notificationInfo, webhook_url: e.target.value})} className="font-mono text-sm" placeholder="https://api.slack.com/..." /></div>
            
            <div className="flex items-center gap-2 mt-4 p-4 border rounded-lg bg-muted/20">
              <input type="checkbox" id="sms_alerts" checked={notificationInfo.enable_sms_alerts} onChange={e => setNotificationInfo({...notificationInfo, enable_sms_alerts: e.target.checked})} className="h-4 w-4 rounded border-gray-300" />
              <label htmlFor="sms_alerts" className="text-sm font-bold cursor-pointer">Enable Global SMS Alerts (Twilio integration)</label>
            </div>
            
            <Button onClick={() => handleSave("notifications", notificationInfo)} disabled={saving} className="font-bold mt-4"><Save className="h-4 w-4 mr-1.5" /> {saving ? "Saving..." : "Save Notification Settings"}</Button>
          </div>
        )}

        {activeTab === "seo" && (
          <div className="space-y-5">
            <h2 className="font-bold font-poppins text-foreground mb-4 border-b pb-2">Search Engine Optimization (SEO)</h2>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Global Meta Title</label><Input value={seoInfo.meta_title} onChange={e => setSeoInfo({...seoInfo, meta_title: e.target.value})} className="font-semibold" /></div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Global Meta Description</label><Textarea value={seoInfo.meta_description} onChange={e => setSeoInfo({...seoInfo, meta_description: e.target.value})} className="font-semibold h-20" /></div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Default OG Image URL (For Social Sharing)</label><Input value={seoInfo.og_image} onChange={e => setSeoInfo({...seoInfo, og_image: e.target.value})} className="font-mono text-sm" /></div>
            
            <Button onClick={() => handleSave("seo", seoInfo)} disabled={saving} className="font-bold mt-4"><Save className="h-4 w-4 mr-1.5" /> {saving ? "Saving..." : "Save SEO Settings"}</Button>
          </div>
        )}

        {activeTab === "fees" && (
          <div className="space-y-5">
            <h2 className="font-bold font-poppins text-foreground mb-4 border-b pb-2">Platform Fees</h2>
            <p className="text-xs text-muted-foreground mb-4">Manage the fees charged to customers for various services.</p>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Physical Card Request Fee ($)</label>
              <Input type="number" step="0.01" value={platformFees.physical_card_fee} onChange={e => setPlatformFees({...platformFees, physical_card_fee: e.target.value})} className="font-mono font-semibold" />
            </div>
            
            <Button onClick={() => handleSave("physical_card_fee", platformFees.physical_card_fee)} disabled={saving} className="font-bold mt-4"><Save className="h-4 w-4 mr-1.5" /> {saving ? "Saving..." : "Save Fees"}</Button>
          </div>
        )}
        </FadeIn>
      </div>
      </SlideUp>
    </div>
  );
};

export default AdminSettingsPage;
