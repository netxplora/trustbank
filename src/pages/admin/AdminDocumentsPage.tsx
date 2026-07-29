import { useState, useEffect, useMemo } from "react";
import {
  FileText, Search, Shield, CheckCircle2, XCircle, AlertCircle,
  Clock, Eye, Archive, RefreshCw, Filter, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getAllDocuments, voidDocument } from "@/lib/pdf/documentService";
import { SlideUp, FadeIn } from "@/components/public/Motion";

interface AdminDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_category: string;
  reference_number: string;
  verification_code: string;
  title: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any>;
  status: "issued" | "void" | "superseded";
  generated_by: string | null;
  created_at: string;
  profiles?: {
    display_name: string;
    email: string;
    account_number: string;
  };
}

const STATUS_META = {
  issued: { label: "Issued", icon: CheckCircle2, color: "text-success", bg: "bg-success/10 border-success/20" },
  void: { label: "Void", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
  superseded: { label: "Superseded", icon: AlertCircle, color: "text-warning", bg: "bg-warning/10 border-warning/20" },
};

const CATEGORIES = ["banking", "accounts", "investments", "loans", "grants", "tax", "kyc", "security", "general"];

const CATEGORY_LABELS: Record<string, string> = {
  banking: "Banking", accounts: "Accounts", investments: "Investments",
  loans: "Loans", grants: "Grants", tax: "Tax", kyc: "KYC",
  security: "Security", general: "General",
};

export default function AdminDocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<AdminDocument | null>(null);
  const [voiding, setVoiding] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [categoryFilter]);

  const fetchDocuments = async () => {
    setLoading(true);
    const data = await getAllDocuments({
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      search: search.trim() || undefined,
    });
    setDocuments(data as AdminDocument[]);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return documents;
    const q = search.toLowerCase();
    return documents.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.reference_number.toLowerCase().includes(q) ||
        d.verification_code.toLowerCase().includes(q) ||
        d.profiles?.email?.toLowerCase().includes(q) ||
        d.profiles?.display_name?.toLowerCase().includes(q)
    );
  }, [documents, search]);

  const handleVoid = async (docId: string) => {
    if (!confirm("Are you sure you want to void this document? This action cannot be undone.")) return;
    setVoiding(docId);
    const success = await voidDocument(docId);
    if (success) {
      toast({ title: "Document Voided", description: "The document has been marked as void." });
      fetchDocuments();
      if (selectedDoc?.id === docId) {
        setSelectedDoc((prev) => prev ? { ...prev, status: "void" } : null);
      }
    } else {
      toast({ title: "Failed to void document", variant: "destructive" });
    }
    setVoiding(null);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: "Verification code copied to clipboard." });
  };

  // Stats
  const stats = useMemo(() => ({
    total: documents.length,
    issued: documents.filter((d) => d.status === "issued").length,
    void: documents.filter((d) => d.status === "void").length,
    today: documents.filter((d) => new Date(d.created_at).toDateString() === new Date().toDateString()).length,
  }), [documents]);

  return (
    <div className="space-y-5 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">
            Document Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Platform-wide document registry — view, verify, and manage all issued documents.
          </p>
        </div>
        <Button size="sm" onClick={fetchDocuments} variant="outline" className="h-8 text-xs rounded-lg gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <FadeIn>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Documents", value: stats.total, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
            { label: "Active & Issued", value: stats.issued, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
            { label: "Voided", value: stats.void, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
            { label: "Issued Today", value: stats.today, icon: Clock, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm">
              <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-xl font-bold font-poppins text-foreground">{value}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* Filters */}
      <SlideUp>
        <div className="bg-card border border-border/60 rounded-xl p-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by reference, customer, or verification code..."
              className="pl-8 text-xs h-8 rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 text-xs rounded-lg border border-input bg-background px-2 font-medium shrink-0"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
        </div>
      </SlideUp>

      {/* Documents Table */}
      <SlideUp>
        <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-semibold text-sm text-muted-foreground">No documents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/10">
                    <th className="text-left p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Document</th>
                    <th className="text-left p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Customer</th>
                    <th className="text-left p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Reference</th>
                    <th className="text-left p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Date</th>
                    <th className="text-left p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-center p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => {
                    const statusMeta = STATUS_META[doc.status] || STATUS_META.issued;
                    const StatusIcon = statusMeta.icon;
                    return (
                      <tr key={doc.id} className="border-b last:border-0 border-border/40 hover:bg-muted/10 transition-colors">
                        <td className="p-3">
                          <p className="font-semibold text-foreground truncate max-w-[200px]">{doc.title}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                            {CATEGORY_LABELS[doc.document_category] || doc.document_category}
                          </p>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <p className="font-semibold text-foreground">{doc.profiles?.display_name || "—"}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.profiles?.email}</p>
                        </td>
                        <td className="p-3 font-mono text-[10px] text-muted-foreground hidden lg:table-cell">
                          {doc.reference_number}
                        </td>
                        <td className="p-3 text-muted-foreground hidden lg:table-cell">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.color}`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                              onClick={() => setSelectedDoc(doc)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {doc.status === "issued" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleVoid(doc.id)}
                                disabled={voiding === doc.id}
                              >
                                <XCircle className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SlideUp>

      {/* Detail Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-lg font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins text-sm">{selectedDoc?.title}</DialogTitle>
          </DialogHeader>
          {selectedDoc && (() => {
            const statusMeta = STATUS_META[selectedDoc.status] || STATUS_META.issued;
            const StatusIcon = statusMeta.icon;
            return (
              <FadeIn className="space-y-4 mt-1">
                <div className={`flex items-center gap-3 rounded-xl border p-3 ${statusMeta.bg}`}>
                  <StatusIcon className={`h-5 w-5 shrink-0 ${statusMeta.color}`} />
                  <p className={`text-xs font-bold ${statusMeta.color}`}>Status: {statusMeta.label}</p>
                </div>

                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid grid-cols-2 h-8 text-xs mb-3">
                    <TabsTrigger value="details" className="text-xs">Document Details</TabsTrigger>
                    <TabsTrigger value="customer" className="text-xs">Customer Info</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-2 mt-0">
                    {[
                      { label: "Reference Number", value: selectedDoc.reference_number, mono: true },
                      { label: "Verification Code", value: selectedDoc.verification_code, mono: true, action: () => handleCopyCode(selectedDoc.verification_code) },
                      { label: "Document Type", value: selectedDoc.document_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) },
                      { label: "Category", value: CATEGORY_LABELS[selectedDoc.document_category] || selectedDoc.document_category },
                      { label: "Issue Date", value: new Date(selectedDoc.created_at).toLocaleString() },
                      ...(selectedDoc.entity_type ? [{ label: "Source Record", value: `${selectedDoc.entity_type} / ${selectedDoc.entity_id?.slice(0, 8)}...` }] : []),
                    ].map(({ label, value, mono, action }) => (
                      <div key={label} className="bg-muted/30 rounded-lg p-2.5 flex justify-between items-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-semibold text-foreground text-right max-w-[180px] truncate ${mono ? "font-mono" : ""}`}>{value}</p>
                          {action && (
                            <button onClick={action} className="text-[9px] text-primary font-bold hover:underline">Copy</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="customer" className="space-y-2 mt-0">
                    {[
                      { label: "Name", value: selectedDoc.profiles?.display_name || "—" },
                      { label: "Email", value: selectedDoc.profiles?.email || "—" },
                      { label: "Account Number", value: selectedDoc.profiles?.account_number || "—" },
                      { label: "User ID", value: selectedDoc.user_id?.slice(0, 16) + "...", mono: true },
                    ].map(({ label, value, mono }) => (
                      <div key={label} className="bg-muted/30 rounded-lg p-2.5 flex justify-between items-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                        <p className={`text-xs font-semibold text-foreground text-right max-w-[200px] truncate ${mono ? "font-mono" : ""}`}>{value}</p>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>

                {selectedDoc.status === "issued" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => handleVoid(selectedDoc.id)}
                    disabled={voiding === selectedDoc.id}
                  >
                    <Archive className="h-3.5 w-3.5 mr-2" />
                    Void This Document
                  </Button>
                )}
              </FadeIn>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
