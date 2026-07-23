import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Menu, X, ChevronDown, Bell, User as UserIcon, LogOut, LayoutDashboard, CreditCard, Settings } from "lucide-react";
import { useBrand } from "@trustbank/shared-utils/contexts/BrandContext";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { ThemeToggle } from "@trustbank/shared-ui/components/ThemeToggle";

interface DropdownItem {
  label: string;
  to: string;
}

interface NavCategory {
  label: string;
  key: string;
  items: DropdownItem[];
}

const navCategories: NavCategory[] = [
  {
    label: "Personal",
    key: "personal",
    items: [
      { label: "Personal Overview", to: "/info/personal-banking" },
      { label: "Checking Accounts", to: "/checking" },
      { label: "Savings Accounts", to: "/savings" },
      { label: "Fixed Deposits", to: "/info/fixed-deposits" },
      { label: "Youth Banking", to: "/info/youth-banking" },
      { label: "Student Checking", to: "/info/student-banking" },
      { label: "Debit Cards", to: "/info/debit-cards" }
    ]
  },
  {
    label: "Business",
    key: "business",
    items: [
      { label: "Business Overview", to: "/info/business-banking" },
      { label: "SME Accounts", to: "/info/sme-banking" },
      { label: "Corporate Banking", to: "/info/corporate-banking" },
      { label: "Merchant Services", to: "/info/merchant-services" },
      { label: "Payroll Solutions", to: "/info/payroll-solutions" },
      { label: "Cash Management", to: "/info/cash-management" },
      { label: "Trade Finance", to: "/info/trade-finance" },
      { label: "Business Loans", to: "/info/business-loans" }
    ]
  },
  {
    label: "Lending",
    key: "lending",
    items: [
      { label: "Lending Overview", to: "/loans" },
      { label: "Personal Loans", to: "/info/personal-loans" },
      { label: "Mortgage Loans", to: "/info/mortgage-loans" },
      { label: "Asset Financing", to: "/info/asset-financing" },
      { label: "Loan Calculator", to: "/info/loan-calculator" }
    ]
  },
  {
    label: "Wealth & Investment",
    key: "wealth",
    items: [
      { label: "Investment Overview", to: "/info/investments" },
      { label: "Wealth Management", to: "/info/wealth-management" },
      { label: "Retirement Planning", to: "/info/retirement-planning" },
      { label: "Fixed Income Yields", to: "/info/fixed-income" },
      { label: "Mutual Funds", to: "/info/mutual-funds" },
      { label: "Investment Education", to: "/info/investment-education" }
    ]
  },
  {
    label: "Digital Suite",
    key: "digital",
    items: [
      { label: "Digital Overview", to: "/digital-banking" },
      { label: "Mobile Banking App", to: "/info/mobile-banking" },
      { label: "Online Control Portal", to: "/info/online-banking" },
      { label: "Digital Wallets", to: "/info/digital-wallet" },
      { label: "Payment Solutions", to: "/info/payment-solutions" },
      { label: "Security Features", to: "/info/security-features" }
    ]
  },
  {
    label: "Company",
    key: "company",
    items: [
      { label: "About TrustBank", to: "/about" },
      { label: "Leadership Board", to: "/info/leadership" },
      { label: "Corporate Governance", to: "/info/governance" },
      { label: "Careers & Jobs", to: "/careers" },
      { label: "Investor Relations", to: "/info/investor-relations" },
      { label: "Social Responsibility", to: "/info/corporate-responsibility" }
    ]
  }
];

