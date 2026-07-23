import { useState, useEffect } from "react";
import { Wallet, Eye, EyeOff, ArrowUpRight, ArrowDownLeft, PiggyBank, CreditCard, Shield } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";
import { CardSkeleton, TableSkeleton } from "@trustbank/shared-ui/components/skeletons/DashboardSkeleton";

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

const AccountsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentAppStatus, setCurrentAppStatus] = useState<string>("Not Applied");
  
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
    await Promise.all([fetchAccounts(), fetchTransactions()]);
    setLoading(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Asset Accounts</h1>
          <p className="text-sm text-muted-foreground font-sans">Manage your deposit balances and portfolio accounts</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowBalance(!showBalance)} className="font-semibold text-xs">
          {showBalance ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          {showBalance ? "Hide Balances" : "Show Balances"}
        </Button>
      </div>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Savings Account */}
        <StaggerItem>
        <div 
          className={`bg-card rounded-xl p-6 border shadow-sm transition-all cursor-pointer h-full hover-lift ${selectedAccountId === savingsAcc?.id ? "ring-2 ring-primary" : ""}`}
          onClick={() => savingsAcc && setSelectedAccountId(selectedAccountId === savingsAcc.id ? null : savingsAcc.id)}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <PiggyBank className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Savings Account</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {savingsAcc ? `****${savingsAcc.account_number.slice(-4)}` : "Pending Creation"}
                </p>
              </div>
            </div>
            {savingsAcc && <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${savingsAcc.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{savingsAcc.status}</span>}
          </div>
          <p className="text-2xl font-bold text-foreground tracking-tight">
            {showBalance ? (savingsAcc ? `$${Number(savingsAcc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00") : "$ •••••••"}
          </p>
        </div>
        </StaggerItem>

        {/* Current Account */}
        <StaggerItem>
        <div 
          className={`bg-card rounded-xl p-6 border shadow-sm transition-all relative h-full hover-lift ${currentAcc ? "cursor-pointer" : ""} ${selectedAccountId === currentAcc?.id ? "ring-2 ring-primary" : ""}`}
          onClick={() => currentAcc && setSelectedAccountId(selectedAccountId === currentAcc.id ? null : currentAcc.id)}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-muted flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Current Account</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {currentAcc ? `****${currentAcc.account_number.slice(-4)}` : "Not Active"}
                </p>
              </div>
            </div>
            {currentAcc ? (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${currentAcc.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{currentAcc.status}</span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-warning/10 text-warning">{currentAppStatus}</span>
            )}
          </div>
          
          {currentAcc ? (
            <p className="text-2xl font-bold text-foreground tracking-tight">
              {showBalance ? `$${Number(currentAcc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$ •••••••"}
            </p>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground mb-4">
                {currentAppStatus === "Not Applied" ? "Apply for a current account to unlock higher limits and business tools." : "Your current account application is being reviewed."}
              </p>
              {currentAppStatus === "Not Applied" && (
                <Button size="sm" onClick={() => navigate("/dashboard/current-application")} className="w-full text-xs font-bold">
                  Apply for Current Account
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
            className={`bg-card rounded-xl p-6 border shadow-sm transition-all cursor-pointer h-full hover-lift ${selectedAccountId === acc.id ? "ring-2 ring-primary" : ""}`}
            onClick={() => setSelectedAccountId(selectedAccountId === acc.id ? null : acc.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground capitalize">{acc.account_type} Account</p>
                  <p className="text-xs text-muted-foreground font-mono">****{acc.account_number.slice(-4)}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${acc.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{acc.status}</span>
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              {showBalance ? `$${Number(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$ •••••••"}
            </p>
          </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <SlideUp>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {selectedAccountId ? "Filtered Transaction History" : "Recent Transaction Ledger"}
          </h2>
        </div>
        <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground hidden sm:table-cell uppercase tracking-wider">Reference</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">No recent ledger records found</td></tr>
                ) : filtered.map((tx) => {
                  const isCredit = tx.type === "credit" || tx.type === "deposit" || tx.type === "loan_disbursement";
                  return (
                    <tr key={tx.id} className="border-b last:border-primary hover:bg-muted/10 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isCredit ? "bg-success/10" : "bg-destructive/10"}`}>
                            {isCredit ? <ArrowDownLeft className="h-4 w-4 text-success" /> : <ArrowUpRight className="h-4 w-4 text-destructive" />}
                          </div>
                          <span className="text-sm font-semibold text-foreground">{tx.description || tx.type.replace("_", " ").toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground font-mono hidden sm:table-cell">{tx.reference || "—"}</td>
                      <td className="p-4 text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className={`p-4 text-sm font-bold text-right ${isCredit ? "text-success" : "text-foreground"}`}>
                        {isCredit ? "+" : "-"}{fmt(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </SlideUp>
    </div>
  );
};

export default AccountsPage;
