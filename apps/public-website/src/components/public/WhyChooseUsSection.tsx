import { Zap, Lock, Globe, Headphones } from "lucide-react";

const reasons = [
  { icon: Zap, title: "Accelerated Execution", description: "Accelerated clearing and settlement for all your transactions." },
  { icon: Lock, title: "Institutional Security", description: "AES-256 encryption and multi-factor authentication protect your assets." },
  { icon: Globe, title: "Global Accessibility", description: "Manage your wealth seamlessly across devices from any location worldwide." },
  { icon: Headphones, title: "Concierge Service", description: "Your dedicated private banking team is available around the clock." },
];

export function WhyChooseUsSection() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">The Premium Advantage</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Excellence You Can Trust</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map(({ icon: Icon, title, description }) => (
            <div key={title} className="text-center">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
