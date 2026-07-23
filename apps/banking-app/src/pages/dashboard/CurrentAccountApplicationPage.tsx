import { useState } from "react";
import { CreditCard, Upload, CheckCircle2, ChevronRight, FileText, Briefcase, Lock } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { Label } from "@trustbank/shared-ui/components/ui/label";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { FadeIn } from "@trustbank/shared-ui/components/Motion";
import { sanitizeInput } from "@trustbank/shared-utils/utils/security";

export default function CurrentAccountApplicationPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const kycTier = profile?.kyc_tier || 0;
  if (kycTier < 2) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 mt-10">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">Current Account</h1>
          <p className="text-sm text-muted-foreground">Apply for a premium current account</p>
        </div>
        <div className="bg-card rounded-xl border p-8 text-center shadow-sm font-sans">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold font-poppins mb-2">Feature Locked</h2>
          <p className="text-muted-foreground mb-6">You need to complete KYC Tier 2 (Standard Verification) to apply for a Current Account. Please submit your identity documents to unlock this feature.</p>
          <Button onClick={() => window.location.href = "/dashboard/kyc"}>Upgrade KYC Tier</Button>
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
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <CreditCard className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Current Account Application</h1>
        <p className="text-muted-foreground mt-2">Unlock higher limits and business tools by upgrading your account.</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-center gap-4 text-sm font-medium">
        <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 ${step >= 1 ? "border-primary bg-primary/10" : "border-muted"}`}>1</div>
          Personal
        </div>
        <div className="w-12 h-px bg-border" />
        <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 ${step >= 2 ? "border-primary bg-primary/10" : "border-muted"}`}>2</div>
          Employment
        </div>
        <div className="w-12 h-px bg-border" />
        <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 ${step >= 3 ? "border-primary bg-primary/10" : "border-muted"}`}>3</div>
          Documents
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6 md:p-10 shadow-sm">
        {step === 1 && (
          <FadeIn className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Personal Information</h2>
            <div className="space-y-4">
              <div>
                <Label>Full Legal Name</Label>
                <Input name="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="John Doe" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email Address</Label>
                  <Input name="email" value={formData.email} onChange={handleInputChange} type="email" required />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 234 567 8900" required />
                </div>
              </div>
            </div>
            <Button onClick={() => formData.full_name && formData.phone ? setStep(2) : toast({ title: "Incomplete", description: "Please fill all fields." })} className="w-full">
              Continue to Employment <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </FadeIn>
        )}

        {step === 2 && (
          <FadeIn className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Employment Details</h2>
            <div className="space-y-4">
              <div>
                <Label>Occupation</Label>
                <Input name="occupation" value={formData.occupation} onChange={handleInputChange} placeholder="Software Engineer" required />
              </div>
              <div>
                <Label>Employer Name</Label>
                <Input name="employer" value={formData.employer} onChange={handleInputChange} placeholder="Tech Corp Inc." required />
              </div>
              <div>
                <Label>Business Name (Optional - For Business Accounts)</Label>
                <Input name="business_name" value={formData.business_name} onChange={handleInputChange} placeholder="Doe Solutions LLC" />
              </div>
              <div>
                <Label>Monthly Income Range</Label>
                <select name="income_range" value={formData.income_range} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-primary file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="0-50k">$0 - $50,000</option>
                  <option value="50k-100k">$50,000 - $100,000</option>
                  <option value="100k-250k">$100,000 - $250,000</option>
                  <option value="250k+">$250,000+</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="w-1/3">Back</Button>
              <Button onClick={() => formData.occupation && formData.employer ? setStep(3) : toast({ title: "Incomplete", description: "Please fill required fields." })} className="w-2/3">
                Continue to Documents <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </FadeIn>
        )}

        {step === 3 && (
          <FadeIn className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Required Documents</h2>
            
            <div className="space-y-6">
              <div className="border-2 border-dashed rounded-xl p-6 hover:bg-muted/5 transition-colors">
                <Label className="block mb-2 font-semibold">Valid Identification (Passport, Driver's License)</Label>
                <Input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, "idDoc")} />
                {files.idDoc && <p className="text-xs text-success mt-2 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> {files.idDoc.name} attached</p>}
              </div>

              <div className="border-2 border-dashed rounded-xl p-6 hover:bg-muted/5 transition-colors">
                <Label className="block mb-2 font-semibold">Proof of Address (Utility Bill, Bank Statement)</Label>
                <p className="text-xs text-muted-foreground mb-4">Must be dated within the last 3 months.</p>
                <Input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, "utilityBill")} />
                {files.utilityBill && <p className="text-xs text-success mt-2 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> {files.utilityBill.name} attached</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="w-1/3" disabled={loading}>Back</Button>
              <Button onClick={submitApplication} className="w-2/3 bg-primary" disabled={loading}>
                {loading ? "Submitting securely..." : "Submit Application"}
              </Button>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
