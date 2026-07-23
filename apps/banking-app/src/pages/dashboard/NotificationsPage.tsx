import { useState, useEffect } from "react";
import { Bell, CheckCircle, AlertTriangle, Info, ArrowRightLeft } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { FadeIn } from "@trustbank/shared-ui/components/Motion";
import { ListSkeleton } from "@trustbank/shared-ui/components/skeletons/DashboardSkeleton";

const iconMap: Record<string, React.ElementType> = { transaction: ArrowRightLeft, security: AlertTriangle, warning: AlertTriangle, info: Info, success: CheckCircle, error: AlertTriangle, kyc: CheckCircle, loan: Info, card: Info };
const colorMap: Record<string, string> = { transaction: "bg-primary/10 text-primary", security: "bg-warning/10 text-warning", warning: "bg-warning/10 text-warning", info: "bg-primary/10 text-primary", success: "bg-success/10 text-success", error: "bg-destructive/10 text-destructive", kyc: "bg-success/10 text-success", loan: "bg-primary/10 text-primary", card: "bg-purple-50 text-purple-600" };

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(d).toLocaleDateString();
}

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const channel = supabase.channel("notifications-page").on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (p) => { setNotifications(prev => [p.new as Notification, ...prev]); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2"><div className="h-7 w-32 bg-muted rounded animate-pulse" /><div className="h-4 w-48 bg-muted rounded animate-pulse" /></div>
      <ListSkeleton items={5} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
        </div>
        {unreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllRead}>Mark all as read</Button>}
      </div>
      <FadeIn className="bg-card rounded-xl border divide-y">
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-sm font-semibold text-muted-foreground flex flex-col items-center gap-2">
            <span className="block text-3xl mb-2">🔔</span>
            You have no notifications at this time.
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = iconMap[n.type] || Bell;
            return (
              <div key={n.id} className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors ${!n.read ? "bg-primary/5" : ""}`} onClick={() => markRead(n.id)}>
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${colorMap[n.type] || "bg-muted text-muted-foreground"}`}><Icon className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"} text-foreground`}>{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
      </FadeIn>
    </div>
  );
};

export default NotificationsPage;
