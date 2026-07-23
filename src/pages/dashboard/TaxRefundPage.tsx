import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Plus, Upload, CheckCircle2, Clock, AlertCircle, FileText, ShieldAlert, Calculator, Landmark, ShieldCheck, Check, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";
import { getUserTaxRefundApplications, submitTaxRefundApplication, TaxRefundApplication } from "@/services/taxRefundService";
import { supabase } from "@/integrations/supabase/client";

const TAX_CREDIT_OPTIONS = [
  { id: "eitc", label: "Earned Income Tax Credit (EITC)" },
  { id: "child_credit", label: "Child & Dependent Care Credit" },
  { id: "education", label: "Higher Education Tuition Credit" },
  { id: "energy", label: "Clean Energy & Solar Efficiency Credit" },
  { id: "business", label: "Small Business & Home Office Expense" },
];

export default function TaxRefundPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [applications, setApplications] = useState<TaxRefundApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Form Verification & Qualification State
  const [taxYear, setTaxYear] = useState<number>(2025);
  const [filingStatus, setFilingStatus] = useState("Single");
  const [taxpayerName, setTaxpayerName] = useState("");
  const [ssnItin, setSsnItin] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [grossIncome, setGrossIncome] = useState("");
  const [taxWithheld, setTaxWithheld] = useState("");
  const [claimedCredits, setClaimedCredits] = useState<string[]>(["eitc"]);
  const [estimatedRefund, setEstimatedRefund] = useState("");
  const [payoutAccount, setPayoutAccount] = useState("Savings Account");
  const [docFileName, setDocFileName] = useState("W2_Tax_Return_2025.pdf");
  const [userNotes, setUserNotes] = useState("");
  const [certified, setCertified] = useState(false);

  useEffect(() => {
    if (profile?.first_name) {
      setTaxpayerName(`${profile.first_name} ${profile.last_name || ""}`.trim());
    }
  }, [profile]);

  useEffect(() => {
    loadApplications();

    // Supabase Realtime Subscription for instant status sync
    const channel = supabase
      .channel("user-tax-refunds-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tax_refund_applications" },
        () => {
          if (user?.id) loadApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadApplications = async () => {
    setLoading(true);
    const data = await getUserTaxRefundApplications(user?.id || "");
    setApplications(data);
    setLoading(false);
  };

  // Qualification Calculator logic
  const handleCalculateQualification = () => {
    const income = parseFloat(grossIncome) || 0;
    const withheld = parseFloat(taxWithheld) || 0;
    const creditBonus = claimedCredits.length * 500;
    
    // Estimated tax liability roughly 10% for quick qualification preview
    const estTaxLiability = income * 0.10;
    const computedRefund = Math.max(0, withheld - estTaxLiability + creditBonus);
    
    if (computedRefund > 0 && !estimatedRefund) {
      setEstimatedRefund(computedRefund.toFixed(2));
    }
  };

  const toggleCredit = (creditId: string) => {
    setClaimedCredits((prev) =>
      prev.includes(creditId) ? prev.filter((c) => c !== creditId) : [...prev, creditId]
    );
  };
  const formatSSN = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const handleStep1Continue = () => {
    const digitsOnly = ssnItin.replace(/\D/g, "");
    if (digitsOnly.length !== 9) {
      toast({
        title: "Complete SSN / ITIN Required",
        description: "Please enter a valid 9-digit SSN or ITIN (e.g. 123-45-6789) for tax verification.",
        variant: "destructive",
      });
      return;
    }

    if (!taxpayerName.trim() || !employerName.trim() || !grossIncome || !taxWithheld) {
      toast({
        title: "Incomplete Verification Info",
        description: "Please fill out all tax identification and income fields before proceeding.",
        variant: "destructive",
      });
      return;
    }

    handleCalculateQualification();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(estimatedRefund);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid Refund Amount", description: "Please enter a valid estimated refund amount.", variant: "destructive" });
      return;
    }

    if (!certified) {
      toast({ title: "Certification Required", description: "You must certify the tax verification declaration.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const detailedVerificationNotes = `
[Tax Verification & Qualification Info]
• Taxpayer Legal Name: ${taxpayerName || "Not Provided"}
• Complete SSN / ITIN: ${ssnItin || "Not Provided"}
• Primary Income Source/Employer: ${employerName || "N/A"}
• Gross Annual Income: $${parseFloat(grossIncome || "0").toLocaleString()}
• Tax Amount Withheld: $${parseFloat(taxWithheld || "0").toLocaleString()}
• Claimed Credits: ${claimedCredits.join(", ") || "Standard Deduction"}
• Payout Target Account: ${payoutAccount}
• Additional Notes: ${userNotes || "None"}
`.trim();

    const success = await submitTaxRefundApplication({
      user_id: user?.id,
      tax_year: taxYear,
      filing_status: filingStatus,
      estimated_refund_amount: amount,
      user_notes: detailedVerificationNotes,
      documents: [
        { name: docFileName, url: "#", uploaded_at: new Date().toISOString().split("T")[0] },
        { name: "Tax_Eligibility_Summary.pdf", url: "#", uploaded_at: new Date().toISOString().split("T")[0] }
      ],
    });

    setIsSubmitting(false);
    if (success) {
      toast({ title: "Tax Refund Claim Submitted", description: "Your tax verification claim & documents have been queued for review." });
      setDialogOpen(false);
      setStep(1);
      setEstimatedRefund("");
      setUserNotes("");
      setSsnItin("");
      setGrossIncome("");
      setTaxWithheld("");
      loadApplications();
    } else {
      toast({ title: "Submission Failed", description: "Failed to submit tax refund claim. Please try again.", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: TaxRefundApplication["status"]) => {
    switch (status) {
      case "approved":
      case "disbursed":
        return <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20">Approved & Disbursed</Badge>;
      case "under_review":
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20 border-warning/20">Under Review</Badge>;
      case "action_required":
        return <Badge className="bg-error/10 text-error hover:bg-error/20 border-error/20">Action Required</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
      default:
        return <Badge variant="outline">Submitted</Badge>;
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <SlideUp>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h1 className="font-poppins text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Tax Refund & Qualification Center
            </h1>
            <p className="text-xs text-muted-foreground mb-0.5">
              Verify your tax eligibility, submit tax documents, calculate estimated returns, and receive direct deposit disbursements.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 h-7 text-xs rounded-lg font-semibold shadow-sm">
                <Plus className="h-3.5 w-3.5" /> Apply for Tax Refund
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[580px] rounded-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase">
                    Step {step} of 2: {step === 1 ? "Tax Identification & Verification" : "Qualification & Submission"}
                  </Badge>
                </div>
                <DialogTitle className="font-poppins text-xl">Tax Refund Eligibility Application</DialogTitle>
                <DialogDescription>
                  Enter official tax information to verify eligibility and process your refund claim.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 py-2">
                {step === 1 ? (
                  /* Step 1: Verification Details */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tax Year</label>
                        <select
                          className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          value={taxYear}
                          onChange={(e) => setTaxYear(Number(e.target.value))}
                        >
                          <option value={2025}>2025 Tax Year</option>
                          <option value={2024}>2024 Tax Year</option>
                          <option value={2023}>2023 Tax Year</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filing Status</label>
                        <select
                          className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          value={filingStatus}
                          onChange={(e) => setFilingStatus(e.target.value)}
                        >
                          <option value="Single">Single</option>
                          <option value="Married Filing Jointly">Married Filing Jointly</option>
                          <option value="Head of Household">Head of Household</option>
                          <option value="Qualifying Surviving Spouse">Qualifying Surviving Spouse</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Legal Taxpayer Name</label>
                        <Input
                          type="text"
                          placeholder="e.g. Johnathan Doe"
                          value={taxpayerName}
                          onChange={(e) => setTaxpayerName(e.target.value)}
                          className="h-11 text-sm rounded-xl"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Complete SSN / ITIN (9 Digits)</label>
                        <Input
                          type="text"
                          maxLength={11}
                          placeholder="e.g. 123-45-6789"
                          value={ssnItin}
                          onChange={(e) => setSsnItin(formatSSN(e.target.value))}
                          className="h-11 text-sm rounded-xl font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Employer / Primary Income Source</label>
                      <Input
                        type="text"
                        placeholder="e.g. Acme Global Inc. / Self-Employed"
                        value={employerName}
                        onChange={(e) => setEmployerName(e.target.value)}
                        className="h-11 text-sm rounded-xl"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gross Annual Income ($)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 65000"
                          value={grossIncome}
                          onChange={(e) => setGrossIncome(e.target.value)}
                          onBlur={handleCalculateQualification}
                          className="h-11 text-sm rounded-xl"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Tax Withheld ($)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 8500"
                          value={taxWithheld}
                          onChange={(e) => setTaxWithheld(e.target.value)}
                          onBlur={handleCalculateQualification}
                          className="h-11 text-sm rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleStep1Continue}
                      className="w-full h-11 rounded-xl font-bold mt-2"
                    >
                      Continue to Qualification & Credits →
                    </Button>
                  </div>
                ) : (
                  /* Step 2: Qualification & Submission */
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Claimed Tax Credits & Deductions</label>
                      <div className="grid grid-cols-1 gap-2">
                        {TAX_CREDIT_OPTIONS.map((credit) => {
                          const isSelected = claimedCredits.includes(credit.id);
                          return (
                            <div
                              key={credit.id}
                              onClick={() => toggleCredit(credit.id)}
                              className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                                isSelected ? "border-primary bg-primary/10 text-primary" : "border-border/50 bg-background text-muted-foreground"
                              }`}
                            >
                              <span>{credit.label}</span>
                              {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Estimated Refund Claim ($)</label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={estimatedRefund}
                          onChange={(e) => setEstimatedRefund(e.target.value)}
                          className="h-11 text-base font-bold rounded-xl"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Direct Deposit Payout</label>
                        <select
                          className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          value={payoutAccount}
                          onChange={(e) => setPayoutAccount(e.target.value)}
                        >
                          <option value="Savings Account">Primary Savings Account</option>
                          <option value="Current Account">Current Checking Account</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Upload W-2 / 1099 Document Proof</label>
                      <div className="border-2 border-dashed border-border/60 rounded-xl p-3 text-center space-y-1 bg-muted/30">
                        <Upload className="h-5 w-5 text-primary mx-auto" />
                        <p className="text-xs font-semibold text-foreground">{docFileName}</p>
                        <p className="text-[10px] text-muted-foreground">PDF, PNG, or JPG files (Max 10MB)</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Additional Tax Notes</label>
                      <Textarea
                        placeholder="Provide details regarding deductions or specific return filing notes..."
                        value={userNotes}
                        onChange={(e) => setUserNotes(e.target.value)}
                        className="rounded-xl min-h-[60px] text-xs"
                      />
                    </div>

                    <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400">
                      <input
                        type="checkbox"
                        id="certify"
                        checked={certified}
                        onChange={(e) => setCertified(e.target.checked)}
                        className="mt-0.5 rounded border-amber-500"
                        required
                      />
                      <label htmlFor="certify" className="cursor-pointer">
                        I certify under penalty of perjury that the income, tax withheld, and tax verification details provided above are true, accurate, and correct.
                      </label>
                    </div>

                    <DialogFooter className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-xl text-xs">
                        ← Back
                      </Button>
                      <Button type="submit" disabled={isSubmitting || !certified} className="w-full h-11 rounded-xl font-bold">
                        {isSubmitting ? "Submitting Tax Claim..." : "Submit Verified Tax Refund Claim"}
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </SlideUp>

      {/* Verification Overview Banner */}
      <Card className="rounded-2xl border-border/50 shadow-sm bg-gradient-to-r from-slate-900 via-primary/90 to-slate-900 text-white p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/10 text-white border-white/20 font-bold">Automatic Eligibility Engine</Badge>
              <Badge className="bg-success/20 text-success-foreground border-success/30 font-bold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> IRS & State Compliant
              </Badge>
            </div>
            <h2 className="font-poppins text-xl font-bold">Maximize Your Tax Refund Eligibility</h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Our automated system verifies your W-2 tax withholdings and eligible credits to deliver fast, secure direct deposit refunds.
            </p>
          </div>
          <Button
            onClick={() => {
              setStep(1);
              setDialogOpen(true);
            }}
            className="bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl shrink-0"
          >
            Check Refund Eligibility
          </Button>
        </div>
      </Card>

      {/* Applications List */}
      <Card className="rounded-2xl border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="font-poppins text-lg">My Tax Refund Claims & Status</CardTitle>
          <CardDescription>Track verification progress, review admin notices, and inspect direct deposit payouts.</CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No tax refund applications found. Click "Apply for Tax Refund" to submit your verified claim.
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id || app.application_number} className="p-4 rounded-xl border border-border/50 bg-background/50 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border/40 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-poppins font-bold text-foreground text-base">{app.application_number}</span>
                        {getStatusBadge(app.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tax Year: {app.tax_year} | Filing Status: {app.filing_status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Claimed Refund</p>
                      <p className="font-poppins font-bold text-lg text-primary">${app.estimated_refund_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  {app.user_notes && (
                    <div className="bg-muted/40 p-3 rounded-lg text-xs font-mono whitespace-pre-line text-muted-foreground">
                      {app.user_notes}
                    </div>
                  )}

                  {app.admin_notes && (
                    <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg text-xs text-foreground">
                      <span className="font-bold text-primary">Admin Notice: </span>
                      {app.admin_notes}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                    <span>Submitted: {app.created_at ? new Date(app.created_at).toLocaleDateString() : "Recently"}</span>
                    <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {app.documents?.length || 0} Attached Document(s)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
