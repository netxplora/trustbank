import { useState } from "react";
import { PiggyBank, TrendingUp, Shield, Clock, CheckCircle, ChevronDown, Activity, Globe, Landmark, ArrowRight, ShieldCheck, PieChart, LineChart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { PageHero } from "@/components/public/PageHero";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@trustbank/shared-ui/components/Motion";
import { SectionHeader } from "@/components/public/SectionHeader";
import heroSavings from "@/assets/hero-savings.jpg";

const savingsProducts = [
  {
    name: "Core Yield Savings",
    rate: "4.25%",
    minBalance: "$1,000",
    description: "A secure, liquid account designed to protect capital against inflation while maintaining immediate accessibility for unexpected expenses.",
    features: [
      "No monthly maintenance fee",
      "Immediate digital transfers",
      "Interest compounded daily",
      "No penalty for withdrawals",
      "Direct deposit optimization",
    ],
    highlighted: false,
    icon: PiggyBank
  },
  {
    name: "Premier High-Yield",
    rate: "4.85%",
    minBalance: "$10,000",
    description: "Our flagship savings vehicle offering market-leading APY for clients maintaining higher balances, paired with priority advisory access.",
    features: [
      "Waived fee with $10,000 min. balance",
      "Premium 4.85% APY yield tier",
      "Priority customer support routing",
      "Linked to Premier Checking",
      "Monthly yield performance reports",
    ],
    highlighted: true,
    icon: LineChart
  },
  {
    name: "Corporate Treasury Reserve",
    rate: "5.25%",
    minBalance: "$100,000",
    description: "A commercial-grade deposit structure for enterprise cash management, maximizing return on idle working capital.",
    features: [
      "Institutional 5.25% APY yield",
      "Automated sweep account integration",
      "Dedicated treasury manager",
      "Custom maturity ladders",
      "API-driven ledger access",
    ],
    highlighted: false,
    icon: Landmark
  },
];

const scenarios = [
  {
    icon: PieChart,
    title: "Capital Preservation Strategy",
    description: "In volatile macroeconomic environments, capital preservation is paramount. TrustBank's savings vehicles are strictly collateralized and FDIC-insured, shielding your core assets from equity market drawdowns while delivering stable, compounding yield."
  },
  {
    icon: Activity,
    title: "Automated Corporate Sweeps",
    description: "For corporate clients, idle cash in operating accounts represents lost yield. Implement automated treasury sweeps that transfer end-of-day balances from your Corporate Checking into the Treasury Reserve, ensuring every dollar works overnight."
  },
  {
    icon: Shield,
    title: "Generational Wealth Accumulation",
    description: "Align your Premier High-Yield account with TrustBank's private advisory desk. Structure your savings as the liquid foundation of a broader trust architecture, ensuring seamless distribution and capital availability for legacy planning."
  }
];

const faqs = [
  { q: "How is interest calculated and when is it credited?", a: "Interest is calculated using the daily balance method, which applies a daily periodic rate to the principal in the account each day. The accrued interest is credited to your account on the last business day of the monthly statement cycle." },
  { q: "Are there limits on the number of withdrawals I can make?", a: "Under Federal Reserve Regulation D, certain types of withdrawals and transfers from savings accounts are limited to six per statement cycle. However, ATM withdrawals and in-person transactions are unlimited. Exceeding the limit may result in fees or account reclassification." },
  { q: "Can I lock my rate with a Fixed Deposit instead?", a: "Yes. For clients seeking guaranteed returns immune to federal rate cuts, we offer Certificates of Deposit (CDs) with terms ranging from 30 days to 60 months. Contact your relationship manager for the latest fixed APY rates." },
  { q: "Is the 5.25% APY on the Treasury Reserve tiered?", a: "No, the 5.25% APY on the Corporate Treasury Reserve is a flat rate applied to the entire ledger balance, provided the account maintains the $100,000 minimum daily requirement." },
  { q: "How quickly can I access funds from a High-Yield account?", a: "Funds transferred internally to a linked TrustBank Checking account are available instantly, 24/7. External ACH transfers typically take 1-2 business days to clear, while domestic wire transfers are processed same-day if initiated before 4:00 PM EST." },
  { q: "What happens if my balance falls below the minimum requirement?", a: "If your daily balance drops below the minimum requirement for your specific tier, the account may be subject to a monthly maintenance fee for that statement cycle, and the APY may revert to the standard Core Yield rate." },
  { q: "Are joint savings accounts and trust structures supported?", a: "Absolutely. Premier and Treasury accounts can be structured as Joint Tenants with Right of Survivorship (JTWROS) or established directly under the Tax ID of a legal trust or corporate entity." },
];

const SavingsPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <PageHero 
        title="High-Yield Savings & Capital Preservation" 
        description="Shield your capital against inflation and market volatility. Secure market-leading yields backed by institutional-grade liquidity and strict fiduciary oversight." 
        image={heroSavings}
        primaryCtaText="Establish Yield Account"
        primaryCtaLink="/register"
        secondaryCtaText="Compare Portfolios"
        secondaryCtaLink="#portfolios"
        stats={[
          { value: "Up to 5.25%", label: "Annual Percentage Yield" },
          { value: "Daily", label: "Interest Compounding" },
          { value: "$250k", label: "FDIC Protection" },
          { value: "Zero", label: "Incoming Wire Fees" }
        ]}
      />

      {/* Account Portfolios */}
      <section className="py-32 bg-background relative" id="portfolios">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-secondary/5 dark:bg-secondary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader 
            eyebrow="Yield Structures"
            title="Premium Savings Portfolios"
            description="Select the deposit architecture that aligns with your capital horizons and liquidity requirements."
          />
          
          <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16 max-w-7xl mx-auto">
            {savingsProducts.map((product, idx) => (
              <StaggerItem key={product.name}>
                <div
                  className={`rounded-3xl border p-10 flex flex-col h-full transition-all duration-500 hover:-translate-y-2 group ${
                    product.highlighted
                      ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-800 dark:border-slate-700 shadow-2xl relative overflow-hidden"
                      : "bg-card border-border hover:shadow-xl hover:border-secondary/20 shadow-sm"
                  }`}
                >
                  {/* Glowing effect for the highlighted card */}
                  {product.highlighted && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-secondary/30 transition-colors" />
                  )}

                  {product.highlighted && (
                    <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2">
                      <span className="bg-secondary text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full shadow-lg">
                        Wealth Advisory Recommendation
                      </span>
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 duration-500 ${
                      product.highlighted ? "bg-white/10 text-white" : "bg-secondary/10 text-secondary"
                    }`}>
                      <product.icon className="h-7 w-7" />
                    </div>

                    <h3
                      className={`text-2xl font-poppins font-bold mb-4 ${
                        product.highlighted ? "text-white" : "text-foreground"
                      }`}
                    >
                      {product.name}
                    </h3>
                    <p className={`text-sm leading-relaxed mb-8 ${
                      product.highlighted ? "text-white/70" : "text-muted-foreground"
                    }`}>
                      {product.description}
                    </p>

                    <div className="mb-6 flex items-baseline">
                      <span
                        className={`text-6xl font-poppins font-bold tracking-tighter ${
                          product.highlighted ? "text-white" : "text-secondary"
                        }`}
                      >
                        {product.rate}
                      </span>
                      <span
                        className={`text-lg ml-2 font-bold tracking-widest ${
                          product.highlighted
                            ? "text-secondary"
                            : "text-secondary/80"
                        }`}
                      >
                        APY
                      </span>
                    </div>
                    
                    <p
                      className={`text-xs mb-10 uppercase tracking-widest font-semibold ${
                        product.highlighted
                          ? "text-white/50"
                          : "text-muted-foreground"
                      }`}
                    >
                      Minimum funding: {product.minBalance}
                    </p>
                    
                    <ul className="space-y-5 mb-10">
                      {product.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm">
                          <CheckCircle
                            className={`h-5 w-5 shrink-0 ${
                              product.highlighted
                                ? "text-secondary"
                                : "text-secondary"
                            }`}
                          />
                          <span className={`leading-relaxed ${product.highlighted ? "text-white/90" : "text-foreground/90"}`}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    variant={product.highlighted ? "secondary" : "outline"}
                    size="lg"
                    className={`w-full mt-auto h-14 text-sm tracking-wide font-semibold rounded-xl relative z-10 transition-all ${
                      product.highlighted ? "bg-secondary hover:bg-secondary/90 text-primary-foreground" : "hover:bg-secondary/5 hover:text-secondary hover:border-secondary/50"
                    }`}
                    asChild
                  >
                    <Link to="/register">Initiate Deposit</Link>
                  </Button>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Asset Management Scenarios */}
      <section className="py-32 bg-muted/30 border-y border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Asset Management"
            title="Strategic Capital Deployment"
            description="How corporate directors and high-net-worth individuals leverage our deposit structures."
          />
          <StaggerContainer className="grid md:grid-cols-3 gap-8 mt-16 max-w-7xl mx-auto">
            {scenarios.map((scenario, idx) => (
              <StaggerItem key={scenario.title}>
                <div className="bg-background p-10 rounded-3xl border border-border shadow-sm h-full flex flex-col hover:shadow-xl hover:border-secondary/30 transition-all duration-500 group">
                  <div className="h-14 w-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-secondary/20 transition-all duration-500">
                    <scenario.icon className="h-7 w-7 text-secondary" />
                  </div>
                  <h3 className="text-lg font-poppins font-bold text-foreground mb-4 leading-snug group-hover:text-secondary transition-colors">{scenario.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {scenario.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Extensive FAQ Section */}
      <section className="py-32 bg-background">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-4xl">
          <SectionHeader
            eyebrow="Knowledge Base"
            title="Operational Specifications"
            description="Detailed specifications regarding interest calculations, withdrawal limits, and treasury features."
          />

          <StaggerContainer className="space-y-6 mt-16">
            {faqs.map(({ q, a }, i) => (
              <StaggerItem key={i}>
                <div className="border border-border rounded-2xl overflow-hidden bg-card hover:border-secondary/30 transition-all duration-300 shadow-sm hover:shadow-md">
                  <button
                    className="w-full px-8 py-6 flex items-center justify-between text-left focus:outline-none"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-semibold text-foreground text-base pr-8 font-poppins tracking-tight">{q}</span>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${openFaq === i ? "bg-secondary text-primary-foreground rotate-180 shadow-md" : "bg-secondary/10 text-secondary hover:bg-secondary/20"}`}>
                      <ChevronDown className="h-5 w-5" />
                    </div>
                  </button>
                  
                  <div 
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      openFaq === i ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-8 pb-8 pt-0 mt-2">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {a}
                      </p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="py-24 bg-secondary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=2000')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-poppins font-bold tracking-tight mb-6">Maximize Your Capital Yield</h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 font-sans mb-10 leading-relaxed">
            Begin earning compounding interest today with TrustBank's secure preservation vehicles.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-white text-secondary hover:bg-white/90 h-14 px-8 text-base font-semibold rounded-xl" asChild>
              <Link to="/register">Open a Yield Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-14 px-8 text-base font-semibold rounded-xl bg-transparent" asChild>
              <Link to="/contact">Discuss Treasury Options</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Disclosure Section */}
      <section className="py-12 bg-card border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <p className="text-xs leading-relaxed text-muted-foreground max-w-5xl mx-auto text-justify font-sans">
            Important Disclosures: Annual Percentage Yield (APY) is accurate as of the current date and is subject to change without notice at the discretion of the Asset Liability Committee. Minimum balances must be maintained across the entire monthly statement cycle to avoid monthly service fees or to qualify for the stated premium APY tiers. Interest on savings accounts is calculated using the daily balance method, compounded daily, and credited monthly. Fees may reduce earnings on the account. Withdrawals may be subject to federal regulatory limits; excessive transactions may result in account closure or reclassification to a checking product. TrustBank is a Member FDIC. Deposits are insured up to the maximum allowable limit of $250,000 per depositor per ownership category.
          </p>
        </div>
      </section>
    </>
  );
};

export default SavingsPage;
