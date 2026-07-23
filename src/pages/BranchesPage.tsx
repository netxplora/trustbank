import { MapPin, Phone, Clock, Navigation, Shield, Briefcase, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/PageHero";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@/components/public/Motion";
import { SectionHeader } from "@/components/public/SectionHeader";
import heroBranches from "@/assets/hero-branches.jpg";

const branches = [
  { name: "Wall Street Head Office", address: "100 Wall Street, Suite 1500, New York, NY 10005", phone: "+1 (212) 555-0180", hours: "Mon–Fri: 8:00 AM – 4:00 PM", coordinates: "40.7061,-74.0089", type: "Corporate Headquarters", icon: Briefcase },
  { name: "K Street Advisory Suite", address: "1600 K St NW, Washington, D.C. 20006", phone: "+1 (202) 555-0144", hours: "By Appointment Only", coordinates: "38.9023,-77.0369", type: "Private Wealth & Government Relations", icon: Key },
  { name: "Loop Commercial Center", address: "233 S Wacker Dr, Chicago, IL 60606", phone: "+1 (312) 555-0192", hours: "Mon–Fri: 8:00 AM – 4:00 PM", coordinates: "41.8789,-87.6358", type: "Commercial Lending Desk", icon: Briefcase },
  { name: "Trade Street Vault & Advisory", address: "101 S Tryon St, Charlotte, NC 28280", phone: "+1 (704) 555-0128", hours: "Mon–Fri: 8:00 AM – 4:00 PM", coordinates: "35.2271,-80.8431", type: "Secure Vault Facility", icon: Shield },
  { name: "Financial District Branch", address: "600 Montgomery St, San Francisco, CA 94111", phone: "+1 (415) 555-0112", hours: "Mon–Fri: 8:00 AM – 3:30 PM", coordinates: "37.7954,-122.4028", type: "Technology & Venture Capital Advisory", icon: Briefcase },
  { name: "Copley Square Private Office", address: "200 Clarendon St, Boston, MA 02116", phone: "+1 (617) 555-0160", hours: "Mon–Fri: 8:00 AM – 3:30 PM", coordinates: "42.3498,-71.0773", type: "Private Wealth Suite", icon: Key },
];

const BranchesPage = () => {
  return (
    <>
      <PageHero 
        title="National Advisory Network" 
        description="Locate our private wealth suites, commercial lending desks, and high-security vault facilities. We operate with absolute discretion and physical security." 
        image={heroBranches} 
        primaryCtaText="Locate Nearest Office"
        primaryCtaLink="#locations"
        secondaryCtaText="Schedule Private Visit"
        secondaryCtaLink="/contact"
        stats={[
          { value: "48+", label: "Private Banking Suites" },
          { value: "Class 3", label: "Vault Security Standard" },
          { value: "Discreet", label: "Appointment Operations" }
        ]}
      />

      <section className="py-16 bg-surface border-b border-muted/50">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <div className="rounded-2xl overflow-hidden border border-muted/50 shadow-elevated" style={{ height: 400 }}>
              <iframe
                title="TrustBank Global Network"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src="https://maps.google.com/maps?q=100%20Wall%20Street,%20New%20York&t=&z=4&ie=UTF8&iwloc=&output=embed"
                allowFullScreen
              />
            </div>
          </SlideUp>
        </div>
      </section>

      <section className="py-24 bg-surface">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="On-Site Infrastructure"
            title="Institutional Capabilities"
            description="Our physical locations provide high-security environments for sensitive transactions and advisory services."
          />
          
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 font-sans">
            {[
              { icon: Briefcase, title: "Private Wealth Advisory", desc: "Dedicated suites for confidential meetings with senior wealth managers." },
              { icon: Shield, title: "Secure Asset Vaults", desc: "Class-3 rated physical storage for precious metals and bearer instruments." },
              { icon: Key, title: "Escrow & Settlement", desc: "On-site legal and notary personnel for complex corporate transactions." },
              { icon: Navigation, title: "Global Treasury", desc: "Direct access desks for real-time forex and institutional liquidity management." }
            ].map((feature, idx) => (
              <StaggerItem key={idx}>
                <div className="bg-background rounded-3xl p-8 border border-muted/50 hover:border-primary/30 transition-colors shadow-sm h-full flex flex-col">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-lg font-poppins font-bold text-foreground mb-3">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="py-24 bg-background" id="locations">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Physical Infrastructure"
            title="Institutional Offices & Vaults"
            description="Our physical footprint is designed for high-net-worth interactions, corporate treasury meetings, and physical asset security."
          />

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {branches.map((branch, idx) => (
              <StaggerItem key={branch.name}>
                <div className="bg-card rounded-2xl border border-muted/50 p-8 hover-lift transition-all shadow-sm flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <branch.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold tracking-widest uppercase text-primary leading-tight">{branch.type}</span>
                    </div>
                    
                    <h3 className="text-xl font-poppins font-bold text-foreground mb-4">{branch.name}</h3>
                    
                    <div className="space-y-4 text-sm text-muted-foreground font-sans">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                        <span className="leading-relaxed">{branch.address}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 shrink-0 text-accent" />
                        <span className="font-mono text-xs font-bold">{branch.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 shrink-0 text-accent" />
                        <span className="font-semibold">{branch.hours}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-8 border-t border-muted/50 mt-8">
                    <Button variant="outline" size="sm" className="w-full h-10 font-bold uppercase tracking-wider text-xs" asChild>
                      <a href={`https://www.google.com/maps?q=${branch.coordinates}`} target="_blank" rel="noopener noreferrer">
                        <Navigation className="h-4 w-4 mr-2" /> Secure Navigation
                      </a>
                    </Button>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Security Disclosure */}
      <section className="py-8 bg-surface border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] leading-relaxed text-muted-foreground max-w-5xl mx-auto text-justify font-sans">
            Important Access Disclosures: Access to TrustBank Private Wealth Suites and Secure Vault Facilities is strictly by appointment only. Walk-in services for non-account holders are not accommodated. All facilities employ extensive biometric access controls, armed security personnel, and continuous closed-circuit surveillance. Visitors must present valid government-issued identification matching their scheduled appointment roster prior to entry.
          </p>
        </div>
      </section>
    </>
  );
};

export default BranchesPage;
