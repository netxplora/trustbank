import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StaggerContainer, StaggerItem, SlideUp } from "@/components/public/Motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface LoanWithProfile {
  id: string;
  user_id: string;
  amount: number;
  tenure_months: number;
  interest_rate: number;
  monthly_payment: number;
  status: string;
  purpose: string | null;
  outstanding_balance: number | null;
  created_at: string;
  profiles: {
    display_name: string | null;
    email: string | null;
  } | null;
}

const AdminLoansPage = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [loans, setLoans] = useState<LoanWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [manageLoan, setManageLoan] = useState<LoanWithProfile | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", tenure_months: "", interest_rate: "" });

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    const { data: loansData } = await supabase
      .from("loans")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name, email");

    if (loansData) {
      const merged = loansData.map((loan: any) => {
        const profile = profilesData?.find((p: any) => p.user_id === loan.user_id);
        return { ...loan, profiles: profile || null };
      });
      setLoans(merged);
    } else {
      setLoans([]);
    }
    setLoading(false);
  };

  const handleManage = (loan: LoanWithProfile) => {
    setManageLoan(loan);
    setEditForm({
      amount: loan.amount.toString(),
      tenure_months: loan.tenure_months.toString(),
      interest_rate: (loan.interest_rate || 5.0).toString()
    });
  };

  const handleSaveEdits = async () => {
    if (!manageLoan) return;
    const amount = parseFloat(editForm.amount);
    const tenure = parseInt(editForm.tenure_months);
    const rate = parseFloat(editForm.interest_rate);

    if (!amount || !tenure || isNaN(rate)) {
      toast({ title: "Invalid Input", description: "Please enter valid numbers.", variant: "destructive" });
      return;
    }

    const monthlyRate = rate / 100 / 12;
    const monthlyPayment = monthlyRate === 0 
      ? amount / tenure 
      : (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);

    try {
      const { error } = await supabase.from("loans").update({
        amount,
        tenure_months: tenure,
        interest_rate: rate,
        monthly_payment: monthlyPayment,
        outstanding_balance: monthlyPayment * tenure
      }).eq("id", manageLoan.id);
      
      if (error) throw error;
      toast({ title: "Facility Updated", description: "The loan terms have been successfully updated." });
      setManageLoan(null);
      fetchLoans();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update loan.", variant: "destructive" });
    }
  };

  const handleApprove = async (loan: LoanWithProfile) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase.rpc as any)("admin_approve_loan", {
        p_admin_id: user?.id,
        p_loan_id: loan.id
      });
      
      if (error) throw error;

      toast({ title: "Facility Approved", description: `Funds have been disbursed to ${loan.profiles?.display_name || "the customer"}.` });
      fetchLoans();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An error occurred during approval.", variant: "destructive" });
    }
  };

  const handleReject = async (loan: LoanWithProfile) => {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("loans").update({ status: "rejected" }).eq("id", loan.id);
    
    await supabase.from("notifications").insert({
      user_id: loan.user_id,
      title: "Credit Facility Rejected",
      message: `Your credit application for $${loan.amount} has been declined.`,
      type: "system"
    });

    await supabase.from("audit_logs").insert({
      user_id: user?.id,
      action: "admin_rejected_loan",
      entity_type: "loans",
      entity_id: loan.id,
      details: { user_id: loan.user_id, amount: loan.amount }
    });

    toast({ title: "Facility Rejected", description: "The credit application has been declined." });
    fetchLoans();
  };

  const filtered = loans.filter(l => filter === "all" || l.status.toLowerCase() === filter);

  const totalBookValue = loans.reduce((sum, l) => sum + Number(l.amount), 0);
  const activeFacilities = loans.filter(l => l.status === "approved" || l.status === "active").length;
  const pendingUnderwriting = loans.filter(l => l.status === "pending").length;
  const outstandingCapital = loans.reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <div>
        <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Loan Applications</h1>
        <p className="text-xs text-muted-foreground font-sans">Review and manage loan applications</p>
      </div>

      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-sans">
        {[
          { label: "Total Book Value", value: `$${totalBookValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "text-primary" },
          { label: "Active Loans", value: activeFacilities.toString(), color: "text-success" },
          { label: "Pending Approval", value: pendingUnderwriting.toString(), color: "text-warning" },
          { label: "Outstanding Capital", value: `$${outstandingCapital.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "text-primary" },
        ].map(s => (
          <StaggerItem key={s.label}>
            <div className="bg-card rounded-xl border border-border/60 p-3 shadow-sm h-full">
              <p className="text-[10px] font-semibold text-muted-foreground">{s.label}</p>
              <p className={`text-base font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="flex gap-1.5 overflow-x-auto font-sans">
        {["all", "active", "pending", "approved", "rejected"].map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize font-bold text-xs h-8 rounded-lg">{f}</Button>
        ))}
      </div>

      <SlideUp className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/10">
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground">Borrower</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground">Purpose</th>
                <th className="text-right px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground">Amount</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground hidden md:table-cell">Tenure</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground">Status</th>
                <th className="text-right px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground hidden lg:table-cell">Outstanding</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm font-semibold text-muted-foreground">No loan applications found.</td>
                </tr>
              ) : filtered.map((l) => (
                <tr key={l.id} className="border-b last:border-primary hover:bg-muted/10 transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-bold text-foreground">{l.profiles?.display_name || l.profiles?.email || "Unknown"}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4"><span className="text-[10px] font-bold uppercase tracking-wider bg-muted/50 border px-2.5 py-1 rounded-sm max-w-[150px] truncate block">{l.purpose || "General Loan"}</span></td>
                  <td className="p-4 text-sm font-bold text-foreground font-mono text-right">${Number(l.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="p-4 text-sm text-muted-foreground font-semibold hidden md:table-cell">{l.tenure_months} mo</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${l.status === "approved" || l.status === "active" ? "bg-success/10 text-success border-success/20" : l.status === "pending" ? "bg-warning/10 text-warning border-warning/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>{l.status}</span>
                  </td>
                  <td className="p-4 text-sm font-bold text-foreground text-right font-mono hidden lg:table-cell">${Number(l.outstanding_balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => handleManage(l)}><Eye className="h-4 w-4" /></Button>
                      {l.status === "pending" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-success/10 hover:text-success transition-colors" onClick={() => handleApprove(l)}><CheckCircle className="h-4 w-4 text-success" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => handleReject(l)}><XCircle className="h-4 w-4 text-destructive" /></Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SlideUp>

      <Dialog open={!!manageLoan} onOpenChange={(open) => !open && setManageLoan(null)}>
        <DialogContent className="font-sans max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-poppins text-xl">Manage Loan</DialogTitle>
            <DialogDescription>
              Review or modify the terms of this loan application.
            </DialogDescription>
          </DialogHeader>

          {manageLoan && (
            <div className="space-y-5 my-2">
              <div className="grid grid-cols-2 gap-4 bg-muted/10 p-4 rounded-xl border">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Borrower</p>
                  <p className="text-sm font-semibold text-foreground">{manageLoan.profiles?.display_name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Purpose</p>
                  <p className="text-sm font-semibold text-foreground truncate">{manageLoan.purpose || "General Loan"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Amount ($)</label>
                  <Input type="number" disabled={manageLoan.status !== "pending"} value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} className="font-mono font-bold h-11 text-base" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Term (Months)</label>
                  <select disabled={manageLoan.status !== "pending"} className="w-full rounded-md border bg-background px-3 py-2 text-base font-semibold h-11" value={editForm.tenure_months} onChange={e => setEditForm(f => ({ ...f, tenure_months: e.target.value }))}>
                    {[3, 6, 9, 12, 18, 24, 36, 48, 60].map(m => <option key={m} value={m}>{m} Months</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Interest Rate (APR %)</label>
                  <Input type="number" step="0.01" disabled={manageLoan.status !== "pending"} value={editForm.interest_rate} onChange={e => setEditForm(f => ({ ...f, interest_rate: e.target.value }))} className="font-mono font-bold h-11 text-base" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Est. Monthly Payment</label>
                  <div className="h-11 flex items-center px-3 bg-muted/20 border rounded-md">
                    <span className="font-mono font-bold text-primary">
                      ${(() => {
                        const r = parseFloat(editForm.interest_rate) / 100 / 12;
                        const n = parseInt(editForm.tenure_months);
                        const p = parseFloat(editForm.amount);
                        if (!p || !n || isNaN(r)) return "0.00";
                        const pmt = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                        return pmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {manageLoan.status === "pending" && (
                <Button className="w-full font-bold" onClick={handleSaveEdits}>
                  Save Modified Terms
                </Button>
              )}
            </div>
          )}

          <DialogFooter className="sm:justify-between border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setManageLoan(null)}>Close</Button>
            {manageLoan?.status === "pending" && (
              <div className="flex gap-2">
                <Button variant="destructive" className="font-bold" onClick={() => { handleReject(manageLoan); setManageLoan(null); }}>
                  Reject Loan
                </Button>
                <Button className="bg-success hover:bg-success/90 text-success-foreground font-bold" onClick={() => { handleApprove(manageLoan); setManageLoan(null); }}>
                  Approve Loan
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLoansPage;