export function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({});
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();
  const { identity, visuals } = useBrand();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
  };

  // Close menus on route changes
  useEffect(() => {
    setMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const toggleMobileCategory = (key: string) => {
    setMobileExpanded((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isCategoryActive = (category: NavCategory) => {
    return category.items.some((item) => location.pathname === item.to);
  };

  return (
    <>
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border text-foreground select-none">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo and Brand Title - Sized dynamically with aspect ratio protection */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          {visuals?.primary_logo ? (
            <img
              src={visuals.primary_logo}
              alt={identity?.short_name || "TrustBank"}
              className="h-9 w-auto max-w-[160px] object-contain shrink-0 rounded"
              width={140}
              height={36}
              loading="eager"
            />
          ) : (
            <div className="h-9 w-9 rounded bg-warning flex items-center justify-center font-bold text-slate-950 text-sm">T</div>
          )}
          <span className="font-poppins text-lg font-bold text-foreground tracking-tight shrink-0">
            {identity?.short_name || "TrustBank"}
          </span>
        </Link>

        {/* Desktop Navigation with Dropdowns */}
        <nav className="hidden lg:flex items-center gap-2 h-full">
          {navCategories.map((category) => {
            const active = isCategoryActive(category);
            const open = activeDropdown === category.key;

            return (
              <div
                key={category.key}
                className="relative h-full flex items-center"
                onMouseEnter={() => setActiveDropdown(category.key)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className={`px-1.5 py-2 text-[10px] font-semibold tracking-wider uppercase transition-colors rounded-md flex items-center gap-1 border border-transparent ${active || open
                      ? "text-warning bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  aria-expanded={open}
                >
                  {category.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-250 ${open ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu Panel */}
                {open && (
                  <div className="absolute top-[calc(100%-8px)] left-0 min-w-[220px] bg-surface border border-border rounded-lg shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                    {category.items.map((item) => {
                      const itemActive = location.pathname === item.to;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`block px-4 py-2.5 text-xs font-sans transition-colors ${itemActive
                              ? "text-warning bg-muted font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="flex items-center gap-2 pl-2 ml-2 border-l border-white/10 h-6">
            <Link to="/news" className="px-2 py-2 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
              News & Insights
            </Link>
            <Link to="/contact" className="px-2 py-2 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
              Contact
            </Link>
          </div>
        </nav>

        {/* Action Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              <Button className="bg-primary hover:bg-primary/90 border-none text-primary-foreground text-xs font-bold uppercase tracking-wider px-6" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <ThemeToggle />
            </>
          ) : (
            <>
              <Button className="bg-primary hover:bg-primary/90 border-none text-primary-foreground text-xs font-bold uppercase tracking-wider px-6" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <ThemeToggle />
            </>
          )}
        </div>

        {/* Mobile Menu Toggle & Actions */}
        <div className="flex lg:hidden items-center gap-2">
          {user ? (
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted/50 text-muted-foreground" asChild>
              <Link to="/dashboard"><UserIcon className="h-4 w-4" /></Link>
            </Button>
          ) : (
            <Button size="sm" className="bg-primary hover:bg-primary/90 border-none text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-4 h-9" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          )}

          <ThemeToggle />

          <button
            className="p-2 ml-1 rounded-md hover:bg-muted transition-colors z-[60] relative"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
    </header>

      {/* Mobile Sidebar Overlay — rendered OUTSIDE header for correct stacking */}
      {menuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Hamburger Sidebar — rendered OUTSIDE header for correct stacking */}
      <div 
        className={`lg:hidden fixed inset-y-0 right-0 z-[9999] w-[85vw] max-w-sm flex flex-col bg-background shadow-2xl border-l border-border/50 transform transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 h-16 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-2">
              {visuals?.primary_logo ? (
                <img src={visuals.primary_logo} alt="Logo" className="h-8 w-auto object-contain" />
              ) : (
                <div className="h-8 w-8 rounded bg-warning flex items-center justify-center font-bold text-slate-950 text-xs">T</div>
              )}
              <span className="font-poppins text-sm font-bold text-foreground">{identity?.short_name || "TrustBank"}</span>
            </div>
            <button className="p-2 rounded-md hover:bg-muted transition-colors" onClick={() => setMenuOpen(false)}>
              <X className="h-6 w-6 text-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none pb-20">
            <div className="px-4 py-6">
              <h3 className="text-xl font-poppins font-bold text-foreground mb-6 px-2">Menu</h3>

              {/* Accordion Navigation */}
              <nav className="flex flex-col gap-2 mb-8">
                {navCategories.map((category) => {
                  const expanded = !!mobileExpanded[category.key];
                  const active = isCategoryActive(category);

                  return (
                    <div key={category.key} className="flex flex-col border border-border/50 rounded-2xl overflow-hidden bg-card/30">
                      <button
                        className={`w-full flex items-center justify-between p-4 text-base font-poppins font-semibold transition-colors ${
                          active ? "text-primary bg-primary/5" : "text-foreground hover:bg-muted"
                        }`}
                        onClick={() => toggleMobileCategory(category.key)}
                      >
                        {category.label}
                        <ChevronDown className={`h-5 w-5 opacity-50 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
                      </button>

                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}>
                        <div className="flex flex-col px-4 pb-4 gap-1.5 bg-muted/30 border-t border-border/50 pt-3">
                          {category.items.map((item) => (
                            <Link
                              key={item.to}
                              to={item.to}
                              className={`py-2.5 px-3 rounded-lg text-sm font-sans font-medium transition-colors flex items-center ${
                                location.pathname === item.to 
                                  ? "text-primary bg-primary/10" 
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}
                              onClick={() => setMenuOpen(false)}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mr-3" />
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Static Links */}
                <Link to="/news" className="flex items-center justify-between p-4 text-base font-poppins font-semibold text-foreground bg-card/30 border border-border/50 rounded-2xl hover:bg-muted transition-colors" onClick={() => setMenuOpen(false)}>
                  News & Insights
                </Link>
                <Link to="/contact" className="flex items-center justify-between p-4 text-base font-poppins font-semibold text-foreground bg-card/30 border border-border/50 rounded-2xl hover:bg-muted transition-colors" onClick={() => setMenuOpen(false)}>
                  Contact Us
                </Link>
              </nav>

              <div className="h-px bg-border/50 mb-8 w-full" />

              {/* Authentication Section */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1">Account Access</h4>
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all text-sm font-semibold text-foreground"><LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard</Link>
                    <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="flex items-center gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-semibold text-red-500 mt-2"><LogOut className="h-4 w-4" /> Sign Out</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button size="lg" className="w-full h-14 rounded-xl text-base font-bold tracking-wide shadow-lg" asChild>
                      <Link to="/login" onClick={() => setMenuOpen(false)}>Sign In</Link>
                    </Button>
                    <Button size="lg" variant="outline" className="w-full h-14 rounded-xl text-base font-bold tracking-wide border-2" asChild>
                      <Link to="/register" onClick={() => setMenuOpen(false)}>Open Account</Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Bottom Info */}
              <div className="mt-10 flex items-center justify-between px-2 text-sm text-muted-foreground">
                <div className="text-xs">
                  <p className="font-semibold">{identity?.platform_name || "TrustBank"}</p>
                  <p className="mt-0.5">1-800-TRUST-BK</p>
                </div>
              </div>

            </div>
          </div>
      </div>
    </>
  );
}
