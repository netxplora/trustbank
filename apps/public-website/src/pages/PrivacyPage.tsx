import { Shield, Lock, FileText, Database, EyeOff } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { SlideUp, StaggerContainer, StaggerItem } from "@trustbank/shared-ui/components/Motion";
import heroFaq from "@/assets/hero-faq.jpg";

const PrivacyPage = () => (
  <>
    <PageHero 
      title="Corporate Privacy & Data Security Policy" 
      description="TrustBank operates under strict adherence to federal and international privacy mandates, ensuring your capital and identity remain insulated." 
      image={heroFaq} 
      showTrustBadges={true}
    />
    <section className="py-24 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-4xl">
        <SlideUp>
          <div className="bg-card rounded-2xl border border-muted/50 p-10 shadow-elevated space-y-10 font-sans">
            
            <div className="flex items-center gap-3 mb-8 border-b border-muted/50 pb-4">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-poppins font-bold text-foreground">Consumer Privacy Notice</h2>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8">
              <h3 className="font-poppins font-bold text-primary mb-2">Policy Summary</h3>
              <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                TrustBank strictly compartmentalizes your data. We do not sell or share your nonpublic personal information with non-affiliated third parties for joint marketing purposes. All data is encrypted at rest and in transit using military-grade cryptographic standards.
              </p>
            </div>

            <StaggerContainer className="space-y-10">
              <StaggerItem>
                <div>
                  <h3 className="text-sm font-poppins font-bold text-foreground mb-3 uppercase tracking-wider">1. Gramm-Leach-Bliley Act (GLBA) Disclosure</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm font-sans mb-4">
                    In compliance with the Gramm-Leach-Bliley Act, TrustBank is mandated to explain how we collect, share, and protect your nonpublic personal information (NPI). Financial companies choose how they share your personal information. Federal law gives consumers the right to limit some but not all sharing.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-sm font-sans">
                    TrustBank does not share your NPI with non-affiliated third parties for joint marketing purposes. We strictly compartmentalize your data, utilizing it solely for the facilitation of your requested transactions, underwriting assessments, and mandatory regulatory reporting (e.g., FinCEN filings).
                  </p>
                </div>
              </StaggerItem>
              
              <StaggerItem>
                <div>
                  <h3 className="text-sm font-poppins font-bold text-foreground mb-3 uppercase tracking-wider">2. Data Security & Cryptographic Architecture</h3>
                  <div className="bg-muted/30 p-5 rounded-xl border border-muted mb-4 space-y-3 font-sans">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground uppercase">Data At Rest</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">All structured and unstructured client data, including transaction ledgers and biometric hashes, are encrypted utilizing Advanced Encryption Standard (AES) with 256-bit keys across our redundant, localized server infrastructure.</p>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <Lock className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground uppercase">Data In Transit</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">External communications and API calls routing through our digital portals are secured via Transport Layer Security (TLS) 1.3 protocol, actively neutralizing man-in-the-middle interception vectors.</p>
                  </div>
                </div>
              </StaggerItem>
              
              <StaggerItem>
                <div>
                  <h3 className="text-sm font-poppins font-bold text-foreground mb-3 uppercase tracking-wider">3. General Data Protection Regulation (GDPR) & CCPA</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm font-sans mb-4">
                    For clients operating within the European Economic Area (EEA) or California (under CCPA/CPRA), you retain specific jurisdictional rights concerning your data. This includes the right to access the specific pieces of personal information we hold, the right to rectify inaccuracies, and the right to request deletion of your data.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-sm font-sans font-semibold">
                    Note on Deletion Requests: Due to stringent Anti-Money Laundering (AML) and Know Your Customer (KYC) regulations mandated by the US Treasury, TrustBank is legally required to retain transaction ledgers and identity verification documents for a minimum of five (5) years following account closure. Regulatory retention supersedes GDPR/CCPA deletion requests.
                  </p>
                </div>
              </StaggerItem>
              
              <StaggerItem>
                <div>
                  <h3 className="text-sm font-poppins font-bold text-foreground mb-3 uppercase tracking-wider">4. Third-Party Auditing & SOC 2 Compliance</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm font-sans">
                    TrustBank maintains SOC 2 Type II compliance, verified through independent, continuous auditing by accredited external assurance firms. This guarantees that our internal access controls, firewall configurations, and intrusion detection systems meet the highest institutional standards for security, availability, and processing integrity.
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="border-t border-muted/50 pt-8 mt-8">
                  <div className="flex items-start gap-4">
                    <EyeOff className="h-6 w-6 text-muted-foreground shrink-0 mt-1" />
                    <div>
                      <h4 className="text-sm font-poppins font-bold text-foreground uppercase tracking-wider mb-2">Opt-Out & Privacy Inquiries</h4>
                      <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                        To exercise your jurisdictional privacy rights, or to speak directly with our Chief Information Security Officer's desk regarding our cryptographic protocols, please contact our secure privacy routing at <span className="font-bold text-primary">privacy@trustbank.com</span>. Please authenticate all communications using your established corporate PGP key if applicable.
                      </p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>

          </div>
        </SlideUp>
      </div>
    </section>
  </>
);

export default PrivacyPage;
