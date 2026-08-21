import { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, ChevronRight, FileText, Briefcase, Lock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { FadeIn } from "@/components/public/Motion";
import { TransactionPinDialog } from "@/components/dashboard/TransactionPinDialog";

export default function CheckingApplicationPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [existingAppStatus, setExistingAppStatus] = useState<string | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [pinError, setPinError] = useState<string | undefined>();

  const [formData, setFormData] = useState({
    occupation: "",
    employer: "",
    business_name: "",
    income_range: "0-50k",
  });

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      try {
        const { data: accounts } = await supabase.from("accounts").select("id").eq("user_id", user.id).eq("account_type", "checking").eq("status", "active");
        if (accounts && accounts.length > 0) {
          setExistingAppStatus("active_account");
          setCheckingEligibility(false);
          return;
        }
        const { data: apps } = await supabase.from("current_account_applications").select("status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1);
        if (apps && apps.length > 0 && ["submitted", "under_review", "approved"].includes(apps[0].status)) {
          setExistingAppStatus(apps[0].status);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingEligibility(false);
      }
    };
    checkStatus();
  }, [user]);

  const kycTier = profile?.kyc_tier || 0;
  
  if (checkingEligibility) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (kycTier < 2) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-2 px-1 sm:px-4 font-sans">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Checking Account</h1>
          <p className="text-xs text-muted-foreground">Apply for a checking account</p>
        </div>
        <div className="bg-card rounded-xl border border-border/60 p-4 text-center shadow-sm font-sans">
          <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <h2 className="text-sm font-bold font-poppins mb-1">Feature Locked</h2>
          <p className="text-xs text-muted-foreground mb-3">You need to complete KYC Tier 2 (Standard Verification) to apply for a Checking Account. Please submit your identity documents to access this feature.</p>
          <Button size="sm" className="h-8 text-xs rounded-lg" onClick={() => window.location.href = "/dashboard/kyc"}>Upgrade KYC Tier</Button>
        </div>
      </div>
    );
  }

  if (existingAppStatus === "active_account") {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-2 px-1 sm:px-4 font-sans">
        <div className="bg-card rounded-xl border border-border/60 p-8 text-center shadow-sm font-sans">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
          <h2 className="text-lg font-bold font-poppins mb-2">You already have a Checking Account</h2>
          <p className="text-sm text-muted-foreground mb-4">Your Checking Account is fully active and ready to use.</p>
          <Button onClick={() => navigate("/dashboard")} className="rounded-lg">Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (existingAppStatus) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-2 px-1 sm:px-4 font-sans">
        <div className="bg-card rounded-xl border border-border/60 p-8 text-center shadow-sm font-sans">
          <CreditCard className="h-12 w-12 text-primary mx-auto mb-3" />
          <h2 className="text-lg font-bold font-poppins mb-2">Application Pending</h2>
          <p className="text-sm text-muted-foreground mb-4">You have a checking account application that is currently <strong>{existingAppStatus.replace('_', ' ')}</strong>. We will notify you once it's reviewed.</p>
          <Button onClick={() => navigate("/dashboard")} className="rounded-lg">Return to Dashboard</Button>
        </div>
      </div>
    );
  }



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };


  const submitApplication = async (pin: string) => {
    if (!user) return;
    setLoading(true);
    setPinError(undefined);
    try {
      const { data, error } = await (supabase.rpc as any)("submit_checking_application", {
        p_user_id: user.id,
        p_pin: pin,
        p_occupation: formData.occupation,
        p_employer: formData.employer,
        p_business_name: formData.business_name || null,
        p_income_range: formData.income_range
      });

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Application Submitted",
        message: "Your checking account application has been received and is under review.",
        type: "info"
      });

      toast({ title: "Application Submitted", description: "We will review your application shortly." });
      setPinDialogOpen(false);
      navigate("/dashboard");
    } catch (e: any) {
      if (e.message?.toLowerCase().includes("pin")) {
        setPinError(e.message);
      } else {
        toast({ title: "Submission Failed", description: e.message, variant: "destructive" });
        setPinDialogOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 py-2 px-1 sm:px-4 font-sans">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-foreground font-poppins">Checking Account Application</h1>
        <p className="text-xs text-muted-foreground mt-1">Access higher limits and business tools by upgrading your account.</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-center gap-3 text-xs font-medium">
        <div className={`flex items-center gap-1.5 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 text-[10px] ${step >= 1 ? "border-primary bg-primary/10" : "border-muted"}`}>1</div>
          Profile
        </div>
        <div className="w-8 h-px bg-border" />
        <div className={`flex items-center gap-1.5 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 text-[10px] ${step >= 2 ? "border-primary bg-primary/10" : "border-muted"}`}>2</div>
          Details
        </div>
        <div className="w-8 h-px bg-border" />
        <div className={`flex items-center gap-1.5 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 text-[10px] ${step >= 3 ? "border-primary bg-primary/10" : "border-muted"}`}>3</div>
          Review
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border/60 p-4 shadow-sm">
        {step === 1 && (
          <FadeIn className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold font-poppins flex items-center gap-1.5"><UserCheck className="h-4 w-4 text-primary" /> Verified Information</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-success/10 text-success px-2 py-0.5 rounded-full">KYC Verified</span>
            </div>
            <p className="text-xs text-muted-foreground">This information is securely pulled from your verified KYC profile.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1 block">Full Legal Name</Label>
                <div className="font-semibold text-sm">{profile?.first_name} {profile?.last_name}</div>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1 block">Email Address</Label>
                <div className="font-semibold text-sm">{profile?.email}</div>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border border-border/50 sm:col-span-2">
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1 block">Phone Number</Label>
                <div className="font-semibold text-sm">{profile?.phone || "Not provided"}</div>
              </div>
            </div>

            <div className="text-[10px] text-center text-muted-foreground pt-2">
              Is this information incorrect? <Link to="/dashboard/profile" className="text-primary hover:underline font-semibold">Update my information</Link>
            </div>

            <Button size="sm" onClick={() => setStep(2)} className="w-full h-9 text-xs rounded-lg mt-2">
              Confirm & Continue <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </FadeIn>
        )}

        {step === 2 && (
          <FadeIn className="space-y-4">
            <div className="border-b pb-3">
              <h2 className="text-sm font-bold font-poppins flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-primary" /> Application Details</h2>
              <p className="text-[10px] text-muted-foreground mt-1">Please provide the following additional details required for a checking account.</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Occupation</Label>
                <Input name="occupation" value={formData.occupation} onChange={handleInputChange} placeholder="E.g. Software Engineer" required className="h-9 text-xs rounded-lg bg-background" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Employer Name</Label>
                <Input name="employer" value={formData.employer} onChange={handleInputChange} placeholder="E.g. Tech Corp Inc." required className="h-9 text-xs rounded-lg bg-background" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Business Name (Optional)</Label>
                <Input name="business_name" value={formData.business_name} onChange={handleInputChange} placeholder="E.g. Doe Solutions LLC" className="h-9 text-xs rounded-lg bg-background" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Monthly Income Range</Label>
                <select name="income_range" value={formData.income_range} onChange={handleInputChange} className="flex h-9 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="0-50k">$0 - $50,000</option>
                  <option value="50k-100k">$50,000 - $100,000</option>
                  <option value="100k-250k">$100,000 - $250,000</option>
                  <option value="250k+">$250,000+</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="w-1/3 h-9 text-xs rounded-lg">Back</Button>
              <Button size="sm" onClick={() => formData.occupation && formData.employer ? setStep(3) : toast({ title: "Incomplete", description: "Please fill required fields." })} className="w-2/3 h-9 text-xs rounded-lg">
                Review Application <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </FadeIn>
        )}

        {step === 3 && (
          <FadeIn className="space-y-4">
            <div className="border-b pb-3 text-center">
              <h2 className="text-sm font-bold font-poppins flex items-center justify-center gap-1.5"><FileText className="h-4 w-4 text-primary" /> Review & Submit</h2>
              <p className="text-[10px] text-muted-foreground mt-1">Please review your application snapshot before authorizing submission.</p>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-3 space-y-2 border border-border/50">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Applicant</span>
                <span className="text-xs font-semibold">{profile?.first_name} {profile?.last_name}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 py-2">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Occupation</span>
                <span className="text-xs font-semibold">{formData.occupation}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Employer</span>
                <span className="text-xs font-semibold">{formData.employer}</span>
              </div>
            </div>

            <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-center">
              <Lock className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-[10px] font-medium text-foreground">You will be required to enter your 4-digit Transaction PIN to securely authorize and submit this application.</p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(2)} className="w-1/3 h-9 text-xs rounded-lg" disabled={loading}>Back</Button>
              <Button size="sm" onClick={() => setPinDialogOpen(true)} className="w-2/3 h-9 text-xs rounded-lg bg-primary" disabled={loading}>
                Authorize Submission
              </Button>
            </div>
          </FadeIn>
        )}
      </div>

      <TransactionPinDialog
        isOpen={pinDialogOpen}
        onClose={() => {
          setPinDialogOpen(false);
          setPinError(undefined);
        }}
        onConfirm={submitApplication}
        title="Confirm Application"
        description="Enter your 4-digit PIN to securely submit your Checking Account application."
        error={pinError}
        isLoading={loading}
      />
    </div>
  );
}
