import { Trophy, Award, Star, Medal } from "lucide-react";
import { SlideUp, StaggerContainer, StaggerItem } from "./Motion";

const awards = [
  {
    icon: Trophy,
    title: "Best Private Bank",
    organization: "Global Finance Awards 2025"
  },
  {
    icon: Star,
    title: "Excellence in Digital Banking",
    organization: "Banking Tech Awards 2026"
  },
  {
    icon: Award,
    title: "Top Commercial Lender",
    organization: "Financial Times Rankings"
  },
  {
    icon: Medal,
    title: "Outstanding Security Infrastructure",
    organization: "CyberSec Banking Consortium"
  }
];

export function AwardsSection() {
  return (
    <section className="py-20 bg-slate-100 dark:bg-slate-950 text-foreground dark:text-white relative border-b border-slate-200 dark:border-white/10">
      <div className="container px-4 sm:px-6 lg:px-8">
        <SlideUp className="text-center mb-12">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground dark:text-white/50 mb-3">Industry Recognition</h2>
        </SlideUp>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {awards.map((award, idx) => (
            <StaggerItem key={idx} className="flex flex-col items-center text-center group cursor-default">
              <div className="h-16 w-16 rounded-2xl bg-slate-200/80 dark:bg-white/5 border border-slate-300 dark:border-white/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
                <award.icon className="h-8 w-8 text-foreground/70 dark:text-white/70 group-hover:text-primary transition-colors" />
              </div>
              <h4 className="font-poppins font-bold text-lg mb-2 leading-tight text-foreground dark:text-white">{award.title}</h4>
              <p className="text-xs text-muted-foreground dark:text-white/50 uppercase tracking-widest">{award.organization}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
