import { 
  ArrowRightLeft, Receipt, CreditCard, TrendingUp, ShieldCheck, 
  Wallet, FileText, Bell, Settings, Bitcoin, Smartphone, Wifi, QrCode, Download 
} from "lucide-react";
import { Link } from "react-router-dom";
import { SlideUp, StaggerContainer, StaggerItem } from "@/components/public/Motion";

const serviceCategories = [
  {
    title: "Money Movement",
    items: [
      { icon: ArrowRightLeft, label: "Transfer Money", to: "/dashboard/transfers", color: "text-primary", bg: "bg-primary/10" },
      { icon: Download, label: "Receive Money", to: "/dashboard/deposit", color: "text-success", bg: "bg-success/10" },
      { icon: QrCode, label: "QR Payment", to: "/dashboard/payments", color: "text-secondary", bg: "bg-secondary/10" },
    ]
  },
  {
    title: "Payments & Bills",
    items: [
      { icon: Receipt, label: "Pay Bills", to: "/dashboard/payments", color: "text-warning", bg: "bg-warning/10" },
      { icon: Smartphone, label: "Prepaid Refill", to: "/dashboard/payments", color: "text-primary", bg: "bg-primary/10" },
      { icon: Wifi, label: "Data Plan", to: "/dashboard/payments", color: "text-success", bg: "bg-success/10" },
    ]
  },
  {
    title: "Financial Products",
    items: [
      { icon: Wallet, label: "Accounts", to: "/dashboard/accounts", color: "text-primary", bg: "bg-primary/10" },
      { icon: CreditCard, label: "Cards", to: "/dashboard/cards", color: "text-secondary", bg: "bg-secondary/10" },
      { icon: TrendingUp, label: "Loans", to: "/dashboard/loans", color: "text-warning", bg: "bg-warning/10" },
      { icon: Bitcoin, label: "Investments", to: "/dashboard/investments", color: "text-success", bg: "bg-success/10" },
    ]
  },
  {
    title: "Account Management",
    items: [
      { icon: FileText, label: "eStatements", to: "/dashboard/statements", color: "text-muted-foreground", bg: "bg-muted" },
      { icon: ShieldCheck, label: "KYC Verification", to: "/dashboard/kyc", color: "text-primary", bg: "bg-primary/10" },
      { icon: Bell, label: "Notifications", to: "/dashboard/notifications", color: "text-warning", bg: "bg-warning/10" },
      { icon: Settings, label: "Security", to: "/dashboard/security", color: "text-muted-foreground", bg: "bg-muted" },
    ]
  }
];

export default function ServicesPage() {
  return (
    <div className="space-y-5 max-w-6xl mx-auto px-1 sm:px-4 py-2 pb-8 font-sans">
      <SlideUp>
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Services</h1>
          <p className="text-xs text-muted-foreground">Access all banking features and actions</p>
        </div>
      </SlideUp>

      {serviceCategories.map((category, index) => (
        <SlideUp key={category.title} delay={0.1 * index}>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5 pl-0.5">{category.title}</h2>
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {category.items.map(({ icon: Icon, label, to, color, bg }) => (
              <StaggerItem key={label}>
                <Link to={to} className="bg-card/40 backdrop-blur-md rounded-xl p-3 sm:p-3.5 border border-border/50 hover:bg-card/80 transition-all duration-200 text-center group block hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 relative overflow-hidden h-full flex flex-col items-center justify-center">
                  <div className="absolute top-0 right-0 w-10 h-10 bg-primary/0 rounded-full blur-[15px] transition-colors duration-300 group-hover:bg-primary/10 pointer-events-none" />
                  <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2 border border-border/40 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-200`}>
                    <Icon className={`h-4 w-4 ${color} transition-colors`} strokeWidth={2} />
                  </div>
                  <p className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{label}</p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </SlideUp>
      ))}
    </div>
  );
}
