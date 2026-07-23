import { Target, Eye, Heart, Users, Award, Building, Globe, Shield, Landmark, Scale, Leaf, CheckCircle, ChevronRight, Gem, History } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/PageHero";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@/components/public/Motion";
import { SectionHeader } from "@/components/public/SectionHeader";
import heroAbout from "@/assets/hero-about.jpg";

const values = [
  { icon: Scale, title: "Fiduciary Standard", description: "Operating with absolute legal and ethical obligation to prioritize client financial interests above institutional profit." },
  { icon: Shield, title: "Capital Protection", description: "Deploying multi-layered security architectures and maintaining stringent Tier 1 capital ratios." },
  { icon: Award, title: "Institutional Rigor", description: "Subjecting all operations to rigorous external audits and regulatory compliance frameworks." },
  { icon: Leaf, title: "Sustainable Yield", description: "Evaluating long-term economic stability and environmental impacts in our corporate lending practices." },
];

const boardMembers = [
  {
    name: "Eleanor Sterling",
    role: "Chairwoman of the Board",
    bio: "Former Federal Reserve Governor with 35 years of macroeconomic policy and central banking experience. Chairs the Risk & Compliance Committee.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400"
  },
  {
    name: "Marcus Vance",
    role: "Chief Executive Officer",
    bio: "Pioneered TrustBank's digital transformation. Over two decades of executive leadership in commercial banking and corporate treasury management.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400&h=400"
  },
  {
    name: "Dr. Sarah Chen",
    role: "Independent Director",
    bio: "Renowned cryptographer and cybersecurity advisor. Guides the board on digital infrastructure, API security, and emerging technological threats.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400&h=400"
  },
  {
    name: "Arthur Pendelton",
    role: "Head of Credit Risk",
    bio: "Former Chief Credit Officer at a top-three global investment bank. Oversees the commercial lending portfolio and underwriting philosophy.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400&h=400"
  }
];

