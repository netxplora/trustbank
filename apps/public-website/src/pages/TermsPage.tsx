import { Shield, Scale, FileText, AlertCircle } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { SlideUp, StaggerContainer, StaggerItem } from "@trustbank/shared-ui/components/Motion";
import heroFaq from "@/assets/hero-faq.jpg";

const TermsPage = () => (
  <>
    <PageHero 
      title="Master Commercial & Retail Depository Agreement" 
      description="The foundational legal framework governing your financial relationship, capital deployment, and digital access with TrustBank." 
      image={heroFaq} 
      showTrustBadges={true}
    />
    <section className="py-24 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-4xl">
        <SlideUp>
          <div className="bg-card rounded-2xl border border-muted/50 p-10 shadow-elevated space-y-10 font-sans">
            
            <div className="flex items-center gap-3 mb-8 border-b border-muted/50 pb-4">
              <Scale className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-poppins font-bold text-foreground">Terms of Service & Account Agreement</h2>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8">
              <h3 className="font-poppins font-bold text-primary mb-2">Agreement Summary</h3>
              <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                By establishing an account with TrustBank, you agree to our Master Commercial & Retail Depository Agreement. This covers your responsibilities, funds availability, mandatory arbitration, and limitations of liability. Please review the detailed sections below carefully.
              </p>
            </div>

            <StaggerContainer className="space-y-10">
              <StaggerItem>
                <div>
                  <h3 className="text-sm font-poppins font-bold text-foreground mb-3 uppercase tracking-wider">1. Account Establishment & Patriot Act Disclosures</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm font-sans mb-4">
                    To help the government fight the funding of terrorism and money laundering activities, Federal law (Title III of the USA PATRIOT Act) requires all financial institutions to obtain, verify, and record information that identifies each person or entity who opens an account.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-sm font-sans">
                    By executing this agreement, you authorize TrustBank to utilize consumer reporting agencies, public databases, and proprietary risk-scoring models to verify your identity. Corporate entities must provide certified articles of incorporation, board resolutions detailing authorized signers, and explicit disclosures of all Ultimate Beneficial Owners (UBOs) holding a 25% or greater equity stake.
                  </p>
                </div>
              </StaggerItem>
              
              <StaggerItem>
                <div>
                  <h3 className="text-sm font-poppins font-bold text-foreground mb-3 uppercase tracking-wider">2. Deposit Insurance & Funds Availability</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm font-sans mb-4">
                    TrustBank is a Member of the Federal Deposit Insurance Corporation (FDIC). Your eligible depository accounts are insured up to the standard maximum deposit insurance amount (SMDIA) of $250,000 per depositor, per insured depository institution, for each account ownership category.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-sm font-sans">
                    Pursuant to Regulation CC (Expedited Funds Availability Act), our general policy is to allow you to withdraw funds deposited in your account on the first business day after the day we receive your deposit. Electronic direct deposits will be available on the day we receive the deposit. However, we reserve the right to delay availability for large deposits, newly established accounts, or items requiring extended clearing verification.
                  </p>
                </div>
              </StaggerItem>
              
              <StaggerItem>
                <div>
                  <h3 className="text-sm font-poppins font-bold text-foreground mb-3 uppercase tracking-wider">3. Electronic Funds Transfer (EFT) Agreement</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm font-sans mb-4">
                    Governed by Regulation E, this section outlines your liability for unauthorized electronic fund transfers. If you notify us within two (2) business days after you learn of the loss or theft of your hardware security token, access credentials, or debit card, your liability is limited to $50. Failure to report within this timeframe may substantially increase your liability for unauthorized capital outflows.
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-sm font-sans">
                    Commercial and corporate accounts are not afforded the same consumer protections under Regulation E. Commercial entities agree to utilize commercially reasonable security procedures, including dual-authorization for external wire transfers and the mandatory utilization of FIDO2-compliant hardware keys.
                  </p>
                </div>
              </StaggerItem>
              
              <StaggerItem>
                <div>
                  <h3 className="text-sm font-poppins font-bold text-foreground mb-3 uppercase tracking-wider">4. Fiduciary Duty & Wealth Management</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm font-sans">
                    Assets held within TrustBank Wealth Management LLC, an SEC-registered investment adviser, are managed under a strict fiduciary standard. However, these assets are NOT FDIC INSURED, ARE NOT BANK DEPOSITS, AND MAY LOSE VALUE. Brokerage services are provided through TrustBank Securities Inc., Member FINRA/SIPC. TrustBank Securities Inc. and TrustBank Wealth Management LLC are affiliated entities.
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div>
                  <h3 className="text-sm font-poppins font-bold text-foreground mb-3 uppercase tracking-wider">5. Mandatory Arbitration & Class Action Waiver</h3>
                  <div className="bg-muted/30 p-5 rounded-xl border border-muted mt-2 font-sans">
                    <div className="flex gap-3 mb-2">
                      <AlertCircle className="h-5 w-5 text-secondary shrink-0" />
                      <p className="text-foreground font-poppins font-bold text-sm uppercase">Please Read Carefully - Affects Your Legal Rights</p>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-xs font-mono text-justify">
                      BY ESTABLISHING AN ACCOUNT, YOU AGREE THAT ANY DISPUTE, CLAIM, OR CONTROVERSY ARISING OUT OF OR RELATING TO THIS AGREEMENT, OR THE BREACH, TERMINATION, ENFORCEMENT, INTERPRETATION, OR VALIDITY THEREOF, SHALL BE DETERMINED BY BINDING ARBITRATION RATHER THAN IN A COURT OF LAW. YOU FURTHER AGREE THAT ANY PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION.
                    </p>
                  </div>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div>
                  <h3 className="text-sm font-poppins font-bold text-foreground mb-3 uppercase tracking-wider">6. Limitation of Liability & Force Majeure</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm font-sans">
                    TrustBank shall not be liable for direct, indirect, incidental, special, consequential, or exemplary damages, including but not limited to, damages for loss of profits, goodwill, use, data, or other intangible losses resulting from (i) the use or the inability to use the digital portal; (ii) unauthorized access to or alteration of your transmissions or data; or (iii) any disruption of service caused by acts of God, war, terrorism, or systemic telecommunications failures.
                  </p>
                </div>
              </StaggerItem>
            </StaggerContainer>

          </div>
        </SlideUp>
      </div>
    </section>
  </>
);

export default TermsPage;
