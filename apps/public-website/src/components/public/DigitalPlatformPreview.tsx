import { FadeIn, SlideUp } from "./Motion";
import { Link } from "react-router-dom";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { ArrowRight, BarChart3, ShieldCheck, Smartphone } from "lucide-react";

export const DigitalPlatformPreview = () => {
  return (
    <section className="py-24 lg:py-32 bg-background border-y border-border overflow-hidden relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-900/15 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          
          {/* Text Content */}
          <div className="max-w-xl">
            <SlideUp>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary block mb-4">
                Digital Experience
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-poppins font-bold tracking-tight mb-6 text-foreground">
                Institutional Power, <br />In Your Pocket.
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-sans mb-8">
                Manage personal wealth, approve corporate wire transfers, and track global market indices all from a single, unified interface. Our platform uses end-to-end encryption to guarantee that your data is strictly yours.
              </p>
              
              <ul className="space-y-5 mb-10">
                <li className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 border border-primary/20">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Real-Time Portfolio Analytics</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Instantly view asset allocation, daily P&L, and historical performance across all linked accounts and brokerage services.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 border border-primary/20">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Role-Based Corporate Access</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Set custom limits and multi-signature requirements for team members accessing your corporate treasury.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 border border-primary/20">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Biometric & Hardware Auth</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Secure every login with Face ID or hardware security keys (FIDO2) for uncompromising account defense.</p>
                  </div>
                </li>
              </ul>
              
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20" asChild>
                <Link to="/register">Experience the Platform <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </SlideUp>
          </div>

          {/* Floating UI Presentation */}
          <div className="relative w-full h-[600px] flex justify-center items-center">
            {/* Background blobs for depth */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[500px] max-h-[500px] bg-primary/5 rounded-full blur-[80px]" />
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[60px]" />

            <FadeIn className="relative z-10 w-full max-w-[280px]">
              {/* Main Phone Mockup Layer */}
              <div className="relative bg-slate-900 border-[6px] border-slate-800 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] overflow-hidden aspect-[9/19.5]">
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
                  <div className="w-1/3 h-full bg-slate-800 rounded-b-2xl"></div>
                </div>
                
                {/* Mockup UI Content */}
                <div className="absolute inset-0 bg-slate-950 p-5 pt-10 text-white overflow-hidden flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <div className="text-[9px] text-white/50 uppercase tracking-widest mb-1">Total Balance</div>
                      <div className="text-2xl font-poppins font-bold">$1,459,200.50</div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold">JD</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mb-6">
                    <div className="flex-1 bg-primary/20 text-primary h-9 rounded-xl flex items-center justify-center text-[10px] font-bold">Transfer</div>
                    <div className="flex-1 bg-white/10 text-white h-9 rounded-xl flex items-center justify-center text-[10px] font-bold">Pay</div>
                    <div className="flex-1 bg-white/10 text-white h-9 rounded-xl flex items-center justify-center text-[10px] font-bold">Trade</div>
                  </div>

                  <div className="text-[10px] text-white/50 uppercase tracking-widest mb-3">Recent Activity</div>
                  <div className="space-y-3 flex-1">
                    {[
                      { name: "Apple Store", cat: "Electronics", amt: "-$1,299.00", i: "A", c: "bg-neutral-800 text-white" },
                      { name: "Wire Transfer", cat: "Received", amt: "+$250k", i: "\u2193", c: "bg-emerald-500/20 text-emerald-400" },
                      { name: "Soho House", cat: "Membership", amt: "-$3,200.00", i: "S", c: "bg-neutral-800 text-white" },
                      { name: "Delta Airlines", cat: "Travel", amt: "-$4,500.00", i: "D", c: "bg-blue-900/40 text-blue-400" }
                    ].map((tx, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white/5 p-2.5 rounded-2xl border border-white/5">
                        <div className="flex gap-3 items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold ${tx.c}`}>
                            {tx.i}
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold text-white/90 mb-0.5">{tx.name}</div>
                            <div className="text-[9px] text-white/50">{tx.cat}</div>
                          </div>
                        </div>
                        <div className={`text-[11px] font-mono font-medium tracking-tight ${tx.amt.startsWith('+') ? 'text-emerald-400' : 'text-white/90'}`}>{tx.amt}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Element 1: Card */}
              <div className="absolute -right-16 top-32 w-48 aspect-[1.58/1] bg-gradient-to-br from-[#1c1c1c] via-[#252018] to-[#0d0b08] border border-yellow-800/30 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] p-4 transform rotate-12 flex flex-col justify-between animate-[bounce_6s_ease-in-out_infinite]">
                <div className="absolute top-0 left-0 right-0 h-[0.5px] bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent"></div>
                <div className="flex justify-between">
                  <div className="text-[8px] text-transparent bg-clip-text bg-gradient-to-r from-[#C7993E] to-[#F8E298] font-bold tracking-widest">INFINITE</div>
                  <div className="h-4 w-6 bg-gradient-to-br from-[#E2C372] to-[#C7993E] rounded flex items-center justify-center opacity-80">
                    <span className="text-[5px] text-[#1a1408] font-bold">CHIP</span>
                  </div>
                </div>
                <div className="text-white/80 font-mono text-[10px]">•••• 8820</div>
              </div>

              {/* Floating Element 2: Notification */}
              <div className="absolute -left-12 bottom-40 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-black/5 transform -rotate-6 animate-[bounce_7s_ease-in-out_infinite] animation-delay-1000">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-emerald-600 rotate-90" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Wire Received</div>
                    <div className="text-[10px] text-slate-500">+$250,000.00 from Escrow</div>
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
