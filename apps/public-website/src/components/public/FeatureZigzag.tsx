import { SectionHeader } from "./SectionHeader";
import { RevealOnScroll } from "./RevealOnScroll";
import { Smartphone, Shield, ArrowRightLeft, MapPin } from "lucide-react";

import digitalImg from "@/assets/hero-digital.jpg";
import aboutImg from "@/assets/hero-about.jpg";
import checkingImg from "@/assets/hero-checking.png";
import branchesImg from "@/assets/hero-branches.jpg";

const features = [
  {
    icon: Smartphone,
    title: "Mobile-First Banking Experience",
    description: "Manage accounts, check balances, deposit checks, and send money instantly using our sleek, responsive online portal designed for both mobile and desktop screens.",
    image: digitalImg,
    tag: "Convenience",
  },
  {
    icon: Shield,
    title: "AI-Powered Fraud Protection",
    description: "Your security is our absolute priority. Advanced algorithms monitor transaction patterns continuously to block fraudulent activities before they can affect your balance.",
    image: aboutImg,
    tag: "Security",
  },
  {
    icon: ArrowRightLeft,
    title: "Same-Day Direct Transfers",
    description: "Move money between internal accounts immediately, or initiate external transfers that settle on the exact same business day without delay.",
    image: checkingImg,
    tag: "Velocity",
  },
  {
    icon: MapPin,
    title: "Branch & National ATM Network",
    description: "Access your funds surcharge-free across thousands of network ATMs, or speak with our professional financial consultants at any branch near you.",
    image: branchesImg,
    tag: "Coverage",
  },
];

export function FeatureZigzag() {
  return (
    <section className="py-20 bg-surface border-y">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Why Choose Us"
          title="Safe. Fast. Accessible."
          description="We combine advanced financial technology with stable, time-tested banking security standards."
        />

        <div className="space-y-24 mt-16">
          {features.map((f, i) => {
            const Icon = f.icon;
            const isEven = i % 2 === 0;

            return (
              <div
                key={f.title}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center`}
              >
                {/* Visual side */}
                <div
                  className={`lg:col-span-6 ${
                    isEven ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  <RevealOnScroll>
                    <div className="relative rounded-2xl overflow-hidden shadow-elevated bg-muted max-h-[380px]">
                      <img
                        src={f.image}
                        alt={f.title}
                        className="w-full h-full object-cover aspect-[4/3] hover:scale-102 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
                    </div>
                  </RevealOnScroll>
                </div>

                {/* Content side */}
                <div
                  className={`lg:col-span-6 ${
                    isEven ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <RevealOnScroll delay="100ms">
                    <div className="space-y-4">
                      <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                        {f.tag}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
                        {f.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-base">
                        {f.description}
                      </p>
                      
                      <div className="pt-4 flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          Institutional Grade Performance
                        </span>
                      </div>
                    </div>
                  </RevealOnScroll>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
