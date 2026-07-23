import { useState, useEffect } from "react";
import { Search, ArrowUpRight, ArrowDownLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SlideUp } from "@/components/public/Motion";

const AdminTransactionsPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data: txData } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });
      
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name");
    
    if (txData && profilesData) {
      const formatted = txData.map((t: any) => {
        const profile = profilesData.find((p: any) => p.user_id === t.user_id);
        const displayName = profile?.display_name || "Unknown";
        const isCredit = t.type === "deposit" || t.type === "transfer_in" || t.type === "loan_disbursement" || t.type === "credit";
        const from = isCredit ? (t.recipient_name || "External") : displayName;
        const to = isCredit ? displayName : (t.recipient_name || "External");
        
        return {
          id: t.id,
          display_id: "TXN-" + t.id.split('-')[0].toUpperCase(),
          raw_id: t.id,
          from,
          to,
          amount: `$${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          type: t.type.replace("_", " "),
          status: t.status.charAt(0).toUpperCase() + t.status.slice(1),
          date: new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          direction: isCredit ? "credit" : "debit"
        };
      });
      setTransactions(formatted);
    }
    setLoading(false);
  };

  const filtered = transactions.filter(t => {
    const matchesSearch = t.from.toLowerCase().includes(search.toLowerCase()) || t.to.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || t.status.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <div>
        <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">All Transactions</h1>
        <p className="text-xs text-muted-foreground font-sans">Monitor and manage all transactions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 font-sans">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search transactions..." className="pl-8 h-8 text-xs rounded-lg" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {["all", "completed", "pending", "flagged"].map(f => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize font-bold text-xs h-8 rounded-lg">{f}</Button>
          ))}
        </div>
      </div>

      <SlideUp className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/10">
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground">Reference ID</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground">Origin / Destination</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground hidden md:table-cell">Transaction Type</th>
                <th className="text-right px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground">Amount</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm font-semibold text-muted-foreground">
                    <div className="flex items-center justify-center">
                      <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                      Loading transactions...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-sm font-semibold text-muted-foreground flex-col items-center">
                    <span className="block text-3xl mb-2 opacity-80">📭</span>
                    No transaction data available.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                <tr key={t.id} className="border-b last:border-primary hover:bg-muted/10 transition-colors align-middle">
                  <td className="p-4 text-xs font-bold font-mono text-muted-foreground">{t.display_id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${t.direction === "credit" ? "bg-success/10" : "bg-destructive/10"}`}>
                        {t.direction === "credit" ? <ArrowDownLeft className="h-4 w-4 text-success" /> : <ArrowUpRight className="h-4 w-4 text-destructive" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{t.from}</p>
                        <p className="text-xs font-semibold text-muted-foreground">→ {t.to}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell"><span className="text-[10px] font-bold uppercase tracking-wider bg-muted/50 border px-2.5 py-1 rounded-sm">{t.type}</span></td>
                  <td className="p-4 text-sm font-bold font-mono text-foreground text-right">{t.amount}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${t.status === "Completed" ? "bg-success/10 text-success border-success/20" : t.status === "Pending" ? "bg-warning/10 text-warning border-warning/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>{t.status}</span>
                  </td>
                  <td className="p-4 text-xs font-semibold text-muted-foreground hidden lg:table-cell">{t.date}</td>
                  <td className="p-4 text-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted transition-colors" onClick={() => toast({ title: "Transaction Reversed", description: `${t.id} has been reversed.` })}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </SlideUp>
    </div>
  );
};

export default AdminTransactionsPage;
