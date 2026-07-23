import { useEffect, useState, useRef } from "react";
import { FadeIn } from "./Motion";

interface StatItemProps {
  target: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  label: string;
  sublabel?: string;
}

function StatItem({ target, suffix = "", prefix = "", decimals = 0, label, sublabel }: StatItemProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime: number | null = null;
          const duration = 2200;

          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const progressPercentage = Math.min(progress / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progressPercentage, 3);
            setCount(easedProgress * target);
            if (progress < duration) requestAnimationFrame(animate);
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <div ref={ref} className="group relative text-center p-8 bg-card/50 backdrop-blur-xl rounded-2xl border border-border hover:border-primary/30 transition-all duration-500 overflow-hidden">
      {/* Hover glow */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

      <div className="relative z-10">
        <p className="text-4xl lg:text-5xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/70 mb-3">
          {prefix}
          {count.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}
          {suffix}
        </p>
        <p className="text-xs font-bold text-foreground uppercase tracking-widest mb-1">
          {label}
        </p>
        {sublabel && (
          <p className="text-[10px] text-muted-foreground font-sans">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

export function StatsCounter() {
  return (
    <section className="py-20 bg-background relative overflow-hidden border-y border-border">
      {/* Ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/8 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeIn>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatItem target={250} suffix="K+" label="Private Clients" sublabel="Across 45 states" />
            <StatItem target={12.4} prefix="$" suffix="B" decimals={1} label="Assets Under Management" sublabel="Wealth & Commercial" />
            <StatItem target={45} suffix="+" label="Wealth Advisory Centers" sublabel="Nationwide coverage" />
            <StatItem target={99.9} suffix="%" decimals={1} label="Platform Uptime" sublabel="Secure core banking" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
