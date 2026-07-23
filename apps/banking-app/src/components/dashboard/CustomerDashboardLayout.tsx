import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Wallet, ArrowRightLeft, Receipt, TrendingUp, CreditCard, Users, Bell, User, Settings, LogOut, Menu, X, ShieldCheck, Bitcoin, MessageCircle, LineChart, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { NotificationPopover } from "./NotificationPopover";
import { ThemeToggle } from "@trustbank/shared-ui/components/ThemeToggle";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { PageTransition } from "@trustbank/shared-ui/components/PageTransition";
import { AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { LiveChatWidget } from "./LiveChatWidget";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", to: "/dashboard" },
  { icon: Wallet, label: "Accounts", to: "/dashboard/accounts" },
  { icon: ArrowRightLeft, label: "Transfers", to: "/dashboard/transfers" },
  { icon: Receipt, label: "Payments", to: "/dashboard/payments" },
  { icon: Users, label: "Payees", to: "/dashboard/payees" },
  { icon: LineChart, label: "Investments", to: "/dashboard/investments" },
  { icon: FileText, label: "eStatements", to: "/dashboard/statements" },
  { icon: TrendingUp, label: "Loans", to: "/dashboard/loans" },
  { icon: CreditCard, label: "Cards", to: "/dashboard/cards" },
  { icon: Users, label: "Beneficiaries", to: "/dashboard/beneficiaries" },
  { icon: Bitcoin, label: "Deposit", to: "/dashboard/deposit" },
  { icon: ShieldCheck, label: "KYC Verification", to: "/dashboard/kyc" },
  { icon: Bell, label: "Notifications", to: "/dashboard/notifications" },
  { icon: User, label: "Profile", to: "/dashboard/profile" },
  { icon: Settings, label: "Security", to: "/dashboard/security" },
];

export default function CustomerDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const { profile, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out", description: "You have been logged out successfully." });
    navigate("/");
  };

  const displayName = profile?.display_name || profile?.first_name || "User";
  const [accountNumber, setAccountNumber] = useState<string>("—");

  useEffect(() => {
    if (profile?.user_id) {
      const fetchAccount = async () => {
        const { data } = await supabase
          .from('accounts')
          .select('account_number')
          .eq('user_id', profile.user_id)
          .eq('account_type', 'savings')
          .limit(1)
          .single();
        
        if (data) {
          setAccountNumber(data.account_number);
        } else {
          setAccountNumber(profile?.account_number || "—");
        }
      };
      fetchAccount();
    }
  }, [profile?.user_id, profile?.account_number]);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans relative overflow-hidden">
      {/* Ambient Premium Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] pointer-events-none" />

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-background/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-2xl border-r border-border/50 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 flex shrink-0 items-center px-6 border-b border-border/50 bg-background/50">
          <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shadow-inner border border-primary/20 shrink-0">
              <img src={logo} alt="TrustBank" className="h-6 w-6" width={24} height={24} />
            </div>
            <span className="font-poppins text-lg font-bold text-foreground tracking-tight truncate">TrustBank</span>
          </Link>
          <button className="lg:hidden ml-auto text-muted-foreground hover:text-foreground p-1" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, to }) => {
            const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
            return (
              <Link key={to} to={to} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${active ? "bg-gradient-to-r from-[#C7993E] to-[#A67823] text-[#1a1408] shadow-[0_4px_15px_rgba(199,153,62,0.3)] scale-[1.02]" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:scale-[1.02]"}`}>
                <Icon className={`h-4 w-4 ${active ? "text-[#1a1408]" : "text-muted-foreground"}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 space-y-1 bg-background/30">
          {isAdmin && (
            <Link to="/admin" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-300">
              <ShieldCheck className="h-4 w-4" />
              Admin Portal
            </Link>
          )}

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
              <img src={profile.avatar_url} alt={displayName} className="h-10 w-10 rounded-full object-cover border border-primary/20 shadow-inner" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold shadow-inner">
                {displayName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Welcome Back</p>
              <div className="flex items-center gap-3">
                <p className="font-poppins font-bold text-foreground text-sm m-0">{displayName}</p>
                <span className="text-[9px] bg-muted/80 border border-border px-2 py-0.5 rounded-full font-mono text-muted-foreground font-semibold">A/C: {accountNumber}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <div className="lg:hidden text-right mr-2">
              <p className="text-[9px] bg-muted/80 border border-border px-2 py-0.5 rounded-full font-mono text-muted-foreground font-semibold">A/C: {accountNumber}</p>
            </div>
            <ThemeToggle />
            <NotificationPopover basePath="/dashboard" />
            <Link 
              to="/dashboard/profile" 
              className="h-10 w-10 rounded-full hover:bg-muted/80 transition-all flex items-center justify-center group relative border border-transparent hover:border-border/50 overflow-hidden"
            >
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

      {/* Floating Live Chat Widget */}
      <LiveChatWidget />
    </div>
  );
}
