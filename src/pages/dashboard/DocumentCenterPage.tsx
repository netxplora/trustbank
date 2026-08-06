import { useState, useEffect, useMemo } from "react";
import {
  FileText, Download, Search, Filter, Shield, Clock,
  CheckCircle2, XCircle, AlertCircle, ChevronRight,
  Landmark, TrendingUp, CreditCard, Award, FileSpreadsheet, ShieldCheck, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { getUserDocuments } from "@/lib/pdf/documentService";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@/components/public/Motion";

interface PlatformDocument {
  id: string;
  document_type: string;
  document_category: string;
  reference_number: string;
  verification_code: string;
  title: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any>;
  status: "issued" | "void" | "superseded";
  created_at: string;
}

const CATEGORY_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  banking: { label: "Banking", icon: Landmark, color: "text-primary", bg: "bg-primary/10" },
  accounts: { label: "Accounts", icon: FileText, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
  investments: { label: "Investments", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  loans: { label: "Loans", icon: CreditCard, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
  grants: { label: "Grants", icon: Award, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
  tax: { label: "Tax", icon: FileSpreadsheet, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
  kyc: { label: "KYC", icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  security: { label: "Security", icon: Shield, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-900/30" },
  general: { label: "General", icon: Bell, color: "text-muted-foreground", bg: "bg-muted/20" },
};

const STATUS_META = {
  issued: { label: "Issued", icon: CheckCircle2, color: "text-success", bg: "bg-success/10 border-success/20" },
  void: { label: "Void", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
  superseded: { label: "Superseded", icon: AlertCircle, color: "text-warning", bg: "bg-warning/10 border-warning/20" },
};

export default function DocumentCenterPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { identity } = useBrand();
  const brandName = identity?.short_name || "TrustBank";
  const [documents, setDocuments] = useState<PlatformDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<PlatformDocument | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    setLoading(true);
    const data = await getUserDocuments(user!.id);
    setDocuments(data as PlatformDocument[]);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let list = documents;
    if (categoryFilter !== "all") {
      list = list.filter((d) => d.document_category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.reference_number.toLowerCase().includes(q) ||
          d.verification_code.toLowerCase().includes(q)
      );
    }
    return list;
  }, [documents, categoryFilter, search]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, PlatformDocument[]>();
    for (const doc of filtered) {
      const key = new Date(doc.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(doc);
    }
    return map;
  }, [filtered]);

  const availableCategories = useMemo(() => {
    const cats = new Set(documents.map((d) => d.document_category));
    return Array.from(cats);
  }, [documents]);

  const handleCopyVerification = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: "Verification code copied to clipboard." });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto px-1 sm:px-4 py-2 font-sans">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">
              Document Centre
            </h1>
            <p className="text-xs text-muted-foreground">
              {documents.length} {documents.length === 1 ? "document" : "documents"} on record
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <div className="relative w-full sm:w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by title or reference..."
                className="pl-8 text-xs h-8 rounded-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 text-xs rounded-lg border border-input bg-background px-2 font-medium"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_META[cat]?.label || cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FadeIn>

      {/* Category Quick Filters */}
      {documents.length > 0 && (
        <FadeIn>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${
                categoryFilter === "all"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              All
            </button>
            {availableCategories.map((cat) => {
              const meta = CATEGORY_META[cat] || { label: cat, color: "text-muted-foreground" };
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${
                    categoryFilter === cat
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </FadeIn>
      )}

      {/* Document List */}
      {filtered.length === 0 ? (
        <SlideUp>
          <div className="bg-card border border-border/60 rounded-2xl p-12 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-foreground text-sm mb-1">No Documents Found</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {documents.length === 0
                ? "Your documents will appear here after you download receipts, statements, or other official documents."
                : "No documents match your current search or filter."}
            </p>
          </div>
        </SlideUp>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([date, docs]) => (
            <SlideUp key={date}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {date}
                  </p>
                </div>
                <StaggerContainer className="space-y-2">
                  {docs.map((doc) => {
                    const catMeta = CATEGORY_META[doc.document_category] || CATEGORY_META.general;
                    const statusMeta = STATUS_META[doc.status] || STATUS_META.issued;
                    const CatIcon = catMeta.icon;

                    return (
                      <StaggerItem key={doc.id}>
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="w-full bg-card border border-border/60 rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 hover:shadow-sm transition-all text-left group"
                        >
                          {/* Category Icon */}
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${catMeta.bg}`}>
                            <CatIcon className={`h-5 w-5 ${catMeta.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{doc.title}</p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              {doc.reference_number}
                            </p>
                          </div>

                          {/* Status badge */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.color}`}
                            >
                              {statusMeta.label}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </button>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              </div>
            </SlideUp>
          ))}
        </div>
      )}

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-lg font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins text-base">{selectedDoc?.title}</DialogTitle>
          </DialogHeader>
          {selectedDoc && (() => {
            const catMeta = CATEGORY_META[selectedDoc.document_category] || CATEGORY_META.general;
            const statusMeta = STATUS_META[selectedDoc.status] || STATUS_META.issued;
            const CatIcon = catMeta.icon;
            const StatusIcon = statusMeta.icon;

            return (
              <FadeIn className="space-y-4 mt-1">
                {/* Status Banner */}
                <div className={`flex items-center gap-3 rounded-xl border p-3 ${statusMeta.bg}`}>
                  <StatusIcon className={`h-5 w-5 shrink-0 ${statusMeta.color}`} />
                  <div>
                    <p className={`text-xs font-bold ${statusMeta.color}`}>{statusMeta.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedDoc.status === "issued"
                        ? "This document is valid and authentic."
                        : selectedDoc.status === "void"
                        ? "This document has been voided and is no longer valid."
                        : "A newer version of this document has been issued."}
                    </p>
                  </div>
                </div>

                {/* Document Details */}
                <div className="space-y-2">
                  {[
                    { label: "Document Type", value: selectedDoc.document_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) },
                    { label: "Category", value: catMeta.label },
                    { label: "Reference Number", value: selectedDoc.reference_number, mono: true },
                    { label: "Issue Date", value: new Date(selectedDoc.created_at).toLocaleString() },
                  ].map(({ label, value, mono }) => (
                    <div key={label} className="bg-muted/30 rounded-lg p-2.5 flex justify-between items-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                      <p className={`text-xs font-semibold text-foreground text-right max-w-[180px] truncate ${mono ? "font-mono" : ""}`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Verification Code */}
                <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-amber-600" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Verification Code
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2 text-amber-700 dark:text-amber-400 hover:bg-amber-100"
                      onClick={() => handleCopyVerification(selectedDoc.verification_code)}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="font-mono text-xs font-bold text-amber-800 dark:text-amber-300 tracking-widest">
                    {selectedDoc.verification_code}
                  </p>
                  <p className="text-xs text-slate-500 font-sans mt-2">
                    Use this code to verify document authenticity at any {brandName} branch or portal.
                  </p>
                </div>
              </FadeIn>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
