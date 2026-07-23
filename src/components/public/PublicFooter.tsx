import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Shield, Lock, ArrowRight, Instagram, Linkedin, Twitter, Facebook } from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";

const bankingLinks = [
  { label: "Personal Checking", to: "/checking" },
  { label: "High-Yield Savings", to: "/savings" },
  { label: "Commercial Lending", to: "/info/business-loans" },
  { label: "Digital Banking Suite", to: "/digital-banking" },
  { label: "Private Wealth Advisory", to: "/info/wealth-management" },
];

const companyLinks = [
  { label: "About TrustBank", to: "/about" },
  { label: "Careers & Leadership", to: "/careers" },
  { label: "Market News & Insights", to: "/news" },
  { label: "Investor Relations", to: "/info/investor-relations" },
  { label: "Sustainability", to: "/info/corporate-responsibility" },
];

const supportLinks = [
  { label: "Help & FAQ Center", to: "/faq" },
  { label: "Contact Private Office", to: "/contact" },
  { label: "Branch & ATM Finder", to: "/branches" },
  { label: "Security Center", to: "/info/security-features" },
];

const legalLinks = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
  { label: "Cookie Policy", to: "/privacy" },
  { label: "Regulatory Compliance", to: "/privacy" },
];

export function PublicFooter() {
  const { identity, corporate, visuals } = useBrand();

  return (
    <footer className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-white/70 font-sans border-t border-slate-200 dark:border-white/5 relative z-10">
      
      {/* Top Section: Newsletter & App */}
      <div className="border-b border-slate-200 dark:border-white/5 py-12">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h4 className="text-xl font-poppins font-bold text-slate-900 dark:text-white mb-2">Subscribe to Market Insights</h4>
              <p className="text-sm text-slate-600 dark:text-white/60 mb-6 max-w-md">Receive weekly analyses, economic forecasts, and exclusive event invitations directly in your inbox.</p>
              <form className="flex gap-2 max-w-md" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="flex-1 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <Button className="rounded-xl px-6 bg-primary hover:bg-primary/90 text-primary-foreground">
                  Subscribe
                </Button>
              </form>
            </div>
            <div className="lg:text-right">
              <h4 className="text-xl font-poppins font-bold text-slate-900 dark:text-white mb-4">Download the TrustBank App</h4>
              <div className="flex flex-wrap lg:justify-end gap-4">
                <a href="#" className="inline-block transition-transform hover:-translate-y-1">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" className="h-10" />
                </a>
                <a href="#" className="inline-block transition-transform hover:-translate-y-1">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="h-10" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Directories */}
      <div className="container py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 sm:gap-10">
          
          {/* Brand Info */}
          <div className="col-span-2 lg:col-span-2 pr-0 lg:pr-4 mb-4 lg:mb-0">
            <div className="flex items-center gap-2 mb-6">
              {visuals?.primary_logo ? (
                <img 
                  src={visuals.primary_logo} 
                  alt={identity?.short_name || "TrustBank"} 
                  className="h-8 w-auto max-w-[140px] object-contain shrink-0" 
                  loading="lazy"
                />
              ) : (
                <span className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white text-sm">T</span>
              )}
              <span className="font-poppins text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {identity?.short_name || "TrustBank"}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-white/60 mb-8 max-w-sm">
              Established in 1994, providing bespoke banking, commercial lending, and wealth management services to individuals, families, and global enterprises.
            </p>
            <div className="space-y-4 text-sm text-slate-600 dark:text-white/60">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>{corporate?.headquarters || "100 Wall Street, New York, NY 10005"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span>{corporate?.phone || "+1 (212) 555-0180"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>{corporate?.email || "advisory@trustbank.com"}</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-poppins font-bold text-slate-900 dark:text-white mb-6 text-sm uppercase tracking-wider">Banking</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-white/60">
              {bankingLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-primary transition-colors flex items-center group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-2" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-poppins font-bold text-slate-900 dark:text-white mb-6 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-white/60">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-primary transition-colors flex items-center group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-2" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-poppins font-bold text-slate-900 dark:text-white mb-6 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-white/60">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-primary transition-colors flex items-center group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-2" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-poppins font-bold text-slate-900 dark:text-white mb-6 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-white/60">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-primary transition-colors flex items-center group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-2" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Disclosures & Copyright */}
      <div className="border-t border-slate-200 dark:border-white/5 bg-slate-200/50 dark:bg-slate-950/80 py-8">
        <div className="container px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white/70">
              <Shield className="h-4 w-4 text-primary" />
              <span>FDIC Insured</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white/70">
              <Lock className="h-4 w-4 text-primary" />
              <span>SSL Secured</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-slate-400 dark:text-white/40">
            <a href="#" className="hover:text-primary dark:hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
            <a href="#" className="hover:text-primary dark:hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
            <a href="#" className="hover:text-primary dark:hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
            <a href="#" className="hover:text-primary dark:hover:text-white transition-colors"><Instagram className="h-5 w-5" /></a>
          </div>
        </div>

        <div className="container px-4 sm:px-6 lg:px-8 mt-8 text-[11px] leading-relaxed text-slate-500 dark:text-white/40 space-y-4 max-w-6xl">
          <p>
            TrustBank is a member of the Federal Deposit Insurance Corporation (FDIC). Deposits are insured up to $250,000 per depositor for each account ownership category. Investment products, brokerage accounts, and wealth advisory plans offered through TrustBank Wealth Advisory are not FDIC insured, are not bank guaranteed, and may lose value.
          </p>
          <p>
            Lending products are subject to credit approval and underwriting standards. TrustBank is an Equal Housing Lender. NMLS ID #123456. Brokerage and investment services are provided by TrustBank Brokerage Services LLC, member FINRA and SIPC.
          </p>
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 pt-6 border-t border-slate-300 dark:border-white/5">
            <p>&copy; {new Date().getFullYear()} {identity?.legal_name || "TrustBank Corporation"}. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Designed for Premium Banking Experiences.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
