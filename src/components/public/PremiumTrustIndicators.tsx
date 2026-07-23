import { StaggerContainer, StaggerItem, SlideUp } from "./Motion";

const stats = [
  { value: "$125B+", label: "Assets Under Management" },
  { value: "4.5M+", label: "Clients Globally" },
  { value: "99.99%", label: "Platform Uptime" },
  { value: "30+", label: "Years of Excellence" },
];

export function PremiumTrustIndicators() {
  return (
    <section className="py-20 bg-background border-b relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        <SlideUp className="text-center mb-16">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">Institutional Strength</h2>
          <p className="text-3xl md:text-4xl font-poppins font-bold text-foreground">
            A foundation built on <span className="font-serif italic text-primary">trust</span> and performance.
          </p>
        </SlideUp>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, idx) => (
            <StaggerItem key={idx} className="text-center group">
              <div className="relative inline-block mb-4">
                <div className="text-4xl md:text-5xl lg:text-6xl font-poppins font-bold text-foreground tracking-tight">
                  {stat.value}
                </div>
                {/* Subtle highlight behind the number on hover */}
                <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
