import React, { useState, useEffect, Suspense, lazy } from "react";
import { 
  Building2, ArrowRightLeft, CreditCard, ShieldCheck, Lock, 
  ArrowUpRight, ArrowDownLeft, Eye, EyeOff, TrendingUp, 
  Bitcoin, LineChart, FileSpreadsheet, Award, FileText, ChevronRight, 
  Wallet, Shield, Sparkles, Calendar, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";
import { getUserCryptoWallets, getLiveCryptoRates, UserCryptoWallet, CryptoAsset } from "@/services/digitalCurrencyService";
import { getGrantPrograms, GrantProgram } from "@/services/grantsService";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

const BalanceChart = lazy(() => import("@/components/dashboard/BalanceChart"));

interface AccountData {
  id: string;
  account_number: string;
  account_type: "savings" | "current" | "digital";
  balance: number;
  ledger_balance: number;
  status: string;
  currency: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  reference: string;
  status: string;
  created_at: string;
}

const chartData = [
  { day: "Mon", balance: 42500 },
  { day: "Tue", balance: 43800 },
  { day: "Wed", balance: 42900 },
  { day: "Thu", balance: 45200 },
  { day: "Fri", balance: 47800 },
  { day: "Sat", balance: 49100 },
  { day: "Sun", balance: 52450 },
];

export default function CustomerDashboardHome() {
  const { profile, user } = useAuth();
  const [showBalances, setShowBalances] = useState(true);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [wallets, setWallets] = useState<UserCryptoWallet[]>([]);
  const [cryptoRates, setCryptoRates] = useState<CryptoAsset[]>([]);
  const [grantPrograms, setGrantPrograms] = useState<GrantProgram[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAccounts();
    fetchCryptoData();
    fetchGrantPrograms();
    if (user?.id) fetchRecentTransactions();

    const channel = supabase
      .channel("dashboard-home-grants-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "grant_programs" },
        () => {
          fetchGrantPrograms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchRecentTransactions = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('transactions')
      .select('id, type, amount, description, reference, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(2);
    if (data) setRecentTransactions(data as Transaction[]);
  };

  const fetchGrantPrograms = async () => {
    const list = await getGrantPrograms();
    setGrantPrograms(list.filter((p) => p.status === "active"));
  };

  const fetchUserAccounts = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("accounts")
        .select("id, account_number, account_type, balance, ledger_balance, status, currency")
        .eq("user_id", user?.id || "")
        .eq("status", "active");

      setAccounts(
        (data || []).map((a) => ({
          id: a.id,
          account_number: a.account_number,
          account_type: a.account_type as any,
          balance: parseFloat(a.balance),
          ledger_balance: parseFloat(a.ledger_balance || a.balance),
          status: a.status,
          currency: a.currency || "USD",
        }))
      );
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchCryptoData = async () => {
    const [w, r] = await Promise.all([
      getUserCryptoWallets(user?.id || ""),
      getLiveCryptoRates(),
    ]);
    setWallets(w);
    setCryptoRates(r);
  };

  const displayName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : (profile?.display_name || "Valued Customer");
  const kycTier = profile?.kyc_tier || "Tier 2 Verified";
  const relationshipStatus = "Premier Private Wealth Member";

  // Savings & Current balance calculations
  const savingsAccount = accounts.find(a => a.account_type === 'savings');
  const currentAccount = accounts.find(a => a.account_type === 'current');
  const savingsBal = savingsAccount?.balance || 0;
  const currentBal = currentAccount?.balance || 0;

  // Calculate total digital currency portfolio value
  const totalCryptoValue = wallets.reduce((sum, w) => {
    const rate = cryptoRates.find(r => r.symbol === w.asset_symbol);
    return sum + (w.balance * (rate?.priceUsd || 0));
  }, 0);
  const walletSummary = wallets.filter(w => w.balance > 0).map(w => `${w.balance} ${w.asset_symbol}`).join(" | ") || "No holdings";

  const totalCombinedBalance = savingsBal + currentBal + totalCryptoValue;

  // Quick actions filtered as requested: Removed "Statements" and "Currency Swap"
  const quickActions = [
    { icon: ArrowDownLeft, label: "Deposit", to: "/dashboard/deposit", color: "text-emerald-500 bg-emerald-500/10" },
    { icon: ArrowRightLeft, label: "Transfer", to: "/dashboard/transfers", color: "text-blue-500 bg-blue-500/10" },
    { icon: TrendingUp, label: "Loan", to: "/dashboard/loans", color: "text-indigo-500 bg-indigo-500/10" },
    { icon: Sparkles, label: "Buy Stocks", to: "/dashboard/investments", color: "text-purple-500 bg-purple-500/10" },
    { icon: FileSpreadsheet, label: "Tax Refund", to: "/dashboard/tax-refund", color: "text-amber-500 bg-amber-500/10" },
    { icon: Award, label: "Grants", to: "/dashboard/grants", color: "text-orange-500 bg-orange-500/10" },
  ];

  return (
    <div className="space-y-4 font-sans max-w-6xl mx-auto px-1 sm:px-4 py-2">
      {/* 1. Redesigned Premier Private Wealth Member Card with Embedded Balances */}
      <SlideUp>
        <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl p-4 sm:p-5 relative overflow-hidden space-y-4">
          <div className="absolute right-0 top-0 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

          {/* Member Card Header Row */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-400/15 text-amber-300 border-amber-400/30 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5">
                <Shield className="h-3 w-3 mr-1 text-amber-400" /> {relationshipStatus}
              </Badge>
              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5">
                <ShieldCheck className="h-3 w-3 mr-1" /> {kycTier}
              </Badge>
            </div>
          </div>

          {/* User Name & Combined Net Worth */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-secondary-std text-slate-400 font-normal uppercase tracking-wider">Welcome back</p>
              <h1 className="text-page-title font-bold tracking-tight text-white">
                {displayName}
              </h1>
            </div>
            <div className="sm:text-right bg-white/5 border border-white/10 rounded-xl p-2.5 sm:px-4 sm:py-2">
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <p className="text-caption-std text-slate-400 font-medium uppercase tracking-wider">Total Combined Portfolio</p>
                <button 
                  onClick={() => setShowBalances(!showBalances)} 
                  className="text-slate-400 hover:text-white transition-colors p-0.5"
                  title={showBalances ? "Hide Balances" : "Show Balances"}
                >
                  {showBalances ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-balance-lg font-bold text-emerald-400 leading-[46px] mt-0.5">
                {showBalances ? `$${totalCombinedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "••••••••"}
              </p>
            </div>
          </div>

          {/* Embedded Account Balances Grid - Single Row on Mobile View */}
          <div className="relative z-10 grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-1">
            {/* Savings Balance */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 sm:p-3 transition-colors space-y-1 min-w-0">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 sm:gap-1 truncate">
                  <Building2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary shrink-0" /> <span className="truncate">Savings</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400">
                  {savingsAccount?.account_number || "—"}
                </span>
              </div>
              <p className="font-poppins text-xs sm:text-lg font-bold text-white leading-tight truncate">
                {showBalances ? `$${savingsBal.toLocaleString(undefined, { minimumFractionDigits: 0 })}` : "••••"}
              </p>
              <div className="flex justify-between items-center text-[8px] sm:text-[10px] text-slate-400 pt-1 border-t border-white/10">
                <span className="truncate">Ledger: {showBalances ? `$${(savingsAccount?.ledger_balance || savingsBal).toLocaleString(undefined, { minimumFractionDigits: 0 })}` : "••"}</span>
                <Link to="/dashboard/deposit" className="text-primary hover:underline font-bold shrink-0 ml-1">Top Up</Link>
              </div>
            </div>

            {/* Current Balance */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 sm:p-3 transition-colors space-y-1 min-w-0">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 sm:gap-1 truncate">
                  <CreditCard className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-400 shrink-0" /> <span className="truncate">Current</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400">
                  {currentAccount?.account_number || "—"}
                </span>
              </div>
              <p className="font-poppins text-xs sm:text-lg font-bold text-white leading-tight truncate">
                {showBalances ? `$${currentBal.toLocaleString(undefined, { minimumFractionDigits: 0 })}` : "••••"}
              </p>
              <div className="flex justify-between items-center text-[8px] sm:text-[10px] text-slate-400 pt-1 border-t border-white/10">
                <span className="truncate">Ledger: {showBalances ? `$${(currentAccount?.ledger_balance || currentBal).toLocaleString(undefined, { minimumFractionDigits: 0 })}` : "••"}</span>
                <Link to="/dashboard/transfers" className="text-emerald-400 hover:underline font-bold shrink-0 ml-1">Pay</Link>
              </div>
            </div>

            {/* Digital Currency Balance */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 sm:p-3 transition-colors space-y-1 min-w-0">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 sm:gap-1 truncate">
                  <Bitcoin className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-400 shrink-0" /> <span className="truncate">Crypto</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400">Multi</span>
              </div>
              <p className="font-poppins text-xs sm:text-lg font-bold text-white leading-tight truncate">
                {showBalances ? `$${totalCryptoValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}` : "••••"}
              </p>
              <div className="flex justify-between items-center text-[8px] sm:text-[10px] text-slate-400 pt-1 border-t border-white/10">
                <span className="truncate">{walletSummary}</span>
                <Link to="/dashboard/digital-currency" className="text-amber-400 hover:underline font-bold shrink-0 ml-1">Trade</Link>
              </div>
            </div>
          </div>
        </div>
      </SlideUp>

      {/* RECENT TRANSACTIONS (Beneath card) */}
      <SlideUp delay={0.05}>
        <div className="px-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-section-title font-semibold tracking-tight text-foreground flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" /> Recent Transactions
            </h2>
            <Link to="/dashboard/transactions" className="text-secondary-std font-semibold text-primary hover:underline flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-0.5" />
            </Link>
          </div>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between group py-1 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'credit' || tx.type === 'deposit' 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {tx.type === 'credit' || tx.type === 'deposit' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-body-std font-medium text-foreground group-hover:text-primary transition-colors">{tx.description || tx.type}</p>
                      <p className="text-secondary-std text-muted-foreground mt-0.5">{new Date(tx.created_at).toLocaleDateString()} • Ref: {tx.reference}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-tx-amount font-semibold ${
                      tx.type === 'credit' || tx.type === 'deposit' ? 'text-emerald-500' : 'text-foreground'
                    }`}>
                      {tx.type === 'credit' || tx.type === 'deposit' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <Badge variant="outline" className="text-badge-std font-medium uppercase mt-0.5">{tx.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary-std text-muted-foreground">No recent transactions found.</p>
          )}
        </div>
      </SlideUp>

      {/* 2. QUICK ACTIONS SECTION (Placed BEFORE Grant Campaigns) */}
      <SlideUp delay={0.05}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-poppins text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" /> Quick Actions
            </h2>
          </div>
          <StaggerContainer className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <StaggerItem key={idx}>
                  <Link to={action.to} className="block group">
                    <Card className="rounded-xl border-border/60 shadow-sm hover:border-primary/40 hover:shadow-md transition-all p-2.5 text-center space-y-1.5 bg-card">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center mx-auto transition-transform group-hover:scale-105 ${action.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-poppins text-[11px] font-bold text-foreground block truncate">
                        {action.label}
                      </span>
                    </Card>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </SlideUp>

      {/* 3. GRANT CAMPAIGN SECTION (Placed AFTER Quick Actions) */}
      {grantPrograms.length > 0 && (
        <SlideUp delay={0.1}>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-primary" />
                <h2 className="font-poppins text-sm font-bold tracking-tight text-foreground">Active Grant Campaigns</h2>
                <Badge variant="outline" className="text-[10px] font-semibold">
                  {grantPrograms.length} Open
                </Badge>
              </div>
              <Link to="/dashboard/grants" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                View All <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {grantPrograms.slice(0, 3).map((program) => (
                <StaggerItem key={program.id}>
                  <Card className="rounded-xl border-border/60 shadow-sm hover:border-primary/40 transition-all overflow-hidden flex flex-col justify-between h-full bg-card group">
                    <div>
                      {program.image_url && (
                        <div className="h-20 sm:h-28 w-full overflow-hidden relative">
                          <OptimizedImage 
                            src={program.image_url} 
                            alt={program.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-center text-white">
                            <Badge className="bg-black/40 text-white backdrop-blur-md border-white/20 text-[8px] sm:text-[9px] font-semibold uppercase px-1 py-0">
                              {program.category}
                            </Badge>
                            <span className="text-[8px] sm:text-[10px] font-bold font-poppins text-emerald-300 bg-black/60 px-1 py-0.5 rounded-full">
                              ${program.funding_amount.toLocaleString()} Pool
                            </span>
                          </div>
                        </div>
                      )}

                      <CardHeader className="p-2 sm:p-3 pb-1">
                        <CardTitle className="font-poppins text-[11px] sm:text-xs font-bold group-hover:text-primary transition-colors leading-tight line-clamp-2">
                          {program.title}
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-[11px] line-clamp-2 mt-0.5 leading-normal">
                          {program.description}
                        </CardDescription>
                      </CardHeader>
                    </div>

                    <CardContent className="p-2 sm:p-3 pt-0 space-y-1.5">
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                        <span className="flex items-center gap-1 text-[8px] sm:text-[10px]"><Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" /> Deadline:</span>
                        <span className="font-semibold text-foreground text-[9px] sm:text-[10px]">{new Date(program.deadline).toLocaleDateString()}</span>
                      </div>

                      <Button asChild size="sm" className="w-full h-7 rounded-lg font-bold text-[10px] sm:text-xs gap-1 shadow-sm">
                        <Link to="/dashboard/grants">
                          Apply <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </SlideUp>
      )}

      {/* 4. Balance Analytics & Growth Chart */}
      <SlideUp delay={0.15}>
        <Card className="rounded-xl border-border/60 shadow-sm bg-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="font-poppins text-sm font-bold">Financial Position & Growth</CardTitle>
            <CardDescription className="text-xs">Balance progression across active accounts.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-48 sm:h-56 w-full">
              <Suspense fallback={<div className="w-full h-full bg-muted/20 animate-pulse rounded-lg" />}>
                <BalanceChart data={chartData} />
              </Suspense>
            </div>
          </CardContent>
        </Card>
      </SlideUp>
    </div>
  );
}

