import { Link } from "react-router-dom";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { ArrowRight } from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";

export function CTASection() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-background text-foreground">
      {/* Ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="container relative z-10">
        <RevealOnScroll>
          <div className="relative bg-gradient-to-br from-card via-card to-muted/50 backdrop-blur-xl rounded-3xl border border-border overflow-hidden p-12 md:p-16 lg:p-20 text-center max-w-4xl mx-auto shadow-xl">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} />

            <div className="relative z-10">
              <div className="h-1 w-12 bg-primary mx-auto mb-8 rounded" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary block mb-4">
                Get Started Today
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-poppins font-bold text-foreground mb-6 tracking-tight">
                Ready to Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Financial Future</span>?
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed font-sans">
                Join thousands of clients who trust us with their personal and corporate finances. Open an account today or apply for a loan in minutes.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-14 rounded-xl transition-all shadow-lg shadow-primary/20 gap-2" asChild>
                  <Link to="/register">Open Account <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-border hover:bg-muted text-foreground font-medium px-8 h-14 rounded-xl transition-all" asChild>
                  <Link to="/loans">Apply for Loan</Link>
                </Button>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
