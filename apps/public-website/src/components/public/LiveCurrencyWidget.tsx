import React, { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

const mockRates = [
  { pair: "EUR/USD", rate: "1.0842", change: "+0.15%", up: true },
  { pair: "GBP/USD", rate: "1.2650", change: "-0.08%", up: false },
  { pair: "USD/JPY", rate: "150.12", change: "+0.32%", up: true },
  { pair: "AUD/USD", rate: "0.6540", change: "-0.11%", up: false },
  { pair: "USD/CHF", rate: "0.8810", change: "+0.05%", up: true },
  { pair: "USD/CAD", rate: "1.3520", change: "-0.22%", up: false },
];

export const LiveCurrencyWidget = () => {
  const [rates, setRates] = useState(mockRates);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRates((prev) =>
        prev.map((r) => {
          const changeVal = (Math.random() * 0.04 - 0.02);
          const newRate = (parseFloat(r.rate) + changeVal).toFixed(4);
          const isUp = changeVal >= 0;
          return {
            ...r,
            rate: newRate,
            change: `${isUp ? '+' : ''}${(changeVal * 100).toFixed(2)}%`,
            up: isUp
          };
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-950 text-white border-b border-white/10 overflow-hidden relative z-40 hidden md:block">
      <div className="flex items-center">
        <div className="bg-primary/20 text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-4 py-3 flex items-center gap-2 shrink-0 border-r border-white/10 backdrop-blur-md">
          <TrendingUp className="h-3 w-3" /> Live FX Rates
        </div>
        <div className="flex-1 overflow-hidden whitespace-nowrap mask-edges-sm">
          <div className="inline-flex animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused] py-3">
            {rates.map((rate, i) => (
              <div key={i} className="flex items-center gap-3 px-6 border-r border-white/10 last:border-0">
                <span className="text-[10px] text-white/50 font-bold tracking-widest">{rate.pair}</span>
                <span className="text-xs font-mono font-medium">{rate.rate}</span>
                <span className={`text-[10px] font-bold flex items-center ${rate.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {rate.up ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {rate.change}
                </span>
              </div>
            ))}
            {rates.map((rate, i) => (
              <div key={`dup-${i}`} className="flex items-center gap-3 px-6 border-r border-white/10 last:border-0">
                <span className="text-[10px] text-white/50 font-bold tracking-widest">{rate.pair}</span>
                <span className="text-xs font-mono font-medium">{rate.rate}</span>
                <span className={`text-[10px] font-bold flex items-center ${rate.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {rate.up ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {rate.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
