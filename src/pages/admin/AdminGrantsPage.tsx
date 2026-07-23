import React, { useState, useEffect } from "react";
import { Award, Plus, Eye, Trash2, Search, Users, DollarSign, Download, FileSpreadsheet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SlideUp, StaggerContainer, StaggerItem } from "@/components/public/Motion";
import {
  getGrantPrograms,
  createGrantProgram,
  updateGrantProgram,
  deleteGrantProgram,
  getAllGrantApplications,
  updateGrantApplicationStatus,
  deleteGrantApplication,
  DEFAULT_GRANT_PROGRAMS,
  GrantProgram,
  GrantApplication,
} from "@/services/grantsService";
import { supabase } from "@/integrations/supabase/client";

const APP_STATUS_OPTIONS: GrantApplication["status"][] = [
  "draft",
  "submitted",
  "under_review",
  "info_required",
  "approved",
  "rejected",
  "processed",
  "closed"
];

const statusColor = (status: string) => {
  switch (status) {
    case "approved":
    case "awarded":
      return "bg-success/10 text-success border-success/20";
    case "under_review":
      return "bg-warning/10 text-warning border-warning/20";
    case "rejected":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function AdminGrantsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"programs" | "applications">("programs");

  // Programs state
  const [programs, setPrograms] = useState<GrantProgram[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [programDialogOpen, setProgramDialogOpen] = useState(false);

  // Program form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Small Business");
  const [fundingAmount, setFundingAmount] = useState("");
  const [description, setDescription] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [deadline, setDeadline] = useState("2026-12-31");
  const [imageUrl, setImageUrl] = useState("");

  // Applications state
  const [applications, setApplications] = useState<GrantApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("all");

  // Application detail dialog
  const [selectedApp, setSelectedApp] = useState<GrantApplication | null>(null);
  const [appDetailOpen, setAppDetailOpen] = useState(false);
  const [newAppStatus, setNewAppStatus] = useState<GrantApplication["status"]>("submitted");
  const [adminFeedback, setAdminFeedback] = useState("");
  const [updatingApp, setUpdatingApp] = useState(false);

  useEffect(() => {
    loadPrograms();
    loadApplications();

    const channel = supabase
      .channel("admin-grants-sync")
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
          loadApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPrograms = async () => {
    setLoadingPrograms(true);
    const data = await getGrantPrograms();
    setPrograms(data);
    setLoadingPrograms(false);
  };

  const loadApplications = async () => {
    setLoadingApps(true);
    const data = await getAllGrantApplications();
    setApplications(data);
    setLoadingApps(false);
  };

  const handleSeedPrograms = async () => {
    setLoadingPrograms(true);
    for (const prog of DEFAULT_GRANT_PROGRAMS) {
      await createGrantProgram(prog);
    }
    toast({ title: "Default Campaigns Initialized", description: "Standard grant programs have been published to the database." });
    await loadPrograms();
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createGrantProgram({
      title,
      category,
      description,
      funding_amount: parseFloat(fundingAmount) || 10000,
      eligibility_criteria: eligibility,
      deadline,
      status: "active",
      image_url: imageUrl || undefined,
    });

    if (success) {
      toast({ title: "Grant Program Created", description: `"${title}" has been published.` });
      setProgramDialogOpen(false);
      resetProgramForm();
      loadPrograms();
    } else {
      toast({ title: "Creation Failed", description: "Could not create the grant program.", variant: "destructive" });
    }
  };

  const resetProgramForm = () => {
    setTitle("");
    setCategory("Small Business");
    setFundingAmount("");
    setDescription("");
    setEligibility("");
    setDeadline("2026-12-31");
    setImageUrl("");
  };

  const handleDeleteProgram = async (id: string, programTitle: string) => {
    if (!confirm(`Delete grant program "${programTitle}"? This cannot be undone.`)) return;
    const success = await deleteGrantProgram(id);
    if (success) {
      toast({ title: "Program Deleted", description: `"${programTitle}" has been removed.` });
      loadPrograms();
    } else {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  const handleToggleProgramStatus = async (program: GrantProgram) => {
    const newStatus = program.status === "active" ? "closed" : "active";
    const success = await updateGrantProgram(program.id, { status: newStatus });
    if (success) {
      toast({ title: "Status Updated", description: `"${program.title}" is now ${newStatus}.` });
      loadPrograms();
    }
  };

  // Application handlers
  const openAppDetail = (app: GrantApplication) => {
    setSelectedApp(app);
    setNewAppStatus(app.status);
    setAdminFeedback(app.admin_feedback || "");
    setAppDetailOpen(true);
  };

  const handleUpdateAppStatus = async () => {
    if (!selectedApp?.id) return;
    setUpdatingApp(true);
    const success = await updateGrantApplicationStatus(selectedApp.id, newAppStatus, adminFeedback);
    setUpdatingApp(false);

    if (success) {
      toast({ title: "Application Updated", description: `${selectedApp.application_number} status changed to "${newAppStatus}".` });
      setAppDetailOpen(false);
      loadApplications();
    } else {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  const handleDeleteApp = async (id: string, appNumber: string) => {
    if (!confirm(`Delete application ${appNumber}?`)) return;
    const success = await deleteGrantApplication(id);
    if (success) {
      toast({ title: "Application Deleted" });
      loadApplications();
    }
  };

  const handleExportCsv = () => {
    if (filteredApps.length === 0) {
      toast({ title: "No data", description: "No applications to export." });
      return;
    }

    const headers = ["Application Number", "Project Title", "Requested Amount", "Applicant", "Program", "Status", "Date Submitted"];
    const rows = filteredApps.map(app => [
      app.application_number,
      `"${app.project_title.replace(/"/g, '""')}"`,
      app.requested_amount,
      `"${(app.profiles?.display_name || "Unknown").replace(/"/g, '""')}"`,
      `"${(app.grant_program?.title || "Unknown").replace(/"/g, '""')}"`,
      app.status,
      app.created_at ? new Date(app.created_at).toLocaleDateString() : ""
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Grant_Applications_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch = searchQuery === "" ||
      app.application_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.profiles?.display_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = appStatusFilter === "all" || app.status === appStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalProgramFunding = programs.reduce((s, p) => s + p.funding_amount, 0);
  const activePrograms = programs.filter(p => p.status === "active").length;
  const pendingApps = applications.filter(a => a.status === "submitted" || a.status === "under_review").length;
  const awardedApps = applications.filter(a => a.status === "approved" || a.status === "awarded").length;

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <SlideUp>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="font-poppins text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Grants Management
            </h1>
            <p className="text-xs text-muted-foreground">
              Create funding programs, review applications, and manage grant awards.
            </p>
          </div>

          <Dialog open={programDialogOpen} onOpenChange={setProgramDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 rounded-lg font-bold text-xs h-8">
                <Plus className="h-3.5 w-3.5" /> Create Grant Program
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-xl font-sans">
              <DialogHeader>
                <DialogTitle className="font-poppins text-base font-bold">Create New Grant Program</DialogTitle>
                <DialogDescription className="text-xs">
                  Define grant title, category, funding pool, and eligibility criteria.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateProgram} className="space-y-3 py-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Program Title</label>
                  <Input
                    type="text"
                    placeholder="e.g. Enterprise Modernization Grant"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                    <select
                      className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Small Business">Small Business</option>
                      <option value="Sustainability">Sustainability</option>
                      <option value="Community">Community</option>
                      <option value="Innovation">Innovation</option>
                      <option value="Education">Education</option>
                      <option value="Healthcare">Healthcare</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Funding Pool ($)</label>
                    <Input
                      type="number"
                      placeholder="10000"
                      value={fundingAmount}
                      onChange={(e) => setFundingAmount(e.target.value)}
                      className="h-8 text-xs rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                  <Textarea
                    placeholder="Provide overview of the funding program..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-lg min-h-[60px] text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Eligibility Criteria</label>
                  <Textarea
                    placeholder="Requirements applicants must satisfy..."
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    className="rounded-lg min-h-[60px] text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Banner (URL)</label>
                  <Input
                    type="url"
                    placeholder="https://images.unsplash.com/... or paste image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="h-8 text-xs rounded-lg"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[9px] text-muted-foreground font-bold">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setImageUrl("https://images.unsplash.com/photo-1664575602276-acd073f104c1?w=800&auto=format&fit=crop&q=60")}
                      className="text-[9px] bg-muted hover:bg-primary hover:text-primary-foreground px-1.5 py-0.5 rounded font-semibold transition-colors"
                    >
                      Business
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl("https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=60")}
                      className="text-[9px] bg-muted hover:bg-primary hover:text-primary-foreground px-1.5 py-0.5 rounded font-semibold transition-colors"
                    >
                      Sustainability
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl("https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=60")}
                      className="text-[9px] bg-muted hover:bg-primary hover:text-primary-foreground px-1.5 py-0.5 rounded font-semibold transition-colors"
                    >
                      Tech & AI
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Application Deadline</label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="h-8 text-xs rounded-lg"
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" className="w-full h-9 rounded-lg text-xs font-bold">
                    Publish Grant Program
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </SlideUp>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StaggerItem>
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardContent className="p-3.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Programs</p>
              <p className="font-poppins text-xl font-bold text-foreground mt-0.5">{activePrograms}</p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardContent className="p-3.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Funding Pool</p>
              <p className="font-poppins text-xl font-bold text-primary mt-0.5">${totalProgramFunding.toLocaleString()}</p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardContent className="p-3.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pending Apps</p>
              <p className="font-poppins text-xl font-bold text-warning mt-0.5">{pendingApps}</p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardContent className="p-3.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Awarded</p>
              <p className="font-poppins text-xl font-bold text-success mt-0.5">{awardedApps}</p>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Tab Toggle */}
      <div className="flex gap-2 border-b border-border/50 pb-1 text-xs">
        <button
          onClick={() => setActiveTab("programs")}
          className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors ${activeTab === "programs" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Grant Programs ({programs.length})
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors ${activeTab === "applications" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Applications ({applications.length})
        </button>
      </div>

      {/* Programs Tab */}
      {activeTab === "programs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {loadingPrograms ? (
            <div className="col-span-2 py-8 text-center text-muted-foreground text-xs">Loading programs...</div>
          ) : programs.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-muted-foreground text-xs space-y-3">
              <p>No grant programs created in the database yet.</p>
              <div className="flex justify-center gap-2">
                <Button size="sm" onClick={() => setProgramDialogOpen(true)} className="rounded-lg text-xs font-bold gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Create Custom Grant
                </Button>
                <Button size="sm" onClick={handleSeedPrograms} variant="outline" className="rounded-lg text-xs font-bold gap-1.5">
                  <Award className="h-3.5 w-3.5 text-primary" /> Initialize Default Campaigns
                </Button>
              </div>
            </div>
          ) : programs.map((program) => (
            <Card key={program.id} className="rounded-xl border-border/60 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                {program.image_url && (
                  <div className="h-28 w-full overflow-hidden relative">
                    <img src={program.image_url} alt={program.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-2 left-2.5 right-2.5 flex justify-between items-center text-white">
                      <Badge className="bg-white/20 text-white backdrop-blur-md border-white/30 text-[9px] font-bold uppercase px-1.5 py-0.5">{program.category}</Badge>
                      <Badge className="bg-success/90 text-success-foreground font-bold text-xs font-poppins">${program.funding_amount.toLocaleString()} Pool</Badge>
                    </div>
                  </div>
                )}
                <CardHeader className="p-3.5 pb-2">
                  {!program.image_url && (
                    <div className="flex justify-between items-start mb-1.5">
                      <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5">{program.category}</Badge>
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-success/10 text-success border-success/20 font-bold text-xs">${program.funding_amount.toLocaleString()}</Badge>
                        <Badge className={`font-bold text-[9px] uppercase px-1.5 py-0.5 ${program.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{program.status}</Badge>
                      </div>
                    </div>
                  )}
                  <CardTitle className="font-poppins text-sm font-bold">{program.title}</CardTitle>
                  <CardDescription className="text-xs mt-0.5 line-clamp-2">{program.description}</CardDescription>
                </CardHeader>
              </div>
              <CardContent className="p-3.5 pt-0 space-y-2">
                <div className="bg-muted/30 p-2 rounded-lg text-[11px]">
                  <span className="font-bold text-foreground">Eligibility: </span>
                  <span className="text-muted-foreground line-clamp-2">{program.eligibility_criteria}</span>
                </div>

                <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1.5 border-t border-border/40">
                  <span>Deadline: {new Date(program.deadline).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-7 rounded-lg" onClick={() => handleToggleProgramStatus(program)}>
                    {program.status === "active" ? "Close Program" : "Reopen Program"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7 w-7 p-0 rounded-lg text-destructive hover:text-destructive shrink-0" onClick={() => handleDeleteProgram(program.id, program.title)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === "applications" && (
        <Card className="rounded-xl border-border/60 shadow-sm">
          <CardHeader className="p-3.5 pb-2">
            <CardTitle className="font-poppins text-sm font-bold">Grant Applications Queue</CardTitle>
            <CardDescription className="text-xs">Review and manage user grant submissions.</CardDescription>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 space-y-3">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search project title, application number, or applicant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-lg"
                />
              </div>
              <select
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary min-w-[140px]"
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                {APP_STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 text-xs font-bold whitespace-nowrap" onClick={handleExportCsv}>
                <Download className="h-3.5 w-3.5 text-primary" />
                Export CSV
              </Button>
            </div>

            {loadingApps ? (
              <div className="py-8 text-center text-muted-foreground text-xs">Loading applications...</div>
            ) : filteredApps.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">No grant applications found.</div>
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden bg-background">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-bold text-xs p-2.5">App Ref</TableHead>
                      <TableHead className="font-bold text-xs p-2.5">Project</TableHead>
                      <TableHead className="font-bold text-xs p-2.5">Applicant</TableHead>
                      <TableHead className="font-bold text-xs p-2.5">Amount</TableHead>
                      <TableHead className="font-bold text-xs p-2.5">Status</TableHead>
                      <TableHead className="font-bold text-xs p-2.5 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {filteredApps.map((app) => (
                      <TableRow key={app.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium text-xs text-muted-foreground font-mono">{app.application_number}</TableCell>
                        <TableCell>
                          <p className="font-poppins font-bold text-sm text-foreground">{app.project_title}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{app.grant_program?.title}</p>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{app.profiles?.display_name || "Unknown"}</TableCell>
                        <TableCell className="font-poppins font-bold text-primary">${app.requested_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={`${statusColor(app.status)} text-[10px] font-bold uppercase whitespace-nowrap`}>
                            {app.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg" onClick={() => openAppDetail(app)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => handleDeleteApp(app.id!, app.application_number)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Application Detail Dialog */}
      <Dialog open={appDetailOpen} onOpenChange={setAppDetailOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-border/50">
            <div className="flex justify-between items-start pr-6">
              <div>
                <DialogTitle className="font-poppins text-2xl font-bold text-foreground">Review Application</DialogTitle>
                <DialogDescription className="text-sm mt-1">Ref: <span className="font-mono text-primary font-bold">{selectedApp?.application_number}</span></DialogDescription>
              </div>
              {selectedApp && (
                <Badge className={`${statusColor(selectedApp.status)} text-xs font-bold uppercase px-3 py-1 rounded-full`}>
                  {selectedApp.status.replace("_", " ")}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6 py-4">
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Title</p>
                  <p className="font-semibold text-foreground text-sm">{selectedApp.project_title}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Requested Amount</p>
                  <p className="font-poppins font-bold text-primary text-xl">${selectedApp.requested_amount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Business Name</p>
                  <p className="font-semibold text-foreground text-sm">{selectedApp.business_name || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Industry / Sector</p>
                  <p className="font-semibold text-foreground text-sm">{selectedApp.industry || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Business Type</p>
                  <p className="font-semibold text-foreground text-sm">{selectedApp.business_type || "N/A"} ({selectedApp.year_started || "N/A"})</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Applicant</p>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {(selectedApp.profiles?.display_name || "U")[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <p className="font-semibold text-foreground text-sm leading-tight">{selectedApp.profiles?.display_name || "Unknown"}</p>
                      {selectedApp.profiles?.email && (
                        <p className="text-[10px] text-muted-foreground">{selectedApp.profiles.email}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Grant Program</p>
                  <p className="font-semibold text-foreground text-sm truncate" title={selectedApp.grant_program?.title || ""}>{selectedApp.grant_program?.title || "—"}</p>
                </div>
              </div>

              {/* Proposal Summary */}
              <div className="bg-muted/30 border border-border/50 p-4 rounded-xl space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <FileSpreadsheet className="h-3 w-3" /> Proposal Summary
                </p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedApp.proposal_summary}</p>
              </div>

              {/* Attached Documents */}
              {selectedApp.documents && selectedApp.documents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attached Documents</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                        <div className="overflow-hidden">
                          <p className="text-xs font-medium text-foreground truncate">{doc.name}</p>
                          <p className="text-[9px] text-muted-foreground">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Update Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-background border border-border/50 p-4 rounded-xl shadow-sm">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Update Status</label>
                  <select
                    className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                    value={newAppStatus}
                    onChange={(e) => setNewAppStatus(e.target.value as GrantApplication["status"])}
                  >
                    {APP_STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground">Select the new state for this application.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Admin Feedback</label>
                  <Textarea
                    placeholder="Provide feedback to the applicant..."
                    value={adminFeedback}
                    onChange={(e) => setAdminFeedback(e.target.value)}
                    className="rounded-xl min-h-[100px] resize-none text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">This feedback will be visible to the applicant.</p>
                </div>
              </div>

              <DialogFooter className="gap-3 sm:gap-0 pt-4 border-t border-border/50">
                <div className="flex w-full justify-between items-center">
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => {
                    setAppDetailOpen(false);
                    handleDeleteApp(selectedApp.id!, selectedApp.application_number);
                  }}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete App
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setAppDetailOpen(false)} className="rounded-xl">Cancel</Button>
                    <Button onClick={handleUpdateAppStatus} disabled={updatingApp} className="rounded-xl font-bold shadow-md shadow-primary/20">
                      {updatingApp ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
