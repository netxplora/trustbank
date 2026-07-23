import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useBrand } from "@trustbank/shared-utils/contexts/BrandContext";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { RevealOnScroll } from "@/components/public/RevealOnScroll";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@trustbank/shared-ui/components/Motion";
import { InfiniteCarousel } from "@/components/public/InfiniteCarousel";
import { SectionHeader } from "@/components/public/SectionHeader";
import { LiveCurrencyWidget } from "@/components/public/LiveCurrencyWidget";
import { MarketSnapshot } from "@/components/public/MarketSnapshot";
import { PremiumCardShowcase } from "@/components/public/PremiumCardShowcase";
import { DigitalPlatformPreview } from "@/components/public/DigitalPlatformPreview";
import { InteractiveCalculators } from "@/components/public/InteractiveCalculators";
import {
  ShieldCheck,
  Lock,
  Building2,
  ArrowRight,
  TrendingUp,
  Wallet,
  Landmark,
  CreditCard,
  Smartphone,
  HelpCircle,
  Users,
  DollarSign,
  Clock,
  Percent,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  BookOpen,
  Activity,
  ShieldAlert,
  Heart,
  Globe
} from "lucide-react";

// Types
interface Post {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  content: string | null;
  image_url: string | null;
  category: string;
  published_at: string;
}


