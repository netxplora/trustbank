import { useState, useEffect } from "react";
import { FileText, Download, Calendar, Users, DollarSign, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { StaggerContainer, StaggerItem, SlideUp } from "@/components/public/Motion";

const reportTypes = [
  { id: "financial", title: "Financial Report", description: "Revenue, expenditures, and capital summary", icon: "📊" },
  { id: "customer", title: "Customer Demographics", description: "Customer acquisition and portfolio trends", icon: "👥" },
  { id: "transaction", title: "Transaction Volume", description: "Inbound and outbound transaction values", icon: "💳" },
  { id: "loan", title: "Loan Summary", description: "Underwriting, disbursements, and principal performance", icon: "📈" },
];

const AdminReportsPage = () => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);
  
  const [stats, setStats] = useState({ users: 0, volume: 0, loans: 0, aum: 0 });
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [acquisitionData, setAcquisitionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [profilesRes, txsRes, loansRes, accountsRes] = await Promise.all([
        supabase.from("profiles").select("created_at"),
        supabase.from("transactions").select("amount, type, created_at"),
        supabase.from("loans").select("amount").in("status", ["active", "approved"]),
        supabase.from("accounts").select("balance").eq("status", "active")
      ]);

      const profiles = profilesRes.data || [];
      const txs = txsRes.data || [];
      const loans = loansRes.data || [];
      const accounts = accountsRes.data || [];

      let volume = 0;
      const ledgerMap: Record<string, { inbound: number; outbound: number }> = {};
      const acqMap: Record<string, number> = {};

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      months.forEach(m => {
        ledgerMap[m] = { inbound: 0, outbound: 0 };
        acqMap[m] = 0;
      });

      profiles.forEach(p => {
        const d = new Date(p.created_at);
        if (d.getFullYear() === new Date().getFullYear()) {
          acqMap[months[d.getMonth()]]++;
        }
      });

      txs.forEach(tx => {
        const isCredit = tx.type === "credit" || tx.type === "deposit" || tx.type === "loan_disbursement";
        const amt = Number(tx.amount);
        volume += amt;
        
        const d = new Date(tx.created_at);
        if (d.getFullYear() === new Date().getFullYear()) {
          const m = months[d.getMonth()];
          if (isCredit) ledgerMap[m].inbound += amt;
          else ledgerMap[m].outbound += amt;
        }
      });

      setStats({
        users: profiles.length,
        volume: volume,
        loans: loans.reduce((sum, l) => sum + Number(l.amount), 0),
        aum: accounts.reduce((sum, a) => sum + Number(a.balance), 0)
      });

      setLedgerData(months.map(m => ({ month: m, Inbound: ledgerMap[m].inbound, Outbound: ledgerMap[m].outbound })));
      setAcquisitionData(months.map(m => ({ month: m, Users: acqMap[m] })));

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
      
      const reportData = {
        report_id: id,
        generated_at: new Date().toISOString(),
        summary: stats,
        ledger: id === "financial" || id === "transaction" ? ledgerData : undefined,
        acquisition: id === "customer" ? acquisitionData : undefined
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${id}_report_${Date.now()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast({ title: "Report Downloaded!", description: "Your analytical report has been saved to your device." });
    }, 800);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans text-xs">
      <div>
        <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Reports</h1>
        <p className="text-xs text-muted-foreground font-sans">Real-time platform metrics and reports</p>
      </div>

      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-sans mb-4">
        <StaggerItem>
          <div className="bg-card rounded-xl border border-border/60 p-3 shadow-sm h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Total Users</p>
                <h3 className="text-base font-bold">{stats.users.toLocaleString()}</h3>
              </div>
              <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-card rounded-xl border border-border/60 p-3 shadow-sm h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Tx Volume</p>
                <h3 className="text-base font-bold">${stats.volume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              </div>
              <div className="h-8 w-8 bg-success/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
            </div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-card rounded-xl border border-border/60 p-3 shadow-sm h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Balances</p>
                <h3 className="text-base font-bold">${stats.aum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              </div>
              <div className="h-8 w-8 bg-success/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
            </div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-card rounded-xl border border-border/60 p-3 shadow-sm h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Active Loans</p>
                <h3 className="text-base font-bold">${stats.loans.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              </div>
              <div className="h-8 w-8 bg-warning/10 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-warning" />
              </div>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StaggerItem>
          <div className="bg-card rounded-3xl border p-6 h-full">
            <h2 className="font-bold font-poppins text-foreground mb-4">Transaction Volume (YTD)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ledgerData}>
                  <defs>
                    <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(150, 50%, 40%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(150, 50%, 40%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(350, 65%, 38%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(350, 65%, 38%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Inbound" stroke="hsl(150, 50%, 40%)" fill="url(#colorInbound)" />
                  <Area type="monotone" dataKey="Outbound" stroke="hsl(350, 65%, 38%)" fill="url(#colorOutbound)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-card rounded-3xl border p-6 h-full">
            <h2 className="font-bold font-poppins text-foreground mb-4">User Acquisition (YTD)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={acquisitionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="Users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans pt-6">
        {reportTypes.map((r) => (
          <StaggerItem key={r.id}>
            <div className="bg-card rounded-3xl border p-6 shadow-sm hover-lift h-full">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{r.icon}</span>
                <Button variant="outline" size="sm" onClick={() => handleGenerate(r.id)} disabled={generating === r.id} className="font-bold">
                  {generating === r.id ? "Compiling..." : "Export JSON"}
                </Button>
              </div>
              <h3 className="font-bold font-poppins text-foreground">{r.title}</h3>
              <p className="text-xs font-semibold text-muted-foreground mt-1">{r.description}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
};

export default AdminReportsPage;
