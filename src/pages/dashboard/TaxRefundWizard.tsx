import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { submitTaxRefundApplication } from "@/services/taxRefundService";
import { SlideUp } from "@/components/public/Motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Upload, FileText, CheckCircle2, ShieldCheck, ArrowLeft, Loader2, Landmark } from "lucide-react";

const STEPS = [
  { id: 1, title: "Tax Refund Info" },
  { id: 2, title: "Documents" },
  { id: 3, title: "Declarations" },
  { id: 4, title: "Review & Submit" }
];

const FILING_STATUSES = [
  "Single",
  "Married Filing Jointly",
  "Married Filing Separately",
  "Head of Household",
  "Qualifying Surviving Spouse",
];

export default function TaxRefundWizard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Form State — only the fields the user needs to fill in
  const [formData, setFormData] = useState({
    tax_year: new Date().getFullYear().toString(),
    filing_status: "Single",
    ssn_tin: "",
    refund_method: "",
    additional_comments: "",
  });

  // Confirmations
  const [confirmations, setConfirmations] = useState({
    accurate: false,
    noGuarantee: false,
    terms: false,
  });

  // Documents
  const [documents, setDocuments] = useState<{ name: string; url: string; uploaded_at: string }[]>([]);

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      if (user?.id) {
        const { data: userAccounts } = await supabase
          .from('accounts')
          .select('account_type, account_number')
          .eq('user_id', user.id);
        
        if (userAccounts) {
          setAccounts(userAccounts);
          // Default refund method to savings if available
          const hasSavings = userAccounts.some(a => a.account_type === 'savings');
          if (hasSavings && !formData.refund_method) {
            setFormData(prev => ({ ...prev, refund_method: "Deposit to Savings Account" }));
          }
        }
      }
    };
    fetchAccounts();
  }, [user?.id]);

  // Load draft from local storage
  useEffect(() => {
    const savedDraft = localStorage.getItem("tax_refund_draft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.formData) setFormData(prev => ({ ...prev, ...parsed.formData }));
        if (parsed.documents) setDocuments(parsed.documents);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const draft = { formData, documents };
    localStorage.setItem("tax_refund_draft", JSON.stringify(draft));
  }, [formData, documents]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/tax_${Date.now()}_${docType}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('documents').getPublicUrl(fileName);
      
      setDocuments(prev => [...prev, {
        name: `${docType}: ${file.name}`,
        url: data.publicUrl,
        uploaded_at: new Date().toISOString()
      }]);
      
      toast({ title: "Document uploaded successfully" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.tax_year || !formData.filing_status || !formData.ssn_tin || !formData.refund_method) {
        toast({ title: "Missing Information", description: "Please select Tax Year, Filing Status, enter SSN/TIN, and select Refund Method.", variant: "destructive" });
        return false;
      }
    }
    if (step === 2) {
      const hasTaxReturn = documents.some(d => d.name.startsWith("Tax Return"));
      if (!hasTaxReturn) {
        toast({ title: "Missing Documents", description: "Please upload your Tax Return or Tax Filing Document.", variant: "destructive" });
        return false;
      }
    }
    if (step === 3) {
      if (!confirmations.accurate || !confirmations.noGuarantee || !confirmations.terms) {
        toast({ title: "Declarations Required", description: "Please accept all declarations to proceed.", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    if (!user) return;

    setIsSubmitting(true);
    try {
      const success = await submitTaxRefundApplication({
        user_id: user.id,
        tax_year: parseInt(formData.tax_year, 10),
        filing_status: formData.filing_status,
        ssn_tin: formData.ssn_tin,
        refund_method: formData.refund_method,
        estimated_refund_amount: 0,
        documents: documents,
        user_notes: formData.additional_comments || undefined,
        status: "submitted",
      });

      if (success) {
        localStorage.removeItem("tax_refund_draft");
        toast({ title: "Application Submitted", description: "Your tax refund application has been successfully submitted." });
        navigate("/dashboard/tax-refund");
      } else {
        throw new Error("Failed to submit application");
      }
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message || "An error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const savingsAcc = accounts.find(a => a.account_type === 'savings')?.account_number || "N/A";
  const currentAcc = accounts.find(a => a.account_type === 'current')?.account_number;
  const hasCurrentAccount = !!currentAcc;

  // Build refund method options dynamically
  const refundMethodOptions = [
    { value: "Deposit to Savings Account", label: `Deposit to Savings Account (${savingsAcc})` },
  ];
  if (hasCurrentAccount) {
    refundMethodOptions.push({
      value: "Deposit to Current Account",
      label: `Deposit to Current Account (${currentAcc})`,
    });
  }

  const selectStyle = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/dashboard/tax-refund")} className="p-2 bg-background border border-border rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Tax Refund Application</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Complete the steps below to apply for a tax refund.</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 mb-6">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out" 
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          {STEPS.map((step) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                currentStep >= step.id ? "bg-primary text-primary-foreground shadow-md" : "bg-card border-2 border-muted text-muted-foreground"
              }`}>
                {currentStep > step.id ? <CheckCircle2 className="h-5 w-5" /> : step.id}
              </div>
              <span className={`text-[10px] sm:text-xs font-semibold hidden sm:block ${currentStep >= step.id ? "text-primary" : "text-muted-foreground"}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Step 1: Tax Refund Information */}
        {currentStep === 1 && (
          <SlideUp>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-primary" />
                  Tax Refund Information
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Provide the basic details for your tax refund application.</p>
              </div>

              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label>Tax Year <span className="text-destructive">*</span></Label>
                    <select name="tax_year" value={formData.tax_year} onChange={handleInputChange} className={selectStyle}>
                      {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Filing Status <span className="text-destructive">*</span></Label>
                    <select name="filing_status" value={formData.filing_status} onChange={handleInputChange} className={selectStyle}>
                      {FILING_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>SSN / TIN (Social Security / Tax Identification Number) <span className="text-destructive">*</span></Label>
                  <Input 
                    type="text" 
                    name="ssn_tin" 
                    value={formData.ssn_tin} 
                    onChange={handleInputChange} 
                    placeholder="e.g. XXX-XX-XXXX or Tax ID" 
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">Used for official verification with tax authorities.</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Refund Method <span className="text-destructive">*</span></Label>
                  <select name="refund_method" value={formData.refund_method} onChange={handleInputChange} className={selectStyle}>
                    <option value="">Select refund method...</option>
                    {refundMethodOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">Your refund will be deposited into this account once approved.</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Additional Comments <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                  <Textarea 
                    name="additional_comments" 
                    value={formData.additional_comments} 
                    onChange={handleInputChange} 
                    placeholder="Any additional information you'd like to share..." 
                    className="min-h-[100px] resize-y" 
                    maxLength={1000} 
                  />
                  <p className="text-xs text-muted-foreground text-right">{formData.additional_comments.length} / 1000 characters</p>
                </div>
              </div>
            </div>
          </SlideUp>
        )}

        {/* Step 2: Supporting Documents */}
        {currentStep === 2 && (
          <SlideUp>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Supporting Documents
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Upload the required documentation for your tax refund.</p>
              </div>

              <div className="space-y-6 pt-4">
                
                {/* Upload Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="relative border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer group">
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'Tax Return')} disabled={isUploading} accept=".pdf,.jpg,.jpeg,.png" />
                    <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
                    <p className="text-sm font-semibold">Tax Return / Filing *</p>
                    <p className="text-xs text-muted-foreground mt-1">Required document</p>
                  </div>
                  <div className="relative border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer group">
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'Supporting Doc')} disabled={isUploading} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                    <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
                    <p className="text-sm font-semibold">Supporting Documents</p>
                    <p className="text-xs text-muted-foreground mt-1">Optional</p>
                  </div>
                  <div className="relative border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer group">
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'IRS Notice')} disabled={isUploading} accept=".pdf,.jpg,.jpeg,.png" />
                    <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
                    <p className="text-sm font-semibold">IRS Notice / Correspondence</p>
                    <p className="text-xs text-muted-foreground mt-1">If applicable</p>
                  </div>
                </div>

                {isUploading && (
                  <div className="flex items-center justify-center py-4 text-sm text-muted-foreground gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Uploading document...
                  </div>
                )}

                {/* Uploaded Files List */}
                {documents.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-bold text-foreground">Uploaded Documents ({documents.length})</h3>
                    {documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="h-8 w-8 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">Uploaded {new Date(doc.uploaded_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeDocument(idx)} className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0">
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SlideUp>
        )}

        {/* Step 3: Declarations */}
        {currentStep === 3 && (
          <SlideUp>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Declarations</h2>
                <p className="text-sm text-muted-foreground mt-1">Please confirm the following to proceed.</p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-start space-x-3 p-4 border border-border rounded-lg bg-card hover:border-primary/50 transition-colors">
                  <Checkbox 
                    id="accurate" 
                    checked={confirmations.accurate} 
                    onCheckedChange={(checked) => setConfirmations(prev => ({ ...prev, accurate: checked as boolean }))} 
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="accurate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      I confirm that the information provided is accurate.
                    </label>
                    <p className="text-xs text-muted-foreground">Any false claims may lead to rejection and potential account restrictions.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border border-border rounded-lg bg-card hover:border-primary/50 transition-colors">
                  <Checkbox 
                    id="noGuarantee" 
                    checked={confirmations.noGuarantee} 
                    onCheckedChange={(checked) => setConfirmations(prev => ({ ...prev, noGuarantee: checked as boolean }))} 
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="noGuarantee" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      I understand that my application will be reviewed before any decision is made.
                    </label>
                    <p className="text-xs text-muted-foreground">All claims are subject to review by our tax administration team.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border border-border rounded-lg bg-card hover:border-primary/50 transition-colors">
                  <Checkbox 
                    id="terms" 
                    checked={confirmations.terms} 
                    onCheckedChange={(checked) => setConfirmations(prev => ({ ...prev, terms: checked as boolean }))} 
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      I agree to the program's terms and conditions.
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </SlideUp>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <SlideUp>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Review & Submit</h2>
                <p className="text-sm text-muted-foreground mt-1">Review your application details before submitting.</p>
              </div>

              <div className="space-y-6 pt-4">

                {/* Profile Summary */}
                <div className="bg-muted/30 rounded-xl p-5 border border-border space-y-4">
                  <div className="pb-2 border-b border-border">
                    <h3 className="font-bold text-foreground">Applicant Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name</p>
                      <p className="font-semibold text-foreground text-sm">{profile?.first_name} {profile?.last_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email</p>
                      <p className="font-semibold text-foreground text-sm">{profile?.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer ID</p>
                      <p className="font-poppins font-semibold text-foreground text-sm">{profile?.account_number || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">KYC Status</p>
                      <p className="font-semibold text-foreground text-sm">{profile?.kyc_status?.toUpperCase() || "UNVERIFIED"}</p>
                    </div>
                  </div>
                </div>
                
                {/* Tax Refund Details */}
                <div className="bg-muted/30 rounded-xl p-5 border border-border space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <h3 className="font-bold text-foreground">Tax Refund Details</h3>
                    <Button variant="link" size="sm" onClick={() => setCurrentStep(1)} className="h-auto p-0">Edit</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tax Year</p>
                      <p className="font-semibold text-foreground text-sm">{formData.tax_year}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Filing Status</p>
                      <p className="font-semibold text-foreground text-sm">{formData.filing_status}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SSN / TIN</p>
                      <p className="font-semibold text-foreground text-sm">{formData.ssn_tin}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Refund Method</p>
                      <p className="font-semibold text-foreground text-sm">{formData.refund_method}</p>
                    </div>
                    {formData.additional_comments && (
                      <div className="space-y-1 col-span-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Additional Comments</p>
                        <p className="text-foreground text-sm">{formData.additional_comments}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Uploaded Documents */}
                <div className="bg-muted/30 rounded-xl p-5 border border-border space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <h3 className="font-bold text-foreground">Uploaded Documents</h3>
                    <Button variant="link" size="sm" onClick={() => setCurrentStep(2)} className="h-auto p-0">Edit</Button>
                  </div>
                  <div className="space-y-2">
                    {documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{doc.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Declaration Summary */}
                <div className="bg-muted/30 rounded-xl p-5 border border-border space-y-3">
                  <div className="pb-2 border-b border-border">
                    <h3 className="font-bold text-foreground">Declarations</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-foreground">All declarations accepted</span>
                  </div>
                </div>

              </div>
            </div>
          </SlideUp>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className="w-28 border-border"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          
          {currentStep < STEPS.length ? (
            <Button
              onClick={nextStep}
              className="w-28 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-36 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Submit</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