const AboutPage = () => {
  return (
    <>
      <PageHero
        title="Corporate Heritage & Governance"
        description="For over three decades, TrustBank has operated with an uncompromising fiduciary commitment to preserve, structure, and grow generational assets and corporate capital."
        image={heroAbout}
        primaryCtaText="Review Corporate Charter"
        primaryCtaLink="#history"
        secondaryCtaText="Meet the Board"
        secondaryCtaLink="#board"
        stats={[
          { value: "1994", label: "Year Established" },
          { value: "$48.3B", label: "Assets Administered" },
          { value: "12.4%", label: "Tier 1 Capital Ratio" },
          { value: "98.4%", label: "Client Retention" }
        ]}
      />

      <section className="py-12 sm:py-20 lg:py-28 bg-background relative" id="history">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 dark:bg-primary/5 blur-[120px] pointer-events-none rounded-bl-full" />
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <SlideUp>
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <History className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-foreground">A Legacy of Financial Prudence</h2>
              </div>
              
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-muted-foreground mb-6 sm:mb-8 font-sans">
                  Established in 1994 amidst an era of rapid financial deregulation, TrustBank was founded on a contrarian principle: that disciplined risk management and fiduciary duty should supersede aggressive short-term yield. We began as a private wealth advisory, managing the complex estates of high-net-worth families who demanded absolute capital security.
                </p>
                <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-muted-foreground mb-6 sm:mb-8 font-sans">
                  Over the decades, we systematically expanded our charter to serve commercial enterprises and institutional investors. By 2010, we recognized that the future of premium banking required bridging the gap between rigorous traditional underwriting and advanced digital infrastructure. Our strategic pivot resulted in the development of our proprietary, SOC2-compliant digital banking portal.
                </p>
                <div className="bg-card p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-border shadow-sm mb-6 sm:mb-8 mt-8 sm:mt-12">
                  <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-foreground font-poppins font-medium">
                    Today, TrustBank manages over $48 billion in assets. We remain independently governed, allowing us to maintain our strict underwriting standards, reject speculative financial instruments, and focus entirely on long-term value creation for our depositors and commercial partners.
                  </p>
                </div>
              </div>
            </SlideUp>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20 lg:py-28 bg-slate-50 dark:bg-slate-900/30 border-y border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12 items-stretch max-w-7xl mx-auto">
            <SlideUp className="h-full">
              <div className="bg-background rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 border border-border shadow-sm flex flex-col justify-between h-full hover:shadow-lg hover:border-primary/20 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-colors duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-10">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shrink-0">
                      <Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <h2 className="text-xl sm:text-3xl font-poppins font-bold text-foreground">Corporate Mission</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed font-sans text-xs sm:text-base lg:text-lg">
                    To deliver institutional-grade financial security and bespoke wealth structuring to discerning clients. We deploy our capital base to foster sustainable economic growth, operating with absolute transparency and rigorous risk-aversion to protect depositor assets across generations.
                  </p>
                </div>
              </div>
            </SlideUp>

            <SlideUp className="h-full" delay={0.15}>
              <div className="bg-background rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 border border-border shadow-sm flex flex-col justify-between h-full hover:shadow-lg hover:border-secondary/20 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/5 rounded-full blur-[60px] group-hover:bg-secondary/10 transition-colors duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-10">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-secondary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shrink-0">
                      <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
                    </div>
                    <h2 className="text-xl sm:text-3xl font-poppins font-bold text-foreground">Strategic Vision</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed font-sans text-xs sm:text-base lg:text-lg">
                    To define the modern standard for private banking by seamlessly integrating cryptographic digital security with traditional, relationship-based advisory. We aim to be the industry benchmark for corporate governance, operational resilience, and capital adequacy.
                  </p>
                </div>
              </div>
            </SlideUp>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20 lg:py-28 bg-background relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1/3 bg-primary/5 rounded-r-full blur-[100px] pointer-events-none" />
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            eyebrow="Operating Principles"
            title="Institutional Core Values"
            description="The non-negotiable standards that govern our operations, credit committees, and client interactions."
          />

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 max-w-7xl mx-auto">
            {values.map(({ icon: Icon, title, description }, idx) => (
              <StaggerItem key={title}>
                <div className="bg-card rounded-3xl p-10 border border-border shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col items-start group">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500 text-primary">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-poppins font-bold text-foreground mb-4 text-xl">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-sans">{description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="py-32 bg-slate-50 dark:bg-slate-900/50 border-y border-border" id="board">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Corporate Governance"
            title="Board of Directors"
            description="Our independent board ensures stringent oversight, regulatory compliance, and alignment with our fiduciary charter."
          />
          
          <StaggerContainer className="grid lg:grid-cols-2 gap-10 mt-16 max-w-6xl mx-auto">
            {boardMembers.map((member, idx) => (
              <StaggerItem key={member.name}>
                <div className="bg-background p-10 rounded-3xl border border-border shadow-sm flex flex-col sm:flex-row gap-8 items-start h-full hover:shadow-xl transition-all duration-500 group">
                  <div className="h-32 w-32 rounded-2xl bg-slate-200 shrink-0 overflow-hidden border border-border group-hover:shadow-lg transition-all duration-500">
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-poppins font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{member.name}</h3>
                    <p className="text-sm font-bold text-primary uppercase tracking-widest mb-6">{member.role}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="py-32 bg-background border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl">
          <SlideUp>
            <div className="bg-card p-12 rounded-3xl border border-border shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Leaf className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-3xl font-bold font-poppins text-foreground">ESG & Sustainable Finance Framework</h3>
                </div>
                
                <p className="text-lg text-muted-foreground leading-relaxed mb-10">
                  TrustBank integrates Environmental, Social, and Governance (ESG) criteria into our commercial underwriting and private wealth advisory practices. We recognize that sustainable corporate practices are inherently linked to long-term economic viability and risk mitigation.
                </p>
                
                <div className="grid sm:grid-cols-3 gap-8">
                  <div className="p-6 bg-background rounded-2xl border border-border">
                    <CheckCircle className="h-8 w-8 text-secondary mb-4" />
                    <h4 className="font-poppins font-bold text-foreground mb-2">Environmental Risk</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">All commercial real estate and industrial lending portfolios undergo rigorous environmental stress testing to evaluate climate transition risks.</p>
                  </div>
                  <div className="p-6 bg-background rounded-2xl border border-border">
                    <CheckCircle className="h-8 w-8 text-secondary mb-4" />
                    <h4 className="font-poppins font-bold text-foreground mb-2">Corporate Transparency</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">We publish an annual, audited sustainability report detailing our internal carbon footprint and the aggregate ESG metrics of our lending book.</p>
                  </div>
                  <div className="p-6 bg-background rounded-2xl border border-border">
                    <CheckCircle className="h-8 w-8 text-secondary mb-4" />
                    <h4 className="font-poppins font-bold text-foreground mb-2">Community Reinvestment</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">A mandated percentage of our net operating income is strategically deployed to fund affordable housing initiatives and small business grants.</p>
                  </div>
                </div>
              </div>
            </div>
          </SlideUp>
        </div>
      </section>

      {/* Disclosure Section */}
      <section className="py-12 bg-card border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <p className="text-xs leading-relaxed text-muted-foreground max-w-5xl mx-auto text-justify font-sans">
            Important Corporate Disclosures: TrustBank operates under the regulatory supervision of the Federal Reserve System, the Federal Deposit Insurance Corporation (FDIC), and the Office of the Comptroller of the Currency (OCC). Financial metrics, including Assets Under Administration (AUA) and Tier 1 Capital Ratios, are reported as of the most recent quarterly financial filing and are subject to audit. The Board of Directors operates in accordance with the corporate bylaws and applicable federal banking governance regulations.
          </p>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
