import { useEffect, useState } from "react";
import { FileText, Upload, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { StaggerContainer, StaggerItem, SlideUp } from "@trustbank/shared-ui/components/Motion";

interface CustomerProfile {
  user_id: string;
  display_name: string;
  email: string;
  account_number: string;
}

interface AdminTaxDoc {
  id: string;
  year: number;
  form_type: string;
  file_path: string;
  created_at: string;
  profiles: {
    display_name: string;
    email: string;
  } | null;
}

export default function AdminTaxDocumentsPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [taxDocs, setTaxDocs] = useState<AdminTaxDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [formType, setFormType] = useState<"1099-INT" | "1099-DIV" | "1098">("1099-INT");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch customers
      const { data: custs } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, account_number");
      
      const custsList = (custs as CustomerProfile[]) || [];
      setCustomers(custsList);
      if (custsList.length > 0) {
        setSelectedUserId(custsList[0].user_id);
      }

      // 2. Fetch tax documents
      const { data: docs, error: docsError } = await (supabase as any)
        .from("tax_documents")
        .select(`*`)
        .order("created_at", { ascending: false });
        
      if (docsError) throw docsError;

      // Extract user_ids to fetch profiles manually
      const userIds: string[] = Array.from(new Set(docs?.map((d: any) => d.user_id).filter(Boolean) as string[]));
      
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase.from("profiles").select("user_id, display_name, email").in("user_id", userIds);
        profilesData?.forEach(p => {
          profilesMap[p.user_id] = p;
        });
      }

      // Merge profiles into tax docs
      const finalDocs = docs?.map(d => ({
        ...d,
        profiles: d.user_id ? profilesMap[d.user_id] : null
      }));

      setTaxDocs((finalDocs as any[]) || []);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Fetch Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadTaxDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast({ title: "Validation Error", description: "Please select a customer first.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const yr = parseInt(selectedYear);
    const filePath = `/storage/tax_documents/${selectedUserId}/${yr}_${formType}.pdf`;

    try {
      // Find customer account details
      const { data: acct } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", selectedUserId)
        .limit(1)
        .single();

      if (!acct) {
        throw new Error("This customer does not have an active banking account. Cannot upload tax documents.");
      }

      const { error } = await (supabase as any).from("tax_documents").insert({
        year: yr,
        form_type: formType,
        account_id: acct.id,
        file_path: filePath,
        user_id: selectedUserId,
      });

      if (error) throw error;

      toast({
        title: "Tax Document Uploaded",
        description: `Successfully published IRS Form ${formType} for year ${yr}.`,
      });

      fetchData();
    } catch (e: any) {
      toast({ title: "Upload Failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTaxDoc = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("tax_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Document Removed", description: "The tax document record was deleted successfully." });
      fetchData();
    } catch (e: any) {
      toast({ title: "Delete Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">Tax Document Administration</h1>
        <p className="text-sm text-muted-foreground font-sans">Publish and audit annual 1099/1098 IRS tax forms for institutional clients</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <StaggerContainer className="grid lg:grid-cols-5 gap-6 font-sans">
          {/* Upload Form */}
          <StaggerItem className="lg:col-span-2">
            <div className="bg-card rounded-xl border p-6 space-y-4 shadow-sm hover-lift h-full">
              <h3 className="font-semibold font-poppins text-foreground flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" /> Publish Official Form
              </h3>

              <form onSubmit={handleUploadTaxDoc} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Select Client Profile</label>
                  <select
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold text-foreground"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    {customers.map((c) => (
                      <option key={c.user_id} value={c.user_id}>
                        {c.display_name} (A/C: ****{c.account_number.slice(-4)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Tax Year</label>
                    <select
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold text-foreground"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2024">2024</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">IRS Form Type</label>
                    <select
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold text-foreground"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                    >
                      <option value="1099-INT">1099-INT (Interest)</option>
                      <option value="1099-DIV">1099-DIV (Dividends)</option>
                      <option value="1098">1098 (Mortgage Interest)</option>
                    </select>
                  </div>
                </div>

                <div className="border border-dashed rounded-lg p-5 text-center bg-muted/20">
                  <FileText className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-muted-foreground">Mock Tax PDF template will be created and bound to the client dashboard upon submission.</p>
                </div>

                <Button type="submit" className="w-full font-bold" disabled={uploading}>
                  {uploading ? "Publishing Document..." : "Publish Document to Portal"}
                </Button>
              </form>
            </div>
          </StaggerItem>

          {/* List of Uploaded Documents */}
          <StaggerItem className="lg:col-span-3">
            <div className="bg-card rounded-xl border shadow-sm hover-lift h-full">
              <div className="p-5 border-b flex justify-between items-center bg-muted/10">
                <h3 className="font-semibold font-poppins text-foreground">Published Document Directory</h3>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-success bg-success/10 border border-emerald-100 px-2.5 py-1 rounded-sm">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>IRS Verified List</span>
                </div>
              </div>

              {taxDocs.length === 0 ? (
                <div className="p-8 text-center text-sm font-semibold text-muted-foreground">
                  No tax documents published yet.
                </div>
              ) : (
                <div className="divide-y">
                  {taxDocs.map((doc) => {
                    const custName = doc.profiles?.display_name || "Unknown Customer";
                    const custEmail = doc.profiles?.email || "";

                    return (
                      <div key={doc.id} className="p-4 flex justify-between items-center hover:bg-muted/10 transition-colors">
                        <div>
                          <p className="font-bold text-foreground text-sm">IRS Form {doc.form_type} — Tax Year {doc.year}</p>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                            Client Profile: <span className="font-bold text-foreground">{custName}</span> ({custEmail})
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => handleDeleteTaxDoc(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </StaggerItem>
        </StaggerContainer>
      )}
    </div>
  );
}
