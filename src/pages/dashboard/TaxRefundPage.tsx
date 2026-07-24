import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Plus, Upload, CheckCircle2, Clock, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";
import { getUserTaxRefundApplications, TaxRefundApplication } from "@/services/taxRefundService";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function TaxRefundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<TaxRefundApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();

    // Supabase Realtime Subscription for instant status sync
    const channel = supabase
      .channel("user-tax-refunds-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tax_refund_applications" },
        () => {
          if (user?.id) loadApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadApplications = async () => {
    setLoading(true);
    const data = await getUserTaxRefundApplications(user?.id || "");
    setApplications(data);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
      case 'disbursed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-none"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
      case 'closed':
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-none border-none"><AlertCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      case 'info_required':
      case 'action_required':
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 shadow-none border-none"><AlertCircle className="h-3 w-3 mr-1" /> Action Required</Badge>;
      default:
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 shadow-none border-none"><Clock className="h-3 w-3 mr-1" /> Pending Review</Badge>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-12">
      <FadeIn>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Tax Refund Applications</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Apply for your annual tax return seamlessly or track the status of your existing claims.
          </p>
        </div>
      </FadeIn>

      <SlideUp>
        <Card className="bg-card border border-border shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="p-5 md:w-2/3">
              <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                Submit a New Tax Refund
              </h2>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed max-w-xl">
                Ready to file for your tax refund? Our fast, secure, and mobile-friendly wizard auto-populates your verified profile information to save you time. Track your application status directly from this dashboard.
              </p>
              <Button onClick={() => navigate("/dashboard/tax-refund/apply")} className="w-full sm:w-auto font-semibold gap-2 shadow-sm">
                Apply Now <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="md:w-1/3 bg-muted/30 p-6 border-t md:border-t-0 md:border-l border-border flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
                <img src="/placeholder.svg" alt="Tax Returns" className="w-48 h-auto relative z-10" />
              </div>
            </div>
          </div>
        </Card>
      </SlideUp>

      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Your Applications</h3>
        
        {loading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No Applications Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">You haven't submitted any tax refund applications.</p>
            <Button onClick={() => navigate("/dashboard/tax-refund/apply")} variant="outline" className="gap-2 border-border text-foreground hover:bg-muted">
              Start an Application <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <StaggerContainer className="space-y-4">
            {applications.map((app) => (
              <StaggerItem key={app.id}>
                <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 w-full sm:w-1/2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          REF: {app.application_number}
                        </span>
                        {getStatusBadge(app.status)}
                      </div>
                      <h4 className="font-semibold text-foreground">{app.tax_refund_program || 'Standard Tax Refund'} - Tax Year {app.tax_year}</h4>
                      <p className="text-xs text-muted-foreground">Submitted on {new Date(app.created_at || "").toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-1/2">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Amount Requested</p>
                        <p className="font-poppins font-bold text-primary text-base sm:text-lg">
                          ${(app.requested_amount || app.estimated_refund_amount || 0).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 shrink-0">
                        View Details <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
