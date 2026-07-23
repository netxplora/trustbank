import React, { useState } from "react";
import { Calculator, Percent, DollarSign, ArrowRight } from "lucide-react";
import { FadeIn } from "./Motion";
import { Button } from "@trustbank/shared-ui/components/ui/button";

export const InteractiveCalculators = () => {
  const [amount, setAmount] = useState<number>(100000);
  const [years, setYears] = useState<number>(10);
  
  const rate = 0.0485; // 4.85% APY
  const futureValue = amount * Math.pow(1 + rate, years);
  const totalInterest = futureValue - amount;

  return (
    <section className="py-20 lg:py-32 bg-background border-y">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary block mb-3">
              Growth Projections
            </span>
            <h2 className="text-3xl md:text-4xl font-poppins font-bold text-foreground mb-6">
              Calculate Your Capital Trajectory
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground font-sans mb-8">
              Model your potential returns using our institutional high-yield deposit rates. Our treasury guarantees capital security while providing highly competitive yields on idle reserves.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Fixed APY of 4.85%</h4>
                  <p className="text-[11px] text-muted-foreground mt-1">Guaranteed on all deposit tiers above $50,000</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Zero Maintenance Fees</h4>
                  <p className="text-[11px] text-muted-foreground mt-1">100% of your capital works for you, continuously.</p>
                </div>
              </div>
            </div>
            
            <Button className="mt-10 px-8 py-6 rounded-xl" asChild>
              <a href="/register">Lock In This Rate <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </div>

          <div>
            <FadeIn delay={0.2}>
              <div className="bg-card border shadow-xl hover:shadow-[0_10px_30px_rgba(199,153,62,0.15)] transition-shadow duration-500 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" /> Yield Calculator
                  </h3>
                  <div className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full">
                    COMPOUND DAILY
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-semibold text-foreground">Initial Deposit</label>
                      <span className="text-xs font-mono font-bold text-primary">
                        ${amount.toLocaleString()}
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="10000" 
                      max="1000000" 
                      step="5000"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-semibold text-foreground">Investment Term (Years)</label>
                      <span className="text-xs font-mono font-bold text-primary">
                        {years} Years
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="30" 
                      value={years}
                      onChange={(e) => setYears(Number(e.target.value))}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-border flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-bold">Estimated Returns</p>
                    <p className="text-sm text-emerald-600 font-bold">+${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-bold">Future Balance</p>
                    <p className="text-3xl font-poppins font-bold text-foreground">
                      ${futureValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
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
