import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Plus, CheckCircle2, Calendar, DollarSign, FileText, ArrowUpRight, Activity, Zap, FileSpreadsheet, Search, Filter, HelpCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { StaggerContainer, StaggerItem, SlideUp } from "@/components/public/Motion";
import { getGrantPrograms, getUserGrantApplications, submitGrantApplication, GrantProgram, GrantApplication } from "@/services/grantsService";
import { supabase } from "@/integrations/supabase/client";

const statusColor = (status: string) => {
  switch (status) {
    case "approved":
    case "awarded":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
    case "under_review":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
    case "rejected":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400";
    default:
      return "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400";
  }
};

export default function GrantsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [programs, setPrograms] = useState<GrantProgram[]>([]);
  const [applications, setApplications] = useState<GrantApplication[]>([]);
  const [, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<GrantProgram | null>(null);
  const [eligibilityModalOpen, setEligibilityModalOpen] = useState(false);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("user-grants-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "grant_programs" },
        () => {
          loadPrograms();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "grant_applications" },
        () => {
          if (user?.id) loadApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadPrograms(), loadApplications()]);
    setLoading(false);
  };

  const loadPrograms = async () => {
    const progList = await getGrantPrograms();
    setPrograms(progList);
  };

  const loadApplications = async () => {
    if (!user?.id) return;
    const appList = await getUserGrantApplications(user.id);
    setApplications(appList);
  };

  const navigate = useNavigate();

  const handleApplyClick = (program: GrantProgram) => {
    const alreadyApplied = applications.some(app => app.grant_program_id === program.id && app.status !== 'closed' && app.status !== 'rejected');
    if (alreadyApplied) {
      toast({ 
        title: "Application Exists", 
        description: "You have an active application for this specific grant program.", 
        variant: "destructive" 
      });
      return;
    }

    navigate('/dashboard/grants/apply', { state: { programId: program.id } });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const activeAppsCount = applications.filter(a => a.status === 'submitted' || a.status === 'under_review').length;
  const totalAwarded = applications.filter(a => a.status === 'awarded' || a.status === 'approved').reduce((sum, a) => sum + Number(a.requested_amount), 0);

  return (
    <div className="space-y-5 font-sans max-w-6xl mx-auto px-1 sm:px-4 py-2">
      {/* 1. Header Section */}
      <SlideUp>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-primary/95 to-slate-900 p-4 sm:p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/10 text-white border-white/20 text-[10px] font-bold tracking-wider uppercase">
                <ShieldCheck className="h-3 w-3 mr-1 text-emerald-400" /> Verified Funding Hub
              </Badge>
            </div>
            <h1 className="font-poppins text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              Grants & Relief Portal
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-normal">
              Direct capital disbursement for qualifying business proposals and emergency relief initiatives.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2 self-start sm:self-auto pt-2 sm:pt-0">
            <Button
              onClick={() => setEligibilityModalOpen(true)}
              size="sm"
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs font-semibold h-8 rounded-xl backdrop-blur-md"
            >
              <HelpCircle className="h-3.5 w-3.5 mr-1.5" /> Criteria Guide
            </Button>
          </div>
        </div>
      </SlideUp>

      {/* 2. Compact Overview Stats */}
      <SlideUp delay={0.05}>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
          <Card className="rounded-xl border-border/60 shadow-sm bg-card hover:border-primary/30 transition-all">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Active Applications</p>
                <p className="font-poppins text-lg font-bold text-foreground leading-tight">
                  {activeAppsCount}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-xl border-border/60 shadow-sm bg-card hover:border-emerald-500/30 transition-all">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Award className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Total Awarded</p>
                <p className="font-poppins text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                  ${totalAwarded.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SlideUp>

      {/* 3. QUICK ACTIONS SECTION (Placed BEFORE Grant Campaigns) */}
      <SlideUp delay={0.1}>
        <div className="bg-muted/40 border border-border/60 rounded-2xl p-3 sm:p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-poppins text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" /> Quick Actions
            </h2>
            <span className="text-[11px] text-muted-foreground font-medium">Fast Operations</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => scrollToSection("grant-campaigns-section")}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">Browse Grants</p>
                <p className="text-[10px] text-muted-foreground truncate">View active pools</p>
              </div>
            </button>

            <button
              onClick={() => scrollToSection("application-history-section")}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
            >
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground group-hover:text-blue-600 transition-colors truncate">Track History</p>
                <p className="text-[10px] text-muted-foreground truncate">Check review status</p>
              </div>
            </button>

            <button
              onClick={() => setEligibilityModalOpen(true)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
            >
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground group-hover:text-amber-600 transition-colors truncate">Check Criteria</p>
                <p className="text-[10px] text-muted-foreground truncate">Grant rules & FAQ</p>
              </div>
            </button>

            <button
              onClick={() => {
                if (programs.length > 0) {
                  handleApplyClick(programs[0]);
                } else {
                  toast({ title: "No Programs Available", description: "Please wait while campaigns load.", variant: "destructive" });
                }
              }}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-border/50 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-left group"
            >
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Plus className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground group-hover:text-emerald-600 transition-colors truncate">Apply Now</p>
                <p className="text-[10px] text-muted-foreground truncate">Submit proposal</p>
              </div>
            </button>
          </div>
        </div>
      </SlideUp>

      {/* 4. GRANT CAMPAIGN SECTION (Placed AFTER Quick Actions) */}
      <div id="grant-campaigns-section" className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="font-poppins text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" /> Active Grant Campaigns
          </h2>
          <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground">
            {programs.length} Available
          </Badge>
        </div>

        {programs.length > 0 ? (
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
            {programs.map((program) => (
              <StaggerItem key={program.id}>
                <Card className="rounded-xl border-border/60 shadow-sm flex flex-col justify-between h-full overflow-hidden hover:border-primary/40 transition-all bg-card group">
                  <div>
                    {program.image_url && (
                      <div className="h-20 sm:h-32 w-full overflow-hidden relative">
                        <img 
                          src={program.image_url} 
                          alt={program.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-center text-white">
                          <Badge className="bg-black/40 text-white backdrop-blur-md border-white/20 text-[8px] sm:text-[9px] font-semibold uppercase px-1 py-0">
                            {program.category}
                          </Badge>
                          <Badge className="bg-emerald-600 text-white font-bold font-poppins text-[8px] sm:text-[10px] px-1.5 py-0.5 shadow-sm">
                            ${program.funding_amount.toLocaleString()} Pool
                          </Badge>
                        </div>
                      </div>
                    )}

                    <CardHeader className="p-2 sm:p-3.5 pb-1">
                      {!program.image_url && (
                        <div className="flex justify-between items-start mb-1">
                          <Badge variant="secondary" className="text-[8px] sm:text-[9px] font-semibold uppercase">{program.category}</Badge>
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] sm:text-xs">${program.funding_amount.toLocaleString()}</Badge>
                        </div>
                      )}
                      <CardTitle className="font-poppins text-[11px] sm:text-sm font-bold group-hover:text-primary transition-colors leading-tight line-clamp-2">
                        {program.title}
                      </CardTitle>
                      <CardDescription className="text-[10px] sm:text-[11px] line-clamp-2 mt-0.5 leading-normal">
                        {program.description}
                      </CardDescription>
                    </CardHeader>
                  </div>

                  <CardContent className="p-2 sm:p-3.5 space-y-1.5 sm:space-y-2.5 pt-0">
                    <div className="bg-muted/40 p-1.5 sm:p-2.5 rounded-lg text-[9px] sm:text-[11px] space-y-0.5 border border-border/40">
                      <span className="font-semibold text-foreground text-[8px] sm:text-[10px] uppercase tracking-wider block">Eligibility</span>
                      <p className="text-muted-foreground line-clamp-2 leading-tight">{program.eligibility_criteria}</p>
                    </div>

                    <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1 text-[8px] sm:text-[10px]"><Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" /> Deadline:</span>
                      <span className="font-semibold text-foreground text-[9px] sm:text-[11px]">{new Date(program.deadline).toLocaleDateString()}</span>
                    </div>

                    <Button onClick={() => handleApplyClick(program)} size="sm" className="w-full h-7 sm:h-8 rounded-lg font-bold text-[10px] sm:text-xs gap-1 shadow-sm">
                      Apply Now <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="text-center py-10 border border-dashed rounded-xl bg-muted/20">
            <Sparkles className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">No active campaigns</p>
            <p className="text-xs text-muted-foreground mt-1">Check back later for new grant pools.</p>
          </div>
        )}
      </div>

      {/* 5. APPLICATION HISTORY SECTION */}
      <div id="application-history-section" className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="font-poppins text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Application Activity Log
          </h2>
          <Badge variant="secondary" className="text-[10px] font-semibold">
            {applications.length} Submitted
          </Badge>
        </div>

        <Card className="rounded-xl border-border/60 shadow-sm overflow-hidden bg-card">
          <CardContent className="p-0">
            {applications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs flex flex-col items-center">
                <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="font-semibold text-foreground">No applications found</p>
                <p className="text-[11px]">Select a program above to submit your proposal.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {applications.map((app) => (
                  <div key={app.id || app.application_number} className="p-3.5 sm:p-4 hover:bg-muted/20 transition-colors group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      {/* Left: Application Info */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-poppins font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors truncate">
                            {app.project_title}
                          </span>
                          <Badge className={`${statusColor(app.status)} uppercase text-[9px] font-bold px-1.5 py-0 border`}>
                            {app.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.2 rounded">
                            {app.application_number}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1 leading-normal">
                          {app.proposal_summary}
                        </p>
                      </div>

                      {/* Right: Amount Requested */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border/30 shrink-0">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase sm:hidden">Requested</span>
                        <span className="font-poppins font-bold text-sm sm:text-base text-primary">
                          ${Number(app.requested_amount).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Admin Feedback Box */}
                    {app.admin_feedback && (
                      <div className="mt-2.5 bg-primary/5 border border-primary/15 p-2.5 rounded-lg flex gap-2.5 items-start text-xs">
                        <Award className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Admin Decision Feedback</p>
                          <p className="text-xs text-foreground/90 mt-0.5 leading-relaxed">{app.admin_feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 7. Criteria & Guidelines Info Modal */}
      <Dialog open={eligibilityModalOpen} onOpenChange={setEligibilityModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl p-5 border-border/60">
          <DialogHeader>
            <DialogTitle className="font-poppins text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Grant Criteria & Rules
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review submission guidelines before submitting your proposal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-muted/40 rounded-xl space-y-1.5 border border-border/40">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Qualification
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Applicants must be registered account holders with active account status.
              </p>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl space-y-1.5 border border-border/40">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-primary" /> Direct Account Disbursement
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Approved grants automatically dispense the exact awarded amount directly to your savings account upon final admin decision.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => setEligibilityModalOpen(false)} className="w-full rounded-lg font-bold text-xs h-8">
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

