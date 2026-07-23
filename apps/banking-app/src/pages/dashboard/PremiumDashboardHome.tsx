import React, { useState } from 'react';
import { 
  Bell, Shield, Eye, EyeOff, Send, Receipt, Wifi, 
  Smartphone, PiggyBank, Briefcase, TrendingUp, CreditCard,
  Home, Wallet, PieChart, MoreHorizontal, ArrowUpRight, 
  ArrowDownLeft, CheckCircle2, Fingerprint, Lock, 
  ChevronRight, ShieldAlert
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";
import { Button } from '@trustbank/shared-ui/components/ui/button';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@trustbank/shared-ui/components/ThemeToggle';

// --- Data ---
const quickActions = [
  { icon: Send, label: 'Transfer', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Receipt, label: 'Pay Bills', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: Smartphone, label: 'Airtime', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: Wifi, label: 'Data', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: PiggyBank, label: 'Savings', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: Briefcase, label: 'Loans', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: TrendingUp, label: 'Invest', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: CreditCard, label: 'Cards', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

const transactions = [
  { id: 1, title: 'Starbucks Coffee', date: 'Today, 08:45 AM', amount: -4.50, status: 'successful', type: 'debit' },
  { id: 2, title: 'Salary Deposit', date: 'Yesterday, 09:00 AM', amount: 4500.00, status: 'successful', type: 'credit' },
  { id: 3, title: 'Netflix Subscription', date: 'Oct 15, 10:30 AM', amount: -15.99, status: 'pending', type: 'debit' },
  { id: 4, title: 'Transfer to John', date: 'Oct 14, 02:15 PM', amount: -150.00, status: 'failed', type: 'debit' },
];

const spendingData = [
  { name: 'Mon', amount: 120 },
  { name: 'Tue', amount: 80 },
  { name: 'Wed', amount: 250 },
  { name: 'Thu', amount: 60 },
  { name: 'Fri', amount: 310 },
  { name: 'Sat', amount: 150 },
  { name: 'Sun', amount: 90 },
];

// --- Components ---

const TopNavigation = () => (
  <header className="flex justify-between items-center py-6 px-4 sm:px-8 bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shadow-inner">
        JD
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Good Morning,</p>
        <h2 className="text-xl font-poppins font-bold text-foreground m-0">John Vance 👋</h2>
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

const BalanceCard = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1c1c] via-[#252018] to-[#0d0b08] border border-[#A67823]/30 p-8 shadow-2xl hover:-translate-y-1 transition-transform duration-500 backdrop-blur-xl text-white my-8 mx-4 sm:mx-8 group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] pointer-events-none" />
      
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
            <span className="text-3xl font-medium text-white/80">$</span>
            {isVisible ? '124,500.00' : '••••••••'}
          </div>
        </div>
        <div className="bg-[#A67823]/20 border border-[#C7993E]/30 text-transparent bg-clip-text bg-gradient-to-r from-[#F8E298] to-[#C7993E] font-poppins font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md">
          Visa Infinite
        </div>
      </div>

      <div className="text-sm font-mono text-yellow-200/50 mb-8 relative z-10">Premium Checking •••• 4092</div>
      
      <div className="flex flex-wrap gap-4 relative z-10">
        <Button className="bg-gradient-to-r from-[#C7993E] to-[#A67823] hover:from-[#F8E298] hover:to-[#C7993E] text-[#1a1408] font-bold rounded-xl h-12 px-6 flex items-center gap-2 shadow-[0_10px_30px_rgba(199,153,62,0.3)]">
          <ArrowDownLeft size={18} /> Add Money
        </Button>
        <Button variant="outline" className="bg-[#1a1408]/40 border-[#A67823]/40 hover:bg-[#A67823]/20 text-yellow-100 font-bold rounded-xl h-12 px-6 flex items-center gap-2 backdrop-blur-md">
          <ArrowUpRight size={18} /> Send
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
            <div className="flex flex-col items-center gap-3 cursor-pointer group">
              <div className={`w-14 h-14 rounded-2xl ${action.bg} flex items-center justify-center ${action.color} group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 border border-border/50`}>
                <action.icon size={22} />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors text-center">{action.label}</span>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </SlideUp>
  </section>
);

const FinancialSummary = () => (
  <section className="px-4 sm:px-8 mb-10">
    <SlideUp>
      <h3 className="text-lg font-poppins font-bold text-foreground mb-6">Financial Summary</h3>
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StaggerItem>
          <div className="bg-card/60 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp size={18} />
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Total Assets</div>
            <div className="text-xl font-bold font-poppins text-foreground">$145,200</div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-card/60 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PiggyBank size={18} />
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Total Savings</div>
            <div className="text-xl font-bold font-poppins text-foreground">$32,450</div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-card/60 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Briefcase size={18} />
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Investments</div>
            <div className="text-xl font-bold font-poppins text-foreground">$85,300</div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-card/60 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Receipt size={18} />
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Monthly Spend</div>
            <div className="text-xl font-bold font-poppins text-foreground">$4,250</div>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </SlideUp>
  </section>
);

const SmartInsights = () => (
  <section className="px-4 sm:px-8 mb-10">
    <FadeIn>
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm relative overflow-hidden group hover:bg-blue-500/10 transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />
        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
          <TrendingUp size={22} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="text-sm font-bold text-foreground">Smart Insight</h5>
            <span className="text-[9px] uppercase tracking-widest bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">New</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-blue-600 dark:text-blue-400">Great job!</strong> You spent 15% less this month compared to the same time last month. Based on this trajectory, you can safely move <strong className="text-foreground">$250</strong> to your High-Yield Savings.
          </p>
        </div>
        <Button variant="outline" className="bg-background border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 shrink-0">
          Transfer Now
        </Button>
      </div>
    </FadeIn>
  </section>
);

const RecentTransactions = () => (
  <section className="px-4 sm:px-8 mb-10">
    <div className="flex justify-between items-end mb-6">
      <h3 className="text-lg font-poppins font-bold text-foreground">Recent Activity</h3>
      <Button variant="link" className="text-primary font-semibold text-xs h-auto p-0">View All <ChevronRight size={14} className="ml-1" /></Button>
    </div>
    <div className="bg-card/60 backdrop-blur-md border border-border rounded-3xl p-2 shadow-sm">
      <div className="divide-y divide-border/50">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/30 rounded-2xl transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-success/10 text-success' : 'bg-surface text-muted-foreground'} group-hover:scale-105 transition-transform border border-border/50`}>
                {tx.type === 'credit' ? <ArrowDownLeft size={20} /> : <Receipt size={20} />}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">{tx.title}</div>
                <div className="text-[11px] text-muted-foreground">{tx.date}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-bold font-mono mb-1 ${tx.amount > 0 ? 'text-success' : 'text-foreground'}`}>
                {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
              </div>
              <div className={`text-[10px] uppercase tracking-widest font-bold ${tx.status === 'successful' ? 'text-success' : tx.status === 'pending' ? 'text-warning' : 'text-error'}`}>
                {tx.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const SpendingAnalytics = () => (
  <section className="px-4 sm:px-8 mb-10">
    <div className="flex justify-between items-end mb-6">
      <h3 className="text-lg font-poppins font-bold text-foreground">Analytics</h3>
      <select className="bg-surface border border-border text-foreground text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary">
        <option>This Week</option>
        <option>This Month</option>
      </select>
    </div>
    <div className="bg-card/60 backdrop-blur-md border border-border rounded-3xl p-6 shadow-sm h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={spendingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} />
          <Tooltip 
            cursor={{ fill: 'var(--muted)', opacity: 0.2 }} 
            contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} 
            itemStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
          />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
            {spendingData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.amount > 200 ? 'hsl(var(--secondary))' : 'hsl(var(--primary))'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
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
    <Link to="#" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors w-16">
      <Wallet size={22} className="mb-1" />
      <span className="text-[10px] font-semibold tracking-wider">Accounts</span>
    </Link>
    <div className="relative -top-6">
      <button className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-background hover:scale-105 transition-transform">
        <Send size={24} className="ml-1" />
      </button>
    </div>
    <Link to="#" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors w-16">
      <TrendingUp size={22} className="mb-1" />
      <span className="text-[10px] font-semibold tracking-wider">Invest</span>
    </Link>
    <Link to="#" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors w-16">
      <MoreHorizontal size={22} className="mb-1" />
      <span className="text-[10px] font-semibold tracking-wider">More</span>
    </Link>
  </nav>
);

export default function PremiumDashboardHome() {
  return (
    <div className="min-h-screen bg-background font-sans pb-20 relative">
      {/* Background Decorators for Dark Mode Depth */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      
      <div className="max-w-3xl mx-auto relative z-10">
        <TopNavigation />
        <BalanceCard />
        <QuickActions />
        <SmartInsights />
        <FinancialSummary />
        <RecentTransactions />
        <SpendingAnalytics />
        <SecurityCenter />
      </div>
      
      <BottomNavigation />
    </div>
  );
}
