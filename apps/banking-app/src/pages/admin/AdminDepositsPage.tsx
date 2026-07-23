import { useState, useEffect, useMemo } from "react";
import {
  Search, RefreshCw, ExternalLink, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, MessageSquare, Eye, Bitcoin, CreditCard,
  ArrowDownCircle, Filter
} from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { Label } from "@trustbank/shared-ui/components/ui/label";
import { Textarea } from "@trustbank/shared-ui/components/ui/textarea";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@trustbank/shared-ui/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@trustbank/shared-ui/components/ui/tabs";
import { SlideUp, FadeIn } from "@trustbank/shared-ui/components/Motion";

// ─── Interfaces ───────────────────────────────────────────────────
interface UnifiedDeposit {
  id: string;
  user_id: string;
  customer_name: string | null;
  customer_email: string | null;
  amount: number | null;
  currency: string | null;
  method: string | null;
  reference: string | null;
  network: string | null;
  status: string;
  proof_url: string | null;
  created_at: string;
  deposit_type: "fiat" | "crypto";
  wallet_id: string | null;
  account_id: string | null;
}

const PAGE_SIZE = 20;

// ─── Component ────────────────────────────────────────────────────
export default function AdminDepositsPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [deposits, setDeposits] = useState<UnifiedDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(0);

  // Detail / action modals
  const [selected, setSelected] = useState<UnifiedDeposit | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [confirmAmount, setConfirmAmount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  // ── Fetch ───────────────────────────────────────────────────────
  useEffect(() => { fetchDeposits(); }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      // Fetch fiat deposits
      const { data: fiatData, error: fiatErr } = await supabase
        .from("payment_sessions")
        .select("id, user_id, amount, method, reference, status, proof_url, created_at, account_id, transaction_hash")
        .order("created_at", { ascending: false });

      // Fetch crypto deposits
      const { data: cryptoData, error: cryptoErr } = await supabase
        .from("crypto_deposits")
        .select("id, user_id, amount, tx_hash, proof_url, status, created_at, wallet_id, crypto_wallets(cryptocurrency, network)")
        .order("created_at", { ascending: false });

      // Fetch profiles for customer info
      const { data: profilesData } = await supabase.from("profiles").select("id, display_name, email");

      if (fiatErr) console.error("Error fetching fiat deposits:", fiatErr);
      if (cryptoErr) console.error("Error fetching crypto deposits:", cryptoErr);

      const profileMap = new Map<string, { display_name: string | null; email: string | null }>();
      profilesData?.forEach((p: any) => profileMap.set(p.id, { display_name: p.display_name, email: p.email }));

      const unified: UnifiedDeposit[] = [];

      // Map fiat deposits
      fiatData?.forEach((f: any) => {
        const profile = profileMap.get(f.user_id);
        unified.push({
          id: f.id,
          user_id: f.user_id,
          customer_name: profile?.display_name || null,
          customer_email: profile?.email || null,
          amount: f.amount,
          currency: "USD",
          method: f.method || "bank_transfer",
          reference: f.reference,
          network: null,
          status: f.status,
          proof_url: f.proof_url,
          created_at: f.created_at,
          deposit_type: "fiat",
          wallet_id: null,
          account_id: f.account_id
        });
      });

      // Map crypto deposits
      cryptoData?.forEach((c: any) => {
        const profile = profileMap.get(c.user_id);
        unified.push({
          id: c.id,
          user_id: c.user_id,
          customer_name: profile?.display_name || null,
          customer_email: profile?.email || null,
          amount: c.amount,
          currency: c.crypto_wallets?.cryptocurrency || null,
          method: "crypto_transfer",
          reference: c.tx_hash,
          network: c.crypto_wallets?.network || null,
          status: c.status,
          proof_url: c.proof_url,
          created_at: c.created_at,
          deposit_type: "crypto",
          wallet_id: c.wallet_id,
          account_id: null
        });
      });

      // Sort by created_at descending
      unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setDeposits(unified);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // ── Filtering & Pagination ──────────────────────────────────────
  const filtered = useMemo(() => {
    let list = deposits;
    if (statusFilter !== "all") list = list.filter(d => d.status === statusFilter);
    if (typeFilter !== "all") list = list.filter(d => d.deposit_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        (d.customer_name || "").toLowerCase().includes(q) ||
        (d.customer_email || "").toLowerCase().includes(q) ||
        (d.currency || "").toLowerCase().includes(q) ||
        (d.reference || "").toLowerCase().includes(q) ||
        d.status.toLowerCase().includes(q)
      );
    }
    return list;
  }, [deposits, statusFilter, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── Status counts ───────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { all: deposits.length, pending: 0, under_review: 0, confirmed: 0, rejected: 0, pending_payment: 0 };
    deposits.forEach(d => { if (d.status in c) (c as any)[d.status]++; });
    return c;
  }, [deposits]);

  // ── Actions ─────────────────────────────────────────────────────
  const handleApprove = async (deposit: UnifiedDeposit) => {
    if (!confirmAmount || isNaN(Number(confirmAmount)) || Number(confirmAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Enter a valid amount to credit.", variant: "destructive" });
      return;
    }
    try {
      if (deposit.deposit_type === "fiat") {
        const { error } = await (supabase.rpc as any)("admin_approve_deposit", {
          p_admin_id: user?.id,
          p_session_id: deposit.id
        });
        if (error) throw error;
      } else {
        const { error } = await (supabase.rpc as any)("admin_approve_crypto_deposit", {
          p_admin_id: user?.id,
          p_deposit_id: deposit.id,
          p_amount: Number(confirmAmount)
        });
        if (error) {
          if (error.message?.includes("does not exist") || error.code === "PGRST202") {
            throw new Error("The admin_approve_crypto_deposit RPC function is missing. Please run the crypto approval migration in your Supabase SQL Editor.");
          }
          throw error;
        }
      }
      toast({ title: "Deposit Approved", description: "Funds have been credited to the user's account." });
      setShowDetails(false);
      setSelected(null);
      setConfirmAmount("");
      fetchDeposits();
    } catch (e: any) {
      toast({ title: "Approval Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    try {
      if (selected.deposit_type === "fiat") {
        const { error } = await supabase.from("payment_sessions").update({
          status: "rejected", notes: rejectReason || null, updated_at: new Date().toISOString()
        }).eq("id", selected.id);
        if (error) throw error;

        await supabase.from("payment_audit_logs").insert({
          payment_session_id: selected.id,
          admin_user_id: user?.id,
          action: "admin_rejected_fiat_deposit",
          previous_status: selected.status,
          new_status: "rejected",
          notes: rejectReason || null
        });
      } else {
        const { error } = await supabase.from("crypto_deposits").update({
          status: "rejected", reviewed_by: user?.id, admin_notes: rejectReason || null
        }).eq("id", selected.id);
        if (error) throw error;

        await supabase.from("audit_logs").insert({
          user_id: user?.id,
          action: "admin_rejected_crypto_deposit",
          entity_type: "crypto_deposits",
          entity_id: selected.id,
          details: { amount: selected.amount, cryptocurrency: selected.currency, reason: rejectReason }
        });
      }

      // Send notification
      await supabase.from("notifications").insert({
        user_id: selected.user_id,
        title: "Deposit Rejected",
        message: `Your ${selected.deposit_type === "crypto" ? (selected.currency || "crypto") : "fiat"} deposit has been rejected.${rejectReason ? ` Reason: ${rejectReason}` : ""}`,
        type: "warning"
      });

      toast({ title: "Deposit Rejected" });
      setShowRejectDialog(false);
      setSelected(null);
      setRejectReason("");
      fetchDeposits();
    } catch (e: any) {
      toast({ title: "Rejection Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleRequestInfo = async () => {
    if (!selected || !infoMessage.trim()) return;
    try {
      if (selected.deposit_type === "fiat") {
        const { error } = await supabase.from("payment_sessions").update({
          status: "info_requested", notes: infoMessage
        }).eq("id", selected.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("crypto_deposits").update({
          status: "info_requested", admin_notes: infoMessage, reviewed_by: user?.id
        }).eq("id", selected.id);
        if (error) throw error;
      }

      await supabase.from("notifications").insert({
        user_id: selected.user_id,
        title: "Additional Information Required",
        message: `Your ${selected.deposit_type === "crypto" ? (selected.currency || "crypto") : "fiat"} deposit requires additional information: ${infoMessage}`,
        type: "info"
      });

      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        action: `admin_requested_info_${selected.deposit_type}_deposit`,
        entity_type: selected.deposit_type === "fiat" ? "payment_sessions" : "crypto_deposits",
        entity_id: selected.id,
        details: { message: infoMessage }
      });

      toast({ title: "Information Request Sent" });
      setShowInfoDialog(false);
      setSelected(null);
      setInfoMessage("");
      fetchDeposits();
    } catch (e: any) {
      toast({ title: "Request Failed", description: e.message, variant: "destructive" });
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────
  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      pending_payment: "bg-amber-50 text-amber-700 border-amber-200",
      under_review: "bg-blue-50 text-blue-700 border-blue-200",
      confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
      info_requested: "bg-violet-50 text-violet-700 border-violet-200",
    };
    return map[status] || "bg-muted/50 text-muted-foreground border-border";
  };

  const typeIcon = (type: string) => type === "crypto" 
    ? <Bitcoin className="h-4 w-4 text-amber-500" /> 
    : <CreditCard className="h-4 w-4 text-blue-500" />;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  // ─── RENDER ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">Deposits Management</h1>
        <p className="text-sm text-muted-foreground font-sans">Review and manage all incoming fiat and digital currency deposits across the platform.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "All Deposits", count: counts.all, color: "bg-muted/30 border-border" },
          { label: "Pending Review", count: counts.pending + counts.under_review + counts.pending_payment, color: "bg-amber-50 border-amber-200" },
          { label: "Approved", count: counts.confirmed, color: "bg-emerald-50 border-emerald-200" },
          { label: "Rejected", count: counts.rejected, color: "bg-red-50 border-red-200" },
        ].map(card => (
          <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
            <p className="text-xs font-semibold text-muted-foreground font-poppins">{card.label}</p>
            <p className="text-2xl font-bold font-poppins text-foreground mt-1">{card.count}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => { fetchDeposits(); toast({ title: "Refreshed" }); }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, email, hash..." className="pl-9 bg-card text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-md border border-input bg-card px-3 text-xs font-semibold text-foreground"
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
          >
            <option value="all">All Types</option>
            <option value="fiat">Fiat Only</option>
            <option value="crypto">Digital Only</option>
          </select>
          <select
            className="h-10 rounded-md border border-input bg-card px-3 text-xs font-semibold text-foreground"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="under_review">Under Review</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="info_requested">Info Requested</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <SlideUp className="bg-card rounded-xl border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full font-sans">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Type</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Customer</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Amount</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Reference / Hash</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Status</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="text-center p-4 text-xs font-semibold font-poppins text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Loading deposits...
                  </div>
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">
                  <ArrowDownCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="font-semibold">No deposits found.</p>
                </td></tr>
              ) : paged.map(d => (
                <tr key={`${d.deposit_type}-${d.id}`} className="hover:bg-muted/10 transition-colors align-middle">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {typeIcon(d.deposit_type)}
                      <div>
                        <span className="text-sm font-bold text-foreground uppercase block">{d.currency || "USD"}</span>
                        {d.network && <span className="text-[10px] text-muted-foreground font-semibold">{d.network}</span>}
                        {!d.network && d.deposit_type === "fiat" && <span className="text-[10px] text-muted-foreground font-semibold">Bank Transfer</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-foreground">{d.customer_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{d.customer_email || "No email"}</p>
                  </td>
                  <td className="p-4 text-sm font-semibold font-mono text-foreground">
                    {d.amount ? `$${Number(d.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                  </td>
                  <td className="p-4">
                    {d.reference && (
                      <code className="text-[10px] font-mono bg-muted/50 px-1.5 py-0.5 rounded border break-all block max-w-[140px] truncate" title={d.reference}>
                        {d.reference}
                      </code>
                    )}
                    {d.proof_url && d.proof_url !== "pending_upload" && (
                      <a href={d.proof_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1 mt-1">
                        View Proof <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {!d.reference && (!d.proof_url || d.proof_url === "pending_upload") && (
                      <span className="text-[10px] text-muted-foreground italic">None</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${statusBadge(d.status)}`}>
                      {d.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground font-mono">
                    {formatDate(d.created_at)}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="View Details"
                        onClick={() => { setSelected(d); setConfirmAmount(d.amount?.toString() || ""); setShowDetails(true); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(d.status === "pending" || d.status === "under_review" || d.status === "pending_payment") && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            title="Reject"
                            onClick={() => { setSelected(d); setShowRejectDialog(true); }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Request Info"
                            onClick={() => { setSelected(d); setShowInfoDialog(true); }}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 bg-muted/10">
            <span className="text-xs text-muted-foreground font-semibold">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-bold px-2">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SlideUp>

      {/* ═══ DEPOSIT DETAILS MODAL ═══ */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-poppins">
              {selected && typeIcon(selected.deposit_type)}
              Deposit Details
            </DialogTitle>
            <DialogDescription>
              Review the deposit information and take action.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Customer</p>
                  <p className="font-bold">{selected.customer_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{selected.customer_email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Type</p>
                  <p className="font-bold capitalize">{selected.deposit_type} — {selected.currency || "USD"}</p>
                  {selected.network && <p className="text-xs text-muted-foreground">{selected.network} network</p>}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Amount</p>
                  <p className="font-bold text-lg">{selected.amount ? `$${Number(selected.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "Not specified"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Status</p>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border inline-block mt-0.5 ${statusBadge(selected.status)}`}>
                    {selected.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Reference / Tx Hash</p>
                  {selected.reference ? (
                    <code className="text-xs font-mono bg-muted/50 px-2 py-1 rounded border break-all block mt-1">{selected.reference}</code>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mt-1">None provided</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Date</p>
                  <p className="font-semibold text-sm">{formatDate(selected.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Proof</p>
                  {selected.proof_url && selected.proof_url !== "pending_upload" ? (
                    <a href={selected.proof_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline font-bold flex items-center gap-1 mt-1">
                      View Uploaded Proof <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mt-1">No proof uploaded</p>
                  )}
                </div>
              </div>

              {/* Approve section */}
              {(selected.status === "pending" || selected.status === "under_review" || selected.status === "pending_payment") && (
                <div className="border-t pt-4 space-y-3">
                  <div>
                    <Label className="text-sm font-semibold">Amount to Credit (USD)</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount..."
                      value={confirmAmount}
                      onChange={e => setConfirmAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleApprove(selected)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" /> Approve & Credit
                    </Button>
                    <Button
                      variant="outline"
                      className="font-bold text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => { setShowDetails(false); setShowRejectDialog(true); }}
                    >
                      <XCircle className="h-4 w-4 mr-1.5" /> Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-blue-500 hover:bg-blue-50"
                      title="Request More Info"
                      onClick={() => { setShowDetails(false); setShowInfoDialog(true); }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ REJECT MODAL ═══ */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2 font-poppins">
              <XCircle className="h-5 w-5" /> Reject Deposit
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this deposit. The customer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-sm font-semibold">Reason for Rejection</Label>
              <Textarea
                placeholder="e.g. Proof of deposit does not match the amount..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="mt-1 h-24"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold" onClick={handleReject}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ REQUEST INFO MODAL ═══ */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="text-blue-600 flex items-center gap-2 font-poppins">
              <MessageSquare className="h-5 w-5" /> Request Additional Information
            </DialogTitle>
            <DialogDescription>
              Send a message to the customer requesting more details about their deposit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-sm font-semibold">Message to Customer</Label>
              <Textarea
                placeholder="e.g. Please provide a clearer screenshot of the transfer receipt..."
                value={infoMessage}
                onChange={e => setInfoMessage(e.target.value)}
                className="mt-1 h-24"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowInfoDialog(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={handleRequestInfo} disabled={!infoMessage.trim()}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
