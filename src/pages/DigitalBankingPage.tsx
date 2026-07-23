import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Receipt, Phone, FileText, UserPlus, History, Smartphone, Globe, Lock, ShieldCheck, Activity, Key, ChevronDown, MonitorSmartphone, Server, Fingerprint } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@/components/public/Motion";
import { SectionHeader } from "@/components/public/SectionHeader";
import heroDigital from "@/assets/hero-digital.jpg";

const features = [
  { icon: Globe, title: "Global Wires & ACH Routing", description: "Execute domestic ACH and international SWIFT transactions securely. Our platform provides real-time tracking, transparent FX conversion rates, and automated receipt generation.", highlighted: false },
  { icon: Receipt, title: "Unified Treasury Portal", description: "Consolidate corporate checking, savings, and loan accounts. Directors can manage receivables, approve multi-signature transfers, and export ledger data directly to ERP systems.", highlighted: true },
  { icon: Phone, title: "Secure Advisor Messaging", description: "Bypass standard support queues. The digital portal features end-to-end encrypted messaging channels directly to your assigned private wealth or corporate relationship manager.", highlighted: false },
  { icon: FileText, title: "Audited Digital Vault", description: "Access up to 7 years of fully audited electronic statements, tax disclosures (1099s), and loan amortization schedules in an immutably secure, searchable cloud vault.", highlighted: false },
  { icon: ShieldCheck, title: "Granular Role-Based Access", description: "Corporate administrators can assign custom read/write permissions to accounting staff, ensuring segregation of duties and strict compliance with internal audit controls.", highlighted: false },
  { icon: Fingerprint, title: "Biometric & Hardware Security", description: "Authorize high-value outflows and profile modifications utilizing FIDO2-compliant physical hardware keys (e.g., YubiKey) or advanced biometric passkeys.", highlighted: false },
];

const capabilities = [
  { icon: MonitorSmartphone, title: "Native Mobile Infrastructure", desc: "Our iOS and Android applications are built on native frameworks, ensuring rapid load times, offline balance caching, and immediate biometric authentication for on-the-go liquidity management." },
  { icon: Server, title: "Real-Time API Integrations", desc: "Establish direct, secure API connections between TrustBank and your corporate accounting software. Automate payroll disbursement and daily ledger reconciliation without manual CSV uploads." },
  { icon: Lock, title: "Zero-Trust Architecture", desc: "The platform operates on a zero-trust security model. Every session, transaction, and API call requires independent cryptographic verification, protecting against session hijacking and unauthorized data extraction." },
];

const faqs = [
  { q: "Is TrustBank's digital banking platform secure?", a: "Yes. Our platform utilizes AES-256 encryption for data at rest and TLS 1.3 for data in transit. We mandate multi-factor authentication (MFA) and support hardware security keys to protect against phishing and unauthorized access." },
  { q: "Can I manage multiple business entities from a single login?", a: "Yes. Our Unified Treasury Portal allows corporate directors and holding company managers to seamlessly switch between multiple business entities and personal accounts using a single, secure master login profile." },
  { q: "How do I set up multi-user access for my accounting team?", a: "Administrators can navigate to 'User Management' within the corporate dashboard. From there, you can invite staff members and assign granular permissions, such as 'View Only', 'Draft Payments', or 'Full Approval'." },
  { q: "What is the daily limit for mobile check deposits?", a: "Mobile check deposit limits vary by account tier and history. Standard limits typically start at $10,000 per day. Private wealth and corporate clients may have significantly higher limits or completely custom thresholds." },
  { q: "Can I initiate international SWIFT transfers via the mobile app?", a: "Yes. International wire transfers, complete with real-time foreign exchange rate locks and intermediary bank tracking, can be fully executed and approved through both the web portal and mobile application." },
  { q: "Does the platform support integration with QuickBooks or Xero?", a: "Yes. TrustBank offers direct API feeds compatible with major ERP and accounting software including QuickBooks, Xero, and NetSuite, allowing for automated, daily transaction syncing." },
  { q: "What are 'Biometric Passkeys'?", a: "Passkeys replace traditional passwords with cryptographic keys stored securely on your device's secure enclave. You authenticate using FaceID, TouchID, or Windows Hello, rendering credential-stuffing attacks obsolete." },
  { q: "Are electronic statements legally valid for audits?", a: "Yes. Our digital statements are exact cryptographic replicas of physical statements and are universally accepted by the IRS, external auditors, and legal entities." },
];

const DigitalBankingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <PageHero 
        title="Institutional Digital Banking Portal" 
        description="Command your capital with absolute precision. Execute global wires, audit corporate ledgers, and manage user access through our cryptographically secure web and mobile interfaces." 
        image={heroDigital} 
        primaryCtaText="Access Client Portal"
        primaryCtaLink="/login"
        secondaryCtaText="Explore Capabilities"
        secondaryCtaLink="#capabilities"
        stats={[
          { value: "99.99%", label: "Core System Uptime" },
          { value: "AES-256", label: "Data Encryption Standard" },
          { value: "FIDO2", label: "Hardware Auth Supported" },
          { value: "Zero", label: "Trust Architecture" }
        ]}
      />

      <section className="py-6 bg-slate-900 text-white border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/20 blur-[100px] pointer-events-none" />
        <div className="container px-4 sm:px-6 lg:px-8 text-center flex items-center justify-center gap-6 flex-wrap relative z-10">
          <span className="text-sm font-medium tracking-wide text-white/90">Transitioning from another institution? Our onboarding team ensures seamless API and account migration.</span>
          <Button size="sm" asChild className="bg-white hover:bg-white/90 text-slate-900 font-semibold px-6 rounded-full shadow-lg">
            <Link to="/contact">Contact Onboarding Desk</Link>
          </Button>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-12 sm:py-20 lg:py-28 bg-background relative" id="capabilities">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader 
            eyebrow="Platform Features"
            title="Engineered for Complex Treasuries"
            description="Our digital environment is built for scale, providing the robust tools required by corporate controllers and private wealth clients."
          />

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12 max-w-7xl mx-auto">
            {features.map(({ icon: Icon, title, description, highlighted }, idx) => (
              <StaggerItem key={title}>
                <div className={`rounded-2xl sm:rounded-3xl border p-5 sm:p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 group ${
                  highlighted
                    ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-800 dark:border-slate-700 shadow-xl relative overflow-hidden"
                    : "bg-card border-border hover:shadow-lg hover:border-primary/20 shadow-sm"
                }`}>
                  {/* Glowing effect for the highlighted card */}
                  {highlighted && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-colors" />
                  )}

                  <div className="relative z-10 flex flex-col h-full">
                    <div className={`h-11 w-11 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-5 sm:mb-8 transition-transform group-hover:scale-105 duration-300 ${
                      highlighted ? "bg-white/10 text-white" : "bg-primary/5 text-primary"
                    }`}>
                      <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                    </div>

                    <h3 className={`text-lg sm:text-xl font-poppins font-bold mb-3 ${highlighted ? "text-white" : "text-foreground"}`}>
                      {title}
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${highlighted ? "text-white/70" : "text-muted-foreground"}`}>
                      {description}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Core Infrastructure */}
      <section className="py-12 sm:py-20 lg:py-28 bg-muted/30 border-y border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader 
            eyebrow="Core Infrastructure"
            title="Security and Accessibility"
            description="We balance immediate global accessibility with uncompromising cryptographic security protocols."
          />
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12 max-w-7xl mx-auto">
            {capabilities.map(({ icon: Icon, title, desc }, idx) => (
              <StaggerItem key={title}>
                <div className="bg-background p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-border shadow-sm h-full flex flex-col items-center text-center hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
                  <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-full bg-primary/5 flex items-center justify-center mb-5 sm:mb-8 group-hover:scale-105 group-hover:bg-primary/10 transition-all duration-300">
                    <Icon className="h-7 w-7 sm:h-10 sm:w-10 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-xl font-poppins font-bold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">{title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Extensive FAQ Section */}
      <section className="py-12 sm:py-20 lg:py-28 bg-background">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-4xl">
          <SectionHeader
            eyebrow="Technical Knowledge Base"
            title="Digital Banking Specifications"
            description="Detailed specifications regarding platform security, API integrations, and user access management."
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
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=2000')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-poppins font-bold tracking-tight mb-6">Enterprise-Grade Security</h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 font-sans mb-10 leading-relaxed">
            Gain complete oversight of your financial architecture with our unified portal.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-14 px-8 text-base font-semibold rounded-xl" asChild>
              <Link to="/register">Create Digital Profile</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-14 px-8 text-base font-semibold rounded-xl bg-transparent" asChild>
              <Link to="/login">Sign In Securely</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Disclosure Section */}
      <section className="py-12 bg-card border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <p className="text-xs leading-relaxed text-muted-foreground max-w-5xl mx-auto text-justify font-sans">
            Important Digital Banking Disclosures: Access to the TrustBank digital portal requires an active internet connection and a compatible browser or mobile device. Standard corporate security policies apply. TrustBank employs advanced security measures, but clients are responsible for maintaining the confidentiality of their login credentials, passkeys, and hardware tokens. Certain high-risk transactions, including international wire transfers and bulk ACH disbursements, may be subject to manual review, holding periods, or additional verification steps before final execution. Third-party mobile carrier data and message rates may apply to SMS alerts and mobile application usage. API integrations require execution of a separate master service agreement and compliance with TrustBank developer protocols.
          </p>
        </div>
      </section>
    </>
  );
};

export default DigitalBankingPage;
