import { useState } from "react";
import { Banknote, ShieldCheck, Zap, CreditCard, CheckCircle, ChevronDown, Activity, Globe, Landmark, ArrowRight, Wallet, Lock, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/PageHero";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@/components/public/Motion";
import { SectionHeader } from "@/components/public/SectionHeader";
import heroChecking from "@/assets/hero-checking.png";

const checkingProducts = [
  {
    name: "Standard Checking",
    monthlyFee: "$0",
    minBalance: "$0",
    description: "A secure, liquid account for everyday capital access with zero monthly maintenance fees and immediate digital routing capabilities.",
    features: [
      "No monthly maintenance fee",
      "Free Visa debit card",
      "Digital banking and mobile check deposit",
      "Free direct deposits",
      "Access to 40,000+ fee-free ATMs",
    ],
    highlighted: false,
    icon: Wallet
  },
  {
    name: "Premier Checking",
    monthlyFee: "$15",
    minBalance: "$5,000",
    description: "Enhanced liquidity management with worldwide ATM fee reimbursements and premium interest on uninvested capital.",
    features: [
      "Waived fee with $5,000 min. balance",
      "0.15% APY on balances over $10,000",
      "Free domestic wire transfers (2/month)",
      "ATM fee refunds nationwide",
      "Free cashier's checks",
    ],
    highlighted: true,
    icon: ShieldCheck
  },
  {
    name: "Corporate Checking",
    monthlyFee: "$45",
    minBalance: "$25,000",
    description: "A commercial treasury account structured for high-volume transactions, API integrations, and corporate payroll disbursement.",
    features: [
      "Waived fee with $25,000 min. balance",
      "Up to 500 free transactions per month",
      "Integrated payroll API routing",
      "Dedicated relationship manager",
      "Zero per-check deposit fees",
    ],
    highlighted: false,
    icon: Landmark
  },
];

const scenarios = [
  {
    icon: Globe,
    title: "International Supply Chain Transfers",
    description: "For clients managing global supply chains, Corporate Checking provides direct access to SWIFT and SEPA networks. Execute high-volume international wire transfers with transparent foreign exchange rates, minimizing intermediary bank fees and settlement delays."
  },
  {
    icon: Activity,
    title: "High-Volume Payroll Disbursement",
    description: "Connect your company's ERP or accounting software directly to your Corporate Checking account via secure API. Automate direct deposit routing for thousands of employees simultaneously without manual file uploads, ensuring exact payroll timing."
  },
  {
    icon: Lock,
    title: "Fiduciary Escrow and Trust Accounts",
    description: "Premier Checking serves as an ideal liquid holding vehicle for legal trusts and real estate escrow. With completely transparent ledger reporting and multi-party approval workflows, asset managers can execute fiduciary duties with absolute accountability."
  }
];

const faqs = [
  { q: "What is the daily transaction limit on Standard Checking?", a: "Standard Checking accounts have a daily debit card purchase limit of $5,000 and an ATM withdrawal limit of $1,000. These limits can be adjusted temporarily via the secure digital banking portal or permanently by contacting your account coordinator." },
  { q: "How are wire transfers processed and what are the cut-off times?", a: "Domestic wire transfers initiated before 4:00 PM EST are processed same-day. International wires initiated before 3:00 PM EST are dispatched same-day, with final settlement depending on the receiving institution (typically 1-3 business days)." },
  { q: "Are there any hidden maintenance fees?", a: "No. Standard Checking has no monthly maintenance fee regardless of balance. Premier and Corporate checking fees are explicitly stated and automatically waived if the minimum daily balance requirement is met across the statement cycle." },
  { q: "How does the ATM fee reimbursement work for Premier Checking?", a: "If you use an out-of-network ATM, the third-party operator may charge a fee. TrustBank will automatically reimburse these surcharges directly to your Premier Checking account at the end of the statement cycle, up to $25 per month." },
  { q: "Can I link my Checking account to external investment platforms?", a: "Yes. All TrustBank checking accounts support standard ACH routing. You can link your account to self-directed brokerages, crypto exchanges, or external treasury accounts using your routing transit and account numbers." },
  { q: "What happens if an account is overdrawn?", a: "TrustBank declines transactions that would overdraw a Standard Checking account, avoiding overdraft fees entirely. Premier and Corporate accounts offer optional Overdraft Protection, automatically transferring funds from linked savings or credit lines." },
  { q: "Is the Visa debit card contact-less and mobile wallet compatible?", a: "Yes. All debit cards issued feature NFC technology for secure tap-to-pay and can be immediately provisioned to Apple Pay, Google Wallet, and Samsung Pay." },
];

const CheckingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <PageHero
        title="Institutional Checking & Liquidity Management"
        description="Secure your capital in fully liquid, transparent accounts. Execute wire transfers, automate payroll, and manage daily expenses with premium banking experiences."
        image={heroChecking}
        primaryCtaText="Open Account"
        primaryCtaLink="/register"
        secondaryCtaText="Compare Tiers"
        secondaryCtaLink="#products"
        stats={[
          { value: "0", label: "Hidden Fees" },
          { value: "24/7", label: "API Ledger Access" },
          { value: "$250k", label: "FDIC Insured" },
          { value: "Same-Day", label: "Wire Settlement" }
        ]}
      />

      {/* Account Tiers */}
      <section className="py-12 sm:py-20 lg:py-28 bg-background relative" id="products">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            eyebrow="Account Tiers"
            title="Premium Checking Portfolios"
            description="Select the liquidity structure that aligns with your transaction volume and capital management requirements."
          />

          <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12 max-w-7xl mx-auto">
            {checkingProducts.map((product, idx) => (
              <StaggerItem key={product.name}>
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
                      <span className="bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-bold tracking-[0.15em] uppercase px-3.5 py-1 rounded-full shadow-lg">
                        Standard Recommendation
                      </span>
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className={`h-11 w-11 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-5 sm:mb-8 transition-transform group-hover:scale-105 duration-300 ${
                      product.highlighted ? "bg-white/10 text-white" : "bg-primary/5 text-primary"
                    }`}>
                      <product.icon className="h-5 w-5 sm:h-7 sm:w-7" />
                    </div>

                    <h3
                      className={`text-xl sm:text-2xl font-poppins font-bold mb-3 ${
                        product.highlighted ? "text-white" : "text-foreground"
                      }`}
                    >
                      {product.name}
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${
                      product.highlighted ? "text-white/70" : "text-muted-foreground"
                    }`}>
                      {product.description}
                    </p>

                    <div className="mb-4">
                      <span
                        className={`text-4xl sm:text-5xl font-poppins font-bold tracking-tight ${
                          product.highlighted ? "text-white" : "text-foreground"
                        }`}
                      >
                        {product.monthlyFee}
                      </span>
                      <span
                        className={`text-xs sm:text-sm ml-2 font-medium ${
                          product.highlighted
                            ? "text-white/60"
                            : "text-muted-foreground"
                        }`}
                      >
                        /month
                      </span>
                    </div>
                    
                    <p
                      className={`text-[10px] sm:text-xs mb-6 uppercase tracking-widest font-semibold ${
                        product.highlighted
                          ? "text-primary-foreground/90"
                          : "text-primary"
                      }`}
                    >
                      Minimum balance: {product.minBalance}
                    </p>
                    
                    <ul className="space-y-3.5 mb-8">
                      {product.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-xs sm:text-sm">
                          <CheckCircle
                            className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 ${
                              product.highlighted
                                ? "text-primary"
                                : "text-primary"
                            }`}
                          />
                          <span className={`leading-relaxed ${product.highlighted ? "text-white/90" : "text-foreground/90"}`}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    variant={product.highlighted ? "default" : "outline"}
                    size="lg"
                    className={`w-full mt-auto h-11 sm:h-12 text-xs sm:text-sm tracking-wide font-semibold rounded-xl relative z-10 transition-all ${
                      product.highlighted ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "hover:bg-primary/5 hover:text-primary hover:border-primary/50"
                    }`}
                    asChild
                  >
                    <Link to="/register">Initiate Account Opening</Link>
                  </Button>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Deployment Scenarios */}
      <section className="py-12 sm:py-20 lg:py-28 bg-muted/30 border-y border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Deployment Scenarios"
            title="Capital Routing Architecture"
            description="How corporate directors and private clients deploy TrustBank checking structures for complex asset management."
          />
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12 max-w-7xl mx-auto">
            {scenarios.map((scenario, idx) => (
              <StaggerItem key={scenario.title}>
                <div className="bg-background p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-border shadow-sm h-full flex flex-col hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
                  <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-primary/5 flex items-center justify-center mb-5 sm:mb-8 group-hover:scale-105 group-hover:bg-primary/10 transition-all duration-300">
                    <scenario.icon className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-lg font-poppins font-bold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">{scenario.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
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
            description="Detailed specifications regarding checking account limits, wire transfer processing, and platform integrations."
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
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=2000')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-poppins font-bold tracking-tight mb-6">Elevate Your Liquidity Management</h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 font-sans mb-10 leading-relaxed">
            Transition your corporate or personal checking to TrustBank today to improve your financial management.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-14 px-8 text-base font-semibold rounded-xl" asChild>
              <Link to="/register">Open an Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-14 px-8 text-base font-semibold rounded-xl bg-transparent" asChild>
              <Link to="/contact">Speak to an Advisor</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Disclosure Section */}
      <section className="py-12 bg-card border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <p className="text-xs leading-relaxed text-muted-foreground max-w-5xl mx-auto text-justify font-sans">
            Important Disclosures: Checking accounts are subject to rigorous KYC/AML verification protocols before activation. Overdraft protection features require active enrollment and separate credit facility approval. Deposits are FDIC-insured up to the maximum allowable limit of $250,000 per depositor per ownership category. TrustBank does not charge fees for ATM usage at network terminals, but out-of-network third-party operators may assess surcharges. Annual Percentage Yield (APY) is accurate as of the last update and may change at any time without notice. Minimum balances to waive fees are calculated based on the average daily ledger balance across the monthly statement cycle.
          </p>
        </div>
      </section>
    </>
  );
};

export default CheckingPage;
