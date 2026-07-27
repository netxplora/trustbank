import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle, XCircle, Eye, Clock, FileText, Search, Loader2, RefreshCw, MessageSquare, Download, ZoomIn, ZoomOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StaggerContainer, StaggerItem, SlideUp } from "@/components/public/Motion";
import { supabase } from "@/integrations/supabase/client";

interface KYCRequest {
  id: string;
  user_id: string;
  name: string;
  email: string;
  address: string;
  kyc_tier: number;
  status: string;
  requestedTier: number | null;
  submittedDate: string;
  documents: { name: string; type: string; path: string; reviewed_at?: string; review_notes?: string }[];
}

const AdminKYCPage = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<KYCRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [selectedKYC, setSelectedKYC] = useState<KYCRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; type: string; name: string } | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [zoom, setZoom] = useState(1);

  const fetchKYC = async () => {
    try {
      const { data: profiles, error: profError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .neq('kyc_status', 'not_started');
        
      if (profError) throw profError;

      const userIds = profiles.map(p => p.user_id);
      let docsMap = new Map();
      if (userIds.length > 0) {
        const { data: docs, error: docsError } = await (supabase as any)
          .from('kyc_documents')
          .select('*')
          .in('user_id', userIds);
        
        if (docsError) throw docsError;
        
        docs.forEach(d => {
          if (!docsMap.has(d.user_id)) docsMap.set(d.user_id, []);
          docsMap.get(d.user_id).push({
            name: `${d.document_type.replace(/_/g, ' ').toUpperCase()}`,
            type: d.document_type,
            path: d.file_url, // private storage path only
            reviewed_at: d.reviewed_at,
            review_notes: d.review_notes,
          });
        });
      }

      const formatted: KYCRequest[] = profiles.map(p => {
        let requestedTier = null;
        if (p.kyc_status === 'pending_tier_2') requestedTier = 2;
        if (p.kyc_status === 'pending_tier_3') requestedTier = 3;

        let displayStatus = "Pending";
        if (p.kyc_status?.startsWith('approved')) displayStatus = "Approved";
        if (p.kyc_status?.startsWith('rejected')) displayStatus = "Rejected";

        return {
          id: p.id.split('-')[0],
          user_id: p.user_id,
          name: p.display_name || p.first_name || 'Unknown',
          email: p.email || 'No email',
          address: p.mailing_address || p.address || 'Not provided',
          kyc_tier: p.kyc_tier || 0,
          status: p.kyc_status || 'not_started',
          requestedTier,
          submittedDate: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          documents: docsMap.get(p.user_id) || []
        };
      });

      setRequests(formatted);
    } catch (err: any) {
      toast({ title: "Error fetching KYC", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKYC(); }, []);

  const filtered = requests.filter(r => {
    const displayStatus = r.status.startsWith('pending') ? 'Pending' : r.status.startsWith('approved') ? 'Approved' : 'Rejected';
    return (filter === "All" || displayStatus === filter) &&
      (r.name.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()));
  });

  /** Generate a short-lived signed URL and open the document in a preview panel */
  const viewDocument = async (doc: { path: string; type: string; name: string }) => {
    setDocLoading(true);
    setZoom(1);
    try {
      const { data, error } = await supabase.storage
        .from('kyc_documents')
        .createSignedUrl(doc.path, 120); // 2-minute expiry

      if (error || !data?.signedUrl) throw error || new Error("Could not generate a secure document link.");

      setViewingDoc({ url: data.signedUrl, type: doc.type, name: doc.name });
    } catch (err: any) {
      toast({ title: "Document access error", description: err.message, variant: "destructive" });
    } finally {
      setDocLoading(false);
    }
  };

  /** Download with a fresh signed URL (60s expiry) */
  const downloadDocument = async (path: string, name: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('kyc_documents')
        .createSignedUrl(path, 60);

      if (error || !data?.signedUrl) throw error || new Error("Could not generate download link.");

      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = name;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    } catch (err: any) {
      toast({ title: "Download error", description: err.message, variant: "destructive" });
    }
  };

  const handleAction = async (
    id: string,
    user_id: string,
    request: KYCRequest,
    action: "Approved" | "Rejected" | "RequestReplacement"
  ) => {
    setActionLoading(true);
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      let newTier = request.kyc_tier;
      let newStatus = request.status;

      if (action === "Approved" && request.requestedTier) {
        newTier = request.requestedTier;
        newStatus = `approved_tier_${newTier}`;
      } else if (action === "Rejected") {
        newStatus = `rejected_tier_${request.requestedTier || request.kyc_tier + 1}`;
      } else if (action === "RequestReplacement") {
        newStatus = `rejected_tier_${request.requestedTier || request.kyc_tier + 1}`;
      }

      const { error } = await (supabase as any).from('profiles').update({ 
        kyc_tier: newTier,
        kyc_status: newStatus 
      }).eq('user_id', user_id);
      
      if (error) throw error;

      // Record review metadata on each document for this user
      if (request.documents.length > 0) {
        const docUpdatePromises = request.documents.map((doc: any) =>
          (supabase as any).from('kyc_documents').update({
            status: action === "Approved" ? "approved" : "rejected",
            review_notes: reviewNotes || null,
            reviewed_by: adminUser?.id || null,
            reviewed_at: new Date().toISOString(),
          }).eq('user_id', user_id).eq('document_type', doc.type)
        );
        await Promise.all(docUpdatePromises);
      }

      const notifMessage = action === "Approved"
        ? `Your identity verification for Tier ${newTier} has been approved.`
        : action === "RequestReplacement"
        ? `Additional verification documents are required. Please resubmit your government-issued identification. ${reviewNotes ? `Note from reviewer: ${reviewNotes}` : ''}`
        : `Your identity verification was not successful. Please contact support. ${reviewNotes ? `Reason: ${reviewNotes}` : ''}`;

      await (supabase as any).from('notifications').insert({
        user_id,
        title: action === "Approved" ? `Tier ${newTier} KYC Approved` : action === "RequestReplacement" ? "Document Replacement Required" : "KYC Verification Unsuccessful",
        message: notifMessage,
        type: action === "Approved" ? "success" : "error"
      });

      toast({ title: action === "Approved" ? "KYC Approved" : action === "RequestReplacement" ? "Replacement Requested" : "KYC Rejected", description: `Processed for ${request.name}.` });
      setSelectedKYC(null);
      setReviewNotes("");
      setViewingDoc(null);
      fetchKYC();
    } catch (err: any) {
      toast({ title: "Error processing action", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = requests.filter(r => r.status.startsWith("pending")).length;
  const approvedCount = requests.filter(r => r.status.startsWith("approved")).length;
  const rejectedCount = requests.filter(r => r.status.startsWith("rejected")).length;

  const isPdf = (path: string) => path?.toLowerCase().includes('.pdf');

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <div>
        <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Identity Verification</h1>
        <p className="text-xs text-muted-foreground font-sans">Review, verify, and manage customer identity documents</p>
      </div>

      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-sans">
        {[
          { label: "Total Applications", value: requests.length, color: "text-foreground" },
          { label: "Pending Review", value: pendingCount, color: "text-warning" },
          { label: "Approved", value: approvedCount, color: "text-success" },
          { label: "Rejected", value: rejectedCount, color: "text-destructive" },
        ].map(s => (
          <StaggerItem key={s.label}>
            <div className="bg-card rounded-xl border border-border/60 p-3 shadow-sm h-full">
              <p className="text-[10px] font-semibold text-muted-foreground">{s.label}</p>
              <p className={`text-base font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="flex flex-col sm:flex-row gap-2 font-sans">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs rounded-lg" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {(["All", "Pending", "Approved", "Rejected"] as const).map(f => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="font-bold text-xs h-8 rounded-lg">{f}</Button>
          ))}
        </div>
      </div>

      <SlideUp className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/10">
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground">Customer</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground hidden md:table-cell">Current Tier</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground hidden lg:table-cell">Docs</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground hidden lg:table-cell">Submitted</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-semibold font-poppins text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-sm font-semibold text-muted-foreground"><Loader2 className="animate-spin h-5 w-5 mx-auto mb-2" />Loading records...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-sm font-semibold text-muted-foreground">No KYC requests found.</td></tr>
              ) : filtered.map((r) => {
                const isPending = r.status.startsWith('pending');
                const isApproved = r.status.startsWith('approved');
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors align-middle">
                    <td className="px-3 py-3">
                      <p className="text-xs font-bold text-foreground">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground">{r.email}</p>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell font-mono">Tier {r.kyc_tier}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${
                        isApproved ? "bg-success/10 text-success border-success/20" :
                        isPending ? "bg-warning/10 text-warning border-warning/20" : "bg-destructive/10 text-destructive border-destructive/20"
                      }`}>
                        {isPending ? `Pending T${r.requestedTier}` : r.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground hidden lg:table-cell">{r.documents.length} doc{r.documents.length !== 1 ? 's' : ''}</td>
                    <td className="px-3 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">{r.submittedDate}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" title="Review" onClick={() => { setSelectedKYC(r); setReviewNotes(""); setViewingDoc(null); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isPending && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-success/10" title="Approve" onClick={() => handleAction(r.id, r.user_id, r, "Approved")}>
                              <CheckCircle className="h-4 w-4 text-success" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" title="Reject" onClick={() => handleAction(r.id, r.user_id, r, "Rejected")}>
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SlideUp>

      {/* KYC Review Dialog */}
      <Dialog open={!!selectedKYC} onOpenChange={() => { setSelectedKYC(null); setViewingDoc(null); setReviewNotes(""); }}>
        <DialogContent className="max-w-2xl font-sans max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-poppins">KYC Review — {selectedKYC?.name}</DialogTitle>
            <DialogDescription className="font-mono text-xs mt-1">User ID: {selectedKYC?.user_id}</DialogDescription>
          </DialogHeader>
          {selectedKYC && (
            <div className="space-y-4 mt-1">
              {/* Profile Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/30 border rounded-lg p-2.5">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">Current Tier</p>
                  <p className="font-bold font-mono">Tier {selectedKYC.kyc_tier}</p>
                </div>
                <div className="bg-muted/30 border rounded-lg p-2.5">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">Requested Tier</p>
                  <p className="font-bold font-mono">{selectedKYC.requestedTier ? `Tier ${selectedKYC.requestedTier}` : 'N/A'}</p>
                </div>
                <div className="bg-muted/30 border rounded-lg p-2.5 col-span-2">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">Registered Address</p>
                  <p className="font-semibold">{selectedKYC.address}</p>
                </div>
                <div className="bg-muted/30 border rounded-lg p-2.5">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">Email</p>
                  <p className="font-semibold truncate">{selectedKYC.email}</p>
                </div>
                <div className="bg-muted/30 border rounded-lg p-2.5">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">Submission Date</p>
                  <p className="font-semibold">{selectedKYC.submittedDate}</p>
                </div>
              </div>

              {/* Document List */}
              <div>
                <h4 className="text-xs font-bold font-poppins text-foreground mb-2">Submitted Documents</h4>
                <div className="space-y-2">
                  {selectedKYC.documents.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No documents uploaded.</p>
                  ) : (
                    selectedKYC.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-background border rounded-lg gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="bg-primary/10 p-1.5 rounded shrink-0"><FileText className="h-4 w-4 text-primary" /></div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{doc.type.replace(/_/g, ' ')}</p>
                            {doc.reviewed_at && <p className="text-[10px] text-muted-foreground">Reviewed: {new Date(doc.reviewed_at).toLocaleDateString()}</p>}
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold gap-1" disabled={docLoading}
                            onClick={() => viewDocument({ path: doc.path, type: doc.type, name: doc.name })}>
                            {docLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />} View
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold gap-1"
                            onClick={() => downloadDocument(doc.path, doc.name)}>
                            <Download className="h-3 w-3" /> Save
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Inline Document Preview */}
              {viewingDoc && (
                <div className="border rounded-lg overflow-hidden bg-muted/20">
                  <div className="flex items-center justify-between px-3 py-2 border-b bg-card text-xs">
                    <span className="font-bold truncate">{viewingDoc.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {!isPdf(viewingDoc.url) && (
                        <>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoom(z => Math.min(z + 0.25, 3))}><ZoomIn className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}><ZoomOut className="h-3.5 w-3.5" /></Button>
                          <span className="text-[10px] text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setViewingDoc(null)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <div className="p-2 overflow-auto max-h-80 flex justify-center">
                    {isPdf(viewingDoc.url) ? (
                      <iframe src={viewingDoc.url} className="w-full h-72 border-0 rounded" title={viewingDoc.name} />
                    ) : (
                      <img
                        src={viewingDoc.url}
                        alt={viewingDoc.name}
                        className="rounded object-contain transition-transform duration-200"
                        style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', maxWidth: '100%' }}
                      />
                    )}
                  </div>
                  <p className="text-[9px] text-muted-foreground text-center pb-2">Secure view — link expires in 2 minutes. Do not share this URL.</p>
                </div>
              )}

              {/* Review Notes */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3" /> Internal Review Notes
                </label>
                <textarea
                  className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary min-h-[70px]"
                  placeholder="Add notes about this verification (reason for rejection, document quality, etc.)..."
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              {selectedKYC.status.startsWith("pending") && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/50">
                  <Button className="flex-1 font-bold text-xs h-9 bg-success hover:bg-success/90 text-white" disabled={actionLoading}
                    onClick={() => handleAction(selectedKYC.id, selectedKYC.user_id, selectedKYC, "Approved")}>
                    {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                    Approve Tier {selectedKYC.requestedTier}
                  </Button>
                  <Button variant="outline" className="flex-1 font-bold text-xs h-9 text-warning border-warning/40 hover:bg-warning/10" disabled={actionLoading}
                    onClick={() => handleAction(selectedKYC.id, selectedKYC.user_id, selectedKYC, "RequestReplacement")}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Request New Document
                  </Button>
                  <Button variant="outline" className="flex-1 font-bold text-xs h-9 text-destructive border-destructive/40 hover:bg-destructive/10" disabled={actionLoading}
                    onClick={() => handleAction(selectedKYC.id, selectedKYC.user_id, selectedKYC, "Rejected")}>
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                </div>
              )}
              {!selectedKYC.status.startsWith("pending") && (
                <div className={`rounded-lg border p-2.5 text-xs font-semibold text-center ${
                  selectedKYC.status.startsWith('approved') ? 'bg-success/10 border-success/20 text-success' : 'bg-destructive/10 border-destructive/20 text-destructive'
                }`}>
                  {selectedKYC.status.startsWith('approved') ? '✓ This application has been approved.' : '✗ This application has been rejected.'}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKYCPage;
