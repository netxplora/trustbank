import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Shield, CheckCircle, Lock, Globe } from "lucide-react";
import { useBrand } from "@trustbank/shared-utils/contexts/BrandContext";

const productLinks = [
  { label: "Personal Checking", to: "/checking" },
  { label: "High-Yield Savings", to: "/savings" },
  { label: "Commercial Lending", to: "/loans" },
  { label: "Digital Banking Suite", to: "/digital-banking" },
  { label: "Private Wealth Advisory", to: "/services" },
];

const supportLinks = [
  { label: "Help & FAQ Center", to: "/faq" },
  { label: "Contact Private Office", to: "/contact" },
  { label: "Branch & ATM Finder", to: "/branches" },
  { label: "Card Activation & Support", to: "/faq" },
];

const companyLinks = [
  { label: "About TrustBank", to: "/about" },
  { label: "Careers & Leadership", to: "/careers" },
  { label: "Market News & Insights", to: "/news" },
];

const legalLinks = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Consumer Disclosures", to: "/privacy" },
  { label: "Security Guarantee", to: "/faq" },
];

export function PublicFooter() {
  const { identity, corporate, visuals } = useBrand();

  return (
    <footer className="bg-gradient-to-br from-[#1c1c1c] via-[#252018] to-[#0d0b08] text-white/70 font-sans border-t border-[#A67823]/30">
      {/* Top Section: Directories */}
      <div className="container py-10 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-5">
              {visuals?.primary_logo ? (
                <img 
                  src={visuals.primary_logo} 
                  alt={identity?.short_name || "TrustBank"} 
                  className="h-7 w-auto max-w-[120px] object-contain shrink-0 rounded" 
                  width={110} 
                  height={28} 
                  loading="lazy"
                />
              ) : (
                <span className="h-6 w-6 rounded bg-warning flex items-center justify-center font-bold text-slate-950 text-xs">T</span>
              )}
              <span className="font-poppins text-lg font-bold text-white tracking-tight">
                {identity?.short_name || "TrustBank"}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-white/70 mb-6 max-w-sm">
              Established in 1994, providing bespoke banking, commercial lending, and wealth management services to individuals, families, and businesses.
            </p>
            <div className="flex gap-4">
              {/* Compliance Badges */}
              <div className="flex items-center gap-1.5 bg-surface px-2 py-1 rounded text-[10px] text-muted-foreground font-medium border border-border">
                <Shield className="h-3 w-3 text-warning" />
                <span>FDIC Insured</span>
              </div>
              <div className="flex items-center gap-1.5 bg-surface px-2 py-1 rounded text-[10px] text-muted-foreground font-medium border border-border">
                <Lock className="h-3 w-3 text-warning" />
                <span>SSL Secured</span>
              </div>
            </div>
          </div>

          {/* Column 1: Products */}
          <div>
            <h4 className="font-poppins font-semibold text-white mb-4 text-xs uppercase tracking-wider">Banking Products</h4>
            <ul className="space-y-2 text-xs">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-[#F8E298] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Support */}
          <div>
            <h4 className="font-poppins font-semibold text-white mb-4 text-xs uppercase tracking-wider">Client Support</h4>
            <ul className="space-y-2 text-xs">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-[#F8E298] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Corporate */}
          <div>
            <h4 className="font-poppins font-semibold text-white mb-4 text-xs uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-xs">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-[#F8E298] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Private Office */}
          <div>
            <h4 className="font-poppins font-semibold text-white mb-4 text-xs uppercase tracking-wider">Private Advisory Office</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <span>{corporate?.headquarters || "100 Wall Street, New York, NY 10005"}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-warning shrink-0" />
                <span>{corporate?.phone || "+1 (212) 555-0180"} (Mon-Fri 8am-6pm EST)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-warning shrink-0" />
                <span>{corporate?.email || "advisory@trustbank.com"}</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Middle Section: Regulatory Disclosures & Info Hub */}
      <div className="border-t border-[#A67823]/20 bg-[#0d0b08]/50 py-10">
        <div className="container px-4 sm:px-6 lg:px-8 text-[11px] leading-relaxed text-white/60 space-y-4">
          <p>
            TrustBank is a member of the Federal Deposit Insurance Corporation (FDIC). Deposits are insured up to $250,000 per depositor for each account ownership category. Investment products, brokerage accounts, and wealth advisory plans offered through TrustBank Wealth Advisory are not FDIC insured, are not bank guaranteed, and may lose value.
          </p>
          <p>
            Lending products are subject to credit approval and underwriting standards. TrustBank is an Equal Housing Lender. NMLS ID #123456. Brokerage and investment services are provided by TrustBank Brokerage Services LLC, member FINRA and SIPC.
          </p>
          <p>
            Google Fonts used on this website: Poppins (headings) and Inter (body and interface text) under the SIL Open Font License.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-900 text-xs">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-warning" /> SOC2 Type II Certified</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-warning" /> PCI-DSS Level 1 Compliant</span>
            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-warning" /> 256-Bit SSL Encrypted Connection</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Copyright & Legal Quick Links */}
      <div className="bg-[#0a0806] border-t border-[#A67823]/20 py-6 text-xs">
        <div className="container px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white/50">
          <p>© {new Date().getFullYear()} {identity?.platform_name || "TrustBank Premium Banking"}. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 md:gap-6">
            {legalLinks.map((link) => (
              <Link key={link.label} to={link.to} className="hover:text-[#F8E298] transition-colors text-[11px]">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

