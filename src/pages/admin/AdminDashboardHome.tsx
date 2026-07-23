import { useState, useEffect } from "react";
import { Users, Wallet, ArrowRightLeft, TrendingUp, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";


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

    const { data: recentTx } = await supabase.from("transactions").select("id, type, amount, description, reference, created_at").order("created_at", { ascending: false }).limit(5);
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
      { icon: Users, label: "New Registrations", value: stats.newRegistrations.toLocaleString(), change: "Last 30 Days", color: "text-primary bg-primary/10" },
      { icon: TrendingUp, label: "Active Investments", value: stats.loans.toLocaleString(), change: "Currently Managed", color: "text-warning bg-warning/10" },
      { icon: Wallet, label: "Assets Under Management", value: `$${stats.aum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: "AUM", color: "text-success bg-success/10" },
      { icon: Wallet, label: "Fee Revenue", value: `$${stats.feeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: "Collected Fees", color: "text-primary bg-primary/10" },
      { icon: Wallet, label: "Portfolio Value", value: `$${stats.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: "Total Value", color: "text-primary bg-primary/10" },
    ];

  const pendingItems = [
    { label: "Pending KYC Verifications", count: stats.pendingKyc },
    { label: "Pending Loan Applications", count: stats.pendingLoans },
    { label: "Pending Account Approvals", count: stats.pendingAccounts },
    { label: "Pending Deposit Clearances", count: stats.pendingDeposits },
    { label: "Pending Card Requests", count: stats.pendingCards },
    { label: "Open Support Tickets", count: stats.openTickets },
  ];

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <div>
        <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground tracking-tight mb-0.5">Institution Overview</h1>
        <p className="text-xs text-muted-foreground">Monitor administrative operations and portfolio health</p>
      </div>

      <div className="space-y-2.5">
        <div className="flex justify-between items-end mb-1">
          <h2 className="font-poppins font-bold text-foreground text-sm">Customer Statistics</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {statCards.slice(0, 3).map(({ icon: Icon, label, value, change, color }) => (
            <div key={label} className="bg-card rounded-xl p-3.5 border border-border/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${color.replace("bg-", "bg-").replace("/10", "/10 border-").replace("text-", "border-")}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase bg-muted/40 border border-border/40 text-muted-foreground">{change}</span>
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-xl font-bold font-poppins text-foreground tracking-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex justify-between items-end mb-1">
          <h2 className="font-poppins font-bold text-foreground text-sm">Portfolio Statistics</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.slice(3, 7).map(({ icon: Icon, label, value, change, color }, i) => (
            <div key={label} className={`rounded-xl p-3.5 shadow-sm border flex flex-col justify-between ${
              i === 3 
                ? "bg-[#0f2c59] border-[#0f2c59]" 
                : "bg-card border-border/60"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
                  i === 3 
                    ? "bg-white/10 border-white/10 text-white" 
                    : color.replace("bg-", "bg-").replace("/10", "/10 border-").replace("text-", "border-")
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                  i === 3 
                    ? "bg-white/10 border-white/20 text-white/80" 
                    : "bg-muted/40 border-border/40 text-muted-foreground"
                }`}>{change}</span>
              </div>
              <div>
                <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${i === 3 ? "text-white/70" : "text-muted-foreground"}`}>{label}</p>
                <p className={`text-xl font-bold font-poppins tracking-tight ${i === 3 ? "text-white" : "text-foreground"}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border/60 p-3.5 sm:p-4 shadow-sm flex flex-col">
          <div className="mb-2">
            <h2 className="font-poppins font-bold text-foreground text-xs">Credit Portfolio Distribution</h2>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">By category</p>
          </div>
          <div className="h-36 flex-1">
            {loanDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={loanDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
                    {loanDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, ""]} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center">
                <span className="text-xl mb-1 opacity-80">📉</span>
                <p className="text-xs font-bold text-muted-foreground">No active credit facilities</p>
              </div>
            )}
          </div>
          {loanDistribution.length > 0 && (
            <div className="grid grid-cols-1 gap-1.5 mt-2">
              {loanDistribution.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 text-[11px]">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-muted-foreground font-semibold truncate">{cat.name} <span className="opacity-50">({cat.value}%)</span></span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border border-border/60 p-3.5 sm:p-4 shadow-sm flex flex-col">
          <div className="mb-2">
            <h2 className="font-poppins font-bold text-foreground text-xs">Transaction Volume Trends</h2>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Last 7 Days (Deposits vs Withdrawals)</p>
          </div>
          <div className="h-44 w-full">
            {txVolumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={txVolumeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: "11px" }} />
                  <Bar dataKey="deposits" fill="hsl(142, 71%, 45%)" radius={[3, 3, 0, 0]} name="Deposits" />
                  <Bar dataKey="withdrawals" fill="hsl(350, 65%, 38%)" radius={[3, 3, 0, 0]} name="Withdrawals" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No volume data available</div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-3 bg-card rounded-xl border border-border/60 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="mb-2">
            <h2 className="font-poppins font-bold text-foreground text-xs">Content Management Metrics</h2>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Managed by CMS platform</p>
          </div>
          
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-2">
            <StaggerItem>
            <div className="bg-muted/20 border border-border/40 rounded-lg p-3 flex flex-col justify-center items-center">
              <span className="text-2xl font-bold font-poppins text-primary">{cmsStats.pages}</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1 text-center">Dynamic Pages</span>
            </div>
            </StaggerItem>
            <StaggerItem>
            <div className="bg-muted/20 border border-border/40 rounded-lg p-3 flex flex-col justify-center items-center">
              <span className="text-2xl font-bold font-poppins text-success">{cmsStats.products}</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1 text-center">Products</span>
            </div>
            </StaggerItem>
            <StaggerItem>
            <div className="bg-muted/20 border border-border/40 rounded-lg p-3 flex flex-col justify-center items-center">
              <span className="text-2xl font-bold font-poppins text-primary">{cmsStats.posts}</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1 text-center">Insights</span>
            </div>
            </StaggerItem>
            <StaggerItem>
            <div className="bg-muted/20 border border-border/40 rounded-lg p-3 flex flex-col justify-center items-center">
              <span className="text-2xl font-bold font-poppins text-warning">{cmsStats.faqs}</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1 text-center">FAQ Entries</span>
            </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-3 sm:p-3.5 border-b border-border/60 bg-muted/10">
              <h2 className="font-poppins font-bold text-foreground text-xs">Global Ledger Activity</h2>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Recent Transactions</p>
            </div>
            <div className="flex-1">
              {recentActivity.length === 0 ? (
                <div className="p-6 text-center flex flex-col items-center gap-1.5">
                  <span className="block text-2xl mb-1">📭</span>
                  <p className="text-xs font-bold text-foreground">No transactions available</p>
                </div>
              ) : recentActivity.map((tx) => {
                const isCredit = tx.type === "credit" || tx.type === "deposit";
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors border-b border-border/30 last:border-0">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${isCredit ? "bg-success/10 border-success/20 text-success" : "bg-muted border-border/50 text-muted-foreground"}`}>
                      {isCredit ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground capitalize truncate">{tx.description || tx.type}</p>
                      <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{tx.reference || `REF-${tx.id.slice(0, 8).toUpperCase()}`}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold font-mono ${isCredit ? "text-success" : "text-foreground"}`}>{isCredit ? "+" : "-"}${Number(tx.amount).toLocaleString()}</p>
                      <p className="text-[9px] uppercase text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-card rounded-xl border border-border/60 shadow-sm flex flex-col h-full">
            <div className="p-3 sm:p-3.5 border-b border-border/60 bg-muted/10">
              <h2 className="font-poppins font-bold text-foreground text-xs">Action Items</h2>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Pending Administrative Tasks</p>
            </div>
            <div className="p-3 space-y-2 flex-1">
              {pendingItems.map(({ label, count }) => (
                <div key={label} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/40 hover:bg-muted/40 transition-all cursor-pointer">
                  <span className="text-xs font-semibold text-foreground">{label}</span>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">{count}</span>
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
