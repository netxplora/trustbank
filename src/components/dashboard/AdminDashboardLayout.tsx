import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Wallet, ArrowRightLeft, TrendingUp, CreditCard, Bell, FileText, Settings, LogOut, Menu, X, User, ShieldCheck, Bitcoin, MessageCircle, LineChart, FileSpreadsheet, Paintbrush, Globe, Box, Image, ScrollText, Briefcase, ArrowDownCircle, Award, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { NotificationPopover } from "./NotificationPopover";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { PageTransition } from "@/components/PageTransition";
import { AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

const navGroups = [
  {
    title: "Core Banking",
    items: [
      { icon: LayoutDashboard, label: "Overview", to: "/admin" },
      { icon: Users, label: "Customers", to: "/admin/customers" },
      { icon: Wallet, label: "Accounts", to: "/admin/accounts" },
      { icon: Briefcase, label: "Current Apps", to: "/admin/current-applications" },
      { icon: ArrowRightLeft, label: "Transactions", to: "/admin/transactions" },
      { icon: ArrowDownCircle, label: "Deposits", to: "/admin/deposits" },
      { icon: Bitcoin, label: "Digital Currency & Swaps", to: "/admin/digital-currency" },
      { icon: TrendingUp, label: "Loans", to: "/admin/loans" },
      { icon: CreditCard, label: "Cards", to: "/admin/cards" },
      { icon: LineChart, label: "Investments", to: "/admin/investments" },
    ]
  },
  {
    title: "Programs & Compliance",
    items: [
      { icon: ShieldCheck, label: "KYC Management", to: "/admin/kyc" },
      { icon: FileSpreadsheet, label: "Tax Refunds", to: "/admin/tax-refunds" },
      { icon: Award, label: "Grant Programs", to: "/admin/grants" },
      { icon: MessageCircle, label: "Support Chat", to: "/admin/chat" },
      { icon: Bell, label: "Notifications", to: "/admin/notifications" },
      { icon: FileText, label: "Reports", to: "/admin/reports" },
    ]
  },
  {
    title: "Brand & CMS",
    items: [
      { icon: Paintbrush, label: "Brand Settings", to: "/admin/settings" },
      { icon: Globe, label: "Pages Content", to: "/admin/cms-pages" },
      { icon: Box, label: "Banking Products", to: "/admin/cms-products" },
      { icon: ScrollText, label: "News & Insights", to: "/admin/cms-news" },
      { icon: Image, label: "Media Library", to: "/admin/cms-media" },
      { icon: ShieldCheck, label: "Audit Logs", to: "/admin/audit-logs" },
    ]
  }
];

export default function AdminDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out", description: "Admin session ended." });
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans relative overflow-hidden">
      {/* Ambient Premium Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] pointer-events-none" />

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-56 bg-background/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-2xl border-r border-border/50 flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0 flex" : "-translate-x-full hidden"} lg:translate-x-0 lg:flex`}>
        <div className="h-14 flex shrink-0 items-center px-4 border-b border-border/50 bg-background/50">
          <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity flex-1">
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shadow-inner border border-primary/20 shrink-0">
              <img src={logo} alt="TrustBank" className="h-5 w-5" width={20} height={20} />
            </div>
            <div>
              <span className="font-poppins text-base font-bold text-foreground tracking-tight">TrustBank</span>
              <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-sans font-bold -mt-0.5">Admin Portal</p>
            </div>
          </Link>
          <button className="lg:hidden ml-auto text-muted-foreground hover:text-foreground p-1" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-5 overflow-y-auto font-sans custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h4 className="px-2.5 mb-1.5 text-badge-std font-medium uppercase tracking-widest text-muted-foreground">
                {group.title}
              </h4>
              <div className="space-y-0.5">
                {group.items.map(({ icon: Icon, label, to }) => {
                  const active = location.pathname === to;
                  return (
                    <Link key={to} to={to} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-nav-std font-medium tracking-[0.2px] transition-all duration-300 ${active ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"}`}>
                      <Icon className={`h-4 w-4 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-2.5 border-t shrink-0 border-border/50 font-sans bg-background/30 space-y-0.5">
          <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Go to Homepage
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 w-full">
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden">
        <header className="h-13 bg-background/70 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-3 md:px-6 sticky top-0 z-30 shadow-sm w-full">
          <div className="flex items-center gap-2.5 lg:hidden">
            {location.pathname !== "/admin" && (
              <button 
                className="p-1.5 -ml-1 rounded-lg hover:bg-muted/80 transition-colors text-muted-foreground"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <button className="p-1.5 -ml-1 rounded-lg hover:bg-muted/80 transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                <img src={logo} alt="TrustBank" className="h-3.5 w-3.5" />
              </div>
              <span className="font-poppins font-bold text-xs sm:text-sm text-foreground">Admin</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile?.display_name || "Admin"} className="h-8 w-8 rounded-full object-cover border border-primary/20 shadow-inner" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary text-xs font-bold shadow-inner">
                {(profile?.display_name || "Admin").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Welcome Back</p>
              <p className="font-poppins font-bold text-foreground text-xs m-0">{profile?.display_name || "Administrator"}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 lg:gap-2">
            <ThemeToggle />
            <NotificationPopover basePath="/admin" />
            <Link to="/admin/settings" className="h-8 w-8 rounded-full hover:bg-muted/80 transition-all flex items-center justify-center group relative border border-transparent hover:border-border/50 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto relative z-10 pb-24 lg:pb-8 max-w-[1400px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
