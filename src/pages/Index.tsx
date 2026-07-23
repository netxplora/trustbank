import { useEffect, useState } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { supabase } from "@/integrations/supabase/client";

// New Components
import { HeroSection } from "@/components/public/HeroSection";
import { MarketInfoBar } from "@/components/public/MarketInfoBar";
import { PremiumTrustIndicators } from "@/components/public/PremiumTrustIndicators";
import { InteractiveServices } from "@/components/public/InteractiveServices";
import { LifestyleSection } from "@/components/public/LifestyleSection";
import { WealthShowcase } from "@/components/public/WealthShowcase";
import { EducationHub } from "@/components/public/EducationHub";
import { NewsInsights } from "@/components/public/NewsInsights";
import { SecuritySection } from "@/components/public/SecuritySection";
import { MobileShowcase } from "@/components/public/MobileShowcase";
import { TestimonialsCarousel } from "@/components/public/TestimonialsCarousel";
import { RelationshipManagers } from "@/components/public/RelationshipManagers";
import { AwardsSection } from "@/components/public/AwardsSection";
import { FAQSection } from "@/components/public/FAQSection";
import { PremiumCTA } from "@/components/public/PremiumCTA";

const Index = () => {
  const { identity } = useBrand();
  const [homePageData, setHomePageData] = useState<any>(null);

  useEffect(() => {
    if (identity) {
      document.title = `${identity.platform_name} | Premium Banking & Wealth Management`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", identity.description || "Enterprise-grade digital banking and asset management for high-net-worth clients.");
      }
    }
    
    // Fetch home page data for any dynamic descriptions
    const fetchPageData = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as unknown as any)
          .from("cms_pages")
          .select("*")
          .eq("slug", "home")
          .single();
        if (data) setHomePageData(data);
      } catch (e) {
        console.error("Error fetching page data", e);
      }
    };
    
    fetchPageData();
  }, [identity]);

  return (
    <div className="relative w-full overflow-hidden bg-background">
      <HeroSection homePageData={homePageData} />
      <MarketInfoBar />
      <PremiumTrustIndicators />
      <InteractiveServices />
      <LifestyleSection />
      <WealthShowcase />
      <EducationHub />
      <NewsInsights />
      <SecuritySection />
      <MobileShowcase />
      <TestimonialsCarousel />
      <RelationshipManagers />
      <AwardsSection />
      <FAQSection />
      <PremiumCTA />
    </div>
  );
};

export default Index;
