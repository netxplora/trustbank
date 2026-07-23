import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { TrendingUp, PieChart, Shield, Landmark, BarChart3, Briefcase, Key, CheckCircle, ChevronDown, Activity, Users } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@trustbank/shared-ui/components/Motion";
import { SectionHeader } from "@/components/public/SectionHeader";
import heroServices from "@/assets/hero-services.jpg";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";

const advisoryTiers = [
  {
    name: "Core Advisory",
    minimum: "$250,000",
    fee: "0.85%",
    description: "Algorithmic portfolio management paired with quarterly reviews from a dedicated financial advisor. Ideal for emerging high-net-worth individuals.",
    features: [
      "Automated tax-loss harvesting",
      "Quarterly rebalancing",
      "Diversified ETF and mutual fund portfolios",
      "Direct advisor access",
    ],
    highlighted: false,
  },
  {
    name: "Private Wealth Management",
    minimum: "$1,000,000",
    fee: "0.65%",
    description: "Bespoke asset allocation strategies incorporating individual equities, fixed income ladders, and alternative investments.",
    features: [
      "Dedicated senior wealth manager",
      "Custom equity/fixed-income portfolios",
      "Alternative investment access (Private Equity)",
      "Comprehensive tax strategy coordination",
    ],
    highlighted: true,
  },
  {
    name: "Family Office Services",
    minimum: "$10,000,000",
    fee: "0.45%",
    description: "Complete generational wealth structuring including trust administration, estate planning, and philanthropic execution.",
    features: [
      "Multi-generational trust structures",
      "Direct real estate and private credit access",
      "Consolidated multi-custodian reporting",
      "Philanthropic foundation management",
    ],
    highlighted: false,
  },
];

const investmentHubs = [
  {
    icon: PieChart,
    title: "Asset Allocation Strategy",
    description: "Understand the core principles of diversification across equities, fixed income, cash, and alternative asset classes to optimize the risk-return profile."
  },
  {
    icon: Activity,
    title: "Macroeconomic Market Trends",
    description: "Access our institutional research desk's insights on inflation, federal interest rate trajectories, and global equity valuations."
  },
  {
    icon: Landmark,
    title: "Retirement & Estate Planning",
    description: "Navigate complex tax codes, required minimum distributions (RMDs), and trust architectures to ensure seamless wealth transfer."
  }
];

const ServicesPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [faqs, setFaqs] = useState<any[]>([]);

  useEffect(() => {
    const fetchFaqs = async () => {
      const { data } = await (supabase as any).from("cms_faqs").select("*").order("display_order", { ascending: true });
      if (data) setFaqs(data);
    };
    fetchFaqs();
  }, []);

  return (
    <>
      <PageHero 
        title="Wealth Management & Private Advisory" 
        description="Fiduciary asset management, strategic tax structuring, and legacy planning. Partner with our senior wealth managers to protect and compound your generational wealth." 
        image={heroServices} 
        primaryCtaText="Schedule Discovery Call"
        primaryCtaLink="/contact"
        secondaryCtaText="Explore Advisory Tiers"
        secondaryCtaLink="#advisory"
        stats={[
          { value: "Fiduciary", label: "Legal Standard" },
          { value: "SIPC", label: "Asset Protection" },
          { value: "Tax-Optimized", label: "Portfolio Design" },
          { value: "Bespoke", label: "Strategic Planning" }
        ]}
      />

      <section className="py-24 bg-background" id="advisory">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader 
            eyebrow="Advisory Services"
            title="Wealth Management Tiers"
            description="Transparent, fee-only portfolio management scaled to the complexity of your financial life."
          />

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {advisoryTiers.map((tier, idx) => (
              <StaggerItem key={tier.name}>
                <div className={`rounded-2xl border p-8 flex flex-col h-full hover-lift transition-all shadow-elevated ${tier.highlighted ? "bg-primary text-primary-foreground border-primary scale-[1.02] relative" : "bg-card border-muted/50"}`}>
                  {tier.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-primary-foreground text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full shadow-sm">
                      Recommended
                    </span>
                  )}
                  <h3 className={`text-xl font-poppins font-bold mb-3 ${tier.highlighted ? "" : "text-foreground"}`}>{tier.name}</h3>
                  <p className={`text-xs leading-relaxed mb-6 ${tier.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {tier.description}
                  </p>
                  
                  <div className="mb-4 mt-auto">
                    <span className={`text-5xl font-poppins font-bold ${tier.highlighted ? "text-foreground" : "text-primary"}`}>{tier.fee}</span>
                    <span className={`text-xs ml-1.5 font-bold uppercase tracking-widest ${tier.highlighted ? "text-warning" : "text-warning"}`}>AUM / Year</span>
                  </div>
                  
                  <p className={`text-[11px] mb-8 uppercase tracking-widest font-semibold ${tier.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    Minimum investment: {tier.minimum}
                  </p>
                  
                  <ul className="space-y-4 mb-8">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <CheckCircle className={`h-4 w-4 shrink-0 mt-0.5 ${tier.highlighted ? "text-secondary" : "text-secondary"}`} />
                        <span className={`text-xs leading-relaxed ${tier.highlighted ? "text-primary-foreground/90" : "text-foreground/90"}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button variant={tier.highlighted ? "secondary" : "default"} className="w-full mt-auto" asChild>
                    <Link to="/contact">Request Consultation</Link>
                  </Button>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="py-24 bg-surface border-y border-muted/50">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader 
            eyebrow="Educational Hub"
            title="Investment Knowledge Center"
            description="Deepen your understanding of capital markets, fiduciary principles, and macro-level asset deployment."
          />
          <StaggerContainer className="grid md:grid-cols-3 gap-8 mt-12">
            {investmentHubs.map((hub, idx) => (
              <StaggerItem key={hub.title}>
                <div className="flex flex-col items-start bg-card p-8 rounded-2xl border border-muted/50 shadow-sm mx-auto h-full justify-start hover:border-slate-300 transition-colors">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <hub.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-poppins font-bold text-foreground mb-3 text-base">{hub.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">{hub.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="py-24 bg-background border-b border-muted/50">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader 
            eyebrow="Our Approach"
            title="Comprehensive Wealth Methodology"
            description="Our disciplined, multi-phase methodology ensures your capital is deployed effectively, protected rigorously, and structured for intergenerational transfer."
          />
          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 font-sans">
              {[
                { step: "01", title: "Discovery & Audit", desc: "A forensic analysis of your current assets, liabilities, tax exposure, and liquidity requirements." },
                { step: "02", title: "Strategic Allocation", desc: "Constructing a bespoke portfolio architecture balancing institutional equities, fixed income, and alternatives." },
                { step: "03", title: "Active Mitigation", desc: "Continuous algorithmic monitoring for tax-loss harvesting opportunities and risk exposure drift." },
                { step: "04", title: "Generational Transfer", desc: "Integrating trust structures and philanthropic vehicles to ensure your legacy remains intact." }
              ].map((phase) => (
                <div key={phase.step} className="bg-surface p-8 rounded-2xl border border-muted/50 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
                  <div className="text-6xl font-poppins font-black text-muted/20 absolute -top-4 -right-4 transition-transform group-hover:scale-110">{phase.step}</div>
                  <h4 className="font-poppins font-bold text-lg text-foreground mb-3 mt-4 relative z-10">{phase.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed relative z-10">{phase.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Extensive FAQ Section */}
      <section className="py-24 bg-background">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-4xl">
          <SectionHeader
            eyebrow="Advisory Desk Knowledge Base"
            title="Wealth Management Frequently Asked Questions"
            description="Detailed specifications regarding SIPC insurance, fiduciary standards, and portfolio rebalancing protocols."
          />

          <StaggerContainer className="space-y-4 mt-12">
            {faqs.map((faq, i) => (
              <StaggerItem key={faq.id || i}>
                <div className="border border-muted/50 rounded-xl overflow-hidden bg-card hover:border-primary/25 transition-all shadow-sm">
                  <button
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-semibold text-foreground text-sm pr-8">{faq.question}</span>
                    <div className={`h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180 bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>
                  
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openFaq === i ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-6 pb-6 pt-0 border-t border-muted/20 mt-2">
                      <p className="text-xs text-muted-foreground leading-relaxed pt-4">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Disclosure Section */}
      <section className="py-12 bg-surface border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] leading-relaxed text-muted-foreground max-w-5xl mx-auto text-justify font-sans">
            Important Wealth Management Disclosures: Investment advisory services are offered through TrustBank Wealth Management LLC, an SEC-registered investment adviser. Brokerage services are offered through TrustBank Securities Inc., Member FINRA/SIPC. TrustBank Securities Inc. and TrustBank Wealth Management LLC are affiliated entities and wholly owned subsidiaries of TrustBank Corporation. Investments are NOT FDIC INSURED, NOT BANK GUARANTEED, and MAY LOSE VALUE. Past performance is no guarantee of future results. Asset allocation and diversification do not assure or guarantee better performance and cannot eliminate the risk of investment losses. The information provided does not constitute tax, legal, or accounting advice. Please consult your own independent tax or legal advisor regarding your specific situation before making any financial decisions.
          </p>
        </div>
      </section>
    </>
  );
};

export default ServicesPage;
