import { Link } from "react-router-dom";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { ShieldCheck, Lock, Building2, ArrowRight } from "lucide-react";
import heroHome from "@/assets/hero-home.jpg";

const badges = [
  { icon: ShieldCheck, label: "FDIC Insured up to $250,000" },
  { icon: Lock, label: "256-bit Encryption Security" },
  { icon: Building2, label: "Equal Housing Lender" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background border-b pt-16 pb-12 md:pt-24 md:pb-20 lg:pt-32 lg:pb-28">
      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="max-w-2xl order-2 lg:order-1">
            <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
              Tier-1 National Premium Banking & Wealth
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 tracking-tight">
              Secure & Accessible <br />Banking for Your Future
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-lg">
              Experience premium digital banking with TrustBank. Manage your accounts, grow your wealth, and secure business financing with institutional-grade security.
            </p>
            <div className="flex flex-wrap gap-4 mb-12">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" asChild>
                <Link to="/register">Open Account <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Internet Banking</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6">
              {badges.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2 relative h-[300px] sm:h-[400px] lg:h-[600px] w-full rounded-2xl overflow-hidden shadow-elevated">
            <img 
              src={heroHome} 
              alt="TrustBank digital banking dashboard and premium experience" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}

