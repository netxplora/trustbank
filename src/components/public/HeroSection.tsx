import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock, Building2, ArrowRight } from "lucide-react";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "./Motion";

export function HeroSection({ homePageData }: { homePageData?: any }) {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center py-20 lg:py-32 overflow-hidden bg-white dark:bg-slate-950 text-foreground dark:text-white">
      {/* Dynamic Background Photography */}
      <div className="absolute right-0 top-0 w-full lg:w-3/5 h-full z-0 select-none">
        <div className="absolute inset-0 bg-primary/10 mix-blend-multiply dark:mix-blend-overlay z-10" />
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
          alt="Modern bank building"
          className="w-full h-full object-cover object-center opacity-25 dark:opacity-20 lg:opacity-100 dark:lg:opacity-80 transition-opacity duration-1000"
        />
        {/* Gentle fade: adapts to light/dark mode and responsive layouts */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-slate-950 dark:via-slate-950/90 dark:to-transparent lg:bg-gradient-to-r lg:from-white lg:via-white/50 lg:to-transparent dark:lg:from-slate-950 dark:lg:via-slate-950/50 dark:lg:to-transparent z-20" />
      </div>

      {/* Subtle background glow */}
      <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] pointer-events-none z-0" />

      <div className="container relative z-30 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">
          
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 max-w-2xl mt-8 lg:mt-0">
            <SlideUp>
              <div className="inline-flex items-center gap-3 mb-6 lg:mb-8 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md px-4 py-1.5 lg:px-5 lg:py-2 rounded-full shadow-2xl">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] lg:text-xs font-bold uppercase tracking-[0.15em] text-foreground/90 dark:text-white/90">
                  Global Banking Excellence
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-poppins font-bold tracking-tight leading-[1.15] lg:leading-[1.1] mb-4 sm:mb-6 lg:mb-8 text-foreground dark:text-white">
                World-Class <span className="text-primary">Financial</span> Services
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground dark:text-white/70 font-sans leading-relaxed mb-8 sm:mb-10 lg:mb-12 max-w-xl">
                {homePageData?.description || "Experience premium banking tailored for individuals, families, and businesses. Secure your financial future with our comprehensive advisory and deposit solutions."}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-5 mb-8 sm:mb-10 lg:mb-14 w-full">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 sm:px-8 lg:px-10 h-11 sm:h-12 lg:h-14 rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 text-xs sm:text-sm lg:text-base w-full sm:w-auto" asChild>
                  <Link to="/register">
                    Open an Account <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 text-foreground dark:text-white font-semibold px-6 sm:px-8 lg:px-10 h-11 sm:h-12 lg:h-14 rounded-xl transition-all text-xs sm:text-sm lg:text-base flex items-center justify-center w-full sm:w-auto" asChild>
                  <Link to="/login">Client Login</Link>
                </Button>
              </div>

              {/* Badges in Hero */}
              <StaggerContainer className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-6 pt-4 sm:pt-6 lg:pt-8 border-t border-slate-200 dark:border-white/10">
                <StaggerItem className="flex items-center gap-1.5 sm:gap-3 group">
                  <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                    <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <span className="text-[9px] sm:text-xs lg:text-sm font-bold text-foreground/80 dark:text-white/80 uppercase tracking-wider truncate">FDIC Insured</span>
                </StaggerItem>
                <StaggerItem className="flex items-center gap-1.5 sm:gap-3 group">
                  <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                    <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <span className="text-[9px] sm:text-xs lg:text-sm font-bold text-foreground/80 dark:text-white/80 uppercase tracking-wider truncate">Bank-Grade</span>
                </StaggerItem>
                <StaggerItem className="flex items-center gap-1.5 sm:gap-3 group">
                  <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                    <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <span className="text-[9px] sm:text-xs lg:text-sm font-bold text-foreground/80 dark:text-white/80 uppercase tracking-wider truncate">Global Reach</span>
                </StaggerItem>
              </StaggerContainer>
            </SlideUp>
          </div>

          {/* Right Column: Premium Interactive UI Preview */}
          <div className="lg:col-span-5 relative w-full flex flex-col items-center justify-center mt-12 lg:mt-0">
            <FadeIn delay={0.2} className="w-full">
              <div className="relative w-full max-w-md mx-auto space-y-6">
                
                {/* Floating Account Balance Card */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 shadow-2xl hover:-translate-y-2 transition-transform duration-500 backdrop-blur-xl">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground dark:text-white/50">Total Balance</span>
                      <div className="text-4xl font-poppins font-bold text-foreground dark:text-white mt-2 tracking-tight">$1,284,590.00</div>
                      <div className="text-xs text-muted-foreground dark:text-white/40 font-sans mt-1">Available Funds</div>
                    </div>
                    <div className="bg-primary/20 border border-primary/30 text-primary font-poppins font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md">
                      Private Client
                    </div>
                  </div>

                  <div className="h-16 w-full my-6 relative z-10">
                    <svg className="w-full h-full" viewBox="0 0 300 50" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0 45 Q50 35 100 40 T200 15 T300 5" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" className="opacity-80" />
                      <path d="M0 45 Q50 35 100 40 T200 15 T300 5 L300 50 L0 50 Z" fill="url(#growthGrad)" />
                      <circle cx="300" cy="5" r="4" fill="#ffffff" className="shadow-[0_0_10px_#ffffff]" />
                    </svg>
                  </div>

                  <div className="flex justify-between items-center text-xs text-muted-foreground dark:text-white/50 pt-6 border-t border-slate-200 dark:border-white/10 relative z-10">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest block mb-1">Account Holder</span>
                      <span className="text-foreground dark:text-white font-medium text-sm">Alexander Sterling</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold uppercase tracking-widest block mb-1">Account Number</span>
                      <span className="text-foreground dark:text-white font-mono text-sm">•••• 4892</span>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions Preview Widget */}
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:bg-slate-100 dark:hover:bg-white/10 transition-colors duration-500">
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground dark:text-white/50 tracking-[0.2em] mb-5">Recent Activity</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-success/20 flex items-center justify-center text-success font-bold text-[10px] tracking-widest">DEP</div>
                        <div>
                          <div className="font-semibold text-foreground dark:text-white">Investment Return</div>
                          <div className="text-xs text-muted-foreground dark:text-white/40 mt-0.5">Today</div>
                        </div>
                      </div>
                      <div className="font-mono text-success font-bold tracking-tight">+$12,420.00</div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-destructive/20 flex items-center justify-center text-destructive font-bold text-[10px] tracking-widest">TRF</div>
                        <div>
                          <div className="font-semibold text-foreground dark:text-white">International Wire</div>
                          <div className="text-xs text-muted-foreground dark:text-white/40 mt-0.5">Yesterday</div>
                        </div>
                      </div>
                      <div className="font-mono text-foreground dark:text-white font-bold tracking-tight">-$4,250.00</div>
                    </div>
                  </div>
                </div>

              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
