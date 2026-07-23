import { Briefcase, MapPin, Clock, Users, Heart, GraduationCap, TrendingUp, ShieldCheck, Activity, Award, Scale, Banknote, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PageHero } from "@/components/public/PageHero";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@/components/public/Motion";
import { SectionHeader } from "@/components/public/SectionHeader";
import heroCareers from "@/assets/hero-careers.jpg";

const openings = [
  { title: "Senior Portfolio Manager", location: "New York, NY", type: "Full-time", department: "Private Wealth" },
  { title: "Security Architect (Cryptography)", location: "Remote / Hybrid", type: "Full-time", department: "Technology" },
  { title: "VP, Commercial Underwriting", location: "Chicago, IL", type: "Full-time", department: "Risk Management" },
  { title: "Director of Institutional Sales", location: "London, UK", type: "Full-time", department: "Corporate Banking" },
  { title: "Senior Data Scientist", location: "San Francisco, CA", type: "Full-time", department: "Quantitative Analysis" },
  { title: "Compliance Officer (AML/KYC)", location: "Washington, D.C.", type: "Full-time", department: "Regulatory Compliance" },
];

const perks = [
  { icon: Heart, title: "Executive Healthcare", description: "100% employer-covered premium health, dental, and vision insurance for employees and dependents, with no deductibles." },
  { icon: GraduationCap, title: "Continuous Education", description: "Full tuition reimbursement for advanced degrees (MBA, CFA) and unlimited access to executive leadership courses." },
  { icon: TrendingUp, title: "Aggressive 401(k) Match", description: "Immediate vesting on a 6% corporate match, plus an annual discretionary profit-sharing contribution." },
  { icon: ShieldCheck, title: "Fiduciary Protection", description: "Comprehensive corporate legal protection and liability insurance for all licensed advisory staff." },
];

const mobility = [
  { icon: Activity, title: "Internal Rotational Programs", description: "Accelerate your career by rotating through core business units: Treasury, Private Wealth, and Commercial Lending. We prioritize promoting from within, ensuring institutional knowledge is retained and rewarded." },
  { icon: Users, title: "Global Secondments", description: "Top performers are eligible for 6-12 month assignments in our international offices, gaining invaluable cross-border regulatory and market exposure before returning to their home base." },
  { icon: Award, title: "Partnership Track", description: "TrustBank operates a distinct meritocracy. Exceptional leaders who demonstrate an unwavering commitment to fiduciary duty and operational excellence are invited into our equity partnership structure." }
];

const values = [
  { icon: Scale, title: "Client Confidentiality", description: "Our clients trust us with their financial information. We maintain strict confidentiality and protect client data at all times." },
  { icon: Shield, title: "Client-First Approach", description: "We act in the best interest of our clients. Our services are built to support their financial goals." },
  { icon: TrendingUp, title: "Performance-Based Growth", description: "Performance dictates advancement. We evaluate team members on the value they deliver to our clients." },
  { icon: Banknote, title: "Disciplined Approach", description: "We rely on careful analysis and reliable processes to ensure safe and steady growth." }
];

