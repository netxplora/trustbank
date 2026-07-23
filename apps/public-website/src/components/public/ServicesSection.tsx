import { Wallet, Banknote, Building2, Briefcase, TrendingUp, User, Smartphone, Store, CreditCard } from "lucide-react";

const services = [
  { icon: Wallet, title: "High-Yield Savings", description: "Competitive interest rates to help you grow your capital securely." },
  { icon: Banknote, title: "Premium Checking", description: "Manage your daily finances with exclusive card access and waived fees." },
  { icon: Building2, title: "Corporate Banking", description: "Sophisticated accounts with seamless high-volume transaction capabilities." },
  { icon: Briefcase, title: "Business Accounts", description: "Tailored treasury solutions for growing enterprises with dedicated support." },
  { icon: TrendingUp, title: "Commercial Lending", description: "Structured finance and capital solutions to scale your business operations." },
  { icon: User, title: "Private Wealth", description: "Bespoke investment strategies for high-net-worth clients." },
  { icon: Smartphone, title: "Digital Banking", description: "Bank anytime, anywhere from your mobile device with our award-winning app." },
  { icon: Store, title: "Merchant Services", description: "Comprehensive payment processing solutions for modern commerce." },
  { icon: CreditCard, title: "Premium Cards", description: "Exclusive credit lines with unmatched travel and lifestyle rewards." },
];

export function ServicesSection() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Our Services</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Banking Services for Everyone</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive banking solutions designed to meet your personal and business financial needs.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map(({ icon: Icon, title, description }) => (
            <div key={title} className="group bg-card rounded-xl p-6 border hover:border-primary/20 hover:shadow-md transition-all cursor-pointer">
              <div className="h-11 w-11 rounded-lg bg-gold-light flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <Icon className="h-5 w-5 text-accent group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
