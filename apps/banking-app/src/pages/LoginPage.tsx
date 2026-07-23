import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { Eye, EyeOff, Lock, ArrowRight } from "lucide-react";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useBrand } from "@trustbank/shared-utils/contexts/BrandContext";
import defaultLogo from "@/assets/logo.png";
import { sanitizeInput } from "@trustbank/shared-utils/utils/security";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { visuals, identity } = useBrand();
  
  const logoUrl = visuals?.primary_logo;
  const siteName = identity?.platform_name || "TrustBank";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setLoading(false);
    if (error) {
      // Generic error to prevent user enumeration
      toast({ title: "Login Failed", description: "Invalid email or password. Please try again.", variant: "destructive" });
      return;
    }
    // Check if admin
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const isAdmin = roles?.some((r: any) => ["admin", "super_admin", "support_admin"].includes(r.role));
    toast({ title: isAdmin ? "Welcome, Admin!" : "Welcome back!", description: "Redirecting..." });
    navigate(isAdmin ? "/admin" : "/dashboard");
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Error", description: "Please enter your email.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Check Your Email", description: "A password reset link has been sent to your email." });
    setResetMode(false);
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
        <div className="max-w-md text-center relative z-10">
          <img src={logoUrl || defaultLogo} alt={siteName} className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-white p-2 object-contain" width={80} height={80} />
          <h2 className="text-3xl font-poppins font-bold text-white mb-4">Secure Institutional Access</h2>
          <p className="text-white/70 mb-8 font-sans">Establish an authenticated session to manage your capital, authorize wire transfers, and access private advisory services.</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">50K+</p>
              <p className="text-xs text-white/60">Customers</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">$5B+</p>
              <p className="text-xs text-white/60">Disbursed</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">99.9%</p>
              <p className="text-xs text-white/60">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <img src={logoUrl || defaultLogo} alt={siteName} className="h-9 w-9 rounded-lg bg-white p-1 object-contain" width={36} height={36} />
            <span className="font-poppins text-xl font-bold text-foreground">{siteName}</span>
          </Link>

          {resetMode ? (
            <>
              <h1 className="text-2xl font-poppins font-bold text-foreground mb-2">Reset Password</h1>
              <p className="text-muted-foreground mb-8 font-sans">Enter your email address and we'll send you a secure reset link.</p>
              <form onSubmit={handlePasswordReset} className="space-y-5 font-sans">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Email Address</label>
                  <Input type="email" placeholder="name@company.com" className="h-14 bg-muted/30 border-border focus:bg-background transition-colors text-base" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full h-14 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
                <button type="button" className="text-sm font-semibold text-primary hover:underline w-full text-center mt-2" onClick={() => setResetMode(false)}>
                  Back to Sign In
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-poppins font-bold text-foreground mb-2">Establish Session</h1>
              <p className="text-muted-foreground mb-8 font-sans">Provide your credentials to authenticate via our secure 256-bit encrypted gateway.</p>
              <form onSubmit={handleSubmit} className="space-y-5 font-sans">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Email Address</label>
                  <Input type="email" placeholder="name@company.com" className="h-14 bg-muted/30 border-border focus:bg-background transition-colors text-base" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Password</label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" className="h-14 bg-muted/30 border-border focus:bg-background transition-colors text-base pr-12" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={() => setResetMode(true)}>
                    Forgot password?
                  </button>
                </div>
                <Button type="submit" className="w-full h-14 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Authenticate Session <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
              <p className="text-sm text-muted-foreground text-center mt-6">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary font-medium hover:underline">Open Account</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
