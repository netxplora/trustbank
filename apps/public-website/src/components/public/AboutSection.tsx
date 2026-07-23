import { Target, Eye, Heart } from "lucide-react";

const values = [
  { icon: Target, title: "Our Mission", description: "To deliver institutional-grade financial services and bespoke wealth management to our discerning clientele." },
  { icon: Eye, title: "Our Vision", description: "To be the premier banking institution setting the standard for financial excellence, security, and innovation globally." },
  { icon: Heart, title: "Core Values", description: "Fiduciary Duty, Uncompromising Security, Client Exclusivity, and Financial Innovation guide everything we do." },
];

export function AboutSection() {
  return (
    <section className="py-20 bg-surface">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Institutional Excellence</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Your Premium Financial Partner</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            TrustBank has been serving elite clients for decades, providing sophisticated financial strategies tailored to the unique needs of high-net-worth individuals and corporate enterprises.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-card rounded-xl p-8 shadow-sm border hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
