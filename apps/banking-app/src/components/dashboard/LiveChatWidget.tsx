import { useState, useEffect, useRef } from "react";
import {
  Send,
  MessageCircle,
  Check,
  CheckCheck,
  Loader2,
  ArrowLeft,
  Clock,
  Shield,
  Headphones,
  Plus,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { FadeIn } from "@trustbank/shared-ui/components/Motion";
import { RealtimeChannel } from "@supabase/supabase-js";

interface Message {
  id: string;
  content: string | null;
  sender_id: string;
  sender_role: string;
  created_at: string;
  read: boolean;
}

interface Conversation {
  id: string;
  subject: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export function LiveChatWidget() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [view, setView] = useState<"landing" | "chat" | "history">("landing");
  const [sending, setSending] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchFAQs();
    fetchConversations();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [isOpen]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, adminTyping]);

  // Track scroll position to show/hide scroll-down button
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  // ── Realtime ──
  const setupRealtime = (convId: string) => {
    if (channel) supabase.removeChannel(channel);

    const newChannel = supabase.channel(`support-chat-${convId}`, {
      config: {
        presence: { key: user?.id || "user" },
        broadcast: { self: false, ack: true },
      },
    });

    newChannel
      .on("presence", { event: "sync" }, () => {
        const state = newChannel.presenceState();
        let isTyping = false;
        for (const [key, presences] of Object.entries(state)) {
          if (key !== user?.id) {
            if ((presences[0] as any).isTyping) isTyping = true;
          }
        }
        setAdminTyping(isTyping);
      })
      .on("broadcast", { event: "new_message" }, (payload) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === payload.payload.id)) return prev;
          return [...prev, payload.payload as Message];
        });
        if (payload.payload.sender_id !== user?.id) {
          supabase
            .from("messages")
            .update({ read: true })
            .eq("id", payload.payload.id)
            .then();
        }
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.find((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
          if (payload.new.sender_id !== user?.id) {
            supabase
              .from("messages")
              .update({ read: true })
              .eq("id", payload.new.id)
              .then();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id ? { ...m, ...(payload.new as any) } : m,
            ),
          );
        },
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await newChannel.track({ isTyping: false });
        }
      });

    setChannel(newChannel);
  };

  // ── Data fetching ──
  const fetchFAQs = async () => {
    const { data } = await supabase
      .from("faqs")
      .select("*")
      .eq("active", true)
      .order("sort_order");
    setFaqs((data as FAQ[]) || []);
  };

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    const convs = (data as Conversation[]) || [];
    setConversations(convs);

    // Auto-open the most recent active conversation
    const active = convs.find(
      (c) => c.status === "open" || c.status === "pending",
    );
    if (active) {
      setConversationId(active.id);
      setActiveConversation(active);
      await fetchMessages(active.id);
      setupRealtime(active.id);
      setView("chat");
    }
    setLoading(false);
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
    if (user) {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", convId)
        .neq("sender_id", user.id)
        .eq("read", false);
    }
  };

  // ── Actions ──
  const startConversation = async (subject: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, subject, status: "open" })
      .select()
      .single();
    if (error || !data) return;

    const conv = data as Conversation;
    setConversationId(conv.id);
    setActiveConversation(conv);
    setupRealtime(conv.id);
    setView("chat");

    const { data: msgData } = await supabase
      .from("messages")
      .insert({
        conversation_id: conv.id,
        sender_id: user.id,
        sender_role: "user",
        content: `I need help with: ${subject}`,
      })
      .select()
      .single();

    if (msgData) {
      setMessages([msgData as Message]);
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "new_message",
          payload: msgData,
        });
      }
    }
    setConversations((prev) => [conv, ...prev]);
  };

  const openConversation = async (conv: Conversation) => {
    setConversationId(conv.id);
    setActiveConversation(conv);
    await fetchMessages(conv.id);
    if (conv.status === "open" || conv.status === "pending") {
      setupRealtime(conv.id);
    }
    setView("chat");
  };

  const goBack = () => {
    if (channel) supabase.removeChannel(channel);
    setChannel(null);
    setMessages([]);
    setConversationId(null);
    setActiveConversation(null);
    setView("landing");
    fetchConversations();
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (channel) {
      await channel.track({ isTyping: val.trim().length > 0 });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || !user) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    if (channel) await channel.track({ isTyping: false });

    const { data } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_role: "user",
        content,
      })
      .select()
      .single();

    if (data) {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.id)) return prev;
        return [...prev, data as Message];
      });
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "new_message",
          payload: data,
        });
      }
    }

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Helpers ──
  const faqCategories = [
    { label: "Deposit Issues", icon: "💰", desc: "Pending or failed deposits" },
    {
      label: "Withdrawal Issues",
      icon: "🏧",
      desc: "Withdrawal delays or errors",
    },
    { label: "Account Issues", icon: "👤", desc: "Account access or settings" },
    {
      label: "KYC Verification",
      icon: "🛡️",
      desc: "Identity verification help",
    },
    { label: "Card Issues", icon: "💳", desc: "Card activation or limits" },
    { label: "Loan Issues", icon: "📈", desc: "Loan applications or payments" },
    {
      label: "Transfer Issues",
      icon: "🔄",
      desc: "Failed or delayed transfers",
    },
    { label: "Others", icon: "❓", desc: "General questions" },
  ];

  const statusStyles: Record<string, string> = {
    open: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    pending:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    resolved: "bg-primary/10 text-primary border-primary/20",
    closed: "bg-muted text-muted-foreground border-border",
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const isConversationActive =
    activeConversation?.status === "open" ||
    activeConversation?.status === "pending";

  // ── Render ──
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 bg-primary text-primary-foreground rounded-full shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all duration-300"
        title="Live Support Chat"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute top-0 right-0 h-3.5 w-3.5 bg-destructive border-2 border-background rounded-full animate-pulse" />
      </button>
    );
  }

  if (loading) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] bg-card rounded-2xl shadow-2xl border font-sans flex flex-col p-6 animate-in zoom-in-95 duration-200">
        <div className="animate-pulse space-y-4 h-full flex flex-col">
          <div className="h-8 w-3/4 bg-muted rounded-lg" />
          <div className="h-4 w-full bg-muted/60 rounded-lg" />
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 bg-muted rounded-full" />
            <div className="h-5 w-48 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] bg-card rounded-2xl shadow-2xl border font-sans flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
      {/* ─── Widget Header ─── */}
      <div className="bg-primary/5 border-b p-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Headphones className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-poppins text-foreground leading-tight">Support Desk</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">We usually reply in minutes</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Navigation Breadcrumbs / Actions */}
        <div className="flex items-center gap-2">
          {view === "chat" && (
            <Button variant="secondary" size="sm" className="font-bold text-[10px] h-7 px-2 rounded-md bg-background shadow-sm hover:bg-muted" onClick={goBack}>
              <ArrowLeft className="h-3 w-3 mr-1" /> Back
            </Button>
          )}
          {view === "landing" && conversations.length > 0 && (
            <Button variant="secondary" size="sm" className="font-bold text-[10px] h-7 px-2 rounded-md bg-background shadow-sm hover:bg-muted" onClick={() => setView("history")}>
              <Clock className="h-3 w-3 mr-1" /> History ({conversations.length})
            </Button>
          )}
          {view === "history" && (
            <Button variant="secondary" size="sm" className="font-bold text-[10px] h-7 px-2 rounded-md bg-background shadow-sm hover:bg-muted" onClick={() => setView("landing")}>
              <Plus className="h-3 w-3 mr-1" /> New
            </Button>
          )}
        </div>
      </div>

      {/* ─── Main Container ─── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 relative">
        {/* ═══════ LANDING VIEW ═══════ */}
        {view === "landing" && (
          <FadeIn className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 md:p-8">
              <div className="max-w-2xl mx-auto">
                {/* Welcome Header */}
                <div className="text-center mb-6 pt-2">
                  <h2 className="text-sm font-bold font-poppins text-foreground mb-1">
                    Hi {profile?.display_name?.split(" ")[0] || "there"}, how can we help?
                  </h2>
                </div>

                {/* Topic Grid */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {faqCategories.map((cat) => (
                    <div key={cat.label}>
                      <button
                        onClick={() => startConversation(cat.label)}
                        className="w-full flex items-center gap-2 p-3 rounded-xl border bg-background hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm transition-all text-left group"
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform duration-200 shrink-0">
                          {cat.icon}
                        </span>
                        <span className="text-[10px] font-bold text-foreground leading-tight line-clamp-2">
                          {cat.label}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Trust indicators */}
                <div className="flex items-center justify-center gap-6 text-[11px] text-muted-foreground mb-8">
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-emerald-500" /> Secure &
                    Encrypted
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" /> Avg. reply: 2
                    min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Headphones className="h-3.5 w-3.5 text-amber-500" />{" "}
                    Mon–Fri, 9am–6pm
                  </span>
                </div>



                {/* FAQ Section */}
                {faqs.length > 0 && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                      Frequently Asked Questions
                    </h3>
                    <div className="space-y-2">
                      {faqs.map((faq) => (
                        <details
                          key={faq.id}
                          className="bg-muted/20 rounded-xl border border-transparent hover:border-border transition-colors group"
                        >
                          <summary className="p-4 text-sm font-bold text-foreground cursor-pointer outline-none list-none flex justify-between items-center gap-2">
                            <span className="flex-1">{faq.question}</span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 group-open:rotate-180 transition-transform duration-200" />
                          </summary>
                          <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </FadeIn>
        )}

        {/* ═══════ HISTORY VIEW ═══════ */}
        {view === "history" && (
          <FadeIn className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 md:p-8">


                {conversations.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground mb-1">
                      No conversations yet
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Start a new conversation to get help.
                    </p>
                    <Button
                      size="sm"
                      className="font-bold text-xs"
                      onClick={() => setView("landing")}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Start Conversation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <div key={conv.id}>
                        <button
                          onClick={() => openConversation(conv)}
                          className="w-full flex items-center gap-4 p-4 rounded-xl border bg-background hover:bg-muted/30 hover:border-primary/20 hover:shadow-sm transition-all text-left group"
                        >
                          <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                              conv.status === "open"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : conv.status === "pending"
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <MessageCircle className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate mb-0.5">
                              {conv.subject || "General Inquiry"}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground">
                                Started{" "}
                                {new Date(conv.created_at).toLocaleDateString(
                                  [],
                                  { month: "short", day: "numeric" },
                                )}
                              </span>
                              <span className="text-muted-foreground/30">
                                ·
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                Updated {formatDate(conv.updated_at)}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${statusStyles[conv.status] || statusStyles.open}`}
                          >
                            {conv.status}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </FadeIn>
        )}

        {/* ═══════ CHAT VIEW ═══════ */}
        {view === "chat" && (
          <>
            {/* Messages */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col gap-4 relative"
            >
              {/* Conversation start pill */}
              <div className="text-center my-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                  <Shield className="h-3 w-3" />
                  {activeConversation?.subject || "Conversation"} —{" "}
                  {new Date(
                    activeConversation?.created_at || "",
                  ).toLocaleDateString([], {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              {messages.map((msg, index) => {
                const isMe = msg.sender_id === user?.id;
                const showAvatar =
                  !isMe &&
                  (index === 0 || messages[index - 1].sender_id === user?.id);
                const showDateSeparator =
                  index > 0 &&
                  new Date(msg.created_at).toDateString() !==
                    new Date(messages[index - 1].created_at).toDateString();

                return (
                  <div key={msg.id}>
                    {showDateSeparator && (
                      <div className="text-center my-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                          {new Date(msg.created_at).toLocaleDateString([], {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                    <FadeIn
                      className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}
                    >
                      {!isMe && (
                        <div className="w-8 shrink-0 flex items-end">
                          {showAvatar && (
                            <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-1">
                              <Headphones className="h-3.5 w-3.5 text-primary" />
                            </div>
                          )}
                        </div>
                      )}

                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border text-foreground rounded-bl-sm"}`}
                      >
                        {!isMe && showAvatar && (
                          <p className="text-[10px] font-bold text-primary mb-1">
                            Support Team
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1.5 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}
                        >
                          <span className="text-[9px] font-mono font-semibold">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMe &&
                            (msg.read ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3 opacity-70" />
                            ))}
                        </div>
                      </div>
                    </FadeIn>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {adminTyping && (
                <div className="flex justify-start gap-2">
                  <div className="w-8 shrink-0 flex items-end">
                    <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-1">
                      <Headphones className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </div>
                  <div className="bg-card border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5 h-11 w-16">
                    <span
                      className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}

              {/* Conversation ended notice */}
              {!isConversationActive && messages.length > 0 && (
                <div className="text-center my-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    This conversation has been {activeConversation?.status}
                  </span>
                  <div className="mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-bold text-xs h-8 rounded-lg"
                      onClick={() => setView("landing")}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Start New
                      Conversation
                    </Button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollDown && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full shadow-lg bg-background"
                  onClick={scrollToBottom}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Input Area */}
            {isConversationActive ? (
              <div className="p-4 border-t bg-background shrink-0">
                <div className="flex items-end gap-2 bg-muted/30 p-1.5 rounded-2xl border focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm h-11 px-4"
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="h-11 w-11 shrink-0 rounded-xl shadow-sm"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  End-to-end encrypted · Messages are stored securely
                </p>
              </div>
            ) : (
              <div className="p-4 border-t bg-muted/30 shrink-0">
                <p className="text-sm text-muted-foreground text-center font-medium">
                  This conversation is {activeConversation?.status}.{" "}
                  <button
                    onClick={() => setView("landing")}
                    className="text-primary font-bold hover:underline"
                  >
                    Start a new one
                  </button>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
