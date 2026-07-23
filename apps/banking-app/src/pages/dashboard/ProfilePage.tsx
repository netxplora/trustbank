import { useState, useEffect, useRef } from "react";
import { User, Camera, Save, Upload, X, Loader2, ShieldCheck, Mail, MapPin, Briefcase, Settings, Lock } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { Label } from "@trustbank/shared-ui/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@trustbank/shared-ui/components/ui/tabs";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn } from "@trustbank/shared-ui/components/Motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@trustbank/shared-ui/components/ui/dropdown-menu";
import { sanitizeInput, EnterpriseValidation } from "@trustbank/shared-utils/utils/security";
import { z } from "zod";

const ProfilePage = () => {
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
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
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Sanitize and Validate inputs
    const sanitizedFirstName = sanitizeInput(form.firstName);
    const sanitizedLastName = sanitizeInput(form.lastName);
    const sanitizedPhone = sanitizeInput(form.phone);
    
    try {
      if (sanitizedPhone) EnterpriseValidation.phone.parse(sanitizedPhone);
      // Basic string validation to prevent massive inputs
      if (sanitizedFirstName.length > 100 || sanitizedLastName.length > 100) throw new Error("Name is too long.");
    } catch (err: any) {
      toast({ title: "Validation Error", description: err.errors ? err.errors[0].message : err.message, variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      first_name: sanitizedFirstName,
      last_name: sanitizedLastName,
      display_name: `${sanitizedFirstName} ${sanitizedLastName}`.trim(),
      phone: sanitizedPhone,
      date_of_birth: form.dateOfBirth,
      gender: form.gender,
      nationality: form.nationality,
      mailing_address: form.mailingAddress,
      city: form.city,
      state_province: form.stateProvince,
      postal_code: form.postalCode,
      country: form.country,
      occupation: form.occupation,
      employer_name: form.employerName,
      annual_income_range: form.annualIncomeRange,
      source_of_funds: form.sourceOfFunds,
      tax_id: form.taxId,
      preferred_language: form.preferredLanguage,
      preferred_currency: form.preferredCurrency,
    }).eq("user_id", user.id);
    
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    
    await supabase.from("notifications").insert({
      user_id: user.id, title: "Profile Updated", message: "Your comprehensive profile information was updated successfully.", type: "system"
    });

    await refreshProfile();
    toast({ title: "Profile Updated!", description: "Your comprehensive profile has been saved successfully." });
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
      await supabase.from("notifications").insert({
        user_id: user.id, title: "Password Changed", message: "Your account password was updated successfully.", type: "security"
      });
    }

    toast({ title: "Password Updated!" });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <StaggerContainer className="space-y-6 max-w-5xl mx-auto font-sans">
      <StaggerItem>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1 font-poppins">Customer Identity & Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your comprehensive personal information, banking preferences, and security settings</p>
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="bg-card rounded-xl border p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <div className="relative group shrink-0">
            <div className="h-28 w-28 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-md overflow-hidden relative">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-primary" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="secondary" className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full shadow-md bg-background border hover:bg-muted" disabled={isUploading} title="Update Profile Picture">
                  <Camera className="h-4 w-4 text-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-2" /> Upload from gallery</DropdownMenuItem>
                <DropdownMenuItem onClick={startWebcam}><Camera className="h-4 w-4 mr-2" /> Camera</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-bold text-foreground font-poppins">{profile?.display_name || "Valued Customer"}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
              <span className="flex items-center text-sm text-muted-foreground"><Mail className="w-4 h-4 mr-1"/> {profile?.email}</span>
              <span className="flex items-center text-sm text-muted-foreground"><ShieldCheck className="w-4 h-4 mr-1 text-primary"/> KYC Tier {profile?.kyc_tier || 0}</span>
              <span className="flex items-center text-sm text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold text-xs">
                A/C: {profile?.account_number || "—"}
              </span>
            </div>
          </div>
        </div>
      </StaggerItem>

      {/* Webcam Modal */}
      {showWebcam && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <FadeIn className="bg-card border rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Take a Selfie</h3>
              <Button size="icon" variant="ghost" onClick={stopWebcam} className="h-8 w-8 rounded-full"><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-4 bg-muted/20 relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl bg-black mirror-horizontal" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="p-4 border-t flex justify-center bg-card">
              <Button onClick={capturePhoto} className="w-full sm:w-auto rounded-full h-12 px-8 shadow-md">
                <Camera className="h-5 w-5 mr-2" /> Capture & Save
              </Button>
            </div>
          </FadeIn>
        </div>
      )}

      <StaggerItem>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto mb-6 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="personal" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><User className="w-4 h-4 mr-2"/> Personal</TabsTrigger>
              <TabsTrigger value="address" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><MapPin className="w-4 h-4 mr-2"/> Contact & Work</TabsTrigger>
              <TabsTrigger value="preferences" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Settings className="w-4 h-4 mr-2"/> Preferences</TabsTrigger>
              <TabsTrigger value="security" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Lock className="w-4 h-4 mr-2"/> Security</TabsTrigger>
            </TabsList>
            
            <div className="bg-card rounded-xl border p-6 shadow-sm">
              <TabsContent value="personal" className="mt-0 space-y-4">
                <h3 className="text-lg font-semibold font-poppins mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label>First Name</Label>
                    <Input value={form.firstName} onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last Name</Label>
                    <Input value={form.lastName} onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date of Birth</Label>
                    <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Gender</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                      value={form.gender} onChange={(e) => setForm(p => ({ ...p, gender: e.target.value }))}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Nationality</Label>
                    <Input value={form.nationality} onChange={(e) => setForm(p => ({ ...p, nationality: e.target.value }))} placeholder="e.g. American, British, Nigerian" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="address" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold font-poppins mb-4">Contact & Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label>Email Address</Label>
                      <Input type="email" value={form.email} disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone Number</Label>
                      <Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Residential / Mailing Address</Label>
                      <Input value={form.mailingAddress} onChange={(e) => setForm(p => ({ ...p, mailingAddress: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>City</Label>
                      <Input value={form.city} onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>State / Province</Label>
                      <Input value={form.stateProvince} onChange={(e) => setForm(p => ({ ...p, stateProvince: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Postal / ZIP Code</Label>
                      <Input value={form.postalCode} onChange={(e) => setForm(p => ({ ...p, postalCode: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Country</Label>
                      <Input value={form.country} onChange={(e) => setForm(p => ({ ...p, country: e.target.value }))} />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold font-poppins mb-4"><Briefcase className="inline w-5 h-5 mr-1 -mt-1"/> Employment & Income</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label>Occupation</Label>
                      <Input value={form.occupation} onChange={(e) => setForm(p => ({ ...p, occupation: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Employer or Business Name</Label>
                      <Input value={form.employerName} onChange={(e) => setForm(p => ({ ...p, employerName: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Annual Income Range</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                        value={form.annualIncomeRange} onChange={(e) => setForm(p => ({ ...p, annualIncomeRange: e.target.value }))}>
                        <option value="">Select Range</option>
                        <option value="$0 - $50,000">$0 - $50,000</option>
                        <option value="$50,001 - $100,000">$50,001 - $100,000</option>
                        <option value="$100,001 - $250,000">$100,001 - $250,000</option>
                        <option value="$250,001+">$250,001+</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Source of Funds</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                        value={form.sourceOfFunds} onChange={(e) => setForm(p => ({ ...p, sourceOfFunds: e.target.value }))}>
                        <option value="">Select Source</option>
                        <option value="Salary">Salary</option>
                        <option value="Business">Business</option>
                        <option value="Investments">Investments</option>
                        <option value="Inheritance">Inheritance</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Tax Identification Number (TIN/SSN)</Label>
                      <Input value={form.taxId} onChange={(e) => setForm(p => ({ ...p, taxId: e.target.value }))} type="password" placeholder="•••-••-••••" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preferences" className="mt-0 space-y-4">
                <h3 className="text-lg font-semibold font-poppins mb-4">Banking Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label>Preferred Language</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                      value={form.preferredLanguage} onChange={(e) => setForm(p => ({ ...p, preferredLanguage: e.target.value }))}>
                      <option value="en">English (US)</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preferred Currency</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                      value={form.preferredCurrency} onChange={(e) => setForm(p => ({ ...p, preferredCurrency: e.target.value }))}>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="NGN">NGN - Nigerian Naira</option>
                    </select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="mt-0">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold font-poppins mb-4">Update Password</h3>
                  <div className="max-w-md">
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>New Password</Label>
                        <Input type="password" name="newPassword" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Confirm New Password</Label>
                        <Input type="password" name="confirmPassword" required />
                      </div>
                      <Button type="submit" variant="secondary" className="w-full">Change Password</Button>
                    </form>
                  </div>
                </div>
              </TabsContent>

              {/* Save Button for Profile Form */}
              <div className="mt-8 pt-6 border-t flex justify-end">
                <Button type="submit" onClick={handleSubmit} disabled={loading} size="lg" className="w-full md:w-auto min-w-[200px] shadow-md hover:shadow-lg font-bold">
                  <Save className="h-5 w-5 mr-2" /> {loading ? "Saving Changes..." : "Save Profile Information"}
                </Button>
              </div>
            </div>
          </Tabs>
        </form>
      </StaggerItem>
    </StaggerContainer>
  );
};

export default ProfilePage;
