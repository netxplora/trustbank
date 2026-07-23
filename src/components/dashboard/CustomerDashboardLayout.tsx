import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Wallet, ArrowRightLeft, Receipt, TrendingUp, CreditCard, Users, Bell, User, Settings, LogOut, Menu, X, ShieldCheck, Bitcoin, LineChart, FileText, Grid3X3, FileSpreadsheet, Award, PlusCircle, ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { NotificationPopover } from "./NotificationPopover";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { PageTransition } from "@/components/PageTransition";
import { AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import { LiveChatWidget } from "./LiveChatWidget";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", to: "/dashboard" },
  { icon: Wallet, label: "Accounts", to: "/dashboard/accounts" },
  { icon: Bitcoin, label: "Digital Currency", to: "/dashboard/digital-currency" },
  { icon: ArrowRightLeft, label: "Transfers", to: "/dashboard/transfers" },
  { icon: PlusCircle, label: "Top Up", to: "/dashboard/deposit" },
  { icon: LineChart, label: "Investments & Stocks", to: "/dashboard/investments" },
  { icon: TrendingUp, label: "Loans", to: "/dashboard/loans" },
  { icon: FileSpreadsheet, label: "Tax Refund", to: "/dashboard/tax-refund" },
  { icon: Award, label: "Grants", to: "/dashboard/grants" },
  { icon: CreditCard, label: "Cards", to: "/dashboard/cards" },
  { icon: FileText, label: "Statements", to: "/dashboard/statements" },
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

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-56 bg-background/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-2xl border-r border-border/50 flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0 flex" : "-translate-x-full hidden"} lg:translate-x-0 lg:flex`}>
        <div className="h-14 flex shrink-0 items-center px-4 border-b border-border/50 bg-background/50">
          <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity flex-1">
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shadow-inner border border-primary/20 shrink-0">
              <img src={logo} alt="TrustBank" className="h-5 w-5" width={20} height={20} />
            </div>
            <span className="font-poppins text-base font-bold text-foreground tracking-tight truncate">TrustBank</span>
          </Link>
          <button className="lg:hidden ml-auto text-muted-foreground hover:text-foreground p-1" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, to }) => {
            const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
            return (
              <Link key={to} to={to} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-nav-std font-medium tracking-[0.2px] transition-all duration-300 ${active ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"}`}>
                <Icon className={`h-4 w-4 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-2.5 border-t border-border/50 space-y-0.5 bg-background/30">
          {isAdmin && (
            <Link to="/admin" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Portal
            </Link>
          )}

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
            {location.pathname !== "/dashboard" && (
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
              <span className="font-poppins font-bold text-sm sm:text-base text-foreground">Hi, {displayName}</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="h-8 w-8 rounded-full object-cover border border-primary/20 shadow-inner" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary text-xs font-bold shadow-inner">
                {displayName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Welcome Back</p>
              <div className="flex items-center gap-2">
                <p className="font-poppins font-bold text-foreground text-xs m-0">{displayName}</p>
                <span className="text-[9px] bg-muted/80 border border-border px-1.5 py-0.5 rounded-full font-mono text-muted-foreground font-semibold">A/C: {accountNumber}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 lg:gap-2">
            <div className="hidden lg:block text-right mr-1">
              <p className="text-[9px] bg-muted/80 border border-border px-1.5 py-0.5 rounded-full font-mono text-muted-foreground font-semibold">A/C: {accountNumber}</p>
            </div>
            <ThemeToggle />
            <NotificationPopover basePath="/dashboard" />
            <Link 
              to="/dashboard/profile" 
              className="h-8 w-8 rounded-full hover:bg-muted/80 transition-all flex items-center justify-center group relative border border-transparent hover:border-border/50 overflow-hidden"
            >
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

      {/* Floating Live Chat Widget */}
      <LiveChatWidget />

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[56px] bg-background border-t border-border flex items-center justify-around z-50 pb-safe px-1">
        <Link to="/dashboard" className={`flex flex-col items-center justify-center w-full h-full space-y-0.5 transition-colors ${location.pathname === "/dashboard" ? 'text-primary' : 'text-muted-foreground'}`}>
          <LayoutDashboard className={`h-4.5 w-4.5 ${location.pathname === "/dashboard" ? 'fill-primary/20' : ''}`} strokeWidth={location.pathname === "/dashboard" ? 2.5 : 2} />
          <span className="text-[9px] font-semibold tracking-wide">Home</span>
        </Link>
        
        <Link to="/dashboard/accounts" className={`flex flex-col items-center justify-center w-full h-full space-y-0.5 transition-colors ${location.pathname === "/dashboard/accounts" ? 'text-primary' : 'text-muted-foreground'}`}>
          <Wallet className={`h-4.5 w-4.5 ${location.pathname === "/dashboard/accounts" ? 'fill-primary/20' : ''}`} strokeWidth={location.pathname === "/dashboard/accounts" ? 2.5 : 2} />
          <span className="text-[9px] font-semibold tracking-wide">Accounts</span>
        </Link>

        {/* Floating Action Button for Transfer */}
        <div className="relative w-full h-full flex justify-center">
          <Link 
            to="/dashboard/transfers" 
            className="absolute -top-4 flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 border-2 border-background hover:scale-105 transition-transform"
          >
            <ArrowRightLeft className="h-5 w-5" strokeWidth={2.5} />
          </Link>
          <span className="text-[9px] font-semibold tracking-wide absolute bottom-1 text-muted-foreground">Transfer</span>
        </div>

        <Link to="/dashboard/payments" className={`flex flex-col items-center justify-center w-full h-full space-y-0.5 transition-colors ${location.pathname === "/dashboard/payments" ? 'text-primary' : 'text-muted-foreground'}`}>
          <Receipt className={`h-4.5 w-4.5 ${location.pathname === "/dashboard/payments" ? 'fill-primary/20' : ''}`} strokeWidth={location.pathname === "/dashboard/payments" ? 2.5 : 2} />
          <span className="text-[9px] font-semibold tracking-wide">Payments</span>
        </Link>

        <Link to="/dashboard/services" className={`flex flex-col items-center justify-center w-full h-full space-y-0.5 transition-colors ${location.pathname === "/dashboard/services" ? 'text-primary' : 'text-muted-foreground'}`}>
          <Grid3X3 className={`h-4.5 w-4.5 ${location.pathname === "/dashboard/services" ? 'fill-primary/20' : ''}`} strokeWidth={location.pathname === "/dashboard/services" ? 2.5 : 2} />
          <span className="text-[9px] font-semibold tracking-wide">More</span>
        </Link>
      </div>
    </div>
  );
}
