import { useState, useEffect } from "react";
import { TrendingUp, CheckCircle, Clock, AlertCircle, Lock, Calculator, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";
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
  const [tab, setTab] = useState<"active" | "apply">("active");
  const [loading, setLoading] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [form, setForm] = useState({ amount: "5000", tenure: "12", purpose: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);

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
  }, [user?.id]);

  const fetchLoans = async () => {
    if (!user) return;
    const { data } = await supabase.from("loans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setLoans((data as Loan[]) || []);
    setFetchLoading(false);
  };

  const loanLimit = profile?.loan_limit || 0;
  const activeLoansTotal = loans.filter(l => l.status !== "rejected").reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0);
  const availableLimit = Math.max(0, loanLimit - activeLoansTotal);

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

    const { error } = await supabase.from("loans").insert({
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

  if (fetchLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

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

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <Button variant={tab === "active" ? "default" : "outline"} size="sm" onClick={() => setTab("active")} className="font-bold whitespace-nowrap text-xs h-8 rounded-lg">
          <TrendingUp className="h-3.5 w-3.5 mr-1" /> Active ({loans.length})
        </Button>
        <Button variant={tab === "apply" ? "default" : "outline"} size="sm" onClick={() => setTab("apply")} className="font-bold whitespace-nowrap text-xs h-8 rounded-lg">
          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Apply & Calculator
        </Button>
      </div>

      {tab === "active" ? (
        <StaggerContainer className="space-y-3">
          {loans.length === 0 ? (
            <StaggerItem>
            <div className="bg-card rounded-xl border border-border/60 p-6 text-center shadow-sm">
              <TrendingUp className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-bold text-muted-foreground">No active credit facilities found.</p>
            </div>
            </StaggerItem>
          ) : loans.map((loan) => {
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3 p-3 bg-muted/10 border border-border/40 rounded-lg">
                  <div><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Principal</p><p className="text-xs font-mono font-bold text-foreground">${Number(loan.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                  <div><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Outstanding</p><p className="text-xs font-mono font-bold text-foreground">${loan.outstanding_balance ? Number(loan.outstanding_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</p></div>
                  <div><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Monthly</p><p className="text-xs font-mono font-bold text-foreground">${loan.monthly_payment ? Number(loan.monthly_payment).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</p></div>
                  <div><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Term</p><p className="text-xs font-semibold text-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{loan.tenure_months}mo</p></div>
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
              </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
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
    </div>
  );
};

export default LoansPage;
