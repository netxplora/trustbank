import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, PieChart, TrendingUp, Shield } from "lucide-react";
import { SlideUp, FadeIn, StaggerContainer, StaggerItem } from "./Motion";

export function WealthShowcase() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950 text-foreground dark:text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-success/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="order-2 lg:order-1 relative">
            <FadeIn>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 backdrop-blur-sm aspect-square md:aspect-[4/3] lg:aspect-square flex flex-col p-8">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground dark:text-white/50 mb-2 block">Portfolio Performance</span>
                    <div className="text-3xl md:text-4xl font-poppins font-bold text-foreground dark:text-white">+14.82%</div>
                  </div>
                  <div className="bg-success/20 text-success p-2 rounded-lg">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>

                {/* Abstract Data Visualization */}
                <div className="flex-1 relative w-full h-full flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full rounded-full border border-slate-200 dark:border-white/10 animate-[spin_60s_linear_infinite]" />
                    <div className="absolute w-[80%] h-[80%] rounded-full border border-primary/30 border-t-primary animate-[spin_40s_linear_infinite_reverse]" />
                    <div className="absolute w-[60%] h-[60%] rounded-full border border-slate-200 dark:border-white/10 border-b-emerald-400 animate-[spin_20s_linear_infinite]" />
                  </div>
                  <div className="relative z-10 text-center">
                    <span className="text-sm font-bold text-muted-foreground dark:text-white/50 uppercase tracking-widest block mb-1">Total Assets</span>
                    <span className="text-2xl font-mono font-bold text-foreground dark:text-white">$4,250,000</span>
                  </div>
                </div>

                <div className="mt-12 flex justify-between gap-4">
                  <div className="bg-slate-200/60 dark:bg-white/5 rounded-xl p-4 flex-1 border border-slate-300/50 dark:border-white/5">
                    <span className="block text-[10px] uppercase tracking-widest text-muted-foreground dark:text-white/50 mb-1">Equities</span>
                    <span className="block font-bold text-foreground dark:text-white">65%</span>
                  </div>
                  <div className="bg-slate-200/60 dark:bg-white/5 rounded-xl p-4 flex-1 border border-slate-300/50 dark:border-white/5">
                    <span className="block text-[10px] uppercase tracking-widest text-muted-foreground dark:text-white/50 mb-1">Fixed Income</span>
                    <span className="block font-bold text-foreground dark:text-white">25%</span>
                  </div>
                  <div className="bg-slate-200/60 dark:bg-white/5 rounded-xl p-4 flex-1 border border-slate-300/50 dark:border-white/5">
                    <span className="block text-[10px] uppercase tracking-widest text-muted-foreground dark:text-white/50 mb-1">Alternatives</span>
                    <span className="block font-bold text-foreground dark:text-white">10%</span>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          <div className="order-1 lg:order-2">
            <SlideUp>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">Private Wealth Management</h2>
              <h3 className="text-3xl md:text-5xl font-poppins font-bold text-foreground dark:text-white mb-6">
                Preserve and grow your legacy.
              </h3>
              <p className="text-lg text-muted-foreground dark:text-white/70 font-sans mb-10 leading-relaxed">
                Our bespoke advisory services combine institutional-grade investment strategies with personalized financial planning to help you achieve your long-term objectives.
              </p>

              <StaggerContainer className="space-y-6 mb-10">
                <StaggerItem className="flex items-start gap-4">
                  <div className="mt-1 bg-slate-100 dark:bg-white/10 p-2 rounded-lg text-primary">
                    <PieChart className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground dark:text-white text-lg">Custom Portfolio Strategy</h4>
                    <p className="text-muted-foreground dark:text-white/60 text-sm mt-1">Tailored asset allocation based on your unique risk profile and time horizon.</p>
                  </div>
                </StaggerItem>
                <StaggerItem className="flex items-start gap-4">
                  <div className="mt-1 bg-slate-100 dark:bg-white/10 p-2 rounded-lg text-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground dark:text-white text-lg">Estate & Trust Services</h4>
                    <p className="text-muted-foreground dark:text-white/60 text-sm mt-1">Comprehensive structuring to protect your assets across generations.</p>
                  </div>
                </StaggerItem>
                <StaggerItem className="flex items-start gap-4">
                  <div className="mt-1 bg-slate-100 dark:bg-white/10 p-2 rounded-lg text-primary">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground dark:text-white text-lg">Alternative Investments</h4>
                    <p className="text-muted-foreground dark:text-white/60 text-sm mt-1">Exclusive access to private equity, real estate, and hedge funds.</p>
                  </div>
                </StaggerItem>
              </StaggerContainer>

              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-14 rounded-xl transition-all shadow-lg shadow-primary/25" asChild>
                <Link to="/info/wealth-management">
                  Meet an Advisor <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </SlideUp>
          </div>

        </div>
      </div>
    </section>
  );
}
