import { useState, useEffect } from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, ArrowRightLeft, Receipt, CreditCard, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";
import { DashboardPageSkeleton } from "@trustbank/shared-ui/components/skeletons/DashboardSkeleton";

const quickActions = [
  { icon: ArrowRightLeft, label: "Transfer", to: "/dashboard/transfers" },
  { icon: Receipt, label: "Pay Bills", to: "/dashboard/payments" },
  { icon: TrendingUp, label: "Originate Facility", to: "/dashboard/loans" },
  { icon: CreditCard, label: "Cards", to: "/dashboard/cards" },
];

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
  description: string | null;
  amount: number;
  type: string;
  created_at: string;
}

interface PaymentSession {
  id: string;
  status: string;
}

interface CurrentApp {
  status: string;
}

const CustomerDashboardHome = () => {
  const [showBalances, setShowBalances] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PaymentSession[]>([]);
  const [currentAppStatus, setCurrentAppStatus] = useState<string>("Not Applied");
  
  const [spendingData, setSpendingData] = useState<any[]>([]);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchData();

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "accounts", filter: `user_id=eq.${user.id}` }, () => fetchAccounts())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, () => fetchTransactions())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const fetchData = async () => {
    await Promise.all([fetchAccounts(), fetchTransactions(), fetchPaymentSessions()]);
    setLoading(false);
  };

  const fetchAccounts = async () => {
    if (!user) return;
    const { data: accs } = await supabase.from("accounts").select("*").eq("user_id", user.id);
    const activeAccs = (accs as Account[]) || [];
    setAccounts(activeAccs);

    // Check application status if current account doesn't exist
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

  const fetchPaymentSessions = async () => {
    if (!user) return;
    const { data } = await supabase.from("payment_sessions").select("id, status").eq("user_id", user.id).eq("status", "pending_payment");
    setPendingPayments((data as PaymentSession[]) || []);
  };

  const fetchTransactions = async () => {
    if (!user) return;
    const { data } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    const txs = (data as Transaction[]) || [];
    setTransactions(txs);

    const categories: Record<string, number> = {};
    let totalOutflow = 0;
    const flowMap: Record<string, { income: number; expense: number }> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      flowMap[d.toLocaleDateString("en-US", { month: "short", day: "numeric" })] = { income: 0, expense: 0 };
    }

    txs.forEach(tx => {
      const isCredit = tx.type === "credit" || tx.type === "deposit" || tx.type === "loan_disbursement";
      const amount = Number(tx.amount);
      if (!isCredit) {
        totalOutflow += amount;
        const cat = tx.type === "transfer" ? "Transfers" : tx.type === "bill_payment" ? "Bills" : tx.type === "withdrawal" ? "Withdrawals" : "Others";
        categories[cat] = (categories[cat] || 0) + amount;
      }
      const dateStr = new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (flowMap[dateStr]) {
        if (isCredit) flowMap[dateStr].income += amount;
        else flowMap[dateStr].expense += amount;
      }
    });

    const colors = ["hsl(350, 65%, 38%)", "hsl(40, 60%, 50%)", "hsl(220, 60%, 50%)", "hsl(150, 50%, 40%)"];
    const spendingArr = Object.keys(categories).map((name, i) => ({
      name, value: totalOutflow > 0 ? Math.round((categories[name] / totalOutflow) * 100) : 0, amount: categories[name], color: colors[i % colors.length]
    })).filter(c => c.value > 0);
    if (spendingArr.length === 0) spendingArr.push({ name: "No Data", value: 100, amount: 0, color: "hsl(220, 14%, 70%)" });
    setSpendingData(spendingArr);
    
    const flowArr = Object.keys(flowMap).map(date => ({ date, Income: flowMap[date].income, Expense: flowMap[date].expense }));
    setCashFlowData(flowArr);
  };

  const savingsAcc = accounts.find(a => a.account_type === 'savings');
  const currentAcc = accounts.find(a => a.account_type === 'current');
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  if (loading) return <DashboardPageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your banking activities</p>
        </div>
        <button onClick={() => setShowBalances(!showBalances)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted">
          {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showBalances ? "Hide" : "Show"} Balances
        </button>
      </div>

      {pendingPayments.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 text-warning">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">Action Required: Pending Deposit</h3>
              <p className="text-xs opacity-90 mt-0.5">You have {pendingPayments.length} pending payment(s) awaiting verification.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate("/dashboard/deposit")}
            className="shrink-0 bg-warning hover:bg-warning/90 text-warning-foreground text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Complete Deposit Verification
          </button>
        </div>
      )}

      {/* KYC Status Card — hidden once user reaches Tier 3 */}
      {profile?.kyc_tier !== 3 && (
        <StaggerItem>
          <div className="bg-card rounded-2xl border p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold font-poppins mb-1">
                KYC Status: {profile?.kyc_tier === 0 ? "Unverified" : `Tier ${profile?.kyc_tier || 0} Verified`}
              </h2>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  {(!profile?.kyc_tier || profile?.kyc_tier === 0) && "Complete your profile to unlock Basic banking privileges (Savings, Transfers)."}
                  {profile?.kyc_tier === 1 && "You have Basic Privileges. Upgrade to Tier 2 for Current accounts & Cards."}
                  {profile?.kyc_tier === 2 && "You have Standard Privileges. Upgrade to Tier 3 for Premium Wealth Management."}
                </p>
                {profile?.kyc_tier && profile.kyc_tier > 0 && (
                  <p className="font-semibold text-primary">
                    Daily Transfer Limit: ${profile.kyc_tier === 1 ? '10,000' : profile.kyc_tier === 2 ? '100,000' : '1,000,000'}
                  </p>
                )}
              </div>
            </div>
            <Link to="/dashboard/kyc" className="shrink-0">
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm">
                Upgrade Tier
              </button>
            </Link>
          </div>
        </StaggerItem>
      )}

      {/* Account Overview Cards */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Banking Balance */}
        <StaggerItem>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-700 p-8 shadow-2xl hover:-translate-y-1 transition-transform duration-500 h-full">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/20 rounded-full -mr-20 -mt-20 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/10 rounded-full -ml-10 -mb-10 blur-[60px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] mb-4">Total Wealth Balance</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-medium text-white/70">$</span>
                <p className="text-4xl lg:text-5xl font-bold text-white font-poppins tracking-tight">
                  {showBalances ? totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "••••••••"}
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-white/80 font-medium bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> All systems operational
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Portfolio</div>
            </div>
          </div>
        </div>
        </StaggerItem>

        {/* Savings Account */}
        <StaggerItem>
        <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-lg flex flex-col justify-between relative overflow-hidden h-full group hover:border-primary/30 hover:shadow-primary/5 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-success/10 transition-colors" />
          <div className="relative z-10 flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center border border-success/20">
                <Wallet className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Savings Account</p>
                <p className="text-xs font-mono text-foreground/80">{savingsAcc ? `**** ${savingsAcc.account_number.slice(-4)}` : "Pending Allocation"}</p>
              </div>
            </div>
            {savingsAcc && <span className="text-[9px] font-bold px-2 py-1 rounded-full uppercase bg-success/10 text-success border border-success/20">{savingsAcc.status}</span>}
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-bold text-foreground font-poppins">
              {showBalances ? (savingsAcc ? `$${Number(savingsAcc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00") : "$ •••••••"}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2 font-semibold">High-Yield Reserve</p>
          </div>
        </div>
        </StaggerItem>

        {/* Current Account */}
        <StaggerItem>
        <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-lg flex flex-col justify-between relative overflow-hidden h-full group hover:border-primary/30 hover:shadow-primary/5 transition-all duration-500">
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-primary/10 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Current Account</p>
                  <p className="text-xs font-mono text-foreground/80">{currentAcc ? `**** ${currentAcc.account_number.slice(-4)}` : "Inactive"}</p>
                </div>
              </div>
              {currentAcc ? (
                <span className="text-[9px] font-bold px-2 py-1 rounded-full uppercase bg-primary/10 text-primary border border-primary/20">{currentAcc.status}</span>
              ) : (
                <span className="text-[9px] font-bold px-2 py-1 rounded-full uppercase bg-warning/10 text-warning border border-warning/20">{currentAppStatus}</span>
              )}
            </div>
            
            {currentAcc ? (
              <div>
                <p className="text-3xl font-bold text-foreground font-poppins">
                  {showBalances ? `$${Number(currentAcc.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$ •••••••"}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2 font-semibold">Operating Capital</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed pr-8">
                {currentAppStatus === "Not Applied" ? "Unlock higher transfer limits and premium business features." : "Your application is currently under institutional review."}
              </p>
            )}
          </div>
          
          {!currentAcc && currentAppStatus === "Not Applied" && (
            <div className="mt-6 relative z-10">
              <button onClick={() => navigate("/dashboard/current-application")} className="text-xs font-bold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 flex items-center transition-colors shadow-sm">
                Apply Now <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
              </button>
            </div>
          )}
        </div>
        </StaggerItem>
      </StaggerContainer>

      <SlideUp>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-poppins font-bold text-foreground">Quick Actions</h2>
        </div>
        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map(({ icon: Icon, label, to }) => (
            <StaggerItem key={label}>
            <Link to={to} className="bg-card/40 backdrop-blur-md rounded-2xl p-5 border border-border/50 hover:bg-card/80 transition-all duration-300 text-center group block hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/0 rounded-full blur-[20px] transition-colors duration-500 group-hover:bg-primary/10 pointer-events-none" />
              <div className="h-12 w-12 rounded-2xl bg-background/50 flex items-center justify-center mx-auto mb-3 shadow-inner border border-border/50 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-300">
                <Icon className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">{label}</p>
            </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </SlideUp>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card/40 backdrop-blur-md rounded-3xl border border-border/50 p-6 sm:p-8 shadow-sm">
            <h2 className="font-poppins font-bold text-foreground mb-1">Liquidity Trajectory</h2>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">Capital Inflows vs Outflows (7 Days)</p>
            <div className="h-[280px]">
              {transactions.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center font-sans">
                  <span className="text-3xl mb-2 opacity-80">📈</span>
                  <p className="text-sm font-semibold text-muted-foreground">No activity recorded.</p>
                  <p className="text-xs text-muted-foreground/70">Chart will populate when transactions occur.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(150, 50%, 40%)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(150, 50%, 40%)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(350, 65%, 38%)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(350, 65%, 38%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.05} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }} tickFormatter={(val) => `$${val}`} dx={-10} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }} />
                    <Area type="monotone" dataKey="Income" stroke="hsl(150, 50%, 40%)" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                    <Area type="monotone" dataKey="Expense" stroke="hsl(350, 65%, 38%)" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          
          <div className="bg-card/40 backdrop-blur-md rounded-3xl border border-border/50 p-6 sm:p-8 shadow-sm">
            <h2 className="font-poppins font-bold text-foreground mb-1">Asset Deployment Analysis</h2>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">Outflow by sector</p>
            <div className="h-48">
              {transactions.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center font-sans">
                  <span className="text-3xl mb-2 opacity-80">📉</span>
                  <p className="text-sm font-semibold text-muted-foreground">No outflow data.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={spendingData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                      {spendingData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string, props: any) => [`${value}% ($${props.payload.amount})`, name]} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {spendingData.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs font-semibold">
                  <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                  <span className="text-muted-foreground">{cat.name} <span className="opacity-50">({cat.value}%)</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col h-full">
          <div className="flex items-end justify-between mb-4 px-2">
            <div>
              <h2 className="font-poppins font-bold text-foreground">Recent Activity</h2>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">Transaction Ledger</p>
            </div>
            <Link to="/dashboard/accounts" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center">View all <ArrowUpRight className="h-3 w-3 ml-1" /></Link>
          </div>
          <div className="bg-card/40 backdrop-blur-md rounded-3xl border border-border/50 overflow-hidden flex-1 shadow-sm">
            {transactions.length === 0 ? (
              <div className="p-10 text-center text-sm font-semibold text-muted-foreground flex flex-col items-center gap-2">
                <span className="block text-3xl mb-2">📋</span>
                Your transaction history will appear here once activity begins.
              </div>
            ) : (
              transactions.slice(0, 5).map((tx, i) => {
                const isCredit = tx.type === "credit" || tx.type === "deposit" || tx.type === "loan_disbursement";
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-colors group cursor-pointer border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 ${isCredit ? "bg-success/10 border-success/20" : "bg-muted border-border/50"}`}>
                        {isCredit ? <ArrowDownLeft className="h-5 w-5 text-success" /> : <ArrowUpRight className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{tx.description || tx.type}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-bold font-mono ${isCredit ? "text-success" : "text-foreground"}`}>
                      {isCredit ? "+" : "-"}${Math.abs(Number(tx.amount)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardHome;
