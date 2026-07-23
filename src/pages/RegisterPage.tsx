import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, UserPlus, ArrowRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import defaultLogo from "@/assets/logo.png";
import { sanitizeInput, EnterpriseValidation } from "@/utils/security";

const benefits = [
  "Secure Banking",
  "Easy and Safe Access",
  "Fast Transfers",
  "24/7 Customer Support",
];

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", bvn: "", password: "" });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { visuals, identity } = useBrand();

  const logoUrl = visuals?.primary_logo;
  const siteName = identity?.platform_name || "TrustBank";

  const updateForm = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast({ title: "Terms required", description: "Please agree to the terms and conditions.", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    // Enterprise password validation
    try {
      EnterpriseValidation.password.parse(form.password);
      EnterpriseValidation.email.parse(form.email);
    } catch (err: any) {
      toast({ title: "Validation Error", description: err.errors?.[0]?.message || "Invalid input.", variant: "destructive" });
      setLoading(false);
      return;
    }
    setLoading(true);
    const sanitizedFirst = sanitizeInput(form.firstName);
    const sanitizedLast = sanitizeInput(form.lastName);
    const sanitizedPhone = sanitizeInput(form.phone);
    const sanitizedBvn = sanitizeInput(form.bvn);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          first_name: sanitizedFirst,
          last_name: sanitizedLast,
          phone: sanitizedPhone,
          bvn: sanitizedBvn,
        },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Account Created!", description: "Please check your email to verify your account, then sign in." });
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
            alt="Institutional Banking" 
            className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-primary/20 mix-blend-color" />
        </div>
        <div className="max-w-md relative z-10">
          <img src={logoUrl || defaultLogo} alt={siteName} className="h-20 w-20 mb-6 rounded-2xl bg-white p-2 object-contain" width={80} height={80} />
          <h2 className="text-3xl font-poppins font-bold text-white mb-4">Create an Account</h2>
          <p className="text-white/70 mb-8 font-sans">Sign up to start managing your accounts and access our banking services.</p>
          <div className="space-y-3 font-sans">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-3 text-white/80">
                <CheckCircle2 className="h-5 w-5 text-white/60 shrink-0" />
                <span className="text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <img src={logoUrl || defaultLogo} alt={siteName} className="h-9 w-9 rounded-lg bg-white p-1 object-contain" width={36} height={36} />
            <span className="font-poppins text-xl font-bold text-foreground">{siteName}</span>
          </Link>

          <h1 className="text-2xl font-poppins font-bold text-foreground mb-2">Create Your Account</h1>
          <p className="text-muted-foreground mb-8 font-sans">Enter your details to get started.</p>

          <form onSubmit={handleSubmit} className="space-y-5 font-sans">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">First Name</label>
                <Input placeholder="First name" className="h-14 bg-muted/30 border-border focus:bg-background transition-colors text-base" value={form.firstName} onChange={(e) => updateForm("firstName", e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Last Name</label>
                <Input placeholder="Last name" className="h-14 bg-muted/30 border-border focus:bg-background transition-colors text-base" value={form.lastName} onChange={(e) => updateForm("lastName", e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Email Address</label>
              <Input type="email" placeholder="name@company.com" className="h-14 bg-muted/30 border-border focus:bg-background transition-colors text-base" value={form.email} onChange={(e) => updateForm("email", e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Phone Number</label>
              <Input type="tel" placeholder="+1 800 000 0000" className="h-14 bg-muted/30 border-border focus:bg-background transition-colors text-base" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">SSN / Tax ID</label>
              <Input placeholder="Social Security Number" className="h-14 bg-muted/30 border-border focus:bg-background transition-colors text-base" value={form.bvn} onChange={(e) => updateForm("bvn", e.target.value.replace(/\D/g, ""))} maxLength={9} required />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Password</label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="Create a password (min. 6 chars)" className="h-14 bg-muted/30 border-border focus:bg-background transition-colors text-base pr-12" value={form.password} onChange={(e) => updateForm("password", e.target.value)} required />
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer mt-2">
                <input type="checkbox" className="rounded mt-1 border-input h-4 w-4" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span className="leading-relaxed">I agree to the <Link to="/terms" className="text-primary font-semibold hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-primary font-semibold hover:underline">Privacy Policy</Link></span>
              </label>
            </div>
            <Button type="submit" className="w-full h-14 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all mt-4" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Originate Account <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
