import { RevealOnScroll } from "@/components/public/RevealOnScroll";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
  textColor?: "default" | "light";
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  centered = true,
  textColor = "default",
}: SectionHeaderProps) {
  const isLight = textColor === "light";
  return (
    <RevealOnScroll>
      <div className={`mb-6 sm:mb-12 max-w-3xl ${centered ? "mx-auto text-center" : ""}`}>
        {eyebrow && (
          <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] mb-2 sm:mb-4 ${isLight ? "text-secondary" : "text-primary"}`}>
            {eyebrow}
          </p>
        )}
        <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-poppins font-bold tracking-tight mb-3 sm:mb-6 ${isLight ? "text-foreground" : "text-foreground"}`}>
          {title}
        </h2>
        {description && (
          <p className={`text-xs sm:text-sm md:text-base font-sans leading-relaxed ${isLight ? "text-slate-300" : "text-muted-foreground"}`}>
            {description}
          </p>
        )}
      </div>
    </RevealOnScroll>
  );
}
