import { Link } from "react-router-dom";
import { BookOpen, Wallet, CreditCard, Landmark, ArrowRight } from "lucide-react";
import { FadeIn } from "./Motion";

const products = [
  {
    icon: BookOpen,
    label: "Checking Account",
    description: "No monthly fees, free direct deposit.",
    param: "checking",
    highlight: "No Fees",
  },
  {
    icon: Wallet,
    label: "Savings Account",
    description: "Earn up to 4.75% APY high yield savings.",
    param: "savings",
    highlight: "4.75% APY",
  },
  {
    icon: CreditCard,
    label: "Credit Card",
    description: "Flat 2% cash back on every purchase.",
    param: "credit-card",
    highlight: "2% Cash Back",
  },
  {
    icon: Landmark,
    label: "Personal Loan",
    description: "Low fixed rates with flexible terms.",
    param: "loan",
    highlight: "Fixed Rates",
  },
];

export function QuickApplyStrip() {
  return (
    <section className="py-16 bg-muted/30 border-y border-border relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] block mb-3">Apply in Minutes</span>
          <h2 className="text-2xl md:text-3xl font-poppins font-bold text-foreground">Select a product to get started</h2>
        </div>

        <FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.param}
                  to={`/register?product=${p.param}`}
                  className="group relative bg-card/50 backdrop-blur-xl rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-500 flex flex-col justify-between overflow-hidden hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Hover glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-500">
                        <Icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors duration-500" />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                        {p.highlight}
                      </span>
                    </div>
                    <h3 className="font-poppins font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300 text-base">
                      {p.label}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                      {p.description}
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-border/50 text-xs font-bold text-primary flex items-center gap-1.5 group-hover:gap-2.5 transition-all relative z-10">
                    Apply Online <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
