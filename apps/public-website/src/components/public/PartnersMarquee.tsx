import { Building2 } from "lucide-react";

export function PartnersMarquee() {
  return (
    <section className="py-8 bg-card border-b overflow-hidden relative select-none">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-card to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-card to-transparent z-10" />

      <div className="marquee-content">
        {/* Render twice for seamless looping */}
        {[1, 2].map((loop) => (
          <div key={loop} className="flex gap-16 items-center shrink-0 min-w-full justify-around">
            {/* Visa */}
            <span className="text-xl font-extrabold italic text-primary tracking-tighter">VISA</span>
            
            {/* Mastercard */}
            <div className="flex items-center gap-1.5 opacity-60">
              <div className="h-6 w-6 rounded-full bg-[#EB001B] shrink-0" />
              <div className="h-6 w-6 rounded-full bg-[#F79E1B] -ml-3.5 shrink-0" />
              <span className="text-sm font-semibold text-foreground tracking-tight ml-1">mastercard</span>
            </div>

            {/* Zelle */}
            <span className="text-lg font-bold text-[#7414CA] opacity-75">zelle</span>

            {/* FDIC Badge */}
            <div className="flex items-center border border-foreground/30 px-2 py-0.5 rounded text-[10px] font-bold text-foreground/60 tracking-wider">
              FDIC <span className="text-[8px] font-medium ml-1">INSURED</span>
            </div>

            {/* Equal Housing Badge */}
            <div className="flex items-center gap-1 text-[10px] font-bold text-foreground/60">
              <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 3.75L17.5 11v7h-11v-7L12 6.75zm-3 4.25v2.5h6V11H9z" />
              </svg>
              <span>EQUAL HOUSING LENDER</span>
            </div>

            {/* Member SIPC */}
            <div className="border border-foreground/30 px-2 py-0.5 rounded text-[10px] font-bold text-foreground/60 tracking-wider">
              MEMBER <span className="text-primary font-extrabold text-[9px]">SIPC</span>
            </div>

            {/* Federal Reserve System */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/50 border-l border-r border-foreground/30 px-4 tracking-wider">
              <Building2 className="h-4 w-4 shrink-0" />
              <span>FEDERAL RESERVE SYSTEM</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
