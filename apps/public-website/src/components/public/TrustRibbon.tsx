export function TrustRibbon() {
  return (
    <div className="bg-[#12141C] text-foreground/50 border-t border-white/5 py-4 text-xs">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="font-semibold text-foreground/70">TrustBank Premium Banking</span>
            <span>© 2026 TrustBank. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            {/* FDIC */}
            <div className="flex items-center gap-1.5 border border-white/20 px-2 py-0.5 rounded text-[9px] font-bold text-foreground/60">
              FDIC <span className="text-[7px] font-normal text-foreground/40">INSURED</span>
            </div>

            {/* Equal Housing */}
            <div className="flex items-center gap-1 text-[9px] font-bold text-foreground/60">
              <svg className="h-3.5 w-3.5 fill-current shrink-0 text-foreground/40" viewBox="0 0 24 24">
                <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 3.75L17.5 11v7h-11v-7L12 6.75zm-3 4.25v2.5h6V11H9z" />
              </svg>
              <span>EQUAL HOUSING LENDER</span>
            </div>

            {/* SIPC */}
            <div className="border border-white/20 px-2 py-0.5 rounded text-[9px] font-bold text-foreground/60">
              MEMBER <span className="text-secondary font-bold text-[8px]">SIPC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
