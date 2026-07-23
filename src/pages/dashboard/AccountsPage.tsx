import { useState, useEffect } from "react";
import { Wallet, Eye, EyeOff, ArrowUpRight, ArrowDownLeft, PiggyBank, CreditCard, Shield, Bitcoin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";
import { CardSkeleton, TableSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { getUserCryptoWallets, getLiveCryptoRates, UserCryptoWallet, CryptoAsset } from "@/services/digitalCurrencyService";

interface Account {
  id: string;
  account_type: string;
  account_number: string;
  balance: number;
  currency: string;
  status: string;
}

interface Transaction {
  id: string;
  account_id: string;
  description: string | null;
  amount: number;
  type: string;
  created_at: string;
  reference: string | null;
}

const fmt = (n: number) => "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2 });

const CRYPTO_ICONS: Record<string, string> = {
  BTC: "₿",
  ETH: "Ξ",
  USDT: "₮",
  USDC: "$",
  SOL: "◎",
};

const AccountsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentAppStatus, setCurrentAppStatus] = useState<string>("Not Applied");
  const [wallets, setWallets] = useState<UserCryptoWallet[]>([]);
  const [cryptoRates, setCryptoRates] = useState<CryptoAsset[]>([]);
  
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchData();
    const channel = supabase
      .channel("accounts-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "accounts", filter: `user_id=eq.${user.id}` }, () => fetchAccounts())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, () => fetchTransactions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const fetchData = async () => {
    await Promise.all([fetchAccounts(), fetchTransactions(), fetchCryptoData()]);
    setLoading(false);
  };

  const fetchCryptoData = async () => {
    if (!user) return;
    const [w, r] = await Promise.all([
      getUserCryptoWallets(user.id),
      getLiveCryptoRates(),
    ]);
    setWallets(w);
    setCryptoRates(r);
  };

  const fetchAccounts = async () => {
    if (!user) return;
    const { data: accs } = await supabase.from("accounts").select("*").eq("user_id", user.id);
    const activeAccs = (accs as Account[]) || [];
    setAccounts(activeAccs);

    const currentAcc = activeAccs.find(a => a.account_type === 'current');
    if (!currentAcc) {
      const { data: apps } = await supabase.from("current_account_applications").select("status").eq("user_id", user.id).order('created_at', { ascending: false }).limit(1);
      if (apps && apps.length > 0) {
        setCurrentAppStatus(apps[0].status === 'submitted' ? 'Pending Approval' : apps[0].status === 'under_review' ? 'Pending Approval' : apps[0].status === 'rejected' ? 'Rejected' : 'Pending Approval');
      } else {
        setCurrentAppStatus("Not Applied");
      }
    } else {
      setCurrentAppStatus("Approved");
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    const { data } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setTransactions((data as Transaction[]) || []);
  };

  const savingsAcc = accounts.find(a => a.account_type === 'savings');
  const currentAcc = accounts.find(a => a.account_type === 'current');
  const otherAccounts = accounts.filter(a => a.account_type !== 'savings' && a.account_type !== 'current');

  const totalCryptoValue = wallets.reduce((sum, w) => {
    const rate = cryptoRates.find(r => r.symbol === w.asset_symbol);
    return sum + (w.balance * (rate?.priceUsd || 0));
  }, 0);

  const filtered = selectedAccountId
    ? transactions.filter(t => t.account_id === selectedAccountId)
    : transactions;

  if (loading) return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2"><div className="h-7 w-40 bg-muted rounded animate-pulse" /><div className="h-4 w-64 bg-muted rounded animate-pulse" /></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      <TableSkeleton rows={5} />
    </div>
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/60 p-4 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground font-poppins flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" /> Asset Accounts
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage deposit balances, portfolio accounts, and digital wallets.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowBalance(!showBalance)} className="font-semibold text-xs h-8 rounded-xl self-start sm:self-auto">
          {showBalance ? <EyeOff className="h-3.5 w-3.5 mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
          {showBalance ? "Hide Balances" : "Show Balances"}
        </Button>
      </div>

      {/* Bank Accounts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-poppins text-sm font-bold text-foreground uppercase tracking-wider">Bank Accounts</h2>
        </div>
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Savings Account */}
          <StaggerItem>
          <div 
            className={`bg-card rounded-xl p-3.5 border border-border/60 shadow-sm transition-all cursor-pointer h-full border-l-4 border-l-primary hover:border-primary/80 ${selectedAccountId === savingsAcc?.id ? "ring-2 ring-primary" : ""}`}
            onClick={() => savingsAcc && setSelectedAccountId(selectedAccountId === savingsAcc.id ? null : savingsAcc.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                  <PiggyBank className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Savings Account</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {savingsAcc ? `****${savingsAcc.account_number.slice(-4)}` : "Pending Creation"}
                  </p>
                </div>
              </div>
              {savingsAcc && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${savingsAcc.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{savingsAcc.status}</span>}
            </div>
            <p className="text-base sm:text-lg font-bold font-poppins text-foreground tracking-tight">
              {showBalance ? (savingsAcc ? `$${Number(savingsAcc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00") : "$ •••••••"}
            </p>
          </div>
          </StaggerItem>

          {/* Current Account */}
          <StaggerItem>
          <div 
            className={`bg-card rounded-xl p-3.5 border border-border/60 shadow-sm transition-all relative h-full border-l-4 border-l-teal-500 hover:border-teal-500/80 ${currentAcc ? "cursor-pointer" : ""} ${selectedAccountId === currentAcc?.id ? "ring-2 ring-primary" : ""}`}
            onClick={() => currentAcc && setSelectedAccountId(selectedAccountId === currentAcc.id ? null : currentAcc.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                  <CreditCard className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Current Account</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {currentAcc ? `****${currentAcc.account_number.slice(-4)}` : "Not Active"}
                  </p>
                </div>
              </div>
              {currentAcc ? (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${currentAcc.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{currentAcc.status}</span>
              ) : (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase bg-warning/10 text-warning">{currentAppStatus}</span>
              )}
            </div>
            
            {currentAcc ? (
              <p className="text-base sm:text-lg font-bold font-poppins text-foreground tracking-tight">
                {showBalance ? `$${Number(currentAcc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$ •••••••"}
              </p>
            ) : (
              <div>
                <p className="text-[11px] text-muted-foreground mb-3 leading-tight">
                  {currentAppStatus === "Not Applied" ? "Apply for a current account to access higher limits and business tools." : "Your application is being reviewed."}
                </p>
                {currentAppStatus === "Not Applied" && (
                  <Button size="sm" onClick={() => navigate("/dashboard/current-application")} className="w-full h-8 text-xs font-bold rounded-lg">
                    Apply for Account
                  </Button>
                )}
              </div>
            )}
          </div>
          </StaggerItem>

          {/* Other Accounts */}
          {otherAccounts.map(acc => (
            <StaggerItem key={acc.id}>
            <div 
              className={`bg-card rounded-xl p-3.5 border border-border/60 shadow-sm transition-all cursor-pointer h-full border-l-4 border-l-purple-500 hover:border-purple-500/80 ${selectedAccountId === acc.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedAccountId(selectedAccountId === acc.id ? null : acc.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground capitalize">{acc.account_type} Account</p>
                    <p className="text-[10px] text-muted-foreground font-mono">****{acc.account_number.slice(-4)}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${acc.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{acc.status}</span>
              </div>
              <p className="text-base sm:text-lg font-bold font-poppins text-foreground tracking-tight">
                {showBalance ? `$${Number(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$ •••••••"}
              </p>
            </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Digital Currency Asset Accounts */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-poppins text-sm font-bold text-foreground uppercase tracking-wider">Digital Currency Wallets</h2>
            <Badge variant="outline" className="text-[10px] font-bold">
              {wallets.length} Assets
            </Badge>
          </div>
          <Link to="/dashboard/digital-currency" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            Swap & Trade <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Portfolio Overview Card */}
        <Card className="rounded-xl border-border/60 shadow-sm bg-card">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Portfolio Valuation</p>
              <p className="font-poppins text-lg font-bold text-foreground mt-0.5">
                {showBalance ? `$${totalCryptoValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "$ •••••••"}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Bitcoin className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Individual Wallet Cards */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {wallets.map((wallet) => {
            const rate = cryptoRates.find(r => r.symbol === wallet.asset_symbol);
            const fiatValue = wallet.balance * (rate?.priceUsd || 0);
            const change = rate?.change24h || 0;
            const isPositive = change >= 0;

            return (
              <StaggerItem key={wallet.asset_symbol}>
                <div className="bg-card rounded-xl p-3.5 border border-border/60 shadow-sm transition-all hover:border-amber-500/40 border-l-4 border-l-amber-500/60">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-sm shrink-0">
                        {CRYPTO_ICONS[wallet.asset_symbol] || wallet.asset_symbol[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{wallet.asset_name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{wallet.asset_symbol}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isPositive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                      {isPositive ? "+" : ""}{change.toFixed(2)}%
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-base font-bold font-poppins text-foreground tracking-tight">
                      {showBalance ? `${wallet.balance} ${wallet.asset_symbol}` : "•••••"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      ≈ {showBalance ? `$${fiatValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "$ •••••••"}
                    </p>
                  </div>

                  {wallet.wallet_address && (
                    <p className="text-[9px] text-muted-foreground font-mono mt-2 truncate pt-2 border-t border-border/40">
                      {wallet.wallet_address}
                    </p>
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>

      {/* Transactions */}
      <SlideUp>
        <div className="flex items-center justify-between mb-3 pt-1">
          <h2 className="text-xs font-bold font-poppins text-foreground uppercase tracking-wider">
            {selectedAccountId ? "Filtered Transactions" : "Recent Activity Log"}
          </h2>
        </div>
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-card rounded-xl border border-border/60 p-6 text-center text-xs text-muted-foreground shadow-sm">
              No recent transactions found
            </div>
          ) : filtered.map((tx) => {
            const isCredit = tx.type === "credit" || tx.type === "deposit" || tx.type === "loan_disbursement";
            
            let bgClass = "bg-primary/10";
            let iconClass = "text-primary";
            
            if (isCredit) {
              bgClass = "bg-emerald-500/10";
              iconClass = "text-emerald-600 dark:text-emerald-400";
            } else if (tx.type.includes("transfer")) {
              bgClass = "bg-blue-500/10";
              iconClass = "text-blue-500";
            } else if (tx.type.includes("payment")) {
              bgClass = "bg-purple-500/10";
              iconClass = "text-purple-500";
            } else {
              bgClass = "bg-rose-500/10";
              iconClass = "text-rose-500";
            }
            
            return (
              <div key={tx.id} className="bg-card rounded-xl p-3 border border-border/60 shadow-sm flex flex-row items-center justify-between hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${bgClass}`}>
                    {isCredit ? <ArrowDownLeft className={`h-4 w-4 ${iconClass}`} /> : <ArrowUpRight className={`h-4 w-4 ${iconClass}`} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{tx.description || tx.type.replace("_", " ").toUpperCase()}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()} {tx.reference ? `• ${tx.reference.substring(0, 8)}...` : ""}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold font-poppins ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                    {isCredit ? "+" : "-"}{fmt(tx.amount)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </SlideUp>
    </div>
  );
};

export default AccountsPage;
