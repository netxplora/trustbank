import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Search, User, MessageCircle, CheckCircle, XCircle, Sparkles, Check, CheckCheck, Loader2, Circle, ArrowLeft, ShieldAlert, UserCheck } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { FadeIn } from "@trustbank/shared-ui/components/Motion";
import { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";

interface Conversation {
  id: string;
  user_id: string;
  subject: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  profiles: { display_name: string | null; email: string | null; account_number: string | null; kyc_status: string; account_status: string } | null;
  unread_count?: number;
}

interface Message {
  id: string;
  content: string | null;
  sender_id: string;
  sender_role: string;
  created_at: string;
  read: boolean;
}

const statusConfig: Record<string, { bg: string; dot: string; label: string }> = {
  open: { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", label: "Open" },
  pending: { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", dot: "bg-amber-500", label: "Pending" },
  resolved: { bg: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary", label: "Resolved" },
  closed: { bg: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground", label: "Closed" },
};

const AdminChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Lifecycle ──
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchConversations();

    // Global listener for new conversations and messages
    const globalChannel = supabase
      .channel("admin-conversations-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => fetchConversations())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => fetchConversations())
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, userTyping]);

  // ── Realtime per-conversation ──
  const setupRealtime = useCallback((convId: string) => {
    if (channel) supabase.removeChannel(channel);

    const newChannel = supabase.channel(`support-chat-${convId}`, {
      config: { 
        presence: { key: user?.id || "admin" },
        broadcast: { self: false, ack: true }
      },
    });

    newChannel
      .on("presence", { event: "sync" }, () => {
        const state = newChannel.presenceState();
        let typing = false;
        for (const [key, presences] of Object.entries(state)) {
          if (key !== user?.id && (presences[0] as any).isTyping) typing = true;
        }
        setUserTyping(typing);
      })
      .on("broadcast", { event: "new_message" }, (payload) => {
        const msg = payload.payload;
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg as Message];
        });
        // Auto-mark user messages as read when admin has this conversation open
        if (msg.sender_role === "user") {
          supabase.from("messages").update({ read: true }).eq("id", msg.id).then();
        }
        fetchConversations(); // refresh unread counts
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` }, (payload) => {
        // Fallback: catches messages if broadcast was missed (e.g. reconnect)
        setMessages((prev) => {
          if (prev.find((m) => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as Message];
        });
        if (payload.new.sender_role === "user") {
          supabase.from("messages").update({ read: true }).eq("id", payload.new.id).then();
        }
        fetchConversations();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` }, (payload) => {
        setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? { ...m, ...(payload.new as any) } : m)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await newChannel.track({ isTyping: false });
        }
      });

    setChannel(newChannel);
  }, [channel, user?.id]);

  // ── Data fetching ──
  const fetchConversations = async () => {
    // 1. Fetch conversations
    const { data: convData, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (convError || !convData || convData.length === 0) {
      return setConversations([]);
    }

    // 2. Fetch profiles for these users
    const userIds = [...new Set((convData as any[]).map((c) => c.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, user_id, display_name, email, account_number, kyc_status, account_status")
      .in("user_id", userIds);

    const profilesMap = new Map();
    if (profilesData) {
      profilesData.forEach((p) => profilesMap.set(p.user_id, p));
    }

    // 3. Compute unread counts and merge profiles
    const enriched = await Promise.all(
      (convData as any[]).map(async (conv) => {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("sender_role", "user")
          .eq("read", false);
          
        return { 
          ...conv, 
          profiles: profilesMap.get(conv.user_id) || null,
          unread_count: count || 0 
        };
      })
    );
    
    setConversations(enriched);
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", convId).order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
    // Mark all user messages in this conversation as read
    await supabase.from("messages").update({ read: true }).eq("conversation_id", convId).eq("sender_role", "user").eq("read", false);
    fetchConversations();
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    fetchMessages(conv.id);
    setupRealtime(conv.id);
  };

  // ── Actions ──
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (channel) {
      await channel.track({ isTyping: val.trim().length > 0 });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedConv || !user) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    if (channel) await channel.track({ isTyping: false });

    const { data } = await supabase.from("messages").insert({
      conversation_id: selectedConv.id,
      sender_id: user.id,
      sender_role: "admin",
      content,
    }).select().single();

    if (data) {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.id)) return prev;
        return [...prev, data as Message];
      });

      // Broadcast to the user's side so they receive it instantly
      if (channel) {
        channel.send({ type: "broadcast", event: "new_message", payload: data });
      }
    }

    // Update conversation timestamp
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", selectedConv.id);
    setSending(false);
  };

  const updateProfileField = async (field: "kyc_status" | "account_status", value: string) => {
    if (!selectedConv) return;
    try {
      const { error } = await supabase.from("profiles").update({ [field]: value }).eq("user_id", selectedConv.user_id);
      if (error) throw error;
      
      toast.success(`${field.replace("_", " ")} updated to ${value}`);
      
      // Update local state
      setSelectedConv(prev => prev ? {
        ...prev,
        profiles: prev.profiles ? { ...prev.profiles, [field]: value } : prev.profiles
      } : null);
      
      fetchConversations();
    } catch (err: any) {
      toast.error(`Failed to update: ${err.message}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedConv) return;
    await supabase.from("conversations").update({ status }).eq("id", selectedConv.id);
    setSelectedConv({ ...selectedConv, status });
    fetchConversations();
  };

  const enhanceWithAI = async () => {
    if (!input.trim()) return;
    setPolishing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const signatures = ["Best regards,\nCorporate Support Team", "Kind regards,\nClient Relations", "Thank you for banking with us."];
    const sig = signatures[Math.floor(Math.random() * signatures.length)];

    let enhanced = input;
    if (!input.toLowerCase().startsWith("hello") && !input.toLowerCase().startsWith("hi") && !input.toLowerCase().startsWith("dear")) {
      enhanced = `Hello,\n\n${enhanced}`;
    }
    enhanced = `${enhanced}\n\n${sig}`;

    setInput(enhanced);
    setPolishing(false);
  };

  const filtered = conversations.filter((c) => {
    const name = c.profiles?.display_name || c.profiles?.email || "";
    return name.toLowerCase().includes(search.toLowerCase()) || (c.subject || "").toLowerCase().includes(search.toLowerCase());
  });

  const getInitials = (conv: Conversation) => {
    const name = conv.profiles?.display_name || conv.profiles?.email || "U";
    return name.charAt(0).toUpperCase();
  };

  // ── Render ──
  return (
    <div className="space-y-4 font-sans">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">Corporate Client Support</h1>
        <p className="text-sm text-muted-foreground">Manage client inquiries and secure communications</p>
      </div>

      <div className="bg-card rounded-xl border shadow-sm flex overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
        {/* ─── Left: Inbox Sidebar ─── */}
        <div className={`w-full md:w-80 border-r flex-col shrink-0 ${selectedConv ? "hidden md:flex" : "flex"}`}>
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                className="pl-9 h-10 text-sm bg-muted/30 border-0 focus-visible:ring-1"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="divide-y divide-border">
              {filtered.map((conv) => {
                const cfg = statusConfig[conv.status] || statusConfig.open;
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <div key={conv.id}>
                    <div
                      onClick={() => selectConversation(conv)}
                      className={`p-4 cursor-pointer transition-all hover:bg-muted/40 ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "border-l-2 border-l-transparent"}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            {getInitials(conv)}
                          </div>
                          {conv.status === "open" && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 border-2 border-card rounded-full" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-sm font-bold text-foreground truncate pr-2">{conv.profiles?.display_name || conv.profiles?.email || "Unknown Client"}</p>
                            {(conv.unread_count ?? 0) > 0 && (
                              <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mb-1.5">{conv.subject || "No subject"}</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg}`}>
                              <Circle className={`h-1.5 w-1.5 ${cfg.dot} inline-block mr-1 fill-current`} />
                              {cfg.label}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {new Date(conv.updated_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="p-8 text-center">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">No conversations found.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Center: Chat Area ─── */}
        <div className={`flex-1 flex-col min-w-0 overflow-hidden ${!selectedConv ? "hidden md:flex" : "flex"}`}>
          {selectedConv ? (
            <FadeIn className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedConv(null)} className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors mr-1">
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{getInitials(selectedConv)}</span>
                    </div>
                    {selectedConv.status === "open" && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{selectedConv.profiles?.display_name || "Unknown Client"}</p>
                    <p className="text-xs text-muted-foreground">
                      {userTyping ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">typing...</span>
                      ) : (
                        selectedConv.subject || "No subject"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedConv.status !== "resolved" && (
                    <Button variant="outline" size="sm" className="text-xs font-bold h-8 rounded-lg" onClick={() => updateStatus("resolved")}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> Resolve
                    </Button>
                  )}
                  {selectedConv.status !== "closed" && (
                    <Button variant="outline" size="sm" className="text-xs font-bold h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => updateStatus("closed")}>
                      <XCircle className="h-3.5 w-3.5 mr-1.5" /> Close
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col gap-4">
                <div className="text-center my-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    {selectedConv.subject || "Conversation"}
                  </span>
                </div>

                {messages.map((msg, index) => {
                  const isAdmin = msg.sender_role !== "user";
                  const showAvatar = !isAdmin && (index === 0 || messages[index - 1].sender_role !== "user");

                  return (
                    <FadeIn key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"} gap-2`}>
                      {!isAdmin && (
                        <div className="w-8 shrink-0 flex items-end">
                          {showAvatar && (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mb-1">
                              <span className="text-xs font-bold text-muted-foreground">{getInitials(selectedConv)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${isAdmin ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border text-foreground rounded-bl-sm"}`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1.5 ${isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          <span className="text-[9px] font-mono font-semibold">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isAdmin && (msg.read ? <CheckCheck className="h-3 w-3 text-white" /> : <Check className="h-3 w-3 opacity-70" />)}
                        </div>
                      </div>
                    </FadeIn>
                  );
                })}

                {/* Typing indicator */}
                {userTyping && (
                  <div className="flex justify-start gap-2">
                    <div className="w-8 shrink-0 flex items-end">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mb-1">
                        <span className="text-xs font-bold text-muted-foreground">{getInitials(selectedConv)}</span>
                      </div>
                    </div>
                    <div className="bg-card border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5 h-11 w-16">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t bg-background">
                <div className="flex items-center justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 rounded-lg font-bold bg-primary/5 text-primary hover:bg-primary/10 border-primary/20"
                    onClick={enhanceWithAI}
                    disabled={!input.trim() || polishing}
                  >
                    {polishing ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Polishing...</>
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Professional Polish</>
                    )}
                  </Button>
                </div>
                <div className="flex items-end gap-2 bg-muted/30 p-1.5 rounded-2xl border focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <Input
                    placeholder="Draft professional response..."
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm h-11 px-4"
                  />
                  <Button size="icon" onClick={sendMessage} disabled={!input.trim() || sending} className="h-11 w-11 shrink-0 rounded-xl shadow-sm">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </FadeIn>
          ) : (
            <FadeIn className="flex-1 flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/50">
              <div className="text-center max-w-sm px-6">
                <div className="h-20 w-20 bg-primary/5 border border-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="h-10 w-10 text-primary/40" />
                </div>
                <h3 className="font-bold font-poppins text-foreground mb-2 text-lg">Corporate Communications</h3>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">Select a client from the directory to review their inquiry and provide assistance.</p>
              </div>
            </FadeIn>
          )}
        </div>

        {/* ─── Right: Client Details Panel ─── */}
        {selectedConv && (
          <div className="w-72 border-l hidden lg:flex flex-col overflow-y-auto custom-scrollbar bg-background">
            <div className="p-6 text-center border-b">
              <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <span className="text-xl font-bold text-primary">{getInitials(selectedConv)}</span>
              </div>
              <p className="font-bold font-poppins text-foreground text-sm">{selectedConv.profiles?.display_name || "Unknown Client"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedConv.profiles?.email}</p>
            </div>
            <div className="p-5 space-y-4 text-sm flex-1">
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Account Number</p>
                <p className="font-mono font-bold text-foreground">{selectedConv.profiles?.account_number || "N/A"}</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">KYC Status</p>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${selectedConv.profiles?.kyc_status === "approved" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"}`}>
                  {selectedConv.profiles?.kyc_status || "N/A"}
                </span>
              </div>
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Account Status</p>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${selectedConv.profiles?.account_status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                  {selectedConv.profiles?.account_status || "N/A"}
                </span>
              </div>
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Ticket Status</p>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${(statusConfig[selectedConv.status] || statusConfig.open).bg}`}>
                  {(statusConfig[selectedConv.status] || statusConfig.open).label}
                </span>
              </div>
            </div>

            {/* Quick Admin Actions */}
            <div className="p-5 border-t bg-muted/10 space-y-3 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Admin Actions</p>
              
              <div className="grid grid-cols-2 gap-2">
                {selectedConv.profiles?.kyc_status !== "approved" && (
                  <Button size="sm" variant="outline" className="h-8 text-xs font-semibold text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" onClick={() => updateProfileField("kyc_status", "approved")}>
                    <UserCheck className="h-3.5 w-3.5 mr-1" /> Approve KYC
                  </Button>
                )}
                {selectedConv.profiles?.account_status === "active" ? (
                  <Button size="sm" variant="outline" className="h-8 text-xs font-semibold text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => updateProfileField("account_status", "suspended")}>
                    <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Suspend
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="h-8 text-xs font-semibold text-primary border-primary/20 hover:bg-primary/10" onClick={() => updateProfileField("account_status", "active")}>
                    <UserCheck className="h-3.5 w-3.5 mr-1" /> Activate
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatPage;

