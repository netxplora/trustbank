import { useState } from "react";
import { ChevronDown, Search, ShieldAlert, Landmark, Building2, Briefcase } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@trustbank/shared-ui/components/Motion";
import { SectionHeader } from "@/components/public/SectionHeader";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import heroFaq from "@/assets/hero-faq.jpg";

type FaqCategory = "Account & Profile" | "Commercial & Lending" | "Security & Fraud" | "Wealth Management";

interface FAQ {
  q: string;
  a: string;
  category: FaqCategory;
}

const faqs: FAQ[] = [
  // Account & Profile
  { category: "Account & Profile", q: "How do I initiate a new institutional account opening?", a: "Institutional account onboarding requires strict KYC/AML compliance. Please contact our corporate advisory desk to begin the process. You will need to provide corporate formation documents, tax IDs, and ultimate beneficial ownership (UBO) records." },
  { category: "Account & Profile", q: "Can I manage multiple subsidiary entities from a single login?", a: "Yes. Our Unified Treasury Portal allows corporate directors to seamlessly toggle between multiple subsidiary entities, assuming the master profile has been granted authorized signatory access across all relevant tax IDs." },
  { category: "Account & Profile", q: "What is the process to update our corporate signers?", a: "To add or remove authorized signers, the primary administrator must submit a digitally signed Corporate Resolution form via the secure portal, followed by a mandatory verbal confirmation with our security desk." },
  { category: "Account & Profile", q: "How are monthly maintenance fees calculated?", a: "Maintenance fees are calculated based on your average daily ledger balance across the statement cycle. If your balance remains above the required tier minimum for the entire cycle, the fee is automatically waived." },
  { category: "Account & Profile", q: "How do I request a wire transfer limit increase?", a: "Permanent limit increases require credit committee approval. Temporary daily limit increases can be executed via the digital portal using your biometric passkey or YubiKey hardware token." },
  { category: "Account & Profile", q: "Are paper statements still available?", a: "While we strongly encourage utilizing our secure digital vault for statement archiving, paper statements can be mailed monthly upon specific request to your relationship manager. Additional fees may apply." },
  { category: "Account & Profile", q: "Can I link my TrustBank account to external brokerages?", a: "Yes. TrustBank supports standard ACH micro-deposit verification and Plaid integrations, allowing you to link your accounts to external brokerages and payment processors." },
  { category: "Account & Profile", q: "What is the cutoff time for same-day domestic wire transfers?", a: "Domestic wire transfers must be fully authorized by all required signatories before 4:00 PM EST to guarantee same-day settlement." },

  // Commercial & Lending
  { category: "Commercial & Lending", q: "What is the minimum requirement for a commercial real estate loan?", a: "TrustBank originates commercial real estate loans starting at $1,000,000. Properties must demonstrate a minimum Debt Service Coverage Ratio (DSCR) of 1.25x." },
  { category: "Commercial & Lending", q: "Do you offer non-recourse financing options?", a: "Yes. Non-recourse financing is available for stabilized, income-producing commercial assets, subject to lower Loan-to-Value (LTV) limits and strict underwriting review." },
  { category: "Commercial & Lending", q: "What is a Securities-Backed Line of Credit (SBLOC)?", a: "An SBLOC allows Private Wealth clients to borrow against their investment portfolio without liquidating assets, thereby accessing liquidity while avoiding immediate capital gains taxation." },
  { category: "Commercial & Lending", q: "Are interest rates fixed or floating?", a: "We offer both. Depending on your risk profile, loans can be structured with fixed rates, or variable rates pegged to the Secured Overnight Financing Rate (SOFR) or the Wall Street Journal Prime Rate." },
  { category: "Commercial & Lending", q: "Is there a prepayment penalty on commercial term loans?", a: "Commercial term loans typically carry a yield maintenance or step-down prepayment premium. These terms are explicitly detailed in your initial term sheet." },
  { category: "Commercial & Lending", q: "Do you finance specialized corporate equipment?", a: "Yes. Our equipment finance division underwrites loans and leases for heavy machinery, medical technology, corporate aviation, and commercial fleets." },
  { category: "Commercial & Lending", q: "How long does commercial underwriting take?", a: "While term sheets can be issued within 48 hours, full underwriting, including appraisals and environmental surveys, generally takes 30 to 45 days." },
  { category: "Commercial & Lending", q: "Are personal guarantees required for SME loans?", a: "Yes. Loans extended to Small and Medium Enterprises (SMEs) generally require personal guarantees from all individuals holding a 20% or greater ownership stake." },

  // Security & Fraud
  { category: "Security & Fraud", q: "What should I do if I suspect unauthorized access?", a: "Immediately lock your profile via the mobile app or call our 24/7 Fraud Incident Line. We will instantly freeze outbound transfers and begin a forensic audit of the session." },
  { category: "Security & Fraud", q: "Does TrustBank support hardware security keys?", a: "Yes. We highly recommend and fully support FIDO2-compliant hardware keys (such as YubiKeys) for all corporate and private wealth clients to authorize high-value transactions." },
  { category: "Security & Fraud", q: "How is my data encrypted?", a: "All data at rest is encrypted using the AES-256 standard. All data in transit between your device and our servers is secured via TLS 1.3 cryptographic protocols." },
  { category: "Security & Fraud", q: "Will TrustBank ever ask for my password?", a: "No. TrustBank personnel, including security and fraud agents, will never ask for your password, PIN, or multi-factor authentication codes. If you receive such a request, terminate communication immediately." },
  { category: "Security & Fraud", q: "How do I report a lost or stolen corporate debit card?", a: "You can instantly disable the specific card through the 'Card Management' section of the digital portal, or contact your relationship manager to have a replacement expedited." },
  { category: "Security & Fraud", q: "Are biometric logins safe?", a: "Yes. Biometric data (FaceID/TouchID) is stored securely within the local enclave of your device and is never transmitted to or stored on TrustBank servers." },
  { category: "Security & Fraud", q: "What is your liability policy for fraudulent card transactions?", a: "TrustBank offers Zero Liability Protection. If your card is compromised, you are not responsible for unauthorized charges provided you report the incident promptly upon discovery." },
  { category: "Security & Fraud", q: "Can I set geographical restrictions on my corporate cards?", a: "Yes. Corporate administrators can restrict card usage to specific countries or completely disable international transactions via the dashboard." },

  // Wealth Management
  { category: "Wealth Management", q: "Does TrustBank operate as a fiduciary?", a: "Yes. Our wealth management advisors operate under a strict fiduciary standard, legally obligating them to place your financial interests above all else." },
  { category: "Wealth Management", q: "How are your advisory fees structured?", a: "We operate on a transparent, fee-only model based on Assets Under Management (AUM). We do not accept commissions or hidden kickbacks for recommending specific mutual funds or ETFs." },
  { category: "Wealth Management", q: "Are my investments FDIC insured?", a: "No. Investment products are not bank deposits and are not FDIC insured. They are subject to market risk and may lose value. However, they are protected against broker-dealer failure by SIPC." },
  { category: "Wealth Management", q: "How often will my portfolio be rebalanced?", a: "Portfolios are monitored continuously. Algorithmic rebalancing occurs quarterly or whenever an asset class deviates by more than 5% from its strategic target allocation." },
  { category: "Wealth Management", q: "Can you assist with multi-generational trust planning?", a: "Yes. Our Family Office tier provides comprehensive estate structuring, including revocable living trusts, irrevocable life insurance trusts (ILITs), and philanthropic foundations." },
  { category: "Wealth Management", q: "Do you offer tax-loss harvesting?", a: "Yes. We actively monitor taxable accounts for opportunities to harvest capital losses, offsetting capital gains and improving your overall after-tax return." },
  { category: "Wealth Management", q: "What is your investment philosophy regarding alternative assets?", a: "For Qualified Purchasers, we believe alternative assets (Private Equity, Private Credit, Real Estate) offer vital non-correlated returns and act as an inflation hedge within a diversified portfolio." },
  { category: "Wealth Management", q: "Can I transfer existing securities in-kind?", a: "Yes. We utilize the ACATS system to transfer your existing portfolio in-kind, avoiding immediate liquidation and the associated capital gains tax liabilities." },
];

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FaqCategory | "All">("All");

  const categories: { name: FaqCategory | "All", icon: any }[] = [
    { name: "All", icon: Search },
    { name: "Account & Profile", icon: Landmark },
    { name: "Commercial & Lending", icon: Building2 },
    { name: "Security & Fraud", icon: ShieldAlert },
    { name: "Wealth Management", icon: Briefcase },
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <PageHero 
        title="Knowledge Base & FAQ" 
        description="Search our extensive directory of institutional guidelines, security protocols, and operational procedures." 
        image={heroFaq} 
        primaryCtaText="Contact Support Desk"
        primaryCtaLink="/contact"
        secondaryCtaText="Search Directory"
        secondaryCtaLink="#directory"
        stats={[
          { value: "30+", label: "Technical Articles" },
          { value: "Instant", label: "Self-Service Solutions" },
          { value: "Updated", label: "Regulatory Compliance" }
        ]}
      />

      <section className="py-24 bg-background" id="directory">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl">
          <SectionHeader
            eyebrow="Help & Support"
            title="Institutional Directory"
            description="Find rapid, definitive answers regarding our corporate banking operations and security standards."
          />

          {/* Search and Filter */}
          <div className="mt-12 mb-10 space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search by keyword (e.g., Wire Transfer, YubiKey, DSCR)..." 
                className="pl-12 h-14 bg-card border-muted/50 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
                    activeCategory === cat.name 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-card text-muted-foreground border-muted/50 hover:border-primary/50"
                  }`}
                >
                  <cat.icon className="h-4 w-4" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-muted/50">
                <p className="text-muted-foreground">No matching operational guidelines found for your search.</p>
                <Button variant="link" onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}>Clear Filters</Button>
              </div>
            ) : (
              <StaggerContainer className="space-y-4">
                {filteredFaqs.map((faq, i) => (
                  <StaggerItem key={i}>
                    <div className="border border-muted/50 rounded-xl overflow-hidden bg-card hover:border-primary/25 transition-all shadow-sm">
                    <button
                      className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                      onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    >
                      <div className="pr-8">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 block">{faq.category}</span>
                        <span className="font-semibold text-foreground text-sm">{faq.q}</span>
                      </div>
                      <div className={`h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 transition-transform duration-300 ${openIndex === i ? "rotate-180 bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </button>
                    
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        openIndex === i ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="px-6 pb-6 pt-0 border-t border-muted/20 mt-2">
                        <p className="text-xs text-muted-foreground leading-relaxed pt-4">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        </div>
      </section>

      {/* Disclosure Section */}
      <section className="py-8 bg-surface border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] leading-relaxed text-muted-foreground max-w-4xl mx-auto text-center font-sans">
            Disclaimer: The information provided in this Knowledge Base is for general informational purposes only and does not constitute formal legal, tax, or financial advice. Operational procedures, credit requirements, and regulatory compliance standards are subject to change without prior notice.
          </p>
        </div>
      </section>
    </>
  );
};

export default FAQPage;
