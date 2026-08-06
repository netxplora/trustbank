import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowDownLeft, ArrowUpRight, Download, Share2, Copy, Check, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateDocument, ContentBlock } from "@/lib/pdf/documentEngine";
import { generateReferenceNumber, generateVerificationCode } from "@/lib/pdf/referenceGenerator";
import { saveDocumentRecord } from "@/lib/pdf/documentService";
import { fetchBrandPDFColors } from "@/lib/pdf/brandColorForPDF";
import { useBrand } from "@/contexts/BrandContext";

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

export function TransactionDetailsModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const txId = searchParams.get("tx");
  const { user, profile } = useAuth();
  const { identity } = useBrand();
  const brandName = identity?.short_name || "TrustBank";
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (txId && user) {
      fetchTransaction(txId);
    } else {
      setTransaction(null);
      setError("");
    }
  }, [txId, user]);

  const fetchTransaction = async (id: string) => {
    setLoading(true);
    setError("");
    
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('transactions')
        .select('id, type, amount, balance_after, description, reference, recipient_name, recipient_account, recipient_bank, status, created_at')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (fetchError || !data) {
        setError("We couldn't retrieve this transaction. Please try again.");
      } else {
        setTransaction(data as Transaction);
      }
    } catch (err) {
      setError("We couldn't retrieve this transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    searchParams.delete("tx");
    setSearchParams(searchParams, { replace: true });
  };

  const handleDownloadReceipt = async () => {
    if (!transaction || !user) return;

    const isCredit = transaction.type === 'credit' || transaction.type === 'deposit';
    const txTypeLabel = transaction.type.toUpperCase().replace(/_/g, ' ');
    const amountStr = `${isCredit ? '+' : '-'}$${Math.abs(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const docType = transaction.type.includes('transfer') ? 'transfer_receipt' : 
                    transaction.type === 'deposit' ? 'deposit_receipt' :
                    transaction.type === 'withdrawal' ? 'withdrawal_receipt' : 'payment_receipt';

    const refNum = generateReferenceNumber(docType);
    const verCode = generateVerificationCode();

    const contentRows: ContentBlock[] = [
      {
        type: "status",
        label: "Transaction Status",
        value: transaction.status,
        color: transaction.status === 'completed' ? 'green' : transaction.status === 'failed' ? 'red' : 'amber'
      },
      { type: "spacer", height: 4 },
      {
        type: "rows",
        data: [
          { label: "Transaction Type", value: txTypeLabel, bold: true },
          { label: "Amount", value: amountStr, bold: true, highlight: true },
          { label: "Description", value: transaction.description || txTypeLabel },
          { label: "Original Reference", value: transaction.reference || '—' },
          { label: "Date & Time", value: new Date(transaction.created_at).toLocaleString() },
        ]
      },
    ];

    if (transaction.recipient_name || transaction.recipient_bank || transaction.recipient_account) {
      contentRows.push({ type: "divider" });
      contentRows.push({ type: "heading", text: "Beneficiary Details" });
      const recipientRows = [];
      if (transaction.recipient_name) recipientRows.push({ label: "Recipient Name", value: transaction.recipient_name });
      if (transaction.recipient_bank) recipientRows.push({ label: "Recipient Bank", value: transaction.recipient_bank });
      if (transaction.recipient_account) recipientRows.push({ label: "Recipient Account", value: transaction.recipient_account });
      contentRows.push({ type: "rows", data: recipientRows });
    }

    const brandColors = await fetchBrandPDFColors();
    const pdf = await generateDocument({
      config: {
        title: `${txTypeLabel} Receipt`,
        documentType: docType,
        category: 'banking',
        referenceNumber: refNum,
        verificationCode: verCode,
        date: new Date(transaction.created_at),
      },
      customer: {
        name: profile?.display_name || profile?.first_name || 'Valued Customer',
        accountNumber: profile?.account_number || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
      },
      content: contentRows,
      brandColors,
    });

    pdf.save(`${brandName}_Receipt_${transaction.reference || refNum}.pdf`);

    await saveDocumentRecord({
      userId: user.id,
      documentType: docType,
      documentCategory: 'banking',
      referenceNumber: refNum,
      verificationCode: verCode,
      title: `${txTypeLabel} Receipt`,
      entityType: 'transactions',
      entityId: transaction.id,
      metadata: {
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        original_reference: transaction.reference,
      },
    });
  };

  const handleShareReceipt = async () => {
    if (!transaction) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${brandName} Transaction Receipt`,
          text: `Transaction Receipt [Ref: ${transaction.reference}]\nAmount: $${Math.abs(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}\nDate: ${new Date(transaction.created_at).toLocaleString()}`,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      handleDownloadReceipt();
    }
  };

  return (
    <Dialog open={!!txId} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[92vw] max-w-[360px] rounded-3xl p-0 overflow-hidden border-border/60 shadow-2xl bg-background">
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center space-y-3">
            <div className="h-7 w-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-[11px] font-semibold text-muted-foreground animate-pulse font-inter">Retrieving transaction details...</p>
          </div>
        ) : error ? (
          <div className="p-8 flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-1">
              <span className="text-lg font-bold">!</span>
            </div>
            <h3 className="font-bold text-foreground font-poppins text-sm">Transaction unavailable</h3>
            <p className="text-[11px] text-muted-foreground font-inter">{error}</p>
            <Button className="mt-2 rounded-lg px-4 h-8 text-[11px] font-bold" onClick={handleClose} variant="outline">Close</Button>
          </div>
        ) : transaction ? (
          <>
            {/* Header: Dynamic Amount & Primary Status */}
            <div className={`p-4 pt-5 pb-4 flex flex-col items-center justify-center text-center border-b border-dashed border-border/60 relative overflow-hidden ${
              transaction.type === 'credit' || transaction.type === 'deposit' 
                ? 'bg-gradient-to-b from-emerald-500/[0.06] to-transparent' 
                : 'bg-gradient-to-b from-primary/[0.04] to-transparent'
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shadow-inner border mb-2 relative z-10 ${
                transaction.type === 'credit' || transaction.type === 'deposit' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-primary/10 border-primary/20 text-primary'
              }`}>
                {transaction.type === 'credit' || transaction.type === 'deposit' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
              </div>
              <h2 className="text-2xl font-bold font-poppins text-foreground tracking-tight z-10">
                {transaction.type === 'credit' || transaction.type === 'deposit' ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5 relative z-10 uppercase tracking-wider font-inter">
                {transaction.description || transaction.type.replace(/_/g, ' ')}
              </p>
              
              <div className="mt-2 relative z-10">
                {transaction.status === 'completed' ? (
                  <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold py-0 h-4 px-2 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Completed
                  </Badge>
                ) : transaction.status === 'pending' ? (
                  <Badge variant="outline" className="border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[9px] font-bold py-0 h-4 px-2 rounded-full flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> Pending
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-[9px] font-bold py-0 h-4 px-2 rounded-full flex items-center gap-1">
                    <XCircle className="h-2.5 w-2.5" /> Failed
                  </Badge>
                )}
              </div>
            </div>

            {/* Details Content Panel */}
            <div className="p-4 space-y-4 font-inter">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-medium">Reference ID</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50 text-[10px]">{transaction.reference}</span>
                    <button 
                      onClick={() => handleCopyReference(transaction.reference)}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy Reference"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-medium">Date & Time</span>
                  <span className="font-semibold text-foreground">{new Date(transaction.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-medium">Transaction Type</span>
                  <span className="font-semibold text-foreground capitalize">{transaction.type.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {transaction.recipient_name && (
                <div className="pt-3 border-t border-border/40 space-y-2">
                  <h4 className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground font-poppins">Beneficiary Details</h4>
                  <div className="bg-muted/40 p-2.5 rounded-xl border border-border/40 space-y-2 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Name</span>
                      <span className="font-semibold text-foreground">{transaction.recipient_name}</span>
                    </div>
                    {transaction.recipient_bank && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-medium">Bank</span>
                        <span className="font-semibold text-foreground">{transaction.recipient_bank}</span>
                      </div>
                    )}
                    {transaction.recipient_account && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-medium">Account Number</span>
                        <span className="font-semibold text-foreground font-mono text-[10px]">{transaction.recipient_account}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border/40 grid grid-cols-3 gap-2">
                <Button className="w-full rounded-xl h-9 border-border/60 hover:bg-muted text-[11px] font-semibold" variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button className="w-full rounded-xl gap-1 h-9 text-[11px] font-semibold" variant="secondary" onClick={handleShareReceipt}>
                  <Share2 className="h-3 w-3" /> Share
                </Button>
                <Button className="w-full rounded-xl gap-1 h-9 shadow-sm text-[11px] font-semibold text-white bg-primary hover:bg-primary/90" onClick={handleDownloadReceipt}>
                  <Download className="h-3 w-3" /> Receipt
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
