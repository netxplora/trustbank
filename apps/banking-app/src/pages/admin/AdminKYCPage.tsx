import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle, XCircle, Eye, Clock, FileText, Search, Loader2 } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@trustbank/shared-ui/components/ui/dialog";
import { StaggerContainer, StaggerItem, SlideUp } from "@trustbank/shared-ui/components/Motion";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";

interface KYCRequest {
  id: string;
  user_id: string;
  name: string;
  email: string;
  address: string;
  kyc_tier: number;
  status: string; // e.g., 'pending_tier_2', 'pending_tier_3', 'approved_tier_1'
  requestedTier: number | null;
  submittedDate: string;
  documents: { name: string; type: string; url?: string }[];
}

const AdminKYCPage = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<KYCRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [selectedKYC, setSelectedKYC] = useState<KYCRequest | null>(null);

  const fetchKYC = async () => {
    try {
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .neq('kyc_status', 'not_started');
        
      if (profError) throw profError;

      const userIds = profiles.map(p => p.user_id);
      let docsMap = new Map();
      if (userIds.length > 0) {
        const { data: docs, error: docsError } = await supabase
          .from('kyc_documents')
          .select('*')
          .in('user_id', userIds);
        
        if (docsError) throw docsError;
        
        docs.forEach(d => {
          if (!docsMap.has(d.user_id)) docsMap.set(d.user_id, []);
          docsMap.get(d.user_id).push({
            name: `${d.document_type.toUpperCase()} - ${d.document_number || 'No ID Number'}`,
            type: d.document_type,
            url: d.file_url
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

  useEffect(() => {
    fetchKYC();
  }, []);

  const filtered = requests.filter(r => {
    const displayStatus = r.status.startsWith('pending') ? 'Pending' : r.status.startsWith('approved') ? 'Approved' : 'Rejected';
    return (filter === "All" || displayStatus === filter) &&
      (r.name.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()));
  });

  const handleAction = async (id: string, user_id: string, request: KYCRequest, action: "Approved" | "Rejected") => {
    try {
      let newTier = request.kyc_tier;
      let newStatus = request.status;

      if (action === "Approved" && request.requestedTier) {
        newTier = request.requestedTier;
        newStatus = `approved_tier_${newTier}`;
      } else if (action === "Rejected") {
        newStatus = `rejected_tier_${request.requestedTier || request.kyc_tier + 1}`;
      }

      const { error } = await supabase.from('profiles').update({ 
        kyc_tier: newTier,
        kyc_status: newStatus 
      }).eq('user_id', user_id);
      
      if (error) throw error;
      
      await supabase.from('notifications').insert({
        user_id,
        title: action === "Approved" ? `Tier ${newTier} KYC Approved` : "KYC Rejected",
        message: action === "Approved" ? `Your identity verification for Tier ${newTier} has been successful.` : "Your identity verification was rejected. Please contact support.",
        type: action === "Approved" ? "success" : "error"
      });

      toast({ title: `KYC ${action}`, description: `Tier request for ${id} has been ${action.toLowerCase()}.` });
      setSelectedKYC(null);
      fetchKYC();
    } catch (err: any) {
      toast({ title: "Error updating status", description: err.message, variant: "destructive" });
    }
  };

  const pendingCount = requests.filter(r => r.status.startsWith("pending")).length;
  const approvedCount = requests.filter(r => r.status.startsWith("approved")).length;
  const rejectedCount = requests.filter(r => r.status.startsWith("rejected")).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">Tiered KYC Administration</h1>
        <p className="text-sm text-muted-foreground font-sans">Review and verify progressive customer identity requests</p>
      </div>

      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans">
        {[
          { label: "Total Applications", value: requests.length, icon: ShieldCheck },
          { label: "Pending Upgrades", value: pendingCount, color: "text-warning" },
          { label: "Approved Profiles", value: approvedCount, color: "text-success" },
          { label: "Rejected Upgrades", value: rejectedCount, color: "text-destructive" },
        ].map(s => (
          <StaggerItem key={s.label}>
            <div className="bg-card rounded-xl border p-4 shadow-sm hover-lift h-full">
              <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color || "text-foreground"}`}>{s.value}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="flex flex-col sm:flex-row gap-3 font-sans">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search applicants by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {(["All", "Pending", "Approved", "Rejected"] as const).map(f => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="font-bold">{f}</Button>
          ))}
        </div>
      </div>

      <SlideUp className="bg-card rounded-xl border overflow-hidden shadow-sm hover-lift">
        <div className="overflow-x-auto">
          <table className="w-full font-sans">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Customer Profile</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground hidden md:table-cell">Current Tier</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Verification Status</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground hidden lg:table-cell">Submission Date</th>
                <th className="text-center p-4 text-xs font-semibold font-poppins text-muted-foreground">Audit Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-sm font-semibold text-muted-foreground"><Loader2 className="animate-spin h-5 w-5 mx-auto mb-2" /> Loading KYC records...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-sm font-semibold text-muted-foreground">No KYC requests found.</td></tr>
              ) : filtered.map((r) => {
                const isPending = r.status.startsWith('pending');
                const isApproved = r.status.startsWith('approved');
                
                return (
                  <tr key={r.id} className="border-b last:border-primary hover:bg-muted/10 transition-colors align-middle">
                    <td className="p-4">
                      <p className="text-sm font-bold text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </td>
                    <td className="p-4 text-sm font-semibold text-muted-foreground hidden md:table-cell font-mono">Tier {r.kyc_tier}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${
                        isApproved ? "bg-success/10 text-success border-emerald-100" :
                        isPending ? "bg-warning/10 text-warning border-amber-100" : "bg-destructive/10 text-destructive border-red-100"
                      }`}>
                        {isPending ? `Pending Tier ${r.requestedTier}` : r.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-semibold text-muted-foreground hidden lg:table-cell">{r.submittedDate}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 transition-colors" onClick={() => setSelectedKYC(r)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isPending && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-success/10 transition-colors" onClick={() => handleAction(r.id, r.user_id, r, "Approved")}>
                              <CheckCircle className="h-4 w-4 text-success" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 transition-colors" onClick={() => handleAction(r.id, r.user_id, r, "Rejected")}>
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

      {/* KYC Detail Dialog */}
      <Dialog open={!!selectedKYC} onOpenChange={() => setSelectedKYC(null)}>
        <DialogContent className="max-w-lg font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins">Verification Dossier — {selectedKYC?.name}</DialogTitle>
            <DialogDescription className="font-mono text-xs mt-1">{selectedKYC?.id}</DialogDescription>
          </DialogHeader>
          {selectedKYC && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/30 border rounded-lg p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Current Tier</p>
                  <p className="font-mono font-bold text-foreground mt-1">Tier {selectedKYC.kyc_tier}</p>
                </div>
                <div className="bg-muted/30 border rounded-lg p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Requested Upgrade</p>
                  <p className="font-mono font-bold text-foreground mt-1">
                    {selectedKYC.requestedTier ? `Tier ${selectedKYC.requestedTier}` : 'N/A'}
                  </p>
                </div>
                <div className="bg-muted/30 border rounded-lg p-3 col-span-2 flex justify-between items-center">
                  <p className="text-xs font-semibold text-muted-foreground">Registered Address</p>
                  <p className="font-bold text-foreground text-right">{selectedKYC.address}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold font-poppins text-foreground mb-3">Submitted Documents</h4>
                <div className="space-y-2">
                  {selectedKYC.documents.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No documents uploaded.</p>
                  ) : (
                    selectedKYC.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-background border rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-1.5 rounded text-primary"><FileText className="h-4 w-4" /></div>
                          <div>
                            <p className="text-xs font-bold text-foreground">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{doc.type}</p>
                          </div>
                        </div>
                        {doc.url && (
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold" onClick={() => window.open(doc.url, "_blank")}>View</Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {selectedKYC.status.startsWith("pending") && (
                <div className="flex gap-3 pt-2 mt-4 border-t border-border/50">
                  <Button className="flex-1 font-bold bg-success hover:bg-success/90" onClick={() => handleAction(selectedKYC.id, selectedKYC.user_id, selectedKYC, "Approved")}>
                    Approve Tier {selectedKYC.requestedTier} Upgrade
                  </Button>
                  <Button variant="outline" className="flex-1 font-bold text-destructive hover:bg-destructive/10" onClick={() => handleAction(selectedKYC.id, selectedKYC.user_id, selectedKYC, "Rejected")}>
                    Reject Upgrade
                  </Button>
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
