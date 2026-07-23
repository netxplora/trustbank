import { useState, useEffect } from "react";
import { Users, Wallet, ArrowRightLeft, TrendingUp, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";


const AdminDashboardHome = () => {
  const [stats, setStats] = useState({ customers: 0, activeCustomers: 0, newRegistrations: 0, accounts: 0, transactions: 0, loans: 0, pendingKyc: 0, pendingLoans: 0, pendingAccounts: 0, pendingCards: 0, openTickets: 0, txVolume: 0, aum: 0, portfolioValue: 0, pendingDeposits: 0, feeRevenue: 0 });
  const [cmsStats, setCmsStats] = useState({ pages: 0, products: 0, posts: 0, faqs: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loanDistribution, setLoanDistribution] = useState<any[]>([]);
  const [txVolumeData, setTxVolumeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [profiles, activeProfiles, newProfiles, accounts, activeAccounts, transactions, loans, kycDocs, conversations, pages, products, posts, faqs, pendingCurrentAccounts, pendingCardsData, pendingFiat, pendingCrypto, bankPortfolio] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("kyc_status", "approved"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo.toISOString()),
      supabase.from("accounts").select("id", { count: "exact", head: true }),
      supabase.from("accounts").select("balance").eq("status", "active"),
      supabase.from("transactions").select("id, amount", { count: "exact" }),
      supabase.from("loans").select("id, status, purpose, amount", { count: "exact" }),
      supabase.from("kyc_documents").select("id, status"),
      supabase.from("conversations").select("id, status"),
      (supabase as any).from("cms_pages").select("id", { count: "exact", head: true }),
      (supabase as any).from("cms_products").select("id", { count: "exact", head: true }),
      (supabase as any).from("cms_posts").select("id", { count: "exact", head: true }),
      (supabase as any).from("cms_faqs").select("id", { count: "exact", head: true }),
      supabase.from("current_account_applications").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review"]),
      supabase.from("cards").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("payment_sessions").select("id", { count: "exact", head: true }).eq("status", "under_review"),
      supabase.from("crypto_deposits").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("bank_portfolio").select("amount")
    ]);

    const pendingKyc = kycDocs.data?.filter(d => d.status === "pending").length || 0;
    const pendingLoans = loans.data?.filter(l => l.status === "pending").length || 0;
    const openTickets = conversations.data?.filter(c => c.status === "open" || c.status === "pending").length || 0;
    const pendingAccounts = pendingCurrentAccounts.count || 0;
    const pendingCards = pendingCardsData.count || 0;
    const pendingDeposits = (pendingFiat.count || 0) + (pendingCrypto.count || 0);
    const txVolume = transactions.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    
    const aum = activeAccounts.data?.reduce((sum, a) => sum + Number(a.balance), 0) || 0;
    const activeLoans = loans.data?.filter(l => l.status === "active" || l.status === "approved") || [];
    const activeLoanValue = activeLoans.reduce((sum, l) => sum + Number(l.amount), 0);
    const portfolioValue = aum + activeLoanValue;
    const feeRevenue = bankPortfolio.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

    setStats({
      customers: profiles.count || 0,
      activeCustomers: activeProfiles.count || 0,
      newRegistrations: newProfiles.count || 0,
      accounts: accounts.count || 0,
      transactions: transactions.count || 0,
      loans: activeLoans.length,
      pendingKyc,
      pendingLoans,
      pendingAccounts,
      pendingCards,
      openTickets,
      txVolume,
      aum,
      portfolioValue,
      pendingDeposits,
      feeRevenue
    });

    setCmsStats({
      pages: pages.count || 0,
      products: products.count || 0,
      posts: posts.count || 0,
      faqs: faqs.count || 0,
    });

    if (activeLoans.length > 0) {
      const purposes: Record<string, number> = {};
      activeLoans.forEach(l => {
        const p = l.purpose || "General Corporate";
        purposes[p] = (purposes[p] || 0) + 1;
      });
      const colors = ["hsl(350, 65%, 38%)", "hsl(43, 74%, 49%)", "hsl(215, 25%, 27%)", "hsl(220, 10%, 46%)", "hsl(142, 71%, 45%)"];
      const dist = Object.entries(purposes).map(([name, count], i) => ({
        name,
        value: Math.round((count / activeLoans.length) * 100),
        color: colors[i % colors.length]
      }));
      setLoanDistribution(dist);
    } else {
      setLoanDistribution([]);
    }

    const { data: recentTx } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(5);
    setRecentActivity(recentTx || []);

    const { data: monthlyTx } = await supabase.from("transactions").select("amount, created_at, type").gte("created_at", thirtyDaysAgo.toISOString());
    if (monthlyTx) {
      const volumeMap: Record<string, { deposits: number, withdrawals: number }> = {};
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        volumeMap[d.toLocaleDateString('en-US', { weekday: 'short' })] = { deposits: 0, withdrawals: 0 };
      }
      
      monthlyTx.forEach(tx => {
        const d = new Date(tx.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        if (volumeMap[d]) {
          if (tx.type === 'credit' || tx.type === 'deposit') volumeMap[d].deposits += Number(tx.amount);
          else volumeMap[d].withdrawals += Number(tx.amount);
        }
      });
      
      setTxVolumeData(Object.entries(volumeMap).map(([name, data]) => ({ name, ...data })));
    } else {
      setTxVolumeData([]);
    }

    setLoading(false);
  };

    const statCards = [
      { icon: Users, label: "Total Customers", value: stats.customers.toLocaleString(), change: `${stats.pendingKyc} Pending KYC`, color: "text-primary bg-primary/10" },
      { icon: Users, label: "Active Customers", value: stats.activeCustomers.toLocaleString(), change: "Verified Profiles", color: "text-success bg-success/10" },
      { icon: Users, label: "New Registrations", value: stats.newRegistrations.toLocaleString(), change: "Last 30 Days", color: "text-purple-600 bg-purple-50" },
      { icon: TrendingUp, label: "Active Investments", value: stats.loans.toLocaleString(), change: "Currently Managed", color: "text-warning bg-warning/10" },
      { icon: Wallet, label: "Assets Under Management", value: `$${stats.aum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: "AUM", color: "text-success bg-success/10" },
      { icon: Wallet, label: "Fee Revenue", value: `$${stats.feeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: "Collected Fees", color: "text-purple-600 bg-purple-50" },
      { icon: Wallet, label: "Portfolio Value", value: `$${stats.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: "Total Value", color: "text-primary bg-primary/10" },
    ];

  const pendingItems = [
    { label: "Pending KYC Verifications", count: stats.pendingKyc },
    { label: "Pending Credit Applications", count: stats.pendingLoans },
    { label: "Pending Account Approvals", count: stats.pendingAccounts },
    { label: "Pending Deposit Clearances", count: stats.pendingDeposits },
    { label: "Pending Card Requests", count: stats.pendingCards },
    { label: "Open Advisory Tickets", count: stats.openTickets },
  ];

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold font-poppins text-foreground tracking-tight mb-2">Institution Overview</h1>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest font-sans">Monitor administrative operations and portfolio health</p>
      </div>

      <div className="space-y-6">
        <div><h2 className="font-poppins font-bold text-foreground text-xl">Customer Statistics</h2></div>
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.slice(0, 3).map(({ icon: Icon, label, value, change, color }) => (
            <StaggerItem key={label}>
            <div className="bg-card/60 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-lg group hover:border-primary/30 hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden h-full flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-primary/10 transition-colors" />
              <div className="relative z-10 flex items-center justify-between mb-8">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-colors ${color.replace("bg-", "bg-").replace("/10", "/10 border-").replace("text-", "border-")}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-background border border-border/50 text-muted-foreground">{change}</span>
              </div>
              <div className="relative z-10">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 font-sans">{label}</p>
                <p className="text-4xl font-bold font-poppins text-foreground tracking-tight">{value}</p>
              </div>
            </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      <div className="space-y-6">
        <div><h2 className="font-poppins font-bold text-foreground text-xl">Portfolio Statistics</h2></div>
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.slice(3, 7).map(({ icon: Icon, label, value, change, color }, i) => (
            <StaggerItem key={label}>
            <div className={`rounded-3xl p-8 shadow-2xl relative overflow-hidden h-full flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-500 border ${
              i === 3 
                ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border-slate-700" 
                : "bg-card/60 backdrop-blur-xl border-border/50 hover:border-primary/30"
            }`}>
              {i === 3 && (
                <>
                  <div className="absolute right-0 top-0 w-48 h-48 bg-primary/20 rounded-full -mr-10 -mt-10 blur-[60px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full -ml-10 -mb-10 blur-[40px] pointer-events-none" />
                </>
              )}
              {i !== 3 && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-primary/10 transition-colors" />
              )}
              
              <div className="relative z-10 flex items-center justify-between mb-8">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-colors ${
                  i === 3 
                    ? "bg-white/10 border-white/10 text-white" 
                    : color.replace("bg-", "bg-").replace("/10", "/10 border-").replace("text-", "border-")
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase border ${
                  i === 3 
                    ? "bg-white/5 border-white/10 text-white/70" 
                    : "bg-background border-border/50 text-muted-foreground"
                }`}>{change}</span>
              </div>
              <div className="relative z-10">
                <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 font-sans ${i === 3 ? "text-white/60" : "text-muted-foreground"}`}>{label}</p>
                <div className="flex items-center gap-1">
                  <p className={`text-4xl font-bold font-poppins tracking-tight ${i === 3 ? "text-white" : "text-foreground"}`}>{value}</p>
                </div>
              </div>
            </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card/40 backdrop-blur-md rounded-3xl border border-border/50 p-8 shadow-sm flex flex-col relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-poppins font-bold text-foreground mb-1">Credit Portfolio Distribution</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-8 font-sans">By institutional category</p>
          </div>
          <div className="h-48 flex-1 relative z-10">
            {loanDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={loanDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                    {loanDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, ""]} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center font-sans">
                <span className="text-3xl mb-3 opacity-80">📉</span>
                <p className="text-xs font-bold text-muted-foreground">No active credit facilities.</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mt-1">Awaiting Origination</p>
              </div>
            )}
          </div>
          {loanDistribution.length > 0 && (
            <div className="grid grid-cols-1 gap-3 mt-6 font-sans relative z-10">
              {loanDistribution.map((cat) => (
                <div key={cat.name} className="flex items-center gap-3 text-xs">
                  <div className="h-3 w-3 rounded-full shadow-sm shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-muted-foreground font-semibold truncate">{cat.name} <span className="opacity-50">({cat.value}%)</span></span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-card/40 backdrop-blur-md rounded-3xl border border-border/50 p-8 shadow-sm flex flex-col relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-poppins font-bold text-foreground mb-1">Transaction Volume Trends</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-8 font-sans">Last 7 Days (Deposits vs Withdrawals)</p>
          </div>
          <div className="h-64 w-full relative z-10">
            {txVolumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={txVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="deposits" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Deposits" />
                  <Bar dataKey="withdrawals" fill="hsl(350, 65%, 38%)" radius={[4, 4, 0, 0]} name="Withdrawals" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">No volume data available</div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-3 bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-3xl border border-border/50 p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="font-poppins font-bold text-foreground mb-1">Content Management Metrics</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-8 font-sans">Active assets currently managed by the CMS platform</p>
          </div>
          
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 h-full items-center font-sans relative z-10">
            <StaggerItem>
            <div className="bg-background/60 backdrop-blur-md border border-border/50 rounded-2xl p-6 flex flex-col justify-center items-center h-full hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <span className="text-4xl font-bold font-poppins text-primary">{cmsStats.pages}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3 text-center">Dynamic Pages</span>
            </div>
            </StaggerItem>
            <StaggerItem>
            <div className="bg-background/60 backdrop-blur-md border border-border/50 rounded-2xl p-6 flex flex-col justify-center items-center h-full hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <span className="text-4xl font-bold font-poppins text-success">{cmsStats.products}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3 text-center">Products</span>
            </div>
            </StaggerItem>
            <StaggerItem>
            <div className="bg-background/60 backdrop-blur-md border border-border/50 rounded-2xl p-6 flex flex-col justify-center items-center h-full hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <span className="text-4xl font-bold font-poppins text-purple-500">{cmsStats.posts}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3 text-center">Insights</span>
            </div>
            </StaggerItem>
            <StaggerItem>
            <div className="bg-background/60 backdrop-blur-md border border-border/50 rounded-2xl p-6 flex flex-col justify-center items-center h-full hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <span className="text-4xl font-bold font-poppins text-warning">{cmsStats.faqs}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3 text-center">FAQ Entries</span>
            </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card/40 backdrop-blur-md rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 sm:p-8 border-b border-border/50">
              <h2 className="font-poppins font-bold text-foreground">Global Ledger Activity</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Recent Transactions</p>
            </div>
            <div className="font-sans flex-1">
              {recentActivity.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center gap-2">
                  <span className="block text-4xl mb-3">📭</span>
                  <p className="text-sm font-bold text-foreground">No transactions available</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">System Idle</p>
                </div>
              ) : recentActivity.map((tx, i) => {
                const isCredit = tx.type === "credit" || tx.type === "deposit";
                return (
                  <div key={tx.id} className="flex items-center gap-4 p-5 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0 group cursor-pointer">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${isCredit ? "bg-success/10 border-success/20" : "bg-muted border-border/50"}`}>
                      {isCredit ? <ArrowDownLeft className="h-5 w-5 text-success" /> : <ArrowUpRight className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground capitalize group-hover:text-primary transition-colors">{tx.description || tx.type}</p>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">{tx.reference || `REF-${tx.id.slice(0, 8).toUpperCase()}`}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold font-mono ${isCredit ? "text-success" : "text-foreground"}`}>{isCredit ? "+" : "-"}${Number(tx.amount).toLocaleString()}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-card/40 backdrop-blur-md rounded-3xl border border-border/50 shadow-sm flex flex-col h-full">
            <div className="p-6 sm:p-8 border-b border-border/50">
              <h2 className="font-poppins font-bold text-foreground">Action Items</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Pending Administrative Tasks</p>
            </div>
            <div className="p-6 space-y-4 font-sans flex-1">
              {pendingItems.map(({ label, count }) => (
                <div key={label} className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-border/50 hover:bg-muted/40 hover:border-primary/20 hover:-translate-y-0.5 transition-all cursor-pointer group">
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{label}</span>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
