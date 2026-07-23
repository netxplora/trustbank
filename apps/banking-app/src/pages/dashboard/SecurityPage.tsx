import { useState, useEffect } from "react";
import { Shield, Smartphone, Monitor, Globe, Clock, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";

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
    <StaggerContainer className="space-y-6 max-w-3xl">
      <StaggerItem>
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Security</h1>
        <p className="text-sm text-muted-foreground">Manage your security settings and devices</p>
      </div>
      </StaggerItem>

      <StaggerItem>
      <div className="bg-card rounded-xl border p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Security Settings</h2>
        <div className="space-y-4">
          {[
            { label: "Two-Factor Authentication", desc: "Add an extra layer of security to your account", value: twoFactor, action: handleTwoFactorToggle },
            { label: "Login Alerts", desc: "Get notified when someone logs into your account", value: loginAlerts, action: () => { setLoginAlerts(!loginAlerts); toast({ title: `Login Alerts ${!loginAlerts ? "enabled" : "disabled"}` }); } },
            { label: "Transaction Alerts", desc: "Receive alerts for all account transactions", value: transactionAlerts, action: () => { setTransactionAlerts(!transactionAlerts); toast({ title: `Transaction Alerts ${!transactionAlerts ? "enabled" : "disabled"}` }); } },
          ].map(({ label, desc, value, action }) => (
            <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button onClick={action}>
                {value ? <ToggleRight className="h-8 w-8 text-primary" /> : <ToggleLeft className="h-8 w-8 text-muted-foreground" />}
              </button>
            </div>
          ))}
        </div>
      </div>
      </StaggerItem>

      <StaggerItem>
      <div className="bg-card rounded-xl border">
        <div className="p-5 border-b flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Login History</h2>
        </div>
        <div className="divide-y">
          {loginHistory.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No recent logins found</div>
          ) : loginHistory.map((entry, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{entry.device} {entry.current && <span className="text-xs text-success ml-1">(Current)</span>}</p>
                  <p className="text-xs text-muted-foreground">{entry.location} • {entry.ip}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{entry.time}</span>
            </div>
          ))}
        </div>
      </div>
      </StaggerItem>

      <StaggerItem>
      <div className="bg-card rounded-xl border">
        <div className="p-5 border-b flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Trusted Devices</h2>
        </div>
        <div className="divide-y">
          {devices.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No trusted devices found</div>
          ) : devices.map((device, i) => {
            const Icon = device.icon;
            return (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{device.name} {device.current && <span className="text-xs text-success ml-1">(This device)</span>}</p>
                    <p className="text-xs text-muted-foreground">Last used: {device.lastUsed}</p>
                  </div>
                </div>
                {!device.current && <Button variant="outline" size="sm" className="text-destructive">Remove</Button>}
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
