import { RevealOnScroll } from "./RevealOnScroll";
import mobileMockupBackground from "@/assets/home/mobile_app.png";
import digitalFallback from "@/assets/hero-digital.jpg";

export function MobileAppShowcase() {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Side */}
          <div className="lg:col-span-7 space-y-6">
            <RevealOnScroll>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">TrustBank Mobile App</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
                Bank on the Go, Anytime.
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed max-w-lg">
                Manage accounts, deposit checks, track investments, and transfer funds. Securely locked with biometric authentication and 256-bit encryption.
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay="100ms">
              <div className="flex flex-wrap gap-4 pt-4">
                {/* App Store Badge Coming Soon */}
                <a
                  href="/digital-banking"
                  className="inline-flex items-center gap-3 bg-black text-foreground px-5 py-2.5 rounded-xl border border-white/10 hover:bg-neutral-900 transition-colors shadow-md"
                >
                  <svg className="h-6 w-6 fill-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.82M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.11.09 2.26-.58 2.95-1.39z" />
                  </svg>
                  <div className="text-left leading-none">
                    <p className="text-[10px] uppercase text-foreground/60 tracking-wider">Download on the</p>
                    <p className="text-sm font-semibold mt-0.5">App Store</p>
                  </div>
                </a>

                {/* Play Store Coming Soon */}
                <a
                  href="/digital-banking"
                  className="inline-flex items-center gap-3 bg-black text-foreground px-5 py-2.5 rounded-xl border border-white/10 hover:bg-neutral-900 transition-colors shadow-md"
                >
                  <svg className="h-6 w-6 fill-white" viewBox="0 0 24 24">
                    <path d="M5 3.25a.75.75 0 0 0-.75.75v16c0 .41.34.75.75.75h.03l9.64-5.56L5 3.25zm11.23 6.47l-3.32 1.92-3.32-1.92L16.23 9.72zm.98.57l3.75 2.16c.36.21.36.73 0 .94l-3.75 2.16-2.27-2.63 2.27-2.63z" />
                  </svg>
                  <div className="text-left leading-none">
                    <p className="text-[10px] uppercase text-foreground/60 tracking-wider">Get it on</p>
                    <p className="text-sm font-semibold mt-0.5">Google Play</p>
                  </div>
                </a>
              </div>
            </RevealOnScroll>
          </div>

          {/* Mockup Phone Side */}
          <div className="lg:col-span-5 flex justify-center">
            <RevealOnScroll delay="200ms">
              {/* Phone Container */}
              <div className="relative mx-auto border-8 border-neutral-800 rounded-[2.5rem] h-[580px] w-[280px] shadow-2xl bg-neutral-900 overflow-hidden">
                {/* Speaker/Camera notch */}
                <div className="absolute top-0 inset-x-0 h-6 bg-neutral-800 rounded-b-xl z-20 flex justify-center items-center">
                  <div className="w-16 h-1 bg-neutral-900 rounded-full mb-1" />
                </div>
                
                {/* Looping Scrolling Screen (CSS only) */}
                <div className="absolute inset-0 z-10 w-full h-full overflow-hidden">
                  <div className="w-full animate-[marquee_15s_linear_infinite] flex flex-col gap-0 select-none">
                    <img
                      src={mobileMockupBackground}
                      alt="TrustBank Dashboard Mobile View"
                      className="w-full object-cover shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = digitalFallback;
                      }}
                    />
                    <img
                      src={mobileMockupBackground}
                      alt="TrustBank Dashboard Mobile View Duplicate"
                      className="w-full object-cover shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = digitalFallback;
                      }}
                    />
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>

        </div>
      </div>
    </section>
  );
}
