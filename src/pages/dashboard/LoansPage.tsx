import { useState, useEffect } from "react";
import { TrendingUp, CheckCircle, Clock, AlertCircle, Lock, Calculator, FileText, ChevronRight, Download, DollarSign, History, CreditCard, Banknote, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";
import { generateLoanSummaryPDF } from "@/lib/pdf/domainDocuments";
import { saveDocumentRecord } from "@/lib/pdf/documentService";
import { fetchBrandPDFColors } from "@/lib/pdf/brandColorForPDF";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Loan {
  id: string;
  amount: number;
  tenure_months: number;
  interest_rate: number;
  status: string;
  purpose: string | null;
  outstanding_balance: number | null;
  total_repaid: number;
  monthly_payment: number | null;
  created_at: string;
  approved_at: string | null;
}

const LoansPage = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<"active" | "history" | "apply">("active");
  const [loading, setLoading] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [form, setForm] = useState({ amount: "5000", tenure: "12", purpose: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Repayment state
  const [repayOpen, setRepayOpen] = useState(false);
  const [repayLoan, setRepayLoan] = useState<Loan | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayLoading, setRepayLoading] = useState(false);
  const [payAllLoading, setPayAllLoading] = useState(false);

  const calculateAmortization = (principal: number, months: number, annualRate: number) => {
    if (!principal || !months) return { monthlyPayment: 0, totalInterest: 0, totalPayment: 0 };
    const r = (annualRate / 100) / 12;
    const n = months;
    const monthlyPayment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = monthlyPayment * n;
    const totalInterest = totalPayment - principal;
    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100
    };
  };

  const kycTier = profile?.kyc_tier || 0;
  if (kycTier < 3) {
    return (
      <div className="space-y-5 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Loans & Mortgages</h1>
          <p className="text-xs text-muted-foreground">Manage your loan facilities</p>
        </div>
        <div className="bg-card rounded-xl border border-border/60 p-6 text-center shadow-sm font-sans max-w-lg mx-auto mt-6">
          <Lock className="h-9 w-9 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-base font-bold font-poppins mb-1.5">Premium Feature Locked</h2>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">You need to complete KYC Tier 3 (Premium Verification) to apply for loans. Please provide your income verification documents to access this feature.</p>
          <Button size="sm" className="h-8 text-xs font-bold rounded-lg" onClick={() => window.location.href = "/dashboard/kyc"}>Upgrade KYC Tier</Button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!user) return;
    fetchLoans();

    // Real-time subscription for loan changes
    const channel = supabase
      .channel("loans-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loans", filter: `user_id=eq.${user.id}` },
        () => { fetchLoans(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const fetchLoans = async () => {
    if (!user) return;
    const { data } = await (supabase as any).from("loans").select("id, amount, tenure_months, interest_rate, status, purpose, outstanding_balance, total_repaid, monthly_payment, created_at, approved_at").eq("user_id", user.id).order("created_at", { ascending: false });
    setLoans((data as unknown as Loan[]) || []);
    setFetchLoading(false);
  };

  const loanLimit = profile?.loan_limit || 0;
  const activeLoansTotal = loans.filter(l => l.status !== "rejected").reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0);
  const availableLimit = Math.max(0, loanLimit - activeLoansTotal);

  // Summary Stats
  const totalCollected = loans.filter(l => ["active", "approved", "completed"].includes(l.status)).reduce((sum, l) => sum + Number(l.amount), 0);
  const totalRepaid = loans.reduce((sum, l) => sum + Number(l.total_repaid || 0), 0);
  const activeLoansCount = loans.filter(l => l.status === "active" || l.status === "approved").length;
  const totalOutstanding = loans.filter(l => l.status === "active" || l.status === "approved").reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0);

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amount = parseFloat(form.amount);
    if (!amount || amount < 1000) { toast({ title: "Invalid Request", description: "Minimum facility amount is $1,000", variant: "destructive" }); return; }
    if (amount > availableLimit) { toast({ title: "Limit Exceeded", description: `You only have $${availableLimit.toLocaleString()} in available credit limit.`, variant: "destructive" }); return; }
    setConfirmOpen(true);
  };

  const handleApply = async () => {
    if (!user) return;
    setLoading(true);
    const amount = parseFloat(form.amount);
    const tenure = parseInt(form.tenure);
    const { monthlyPayment, totalPayment } = calculateAmortization(amount, tenure, 5.0);

    const { error } = await (supabase as any).from("loans").insert({
      user_id: user.id,
      amount,
      tenure_months: tenure,
      purpose: form.purpose || null,
      monthly_payment: monthlyPayment,
      outstanding_balance: totalPayment,
      status: "pending",
    });

    if (error) { toast({ title: "Authorization Failed", description: error.message, variant: "destructive" }); setLoading(false); return; }

    toast({ title: "Application Submitted", description: "Your credit facility request is under review." });
    setForm({ amount: "", tenure: "6", purpose: "" });
    setLoading(false);
    setTab("active");
    fetchLoans();
  };

  const handleRepayment = async () => {
    if (!user || !repayLoan) return;
    const amount = parseFloat(repayAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid repayment amount.", variant: "destructive" });
      return;
    }
    const outstanding = Number(repayLoan.outstanding_balance || 0);
    if (amount > outstanding) {
      toast({ title: "Amount Exceeds Balance", description: `Your outstanding balance is $${outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}. You cannot pay more than this.`, variant: "destructive" });
      return;
    }

    setRepayLoading(true);
    try {
      const newOutstanding = Math.max(0, outstanding - amount);
      const newTotalRepaid = Number(repayLoan.total_repaid || 0) + amount;
      const newStatus = newOutstanding <= 0 ? "completed" : repayLoan.status;

      // Update loan record
      const { error: loanError } = await (supabase as any)
        .from("loans")
        .update({
          outstanding_balance: newOutstanding,
          total_repaid: newTotalRepaid,
          status: newStatus,
        })
        .eq("id", repayLoan.id);

      if (loanError) throw loanError;

      // Find user's savings account to debit
      const { data: accts } = await supabase
        .from("accounts")
        .select("id, balance")
        .eq("user_id", user.id)
        .eq("account_type", "savings")
        .eq("status", "active")
        .limit(1);

      const savingsAccount = accts?.[0];
      if (savingsAccount) {
        const newBalance = Math.max(0, Number(savingsAccount.balance) - amount);
        await supabase
          .from("accounts")
          .update({ balance: newBalance } as any)
          .eq("id", savingsAccount.id);
      }

      // Create a transaction record
      await (supabase as any).from("transactions").insert({
        user_id: user.id,
        type: "debit",
        amount,
        description: `Loan repayment - ${repayLoan.purpose || "Credit Facility"} (${repayLoan.id.slice(0, 8).toUpperCase()})`,
        reference: `REPAY-${repayLoan.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        status: "completed",
      });

      toast({
        title: newStatus === "completed" ? "Loan Fully Repaid!" : "Payment Successful",
        description: newStatus === "completed"
          ? `Your loan has been fully settled. Total repaid: $${newTotalRepaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
          : `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} applied. Remaining balance: $${newOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      });

      setRepayOpen(false);
      setRepayLoan(null);
      setRepayAmount("");
      fetchLoans();
    } catch (err: any) {
      toast({ title: "Repayment Failed", description: err?.message || "Could not process repayment.", variant: "destructive" });
    } finally {
      setRepayLoading(false);
    }
  };

  const handlePayAllDebt = async () => {
    if (!user) return;
    
    const activeLoansList = loans.filter(l => l.status === "active" || l.status === "approved" || l.status === "pending");
    const totalDebt = activeLoansList.reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0);
    
    if (totalDebt <= 0) {
      toast({ title: "No Debt", description: "You have no outstanding debt to clear." });
      return;
    }

    setPayAllLoading(true);
    try {
      const { data: accts } = await supabase
        .from("accounts")
        .select("id, balance")
        .eq("user_id", user.id)
        .eq("account_type", "savings")
        .eq("status", "active")
        .limit(1);

      const savingsAccount = accts?.[0];
      if (!savingsAccount || Number(savingsAccount.balance) < totalDebt) {
        toast({ title: "Insufficient Funds", description: "You do not have enough funds in your savings account to clear all debt.", variant: "destructive" });
        setPayAllLoading(false);
        return;
      }

      const newBalance = Number(savingsAccount.balance) - totalDebt;
      await supabase
        .from("accounts")
        .update({ balance: newBalance } as any)
        .eq("id", savingsAccount.id);

      for (const loan of activeLoansList) {
        const outstanding = Number(loan.outstanding_balance || 0);
        if (outstanding <= 0) continue;

        const newTotalRepaid = Number(loan.total_repaid || 0) + outstanding;

        await (supabase as any)
          .from("loans")
          .update({
            outstanding_balance: 0,
            total_repaid: newTotalRepaid,
            status: "completed",
          })
          .eq("id", loan.id);
      }

      await (supabase as any).from("transactions").insert({
        user_id: user.id,
        type: "debit",
        amount: totalDebt,
        description: `Full Debt Clearance - ${activeLoansList.length} Facilities`,
        reference: `CLEARALL-${Date.now().toString(36).toUpperCase()}`,
        status: "completed",
      });

      toast({
        title: "All Debt Cleared!",
        description: `$${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })} paid in full. You are now debt-free!`,
      });

      fetchLoans();
    } catch (err: any) {
      toast({ title: "Clearance Failed", description: err?.message || "Could not process full debt clearance.", variant: "destructive" });
    } finally {
      setPayAllLoading(false);
    }
  };

  if (fetchLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const activeLoans = loans.filter(l => l.status === "active" || l.status === "approved" || l.status === "pending");
  const historyLoans = loans;

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Credit Facilities</h1>
          <p className="text-xs text-muted-foreground">Manage active lines of credit and submit new applications</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-2.5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-primary/80">Available Credit</p>
            <p className="text-sm font-mono font-bold text-primary">${availableLimit.toLocaleString()}</p>
          </div>
          <div className="h-7 w-px bg-primary/20"></div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total Limit</p>
            <p className="text-xs font-mono font-bold text-muted-foreground">${loanLimit.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Summary Stats Bar */}
      <SlideUp>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-card rounded-xl border border-border/60 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Banknote className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total Collected</p>
            </div>
            <p className="text-sm sm:text-base font-mono font-bold text-foreground">${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-card rounded-xl border border-border/60 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ArrowDownLeft className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total Repaid</p>
            </div>
            <p className="text-sm sm:text-base font-mono font-bold text-foreground">${totalRepaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-card rounded-xl border border-border/60 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <CreditCard className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Active Loans</p>
            </div>
            <p className="text-sm sm:text-base font-mono font-bold text-foreground">{activeLoansCount}</p>
          </div>
          <div className="bg-card rounded-xl border border-border/60 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-7 w-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Outstanding</p>
            </div>
            <p className="text-sm sm:text-base font-mono font-bold text-foreground">${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </SlideUp>

      {/* Tabs and Clear All Debt */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <Button variant={tab === "active" ? "default" : "outline"} size="sm" onClick={() => setTab("active")} className="font-bold whitespace-nowrap text-xs h-8 rounded-lg">
            <TrendingUp className="h-3.5 w-3.5 mr-1" /> Active ({activeLoans.length})
          </Button>
          <Button variant={tab === "history" ? "default" : "outline"} size="sm" onClick={() => setTab("history")} className="font-bold whitespace-nowrap text-xs h-8 rounded-lg">
            <History className="h-3.5 w-3.5 mr-1" /> History ({loans.length})
          </Button>
          <Button variant={tab === "apply" ? "default" : "outline"} size="sm" onClick={() => setTab("apply")} className="font-bold whitespace-nowrap text-xs h-8 rounded-lg">
            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Apply & Calculator
          </Button>
        </div>
        
        {totalOutstanding > 0 && (
          <Button 
            size="sm" 
            className="font-bold whitespace-nowrap text-xs h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
            onClick={handlePayAllDebt}
            disabled={payAllLoading}
          >
            {payAllLoading ? (
              <><span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" /> Processing...</>
            ) : (
              <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Clear All Debt (${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })})</>
            )}
          </Button>
        )}
      </div>

      {/* Active Tab */}
      {tab === "active" ? (
        <StaggerContainer className="space-y-3">
          {activeLoans.length === 0 ? (
            <StaggerItem>
            <div className="bg-card rounded-xl border border-border/60 p-6 text-center shadow-sm">
              <TrendingUp className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-bold text-muted-foreground">No active credit facilities found.</p>
            </div>
            </StaggerItem>
          ) : activeLoans.map((loan) => {
            const totalExpected = (loan.monthly_payment || 0) * loan.tenure_months;
            const progress = loan.outstanding_balance && totalExpected ? Math.max(0, Math.min(100, Math.round(((totalExpected - Number(loan.outstanding_balance)) / totalExpected) * 100))) : 0;
            return (
              <StaggerItem key={loan.id}>
              <div className="bg-card rounded-xl border border-border/60 p-3.5 sm:p-4 shadow-sm transition-all h-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground text-sm">{loan.purpose || "General Credit Facility"}</h3>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        loan.status === "active" || loan.status === "approved" ? "bg-success/10 text-success border-success/20" : 
                        loan.status === "pending" ? "bg-warning/10 text-warning border-warning/20" : "bg-destructive/10 text-destructive border-destructive/20"
                      }`}>{loan.status}</span>
                    </div>
                    <p className="text-[10px] font-mono font-semibold text-muted-foreground">Facility ID: {loan.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3 p-3 bg-muted/10 border border-border/40 rounded-lg">
                  <div><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Principal</p><p className="text-xs font-mono font-bold text-foreground">${Number(loan.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                  <div><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Outstanding</p><p className="text-xs font-mono font-bold text-foreground">${loan.outstanding_balance ? Number(loan.outstanding_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "\u2014"}</p></div>
                  <div><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Monthly</p><p className="text-xs font-mono font-bold text-foreground">${loan.monthly_payment ? Number(loan.monthly_payment).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "\u2014"}</p></div>
                  <div><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Repaid</p><p className="text-xs font-mono font-bold text-emerald-600">${Number(loan.total_repaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                  <div><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Rate / Term</p><p className="text-xs font-semibold text-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{loan.interest_rate || 5}% &middot; {loan.tenure_months}mo</p></div>
                </div>
                {loan.status !== "pending" && loan.status !== "rejected" && (
                  <>
                    <div className="flex justify-between items-end mb-1">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Repayment Progress</p>
                      <p className="text-[10px] font-mono font-bold text-foreground">{progress}%</p>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                  </>
                )}
                <div className="flex justify-end gap-2 mt-3">
                  {(loan.status === "active" || loan.status === "approved") && Number(loan.outstanding_balance || 0) > 0 && (
                    <Button
                      size="sm"
                      className="h-7 text-[10px] font-bold gap-1.5 rounded-lg"
                      onClick={() => {
                        setRepayLoan(loan);
                        setRepayAmount(String(loan.monthly_payment || ""));
                        setRepayOpen(true);
                      }}
                    >
                      <DollarSign className="h-3 w-3" /> Make Payment
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] font-bold gap-1.5 rounded-lg"
                    onClick={async () => {
                      if (!user || !profile) return;
                      const brandColors = await fetchBrandPDFColors();
                      const { pdf, referenceNumber, verificationCode } = await generateLoanSummaryPDF(
                        { name: profile.display_name || profile.first_name || "Valued Customer", accountNumber: (profile as any).account_number || "", email: (profile as any).email || "", phone: (profile as any).phone || "" },
                        loan,
                        brandColors
                      );
                      pdf.save(`TrustBank_Loan_${loan.id.slice(0, 8).toUpperCase()}.pdf`);
                      await saveDocumentRecord({ userId: user.id, documentType: "loan_application", documentCategory: "loans", referenceNumber, verificationCode, title: "Credit Facility Summary", entityType: "loans", entityId: loan.id, metadata: { amount: loan.amount, status: loan.status, purpose: loan.purpose } });
                    }}
                  >
                    <Download className="h-3 w-3" /> Download Summary
                  </Button>
                </div>
              </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

      /* History Tab */
      ) : tab === "history" ? (
        <StaggerContainer className="space-y-2">
          {historyLoans.length === 0 ? (
            <StaggerItem>
              <div className="bg-card rounded-xl border border-border/60 p-6 text-center shadow-sm">
                <History className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs font-bold text-muted-foreground">No loan history found.</p>
              </div>
            </StaggerItem>
          ) : historyLoans.map((loan) => (
            <StaggerItem key={loan.id}>
              <div className="bg-card rounded-xl border border-border/60 p-3 sm:p-3.5 shadow-sm transition-all hover:border-primary/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      loan.status === "completed" ? "bg-emerald-500/10 text-emerald-500" :
                      loan.status === "active" || loan.status === "approved" ? "bg-blue-500/10 text-blue-500" :
                      loan.status === "pending" ? "bg-amber-500/10 text-amber-500" :
                      "bg-rose-500/10 text-rose-500"
                    }`}>
                      {loan.status === "completed" ? <CheckCircle className="h-4 w-4" /> :
                       loan.status === "active" || loan.status === "approved" ? <TrendingUp className="h-4 w-4" /> :
                       loan.status === "pending" ? <Clock className="h-4 w-4" /> :
                       <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground text-xs truncate">{loan.purpose || "General Credit Facility"}</h3>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0 ${
                          loan.status === "completed" ? "bg-success/10 text-success border-success/20" :
                          loan.status === "active" || loan.status === "approved" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : 
                          loan.status === "pending" ? "bg-warning/10 text-warning border-warning/20" : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}>{loan.status}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(loan.created_at).toLocaleDateString()} &middot; ID: {loan.id.slice(0, 8).toUpperCase()} &middot; {loan.tenure_months}mo @ {loan.interest_rate || 5}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Principal</p>
                      <p className="text-xs font-mono font-bold text-foreground">${Number(loan.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Repaid</p>
                      <p className="text-xs font-mono font-bold text-emerald-600">${Number(loan.total_repaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Balance</p>
                      <p className="text-xs font-mono font-bold text-foreground">${Number(loan.outstanding_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-lg"
                      onClick={async () => {
                        if (!user || !profile) return;
                        const brandColors = await fetchBrandPDFColors();
                        const { pdf, referenceNumber, verificationCode } = await generateLoanSummaryPDF(
                          { name: profile.display_name || profile.first_name || "Valued Customer", accountNumber: (profile as any).account_number || "", email: (profile as any).email || "", phone: (profile as any).phone || "" },
                          loan,
                          brandColors
                        );
                        pdf.save(`TrustBank_Loan_${loan.id.slice(0, 8).toUpperCase()}.pdf`);
                        await saveDocumentRecord({ userId: user.id, documentType: "loan_application", documentCategory: "loans", referenceNumber, verificationCode, title: "Credit Facility Summary", entityType: "loans", entityId: loan.id, metadata: { amount: loan.amount, status: loan.status, purpose: loan.purpose } });
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

      /* Apply Tab */
      ) : (
        <FadeIn>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Apply & Calculator Form */}
          <div className="bg-card rounded-xl border border-border/60 p-3.5 sm:p-4 shadow-sm">
            <h2 className="font-bold font-poppins text-foreground text-sm mb-3 border-b pb-2.5 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" /> Application & Calculator
            </h2>
            <form onSubmit={handlePreview} className="space-y-3.5">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Requested Amount ($)</label>
                <Input type="number" placeholder="Enter facility amount" required min={1000} value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} className="font-mono font-bold text-sm h-9" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Term</label>
                  <select className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-semibold h-9" value={form.tenure} onChange={(e) => setForm(f => ({ ...f, tenure: e.target.value }))}>
                    {[3, 6, 9, 12, 18, 24, 36, 48, 60].map(m => <option key={m} value={m}>{m} Months</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Purpose</label>
                  <Input placeholder="Describe purpose" required value={form.purpose} onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))} className="font-semibold text-xs h-9" />
                </div>
              </div>
              
              {(() => {
                const { monthlyPayment, totalInterest, totalPayment } = calculateAmortization(parseFloat(form.amount) || 0, parseInt(form.tenure) || 12, 5.0);
                return (
                  <div className="bg-muted/20 border border-border/40 rounded-lg p-3 mt-2 space-y-2.5">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-semibold text-muted-foreground">Est. Monthly Payment</span>
                      <span className="text-base font-mono font-bold text-primary">${monthlyPayment.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-muted-foreground">Total Interest (5.00% APR)</span>
                      <span className="text-xs font-mono font-semibold text-foreground">${totalInterest.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-muted-foreground">Total Repayment</span>
                      <span className="text-xs font-mono font-bold text-foreground">${totalPayment.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                  </div>
                );
              })()}
              
              <Button type="submit" className="w-full font-bold h-9 text-xs mt-1 rounded-lg" disabled={loading}>
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </div>

          {/* Underwriting Policies */}
          <div className="bg-card rounded-xl border border-border/60 p-3.5 sm:p-4 shadow-sm">
            <h2 className="font-bold font-poppins text-foreground text-sm mb-3 border-b pb-2.5 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Underwriting Policies</h2>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
                <h3 className="font-bold text-foreground text-xs mb-0.5">Standard Interest Rate</h3>
                <p className="text-muted-foreground text-[11px] leading-relaxed">All Tier 3 personal credit facilities are subject to a fixed <span className="font-bold text-primary">5.00% APR</span>. Interest is calculated using standard amortization.</p>
              </div>
              <div className="flex gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground text-xs">Early Repayment</h4>
                  <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">No prepayment penalties. Pay off your principal balance at any time to save on interest.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground text-xs">Late Fees</h4>
                  <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">A late fee of 2.5% of the missed monthly payment will be assessed if payment is not received within a 5-day grace period.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground text-xs">Limit Increases</h4>
                  <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">Consecutive on-time payments may qualify you for an automatic limit increase from your relationship manager.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </FadeIn>
      )}

      {/* Confirm Application Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="font-sans max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-poppins text-xl">Confirm Credit Facility</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the final terms of your credit facility before transmission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="bg-muted/10 border rounded-xl p-5 space-y-3 my-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-muted-foreground">Principal Amount</span>
              <span className="font-mono font-bold text-foreground">${Number(form.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-muted-foreground">Term Duration</span>
              <span className="font-semibold text-foreground">{form.tenure} Months</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3 mt-3">
              <span className="text-sm font-semibold text-muted-foreground">Est. Monthly Payment</span>
              <span className="text-xl font-mono font-bold text-primary">${(() => {
                const { monthlyPayment } = calculateAmortization(parseFloat(form.amount) || 0, parseInt(form.tenure) || 12, 5.0);
                return monthlyPayment.toLocaleString(undefined, {minimumFractionDigits: 2});
              })()}</span>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3 mt-2">
            <input type="checkbox" id="policy-ack" className="mt-1 accent-primary" required />
            <label htmlFor="policy-ack" className="text-xs text-muted-foreground leading-relaxed font-medium select-none cursor-pointer">
              I acknowledge the <span className="font-bold text-foreground">5.00% APR</span> standard interest rate and the 2.5% late payment penalty policy. I authorize the institution to underwrite my profile.
            </label>
          </div>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={() => {
              const cb = document.getElementById("policy-ack") as HTMLInputElement;
              if (!cb?.checked) {
                toast({ title: "Acknowledgement Required", description: "You must accept the underwriting policy to proceed.", variant: "destructive" });
                return;
              }
              handleApply();
              setConfirmOpen(false);
            }} className="font-bold min-w-[140px]">
              {loading ? "Processing..." : "Confirm & Submit"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Repayment Dialog */}
      <Dialog open={repayOpen} onOpenChange={setRepayOpen}>
        <DialogContent className="font-sans max-w-md">
          <DialogHeader>
            <DialogTitle className="font-poppins text-lg">Make Loan Payment</DialogTitle>
            <DialogDescription>
              Enter the amount you want to pay towards your loan.
            </DialogDescription>
          </DialogHeader>

          {repayLoan && (
            <div className="space-y-4">
              <div className="bg-muted/10 border rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">Facility</span>
                  <span className="text-xs font-bold text-foreground">{repayLoan.purpose || "General Credit Facility"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">Outstanding Balance</span>
                  <span className="text-sm font-mono font-bold text-foreground">${Number(repayLoan.outstanding_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">Monthly Payment</span>
                  <span className="text-xs font-mono font-semibold text-muted-foreground">${Number(repayLoan.monthly_payment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-xs font-semibold text-muted-foreground">Total Repaid So Far</span>
                  <span className="text-xs font-mono font-bold text-emerald-600">${Number(repayLoan.total_repaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Payment Amount ($)</label>
                <Input
                  type="number"
                  placeholder="Enter payment amount"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="font-mono font-bold text-sm h-10"
                  min={1}
                  max={Number(repayLoan.outstanding_balance || 0)}
                  step="0.01"
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-[10px] font-bold h-7 rounded-lg"
                    onClick={() => setRepayAmount(String(repayLoan.monthly_payment || 0))}
                  >
                    Monthly (${Number(repayLoan.monthly_payment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-[10px] font-bold h-7 rounded-lg"
                    onClick={() => setRepayAmount(String(repayLoan.outstanding_balance || 0))}
                  >
                    Pay in Full (${Number(repayLoan.outstanding_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleRepayment}
                className="w-full font-bold h-10 text-xs rounded-lg"
                disabled={repayLoading || !repayAmount || parseFloat(repayAmount) <= 0}
              >
                {repayLoading ? (
                  <><span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" /> Processing...</>
                ) : (
                  <><DollarSign className="h-4 w-4 mr-1" /> Confirm Payment of ${parseFloat(repayAmount || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoansPage;
