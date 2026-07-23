import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SlideUp } from "@/components/public/Motion";
import { Search, ArrowDownLeft, ArrowUpRight, Filter, Download, Share2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number | null;
  description: string;
  reference: string;
  recipient_name: string | null;
  recipient_account: string | null;
  recipient_bank: string | null;
  status: string;
  created_at: string;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
      
    if (data) {
      setTransactions(data as Transaction[]);
    }
    setLoading(false);
  };

  const handleDownloadReceipt = () => {
    if (!selectedTx) return;

    const doc = new jsPDF();
    const dateStr = new Date(selectedTx.created_at).toLocaleString();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(33, 37, 41);
    doc.text("TrustBank Transaction Receipt", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Reference ID: ${selectedTx.reference}`, 14, 30);
    doc.text(`Date & Time: ${dateStr}`, 14, 35);
    
    // Details
    const tableData = [
      ["Transaction Type", selectedTx.type.toUpperCase().replace('_', ' ')],
      ["Status", selectedTx.status.toUpperCase()],
      ["Amount", `${selectedTx.type === 'credit' || selectedTx.type === 'deposit' ? '+' : '-'}$${Math.abs(selectedTx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      ["Balance After", selectedTx.balance_after ? `$${selectedTx.balance_after.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'N/A'],
      ["Description", selectedTx.description || selectedTx.type.toUpperCase()],
    ];

    if (selectedTx.recipient_name) tableData.push(["Recipient Name", selectedTx.recipient_name]);
    if (selectedTx.recipient_bank) tableData.push(["Recipient Bank", selectedTx.recipient_bank]);
    if (selectedTx.recipient_account) tableData.push(["Recipient Account", selectedTx.recipient_account]);

    autoTable(doc, {
      startY: 45,
      head: [["Detail", "Information"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      styles: { fontSize: 11, cellPadding: 6 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 }
      }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for banking with TrustBank.", 14, finalY + 20);

    doc.save(`TrustBank_Receipt_${selectedTx.reference}.pdf`);
  };

  const handleShareReceipt = async () => {
    if (!selectedTx) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TrustBank Transaction Receipt',
          text: `Transaction Receipt [Ref: ${selectedTx.reference}]\nAmount: $${Math.abs(selectedTx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}\nDate: ${new Date(selectedTx.created_at).toLocaleString()}`,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      handleDownloadReceipt(); // fallback to download
    }
  };

  const filteredTxs = transactions.filter(tx => 
    tx.description?.toLowerCase().includes(search.toLowerCase()) || 
    tx.reference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Transaction History</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">View and track all your account activity.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search reference or description..." 
              className="pl-9 bg-card border-border/50 rounded-xl focus-visible:ring-primary h-12 min-h-[48px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 min-h-[48px] px-4 rounded-xl border-border/50 shadow-sm shrink-0">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" /> Filter
          </Button>
          <Button variant="outline" className="h-12 min-h-[48px] px-4 rounded-xl border-border/50 shadow-sm shrink-0">
            <Download className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <SlideUp className="bg-card border border-border/50 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 sm:p-10 flex justify-center"><div className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : filteredTxs.length === 0 ? (
          <div className="p-8 sm:p-10 text-center text-muted-foreground text-body-std">
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="text-left p-2 sm:p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date & Details</th>
                  <th className="hidden sm:table-cell text-left p-2 sm:p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reference</th>
                  <th className="text-right p-2 sm:p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredTxs.map((tx) => (
                  <tr 
                    key={tx.id} 
                    className="hover:bg-muted/10 transition-colors cursor-pointer group"
                    onClick={() => setSelectedTx(tx)}
                  >
                    <td className="p-2 sm:p-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border shadow-inner ${
                          tx.type === 'credit' || tx.type === 'deposit' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}>
                          {tx.type === 'credit' || tx.type === 'deposit' ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{tx.description || tx.type}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell p-2 sm:p-3">
                      <p className="text-[10px] font-mono font-bold text-muted-foreground bg-muted inline-block px-1.5 py-0.5 rounded border border-border/50">{tx.reference}</p>
                    </td>
                    <td className="p-2 sm:p-3 text-right flex flex-col items-end justify-center">
                      <p className={`text-xs font-bold font-mono whitespace-nowrap ${
                        tx.type === 'credit' || tx.type === 'deposit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                      }`}>
                        {tx.type === 'credit' || tx.type === 'deposit' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant="outline" className={`mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0 h-4 border ${
                        tx.status === 'completed' ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : 
                        tx.status === 'pending' ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5' : 
                        'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5'
                      }`}>
                        {tx.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SlideUp>

      {/* Dedicated Transaction Detail View Modal */}
      <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border-border/50">
          <div className="bg-muted/30 p-6 flex flex-col items-center justify-center text-center border-b border-border/50 relative overflow-hidden">
            {selectedTx && (
              <>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                <div className={`h-16 w-16 rounded-full flex items-center justify-center shadow-lg border-2 mb-4 relative z-10 ${
                  selectedTx.type === 'credit' || selectedTx.type === 'deposit' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}>
                  {selectedTx.type === 'credit' || selectedTx.type === 'deposit' ? <ArrowDownLeft className="h-8 w-8" /> : <ArrowUpRight className="h-8 w-8" />}
                </div>
                <h2 className="text-3xl font-bold font-poppins text-foreground relative z-10 tracking-tight">
                  {selectedTx.type === 'credit' || selectedTx.type === 'deposit' ? '+' : '-'}${Math.abs(selectedTx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h2>
                <p className="text-sm font-medium text-muted-foreground mt-1 relative z-10">{selectedTx.description || selectedTx.type}</p>
                <Badge variant="outline" className={`mt-3 uppercase tracking-widest text-[10px] relative z-10 ${
                  selectedTx.status === 'completed' ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : 
                  selectedTx.status === 'pending' ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5' : 
                  'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5'
                }`}>
                  {selectedTx.status}
                </Badge>
              </>
            )}
          </div>
          
          {selectedTx && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Date & Time</p>
                  <p className="font-semibold text-foreground">{new Date(selectedTx.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Reference ID</p>
                  <p className="font-mono text-xs font-semibold bg-muted inline-block px-1.5 py-0.5 rounded border border-border/50 text-foreground">{selectedTx.reference}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Type</p>
                  <p className="font-semibold text-foreground capitalize">{selectedTx.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Balance After</p>
                  <p className="font-semibold text-foreground">{selectedTx.balance_after ? `$${selectedTx.balance_after.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}</p>
                </div>
                
                {selectedTx.recipient_name && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Recipient / Beneficiary</p>
                    <div className="bg-muted/30 p-3 rounded-xl border border-border/50 flex flex-col gap-1">
                      <p className="font-semibold text-foreground">{selectedTx.recipient_name}</p>
                      {selectedTx.recipient_bank && <p className="text-xs text-muted-foreground">Bank: {selectedTx.recipient_bank}</p>}
                      {selectedTx.recipient_account && <p className="text-xs text-muted-foreground font-mono">A/C: {selectedTx.recipient_account}</p>}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row gap-2">
                <Button className="w-full sm:w-1/3 rounded-xl h-11" variant="outline" onClick={() => setSelectedTx(null)}>Close</Button>
                <Button className="w-full sm:w-1/3 rounded-xl gap-2 h-11" variant="secondary" onClick={handleShareReceipt}><Share2 className="h-4 w-4" /> Share</Button>
                <Button className="w-full sm:w-1/3 rounded-xl gap-2 h-11 shadow-sm" onClick={handleDownloadReceipt}><Download className="h-4 w-4" /> Receipt</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
