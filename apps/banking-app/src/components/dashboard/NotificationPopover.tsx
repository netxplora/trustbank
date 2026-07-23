import { useState, useEffect } from "react";
import { Bell, ArrowRightLeft, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@trustbank/shared-ui/components/ui/popover";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const iconMap: Record<string, React.ElementType> = {
  transaction: ArrowRightLeft,
  security: AlertTriangle,
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertTriangle,
  kyc: CheckCircle,
  loan: Info,
  card: Info,
};

const colorMap: Record<string, string> = {
  transaction: "bg-primary/10 text-primary",
  security: "bg-warning/10 text-warning",
  warning: "bg-warning/10 text-warning",
  info: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  error: "bg-destructive/10 text-destructive",
  kyc: "bg-success/10 text-success",
  loan: "bg-primary/10 text-primary",
  card: "bg-purple-50 text-purple-600",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function NotificationPopover({ basePath = "/dashboard" }: { basePath?: string }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel("notifications-popover")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setNotifications((data as Notification[]) || []);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.slice(0, 5).map((n) => {
              const Icon = iconMap[n.type] || Bell;
              return (
                <div key={n.id} className={`p-3 flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors border-b last:border-primary ${!n.read ? "bg-primary/5" : ""}`} onClick={() => markAsRead(n.id)}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${colorMap[n.type] || "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-xs ${!n.read ? "font-semibold" : "font-medium"} text-foreground leading-tight`}>{n.title}</p>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="p-2 border-t">
          <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
            <Link to={`${basePath}/notifications`}>View All Notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
