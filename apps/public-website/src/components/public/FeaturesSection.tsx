import { ArrowRightLeft, Receipt, Phone, FileText, UserPlus, History } from "lucide-react";

const features = [
  { icon: ArrowRightLeft, title: "Domestic & International Wires", description: "Send money securely across the globe with competitive exchange rates." },
  { icon: Receipt, title: "Automated Bill Pay", description: "Schedule and manage payments for all your recurring expenses seamlessly." },
  { icon: Phone, title: "Dedicated Concierge", description: "24/7 priority support from your dedicated relationship manager." },
  { icon: FileText, title: "Commercial Lending", description: "Flexible credit solutions designed for enterprise growth and expansion." },
  { icon: UserPlus, title: "Private Wealth Management", description: "Exclusive access to tailored investment strategies and advisory." },
  { icon: History, title: "Advanced Analytics", description: "Comprehensive financial reporting and portfolio performance tracking." },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-surface">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Digital Banking</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Everything at Your Fingertips</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage your finances anytime, anywhere with our powerful digital banking features.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
