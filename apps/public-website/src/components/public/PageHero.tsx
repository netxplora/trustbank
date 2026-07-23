import { RevealOnScroll } from "./RevealOnScroll";
import { ShieldCheck, Lock, Building2, ArrowRight } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Link } from "react-router-dom";

interface PageHeroProps {
  title: string;
  description: string;
  image: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  stats?: { value: string; label: string }[];
  showTrustBadges?: boolean;
}

export function PageHero({
  title,
  description,
  image,
  primaryCtaText,
  primaryCtaLink,
  secondaryCtaText,
  secondaryCtaLink,
  stats,
  showTrustBadges = true,
}: PageHeroProps) {
  return (
    <section className="relative min-h-[500px] flex items-center py-20 md:py-28 overflow-hidden bg-gradient-to-br from-[#1c1c1c] via-[#252018] to-[#0d0b08] text-white border-b border-[#A67823]/30">
      {/* Dynamic Background Photography - aligned right, fades left */}
      <div className="absolute right-0 top-0 w-full lg:w-3/5 h-full z-0 select-none">
        <div className="absolute inset-0 bg-[#A67823]/10 mix-blend-overlay z-10" />
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover object-center opacity-50 lg:opacity-70"
          loading="eager"
        />
        {/* Soft blend mask for perfect text readability and depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b08] via-[#0d0b08]/60 to-transparent lg:bg-gradient-to-r lg:from-[#0d0b08] lg:via-[#0d0b08]/50 lg:to-transparent z-20" />
      </div>

      {/* Subtle background glow */}
      <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-yellow-500/10 rounded-full blur-[160px] pointer-events-none z-0" />

      <div className="container relative z-30 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-3xl">
          <RevealOnScroll>
            {/* Premium Sub-tag */}
            <div className="inline-flex items-center gap-3 mb-8 bg-yellow-900/20 border border-yellow-700/30 backdrop-blur-md px-5 py-2 rounded-full shadow-2xl">
              <span className="h-2 w-2 rounded-full bg-[#C7993E] animate-pulse shadow-[0_0_8px_rgba(199,153,62,0.8)]" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-[#F8E298] to-[#C7993E]">
                Private Advisory & Premium Services
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-poppins font-bold tracking-tight mb-8 leading-[1.1] text-white">
              {title}
            </h1>

            {/* Supporting Description */}
            <p className="text-lg md:text-xl text-white/70 font-sans leading-relaxed max-w-xl mb-12">
              {description}
            </p>

            {/* Action Buttons */}
            {(primaryCtaText || secondaryCtaText) && (
              <div className="flex flex-col sm:flex-row gap-5 mb-14">
                {primaryCtaText && primaryCtaLink && (
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-[#C7993E] to-[#A67823] hover:from-[#F8E298] hover:to-[#C7993E] text-[#1a1408] font-bold px-10 h-14 rounded-2xl transition-all shadow-[0_10px_30px_rgba(199,153,62,0.3)] flex items-center justify-center gap-3 text-base"
                    asChild
                  >
                    <Link to={primaryCtaLink}>
                      {primaryCtaText} <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                )}
                {secondaryCtaText && secondaryCtaLink && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-yellow-700/40 hover:bg-yellow-900/20 text-yellow-100 font-semibold px-10 h-14 rounded-2xl transition-all text-base flex items-center justify-center"
                    asChild
                  >
                    <Link to={secondaryCtaLink}>{secondaryCtaText}</Link>
                  </Button>
                )}
              </div>
            )}

            {/* Optional Financial Metrics / Statistics */}
            {stats && stats.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-white/10 mb-10 max-w-3xl">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-3xl md:text-4xl font-bold font-poppins text-white">
                      {stat.value}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-white/50 mt-2">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Key Trust Indicators */}
            {showTrustBadges && (
              <div className="flex flex-wrap gap-8 pt-8 border-t border-white/10 max-w-3xl">
                <div className="flex items-center gap-3 group">
                  <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-white/80 uppercase tracking-widest">FDIC Member</span>
                </div>
                <div className="flex items-center gap-3 group">
                  <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-white/80 uppercase tracking-widest">256-bit Secure</span>
                </div>
                <div className="flex items-center gap-3 group">
                  <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-white/80 uppercase tracking-widest">Equal Housing</span>
                </div>
              </div>
            )}
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}


