import React from "react";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { FadeIn } from "./Motion";

export const MarketSnapshot = () => {
  return (
    <section className="py-20 lg:py-32 bg-background text-foreground border-y border-border relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute right-0 top-0 w-1/2 h-full bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary block mb-3">
              Daily Market Overview
            </span>
            <h2 className="text-3xl md:text-4xl font-poppins font-bold text-foreground mb-6">
              Institutional Market Snapshot
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground font-sans mb-8">
              Stay informed with real-time institutional metrics, tracking core benchmark yields and strategic index performance critical for corporate treasury and portfolio management.
            </p>
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5"><Activity className="h-4 w-4 text-primary" /> Live Updates</span>
              <span>•</span>
              <span>Updated 2 minutes ago</span>
            </div>
          </div>
          
          <div className="lg:col-span-7">
            <FadeIn>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Benchmark 1 */}
                <div className="bg-muted/50 border border-border rounded-xl p-5 hover:bg-muted transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">US 10-Year Treasury</h4>
                      <div className="text-2xl font-poppins font-bold text-foreground mt-1">4.28%</div>
                    </div>
                    <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-0.5" /> +2.4 bps
                    </div>
                  </div>
                  <div className="h-10 w-full relative">
                     <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                       <path d="M0 25 Q25 25 50 15 T100 5" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
                     </svg>
                  </div>
                </div>

                {/* Benchmark 2 */}
                <div className="bg-muted/50 border border-border rounded-xl p-5 hover:bg-muted transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">S&P 500 Index</h4>
                      <div className="text-2xl font-poppins font-bold text-foreground mt-1">5,142.30</div>
                    </div>
                    <div className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1 rounded flex items-center">
                      <ArrowDownRight className="h-3 w-3 mr-0.5" /> -0.45%
                    </div>
                  </div>
                  <div className="h-10 w-full relative">
                     <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                       <path d="M0 5 Q25 10 50 20 T100 25" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
                     </svg>
                  </div>
                </div>
                
                {/* Benchmark 3 */}
                <div className="bg-muted/50 border border-border rounded-xl p-5 hover:bg-muted transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gold (COMEX)</h4>
                      <div className="text-2xl font-poppins font-bold text-foreground mt-1">$2,341.50</div>
                    </div>
                    <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-0.5" /> +1.20%
                    </div>
                  </div>
                  <div className="h-10 w-full relative">
                     <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                       <path d="M0 20 Q25 25 50 10 T100 5" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
                     </svg>
                  </div>
                </div>

                {/* Benchmark 4 */}
                <div className="bg-muted/50 border border-border rounded-xl p-5 hover:bg-muted transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">SOFR Rate</h4>
                      <div className="text-2xl font-poppins font-bold text-foreground mt-1">5.31%</div>
                    </div>
                    <div className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-1 rounded flex items-center">
                      — 0.0 bps
                    </div>
                  </div>
                  <div className="h-10 w-full relative">
                     <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                       <path d="M0 15 L100 15" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4"/>
                     </svg>
                  </div>
                </div>

              </div>
            </FadeIn>
          </div>

        </div>
      </div>
    </section>
  );
};
