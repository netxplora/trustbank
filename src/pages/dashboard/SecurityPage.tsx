import { useState, useEffect } from "react";
import { Shield, Smartphone, Monitor, Globe, Clock, ToggleLeft, ToggleRight, KeyRound, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { StaggerContainer, StaggerItem } from "@/components/public/Motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const SecurityPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  
  // Transaction PIN States
  const [hasPin, setHasPin] = useState<boolean>(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinAction, setPinAction] = useState<"setup" | "change" | "reset">("setup");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSecurityData();
      fetchPinStatus();
    }
  }, [user]);

  const fetchPinStatus = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("transaction_pin_set_at").eq("user_id", user.id).single();
    if (data && data.transaction_pin_set_at) {
      setHasPin(true);
    }
  };

  const fetchSecurityData = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("action", "login")
      .order("created_at", { ascending: false })
      .limit(10);
      
    if (data) {
      const history = data.map((log, i) => {
        const details = log.details as any;
        return {
          device: details?.device || "Unknown Device",
          ip: log.ip_address || "Unknown IP",
          location: details?.location || "Unknown Location",
          time: new Date(log.created_at).toLocaleString(),
          current: i === 0,
          rawDetails: details
        };
      });
      setLoginHistory(history);

      const uniqueDevices = new Map();
      history.forEach((h: any) => {
        if (!uniqueDevices.has(h.device)) {
          uniqueDevices.set(h.device, {
            name: h.device,
            type: h.device.toLowerCase().includes("iphone") || h.device.toLowerCase().includes("android") ? "mobile" : "desktop",
            icon: h.device.toLowerCase().includes("iphone") || h.device.toLowerCase().includes("android") ? Smartphone : Monitor,
            lastUsed: h.time,
            current: h.current
          });
        }
      });
      setDevices(Array.from(uniqueDevices.values()));
    }
  };

  const handleTwoFactorToggle = () => {
    if (!twoFactor) {
      toast({ title: "MFA Enrollment Initiated", description: "Authenticator app setup will be fully available in the next update." });
      setTwoFactor(true);
    } else {
      toast({ title: "MFA Disabled", description: "Two-Factor Authentication has been removed from your account." });
      setTwoFactor(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmittingPin(true);

    try {
      if (pinAction === "setup") {
        const { error } = await supabase.rpc("setup_transaction_pin", { p_pin: newPin });
        if (error) throw error;
        toast({ title: "Transaction PIN Set", description: "Your transaction PIN has been successfully created." });
        setHasPin(true);
      } else if (pinAction === "change") {
        const { error } = await supabase.rpc("change_transaction_pin", { p_old_pin: currentPin, p_new_pin: newPin });
        if (error) throw error;
        toast({ title: "Transaction PIN Changed", description: "Your transaction PIN has been successfully updated." });
      } else if (pinAction === "reset") {
        const { error } = await supabase.rpc("reset_transaction_pin", { p_new_pin: newPin });
        if (error) throw error;
        toast({ title: "Transaction PIN Reset", description: "Your transaction PIN has been successfully reset." });
        setHasPin(true);
      }
      setPinDialogOpen(false);
      setCurrentPin("");
      setNewPin("");
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmittingPin(false);
    }
  };

  return (
    <StaggerContainer className="space-y-4 max-w-3xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <StaggerItem>
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-foreground mb-0.5 font-poppins">Security</h1>
        <p className="text-xs text-muted-foreground">Manage your security settings and devices</p>
      </div>
      </StaggerItem>

      <StaggerItem>
      <div className="bg-card rounded-xl border border-border/60 p-3.5 sm:p-4 shadow-sm">
        <h2 className="font-semibold text-xs text-foreground mb-3 flex items-center gap-1.5 font-poppins"><Shield className="h-4 w-4 text-primary" /> Security Settings</h2>
        
        {/* Transaction PIN Section */}
        <div className="mb-4 bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Transaction PIN</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasPin 
                  ? "Your 4-digit PIN is required to authorize all financial transactions." 
                  : "Set up a 4-digit PIN to secure your transfers and withdrawals."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {!hasPin ? (
              <Button size="sm" onClick={() => { setPinAction("setup"); setPinDialogOpen(true); }}>
                Setup PIN
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => { setPinAction("change"); setPinDialogOpen(true); }}>
                  Change PIN
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setPinAction("reset"); setPinDialogOpen(true); }}>
                  Reset PIN
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {[
            { label: "Two-Factor Authentication", desc: "Add an extra layer of security", value: twoFactor, action: handleTwoFactorToggle },
            { label: "Login Alerts", desc: "Get notified when someone logs into your account", value: loginAlerts, action: () => { setLoginAlerts(!loginAlerts); toast({ title: `Login Alerts ${!loginAlerts ? "enabled" : "disabled"}` }); } },
            { label: "Transaction Alerts", desc: "Receive alerts for all account transactions", value: transactionAlerts, action: () => { setTransactionAlerts(!transactionAlerts); toast({ title: `Transaction Alerts ${!transactionAlerts ? "enabled" : "disabled"}` }); } },
          ].map(({ label, desc, value, action }) => (
            <div key={label} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
              <div>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
              <button onClick={action}>
                {value ? <ToggleRight className="h-6 w-6 text-primary" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
              </button>
            </div>
          ))}
        </div>
      </div>
      </StaggerItem>

      <StaggerItem>
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm">
        <div className="p-3 sm:p-3.5 border-b border-border/60 bg-muted/10 flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-xs text-foreground font-poppins">Login History</h2>
        </div>
        <div className="divide-y divide-border/30 text-xs">
          {loginHistory.length === 0 ? (
            <div className="p-5 text-center text-xs text-muted-foreground">No recent logins found</div>
          ) : loginHistory.map((entry, i) => (
            <div key={i} className="px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">{entry.device} {entry.current && <span className="text-[10px] text-success ml-1">(Current)</span>}</p>
                  <p className="text-[10px] text-muted-foreground">{entry.location} • {entry.ip}</p>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{entry.time}</span>
            </div>
          ))}
        </div>
      </div>
      </StaggerItem>

      <StaggerItem>
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm">
        <div className="p-3 sm:p-3.5 border-b border-border/60 bg-muted/10 flex items-center gap-1.5">
          <Monitor className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-xs text-foreground font-poppins">Trusted Devices</h2>
        </div>
        <div className="divide-y divide-border/30 text-xs">
          {devices.length === 0 ? (
            <div className="p-5 text-center text-xs text-muted-foreground">No trusted devices found</div>
          ) : devices.map((device, i) => {
            const Icon = device.icon;
            return (
              <div key={i} className="px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{device.name} {device.current && <span className="text-[10px] text-success ml-1">(This device)</span>}</p>
                    <p className="text-[10px] text-muted-foreground">Last used: {device.lastUsed}</p>
                  </div>
                </div>
                {!device.current && <Button variant="outline" size="sm" className="text-destructive text-xs h-7 rounded-lg">Remove</Button>}
              </div>
            );
          })}
        </div>
      </div>
      </StaggerItem>

      {/* Transaction PIN Dialog */}
      <Dialog open={pinDialogOpen} onOpenChange={(open) => { if (!isSubmittingPin) { setPinDialogOpen(open); setCurrentPin(""); setNewPin(""); } }}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl">
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">
              {pinAction === "setup" && "Setup Transaction PIN"}
              {pinAction === "change" && "Change Transaction PIN"}
              {pinAction === "reset" && "Reset Transaction PIN"}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground pt-2 text-sm leading-relaxed">
              {pinAction === "setup" && "Create a secure 4-digit PIN for your transactions."}
              {pinAction === "change" && "Enter your current PIN, followed by your new PIN."}
              {pinAction === "reset" && "Set a new 4-digit PIN to regain access to transactions."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePinSubmit} className="flex flex-col items-center space-y-6 py-4">
            {pinAction === "change" && (
              <div className="w-full flex flex-col items-center space-y-2">
                <span className="text-xs font-semibold text-muted-foreground">Current PIN</span>
                <InputOTP maxLength={4} value={currentPin} onChange={setCurrentPin} disabled={isSubmittingPin}>
                  <InputOTPGroup className="gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} className="w-12 h-14 text-xl font-bold border-2 rounded-lg bg-background" style={{ WebkitTextSecurity: "disc" }} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}
            
            <div className="w-full flex flex-col items-center space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">New PIN</span>
              <InputOTP maxLength={4} value={newPin} onChange={setNewPin} disabled={isSubmittingPin}>
                <InputOTPGroup className="gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <InputOTPSlot key={i} index={i} className="w-12 h-14 text-xl font-bold border-2 rounded-lg bg-background" style={{ WebkitTextSecurity: "disc" }} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              type="submit"
              disabled={newPin.length !== 4 || (pinAction === "change" && currentPin.length !== 4) || isSubmittingPin}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isSubmittingPin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save PIN"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </StaggerContainer>
  );
};

export default SecurityPage;
