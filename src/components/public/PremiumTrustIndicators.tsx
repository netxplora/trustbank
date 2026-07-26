import { StaggerContainer, StaggerItem, SlideUp } from "./Motion";
import { ShieldCheck, Users, Clock, Globe } from "lucide-react";

const stats = [
  {
    value: "$125B+",
    label: "Assets Under Management",
    icon: ShieldCheck,
    description: "Total assets held and managed on behalf of our clients worldwide."
  },
  {
    value: "4.5M+",
    label: "Clients Globally",
    icon: Users,
    description: "Individuals, families, and businesses we serve across all markets."
  },
  {
    value: "99.99%",
    label: "Platform Uptime",
    icon: Clock,
    description: "Consistent, reliable access to your accounts and services every day."
  },
  {
    value: "30+",
    label: "Years of Service",
    icon: Globe,
    description: "Three decades of providing trusted financial services to our clients."
  },
];

export function PremiumTrustIndicators() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-background border-b relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <SlideUp className="text-center mb-8 sm:mb-12 lg:mb-16">
          <span className="inline-block text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">
            Institutional Strength
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-poppins font-bold text-foreground leading-tight max-w-xl mx-auto">
            A foundation built on{" "}
            <span className="font-serif italic text-primary">trust</span>{" "}
            and performance.
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto font-sans leading-relaxed">
            Our track record and scale reflect a commitment to operating with integrity and delivering results for the people we serve.
          </p>
        </SlideUp>

        {/* Stats Grid */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map(({ value, label, description, icon: Icon }, idx) => (
            <StaggerItem key={idx}>
              <div className="group relative bg-card border border-border/60 rounded-2xl p-5 sm:p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full flex flex-col">
                {/* Subtle hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Icon */}
                <div className="relative z-10 mb-4">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>

                {/* Stat Value */}
                <div className="relative z-10 mb-1">
                  <span className="text-3xl sm:text-4xl font-poppins font-bold text-foreground tracking-tight">
                    {value}
                  </span>
                </div>

                {/* Label */}
                <p className="relative z-10 text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground/70 mb-2">
                  {label}
                </p>

                {/* Description */}
                <p className="relative z-10 text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed mt-auto">
                  {description}
                </p>

                {/* Bottom accent bar */}
                <div className="relative z-10 mt-4 h-0.5 w-8 bg-primary/30 rounded-full group-hover:w-full transition-all duration-500" />
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
