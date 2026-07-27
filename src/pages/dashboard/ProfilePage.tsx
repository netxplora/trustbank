import { useState, useEffect, useRef } from "react";
import { User, Camera, Save, Upload, X, Loader2, ShieldCheck, Mail, MapPin, Briefcase, Settings, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/public/Motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { sanitizeInput, EnterpriseValidation } from "@/utils/security";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { toast } = useToast();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    dateOfBirth: "", gender: "", nationality: "",
    mailingAddress: "", city: "", stateProvince: "", postalCode: "", country: "",
    occupation: "", employerName: "", annualIncomeRange: "", sourceOfFunds: "", taxId: "",
    govIdType: "", govIdNumber: "",
    preferredLanguage: "en", preferredCurrency: "USD"
  });

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        dateOfBirth: profile.date_of_birth || "",
        gender: profile.gender || "",
        nationality: profile.nationality || "",
        mailingAddress: profile.mailing_address || profile.address || "",
        city: profile.city || "",
        stateProvince: profile.state_province || "",
        postalCode: profile.postal_code || "",
        country: profile.country || "",
        occupation: profile.occupation || "",
        employerName: profile.employer_name || "",
        annualIncomeRange: profile.annual_income_range || "",
        sourceOfFunds: profile.source_of_funds || "",
        taxId: profile.tax_id || "",
        govIdType: profile.gov_id_type || "",
        govIdNumber: profile.gov_id_number || "",
        preferredLanguage: profile.preferred_language || "en",
        preferredCurrency: profile.preferred_currency || "USD",
      });
    }
  }, [profile]);

  const uploadAvatar = async (file: Blob, extension: string) => {
    if (!user) return;
    setIsUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await (supabase as any).from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
      if (updateError) throw updateError;
      
      await refreshProfile();
      toast({ title: "Success", description: "Profile picture updated successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Strict MIME validation for avatar uploads
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Only JPG, PNG, WEBP, or GIF images are allowed.", variant: "destructive" });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File Too Large", description: "Avatar images must be under 2MB.", variant: "destructive" });
        return;
      }
      const ext = file.name.split('.').pop() || 'jpg';
      uploadAvatar(file, ext);
    }
  };

  const startWebcam = async () => {
    setShowWebcam(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      toast({ title: "Camera Error", description: "Could not access camera. Please allow permissions.", variant: "destructive" });
      setShowWebcam(false);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowWebcam(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            stopWebcam();
            uploadAvatar(blob, 'jpg');
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  

  
  const isFieldLocked = (fieldValue: any) => Boolean(fieldValue && String(fieldValue).trim() !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const updates: any = {};
      if (!isFieldLocked(profile?.first_name)) updates.first_name = form.firstName;
      if (!isFieldLocked(profile?.last_name)) updates.last_name = form.lastName;
      if (!isFieldLocked(profile?.date_of_birth)) updates.date_of_birth = form.dateOfBirth;
      if (!isFieldLocked(profile?.gender)) updates.gender = form.gender;
      if (!isFieldLocked(profile?.nationality)) updates.nationality = form.nationality;
      if (!isFieldLocked(profile?.phone)) updates.phone = form.phone;
      if (!isFieldLocked(profile?.mailing_address) && !isFieldLocked(profile?.address)) updates.mailing_address = form.mailingAddress;
      if (!isFieldLocked(profile?.city)) updates.city = form.city;
      if (!isFieldLocked(profile?.state_province)) updates.state_province = form.stateProvince;
      if (!isFieldLocked(profile?.postal_code)) updates.postal_code = form.postalCode;
      if (!isFieldLocked(profile?.country)) updates.country = form.country;
      if (!isFieldLocked(profile?.occupation)) updates.occupation = form.occupation;
      if (!isFieldLocked(profile?.employer_name)) updates.employer_name = form.employerName;
      if (!isFieldLocked(profile?.annual_income_range)) updates.annual_income_range = form.annualIncomeRange;
      if (!isFieldLocked(profile?.source_of_funds)) updates.source_of_funds = form.sourceOfFunds;
      if (!isFieldLocked(profile?.gov_id_type)) updates.gov_id_type = form.govIdType;
      if (!isFieldLocked(profile?.gov_id_number)) updates.gov_id_number = form.govIdNumber;
      if (!isFieldLocked(profile?.preferred_language)) updates.preferred_language = form.preferredLanguage;
      if (!isFieldLocked(profile?.preferred_currency)) updates.preferred_currency = form.preferredCurrency;

      if (Object.keys(updates).length > 0) {
        const { error } = await (supabase as any).from("profiles").update(updates).eq("user_id", user.id);
        if (error) throw error;
      }
      
      toast({ title: "Profile Updated", description: "Your information has been saved successfully." });
      refreshProfile();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    
    if (newPassword !== confirmPassword) { toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" }); return; }
    
    try {
      EnterpriseValidation.password.parse(newPassword);
    } catch (err: any) {
      toast({ title: "Weak Password", description: err.errors[0].message, variant: "destructive" }); 
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    
    if (user) {
      await (supabase as any).from("notifications").insert({
        user_id: user.id, title: "Password Changed", message: "Your account password was updated successfully.", type: "security"
      });
    }

    toast({ title: "Password Updated!" });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <StaggerContainer className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <StaggerItem>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground mb-0.5 font-poppins">Customer Identity & Profile</h1>
          <p className="text-xs text-muted-foreground">Manage your personal information, banking preferences, and security settings</p>
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="bg-card rounded-xl border border-border/60 p-3.5 sm:p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm">
          <div className="relative group shrink-0">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background shadow-sm overflow-hidden relative">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-9 w-9 text-primary" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="secondary" className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow-sm bg-background border hover:bg-muted" disabled={isUploading} title="Update Profile Picture">
                  <Camera className="h-3.5 w-3.5 text-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs font-sans">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="text-xs"><Upload className="h-3.5 w-3.5 mr-1.5" /> Upload from gallery</DropdownMenuItem>
                <DropdownMenuItem onClick={startWebcam} className="text-xs"><Camera className="h-3.5 w-3.5 mr-1.5" /> Camera</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h2 className="text-base sm:text-lg font-bold text-foreground font-poppins">{profile?.display_name || "Valued Customer"}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mt-1 text-xs">
              <span className="flex items-center text-muted-foreground"><Mail className="w-3.5 h-3.5 mr-1"/> {profile?.email}</span>
              <span className="flex items-center text-muted-foreground"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-primary"/> KYC Tier {profile?.kyc_tier || 0}</span>
              <span className="flex items-center bg-primary/10 text-primary px-2 py-0.5 rounded-md font-semibold text-[10px]">
                A/C: {profile?.account_number || "—"}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 flex items-center gap-1.5"
              onClick={async () => { await signOut(); navigate("/login"); }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </StaggerItem>

      {/* Webcam Modal */}
      {showWebcam && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <FadeIn className="bg-card border rounded-xl shadow-xl overflow-hidden max-w-md w-full font-sans">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-xs text-foreground">Take a Selfie</h3>
              <Button size="icon" variant="ghost" onClick={stopWebcam} className="h-7 w-7 rounded-full"><X className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="p-3 bg-muted/20 relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black mirror-horizontal" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="p-3 border-t flex justify-center bg-card">
              <Button onClick={capturePhoto} className="w-full sm:w-auto rounded-lg h-8 px-6 text-xs shadow-sm">
                <Camera className="h-3.5 w-3.5 mr-1.5" /> Capture & Save
              </Button>
            </div>
          </FadeIn>
        </div>
      )}

      <StaggerItem>
        <div>
          
          
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto mb-4 p-1 bg-muted/40 rounded-lg text-xs">
              <TabsTrigger value="personal" className="py-1.5 text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"><User className="w-3.5 h-3.5 mr-1.5"/> Personal</TabsTrigger>
              <TabsTrigger value="address" className="py-1.5 text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"><MapPin className="w-3.5 h-3.5 mr-1.5"/> Contact & Work</TabsTrigger>
              <TabsTrigger value="preferences" className="py-1.5 text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"><Settings className="w-3.5 h-3.5 mr-1.5"/> Preferences</TabsTrigger>
              <TabsTrigger value="security" className="py-1.5 text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"><Lock className="w-3.5 h-3.5 mr-1.5"/> Security</TabsTrigger>
            </TabsList>
            
            <div className="bg-card rounded-xl border border-border/60 p-3.5 sm:p-4 shadow-sm text-xs">
              <TabsContent value="personal" className="mt-0 space-y-3">
                <h3 className="text-sm font-semibold font-poppins mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">First Name</Label>
                    <Input readOnly={true} className={`h-8 text-xs rounded-lg bg-muted/50 shadow-inner border-border/60 text-muted-foreground focus-visible:ring-0 cursor-not-allowed`} value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Name</Label>
                    <Input readOnly={true} className={`h-8 text-xs rounded-lg bg-muted/50 shadow-inner border-border/60 text-muted-foreground focus-visible:ring-0 cursor-not-allowed`} value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date of Birth</Label>
                    <Input readOnly={isFieldLocked(profile?.date_of_birth)} className={`h-8 text-xs rounded-lg ${isFieldLocked(profile?.date_of_birth) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground focus-visible:ring-0 cursor-not-allowed" : ""}`} value={form.dateOfBirth} onChange={(e) => setForm({...form, dateOfBirth: e.target.value})} type="date" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gender</Label>
                    <select disabled={isFieldLocked(profile?.gender)} className={`flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none ${isFieldLocked(profile?.gender) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground cursor-not-allowed" : "focus:ring-1 focus:ring-primary"}`} value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nationality</Label>
                    <Input readOnly={isFieldLocked(profile?.nationality)} className={`h-8 text-xs rounded-lg ${isFieldLocked(profile?.nationality) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground focus-visible:ring-0 cursor-not-allowed" : ""}`} value={form.nationality} onChange={(e) => setForm({...form, nationality: e.target.value})} placeholder="e.g. American, British, Canadian" />
                  </div>
                </div>

                <div className="pt-3 border-t border-border/40 mt-3">
                  <h3 className="text-sm font-semibold font-poppins mb-2 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> Government-Issued Identification (KYC)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Government ID Type</Label>
                      <select disabled={isFieldLocked(profile?.gov_id_type)} className={`flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none ${isFieldLocked(profile?.gov_id_type) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground cursor-not-allowed" : "focus:ring-1 focus:ring-primary"}`} value={form.govIdType} onChange={(e) => setForm({...form, govIdType: e.target.value})}>
                        <option value="">Select ID Type...</option>
                        <option value="Passport">Passport</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="Tax ID / SSN">Tax ID / SSN</option>
                        <option value="Other Government ID">Other Government ID</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Government ID Number</Label>
                      <Input readOnly={isFieldLocked(profile?.gov_id_number)} className={`h-8 text-xs rounded-lg ${isFieldLocked(profile?.gov_id_number) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground focus-visible:ring-0 cursor-not-allowed" : ""}`} value={form.govIdNumber} onChange={(e) => setForm({...form, govIdNumber: e.target.value})} placeholder="e.g. A12345678 or License No." />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="address" className="mt-0 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold font-poppins mb-3">Contact & Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                      <Input readOnly disabled className="h-8 text-xs rounded-lg bg-muted/50 shadow-inner border-border/60 text-muted-foreground cursor-not-allowed" value={form.email} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                      <Input readOnly={isFieldLocked(profile?.phone)} className={`h-8 text-xs rounded-lg ${isFieldLocked(profile?.phone) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground focus-visible:ring-0 cursor-not-allowed" : ""}`} value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mailing Address</Label>
                      <Input readOnly={isFieldLocked(profile?.mailing_address || profile?.address)} className={`h-8 text-xs rounded-lg ${isFieldLocked(profile?.mailing_address || profile?.address) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground focus-visible:ring-0 cursor-not-allowed" : ""}`} value={form.mailingAddress} onChange={(e) => setForm({...form, mailingAddress: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">City</Label>
                      <Input readOnly={isFieldLocked(profile?.city)} className={`h-8 text-xs rounded-lg ${isFieldLocked(profile?.city) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground focus-visible:ring-0 cursor-not-allowed" : ""}`} value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">State / Province</Label>
                      <Input readOnly={isFieldLocked(profile?.state_province)} className={`h-8 text-xs rounded-lg ${isFieldLocked(profile?.state_province) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground focus-visible:ring-0 cursor-not-allowed" : ""}`} value={form.stateProvince} onChange={(e) => setForm({...form, stateProvince: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Postal / ZIP Code</Label>
                      <Input readOnly={isFieldLocked(profile?.postal_code)} className={`h-8 text-xs rounded-lg ${isFieldLocked(profile?.postal_code) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground focus-visible:ring-0 cursor-not-allowed" : ""}`} value={form.postalCode} onChange={(e) => setForm({...form, postalCode: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Country</Label>
                      <Input readOnly={isFieldLocked(profile?.country)} className={`h-8 text-xs rounded-lg ${isFieldLocked(profile?.country) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground focus-visible:ring-0 cursor-not-allowed" : ""}`} value={form.country} onChange={(e) => setForm({...form, country: e.target.value})} />
                    </div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-border/40">
                  <h3 className="text-sm font-semibold font-poppins mb-3"><Briefcase className="inline w-4 h-4 mr-1 -mt-0.5"/> Employment & Income</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Occupation</Label>
                      <Input readOnly={isFieldLocked(profile?.occupation)} className={`h-8 text-xs rounded-lg ${isFieldLocked(profile?.occupation) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground focus-visible:ring-0 cursor-not-allowed" : ""}`} value={form.occupation} onChange={(e) => setForm({...form, occupation: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Employer or Business Name</Label>
                      <Input readOnly={isFieldLocked(profile?.employer_name)} className={`h-8 text-xs rounded-lg ${isFieldLocked(profile?.employer_name) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground focus-visible:ring-0 cursor-not-allowed" : ""}`} value={form.employerName} onChange={(e) => setForm({...form, employerName: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Annual Income Range</Label>
                      <select disabled={isFieldLocked(profile?.annual_income_range)} className={`flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none ${isFieldLocked(profile?.annual_income_range) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground cursor-not-allowed" : "focus:ring-1 focus:ring-primary"}`} value={form.annualIncomeRange} onChange={(e) => setForm({...form, annualIncomeRange: e.target.value})}>
                        <option value="">Select Range</option>
                        <option value="$0 - $50,000">$0 - $50,000</option>
                        <option value="$50,001 - $100,000">$50,001 - $100,000</option>
                        <option value="$100,001 - $250,000">$100,001 - $250,000</option>
                        <option value="$250,001+">$250,001+</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Source of Funds</Label>
                      <select disabled={isFieldLocked(profile?.source_of_funds)} className={`flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none ${isFieldLocked(profile?.source_of_funds) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground cursor-not-allowed" : "focus:ring-1 focus:ring-primary"}`} value={form.sourceOfFunds} onChange={(e) => setForm({...form, sourceOfFunds: e.target.value})}>
                        <option value="">Select Source</option>
                        <option value="Salary">Salary</option>
                        <option value="Business">Business</option>
                        <option value="Investments">Investments</option>
                        <option value="Inheritance">Inheritance</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preferences" className="mt-0 space-y-3">
                <h3 className="text-sm font-semibold font-poppins mb-3">Banking Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preferred Language</Label>
                    <select disabled={isFieldLocked(profile?.preferred_language)} className={`flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none ${isFieldLocked(profile?.preferred_language) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground cursor-not-allowed" : "focus:ring-1 focus:ring-primary"}`} value={form.preferredLanguage} onChange={(e) => setForm({...form, preferredLanguage: e.target.value})}>
                      <option value="en">English (US)</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preferred Currency</Label>
                    <select disabled={isFieldLocked(profile?.preferred_currency)} className={`flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none ${isFieldLocked(profile?.preferred_currency) ? "bg-muted/50 shadow-inner border-border/60 text-muted-foreground cursor-not-allowed" : "focus:ring-1 focus:ring-primary"}`} value={form.preferredCurrency} onChange={(e) => setForm({...form, preferredCurrency: e.target.value})}>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                    </select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="mt-0">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold font-poppins mb-3">Update Password</h3>
                  <div className="max-w-sm">
                    <form onSubmit={handlePasswordChange} className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">New Password</Label>
                        <Input type="password" name="newPassword" className="h-8 text-xs rounded-lg" required />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Confirm New Password</Label>
                        <Input type="password" name="confirmPassword" className="h-8 text-xs rounded-lg" required />
                      </div>
                      <Button type="submit" variant="secondary" size="sm" className="w-full text-xs font-bold h-8 rounded-lg">Change Password</Button>
                    </form>
                  </div>
                </div>
              </TabsContent>

              </div>
          </Tabs>
            
            <div className="flex justify-end mt-6">
                <Button type="submit" disabled={loading} className="h-9 px-6 text-xs font-bold rounded-xl shadow-sm">
                  {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Save Changes
                </Button>
              </div>
            </form>
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
};

export default ProfilePage;

