import { useState, useEffect } from "react";
import { CheckCircle, XCircle, FileText, Search, CreditCard, ExternalLink } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { SlideUp } from "@trustbank/shared-ui/components/Motion";

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
  created_at: string;
}

export default function AdminCurrentAccountsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

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

  const generateAccountNumber = () => {
    // Basic account generation logic mirroring backend function, or use RPC
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  };

  const handleApprove = async (app: Application) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await (supabase.rpc as any)("admin_approve_current_account", {
        p_admin_id: user?.id,
        p_application_id: app.id
      });
      
      if (error) throw error;

      toast({ title: "Application Approved", description: `Account ${(data as any)?.account_number || "generated"} generated.` });
      fetchApplications();
    } catch (e: any) {
      toast({ title: "Approval Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleReject = async (app: Application) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const { error } = await supabase
        .from("current_account_applications")
        .update({ status: "rejected", rejection_reason: reason })
        .eq("id", app.id);
      
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: app.user_id,
        title: "Current Account Update",
        message: `Your current account application was declined. Reason: ${reason}`,
        type: "warning"
      });

      toast({ title: "Application Rejected", description: "The applicant has been notified." });
      fetchApplications();
    } catch (e: any) {
      toast({ title: "Rejection Failed", description: e.message, variant: "destructive" });
    }
  };

  const filteredApps = applications.filter((app) => 
    app.full_name.toLowerCase().includes(search.toLowerCase()) || 
    app.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Current Account Applications</h1>
          <p className="text-sm text-muted-foreground">Review and manage corporate/current account requests.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search applications..." 
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <SlideUp className="bg-card border rounded-xl shadow-sm overflow-hidden">
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
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documents</th>
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
                      <p className="text-xs text-muted-foreground">{app.phone}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold">{app.occupation}</p>
                      <p className="text-xs text-muted-foreground">at {app.employer}</p>
                      {app.business_name && <p className="text-xs text-primary mt-0.5">Biz: {app.business_name}</p>}
                      <p className="text-xs font-mono mt-1 bg-muted inline-block px-1.5 py-0.5 rounded">Inc: {app.income_range}</p>
                    </td>
                    <td className="p-4 space-y-1">
                      {app.id_document_url && (
                        <a href={app.id_document_url} target="_blank" rel="noreferrer" className="flex items-center text-xs text-primary hover:underline">
                          <FileText className="h-3.5 w-3.5 mr-1" /> View ID Doc <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                      {app.utility_bill_url && (
                        <a href={app.utility_bill_url} target="_blank" rel="noreferrer" className="flex items-center text-xs text-primary hover:underline">
                          <FileText className="h-3.5 w-3.5 mr-1" /> View Utility <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
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
                      {app.status !== 'approved' && app.status !== 'rejected' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-success border-emerald-200 hover:bg-success/10 h-8" onClick={() => handleApprove(app)}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive border-red-200 hover:bg-destructive/10 h-8" onClick={() => handleReject(app)}>
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
    </div>
  );
}
