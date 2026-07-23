import { Link } from "react-router-dom";
import { ArrowRight, Smartphone, Globe, Shield, Zap, ShoppingCart, Coffee, ArrowUpRight, ArrowDownRight, TrendingUp, User } from "lucide-react";
import { SlideUp, FadeIn, StaggerContainer, StaggerItem } from "./Motion";

export function MobileShowcase() {
  return (
    <section className="py-24 bg-white dark:bg-slate-900 relative overflow-hidden">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="order-2 lg:order-1">
            <SlideUp>
              <div className="inline-flex items-center gap-2 mb-6 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                <Smartphone className="h-4 w-4" />
                <span>Digital Platform</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-poppins font-bold text-slate-900 dark:text-white mb-6">
                Your bank. Wherever you are.
              </h2>
              <p className="text-lg text-slate-600 dark:text-white/70 font-sans mb-10 leading-relaxed">
                Experience seamless banking across all your devices. From international wire transfers to real-time portfolio analysis, our award-winning digital platform puts total financial control at your fingertips.
              </p>

              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                <StaggerItem>
                  <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-white/5 border dark:border-white/10 flex items-center justify-center text-primary mb-4">
                    <Globe className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Global Access</h4>
                  <p className="text-sm text-slate-600 dark:text-white/60">Manage multi-currency accounts and execute international payments instantly.</p>
                </StaggerItem>
                <StaggerItem>
                  <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-white/5 border dark:border-white/10 flex items-center justify-center text-primary mb-4">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Real-Time Insights</h4>
                  <p className="text-sm text-slate-600 dark:text-white/60">Track spending, analyze investments, and receive instant transaction alerts.</p>
                </StaggerItem>
                <StaggerItem>
                  <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-white/5 border dark:border-white/10 flex items-center justify-center text-primary mb-4">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Biometric Security</h4>
                  <p className="text-sm text-slate-600 dark:text-white/60">Secure login with Face ID and dynamic authorization for high-value transfers.</p>
                </StaggerItem>
                <StaggerItem>
                  <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-white/5 border dark:border-white/10 flex items-center justify-center text-primary mb-4">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Mobile Check Deposit</h4>
                  <p className="text-sm text-slate-600 dark:text-white/60">Deposit checks securely in seconds from anywhere in the world.</p>
                </StaggerItem>
              </StaggerContainer>

              <div className="flex flex-wrap gap-4">
                <a href="#" className="inline-block transition-transform hover:-translate-y-1">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" className="h-10" />
                </a>
                <a href="#" className="inline-block transition-transform hover:-translate-y-1">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="h-10" />
                </a>
              </div>
            </SlideUp>
          </div>

          <div className="order-1 lg:order-2 relative">
            <FadeIn>
              {/* Abstract decorative elements behind phones */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square bg-gradient-to-tr from-primary/5 to-slate-100 dark:to-slate-800 rounded-full blur-3xl -z-10" />
              
              <div className="relative h-[600px] w-full max-w-md mx-auto">
                {/* Main Phone Mockup */}
                <div className="absolute top-0 left-[10%] w-[80%] h-[95%] bg-slate-900 dark:bg-slate-950 rounded-[3rem] p-3 shadow-2xl border-4 border-slate-800 dark:border-slate-800 z-20 animate-[float_6s_ease-in-out_infinite]">
                  <div className="w-full h-full rounded-[2.25rem] overflow-hidden bg-white dark:bg-slate-900 relative">
                    {/* Simulated App UI */}
                    <div className="bg-primary p-6 text-white h-[200px] relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                      <div className="flex justify-between items-center mb-6 relative z-10">
                        <div>
                          <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Good Morning</span>
                          <div className="text-sm font-bold">Alex Morgan</div>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-md">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="relative z-10">
                        <span className="text-[10px] text-white/70 uppercase tracking-widest block mb-1">Total Balance</span>
                        <div className="text-3xl font-poppins font-bold tracking-tight">$142,590.00</div>
                        <div className="flex items-center gap-1 mt-2 text-[10px] font-bold bg-white/20 w-fit px-2 py-1 rounded-full backdrop-blur-md">
                          <TrendingUp className="h-3 w-3" /> +2.4% this month
                        </div>
                      </div>
                    </div>
                    <div className="p-5 -mt-6 bg-slate-50 dark:bg-slate-900 rounded-t-[1.5rem] h-full relative z-10 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
                      <div className="grid grid-cols-4 gap-3 mb-6">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border dark:border-white/5 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer">
                            <ArrowUpRight className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-white/60">Send</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border dark:border-white/5 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer">
                            <ArrowDownRight className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-white/60">Receive</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border dark:border-white/5 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer">
                            <Globe className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-white/60">Wire</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border dark:border-white/5 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer">
                            <Smartphone className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-white/60">Deposit</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/50">Recent Activity</span>
                        <span className="text-[10px] font-bold text-primary cursor-pointer">See All</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border dark:border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                              <Coffee className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">Starbucks</div>
                              <div className="text-[10px] text-slate-500">Today, 8:24 AM</div>
                            </div>
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">-$5.40</div>
                        </div>

                        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border dark:border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                              <ShoppingCart className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">Apple Store</div>
                              <div className="text-[10px] text-slate-500">Yesterday</div>
                            </div>
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">-$99.00</div>
                        </div>

                        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border dark:border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                              <ArrowDownRight className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">Salary Deposit</div>
                              <div className="text-[10px] text-slate-500">Nov 15, 2026</div>
                            </div>
                          </div>
                          <div className="text-xs font-bold text-success">+$4,250.00</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Phone (Behind) */}
                <div className="absolute top-12 -right-4 w-[75%] h-[85%] bg-slate-800 dark:bg-slate-900 rounded-[3rem] p-3 shadow-xl border-4 border-slate-700 dark:border-slate-800 z-10 animate-[float_8s_ease-in-out_infinite_reverse] opacity-80 blur-[1px]">
                  <div className="w-full h-full rounded-[2.25rem] overflow-hidden bg-slate-900 relative">
                    <div className="p-5 pt-8">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Investments</span>
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-2xl font-poppins font-bold text-white mb-1">$84,302.50</div>
                      <div className="text-xs font-bold text-success mb-6">+12.5% All Time</div>
                      
                      {/* Fake Chart */}
                      <div className="h-24 w-full flex items-end justify-between gap-1 mb-6">
                        {[40, 55, 45, 60, 50, 70, 65, 80, 75, 90, 85, 100].map((h, i) => (
                          <div key={i} className="w-full bg-primary/50 rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div className="bg-slate-800 p-3 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-white">S&P 500 ETF</span>
                            <span className="text-xs font-bold text-white">$45,120.00</span>
                          </div>
                          <div className="text-[10px] text-success">+8.4%</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-white">Tech Fund</span>
                            <span className="text-xs font-bold text-white">$39,182.50</span>
                          </div>
                          <div className="text-[10px] text-success">+18.2%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </section>
  );
}
