import { useState, useEffect } from "react";
import { CheckCircle, XCircle, FileText, Search, CreditCard, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminPaymentAnalytics } from "@/components/admin/AdminPaymentAnalytics";
import { SlideUp } from "@/components/public/Motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PaymentSession {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  reference: string;
  status: string;
  account_id: string | null;
  transaction_hash: string | null;
  proof_url: string | null;
  notes: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

interface PaymentAuditLog {
  id: string;
  payment_session_id: string;
  admin_user_id: string | null;
  action: string;
  previous_status: string;
  new_status: string;
  notes: string | null;
  created_at: string;
  payment_sessions?: {
    reference: string;
    amount: number;
  };
}

export default function AdminPaymentsPage() {
  const [sessions, setSessions] = useState<PaymentSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<PaymentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchSessions();
    fetchAuditLogs();
  }, [refreshTrigger]);

  const fetchSessions = async () => {
    setLoading(true);
    // Note: We need to join with auth.users if possible, but since we can't easily join auth.users 
    // from client-side without edge functions or a secure view, we'll fetch just the session data.
    // In a real app, a secure view or RPC would return user details.
    const { data, error } = await supabase
      .from("payment_sessions")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error(error);
    } else {
      setSessions(data as PaymentSession[]);
    }
    setLoading(false);
  };

  const fetchAuditLogs = async () => {
    const { data, error } = await supabase
      .from("payment_audit_logs")
      .select("*, payment_sessions(reference, amount)")
      .order("created_at", { ascending: false })
      .limit(100);
      
    if (!error && data) {
      setAuditLogs(data as PaymentAuditLog[]);
    }
  };

  const handleApprove = async (session: PaymentSession) => {
    try {
      const { data, error } = await (supabase.rpc as any)("admin_approve_deposit", {
        p_admin_id: user?.id,
        p_session_id: session.id
      });
      
      if (error) throw error;

      toast({ title: "Payment Approved", description: "The funds have been credited to the user's account." });
      setRefreshTrigger(prev => prev + 1);
    } catch (e: any) {
      toast({ title: "Approval Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleReject = async (session: PaymentSession) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const { error } = await supabase
        .from("payment_sessions")
        .update({ status: "rejected", notes: reason })
        .eq("id", session.id);
      
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: session.user_id,
        title: "Deposit Rejected",
        message: `Your deposit (Ref: ${session.reference}) was rejected. Reason: ${reason}`,
        type: "warning"
      });

      // Audit Log
      await supabase.from("payment_audit_logs").insert({
        payment_session_id: session.id,
        admin_user_id: user?.id || null,
        action: "rejected",
        previous_status: session.status,
        new_status: "rejected",
        notes: reason
      });

      toast({ title: "Payment Rejected", description: "The user has been notified." });
      setRefreshTrigger(prev => prev + 1);
    } catch (e: any) {
      toast({ title: "Rejection Failed", description: e.message, variant: "destructive" });
    }
  };

  const filteredSessions = sessions.filter((s) => 
    s.reference.toLowerCase().includes(search.toLowerCase()) || 
    s.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans text-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Payment Verification</h1>
          <p className="text-xs text-muted-foreground font-sans">Review payment proofs and approve deposits.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => setRefreshTrigger(p => p + 1)} disabled={loading} className="h-8 w-8 p-0 rounded-lg">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <div className="relative flex-1 sm:w-56 font-sans">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search reference..." 
              className="pl-8 bg-card h-8 text-xs rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <AdminPaymentAnalytics refreshTrigger={refreshTrigger} />

      <Tabs defaultValue="verifications" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="verifications">Pending Verifications</TabsTrigger>
          <TabsTrigger value="audit">Payment Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="verifications" className="m-0">
          <SlideUp className="bg-card border rounded-3xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-10 flex justify-center"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No payment sessions found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reference & Method</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount & Dest</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proof / TxHash</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4">
                          <p className="text-sm font-bold font-mono text-foreground">{session.reference}</p>
                          <p className="text-xs text-muted-foreground capitalize">{session.method.replace(/_/g, ' ')}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(session.created_at).toLocaleString()}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-bold text-success">${session.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          {session.account_id ? (
                            <p className="text-[10px] font-mono text-muted-foreground mt-1">Acc: {session.account_id.split('-')[0]}...</p>
                          ) : (
                            <p className="text-[10px] font-mono text-muted-foreground mt-1">Acc: Default (First Active)</p>
                          )}
                        </td>
                        <td className="p-4">
                          {session.proof_url ? (
                            <a href={session.proof_url} target="_blank" rel="noreferrer" className="flex items-center text-xs font-semibold text-primary hover:underline mb-1 w-max">
                              <FileText className="h-3.5 w-3.5 mr-1" /> View Proof <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic block mb-1">No proof uploaded</span>
                          )}
                          {session.transaction_hash && (
                            <div className="flex items-center gap-1 mt-1 bg-muted/50 w-max px-2 py-0.5 rounded border">
                              <span className="text-[10px] font-mono text-muted-foreground">Tx: {session.transaction_hash.substring(0, 16)}...</span>
                            </div>
                          )}
                          {session.notes && <p className="text-[10px] text-destructive mt-1 max-w-[150px] truncate" title={session.notes}>Note: {session.notes}</p>}
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            session.status === 'approved' ? 'bg-success/10 text-success' :
                            session.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                            session.status === 'under_review' ? 'bg-primary/10 text-primary' :
                            'bg-warning/10 text-warning'
                          }`}>
                            {session.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {session.status === 'under_review' && (
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" className="text-success border-success/20 hover:bg-success/10 h-8" onClick={() => handleApprove(session)}>
                                <CheckCircle className="h-4 w-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10 h-8" onClick={() => handleReject(session)}>
                                <XCircle className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SlideUp>
        </TabsContent>

        <TabsContent value="audit" className="m-0">
          <SlideUp className="bg-card border rounded-3xl shadow-sm overflow-hidden">
            {auditLogs.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No payment audit logs found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timestamp</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin ID</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Ref</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4 whitespace-nowrap text-xs text-muted-foreground font-semibold">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-xs font-bold text-foreground bg-muted/50 px-2 py-1 rounded">
                            {log.admin_user_id ? log.admin_user_id.split('-')[0] + '...' : 'System'}
                          </span>
                        </td>
                        <td className="p-4">
                          {log.payment_sessions ? (
                            <div>
                              <p className="text-sm font-bold font-mono">{log.payment_sessions.reference}</p>
                              <p className="text-xs text-success font-semibold">${log.payment_sessions.amount.toLocaleString()}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Session Deleted</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            log.action === 'approved' ? 'bg-success/10 text-success' :
                            log.action === 'rejected' ? 'bg-destructive/10 text-destructive' :
                            'bg-primary/10 text-primary'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4">
                          {log.notes ? (
                            <span className="text-xs text-muted-foreground">{log.notes}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground opacity-50">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SlideUp>
        </TabsContent>
      </Tabs>
    </div>
  );
}
