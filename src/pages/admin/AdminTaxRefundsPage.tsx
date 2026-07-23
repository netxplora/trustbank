import React, { useState, useEffect } from "react";
import { FileSpreadsheet, CheckCircle2, XCircle, Clock, Search, Eye, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SlideUp, StaggerContainer, StaggerItem } from "@/components/public/Motion";
import {
  getAllTaxRefundApplications,
  updateTaxRefundStatus,
  deleteTaxRefundApplication,
  TaxRefundApplication,
} from "@/services/taxRefundService";
import { supabase } from "@/integrations/supabase/client";

const STATUS_OPTIONS: TaxRefundApplication["status"][] = [
  "submitted", "under_review", "action_required", "approved", "disbursed", "rejected"
];

const statusColor = (status: string) => {
  switch (status) {
    case "approved":
    case "disbursed":
      return "bg-success/10 text-success border-success/20";
    case "under_review":
      return "bg-warning/10 text-warning border-warning/20";
    case "action_required":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    case "rejected":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function AdminTaxRefundsPage() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<TaxRefundApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Detail/Edit dialog
  const [selectedApp, setSelectedApp] = useState<TaxRefundApplication | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<TaxRefundApplication["status"]>("submitted");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("admin-tax-refunds-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tax_refund_applications" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getAllTaxRefundApplications();
    setApplications(data);
    setLoading(false);
  };

  const openDetail = (app: TaxRefundApplication) => {
    setSelectedApp(app);
    setAdminNotes(app.admin_notes || "");
    setNewStatus(app.status);
    setDetailOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedApp?.id) return;
    setUpdating(true);
    const success = await updateTaxRefundStatus(selectedApp.id, newStatus, adminNotes);
    setUpdating(false);

    if (success) {
      toast({ title: "Status Updated", description: `Application ${selectedApp.application_number} updated to "${newStatus}".` });
      setDetailOpen(false);
      loadData();
    } else {
      toast({ title: "Update Failed", description: "Could not update the application. Please try again.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, appNumber: string) => {
    if (!confirm(`Delete application ${appNumber}? This action cannot be undone.`)) return;
    const success = await deleteTaxRefundApplication(id);
    if (success) {
      toast({ title: "Application Deleted", description: `${appNumber} has been removed.` });
      loadData();
    } else {
      toast({ title: "Delete Failed", description: "Could not delete the application.", variant: "destructive" });
    }
  };

  const filtered = applications.filter((app) => {
    const matchesSearch = searchQuery === "" ||
      app.application_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.profiles?.display_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.profiles?.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalApps = applications.length;
  const pendingApps = applications.filter(a => a.status === "submitted" || a.status === "under_review").length;
  const approvedApps = applications.filter(a => a.status === "approved" || a.status === "disbursed").length;
  const totalRefundValue = applications.reduce((sum, a) => sum + a.estimated_refund_amount, 0);

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <SlideUp>
        <div>
          <h1 className="font-poppins text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Tax Refund Management
          </h1>
          <p className="text-xs text-muted-foreground mb-0.5">
            Review user tax refund claims, verify documentation, update statuses, and manage payouts.
          </p>
        </div>
      </SlideUp>

      {/* Summary Stats */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <StaggerItem>
          <Card className="rounded-xl border border-border/60 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground font-medium">Total Applications</p>
              <p className="font-poppins text-base font-bold text-foreground mt-0.5">{totalApps}</p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="rounded-xl border border-border/60 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground font-medium">Pending Review</p>
              <p className="font-poppins text-base font-bold text-warning mt-0.5">{pendingApps}</p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="rounded-xl border border-border/60 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground font-medium">Approved</p>
              <p className="font-poppins text-base font-bold text-success mt-0.5">{approvedApps}</p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="rounded-xl border border-border/60 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground font-medium">Total Refund Value</p>
              <p className="font-poppins text-base font-bold text-primary mt-0.5">${totalRefundValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Filters */}
      <Card className="rounded-xl border border-border/60 shadow-sm">
        <CardHeader className="p-3.5 pb-2 border-b border-border/60 bg-muted/10">
          <CardTitle className="font-poppins text-xs sm:text-sm font-bold">Applications Queue</CardTitle>
          <CardDescription>Review, approve, or reject tax refund submissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by application number, name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl"
              />
            </div>
            <select
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[160px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Loading applications...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No tax refund applications found.</div>
          ) : (
            <div className="space-y-4">
              {filtered.map((app) => (
                <div key={app.id} className="p-4 rounded-xl border border-border/50 bg-background/50 space-y-3 hover:border-primary/20 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-poppins font-bold text-foreground">{app.application_number}</span>
                        <Badge className={`${statusColor(app.status)} text-[10px] font-bold uppercase`}>
                          {app.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tax Year: {app.tax_year} | Filing: {app.filing_status}
                        {app.profiles?.display_name && ` | Applicant: ${app.profiles.display_name}`}
                        {app.profiles?.email && ` (${app.profiles.email})`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-poppins font-bold text-lg text-primary">
                        ${app.estimated_refund_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {app.created_at ? new Date(app.created_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </div>

                  {app.user_notes && (
                    <p className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg">
                      <span className="font-bold text-foreground">User Note: </span>{app.user_notes}
                    </p>
                  )}

                  {app.admin_notes && (
                    <p className="text-xs text-muted-foreground bg-primary/5 p-2.5 rounded-lg">
                      <span className="font-bold text-foreground">Admin Note: </span>{app.admin_notes}
                    </p>
                  )}

                  <div className="flex gap-2 justify-end pt-2 border-t border-border/40">
                    <Button size="sm" variant="outline" className="text-xs gap-1.5 rounded-xl" onClick={() => openDetail(app)}>
                      <Eye className="h-3.5 w-3.5" /> Review & Update
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs gap-1.5 rounded-xl text-destructive hover:text-destructive" onClick={() => handleDelete(app.id!, app.application_number)}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail / Update Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-poppins text-xl">Review Application</DialogTitle>
            <DialogDescription>
              {selectedApp?.application_number} — Tax Year {selectedApp?.tax_year}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Applicant</p>
                  <p className="font-semibold text-foreground">{selectedApp.profiles?.display_name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Email</p>
                  <p className="font-semibold text-foreground">{selectedApp.profiles?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Filing Status</p>
                  <p className="font-semibold text-foreground">{selectedApp.filing_status}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Estimated Refund</p>
                  <p className="font-bold text-primary">${selectedApp.estimated_refund_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {selectedApp.documents && selectedApp.documents.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Attached Documents</p>
                  <div className="flex flex-col gap-2">
                    {selectedApp.documents.map((doc, i) => (
                      <a 
                        key={i} 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/80 transition-colors group"
                      >
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                          <FileSpreadsheet className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{doc.uploaded_at || "Submitted"}</p>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Update Status</label>
                <select
                  className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TaxRefundApplication["status"])}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Admin Notes</label>
                <Textarea
                  placeholder="Add internal notes about this application..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="rounded-xl min-h-[80px]"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDetailOpen(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={handleUpdateStatus} disabled={updating} className="rounded-xl font-bold">
                  {updating ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
