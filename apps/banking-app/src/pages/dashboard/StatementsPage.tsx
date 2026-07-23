import { useEffect, useState } from "react";
import { FileText, Download, Calendar, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@trustbank/shared-ui/components/ui/tabs";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { generateStatementPDF } from "@trustbank/shared-utils/lib/pdf/statement";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";
import { TableSkeleton } from "@trustbank/shared-ui/components/skeletons/DashboardSkeleton";
import jsPDF from "jspdf";

interface Account {
  id: string;
  account_type: string;
  account_number: string;
  balance: number;
  currency: string;
}

interface TaxDocument {
  id: string;
  year: number;
  form_type: "1099-INT" | "1099-DIV" | "1098";
  file_path: string;
  created_at: string;
}

interface StatementHistory {
  id: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  opening_balance: number;
  closing_balance: number;
}

const MONTHS = [
  { label: "June 2026", start: "2026-06-01", end: "2026-06-30" },
  { label: "May 2026", start: "2026-05-01", end: "2026-05-31" },
  { label: "April 2026", start: "2026-04-01", end: "2026-04-30" },
  { label: "March 2026", start: "2026-03-01", end: "2026-03-31" },
];

const getPremiumAccountName = (type: string) => {
  const mapping: Record<string, string> = {
    checking: "Private Client Checking",
    savings: "High-Yield Portfolio Reserve",
    investment: "Sovereign Wealth Managed Portfolio",
    credit: "Signature Elite Credit Facility",
    loan: "Institutional Credit Facility",
  };
  return mapping[type.toLowerCase()] || `${type.charAt(0).toUpperCase() + type.slice(1)} Account`;
};

export default function StatementsPage() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [taxDocs, setTaxDocs] = useState<TaxDocument[]>([]);
  const [stmtHistory, setStmtHistory] = useState<StatementHistory[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchAccounts();
    fetchTaxDocuments();
  }, [user?.id]);

  useEffect(() => {
    if (selectedAccountId) {
      fetchStatementHistory(selectedAccountId);
    }
  }, [selectedAccountId]);

  const fetchAccounts = async () => {
    try {
      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user?.id || "")
        .eq("status", "active");

      const list = (data as Account[]) || [];
      setAccounts(list);
      if (list.length > 0) {
        setSelectedAccountId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchTaxDocuments = async () => {
    try {
      const { data } = await (supabase as any)
        .from("tax_documents")
        .select("*")
        .eq("user_id", user?.id || "")
        .order("year", { ascending: false });

      setTaxDocs((data as TaxDocument[]) || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStatementHistory = async (acctId: string) => {
    try {
      const { data } = await (supabase as any)
        .from("account_statements")
        .select("*")
        .eq("account_id", acctId)
        .order("generated_at", { ascending: false });

      setStmtHistory((data as StatementHistory[]) || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateStatement = async () => {
    const account = accounts.find((a) => a.id === selectedAccountId);
    if (!account || !user) return;
    
    setGenerating(true);
    const month = MONTHS[selectedMonthIndex];

    try {
      // 1. Fetch transactions for the period
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("account_id", account.id)
        .gte("created_at", `${month.start}T00:00:00Z`)
        .lte("created_at", `${month.end}T23:59:59Z`)
        .order("created_at", { ascending: true });

      const txList = txData || [];

      // 2. Generate PDF using jsPDF
      const customerName = profile?.display_name || profile?.first_name + " " + profile?.last_name || "Valued Customer";
      const doc = generateStatementPDF(customerName, account, txList as any[], month.label);

      // 3. Trigger immediate local browser download
      doc.save(`TrustBank_Statement_${account.account_number.slice(-4)}_${month.label.replace(" ", "_")}.pdf`);

      // 4. Convert PDF to Blob for storage upload
      const pdfBlob = doc.output("blob");

      // 5. Upload to Supabase Storage private statements bucket
      const filePath = `${user.id}/${account.id}/${month.start}_statement.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("statements")
        .upload(filePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: true,
        });

      let publicUrl = null;
      if (!uploadError && uploadData) {
        // Retrieve a signed URL since the bucket is private
        const { data: signedData } = await supabase.storage
          .from("statements")
          .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days expiry
        if (signedData) publicUrl = signedData.signedUrl;
      } else {
        console.warn("Storage upload skipped or failed (Bucket statements might not exist yet):", uploadError?.message);
      }

      // 6. Record statement metadata in DB
      const startBalance = txList.length > 0 ? account.balance - txList.reduce((sum, tx) => sum + (tx.type === "credit" ? tx.amount : -tx.amount), 0) : account.balance;
      
      await (supabase as any).from("account_statements").insert({
        account_id: account.id,
        period_start: month.start,
        period_end: month.end,
        opening_balance: startBalance,
        closing_balance: account.balance,
        pdf_url: publicUrl,
      });

      toast({
        title: "Statement Generated",
        description: `Account statement for ${month.label} downloaded successfully.`,
      });

      fetchStatementHistory(account.id);
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Generation Failed",
        description: e.message || "Could not generate account statement PDF.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadTaxDoc = (doc: TaxDocument) => {
    // Generate a realistic simulated IRS 1099-INT Form
    const jspdfDoc = new jsPDF();
    
    // Header
    jspdfDoc.setFont("helvetica", "bold");
    jspdfDoc.setFontSize(22);
    jspdfDoc.text("CORRECTED", 105, 20, { align: "center" });
    
    jspdfDoc.setFontSize(16);
    jspdfDoc.text("PAYER'S name, street address, city or town, state or province, country, ZIP", 14, 30);
    
    jspdfDoc.setFont("helvetica", "normal");
    jspdfDoc.setFontSize(10);
    jspdfDoc.text("TrustyBank NA", 14, 36);
    jspdfDoc.text("100 Wall Street, Suite 500", 14, 41);
    jspdfDoc.text("New York, NY 10005", 14, 46);
    
    // Draw Box
    jspdfDoc.rect(12, 24, 90, 26);
    
    // Payer TIN & Recipient TIN
    jspdfDoc.rect(12, 50, 45, 12);
    jspdfDoc.rect(57, 50, 45, 12);
    jspdfDoc.setFontSize(8);
    jspdfDoc.text("PAYER'S TIN", 14, 54);
    jspdfDoc.text("RECIPIENT'S TIN", 59, 54);
    jspdfDoc.setFont("helvetica", "bold");
    jspdfDoc.text("XX-XXXXX89", 14, 59);
    jspdfDoc.text("XXX-XX-1234", 59, 59);
    
    // Recipient Details
    jspdfDoc.rect(12, 62, 90, 26);
    jspdfDoc.setFont("helvetica", "normal");
    jspdfDoc.text("RECIPIENT'S name", 14, 66);
    jspdfDoc.setFont("helvetica", "bold");
    jspdfDoc.text(profile?.display_name || profile?.first_name + " " + profile?.last_name || "Valued Customer", 14, 71);
    jspdfDoc.setFont("helvetica", "normal");
    jspdfDoc.text("Street address (including apt. no.)", 14, 76);
    jspdfDoc.text("123 Main Street", 14, 81);
    jspdfDoc.text("City or town, state or province, country, and ZIP or foreign postal code", 14, 86);
    
    // Right side Form 1099-INT boxes
    jspdfDoc.rect(105, 24, 30, 26);
    jspdfDoc.setFontSize(10);
    jspdfDoc.setFont("helvetica", "bold");
    jspdfDoc.text("1 Interest income", 107, 30);
    jspdfDoc.setFontSize(14);
    // Simulate some interest based on the year
    const interest = doc.year === 2026 ? "4,520.45" : "1,200.00";
    jspdfDoc.text(`$ ${interest}`, 107, 40);
    
    jspdfDoc.rect(135, 24, 60, 26);
    jspdfDoc.setFontSize(16);
    jspdfDoc.text(`Form 1099-INT`, 140, 36);
    jspdfDoc.setFontSize(10);
    jspdfDoc.text(`Tax Year: ${doc.year}`, 140, 44);
    
    // Box 2
    jspdfDoc.rect(105, 50, 45, 12);
    jspdfDoc.setFontSize(8);
    jspdfDoc.setFont("helvetica", "normal");
    jspdfDoc.text("2 Early withdrawal penalty", 107, 54);
    jspdfDoc.setFont("helvetica", "bold");
    jspdfDoc.text("$ 0.00", 107, 59);
    
    // Box 3
    jspdfDoc.rect(150, 50, 45, 12);
    jspdfDoc.setFont("helvetica", "normal");
    jspdfDoc.text("3 Interest on U.S. Savings Bonds", 152, 54);
    jspdfDoc.setFont("helvetica", "bold");
    jspdfDoc.text("$ 0.00", 152, 59);
    
    // Box 4
    jspdfDoc.rect(105, 62, 45, 12);
    jspdfDoc.setFont("helvetica", "normal");
    jspdfDoc.text("4 Federal income tax withheld", 107, 66);
    jspdfDoc.setFont("helvetica", "bold");
    jspdfDoc.text("$ 0.00", 107, 71);
    
    // Footer / Notice
    jspdfDoc.setFont("helvetica", "italic");
    jspdfDoc.setFontSize(9);
    jspdfDoc.text("This is important tax information and is being furnished to the Internal Revenue Service.", 14, 100);
    jspdfDoc.text("If you are required to file a return, a negligence penalty or other sanction may be imposed", 14, 105);
    jspdfDoc.text("on you if this income is taxable and the IRS determines that it has not been reported.", 14, 110);
    
    jspdfDoc.save(`TrustBank_Form_${doc.form_type}_${doc.year}.pdf`);
    toast({ title: "Tax Document Downloaded", description: `Form ${doc.form_type} for year ${doc.year} downloaded.` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Official eStatements & Documents</h1>
        <p className="text-sm text-muted-foreground font-sans">Access your account statements and official IRS tax filings</p>
      </div>

      {loadingAccounts ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 max-w-sm gap-2 mb-4"><div className="h-9 bg-muted rounded-lg animate-pulse" /><div className="h-9 bg-muted rounded-lg animate-pulse" /></div>
          <TableSkeleton rows={6} />
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-card rounded-xl border p-8 text-center max-w-md mx-auto shadow-sm">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">No active deposit accounts found</p>
          <p className="text-sm text-muted-foreground mt-1 font-sans">Please open a primary account to view statements.</p>
        </div>
      ) : (
        <Tabs defaultValue="statements" className="w-full">
          <TabsList className="grid grid-cols-2 max-w-sm mb-6">
            <TabsTrigger value="statements" className="font-semibold">Statements</TabsTrigger>
            <TabsTrigger value="tax" className="font-semibold">Tax Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="statements" className="m-0 space-y-6">
            <StaggerContainer className="grid lg:grid-cols-5 gap-6">
              {/* Form Input Side */}
              <StaggerItem className="lg:col-span-2">
                <div className="bg-card rounded-xl border p-6 space-y-4 shadow-sm hover-lift h-full">
                  <h3 className="font-semibold text-foreground">Request Official Statement</h3>
                  
                  <div>
                    <label className="text-xs font-semibold block mb-1">Select Account</label>
                    <select
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold font-sans"
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {getPremiumAccountName(a.account_type)} - ****{a.account_number.slice(-4)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Select Period</label>
                    <select
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold font-sans"
                      value={selectedMonthIndex}
                      onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                    >
                      {MONTHS.map((m, idx) => (
                        <option key={m.label} value={idx}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    className="w-full font-bold"
                    disabled={generating}
                    onClick={handleGenerateStatement}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {generating ? "Compiling PDF..." : "Generate Statement"}
                  </Button>
                </div>
              </StaggerItem>

              {/* History Side */}
              <StaggerItem className="lg:col-span-3">
                <div className="bg-card rounded-xl border shadow-sm h-full">
                  <div className="p-5 border-b">
                    <h3 className="font-semibold text-foreground">Statement Generation History</h3>
                  </div>

                  {stmtHistory.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2 font-sans">
                      <Calendar className="h-8 w-8 text-muted-foreground/50" />
                      <span>No statements generated for this account yet.</span>
                    </div>
                  ) : (
                    <div className="divide-y font-sans">
                      {stmtHistory.map((h) => (
                        <div key={h.id} className="p-4 flex justify-between items-center hover:bg-muted/10 transition-colors">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">
                              Statement: {new Date(h.period_start).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Generated on {new Date(h.generated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right text-xs">
                              <p className="text-muted-foreground uppercase tracking-wider font-bold" style={{fontSize: "10px"}}>Closing Bal:</p>
                              <p className="font-bold text-foreground font-mono">${Number(h.closing_balance).toLocaleString()}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                // Regenerate the statement for download
                                const account = accounts.find((a) => a.id === selectedAccountId);
                                if (!account) return;
                                
                                const { data: txData } = await supabase
                                  .from("transactions")
                                  .select("*")
                                  .eq("account_id", account.id)
                                  .gte("created_at", `${h.period_start}T00:00:00Z`)
                                  .lte("created_at", `${h.period_end}T23:59:59Z`);

                                const customerName = profile?.display_name || "Valued Customer";
                                const doc = generateStatementPDF(
                                  customerName,
                                  account,
                                  (txData as any[]) || [],
                                  new Date(h.period_start).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                                );
                                doc.save(`TrustBank_Statement_${account.account_number.slice(-4)}.pdf`);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </StaggerItem>
            </StaggerContainer>
          </TabsContent>

          <TabsContent value="tax" className="m-0 space-y-6">
            <div className="bg-card rounded-xl border overflow-hidden shadow-sm hover-lift">
              <div className="p-5 border-b flex justify-between items-center">
                <h3 className="font-semibold text-foreground">Official Yearly Tax Documents</h3>
                <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 px-2.5 py-1 rounded border border-emerald-100 font-bold uppercase tracking-wider" style={{fontSize: "10px"}}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>IRS Verified documents</span>
                </div>
              </div>

              {taxDocs.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-3 font-sans">
                  <HelpCircle className="h-10 w-10 text-muted-foreground/45" />
                  <div>
                    <p className="font-semibold text-foreground">No tax documents available</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Documents are uploaded by the administrator by January 31st each year.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y font-sans">
                  {taxDocs.map((doc) => (
                    <div key={doc.id} className="p-5 flex justify-between items-center hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm">Form {doc.form_type} — Tax Year {doc.year}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Uploaded on {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 font-bold text-xs"
                        onClick={() => handleDownloadTaxDoc(doc)}
                      >
                        <Download className="h-3.5 w-3.5" /> Download PDF
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
