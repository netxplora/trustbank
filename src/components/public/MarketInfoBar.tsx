import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

const marketData = [
  { symbol: "EUR/USD", price: "1.0845", change: "+0.12%", up: true },
  { symbol: "GBP/USD", price: "1.2630", change: "-0.05%", up: false },
  { symbol: "USD/JPY", price: "150.20", change: "+0.34%", up: true },
  { symbol: "GOLD", price: "$2,034.50", change: "+0.85%", up: true },
  { symbol: "BRENT", price: "$82.10", change: "-1.20%", up: false },
  { symbol: "S&P 500", price: "5,088.80", change: "+0.03%", up: true },
  { symbol: "NASDAQ", price: "15,996.82", change: "-0.28%", up: false },
  { symbol: "US 10Y", price: "4.25%", change: "+0.01", up: true },
];

export function MarketInfoBar() {
  return (
    <div className="w-full bg-slate-100 dark:bg-slate-950 border-y border-slate-200 dark:border-white/5 py-2 overflow-hidden flex items-center relative z-40 text-xs font-sans">
      <div className="container flex items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-slate-500 dark:text-white/50 uppercase tracking-widest font-bold shrink-0 mr-6">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span>Live Markets</span>
        </div>
        
        {/* Scrolling wrapper */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex whitespace-nowrap animate-marquee items-center space-x-8">
            {/* Double the data for seamless looping */}
            {[...marketData, ...marketData].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-slate-900 dark:text-white font-medium">{item.symbol}</span>
                <span className="text-slate-700 dark:text-white/80 font-mono">{item.price}</span>
                <span className={`flex items-center font-mono ${item.up ? 'text-success' : 'text-destructive'}`}>
                  {item.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {item.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
