import { FadeIn, SlideUp } from "./Motion";
import { ArrowRight, CheckCircle2, Wifi } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { useBrand } from "@trustbank/shared-utils/contexts/BrandContext";
import logo from "../../assets/logo.png";

const BankCardVisual = ({ type }: { type: "virtual" | "premium" | "infinite" }) => {
  const { identity } = useBrand();
  const bankName = identity?.platform_name || "TrustBank";

  const bgColor = type === "infinite" ? "bg-[#1a1408]" : type === "premium" ? "bg-[#111]" : "bg-[#01142a]";
  const svgColor = type === "infinite" ? "text-yellow-500" : type === "premium" ? "text-neutral-400" : "text-cyan-400";
  const waveGrad1 = type === "infinite"
    ? "from-yellow-600/0 via-yellow-400/30 to-amber-500/0"
    : type === "premium"
    ? "from-white/0 via-white/20 to-neutral-500/0"
    : "from-cyan-500/0 via-cyan-400/30 to-blue-500/0";
  const waveGrad2 = type === "infinite"
    ? "from-amber-600/0 via-yellow-300/40 to-amber-600/0"
    : type === "premium"
    ? "from-neutral-600/0 via-white/30 to-neutral-600/0"
    : "from-blue-600/0 via-cyan-300/40 to-blue-600/0";
  const vignetteFrom = type === "infinite" ? "[#1a1408]" : type === "premium" ? "[#111]" : "[#01142a]";
  const tierLabel = type === "infinite" ? "Infinite Metal" : type === "premium" ? "Premium Physical" : "Virtual";
  const tierLabelColor = type === "infinite" ? "text-yellow-500" : type === "premium" ? "text-blue-300" : "text-cyan-400";
  const last4 = type === "infinite" ? "8820" : type === "premium" ? "1042" : "4281";

  return (
    <div className={`aspect-[1.58/1] rounded-xl ${bgColor} border border-white/15 p-5 flex flex-col justify-between relative overflow-hidden text-white`}>
      {/* Globe wireframe */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-80 pointer-events-none">
        <div className="absolute right-[-30%] top-[-20%] w-[90%] h-[140%] opacity-40">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full mix-blend-screen ${svgColor}`}>
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-50" />
            <path d="M 10 100 Q 100 0 190 100 Q 100 200 10 100" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-60" />
            <path d="M 10 100 Q 100 50 190 100 Q 100 150 10 100" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path d="M 100 10 Q 0 100 100 190 Q 200 100 100 10" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-60" />
            <path d="M 100 10 Q 50 100 100 190 Q 150 100 100 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>
        <div className={`absolute left-[-20%] top-[40%] -translate-y-1/2 w-[140%] h-[80px] blur-xl transform -rotate-12 mix-blend-screen bg-gradient-to-r ${waveGrad1}`}></div>
        <div className={`absolute left-[-10%] top-[45%] -translate-y-[40%] w-[120%] h-[40px] blur-md transform -rotate-6 mix-blend-screen bg-gradient-to-r ${waveGrad2}`}></div>
        <div className={`absolute inset-0 bg-gradient-to-t from-${vignetteFrom} via-transparent to-${vignetteFrom}/80`}></div>
        <div className={`absolute inset-0 bg-gradient-to-r from-${vignetteFrom} via-transparent to-${vignetteFrom}/40`}></div>
      </div>

      {/* Top row: Logo + Tier */}
      <div className="relative z-10 flex justify-between items-start">
        <div className="flex items-center gap-1.5">
          <img src={logo} alt="Logo" className="h-4 w-4 invert brightness-0 opacity-90" />
          <span className="text-[9px] font-sans font-medium tracking-widest uppercase opacity-90">{bankName}</span>
        </div>
        <span className={`text-[8px] font-bold tracking-widest uppercase ${tierLabelColor}`}>{tierLabel}</span>
      </div>

      {/* Middle: Chip + Contactless */}
      <div className="relative z-10 flex items-center gap-2.5 my-auto">
        <div className="w-8 h-6 rounded bg-gradient-to-br from-[#E2C372] via-[#F8E298] to-[#C7993E] border border-[#A67823] shadow-sm overflow-hidden flex items-center justify-center">
          <div className="w-[80%] h-[75%] border border-[#8a681c]/50 rounded-[1px]"></div>
        </div>
        <Wifi className="h-5 w-5 opacity-80 rotate-90 text-white stroke-[2]" />
      </div>

      {/* Bottom: Number + Name */}
      <div className="relative z-10">
        <div className="text-sm font-mono tracking-widest text-white/80 mb-1">•••• •••• •••• {last4}</div>
        <div className="flex justify-between items-center text-xs">
          <span className="font-sans font-medium tracking-wider uppercase text-white/70 text-[10px]">{bankName}</span>
          <span className="font-mono text-white/60">12/28</span>
        </div>
      </div>
    </div>
  );
};

export const PremiumCardShowcase = () => {
  const { identity } = useBrand();
  const bankName = identity?.platform_name || "TrustBank";

  return (
    <section className="py-24 lg:py-32 bg-background relative overflow-hidden text-foreground border-y border-border">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <SlideUp>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary block mb-4">
              The Metal Collection
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-poppins font-bold tracking-tight mb-6 text-foreground">
              Cards Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Every Need</span>
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-sans">
              From instant virtual cards to precision-milled stainless steel. {bankName} cards are designed to match how you bank — whether online, in store, or around the world.
            </p>
          </SlideUp>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          
          {/* Virtual Card */}
          <FadeIn delay={0.1} className="lg:mt-16">
            <div className="group relative bg-muted/50 border border-border rounded-3xl p-8 backdrop-blur-xl hover:bg-muted transition-colors duration-500">
              <div className="mb-8 shadow-2xl transition-transform duration-700 group-hover:scale-105 group-hover:rotate-1">
                <BankCardVisual type="virtual" />
              </div>
              <h3 className="text-xl font-bold font-poppins mb-3 text-foreground">Standard Virtual</h3>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Instant Apple/Google Pay</li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Zero FX Fees on Spend</li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Advanced Fraud Detection</li>
              </ul>
              <Button variant="outline" className="w-full bg-transparent border-border text-foreground hover:bg-muted" asChild>
                <Link to="/register">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </FadeIn>

          {/* Infinite Metal Card (Center & Larger) */}
          <FadeIn delay={0.2} className="relative z-20">
            <div className="group relative bg-gradient-to-b from-primary/10 to-transparent border border-primary/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
              <div className="absolute top-0 right-0 w-full h-full bg-primary/5 rounded-3xl blur-2xl pointer-events-none" />
              <div className="relative mb-8 shadow-2xl transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-2">
                <BankCardVisual type="infinite" />
                {/* Metallic shine sweep */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>
              </div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-2xl font-bold font-poppins text-foreground">Infinite Metal</h3>
                <span className="text-[10px] bg-primary text-primary-foreground font-bold uppercase tracking-widest px-2 py-1 rounded">Popular</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> 18g Solid Steel Construction</li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Priority 24/7 Concierge</li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Unlimited Airport Lounge Access</li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> 2.5% Cashback on All Spend</li>
              </ul>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <Link to="/register">Get Infinite Metal <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </FadeIn>

          {/* Premium Physical Card */}
          <FadeIn delay={0.3} className="lg:mt-16">
            <div className="group relative bg-muted/50 border border-border rounded-3xl p-8 backdrop-blur-xl hover:bg-muted transition-colors duration-500">
              <div className="mb-8 shadow-2xl transition-transform duration-700 group-hover:scale-105 group-hover:rotate-1">
                <BankCardVisual type="premium" />
              </div>
              <h3 className="text-xl font-bold font-poppins mb-3 text-foreground">Premium Physical</h3>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Free ATM Withdrawals Globally</li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> 1% Cashback on Spend</li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Enhanced Purchase Protection</li>
              </ul>
              <Button variant="outline" className="w-full bg-transparent border-border text-foreground hover:bg-muted" asChild>
                <Link to="/register">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </FadeIn>

        </div>
      </div>
    </section>
  );
};
