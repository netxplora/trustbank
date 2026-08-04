import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SlideUp } from "@/components/public/Motion";
import { Search, ArrowDownLeft, ArrowUpRight, Filter, Download, Share2 } from "lucide-react";
import { generateDocument, ContentBlock } from "@/lib/pdf/documentEngine";
import { generateReferenceNumber, generateVerificationCode } from "@/lib/pdf/referenceGenerator";
import { saveDocumentRecord } from "@/lib/pdf/documentService";
import { fetchBrandPDFColors } from "@/lib/pdf/brandColorForPDF";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom";
import { TransactionDetailsModal } from "@/components/dashboard/TransactionDetailsModal";

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
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const PAGE_SIZE = 25;
  const offsetRef = React.useRef(0);

  // Debounce search — 300ms delay prevents filter on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (user?.id) {
      offsetRef.current = 0;
      setTransactions([]);
      setHasMore(true);
      fetchTransactions(0);
    }
  }, [user]);

  const fetchTransactions = async (offset: number) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    const { data } = await (supabase as any)
      .from('transactions')
      .select('id, type, amount, balance_after, description, reference, recipient_name, recipient_account, recipient_bank, status, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (data) {
      const rows = data as unknown as Transaction[];
      setTransactions(prev => offset === 0 ? rows : [...prev, ...rows]);
      setHasMore(rows.length === PAGE_SIZE);
      offsetRef.current = offset + rows.length;
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const handleLoadMore = () => fetchTransactions(offsetRef.current);

  const filteredTxs = useMemo(() => {
    return transactions.filter(tx => 
      tx.description?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
      tx.reference?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [transactions, debouncedSearch]);

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
                    onClick={() => setSearchParams({ tx: tx.id })}
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

      {/* Load More Button */}
      {!loading && hasMore && filteredTxs.length >= PAGE_SIZE && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            className="h-10 px-6 rounded-xl text-xs font-bold"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Loading…
              </span>
            ) : "Load More Transactions"}
          </Button>
        </div>
      )}

      {/* Dedicated Transaction Detail View Modal */}
      <TransactionDetailsModal />
    </div>
  );
}
