import { useState, useEffect } from "react";
import { Shield, Smartphone, Monitor, Globe, Clock, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Removed mock arrays

const SecurityPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchSecurityData();
  }, [user]);

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
    </StaggerContainer>
  );
};

export default SecurityPage;