const CareersPage = () => {
  return (
    <>
      <PageHero 
        title="Careers at TrustBank" 
        description="Join our team of dedicated professionals and help us build a better banking experience for our customers." 
        image={heroCareers} 
        primaryCtaText="View Open Positions"
        primaryCtaLink="#openings"
        secondaryCtaText="Learn About Our Benefits"
        secondaryCtaLink="#philosophy"
        stats={[
          { value: "Top 5%", label: "Compensation Percentile" },
          { value: "6% Match", label: "Immediate Vesting 401(k)" },
          { value: "100%", label: "Employer Paid Healthcare" },
          { value: "Global", label: "Mobility Opportunities" }
        ]}
      />

      <section className="py-24 bg-slate-900 text-white relative overflow-hidden" id="philosophy">
        <div className="absolute inset-0 bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-poppins font-bold text-white mb-8">Our Compensation Philosophy</h2>
            <div className="bg-white/5 border border-white/10 p-10 md:p-16 rounded-3xl backdrop-blur-md shadow-2xl">
              <p className="text-lg md:text-xl text-white/90 font-sans leading-relaxed">
                We believe in rewarding hard work. We offer competitive salaries, performance bonuses, and comprehensive benefits to support our team members.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Culture */}
      <section className="py-32 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-1/3 h-1/2 bg-secondary/5 rounded-r-full blur-[100px] pointer-events-none" />
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            eyebrow="Corporate Culture"
            title="Our Core Values"
            description="We operate on principles of unwavering integrity, accountability, and fiduciary responsibility."
          />
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-16 max-w-6xl mx-auto font-sans">
            {values.map(({ icon: Icon, title, description }, idx) => (
              <StaggerItem key={title}>
                <div className="bg-card p-10 rounded-3xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group flex gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500 text-primary">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-xl text-foreground mb-4">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Corporate Benefits */}
      <section className="py-32 bg-muted/30 border-y border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Corporate Benefits"
            title="Employee Benefits"
            description="Our benefits package is designed to support you and your family."
          />
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 max-w-7xl mx-auto">
            {perks.map(({ icon: Icon, title, description }, idx) => (
              <StaggerItem key={title}>
                <div className="bg-background rounded-3xl border border-border p-10 text-center shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 h-full flex flex-col items-center group">
                  <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                    <Icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-poppins font-bold text-foreground mb-4 text-lg">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Career Trajectory */}
      <section className="py-32 bg-background border-b border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Career Trajectory"
            title="Internal Mobility & Development"
            description="We build leaders. Our internal mobility programs ensure your career never stagnates."
          />
          <StaggerContainer className="grid md:grid-cols-3 gap-10 mt-16 max-w-7xl mx-auto">
            {mobility.map((item, idx) => (
              <StaggerItem key={item.title}>
                <div className="flex flex-col items-start bg-card p-10 rounded-3xl border border-border shadow-sm mx-auto h-full justify-start hover:border-secondary/30 hover:shadow-xl transition-all duration-500 group">
                  <div className="h-16 w-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-secondary/20 transition-all duration-500">
                    <item.icon className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="font-poppins font-bold text-foreground mb-4 text-xl group-hover:text-secondary transition-colors">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-sans">{item.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Openings */}
      <section className="py-32 bg-muted/30" id="openings">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Current Opportunities"
            title="Join the Firm"
            description="Review our current open requisitions across global offices."
          />
          
          <StaggerContainer className="space-y-6 max-w-5xl mx-auto mt-16">
            {openings.map((job, idx) => (
              <StaggerItem key={job.title}>
                <div className="bg-background rounded-3xl border border-border p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
                  <div>
                    <h3 className="text-2xl font-poppins font-bold text-foreground mb-4 group-hover:text-primary transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-6 mt-2 text-sm text-muted-foreground font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full"><Briefcase className="h-4 w-4 text-primary" />{job.department}</span>
                      <span className="flex items-center gap-2 bg-secondary/5 px-3 py-1.5 rounded-full"><MapPin className="h-4 w-4 text-secondary" />{job.location}</span>
                      <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full"><Clock className="h-4 w-4" />{job.type}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Button size="lg" className="w-full md:w-auto px-10 h-14 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90" asChild>
                      <Link to="/contact">Submit Profile</Link>
                    </Button>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=2000')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-poppins font-bold tracking-tight mb-6">Forge Your Legacy</h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 font-sans mb-10 leading-relaxed">
            If you possess the uncompromising standards required to join TrustBank, we invite you to submit your credentials.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-14 px-8 text-base font-semibold rounded-xl" asChild>
              <Link to="/contact">Contact Recruiting</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Disclosure Section */}
      <section className="py-12 bg-card border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] leading-relaxed text-muted-foreground max-w-5xl mx-auto text-justify font-sans">
            Important Employment Disclosures: TrustBank is an Equal Opportunity Employer. All qualified applicants will receive consideration for employment without regard to race, color, religion, sex, sexual orientation, gender identity, national origin, disability, or protected veteran status. Compensation figures, bonus structures, and equity participation are subject to individual negotiation, role responsibilities, and overall firm performance. Benefit offerings may vary depending on geographic location and local regulatory requirements. Background checks, including comprehensive financial history and criminal record reviews, are mandatory for all prospective employees prior to final offers.
          </p>
        </div>
      </section>
    </>
  );
};

export default CareersPage;
