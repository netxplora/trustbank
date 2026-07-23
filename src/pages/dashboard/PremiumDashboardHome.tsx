import React, { useState, useEffect } from 'react';
import { 
  Bell, Shield, Eye, EyeOff, Send, Receipt, Wifi, 
  Smartphone, PiggyBank, Briefcase, TrendingUp, CreditCard,
  Home, Wallet, MoreHorizontal, ArrowUpRight, 
  ArrowDownLeft, CheckCircle2, Fingerprint, Lock, 
  ChevronRight, ShieldAlert
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Virtuoso } from 'react-virtuoso';
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardPageSkeleton } from '@/components/skeletons/DashboardSkeleton';

// --- Static Data ---
const quickActions = [
  { icon: Send, label: 'Transfer', color: 'text-primary', bg: 'bg-primary/10', to: '/dashboard/transfers' },
  { icon: Receipt, label: 'Pay Bills', color: 'text-success', bg: 'bg-success/10', to: '/dashboard/payments?tab=bills' },
  { icon: Smartphone, label: 'Prepaid', color: 'text-warning', bg: 'bg-warning/10', to: '/dashboard/payments?tab=airtime' },
  { icon: Wifi, label: 'Data', color: 'text-primary', bg: 'bg-primary/10', to: '/dashboard/payments?tab=data' },
  { icon: PiggyBank, label: 'Savings', color: 'text-success', bg: 'bg-success/10', to: '/dashboard/accounts' },
  { icon: Briefcase, label: 'Loans', color: 'text-warning', bg: 'bg-warning/10', to: '/dashboard/loans' },
  { icon: TrendingUp, label: 'Invest', color: 'text-primary', bg: 'bg-primary/10', to: '/dashboard/investments' },
  { icon: CreditCard, label: 'Cards', color: 'text-success', bg: 'bg-success/10', to: '/dashboard/cards' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// --- Types ---
interface TxRow {
  id: string;
  description: string | null;
  amount: number;
  type: string;
  status: string | null;
  created_at: string;
}

interface SpendingPoint {
  name: string;
  amount: number;
}

// --- Sub-components ---

const TopNavigation = ({ displayName, initials }: { displayName: string; initials: string }) => (
  <header className="flex justify-between items-center py-6 px-4 sm:px-8 bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shadow-inner">
        {initials}
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Welcome back,</p>
        <h2 className="text-xl font-poppins font-bold text-foreground m-0">{displayName} 👋</h2>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <ThemeToggle />
      <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors text-success">
        <Shield size={20} />
      </button>
      <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors text-foreground relative">
        <Bell size={20} />
        <span className="absolute top-2 right-2.5 w-2 h-2 bg-secondary rounded-full ring-2 ring-background"></span>
      </button>
    </div>
  </header>
);

const BalanceCard = ({ totalBalance, primaryAccount }: { totalBalance: number; primaryAccount: any }) => {
  const [isVisible, setIsVisible] = useState(true);
  const acctLabel = primaryAccount
    ? `${(primaryAccount.account_type || 'Checking').charAt(0).toUpperCase() + (primaryAccount.account_type || 'checking').slice(1)} •••• ${(primaryAccount.account_number || '').slice(-4)}`
    : 'No account';
  const currencySymbol = primaryAccount?.currency === 'USD' ? '$' : primaryAccount?.currency === 'EUR' ? '€' : primaryAccount?.currency === 'GBP' ? '£' : '$';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1c1c] via-[#252018] to-[#0d0b08] border border-[#A67823]/30 p-8 shadow-2xl hover:-translate-y-1 transition-transform duration-500 backdrop-blur-xl text-white my-8 mx-4 sm:mx-8 group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Available Balance</span>
            <button 
              onClick={() => setIsVisible(!isVisible)} 
              className="text-white/60 hover:text-white transition-colors"
            >
              {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="text-4xl md:text-5xl font-poppins font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-3xl font-medium text-white/80">{currencySymbol}</span>
            {isVisible ? totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '••••••••'}
          </div>
        </div>
        <div className="bg-[#A67823]/20 border border-[#C7993E]/30 text-transparent bg-clip-text bg-gradient-to-r from-[#F8E298] to-[#C7993E] font-poppins font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md">
          Premium
        </div>
      </div>

      <div className="text-sm font-mono text-white/50 mb-8 relative z-10">{acctLabel}</div>
      
      <div className="flex flex-wrap gap-4 relative z-10">
        <Button asChild className="bg-gradient-to-r from-[#C7993E] to-[#A67823] hover:from-[#F8E298] hover:to-[#C7993E] text-[#1a1408] font-bold rounded-xl h-12 px-6 flex items-center gap-2 shadow-[0_10px_30px_rgba(199,153,62,0.3)]">
          <Link to="/dashboard/deposit"><ArrowDownLeft size={18} /> Add Money</Link>
        </Button>
        <Button variant="outline" asChild className="bg-[#1a1408]/40 border-[#A67823]/40 hover:bg-[#A67823]/20 text-[#F8E298] font-bold rounded-xl h-12 px-6 flex items-center gap-2 backdrop-blur-md">
          <Link to="/dashboard/transfers"><ArrowUpRight size={18} /> Send</Link>
        </Button>
      </div>
    </div>
  );
};

const QuickActions = () => (
  <section className="px-4 sm:px-8 mb-10">
    <SlideUp>
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-lg font-poppins font-bold text-foreground">Quick Actions</h3>
      </div>
      <StaggerContainer className="grid grid-cols-4 md:grid-cols-8 gap-4">
        {quickActions.map((action, idx) => (
          <StaggerItem key={idx}>
            <Link to={action.to} className="flex flex-col items-center gap-3 cursor-pointer group">
              <div className={`w-14 h-14 rounded-2xl ${action.bg} flex items-center justify-center ${action.color} group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 border border-border/50`}>
                <action.icon size={22} />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors text-center">{action.label}</span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </SlideUp>
  </section>
);

const FinancialSummary = ({ totalAssets, totalSavings, totalInvestments, monthlySpend }: { totalAssets: number; totalSavings: number; totalInvestments: number; monthlySpend: number }) => {
  const fmt = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

  return (
    <section className="px-4 sm:px-8 mb-10">
      <SlideUp>
        <h3 className="text-lg font-poppins font-bold text-foreground mb-6">Financial Summary</h3>
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StaggerItem>
            <div className="bg-card/60 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp size={18} />
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Total Assets</div>
              <div className="text-xl font-bold font-poppins text-foreground">{fmt(totalAssets)}</div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="bg-card/60 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PiggyBank size={18} />
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Total Savings</div>
              <div className="text-xl font-bold font-poppins text-foreground">{fmt(totalSavings)}</div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="bg-card/60 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Briefcase size={18} />
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Investments</div>
              <div className="text-xl font-bold font-poppins text-foreground">{fmt(totalInvestments)}</div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="bg-card/60 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Receipt size={18} />
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Monthly Spend</div>
              <div className="text-xl font-bold font-poppins text-foreground">{fmt(monthlySpend)}</div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </SlideUp>
    </section>
  );
};

const SmartInsights = ({ monthlySpend, totalSavings }: { monthlySpend: number; totalSavings: number }) => {
  const suggestedTransfer = Math.round(monthlySpend * 0.1);
  return (
    <section className="px-4 sm:px-8 mb-10">
      <FadeIn>
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm relative overflow-hidden group hover:bg-primary/10 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <TrendingUp size={22} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h5 className="text-sm font-bold text-foreground">Account Insight</h5>
              <span className="text-[9px] uppercase tracking-widest bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">Live</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-primary">Summary:</strong> You spent <strong className="text-foreground">${monthlySpend.toLocaleString()}</strong> this month.{' '}
              {totalSavings > 0
                ? <>Your current savings balance is <strong className="text-foreground">${totalSavings.toLocaleString()}</strong>. Consider transferring <strong className="text-foreground">${suggestedTransfer.toLocaleString()}</strong> to grow your savings further.</>
                : <>Consider opening a savings account to start building your financial cushion.</>
              }
            </p>
          </div>
          <Button variant="outline" asChild className="bg-background border-primary/30 text-primary hover:bg-primary/10 shrink-0">
            <Link to="/dashboard/transfers">Transfer Funds</Link>
          </Button>
        </div>
      </FadeIn>
    </section>
  );
};

const RecentTransactions = ({ transactions }: { transactions: TxRow[] }) => (
  <section className="px-4 sm:px-8 mb-10">
    <div className="flex justify-between items-end mb-6">
      <h3 className="text-lg font-poppins font-bold text-foreground">Recent Activity</h3>
      <Button variant="link" asChild className="text-primary font-semibold text-xs h-auto p-0">
        <Link to="/dashboard/accounts">View All <ChevronRight size={14} className="ml-1" /></Link>
      </Button>
    </div>
    <div className="bg-card/60 backdrop-blur-md border border-border rounded-3xl p-2 shadow-sm">
      <div className="divide-y divide-border/50">
        {transactions.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">No recent transactions.</div>
        )}
        {transactions.length > 0 && (
          <div style={{ height: Math.min(transactions.length * 85, 400) }}>
            <Virtuoso
              data={transactions}
              itemContent={(index, tx) => {
                const dateStr = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeStr = new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const status = tx.status || 'completed';
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/30 rounded-2xl transition-colors cursor-pointer group border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-success/10 text-success' : 'bg-surface text-muted-foreground'} group-hover:scale-105 transition-transform border border-border/50`}>
                        {tx.type === 'credit' ? <ArrowDownLeft size={20} /> : <Receipt size={20} />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground mb-1">{tx.description || 'Transaction'}</div>
                        <div className="text-[11px] text-muted-foreground">{dateStr}, {timeStr}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold font-mono mb-1 ${tx.type === 'credit' ? 'text-success' : 'text-foreground'}`}>
                        {tx.type === 'credit' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className={`text-[10px] uppercase tracking-widest font-bold ${status === 'completed' || status === 'successful' ? 'text-success' : status === 'pending' ? 'text-warning' : 'text-error'}`}>
                        {status}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        )}
      </div>
    </div>
  </section>
);

const SpendingAnalytics = ({ spendingData }: { spendingData: SpendingPoint[] }) => (
  <section className="px-4 sm:px-8 mb-10">
    <div className="flex justify-between items-end mb-6">
      <h3 className="text-lg font-poppins font-bold text-foreground">Analytics</h3>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Last 7 Days</span>
    </div>
    <div className="bg-card/60 backdrop-blur-md border border-border rounded-3xl p-6 shadow-sm h-[300px]">
      {spendingData.every(d => d.amount === 0) ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No spending data this week.</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={spendingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} />
            <Tooltip 
              cursor={{ fill: 'var(--muted)', opacity: 0.2 }} 
              contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} 
              itemStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spent']}
            />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {spendingData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.amount > 200 ? 'hsl(var(--secondary))' : 'hsl(var(--primary))'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </section>
);

const SecurityCenter = () => (
  <section className="px-4 sm:px-8 mb-24">
    <h3 className="text-lg font-poppins font-bold text-foreground mb-6">Security Center</h3>
    <div className="bg-card/60 backdrop-blur-md border border-border rounded-3xl p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden">
      <div className="absolute -bottom-10 -right-10 opacity-5">
        <ShieldAlert size={200} />
      </div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success">
            <CheckCircle2 size={16} />
          </div>
          KYC Identity Verification
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest bg-success/10 text-success px-3 py-1 rounded-full border border-success/20">Verified</div>
      </div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Fingerprint size={16} />
          </div>
          Biometric Authentication
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">Active</div>
      </div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
          <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center text-warning">
            <Lock size={16} />
          </div>
          Two-Factor Auth (2FA)
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest bg-warning/10 text-warning px-3 py-1 rounded-full border border-warning/20">Action Needed</div>
      </div>
    </div>
  </section>
);

const BottomNavigation = () => (
  <nav className="fixed bottom-0 left-0 w-full bg-background/90 backdrop-blur-xl border-t border-border flex justify-around items-center py-3 px-2 z-50 pb-safe">
    <Link to="/dashboard" className="flex flex-col items-center gap-1 text-primary w-16">
      <Home size={22} className="mb-1" />
      <span className="text-[10px] font-bold tracking-wider">Home</span>
    </Link>
    <Link to="/dashboard/accounts" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors w-16">
      <Wallet size={22} className="mb-1" />
      <span className="text-[10px] font-semibold tracking-wider">Accounts</span>
    </Link>
    <div className="relative -top-6">
      <Link to="/dashboard/transfers" className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-background hover:scale-105 transition-transform">
        <Send size={24} className="ml-1" />
      </Link>
    </div>
    <Link to="/dashboard/investments" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors w-16">
      <TrendingUp size={22} className="mb-1" />
      <span className="text-[10px] font-semibold tracking-wider">Invest</span>
    </Link>
    <Link to="/dashboard/services" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors w-16">
      <MoreHorizontal size={22} className="mb-1" />
      <span className="text-[10px] font-semibold tracking-wider">More</span>
    </Link>
  </nav>
);

// --- Main Component ---

export default function PremiumDashboardHome() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [spendingData, setSpendingData] = useState<SpendingPoint[]>([]);

  const [totalBalance, setTotalBalance] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [totalInvestments, setTotalInvestments] = useState(0);
  const [monthlySpend, setMonthlySpend] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchData();

    const channel = supabase
      .channel('premium-dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch accounts
    const { data: accs } = await supabase.from('accounts').select('*').eq('user_id', user.id);
    const activeAccounts = accs || [];
    setAccounts(activeAccounts);

    const total = activeAccounts.reduce((s, a) => s + Number(a.balance || 0), 0);
    setTotalBalance(total);

    const savings = activeAccounts
      .filter(a => a.account_type === 'savings')
      .reduce((s, a) => s + Number(a.balance || 0), 0);
    setTotalSavings(savings);

    const investments = activeAccounts
      .filter(a => a.account_type === 'investment')
      .reduce((s, a) => s + Number(a.balance || 0), 0);
    setTotalInvestments(investments);

    // Fetch transactions
    const { data: txs } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    const validTxs = (txs || []) as TxRow[];
    setTransactions(validTxs);

    // Compute monthly spend
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    let spent = 0;
    validTxs.forEach(tx => {
      const d = new Date(tx.created_at);
      if (d.getMonth() === curMonth && d.getFullYear() === curYear && tx.type === 'debit') {
        spent += Math.abs(tx.amount);
      }
    });
    setMonthlySpend(spent);

    // Compute last 7 days spending for the chart
    const chart: SpendingPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      let dayTotal = 0;
      validTxs.forEach(tx => {
        const txD = new Date(tx.created_at);
        if (tx.type === 'debit' && txD >= dayStart && txD < dayEnd) {
          dayTotal += Math.abs(tx.amount);
        }
      });
      chart.push({ name: DAY_NAMES[dayStart.getDay()], amount: Math.round(dayTotal) });
    }
    setSpendingData(chart);

    setLoading(false);
  };

  if (loading) return <DashboardPageSkeleton />;

  const displayName = profile?.display_name || profile?.first_name || 'User';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const primaryAccount = accounts[0] || null;

  return (
    <div className="min-h-screen bg-background font-sans pb-20 relative">
      {/* Background Decorators for Dark Mode Depth */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      
      <div className="max-w-3xl mx-auto relative z-10">
        <TopNavigation displayName={displayName} initials={initials} />
        <BalanceCard totalBalance={totalBalance} primaryAccount={primaryAccount} />
        <QuickActions />
        <SmartInsights monthlySpend={monthlySpend} totalSavings={totalSavings} />
        <FinancialSummary totalAssets={totalBalance} totalSavings={totalSavings} totalInvestments={totalInvestments} monthlySpend={monthlySpend} />
        <RecentTransactions transactions={transactions} />
        <SpendingAnalytics spendingData={spendingData} />
        <SecurityCenter />
      </div>
      
      <BottomNavigation />
    </div>
  );
}
