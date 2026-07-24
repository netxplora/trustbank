import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getGrantPrograms, submitGrantApplication, GrantProgram } from "@/services/grantsService";
import { SlideUp } from "@/components/public/Motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Upload, FileText, CheckCircle2, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";

const STEPS = [
  { id: 1, title: "Business Information" },
  { id: 2, title: "Grant Request" },
  { id: 3, title: "Supporting Documents" },
  { id: 4, title: "Review & Submit" }
];

export default function GrantApplicationWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [programs, setPrograms] = useState<GrantProgram[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Preselected program from location state if available
  const initialProgramId = location.state?.programId || "";

  // Form State
  const [formData, setFormData] = useState({
    business_name: "",
    business_type: "",
    industry: "",
    year_started: "",
    grant_program_id: initialProgramId,
    requested_amount: "",
    proposal_summary: "",
  });

  // Confirmations
  const [confirmations, setConfirmations] = useState({
    accurate: false,
    eligibility: false,
    terms: false,
  });

  // Documents
  const [documents, setDocuments] = useState<{ name: string; url: string; uploaded_at: string }[]>([]);

  // Load programs and fetch accounts
  useEffect(() => {
    const fetchData = async () => {
      const p = await getGrantPrograms();
      const activePrograms = p.filter(pr => pr.status === 'active');
      setPrograms(activePrograms);

      if (initialProgramId) {
        const selectedProg = activePrograms.find(pr => pr.id === initialProgramId);
        if (selectedProg) {
          setFormData(prev => ({ ...prev, requested_amount: selectedProg.funding_amount.toString() }));
        }
      } else if (!localStorage.getItem("grant_application_draft")) {
        toast({ title: "No Program Selected", description: "Please select a grant program to apply for.", variant: "destructive" });
        navigate("/dashboard/grants");
      }

      if (user?.id) {
        const { data: userAccounts } = await supabase
          .from('accounts')
          .select('account_type, account_number')
          .eq('user_id', user.id);
        
        if (userAccounts) setAccounts(userAccounts);
      }
    };
    fetchData();
  }, [user?.id, initialProgramId]);

  // Load draft from local storage
  useEffect(() => {
    const savedDraft = localStorage.getItem("grant_application_draft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...parsed.formData }));
        if (parsed.documents) setDocuments(parsed.documents);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const draft = { formData, documents };
    localStorage.setItem("grant_application_draft", JSON.stringify(draft));
  }, [formData, documents]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-update requested_amount when program changes
      if (name === "grant_program_id") {
        const selectedProg = programs.find(p => p.id === value);
        if (selectedProg) {
          newData.requested_amount = selectedProg.funding_amount.toString();
        } else {
          newData.requested_amount = "";
        }
      }
      return newData;
    });
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
      const fileName = `${user.id}/${Date.now()}_${docType}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents') // Assuming this bucket exists
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
      if (!formData.business_name || !formData.business_type || !formData.industry || !formData.year_started) {
        toast({ title: "Missing Information", description: "Please fill in all business information fields.", variant: "destructive" });
        return false;
      }
    }
    if (step === 2) {
      if (!formData.grant_program_id || !formData.requested_amount || !formData.proposal_summary) {
        toast({ title: "Missing Information", description: "Please fill in all grant request fields.", variant: "destructive" });
        return false;
      }
    }
    if (step === 4) {
      if (!confirmations.accurate || !confirmations.eligibility || !confirmations.terms) {
        toast({ title: "Confirmations Required", description: "Please check all confirmation boxes to proceed.", variant: "destructive" });
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
    if (!validateStep(4)) return;
    if (!user) return;

    setIsSubmitting(true);
    try {
      const selectedProg = programs.find(p => p.id === formData.grant_program_id);
      const generatedTitle = `${formData.business_name} - ${selectedProg?.title || 'Grant Request'}`;

      const success = await submitGrantApplication({
        grant_program_id: formData.grant_program_id,
        user_id: user.id,
        project_title: generatedTitle,
        requested_amount: parseFloat(formData.requested_amount),
        proposal_summary: formData.proposal_summary,
        business_name: formData.business_name,
        business_type: formData.business_type,
        industry: formData.industry,
        year_started: parseInt(formData.year_started, 10),
        documents: documents,
        status: "submitted"
      });

      if (success) {
        localStorage.removeItem("grant_application_draft");
        toast({ title: "Application Submitted", description: "Your grant application has been successfully submitted for review." });
        navigate("/dashboard/grants");
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
  const currentAcc = accounts.find(a => a.account_type === 'current')?.account_number || "N/A";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/dashboard/grants")} className="p-2 bg-background border border-border rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Grant Application</h1>
          <p className="text-sm text-muted-foreground">Complete the steps below to apply for funding.</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
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

      {/* Forms */}
      <SlideUp key={currentStep}>
        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          
          {/* STEP 1: Business Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold text-foreground">Business Information</h2>
                <p className="text-sm text-muted-foreground">Provide details about the entity requesting the grant.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Business / Organization Name <span className="text-destructive">*</span></Label>
                  <Input name="business_name" value={formData.business_name} onChange={handleInputChange} placeholder="e.g. Acme Innovations LLC" />
                </div>
                <div className="space-y-1.5">
                  <Label>Business Type <span className="text-destructive">*</span></Label>
                  <select name="business_type" value={formData.business_type} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="">Select type...</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="LLC">LLC</option>
                    <option value="Corporation">Corporation</option>
                    <option value="Non-Profit">Non-Profit</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Industry / Sector <span className="text-destructive">*</span></Label>
                  <select name="industry" value={formData.industry} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="">Select industry...</option>
                    <option value="Technology">Technology</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Retail">Retail</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Energy">Energy</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Year Business Started <span className="text-destructive">*</span></Label>
                  <Input type="number" name="year_started" value={formData.year_started} onChange={handleInputChange} placeholder="e.g. 2021" min="1900" max={new Date().getFullYear()} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Grant Request */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold text-foreground">Grant Request Details</h2>
                <p className="text-sm text-muted-foreground">Specify the funding amount and your project plans.</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label>Grant Program <span className="text-destructive">*</span></Label>
                    <Input readOnly value={programs.find(p => p.id === formData.grant_program_id)?.title || "Selected Program"} className="bg-muted/50 cursor-not-allowed text-muted-foreground font-semibold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Amount Requested ($) <span className="text-destructive">*</span></Label>
                    <Input readOnly type="number" name="requested_amount" value={formData.requested_amount} className="bg-muted/50 cursor-not-allowed text-muted-foreground font-bold text-primary" placeholder="0.00" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Purpose & Brief Description of Use of Funds <span className="text-destructive">*</span></Label>
                  <Textarea name="proposal_summary" value={formData.proposal_summary} onChange={handleInputChange} placeholder="Describe exactly how the grant funds will be utilized to achieve your business goals..." className="min-h-[150px] resize-y" maxLength={1500} />
                  <p className="text-xs text-muted-foreground text-right">{formData.proposal_summary.length} / 1500 characters</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Documents */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold text-foreground">Supporting Documents</h2>
                <p className="text-sm text-muted-foreground">Upload the necessary files for evaluation (PDF, JPG, PNG). Max 5MB per file.</p>
              </div>

              <div className="space-y-6">
                
                {/* Upload Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer group">
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'Business Registration')} disabled={isUploading} accept=".pdf,.jpg,.jpeg,.png" />
                    <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
                    <p className="text-sm font-semibold">Business Registration</p>
                    <p className="text-xs text-muted-foreground mt-1">Certificate of incorporation</p>
                  </div>
                  <div className="relative border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer group">
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'Proposal')} disabled={isUploading} accept=".pdf,.doc,.docx" />
                    <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
                    <p className="text-sm font-semibold">Funding Proposal</p>
                    <p className="text-xs text-muted-foreground mt-1">Detailed plan (PDF/DOC)</p>
                  </div>
                </div>

                {isUploading && (
                  <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading document...
                  </div>
                )}

                {/* Uploaded Files List */}
                {documents.length > 0 && (
                  <div className="bg-muted/30 rounded-xl p-4 border border-border">
                    <h3 className="text-sm font-bold mb-3">Uploaded Documents</h3>
                    <ul className="space-y-2">
                      {documents.map((doc, i) => (
                        <li key={i} className="flex justify-between items-center p-3 bg-background rounded-lg border border-border shadow-sm text-sm">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">{doc.name}</span>
                          </div>
                          <button onClick={() => removeDocument(i)} className="text-destructive hover:underline text-xs font-semibold shrink-0 ml-2">Remove</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-bold text-foreground">Review & Submit</h2>
                <p className="text-sm text-muted-foreground">Please review your application carefully before submitting.</p>
              </div>

              <div className="bg-muted/30 p-5 rounded-xl border border-border space-y-4">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Business Name:</div>
                  <div className="font-semibold">{formData.business_name || "N/A"}</div>
                  <div className="text-muted-foreground">Industry / Year:</div>
                  <div className="font-semibold">{formData.industry || "N/A"} ({formData.year_started || "N/A"})</div>
                  <div className="text-muted-foreground">Program:</div>
                  <div className="font-semibold">{programs.find(p => p.id === formData.grant_program_id)?.title || "N/A"}</div>
                  <div className="text-muted-foreground">Requested Amount:</div>
                  <div className="font-semibold text-primary">${parseFloat(formData.requested_amount || "0").toLocaleString()}</div>
                  <div className="text-muted-foreground">Documents Uploaded:</div>
                  <div className="font-semibold">{documents.length} file(s)</div>
                </div>
              </div>

              <div className="space-y-4 border-t border-border pt-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="accurate" 
                    checked={confirmations.accurate} 
                    onCheckedChange={(c) => setConfirmations(prev => ({ ...prev, accurate: !!c }))}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="accurate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I confirm that the information provided is accurate.
                    </label>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="eligibility" 
                    checked={confirmations.eligibility} 
                    onCheckedChange={(c) => setConfirmations(prev => ({ ...prev, eligibility: !!c }))}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="eligibility" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I understand that approval is subject to eligibility and verification.
                    </label>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="terms" 
                    checked={confirmations.terms} 
                    onCheckedChange={(c) => setConfirmations(prev => ({ ...prev, terms: !!c }))}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I agree to the program's terms and conditions.
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={currentStep === 1 || isSubmitting}
            >
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button onClick={nextStep}>
                Next Step <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !confirmations.accurate || !confirmations.eligibility || !confirmations.terms}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
                ) : (
                  <>Submit Application <CheckCircle2 className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            )}
          </div>

        </div>
      </SlideUp>
    </div>
  );
}
