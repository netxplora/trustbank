import { useEffect, useState, lazy, Suspense } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { supabase } from "@/integrations/supabase/client";

// Above-the-fold — load immediately
import { HeroSection } from "@/components/public/HeroSection";
import { MarketInfoBar } from "@/components/public/MarketInfoBar";

// Below-the-fold — lazy load to reduce initial JS parse cost
const PremiumTrustIndicators = lazy(() =>
  import("@/components/public/PremiumTrustIndicators").then(m => ({ default: m.PremiumTrustIndicators }))
);
const InteractiveServices = lazy(() =>
  import("@/components/public/InteractiveServices").then(m => ({ default: m.InteractiveServices }))
);
const LifestyleSection = lazy(() =>
  import("@/components/public/LifestyleSection").then(m => ({ default: m.LifestyleSection }))
);
const WealthShowcase = lazy(() =>
  import("@/components/public/WealthShowcase").then(m => ({ default: m.WealthShowcase }))
);
const EducationHub = lazy(() =>
  import("@/components/public/EducationHub").then(m => ({ default: m.EducationHub }))
);
const NewsInsights = lazy(() =>
  import("@/components/public/NewsInsights").then(m => ({ default: m.NewsInsights }))
);
const SecuritySection = lazy(() =>
  import("@/components/public/SecuritySection").then(m => ({ default: m.SecuritySection }))
);
const MobileShowcase = lazy(() =>
  import("@/components/public/MobileShowcase").then(m => ({ default: m.MobileShowcase }))
);
const TestimonialsCarousel = lazy(() =>
  import("@/components/public/TestimonialsCarousel").then(m => ({ default: m.TestimonialsCarousel }))
);
const RelationshipManagers = lazy(() =>
  import("@/components/public/RelationshipManagers").then(m => ({ default: m.RelationshipManagers }))
);
const AwardsSection = lazy(() =>
  import("@/components/public/AwardsSection").then(m => ({ default: m.AwardsSection }))
);
const FAQSection = lazy(() =>
  import("@/components/public/FAQSection").then(m => ({ default: m.FAQSection }))
);
const PremiumCTA = lazy(() =>
  import("@/components/public/PremiumCTA").then(m => ({ default: m.PremiumCTA }))
);

// Lightweight skeleton for below-the-fold sections
const SectionSkeleton = () => (
  <div className="w-full py-16 px-4">
    <div className="max-w-6xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-muted/40 rounded w-1/3 mx-auto" />
      <div className="h-4 bg-muted/30 rounded w-1/2 mx-auto" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted/20 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

const Index = () => {
  const { identity } = useBrand();
  const [homePageData, setHomePageData] = useState<any>(null);

  useEffect(() => {
    if (identity) {
      document.title = `${identity.platform_name} | Premium Banking & Wealth Management`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          "content",
          identity.description ||
            "Professional digital banking and asset management for individuals and businesses."
        );
      }
    }

    // Fetch home page data for any dynamic descriptions
    const fetchPageData = async () => {
      try {
        const { data } = await (supabase as any)
          .from("cms_pages")
          .select("slug, title, description, content_blocks")
          .eq("slug", "home")
          .single();
        if (data) setHomePageData(data);
      } catch {
        // Silently fail — page still works without CMS data
      }
    };

    fetchPageData();
  }, [identity]);

  return (
    <div className="relative w-full overflow-hidden bg-background">
      {/* Critical above-the-fold content — no Suspense wrapper, loads synchronously */}
      <HeroSection homePageData={homePageData} />
      <MarketInfoBar />

      {/* Below-the-fold — lazy loaded with lightweight skeletons */}
      <Suspense fallback={<SectionSkeleton />}>
        <PremiumTrustIndicators />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <InteractiveServices />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <LifestyleSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <WealthShowcase />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <EducationHub />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <NewsInsights />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <SecuritySection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <MobileShowcase />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <TestimonialsCarousel />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <RelationshipManagers />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <AwardsSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <FAQSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <PremiumCTA />
      </Suspense>
    </div>
  );
};

export default Index;
