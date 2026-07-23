import { useState } from "react";
import { CreditCard, Upload, CheckCircle2, ChevronRight, FileText, Briefcase, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { FadeIn } from "@/components/public/Motion";
import { sanitizeInput } from "@/utils/security";

export default function CurrentAccountApplicationPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const kycTier = profile?.kyc_tier || 0;
  if (kycTier < 2) {
    return (
    <div className="max-w-2xl mx-auto space-y-4 py-2 px-1 sm:px-4 font-sans">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Current Account</h1>
          <p className="text-xs text-muted-foreground">Apply for a current account</p>
        </div>
        <div className="bg-card rounded-xl border border-border/60 p-4 text-center shadow-sm font-sans">
          <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <h2 className="text-sm font-bold font-poppins mb-1">Feature Locked</h2>
          <p className="text-xs text-muted-foreground mb-3">You need to complete KYC Tier 2 (Standard Verification) to apply for a Current Account. Please submit your identity documents to access this feature.</p>
          <Button size="sm" className="h-8 text-xs rounded-lg" onClick={() => window.location.href = "/dashboard/kyc"}>Upgrade KYC Tier</Button>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: user?.email || "",
    occupation: "",
    employer: "",
    business_name: "",
    income_range: "0-50k",
  });

  const [files, setFiles] = useState<{ idDoc: File | null; utilityBill: File | null }>({
    idDoc: null,
    utilityBill: null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "idDoc" | "utilityBill") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Strict MIME validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Only JPG, PNG, WEBP, or PDF documents are allowed.", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File Too Large", description: "Documents must be under 5MB.", variant: "destructive" });
        return;
      }
      setFiles((prev) => ({ ...prev, [type]: file }));
    }
  };

  const uploadFile = async (file: File, prefix: string) => {
    if (!user) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${prefix}-${Math.random()}.${fileExt}`;
    const { error } = await supabase.storage.from("documents").upload(fileName, file);
    if (error) throw error;
    
    const { data } = supabase.storage.from("documents").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const submitApplication = async () => {
    if (!user) return;
    if (!files.idDoc || !files.utilityBill) {
      toast({ title: "Documents Missing", description: "Please upload both your ID and Utility Bill.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const idUrl = await uploadFile(files.idDoc, 'id');
      const utilUrl = await uploadFile(files.utilityBill, 'utility');

      const { error } = await supabase.from("current_account_applications").insert({
        user_id: user.id,
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        occupation: formData.occupation,
        employer: formData.employer,
        business_name: formData.business_name,
        income_range: formData.income_range,
        id_document_url: idUrl,
        utility_bill_url: utilUrl,
        status: "submitted"
      });

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Application Submitted",
        message: "Your current account application is under review.",
        type: "info"
      });

      toast({ title: "Application Submitted", description: "We will review your application shortly." });
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Application Failed", description: e.message, variant: "destructive" });
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
        <h1 className="text-lg sm:text-xl font-bold text-foreground font-poppins">Current Account Application</h1>
        <p className="text-xs text-muted-foreground mt-1">Access higher limits and business tools by upgrading your account.</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-center gap-3 text-xs font-medium">
        <div className={`flex items-center gap-1.5 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 text-[10px] ${step >= 1 ? "border-primary bg-primary/10" : "border-muted"}`}>1</div>
          Personal
        </div>
        <div className="w-8 h-px bg-border" />
        <div className={`flex items-center gap-1.5 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 text-[10px] ${step >= 2 ? "border-primary bg-primary/10" : "border-muted"}`}>2</div>
          Employment
        </div>
        <div className="w-8 h-px bg-border" />
        <div className={`flex items-center gap-1.5 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 text-[10px] ${step >= 3 ? "border-primary bg-primary/10" : "border-muted"}`}>3</div>
          Documents
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border/60 p-4 shadow-sm">
        {step === 1 && (
          <FadeIn className="space-y-3">
            <h2 className="text-xs font-bold font-poppins flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" /> Personal Information</h2>
            <div className="space-y-2.5">
              <div>
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Full Legal Name</Label>
                <Input name="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="John Doe" required className="h-8 text-xs rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Email Address</Label>
                  <Input name="email" value={formData.email} onChange={handleInputChange} type="email" required className="h-8 text-xs rounded-lg" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Phone Number</Label>
                  <Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 234 567 8900" required className="h-8 text-xs rounded-lg" />
                </div>
              </div>
            </div>
            <Button size="sm" onClick={() => formData.full_name && formData.phone ? setStep(2) : toast({ title: "Incomplete", description: "Please fill all fields." })} className="w-full h-8 text-xs rounded-lg">
              Continue to Employment <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </FadeIn>
        )}

        {step === 2 && (
          <FadeIn className="space-y-3">
            <h2 className="text-xs font-bold font-poppins flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-primary" /> Employment Details</h2>
            <div className="space-y-2.5">
              <div>
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Occupation</Label>
                <Input name="occupation" value={formData.occupation} onChange={handleInputChange} placeholder="Software Engineer" required className="h-8 text-xs rounded-lg" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Employer Name</Label>
                <Input name="employer" value={formData.employer} onChange={handleInputChange} placeholder="Tech Corp Inc." required className="h-8 text-xs rounded-lg" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Business Name (Optional)</Label>
                <Input name="business_name" value={formData.business_name} onChange={handleInputChange} placeholder="Doe Solutions LLC" className="h-8 text-xs rounded-lg" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Monthly Income Range</Label>
                <select name="income_range" value={formData.income_range} onChange={handleInputChange} className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="0-50k">$0 - $50,000</option>
                  <option value="50k-100k">$50,000 - $100,000</option>
                  <option value="100k-250k">$100,000 - $250,000</option>
                  <option value="250k+">$250,000+</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="w-1/3 h-8 text-xs rounded-lg">Back</Button>
              <Button size="sm" onClick={() => formData.occupation && formData.employer ? setStep(3) : toast({ title: "Incomplete", description: "Please fill required fields." })} className="w-2/3 h-8 text-xs rounded-lg">
                Continue to Documents <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </FadeIn>
        )}

        {step === 3 && (
          <FadeIn className="space-y-3">
            <h2 className="text-xs font-bold font-poppins flex items-center gap-1.5"><Upload className="h-3.5 w-3.5 text-primary" /> Required Documents</h2>
            
            <div className="space-y-2.5">
              <div className="border border-dashed rounded-xl p-3 hover:bg-muted/5 transition-colors">
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block mb-1.5">Valid Identification (Passport, Driver's License)</Label>
                <Input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, "idDoc")} className="h-8 text-xs" />
                {files.idDoc && <p className="text-xs text-success mt-1.5 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> {files.idDoc.name} attached</p>}
              </div>

              <div className="border border-dashed rounded-xl p-3 hover:bg-muted/5 transition-colors">
                <Label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block mb-1.5">Proof of Address (Utility Bill, Bank Statement)</Label>
                <p className="text-[10px] text-muted-foreground mb-1.5">Must be dated within the last 3 months.</p>
                <Input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, "utilityBill")} className="h-8 text-xs" />
                {files.utilityBill && <p className="text-xs text-success mt-1.5 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> {files.utilityBill.name} attached</p>}
              </div>
            </div>

            <div className="flex gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setStep(2)} className="w-1/3 h-8 text-xs rounded-lg" disabled={loading}>Back</Button>
              <Button size="sm" onClick={submitApplication} className="w-2/3 h-8 text-xs rounded-lg bg-primary" disabled={loading}>
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
