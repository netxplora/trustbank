import { useState, useEffect } from "react";
import { ShieldCheck, Upload, FileText, AlertTriangle, CheckCircle, Clock, X, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";
import { sanitizeInput, EnterpriseValidation } from "@/utils/security";

const KYCPage = () => {
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  
  const [kycTier, setKycTier] = useState<number>(0);
  const [kycStatus, setKycStatus] = useState<string>("not_started");
  const [loading, setLoading] = useState(false);
  
  // Tier 1 Form
  const [formT1, setFormT1] = useState({ fullName: "", dob: "", address: "", city: "", zip: "" });
  
  // Tier 2 Form
  const [formT2, setFormT2] = useState({ occupation: "", sourceOfFunds: "" });
  const [docsT2, setDocsT2] = useState([
    { name: "Government-Issued ID", type: "government_id", uploaded: false, file: null as File | null },
    { name: "Proof of Address", type: "proof_of_address", uploaded: false, file: null as File | null },
    { name: "Selfie Verification", type: "selfie", uploaded: false, file: null as File | null },
  ]);

  // Tier 3 Form
  const [formT3, setFormT3] = useState({ annualIncome: "" });
  const [docsT3, setDocsT3] = useState([
    { name: "Income Verification Document", type: "income_verification", uploaded: false, file: null as File | null },
  ]);

  useEffect(() => {
    if (profile) {
      setKycTier(profile.kyc_tier || 0);
      setKycStatus(profile.kyc_status || "not_started");
      setFormT1({
        fullName: profile.display_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
        dob: profile.date_of_birth || "",
        address: profile.mailing_address || profile.address || "",
        city: profile.city || "",
        zip: profile.postal_code || "",
      });
      setFormT2({
        occupation: profile.occupation || "",
        sourceOfFunds: profile.source_of_funds || ""
      });
    }
  }, [profile]);

  const handleFileUpload = (tier: number, index: number, file: File | undefined) => {
    if (!file) return;
    
    // Strict MIME Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid File Type", description: "Only JPG, PNG, WEBP, or PDF allowed.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) { toast({ title: "File too large", description: "Maximum 5MB.", variant: "destructive" }); return; }
    
    if (tier === 2) {
      setDocsT2(prev => prev.map((doc, i) => i === index ? { ...doc, uploaded: true, file } : doc));
      toast({ title: "Document selected", description: `${docsT2[index].name} ready to upload.` });
    } else if (tier === 3) {
      setDocsT3(prev => prev.map((doc, i) => i === index ? { ...doc, uploaded: true, file } : doc));
      toast({ title: "Document selected", description: `${docsT3[index].name} ready to upload.` });
    }
  };

  const uploadDocs = async (docs: any[]) => {
    if (!user) return;
    for (const doc of docs) {
      if (!doc.file) continue;
      const fileExt = doc.file.name.split('.').pop();
      const filePath = `${user.id}/${doc.type}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('kyc_documents').upload(filePath, doc.file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('kyc_documents').getPublicUrl(filePath);
      
      await supabase.from("kyc_documents").insert({
        user_id: user.id, document_type: doc.type, document_number: "Uploaded", file_url: publicUrl, status: "pending"
      });
    }
  };

  const submitTier1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const sanitizedName = sanitizeInput(formT1.fullName);
      const sanitizedAddress = sanitizeInput(formT1.address);
      const sanitizedCity = sanitizeInput(formT1.city);
      const sanitizedZip = sanitizeInput(formT1.zip);

      // Tier 1 auto-approves
      const { error } = await supabase.from("profiles").update({
        display_name: sanitizedName,
        date_of_birth: formT1.dob,
        mailing_address: sanitizedAddress,
        address: sanitizedAddress,
        city: sanitizedCity,
        postal_code: sanitizedZip,
        kyc_tier: 1, // Upgrade to tier 1
        kyc_status: "approved_tier_1"
      }).eq("user_id", user.id);
      
      if (error) throw error;
      
      await supabase.from("notifications").insert({
        user_id: user.id, title: "Tier 1 KYC Approved", message: "You have instantly unlocked Basic banking privileges.", type: "success"
      });

      await refreshProfile();
      toast({ title: "Tier 1 Approved!", description: "You have unlocked Basic Privileges." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitTier2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const allUploaded = docsT2.every(d => d.uploaded);
    if (!allUploaded) { toast({ title: "Missing Documents", description: "Please upload all required Tier 2 documents.", variant: "destructive" }); return; }
    
    setLoading(true);
    try {
      await uploadDocs(docsT2);
      
      const { error } = await supabase.from("profiles").update({
        occupation: formT2.occupation,
        source_of_funds: formT2.sourceOfFunds,
        kyc_status: "pending_tier_2"
      }).eq("user_id", user.id);
      
      if (error) throw error;
      
      await refreshProfile();
      toast({ title: "Tier 2 Submitted", description: "Your documents are under manual review." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitTier3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const allUploaded = docsT3.every(d => d.uploaded);
    if (!allUploaded) { toast({ title: "Missing Documents", description: "Please upload all required Tier 3 documents.", variant: "destructive" }); return; }
    
    setLoading(true);
    try {
      await uploadDocs(docsT3);
      
      const { error } = await supabase.from("profiles").update({
        annual_income_range: formT3.annualIncome,
        kyc_status: "pending_tier_3"
      }).eq("user_id", user.id);
      
      if (error) throw error;
      
      await refreshProfile();
      toast({ title: "Tier 3 Submitted", description: "Your premium application is under review." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isPending = kycStatus.startsWith("pending");

  return (
    <StaggerContainer className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <StaggerItem>
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">KYC Verification</h1>
          <p className="text-xs text-muted-foreground">Complete progressive identity verification to access higher limits and premium banking features.</p>
        </div>
      </StaggerItem>

      {/* Status Hero */}
      <StaggerItem>
        <div className={`p-3.5 sm:p-4 rounded-xl border border-border/60 flex flex-col md:flex-row items-center gap-4 shadow-sm ${
          kycTier === 3 ? "bg-primary/5 border-primary/20" : "bg-card"
        }`}>
          <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 shadow-inner bg-background border border-border/60">
            <ShieldCheck className={`h-6 w-6 ${kycTier >= 1 ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-sm sm:text-base font-bold font-poppins">
              Current Status: {kycTier === 0 ? "Unverified" : `Tier ${kycTier} Verified`}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {kycTier === 0 && "Complete Tier 1 to access basic banking."}
              {kycTier === 1 && "You have Basic privileges. Upgrade to Tier 2 for Standard banking."}
              {kycTier === 2 && "You have Standard privileges. Upgrade to Tier 3 for Premium access."}
              {kycTier === 3 && "You have unlocked the highest level of premium banking privileges."}
            </p>
          </div>
          {isPending && (
            <div className="bg-warning/10 border border-warning/20 px-3 py-1.5 rounded-lg text-center shrink-0 flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              <div className="text-left">
                <p className="text-[10px] font-bold text-warning uppercase">Under Review</p>
                <p className="text-[9px] text-warning/80 font-medium">Please wait for admin approval</p>
              </div>
            </div>
          )}
        </div>
      </StaggerItem>

      {/* Tier 1 Form */}
      {kycTier === 0 && !isPending && (
        <StaggerItem>
          <div className="bg-card border border-border/60 rounded-xl p-3.5 sm:p-4 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4 border-b border-border/60 pb-3">
              <div className="bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs">1</div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold font-poppins">Tier 1: Basic Verification</h2>
                <p className="text-[11px] text-muted-foreground">Unlocks Savings account, internal transfers, and limited withdrawals.</p>
              </div>
            </div>
            
            <form onSubmit={submitTier1} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Full Name</Label><Input required className="h-8 text-xs rounded-lg" value={formT1.fullName} onChange={e => setFormT1(p => ({...p, fullName: e.target.value}))} /></div>
                <div className="space-y-1"><Label className="text-xs">Date of Birth</Label><Input type="date" required className="h-8 text-xs rounded-lg" value={formT1.dob} onChange={e => setFormT1(p => ({...p, dob: e.target.value}))} /></div>
                <div className="space-y-1 md:col-span-2"><Label className="text-xs">Residential Address</Label><Input required className="h-8 text-xs rounded-lg" value={formT1.address} onChange={e => setFormT1(p => ({...p, address: e.target.value}))} /></div>
                <div className="space-y-1"><Label className="text-xs">City</Label><Input required className="h-8 text-xs rounded-lg" value={formT1.city} onChange={e => setFormT1(p => ({...p, city: e.target.value}))} /></div>
                <div className="space-y-1"><Label className="text-xs">Zip / Postal Code</Label><Input required className="h-8 text-xs rounded-lg" value={formT1.zip} onChange={e => setFormT1(p => ({...p, zip: e.target.value}))} /></div>
              </div>
              <Button type="submit" size="sm" disabled={loading} className="w-full md:w-auto mt-3 text-xs h-8 rounded-lg font-bold">
                {loading ? "Verifying..." : "Complete Tier 1 Verification"} <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </form>
          </div>
        </StaggerItem>
      )}

      {/* Tier 2 Form */}
      {kycTier === 1 && !isPending && (
        <StaggerItem>
          <div className="bg-card border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <div className="bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h2 className="text-lg font-bold font-poppins">Tier 2: Standard Verification</h2>
                <p className="text-xs text-muted-foreground">Unlocks Current accounts, physical cards, loans, and domestic transfers.</p>
              </div>
            </div>

            <form onSubmit={submitTier2} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Occupation</Label><Input required value={formT2.occupation} onChange={e => setFormT2(p => ({...p, occupation: e.target.value}))} /></div>
                <div className="space-y-1.5"><Label>Source of Funds</Label><Input required value={formT2.sourceOfFunds} onChange={e => setFormT2(p => ({...p, sourceOfFunds: e.target.value}))} /></div>
              </div>

              <div>
                <Label className="mb-3 block">Required Documents</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {docsT2.map((doc, idx) => (
                    <label key={idx} className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/30 transition-colors ${doc.uploaded ? "border-success bg-success/5" : "border-muted-foreground/30"}`}>
                      {doc.uploaded ? <CheckCircle className="h-6 w-6 text-success mb-2" /> : <Upload className="h-6 w-6 text-muted-foreground mb-2" />}
                      <span className="text-xs font-semibold text-center">{doc.name}</span>
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileUpload(2, idx, e.target.files?.[0])} />
                    </label>
                  ))}
                </div>
              </div>
              
              <Button type="submit" disabled={loading} className="w-full md:w-auto font-bold">
                {loading ? "Uploading..." : "Submit for Tier 2 Review"} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>
        </StaggerItem>
      )}

      {/* Tier 3 Form */}
      {kycTier === 2 && !isPending && (
        <StaggerItem>
          <div className="bg-card border rounded-3xl p-6 shadow-sm border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3 mb-6 border-b border-primary/10 pb-4">
              <div className="bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h2 className="text-lg font-bold font-poppins text-primary">Tier 3: Premium Verification</h2>
                <p className="text-xs text-muted-foreground">Unlocks Wealth Management, Private Banking, and highest limits.</p>
              </div>
            </div>

            <form onSubmit={submitTier3} className="space-y-6">
              <div className="space-y-1.5 max-w-sm">
                <Label>Annual Income Range</Label>
                <select className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                  value={formT3.annualIncome} onChange={(e) => setFormT3(p => ({...p, annualIncome: e.target.value}))} required>
                  <option value="">Select Range</option>
                  <option value="$100,001 - $250,000">$100,001 - $250,000</option>
                  <option value="$250,001 - $1,000,000">$250,001 - $1,000,000</option>
                  <option value="$1,000,000+">$1,000,000+</option>
                </select>
              </div>

              <div>
                <Label className="mb-3 block">Enhanced Income Verification</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 max-w-md gap-4">
                  {docsT3.map((doc, idx) => (
                    <label key={idx} className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/30 transition-colors ${doc.uploaded ? "border-success bg-success/5" : "border-primary/30"}`}>
                      {doc.uploaded ? <CheckCircle className="h-6 w-6 text-success mb-2" /> : <FileText className="h-6 w-6 text-primary mb-2" />}
                      <span className="text-xs font-semibold text-center">{doc.name}</span>
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileUpload(3, idx, e.target.files?.[0])} />
                    </label>
                  ))}
                </div>
              </div>
              
              <Button type="submit" disabled={loading} className="w-full md:w-auto font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
                {loading ? "Submitting..." : "Submit for Premium Review"} <ShieldCheck className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>
        </StaggerItem>
      )}

      {/* Completed State */}
      {kycTier === 3 && (
        <StaggerItem>
          <div className="bg-success/10 border-2 border-success/20 rounded-3xl p-8 shadow-sm text-center">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-poppins text-foreground">Fully Verified</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
              Your account has passed our highest level of compliance checks. You have full access to all Premium banking and wealth management services.
            </p>
          </div>
        </StaggerItem>
      )}

    </StaggerContainer>
  );
};

export default KYCPage;
