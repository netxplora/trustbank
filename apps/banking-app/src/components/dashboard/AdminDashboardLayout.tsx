import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Wallet, ArrowRightLeft, TrendingUp, CreditCard, Bell, FileText, Settings, LogOut, Menu, X, User, ShieldCheck, Bitcoin, MessageCircle, LineChart, FileSpreadsheet, Paintbrush, Globe, Box, Image, ScrollText, Briefcase, ArrowDownCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { NotificationPopover } from "./NotificationPopover";
import { ThemeToggle } from "@trustbank/shared-ui/components/ThemeToggle";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { PageTransition } from "@trustbank/shared-ui/components/PageTransition";
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
      { icon: TrendingUp, label: "Loans", to: "/admin/loans" },
      { icon: CreditCard, label: "Cards", to: "/admin/cards" },
      { icon: LineChart, label: "Investments", to: "/admin/investments" },
      { icon: Bitcoin, label: "Deposit Settings", to: "/admin/deposit-settings" },
    ]
  },
  {
    title: "Compliance & Ops",
    items: [
      { icon: ShieldCheck, label: "KYC Management", to: "/admin/kyc" },
      { icon: FileSpreadsheet, label: "Tax Documents", to: "/admin/tax-documents" },
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

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-background/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-2xl border-r border-border/50 flex flex-col transition-transform lg:translate-x-0 overflow-hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 flex shrink-0 items-center px-6 border-b border-border/50 bg-background/50">
          <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shadow-inner border border-primary/20 shrink-0">
              <img src={logo} alt="TrustBank" className="h-6 w-6" width={24} height={24} />
            </div>
            <div>
              <span className="font-poppins text-lg font-bold text-foreground tracking-tight">TrustBank</span>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-sans font-bold -mt-0.5">Admin Portal</p>
            </div>
          </Link>
          <button className="lg:hidden ml-auto text-muted-foreground hover:text-foreground p-1" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto font-sans custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h4 className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map(({ icon: Icon, label, to }) => {
                  const active = location.pathname === to;
                  return (
                    <Link key={to} to={to} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${active ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:scale-[1.02]"}`}>
                      <Icon className={`h-4 w-4 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t shrink-0 border-border/50 font-sans bg-background/30 space-y-1">
          <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Go to Homepage
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 w-full">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="h-16 bg-background/70 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shadow-sm">
          <button className="lg:hidden p-2 rounded-xl hover:bg-muted/80 transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="hidden lg:flex items-center gap-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile?.display_name || "Admin"} className="h-10 w-10 rounded-full object-cover border border-primary/20 shadow-inner" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold shadow-inner">
                {(profile?.display_name || "Admin").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Welcome Back</p>
              <p className="font-poppins font-bold text-foreground text-sm m-0">{profile?.display_name || "Administrator"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <ThemeToggle />
            <NotificationPopover basePath="/admin" />
            <Link to="/admin/settings" className="h-10 w-10 rounded-full hover:bg-muted/80 transition-all flex items-center justify-center group relative border border-transparent hover:border-border/50 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
              ) : (
                <User className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto relative z-10">
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
