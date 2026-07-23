import { ShieldCheck, Lock, Fingerprint, Eye, Server, AlertTriangle } from "lucide-react";
import { SlideUp, StaggerContainer, StaggerItem } from "./Motion";

const securityFeatures = [
  {
    icon: Lock,
    title: "Bank-Grade Encryption",
    description: "Your data is protected by 256-bit AES encryption in transit and at rest."
  },
  {
    icon: Fingerprint,
    title: "Biometric Authentication",
    description: "Access your accounts securely using Face ID, Touch ID, or hardware tokens."
  },
  {
    icon: Eye,
    title: "24/7 Fraud Monitoring",
    description: "Advanced AI systems monitor your accounts round-the-clock for suspicious activity."
  },
  {
    icon: ShieldCheck,
    title: "Zero Liability Protection",
    description: "You are not responsible for unauthorized transactions made on your accounts."
  },
  {
    icon: Server,
    title: "Redundant Infrastructure",
    description: "Enterprise-grade servers ensure 99.99% uptime and immediate disaster recovery."
  },
  {
    icon: AlertTriangle,
    title: "Instant Alerts",
    description: "Receive real-time notifications for transactions, logins, and profile changes."
  }
];

export function SecuritySection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-900 text-foreground dark:text-white relative overflow-hidden">
      {/* Abstract Background Design */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          <div className="lg:col-span-5">
            <SlideUp>
              <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-primary mb-6 backdrop-blur-md">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">Enterprise Security</h2>
              <h3 className="text-3xl md:text-5xl font-poppins font-bold text-foreground dark:text-white mb-6">
                Your security is our absolute priority.
              </h3>
              <p className="text-lg text-muted-foreground dark:text-white/70 font-sans mb-8 leading-relaxed">
                We employ military-grade encryption, continuous monitoring, and strict regulatory compliance to ensure your assets and personal data remain protected at all times.
              </p>
            </SlideUp>
          </div>

          <div className="lg:col-span-7">
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {securityFeatures.map((feature, idx) => (
                <StaggerItem key={idx}>
                  <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors h-full">
                    <feature.icon className="h-6 w-6 text-primary mb-4" />
                    <h4 className="text-lg font-bold text-foreground dark:text-white mb-2">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground dark:text-white/60 leading-relaxed">{feature.description}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>

        </div>
      </div>
    </section>
  );
}
