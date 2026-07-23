import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, User, CheckCircle, Clock, Shield, Percent, Briefcase, Landmark, Key, ChevronDown, Building, ShieldCheck, Gem } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@/components/public/Motion";
import { SectionHeader } from "@/components/public/SectionHeader";
import heroLoans from "@/assets/hero-loans.jpg";

const loanTypes = [
  { 
    icon: Building, 
    title: "Commercial Real Estate", 
    description: "Scale your enterprise with structured commercial lending from $1M to $50M+. Secure non-recourse and recourse financing for acquisition, development, and refinancing of multi-family, retail, and industrial properties.", 
    features: ["Customized amortization schedules up to 25 years", "Revolving credit facilities", "Fixed and floating rate options", "Competitive prime-based rates"],
    highlighted: false
  },
  { 
    icon: Gem, 
    title: "Private Wealth Lending", 
    description: "Leverage your portfolio for liquidity without liquidating assets. Utilize your securities, trusts, or high-value physical assets as collateral to generate immediate capital while maintaining market exposure.", 
    features: ["Securities-backed lines of credit", "Jumbo mortgages up to $20M", "Bespoke repayment structuring", "Priority private advisory"],
    highlighted: true
  },
  { 
    icon: Briefcase, 
    title: "Corporate Equipment Finance", 
    description: "Maintain operational liquidity while acquiring mission-critical technology, manufacturing equipment, or commercial fleets. TrustBank offers direct leasing and term loans collateralized by the underlying asset.", 
    features: ["Up to 100% financing including soft costs", "Master lease agreements", "Tax-optimized leasing structures", "Rapid capital deployment"],
    highlighted: false
  },
];

const scenarios = [
  {
    icon: Landmark,
    title: "Strategic Corporate Acquisition",
    description: "When identifying a competitor for acquisition, speed and certainty of execution are critical. TrustBank's corporate lending desk can structure a senior term loan combined with a revolving credit facility, providing the upfront capital for the buyout and the ongoing liquidity to absorb operational transitions."
  },
  {
    icon: Key,
    title: "Securities-Backed Capital Injections",
    description: "A private wealth client requiring short-term capital for a real estate opportunity can utilize a Securities-Backed Line of Credit (SBLOC). By borrowing against their diversified equity portfolio, they access funds within 48 hours without triggering capital gains taxes or disrupting their long-term investment strategy."
  },
  {
    icon: ShieldCheck,
    title: "Real Estate Development Refinancing",
    description: "Upon completion of a commercial development project, developers transition from high-interest construction loans to permanent financing. TrustBank offers non-recourse, fixed-rate term loans that stabilize the asset's debt profile and allow developers to extract equity for future projects."
  }
];

const faqs = [
  { q: "What is the minimum loan amount for a Commercial Real Estate loan?", a: "TrustBank originates commercial real estate loans starting at a minimum of $1,000,000. For smaller requirements, we offer standard business term loans and lines of credit." },
  { q: "Do you offer non-recourse financing?", a: "Yes, non-recourse financing is available for stabilized, income-producing commercial real estate properties that meet specific Loan-to-Value (LTV) and Debt Service Coverage Ratio (DSCR) thresholds." },
  { q: "What is a Securities-Backed Line of Credit (SBLOC)?", a: "An SBLOC is a revolving credit facility collateralized by your eligible investment portfolio. It allows you to borrow against your securities without selling them, avoiding capital gains taxes while maintaining market participation." },
  { q: "What assets are eligible as collateral for an SBLOC?", a: "Eligible collateral generally includes marketable equities, mutual funds, ETFs, and investment-grade bonds held within a TrustBank or affiliated brokerage account. Margin requirements vary by asset class volatility." },
  { q: "How long does the commercial underwriting process take?", a: "While initial term sheets can be issued within 48 hours, full commercial underwriting, including environmental assessments and appraisals, typically takes 30 to 45 days to reach closing and disbursement." },
  { q: "Are there prepayment penalties on your loans?", a: "Private wealth lines of credit generally feature no prepayment penalties. Commercial term loans and fixed-rate real estate mortgages may include yield maintenance or step-down prepayment premiums, which are explicitly detailed in the term sheet." },
  { q: "What is the maximum Loan-to-Value (LTV) for Jumbo Mortgages?", a: "For primary residences, TrustBank offers Jumbo Mortgages with an LTV of up to 80% for loans up to $3M, and adjusted LTV limits for larger amounts or secondary residences, subject to comprehensive credit review." },
  { q: "Do you offer equipment leasing or just equipment loans?", a: "We offer both. Depending on your tax strategy and cash flow needs, we can structure the transaction as a capital lease, an operating lease (Fair Market Value), or a standard equipment term loan." },
  { q: "What documents are required for a corporate credit application?", a: "Standard requirements include three years of audited financial statements, year-to-date interim financials, a detailed debt schedule, corporate tax returns, and organizational entity documents. Additional documentation may be required based on the industry." },
];

const LoansPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <PageHero 
        title="Strategic Lending & Structured Credit" 
        description="Access institutional capital tailored for corporate acquisitions, real estate portfolios, and private wealth demands. Partner with our senior underwriters for bespoke debt structuring." 
        image={heroLoans} 
        primaryCtaText="Consult a Lending Officer"
        primaryCtaLink="/contact"
        secondaryCtaText="Review Credit Portfolios"
        secondaryCtaLink="#solutions"
        stats={[
          { value: "$1M - $50M+", label: "Capital Range" },
          { value: "Flexible", label: "Amortization" },
          { value: "SOFR/Prime", label: "Indexed Rates" },
          { value: "Bespoke", label: "Covenants" }
        ]}
      />

      {/* Credit Portfolios */}
      <section className="py-12 sm:py-20 lg:py-28 bg-background relative" id="solutions">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-[700px] h-[500px] bg-primary/5 dark:bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            eyebrow="Credit Portfolios"
            title="Institutional Loan Architectures"
            description="Our credit facilities are strictly underwritten, collateralized, and designed to support sustainable corporate growth and wealth preservation."
          />

          <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12 max-w-7xl mx-auto">
            {loanTypes.map((product, idx) => (
              <StaggerItem key={product.title}>
                <div
                  className={`rounded-2xl sm:rounded-3xl border p-5 sm:p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 group ${
                    product.highlighted
                      ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-800 dark:border-slate-700 shadow-xl relative overflow-hidden"
                      : "bg-card border-border hover:shadow-lg hover:border-primary/20 shadow-sm"
                  }`}
                >
                  {/* Glowing effect for the highlighted card */}
                  {product.highlighted && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-colors" />
                  )}

                  {product.highlighted && (
                    <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2">
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full shadow-lg">
                        Advisory Recommendation
                      </span>
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col h-full">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 duration-500 ${
                      product.highlighted ? "bg-white/10 text-white" : "bg-primary/5 text-primary"
                    }`}>
                      <product.icon className="h-7 w-7" />
                    </div>

                    <h3
                      className={`text-2xl font-poppins font-bold mb-4 ${
                        product.highlighted ? "text-white" : "text-foreground"
                      }`}
                    >
                      {product.title}
                    </h3>
                    <p className={`text-sm leading-relaxed mb-10 ${
                      product.highlighted ? "text-white/70" : "text-muted-foreground"
                    }`}>
                      {product.description}
                    </p>
                    
                    <ul className="space-y-5 mb-10 mt-auto">
                      {product.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm">
                          <CheckCircle
                            className={`h-5 w-5 shrink-0 ${
                              product.highlighted
                                ? "text-primary"
                                : "text-primary"
                            }`}
                          />
                          <span className={`leading-relaxed ${product.highlighted ? "text-white/90" : "text-foreground/90"}`}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={product.highlighted ? "default" : "outline"}
                      size="lg"
                      className={`w-full h-14 text-sm tracking-wide font-semibold rounded-xl relative z-10 transition-all ${
                        product.highlighted ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "hover:bg-primary/5 hover:text-primary hover:border-primary/50"
                      }`}
                      asChild
                    >
                      <Link to="/contact">Initiate Credit Review</Link>
                    </Button>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Deployment Scenarios */}
      <section className="py-32 bg-muted/30 border-y border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Deployment Strategies"
            title="Strategic Debt Utilization"
            description="Examine how leading enterprises and private clients deploy TrustBank credit facilities for tactical advantage."
          />
          <StaggerContainer className="grid md:grid-cols-3 gap-8 mt-16 max-w-7xl mx-auto">
            {scenarios.map((scenario, idx) => (
              <StaggerItem key={scenario.title}>
                <div className="bg-background p-10 rounded-3xl border border-border shadow-sm h-full flex flex-col hover:shadow-xl hover:border-primary/30 transition-all duration-500 group">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
                    <scenario.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-poppins font-bold text-foreground mb-4 leading-snug group-hover:text-primary transition-colors">{scenario.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {scenario.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Underwriting Philosophy */}
      <section className="py-32 bg-background relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-muted/30 rounded-l-[100px] pointer-events-none" />
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-poppins font-bold tracking-tight mb-6">The Credit Evaluation Framework</h2>
            <p className="text-lg text-muted-foreground mb-16 leading-relaxed max-w-2xl mx-auto">Transparency in our lending process ensures exact alignment between our risk models and your capital requirements.</p>
            
            <StaggerContainer className="grid md:grid-cols-2 gap-12 text-left">
              <StaggerItem>
                <div className="bg-card p-10 rounded-3xl border border-border shadow-sm hover:shadow-lg transition-all h-full">
                  <div className="text-5xl font-poppins font-bold text-primary/20 mb-6">01</div>
                  <h3 className="text-xl font-bold font-poppins text-foreground mb-4">Holistic Risk Assessment</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Our credit committees utilize a comprehensive approach. We look beyond automated algorithmic scores, evaluating the quality of underlying assets, the durability of recurring revenue streams, and the overall strength of your corporate portfolio to determine precise Debt Service Coverage Ratios (DSCR).
                  </p>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="bg-card p-10 rounded-3xl border border-border shadow-sm hover:shadow-lg transition-all h-full">
                  <div className="text-5xl font-poppins font-bold text-secondary/20 mb-6">02</div>
                  <h3 className="text-xl font-bold font-poppins text-foreground mb-4">Fiduciary Structuring</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Debt must accelerate wealth generation, not hinder it. Our wealth management team offers continuous advisement alongside the lending process, integrating interest rate hedging strategies and optimizing your broader capital stack to protect against macroeconomic shifts.
                  </p>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* Extensive FAQ Section */}
      <section className="py-32 bg-muted/30 border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-4xl">
          <SectionHeader
            eyebrow="Credit Desk Knowledge Base"
            title="Lending Specifications"
            description="Comprehensive specifications regarding collateral requirements, amortization terms, and underwriting processes."
          />

          <StaggerContainer className="space-y-6 mt-16">
            {faqs.map(({ q, a }, i) => (
              <StaggerItem key={i}>
                <div className="border border-border rounded-2xl overflow-hidden bg-card hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md">
                  <button
                    className="w-full px-8 py-6 flex items-center justify-between text-left focus:outline-none"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-semibold text-foreground text-base pr-8 font-poppins tracking-tight">{q}</span>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${openFaq === i ? "bg-primary text-primary-foreground rotate-180 shadow-md" : "bg-primary/5 text-primary hover:bg-primary/10"}`}>
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
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=2000')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-poppins font-bold tracking-tight mb-6">Advance Your Corporate Architecture</h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 font-sans mb-10 leading-relaxed">
            Secure the capital necessary for your next strategic acquisition or development project.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-14 px-8 text-base font-semibold rounded-xl" asChild>
              <Link to="/contact">Speak to an Underwriter</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-14 px-8 text-base font-semibold rounded-xl bg-transparent" asChild>
              <Link to="/loans">Explore Loan Architectures</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Disclosure Section */}
      <section className="py-12 bg-card border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <p className="text-xs leading-relaxed text-muted-foreground max-w-5xl mx-auto text-justify font-sans">
            Important Lending Disclosures: All loan products, credit facilities, and lines of credit are subject to rigorous underwriting guidelines, collateral appraisal, and final credit committee approval. Repayment terms, Annual Percentage Rates (APRs), and origination fees vary based on the specific loan amount, the borrower's credit history, prevailing macroeconomic benchmarks (such as SOFR or Prime), and the quality of pledged collateral. Pre-approval estimates or preliminary term sheets do not constitute a formal legal commitment to lend. Securities-Backed Lines of Credit (SBLOC) involve specific risks; a decline in the market value of your pledged securities may require you to deposit additional funds or result in the forced liquidation of your assets without prior notice.
          </p>
        </div>
      </section>
    </>
  );
};

export default LoansPage;
