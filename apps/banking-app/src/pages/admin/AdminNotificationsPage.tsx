import { useState, useEffect } from "react";
import { Bell, Send, Mail, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { Textarea } from "@trustbank/shared-ui/components/ui/textarea";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { StaggerContainer, StaggerItem, SlideUp } from "@trustbank/shared-ui/components/Motion";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";

const AdminNotificationsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  const [subject, setSubject] = useState("");
  const [channel, setChannel] = useState("Corporate Email");
  const [audience, setAudience] = useState("Global Audience (All Clients)");
  const [body, setBody] = useState("");

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'broadcast_notification')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Error fetching broadcast history:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let targetUserIds: string[] = [];

      // Determine audience
      if (audience === "Global Audience (All Clients)") {
        const { data } = await supabase.from("profiles").select("user_id");
        if (data) targetUserIds = data.map(d => d.user_id);
      } else if (audience === "Active Portfolios Only") {
        const { data } = await supabase.from("accounts").select("user_id").eq("status", "active");
        if (data) targetUserIds = data.map(d => d.user_id);
      } else if (audience === "High-Yield Savings Clients") {
        const { data } = await supabase.from("accounts").select("user_id").eq("account_type", "savings").eq("status", "active");
        if (data) targetUserIds = data.map(d => d.user_id);
      } else if (audience === "Credit Facility Holders") {
        const { data } = await supabase.from("loans").select("user_id").in("status", ["active", "approved"]);
        if (data) targetUserIds = data.map(d => d.user_id);
      }

      // De-duplicate user IDs
      targetUserIds = [...new Set(targetUserIds)];

      if (targetUserIds.length === 0) {
        toast({ title: "Broadcast Failed", description: "No users found in the selected target audience.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Insert notifications
      const notifications = targetUserIds.map(uid => ({
        user_id: uid,
        title: subject,
        message: body,
        type: "info"
      }));

      // Insert in batches if there are many, but for now just insert all
      const { error: insertError } = await supabase.from("notifications").insert(notifications);
      if (insertError) throw insertError;

      // Log the broadcast in audit logs
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "broadcast_notification",
          entity_type: "notifications",
          details: { subject, channel, audience, body, recipientCount: targetUserIds.length }
        });
      }

      toast({ title: "Broadcast Successful", description: `Dispatched to ${targetUserIds.length} recipient(s).` });
      
      setSubject("");
      setBody("");
      fetchHistory();
      
    } catch (error: any) {
      toast({ title: "Broadcast Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">Global Broadcasts & Notifications</h1>
        <p className="text-sm text-muted-foreground font-sans">Dispatch critical announcements to institutional portfolios</p>
      </div>

      <StaggerContainer className="grid lg:grid-cols-5 gap-6 font-sans">
        <StaggerItem className="lg:col-span-3">
          <div className="bg-card rounded-xl border p-6 shadow-sm hover-lift h-full">
            <h2 className="font-bold font-poppins text-foreground mb-5 flex items-center gap-2 border-b pb-3"><Send className="h-5 w-5 text-primary" /> Dispatch Broadcast</h2>
            <form onSubmit={handleSend} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Subject Headline</label>
                <Input placeholder="Enter official subject..." className="font-semibold text-sm" required value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Distribution Channel</label>
                  <select className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold" value={channel} onChange={e => setChannel(e.target.value)}>
                    <option>Corporate Email</option>
                    <option>SMS Alert</option>
                    <option>Email + SMS (Priority)</option>
                    <option>In-App Portal Notice</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Target Audience</label>
                  <select className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold" value={audience} onChange={e => setAudience(e.target.value)}>
                    <option>Global Audience (All Clients)</option>
                    <option>Active Portfolios Only</option>
                    <option>High-Yield Savings Clients</option>
                    <option>Credit Facility Holders</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Official Communication Body</label>
                <Textarea placeholder="Draft institutional message here..." rows={6} className="text-sm font-medium" required value={body} onChange={e => setBody(e.target.value)} />
              </div>
              <Button type="submit" className="w-full font-bold h-11 text-sm mt-2" disabled={loading || !subject || !body}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transmitting...</> : "Dispatch Notification Broadcast"}
              </Button>
            </form>
          </div>
        </StaggerItem>

        <StaggerItem className="lg:col-span-2">
          <div className="bg-card rounded-xl border shadow-sm hover-lift h-full">
            <div className="p-5 border-b bg-muted/10 flex justify-between items-center">
              <h2 className="font-bold font-poppins text-foreground">Transmission History Ledger</h2>
              {fetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="divide-y">
              {history.length === 0 && !fetching ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No broadcasts have been sent yet.</div>
              ) : (
                history.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-muted/5 transition-colors">
                    <p className="text-sm font-bold text-foreground leading-tight">{log.details?.subject}</p>
                    <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-muted/50 border px-2 py-0.5 rounded-sm whitespace-nowrap">
                        {log.details?.channel?.includes("Email") && <Mail className="h-3 w-3" />}
                        {log.details?.channel?.includes("SMS") && <MessageSquare className="h-3 w-3" />}
                        {log.details?.channel}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">• {log.details?.audience} ({log.details?.recipientCount} recipients)</span>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground mt-2">
                      {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
};

export default AdminNotificationsPage;
