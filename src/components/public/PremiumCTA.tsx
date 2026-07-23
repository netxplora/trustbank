import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { SlideUp, FadeIn } from "./Motion";
import { Button } from "@/components/ui/button";

export function PremiumCTA() {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-100 dark:bg-slate-900 text-foreground dark:text-white">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop" 
          alt="Modern architecture" 
          className="w-full h-full object-cover opacity-10 dark:opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-200 via-slate-100/80 to-transparent dark:from-slate-950 dark:via-slate-900/80 dark:to-transparent" />
      </div>

      {/* TrustBank Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] dark:opacity-5 pointer-events-none select-none z-0">
        <span className="text-[20rem] font-poppins font-black tracking-tighter whitespace-nowrap">TRUSTBANK</span>
      </div>

      {/* Soft gradient lighting */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-primary/20 blur-[100px] pointer-events-none z-0" />

      <div className="container px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <SlideUp className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-8 bg-slate-200/80 dark:bg-white/5 border border-slate-300 dark:border-white/10 backdrop-blur-md px-5 py-2 rounded-full shadow-2xl">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-foreground/90 dark:text-white/90">
              Start Your Journey
            </span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-poppins font-bold tracking-tight leading-tight mb-6 text-foreground dark:text-white">
            Elevate your financial experience today.
          </h2>
          
          <p className="text-xl text-muted-foreground dark:text-white/70 font-sans mb-12 leading-relaxed">
            Join thousands of individuals and enterprises worldwide who trust us with their financial future. Open an account online in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-5 mb-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 h-14 rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-3 text-base" asChild>
              <Link to="/register">
                Open an Account <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-slate-300 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-white/10 text-foreground dark:text-white font-semibold px-10 h-14 rounded-xl transition-all text-base flex items-center justify-center" asChild>
              <Link to="/contact">Contact Advisory</Link>
            </Button>
          </div>
        </SlideUp>

        <FadeIn delay={0.2} className="flex justify-center gap-8 border-t border-slate-300 dark:border-white/10 pt-8 mt-8">
          <div className="flex items-center gap-2 text-muted-foreground dark:text-white/50 text-sm font-bold uppercase tracking-widest">
            <span>FDIC Insured</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground dark:text-white/50 text-sm font-bold uppercase tracking-widest">
            <span>Equal Housing Lender</span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
