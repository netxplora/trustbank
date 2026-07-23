import { useState, useEffect } from "react";
import { CheckCircle, XCircle, FileText, Search, CreditCard, ExternalLink, Eye, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SlideUp } from "@/components/public/Motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Application {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  occupation: string;
  employer: string;
  business_name: string | null;
  income_range: string;
  id_document_url: string;
  utility_bill_url: string;
  status: string;
  rejection_reason?: string;
  created_at: string;
}

export default function AdminCurrentAccountsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  
  // Modal State
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("current_account_applications")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error(error);
    } else {
      setApplications(data as Application[]);
    }
    setLoading(false);
  };

  const handleApprove = async (app: Application) => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await (supabase.rpc as any)("admin_approve_current_account", {
        p_admin_id: user?.id,
        p_application_id: app.id
      });
      
      if (error) throw error;

      toast({ title: "Application Approved", description: `Account ${(data as any)?.account_number || "generated"} generated.` });
      setDetailOpen(false);
      fetchApplications();
    } catch (e: any) {
      toast({ title: "Approval Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (app: Application) => {
    if (!rejectionReason) {
      toast({ title: "Reason Required", description: "Please provide a rejection reason.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("current_account_applications")
        .update({ status: "rejected", rejection_reason: rejectionReason })
        .eq("id", app.id);
      
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: app.user_id,
        title: "Current Account Update",
        message: `Your current account application was declined. Reason: ${rejectionReason}`,
        type: "warning"
      });

      toast({ title: "Application Rejected", description: "The applicant has been notified." });
      setDetailOpen(false);
      fetchApplications();
    } catch (e: any) {
      toast({ title: "Rejection Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const openAppDetail = (app: Application) => {
    setSelectedApp(app);
    setRejectionReason(app.rejection_reason || "");
    setDetailOpen(true);
  };

  const filteredApps = applications.filter((app) => 
    app.full_name.toLowerCase().includes(search.toLowerCase()) || 
    app.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Current Account Applications</h1>
          <p className="text-xs text-muted-foreground">Review and manage current account applications.</p>
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder="Search applications..." 
            className="pl-8 h-8 text-xs rounded-lg bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <SlideUp className="bg-card border rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center"><div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : filteredApps.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No applications found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Applicant</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employment</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4">
                      <p className="text-sm font-bold text-foreground">{app.full_name}</p>
                      <p className="text-xs text-muted-foreground">{app.email}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold">{app.occupation}</p>
                      <p className="text-xs text-muted-foreground">at {app.employer}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        app.status === 'approved' ? 'bg-success/10 text-success' :
                        app.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button size="sm" variant="outline" className="h-8 text-xs font-semibold" onClick={() => openAppDetail(app)}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" /> Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SlideUp>

      {/* Review Application Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-border/50">
            <div className="flex justify-between items-start pr-6">
              <div>
                <DialogTitle className="font-poppins text-2xl font-bold text-foreground">Review Application</DialogTitle>
                <DialogDescription className="text-sm mt-1">Current Account Application</DialogDescription>
              </div>
              {selectedApp && (
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                  selectedApp.status === 'approved' ? 'bg-success/10 text-success border border-success/20' :
                  selectedApp.status === 'rejected' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                  'bg-warning/10 text-warning border border-warning/20'
                }`}>
                  {selectedApp.status}
                </span>
              )}
            </div>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6 py-4">
              {/* Applicant Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Applicant</p>
                  <p className="font-semibold text-foreground text-sm">{selectedApp.full_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contact</p>
                  <p className="font-semibold text-foreground text-sm">{selectedApp.email}</p>
                  <p className="text-xs text-muted-foreground">{selectedApp.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Employment</p>
                  <p className="font-semibold text-foreground text-sm">{selectedApp.occupation}</p>
                  <p className="text-xs text-muted-foreground">{selectedApp.employer}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Income & Biz</p>
                  <p className="font-semibold text-foreground text-sm">{selectedApp.income_range}</p>
                  {selectedApp.business_name && <p className="text-xs text-muted-foreground">{selectedApp.business_name}</p>}
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-2 bg-muted/30 p-4 rounded-xl border border-border/50">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attached Documents</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedApp.id_document_url && (
                    <a href={selectedApp.id_document_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background hover:bg-muted/50 transition-colors group">
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-foreground truncate">ID Document</p>
                        <p className="text-[10px] text-primary flex items-center mt-0.5">View File <ExternalLink className="h-3 w-3 ml-1" /></p>
                      </div>
                    </a>
                  )}
                  {selectedApp.utility_bill_url && (
                    <a href={selectedApp.utility_bill_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background hover:bg-muted/50 transition-colors group">
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-foreground truncate">Utility Bill</p>
                        <p className="text-[10px] text-primary flex items-center mt-0.5">View File <ExternalLink className="h-3 w-3 ml-1" /></p>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              {selectedApp.status !== 'approved' && selectedApp.status !== 'rejected' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rejection Reason (If Rejecting)</label>
                    <Textarea 
                      placeholder="Please provide a reason if rejecting this application..." 
                      className="rounded-xl min-h-[80px]"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-3 justify-end pt-2">
                    <Button variant="outline" className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleReject(selectedApp)} disabled={isProcessing}>
                      <XCircle className="h-4 w-4 mr-2" /> Reject
                    </Button>
                    <Button className="rounded-xl bg-success text-success-foreground hover:bg-success/90" onClick={() => handleApprove(selectedApp)} disabled={isProcessing}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Approve Account
                    </Button>
                  </div>
                </div>
              )}
              
              {(selectedApp.status === 'rejected' && selectedApp.rejection_reason) && (
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl space-y-1">
                  <p className="text-[10px] font-bold text-destructive uppercase tracking-wider flex items-center"><Info className="h-3 w-3 mr-1" /> Rejection Reason</p>
                  <p className="text-sm text-foreground">{selectedApp.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
