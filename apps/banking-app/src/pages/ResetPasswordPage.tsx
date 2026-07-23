import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import logo from "@/assets/logo.png";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValid(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password Updated!", description: "You can now sign in with your new password." });
    navigate("/login");
  };

  if (!valid) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden bg-slate-950">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
              alt="Institutional Banking" 
              className="w-full h-full object-cover opacity-60 mix-blend-luminosity grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
            <div className="absolute inset-0 bg-destructive/20 mix-blend-color" />
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md text-center">
            <img src={logo} alt="TrustBank" className="h-16 w-16 mx-auto mb-6 rounded-2xl bg-white p-2 shadow-sm" />
            <h1 className="text-2xl font-poppins font-bold text-foreground mb-3">Link Expired</h1>
            <p className="text-muted-foreground font-sans mb-8">The cryptographic reset token provided is invalid or has expired due to our strict security lifecycle. Please request a new authentication link.</p>
            <Button className="w-full h-14 rounded-xl text-base font-bold shadow-lg" onClick={() => navigate("/login")}>Return to Gateway</Button>
          </div>
        </div>
      </div>
    );
  }

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
          <img src={logo} alt="TrustBank" className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-white p-2 object-contain" />
          <h2 className="text-3xl font-poppins font-bold text-white mb-4">Secure Recovery</h2>
          <p className="text-white/70 font-sans">Establish a new non-dictionary cryptographic phrase to regain access to your institutional portfolio.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <img src={logo} alt="TrustBank" className="h-12 w-12 mb-6 rounded-xl bg-white p-1.5 shadow-sm lg:hidden" />
            <h1 className="text-2xl font-poppins font-bold text-foreground">Establish Credentials</h1>
            <p className="text-sm text-muted-foreground mt-2 font-sans">Select a strong, non-dictionary cryptographic phrase.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5 font-sans">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">New Password</label>
              <Input type="password" placeholder="Enter new password" className="h-14 bg-muted/30 border-border focus:bg-background transition-colors text-base" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Confirm Password</label>
              <Input type="password" placeholder="Confirm new password" className="h-14 bg-muted/30 border-border focus:bg-background transition-colors text-base" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full h-14 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all mt-4" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Committing Cipher...
                </span>
              ) : (
                "Update Cryptographic Credential"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