const Index = () => {
  const { identity, visuals } = useBrand();
  const [articles, setArticles] = useState<Post[]>([]);
  const [homePageData, setHomePageData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (identity) {
      document.title = `${identity.platform_name} | Premium Banking & Wealth Management`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", identity.description || "Enterprise-grade digital banking and asset management for high-net-worth clients.");
      }
    }
    fetchAllData();

    const channel = supabase
      .channel("public-home-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "cms_posts" }, () => fetchAllData())
      .on("postgres_changes", { event: "*", schema: "public", table: "cms_pages" }, () => fetchAllData())
      .on("postgres_changes", { event: "*", schema: "public", table: "cms_products" }, () => fetchAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [identity]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch Page Content
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pageData } = await (supabase as unknown as any)
        .from("cms_pages")
        .select("*")
        .eq("slug", "home")
        .single();

      if (pageData) setHomePageData(pageData);

      // Fetch Products
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: productsData } = await (supabase as unknown as any)
        .from("cms_products")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(8);

      if (productsData) setProducts(productsData);

      // Fetch Testimonials
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: testimonialsData } = await (supabase as unknown as any)
        .from("cms_testimonials")
        .select("*")
        .limit(3);

      if (testimonialsData) setTestimonials(testimonialsData);

      // Fetch News
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: postsData } = await (supabase as unknown as any)
        .from("cms_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);

      if (postsData && postsData.length > 0) {
        setArticles(postsData as Post[]);
      }
    } catch (e) {
      // Silently fail — articles section will show empty state
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="relative w-full overflow-hidden bg-background">

      {/* SECTION 1: FULL-SCREEN HERO SECTION */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center py-20 lg:py-32 overflow-hidden bg-slate-950 text-white">

        {/* Dynamic Background Photography - aligned right, fades left */}
        <div className="absolute right-0 top-0 w-full lg:w-3/5 h-full z-0 select-none">
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10" />
          <img
            src="/images/hero_bg.png"
            alt="TrustBank Headquarters"
            className="w-full h-full object-cover object-left lg:object-center opacity-50 lg:opacity-70"
          />
          {/* Gentle fade: keeps text on the left completely clean, image on the right fully visible */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent lg:bg-gradient-to-r lg:from-slate-950 lg:via-slate-950/40 lg:to-transparent z-20" />
        </div>

        {/* Subtle background glow */}
        <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] pointer-events-none z-0" />

        <div className="container relative z-30 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">

            {/* Left Column: Core Value Proposition */}
            <div className="lg:col-span-7 max-w-2xl">
              <SlideUp>
                <div className="inline-flex items-center gap-3 mb-8 bg-white/5 border border-white/10 backdrop-blur-md px-5 py-2 rounded-full shadow-2xl">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/90">
                    Private & Commercial Banking
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-poppins font-bold tracking-tight leading-[1.1] mb-8 text-white">
                  Strategic <span className="text-primary">Financial</span> Excellence
                </h1>

                <p className="text-lg md:text-xl text-white/70 font-sans leading-relaxed mb-12 max-w-xl">
                  {homePageData?.description || "Access premium deposit accounts, structured commercial lending, and dedicated advisory services backed by industry-leading security and personalized support."}
                </p>

                <div className="flex flex-col sm:flex-row gap-5 mb-14">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 h-16 rounded-2xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-3 text-base" asChild>
                    <Link to="/register">
                      Open an Account <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="bg-transparent border-white/20 hover:bg-white/10 text-white font-semibold px-10 h-16 rounded-2xl transition-all text-base flex items-center justify-center" asChild>
                    <Link to="/login">Client Login</Link>
                  </Button>
                </div>

                {/* Badges in Hero */}
                <StaggerContainer className="flex flex-wrap gap-8 pt-8 border-t border-white/10">
                  <StaggerItem className="flex items-center gap-3 group">
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-white/80 uppercase tracking-widest">FDIC Insured</span>
                  </StaggerItem>
                  <StaggerItem className="flex items-center gap-3 group">
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-white/80 uppercase tracking-widest">Secure Banking</span>
                  </StaggerItem>
                  <StaggerItem className="flex items-center gap-3 group">
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-white/80 uppercase tracking-widest">Regulatory Compliant</span>
                  </StaggerItem>
                </StaggerContainer>
              </SlideUp>
            </div>

            {/* Right Column: Premium Interactive UI Preview */}
            <div className="lg:col-span-5 relative w-full flex flex-col items-center justify-center mt-12 lg:mt-0">
              <FadeIn delay={0.2} className="w-full">
                <div className="relative w-full max-w-md mx-auto space-y-6">

                  {/* Floating Account Balance Card */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 p-8 shadow-2xl hover:-translate-y-1 transition-transform duration-500 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Account Balance</span>
                        <div className="text-4xl font-poppins font-bold text-white mt-2 tracking-tight">$284,590.12</div>
                        <div className="text-xs text-white/40 font-sans mt-1">Available Funds</div>
                      </div>
                      <div className="bg-white/10 border border-white/10 text-white font-poppins font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md">
                        Visa Infinite
                      </div>
                    </div>

                    {/* Miniature growth path line chart (custom SVG) */}
                    <div className="h-16 w-full my-6 relative z-10">
                      <svg className="w-full h-full" viewBox="0 0 300 50" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0 45 Q50 35 100 40 T200 15 T300 5"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3"
                          strokeLinecap="round"
                          className="opacity-80"
                        />
                        <path
                          d="M0 45 Q50 35 100 40 T200 15 T300 5 L300 50 L0 50 Z"
                          fill="url(#growthGrad)"
                        />
                        <circle cx="300" cy="5" r="4" fill="#ffffff" className="shadow-[0_0_10px_#ffffff]" />
                      </svg>
                    </div>

                    <div className="flex justify-between items-center text-xs text-white/50 pt-6 border-t border-white/10 relative z-10">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest block mb-1">Client Name</span>
                        <span className="text-white font-medium text-sm">Eleanor Vance</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold uppercase tracking-widest block mb-1">Routing Transit</span>
                        <span className="text-white font-mono text-sm">•••• 0180</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Transactions Preview Widget */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:bg-white/10 transition-colors duration-500">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <h4 className="text-[10px] font-bold uppercase text-white/50 tracking-[0.2em] mb-5">Recent Asset Activity</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-[10px] tracking-widest">DEP</div>
                          <div>
                            <div className="font-semibold text-white">Direct Deposit (Corp Payroll)</div>
                            <div className="text-xs text-white/40 mt-0.5">June 20, 2026</div>
                          </div>
                        </div>
                        <div className="font-mono text-emerald-400 font-bold tracking-tight">+$8,420.00</div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-[10px] tracking-widest">DIV</div>
                          <div>
                            <div className="font-semibold text-white">Brokerage Dividend Recipient</div>
                            <div className="text-xs text-white/40 mt-0.5">June 18, 2026</div>
                          </div>
                        </div>
                        <div className="font-mono text-emerald-400 font-bold tracking-tight">+$1,250.00</div>
                      </div>
                    </div>
                  </div>

                  {/* Banking Insights Widget */}
                  <div className="bg-primary/20 border border-primary/30 backdrop-blur-xl rounded-3xl p-5 flex items-start gap-4 shadow-2xl">
                    <div className="h-10 w-10 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
                      <ShieldAlert className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white tracking-wide uppercase mb-1">Security & Yield Alert</h5>
                      <p className="text-xs text-white/70 leading-relaxed font-sans">
                        Security keys successfully linked. High-yield savings rate currently active at 4.85% APY.
                      </p>
                    </div>
                  </div>

                </div>
              </FadeIn>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 1.5: LIVE CURRENCY WIDGET */}
      <LiveCurrencyWidget />

      {/* SECTION 2: TRUST BAR */}
      <section className="bg-surface border-y border-border py-10 relative z-20">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold font-poppins text-foreground">1.2M+</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-semibold">Active Clients</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-poppins text-foreground">$48.3B</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-semibold">Annual Volume</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-poppins text-foreground">32 Years</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-semibold">Operation</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-poppins text-foreground">98.4%</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-semibold">Retention Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-poppins text-foreground">SOC2</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-semibold">Certified Security</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-poppins text-foreground">SEC & FINRA</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-semibold">Compliant</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-poppins text-foreground">94%</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-semibold">Digital Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2.5: DIGITAL PLATFORM PREVIEW */}
      <DigitalPlatformPreview />

      {/* SECTION 2.8: PREMIUM CARD SHOWCASE */}
      <PremiumCardShowcase />

      {/* SECTION 3: BANKING PRODUCTS GRID */}
      <section className="py-20 lg:py-32 bg-background border-b">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Core Services"
            title="Premium Banking Directories"
            description="Explore our tailored products designed to support your personal finances, business expansion, and capital growth."
          />

          <div className="mt-12 overflow-hidden">
            <InfiniteCarousel speed={1}>
              {products.length > 0 ? (
                products.map((product, idx) => {
                  const fallbackImages = [
                    "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&q=80&w=800",
                    "https://images.unsplash.com/photo-1556740714-a8395b3bf30f?auto=format&fit=crop&q=80&w=800",
                    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
                    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800",
                    "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&q=80&w=800"
                  ];
                  const bgImage = product.image_url || fallbackImages[idx % fallbackImages.length];

                  return (
                    <div key={product.id} className={`w-[300px] min-h-[360px] h-full shrink-0 whitespace-normal ${idx === 0 ? "border-2 border-primary shadow-lg shadow-primary/10" : "border border-border"} rounded-2xl bg-card text-card-foreground shadow-sm flex flex-col transition-all group relative overflow-hidden hover:shadow-md hover:-translate-y-1 duration-500`}>
                      
                      {/* Image Top Half */}
                      <div className="relative h-40 w-full overflow-hidden shrink-0 border-b border-border/50">
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${bgImage})` }} />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                        
                        {/* Floating Icon */}
                        <div className="absolute -bottom-5 left-5 h-10 w-10 rounded-xl flex items-center justify-center bg-card border border-border shadow-md text-primary z-10 transition-transform group-hover:scale-110 duration-300">
                          {idx === 0 && <TrendingUp className="h-5 w-5" />}
                          {idx === 1 && <Wallet className="h-5 w-5" />}
                          {idx === 2 && <Building2 className="h-5 w-5" />}
                          {idx === 3 && <Percent className="h-5 w-5" />}
                          {idx > 3 && <Landmark className="h-5 w-5" />}
                        </div>

                        {idx === 0 && (
                          <span className="absolute top-3 right-3 text-[9px] bg-primary text-primary-foreground font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm z-10">
                            Featured
                          </span>
                        )}
                      </div>

                      {/* Content Bottom Half */}
                      <div className="px-5 pt-8 pb-4 flex flex-col flex-1 text-left">
                        <h3 className="text-lg font-poppins font-bold mb-2 group-hover:text-primary transition-colors leading-tight line-clamp-2">{product.name}</h3>
                        <p className="text-xs leading-relaxed text-muted-foreground font-sans mb-3">
                          {product.description}
                        </p>
                        
                        <div className="mt-auto pt-3 border-t border-border/60 dark:border-border/80">
                          <Link to={`/services#${product.category}`} className="text-[10px] font-bold inline-flex items-center gap-1.5 text-foreground group-hover:text-primary transition-colors uppercase tracking-widest group-hover:gap-2">
                            Explore Service <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="w-full py-12 text-center text-muted-foreground">
                  <p>Loading banking products...</p>
                </div>
              )}
            </InfiniteCarousel>
          </div>
        </div>
      </section>

      {/* SECTION 4: BANKING PHILOSOPHY SECTION */}
      <section className="py-20 lg:py-32 bg-muted/30 border-b">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

            {/* Left Column: Brand Philosophy */}
            <div className="lg:col-span-7">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary block mb-3">
                Corporate Principles
              </span>
              <h2 className="text-3xl sm:text-4xl font-poppins font-bold text-foreground mb-6">
                Stability, Transparency, and Long-Term Value Creation
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground font-sans mb-8">
                For over three decades, TrustBank has operated with a fiduciary commitment to our clients. We avoid high-risk speculative structures, focusing instead on capital security, stable deposit growth, and supporting the commercial development of our communities.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Fiduciary Responsibility & Capital Security</h4>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">We hold ourselves to the highest legal and ethical standard in asset preservation. Our treasury maintains a conservative loan-to-deposit ratio, ensuring that client capital remains fully liquid and protected against systemic market shocks.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Asset-Backed Commercial Stability</h4>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">All commercial and personal lending is strictly collateralized. Our underwriting teams evaluate physical assets and cash flow metrics, entirely avoiding unsecured speculative debt structures that compromise institutional health.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Multi-Tiered Architectural Security</h4>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Client data is secured via AES-256 encryption at rest and TLS 1.3 in transit. Our infrastructure utilizes isolated subnetworks for core banking operations, continuously audited by independent regulatory bodies for SOC2 and ISO 27001 compliance.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Complete Operational Transparency</h4>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">We provide clear, uncompromised reporting across every balance, return, and transaction. Our corporate clients receive real-time API access to ledger data, facilitating automated reconciliation and precise cash flow management.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Customer Quote Overlay & Portrait */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-background aspect-[4/5] max-w-sm mx-auto">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800"
                  alt="TrustBank Private Client Relationship"
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />

                {/* Subtle Gradient Overlay for text readability at the bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent dark:from-slate-950 dark:via-slate-950/80 pointer-events-none" />

                {/* Quote Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="text-secondary text-3xl font-serif mb-2">“</div>
                  <p className="text-xs font-sans leading-relaxed text-white/90 italic mb-4">
                    "TrustBank has managed our family's assets across generations with absolute integrity and professionalism. The direct access to a dedicated wealth advisor has been invaluable."
                  </p>
                  <div className="border-t border-white/20 pt-3">
                    <div className="text-xs font-bold font-poppins text-white">Eleanor Vance</div>
                    <div className="text-[10px] text-white/70 font-sans">Private Wealth Advisory Client</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5: FEATURES AND BENEFITS GRID */}
      <section className="py-20 lg:py-32 bg-background border-b">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Platform Capabilities"
            title="Institutional-Grade Banking Features"
            description="Experience digital banking built around secure transaction pipelines and comprehensive wealth monitoring."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">

            {/* Panel 1: Cross-Border Payments */}
            <div className="bg-card border border-muted/50 rounded-xl p-6 hover-lift transition-all shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Cross-Border Payment Routing</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Execute international transfers with exact foreign exchange rates. Our direct participation in SWIFT and SEPA networks minimizes intermediary delays, ensuring rapid settlement for corporate supply chains.
              </p>
            </div>

            {/* Panel 2: Corporate API */}
            <div className="bg-card border border-muted/50 rounded-xl p-6 hover-lift transition-all shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Corporate API Integrations</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Automate your treasury functions. Connect your ERP software directly to our banking core via secure API endpoints for real-time balance queries, automated payment dispatch, and programmatic reconciliation.
              </p>
            </div>

            {/* Panel 3: Treasury Management */}
            <div className="bg-card border border-muted/50 rounded-xl p-6 hover-lift transition-all shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Treasury Liquidity Services</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Optimize idle cash through automated sweep accounts. We offer commercial paper facilities and short-term government bonds to maintain yield on corporate reserves while ensuring immediate operational liquidity.
              </p>
            </div>

            {/* Panel 4: Hardware Auth */}
            <div className="bg-card border border-muted/50 rounded-xl p-6 hover-lift transition-all shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Hardware-Backed Authentication</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Mandate FIDO2-compliant physical security keys (like YubiKey) for high-value transactions. Control administrative access through strict role-based permissions and multi-party approval workflows.
              </p>
            </div>

            {/* Panel 5: Wealth Monitoring */}
            <div className="bg-card border border-muted/50 rounded-xl p-6 hover-lift transition-all shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Unified Asset Monitoring</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Track self-directed brokerage balances, fiduciary trusts, and illiquid real estate holdings on a single dashboard. Generate tax-ready performance reports adjusted for inflation and management fees.
              </p>
            </div>

            {/* Panel 6: Fraud Defense */}
            <div className="bg-card border border-muted/50 rounded-xl p-6 hover-lift transition-all shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Proactive Fraud Defense</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Transactions are evaluated by heuristic analysis systems prior to clearing. Immediate freezes are applied to anomalous geographical or volumetric deviations, with instant notification via secure channels.
              </p>
            </div>

            {/* Panel 7: Dedicated Advisory */}
            <div className="bg-card border border-muted/50 rounded-xl p-6 hover-lift transition-all shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Dedicated Advisory Desk</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Bypass general support queues. Private banking clients are assigned a dedicated relationship manager and direct phone line, providing immediate resolution for complex wire tracing or credit requests.
              </p>
            </div>

            {/* Panel 8: Institutional Credit */}
            <div className="bg-card border border-muted/50 rounded-xl p-6 hover-lift transition-all shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Institutional Credit Facilities</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Access structured financing including capital expenditure loans, equipment leasing, and commercial real estate mortgages. Terms are negotiated directly with senior underwriters based on corporate cash flow.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 6: RATE AND PERFORMANCE CALLOUT SECTION */}
      <section className="py-20 lg:py-32 bg-primary text-foreground">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 items-center text-center">

            <div className="p-4">
              <div className="text-5xl lg:text-6xl font-poppins font-bold text-secondary">4.85%</div>
              <h4 className="text-xs uppercase tracking-widest text-blue-100 mt-3 font-semibold">Savings APY</h4>
              <p className="text-[10px] text-blue-200 mt-1">High-Yield Deposits</p>
            </div>

            <div className="p-4 border-t md:border-t-0 md:border-l border-white/20">
              <div className="text-5xl lg:text-6xl font-poppins font-bold text-foreground">9.4%</div>
              <h4 className="text-xs uppercase tracking-widest text-blue-100 mt-3 font-semibold">Average Return</h4>
              <p className="text-[10px] text-blue-200 mt-1">Advisor Portfolios</p>
            </div>

            <div className="p-4 border-t md:border-t-0 lg:border-l border-white/20">
              <div className="text-5xl lg:text-6xl font-poppins font-bold text-foreground">24 Hr</div>
              <h4 className="text-xs uppercase tracking-widest text-blue-100 mt-3 font-semibold">Loan Approval</h4>
              <p className="text-[10px] text-blue-200 mt-1">Commercial Lines</p>
            </div>

            <div className="p-4 border-t md:border-t-0 lg:border-l border-white/20">
              <div className="text-5xl lg:text-6xl font-poppins font-bold text-foreground">99.99%</div>
              <h4 className="text-xs uppercase tracking-widest text-blue-100 mt-3 font-semibold">System Uptime</h4>
              <p className="text-[10px] text-blue-200 mt-1">Secure Core Banking</p>
            </div>

            <div className="p-4 border-t md:border-t-0 lg:border-l border-white/20">
              <div className="text-5xl lg:text-6xl font-poppins font-bold text-secondary">98.7%</div>
              <h4 className="text-xs uppercase tracking-widest text-blue-100 mt-3 font-semibold">Client Retention</h4>
              <p className="text-[10px] text-blue-200 mt-1">Wealth Services</p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 6.5: MARKET SNAPSHOT */}
      <MarketSnapshot />

      {/* SECTION 7: TESTIMONIALS AND SUCCESS STORIES */}
      <section className="py-20 lg:py-32 bg-muted/30 border-b">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Success Stories"
            title="Real-World Client Partnerships"
            description="Read how our structured credit lines and wealth advisory services support corporate directors and private clients."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-12">

            {testimonials.length > 0 ? (
              testimonials.map((t) => (
                <div key={t.id} className="bg-card border border-muted/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <p className="text-xs leading-relaxed text-muted-foreground font-sans mb-6">
                      "{t.text}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-muted/50">
                    {t.photo_url && (
                      <img
                        src={t.photo_url}
                        alt={t.name}
                        className="h-10 w-10 rounded-full object-cover shrink-0"
                        loading="lazy"
                      />
                    )}
                    <div>
                      <h4 className="text-xs font-bold font-poppins text-foreground">{t.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-sans">{t.role}{t.city ? `, ${t.city}` : ""}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <p>Loading success stories...</p>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* SECTION 8: NEWS & INSIGHTS SECTION */}
      <section className="py-20 lg:py-32 bg-background border-b">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Market Briefs"
            title="Institutional Press & Insights"
            description="Access our macroeconomic updates and corporate announcements managed by our advisory desk."
          />

          {articles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-12">
              {articles.map((article) => (
                <div key={article.id} className="bg-card border border-muted/50 rounded-2xl overflow-hidden hover-lift transition-all flex flex-col justify-between h-full shadow-sm">
                  <div>
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      <img
                        src={article.image_url || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600"}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600";
                        }}
                      />
                      <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {article.category}
                      </span>
                    </div>
                    <div className="p-6">
                      <div className="text-[10px] text-muted-foreground font-sans mb-2">
                        {new Date(article.published_at).toLocaleDateString("en-US", {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </div>
                      <h4 className="text-sm font-semibold text-foreground font-poppins leading-snug mb-3">
                        {article.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {article.summary}
                      </p>
                    </div>
                  </div>
                  <div className="p-6 pt-0 mt-auto">
                    <Link to={`/news/${(article as unknown as { slug: string }).slug || article.id}`} className="text-xs text-primary font-bold inline-flex items-center gap-1 hover:gap-2 transition-all">
                      Read Briefing <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading ? (
            <div className="mt-12 text-center py-16 bg-card rounded-2xl border">
              <p className="text-sm text-muted-foreground font-sans">No publications available at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-2xl border overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button variant="outline" asChild>
              <Link to="/news">Explore Complete Publications Hub</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 9: FINANCIAL EDUCATION & RESOURCES */}
      <section className="py-20 lg:py-32 bg-muted/30 border-b">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Asset Literacy"
            title="Capital Management & Security Resources"
            description="Review basic savings strategies, security frameworks, and business capital guides."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">

            {/* Guide 1 */}
            <div className="bg-card border border-muted/50 rounded-xl p-5 hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-bold text-foreground mb-2">High-Yield Savings structures</h4>
              <p className="text-[11px] leading-relaxed text-muted-foreground mb-4">
                Understanding Daily Compound Interest and cash deposit guarantees within liquid accounts.
              </p>
              <Link to="/faq" className="text-[11px] text-primary font-semibold hover:underline inline-flex items-center gap-1">
                Access Guide <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Guide 2 */}
            <div className="bg-card border border-muted/50 rounded-xl p-5 hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-bold text-foreground mb-2">Generational Legacy Trusts</h4>
              <p className="text-[11px] leading-relaxed text-muted-foreground mb-4">
                A review of asset protection vehicles, estate tax structures, and fiduciary guidelines.
              </p>
              <Link to="/faq" className="text-[11px] text-primary font-semibold hover:underline inline-flex items-center gap-1">
                Access Guide <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Guide 3 */}
            <div className="bg-card border border-muted/50 rounded-xl p-5 hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-bold text-foreground mb-2">Corporate Cash Optimization</h4>
              <p className="text-[11px] leading-relaxed text-muted-foreground mb-4">
                Strategies to protect working capital while maintaining treasury interest returns.
              </p>
              <Link to="/faq" className="text-[11px] text-primary font-semibold hover:underline inline-flex items-center gap-1">
                Access Guide <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Guide 4 */}
            <div className="bg-card border border-muted/50 rounded-xl p-5 hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-bold text-foreground mb-2">Securing Digital Portals</h4>
              <p className="text-[11px] leading-relaxed text-muted-foreground mb-4">
                Step-by-step instructions to set up physical hardware keys and identify spear-phishing attempts.
              </p>
              <Link to="/faq" className="text-[11px] text-primary font-semibold hover:underline inline-flex items-center gap-1">
                Access Guide <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 9.5: INTERACTIVE CALCULATORS */}
      <InteractiveCalculators />

      {/* SECTION 10: PREMIUM CALL-TO-ACTION SECTION */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-background text-foreground dark:text-white">

        {/* Background Image & Overlays */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&q=80&w=2000"
            alt="Private Banking"
            className="w-full h-full object-cover object-center opacity-10 dark:opacity-50"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-background/60 dark:bg-[#0d0b08]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/10 dark:from-[#0d0b08] dark:via-[#0d0b08]/30 dark:to-[#0d0b08]/10" />
        </div>

        {/* Subtle branded watermark text background */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
          <span className="font-poppins text-7xl md:text-9xl font-bold tracking-widest text-center text-foreground dark:text-white">
            TRUSTBANK PRIVATE
          </span>
        </div>

        <div className="container relative z-10 px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <RevealOnScroll>
            <div className="h-1 w-12 bg-primary mx-auto mb-6 rounded" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-poppins font-bold tracking-tight mb-6 text-foreground dark:text-white">
              Establish Your Private Banking Relationship
            </h2>
            <p className="text-sm md:text-base text-muted-foreground dark:text-white/70 leading-relaxed max-w-xl mx-auto mb-8 font-sans">
              Connect with our relationship managers today. Let us structure checking accounts, high-yield deposit paths, and corporate credit facilities suited to your goals.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-gradient-to-r from-[#C7993E] to-[#A67823] hover:from-[#F8E298] hover:to-[#C7993E] text-[#1a1408] font-bold px-8 py-6 rounded-lg transition-colors border-none shadow-[0_10px_30px_rgba(199,153,62,0.3)]" asChild>
                <Link to="/register">Open Relationship Account</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-border dark:border-yellow-700/40 hover:bg-muted dark:hover:bg-yellow-900/20 text-foreground dark:text-yellow-100 font-medium px-8 py-6 rounded-lg transition-colors bg-background/50 dark:bg-transparent backdrop-blur-sm" asChild>
                <Link to="/contact">Speak to an Advisor</Link>
              </Button>
            </div>
          </RevealOnScroll>
        </div>
      </section>

    </div>
  );
};

export default Index;
