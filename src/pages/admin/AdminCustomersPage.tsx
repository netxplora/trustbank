import { useState, useEffect } from "react";
import { Search, Eye, CheckCircle, XCircle, Edit, Trash2, Save, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FadeIn, SlideUp } from "@/components/public/Motion";

interface Customer {
  id: string;
  user_id: string;
  display_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  mailing_address?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  occupation?: string | null;
  employer_name?: string | null;
  annual_income_range?: string | null;
  source_of_funds?: string | null;
  tax_id?: string | null;
  gov_id_type?: string | null;
  gov_id_number?: string | null;
  preferred_language?: string | null;
  preferred_currency?: string | null;
  email: string | null;
  phone: string | null;
  account_status: string;
  kyc_status: string;
  kyc_tier?: number;
  account_number: string | null;
  role: string | null;
  created_at: string;
  loan_limit?: number;
}

const AdminCustomersPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await (supabase as any).from("profiles").select("*").order("created_at", { ascending: false });
      if (profilesError) throw profilesError;
      
      // Fetch user_roles
      const { data: rolesData, error: rolesError } = await (supabase as any).from("user_roles").select("*");
      if (rolesError) throw rolesError;
      
      const roleMap = new Map();
      if (rolesData) {
        rolesData.forEach((r: any) => roleMap.set(r.user_id, r.role));
      }

      // Process the data to map role to the Customer interface
      const processedData = profilesData?.map((p: any) => ({
        ...p,
        role: roleMap.get(p.user_id) || p.role || "customer"
      }));
      setCustomers((processedData as Customer[]) || []);
    } catch (e: any) {
      toast({ title: "Error Fetching Customers", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (userId: string, status: string) => {
    try {
      // 1. Update profile
      const { error: profileError } = await (supabase as any).from("profiles").update({ account_status: status }).eq("user_id", userId);
      if (profileError) throw profileError;

      // 2. Update accounts
      await (supabase as any).from("accounts").update({ status: status === "suspended" ? "frozen" : "active" }).eq("user_id", userId);

      // 3. Update cards
      await (supabase as any).from("cards").update({ is_frozen: status === "suspended" }).eq("user_id", userId);

      // 4. Log in audit_logs
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: status === "suspended" ? "account_suspended" : "account_activated",
          entity_type: "profiles",
          entity_id: userId,
          details: { new_status: status }
        });
      }

      toast({ title: `Account ${status}`, description: `Account has been ${status === "suspended" ? "suspended" : "reactivated"}.` });
      fetchCustomers();
      if (selectedCustomer) setSelectedCustomer({ ...selectedCustomer, account_status: status });
    } catch (e: any) {
      toast({ title: "Status Update Failed", description: e.message, variant: "destructive" });
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await (supabase as any).from("user_roles").upsert({ user_id: userId, role: newRole });
      if (error) throw error;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "role_updated",
          entity_type: "user_roles",
          entity_id: userId,
          details: { new_role: newRole }
        });
      }

      toast({ title: `Role Updated`, description: `User role changed to ${newRole}` });
      fetchCustomers();
      setSelectedCustomer(prev => prev ? { ...prev, role: newRole } : null);
    } catch (e: any) {
      toast({ title: "Role Update Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleEditSave = async () => {
    if (!selectedCustomer) return;
    try {
      const { id, user_id, created_at, role, account_status, account_number, ...updateData } = editForm as any;
      const { error } = await (supabase as any).from("profiles").update(updateData).eq("user_id", selectedCustomer.user_id);
      if (error) throw error;

      toast({ title: "Profile Updated" });
      setIsEditing(false);
      fetchCustomers();
      setSelectedCustomer({ ...selectedCustomer, ...editForm });
    } catch (e: any) {
      toast({ title: "Update Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    if (!confirm("Are you sure you want to permanently delete this customer? This action cannot be undone.")) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase.rpc as any)("admin_delete_user", {
        p_admin_id: user?.id,
        p_target_user_id: selectedCustomer.user_id
      });
      if (error) {
        if (error.message?.includes("does not exist") || error.code === "PGRST202") {
          throw new Error("The admin_delete_user RPC function is missing. Please run migration 20260703000000_admin_crud_users.sql in your Supabase SQL Editor.");
        }
        throw error;
      }
      toast({ title: "Customer Deleted", description: "Customer account and all associated data have been removed." });
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (e: any) {
      toast({ title: "Deletion Failed", description: e.message, variant: "destructive" });
    }
  };

  const filtered = customers.filter(c => {
    const term = search.toLowerCase();
    return (c.display_name || "").toLowerCase().includes(term) || (c.email || "").toLowerCase().includes(term) || (c.account_number || "").includes(term);
  });

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Customers</h1>
          <p className="text-xs text-muted-foreground font-sans">{customers.length} total verified customers</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button size="sm" onClick={() => alert("To provision a new customer, have the user sign up via the public portal or invite them via the Supabase Auth Admin interface.")} className="font-bold text-xs h-8 rounded-lg">
            <UserPlus className="h-3.5 w-3.5 mr-1" /> Add Customer
          </Button>
          <div className="relative w-full sm:w-56 font-sans">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search clients..." className="pl-8 text-xs h-8 rounded-lg" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <SlideUp>
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/10">
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Customer Profile</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground hidden md:table-cell">Account</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Status & Role</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground hidden lg:table-cell">KYC Verification</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground hidden lg:table-cell">Onboarding Date</th>
                <th className="text-center p-4 text-xs font-semibold font-poppins text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-sm font-semibold text-muted-foreground flex-col items-center">
                    <span className="block text-3xl mb-2 opacity-80">👥</span>
                    Customer accounts will appear here once users begin registering.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-primary hover:bg-muted/10 transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-bold text-foreground">{c.display_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </td>
                  <td className="p-4 text-sm font-semibold text-muted-foreground font-mono hidden md:table-cell">{c.account_number || "—"}</td>
                  <td className="p-4">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${c.account_status === "active" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>{c.account_status}</span>
                    <span className="ml-2 text-[10px] font-bold uppercase text-muted-foreground border border-muted px-2 py-0.5 rounded-sm">{c.role || "customer"}</span>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${c.kyc_status === "approved" ? "bg-success/10 text-success border-success/20" : c.kyc_status === "pending" ? "bg-warning/10 text-warning border-warning/20" : "bg-muted text-muted-foreground border-border"}`}>{c.kyc_status}</span>
                  </td>
                  <td className="p-4 text-xs font-semibold text-muted-foreground hidden lg:table-cell">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => { setSelectedCustomer(c); setIsEditing(false); setEditForm({ ...c }); }}><Eye className="h-4 w-4" /></Button>
                      {c.account_status === "active" ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => updateStatus(c.user_id, "suspended")}><XCircle className="h-4 w-4 text-destructive" /></Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-success/10 hover:text-success transition-colors" onClick={() => updateStatus(c.user_id, "active")}><CheckCircle className="h-4 w-4 text-success" /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
      </SlideUp>

      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-sans">
          <DialogHeader><DialogTitle className="font-poppins">{isEditing ? "Edit Customer Profile" : "Customer Profile"}</DialogTitle></DialogHeader>
          {selectedCustomer && (
            <FadeIn>
            <div className="space-y-4 mt-2">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid grid-cols-4 w-full h-auto mb-4 p-1 bg-muted/40 rounded-lg text-xs">
                  <TabsTrigger value="overview" className="py-1.5 text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
                  <TabsTrigger value="personal" className="py-1.5 text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Personal</TabsTrigger>
                  <TabsTrigger value="address" className="py-1.5 text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Contact</TabsTrigger>
                  <TabsTrigger value="kyc" className="py-1.5 text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">KYC & Financial</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-3 text-sm mt-0">
                    {[
                      { label: "Full Name", value: selectedCustomer.display_name },
                      { label: "Email Address", value: selectedCustomer.email },
                      { label: "Phone Number", value: selectedCustomer.phone },
                      { label: "Primary Account Number", value: selectedCustomer.account_number },
                      { label: "KYC Verification", value: selectedCustomer.kyc_status?.toUpperCase() },
                      { label: "Loan Limit", value: `$${(selectedCustomer.loan_limit || 0).toLocaleString()}` },
                      { label: "Operational Status", value: selectedCustomer.account_status?.toUpperCase() },
                      { label: "Onboarding Date", value: new Date(selectedCustomer.created_at).toLocaleDateString() },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted/30 border rounded-xl p-3 flex justify-between items-center">
                        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                        <p className="font-bold text-foreground text-right">{value || "—"}</p>
                      </div>
                    ))}
                    {!isEditing && (
                      <div className="bg-muted/30 border rounded-xl p-3 flex justify-between items-center mt-4">
                        <p className="text-xs font-semibold text-muted-foreground">Platform Role</p>
                        <select 
                          className="bg-background border rounded-md px-2 py-1 text-xs font-bold uppercase"
                          value={selectedCustomer.role || "customer"}
                          onChange={(e) => updateRole(selectedCustomer.user_id, e.target.value)}
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                    )}
                </TabsContent>

                {isEditing ? (
                  <>
                  <TabsContent value="personal" className="mt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">First Name</Label><Input value={editForm.first_name || ""} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Last Name</Label><Input value={editForm.last_name || ""} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div className="col-span-2"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Display Name</Label><Input value={editForm.display_name || ""} onChange={e => setEditForm(f => ({ ...f, display_name: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Date of Birth</Label><Input type="date" value={editForm.date_of_birth || ""} onChange={e => setEditForm(f => ({ ...f, date_of_birth: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Gender</Label>
                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-2 mt-1 text-xs" value={editForm.gender || ""} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}>
                          <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                        </select>
                      </div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Nationality</Label><Input value={editForm.nationality || ""} onChange={e => setEditForm(f => ({ ...f, nationality: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Pref. Language</Label>
                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-2 mt-1 text-xs" value={editForm.preferred_language || ""} onChange={e => setEditForm(f => ({ ...f, preferred_language: e.target.value }))}>
                          <option value="">Select</option><option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option><option value="de">German</option>
                        </select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="address" className="mt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Email Address</Label><Input value={editForm.email || ""} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Phone Number</Label><Input value={editForm.phone || ""} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div className="col-span-2"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Mailing Address</Label><Input value={editForm.mailing_address || ""} onChange={e => setEditForm(f => ({ ...f, mailing_address: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">City</Label><Input value={editForm.city || ""} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">State/Province</Label><Input value={editForm.state_province || ""} onChange={e => setEditForm(f => ({ ...f, state_province: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Postal Code</Label><Input value={editForm.postal_code || ""} onChange={e => setEditForm(f => ({ ...f, postal_code: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Country</Label><Input value={editForm.country || ""} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                    </div>
                  </TabsContent>

                  <TabsContent value="kyc" className="mt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">KYC Status</Label>
                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-2 mt-1 text-xs font-bold" value={editForm.kyc_status || ""} onChange={e => setEditForm(f => ({ ...f, kyc_status: e.target.value }))}>
                          <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">KYC Tier</Label><Input type="number" value={editForm.kyc_tier || 0} onChange={e => setEditForm(f => ({ ...f, kyc_tier: parseInt(e.target.value) || 0 }))} className="h-8 text-xs mt-1" /></div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Gov ID Type</Label><Input value={editForm.gov_id_type || ""} onChange={e => setEditForm(f => ({ ...f, gov_id_type: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Gov ID Number</Label><Input value={editForm.gov_id_number || ""} onChange={e => setEditForm(f => ({ ...f, gov_id_number: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Tax ID</Label><Input value={editForm.tax_id || ""} onChange={e => setEditForm(f => ({ ...f, tax_id: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Source of Funds</Label><Input value={editForm.source_of_funds || ""} onChange={e => setEditForm(f => ({ ...f, source_of_funds: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Occupation</Label><Input value={editForm.occupation || ""} onChange={e => setEditForm(f => ({ ...f, occupation: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Employer Name</Label><Input value={editForm.employer_name || ""} onChange={e => setEditForm(f => ({ ...f, employer_name: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Annual Income</Label><Input value={editForm.annual_income_range || ""} onChange={e => setEditForm(f => ({ ...f, annual_income_range: e.target.value }))} className="h-8 text-xs mt-1" /></div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Pref. Currency</Label>
                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-2 mt-1 text-xs" value={editForm.preferred_currency || ""} onChange={e => setEditForm(f => ({ ...f, preferred_currency: e.target.value }))}>
                          <option value="">Select</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                        </select>
                      </div>
                      <div><Label className="text-[10px] font-bold uppercase text-muted-foreground">Loan Limit ($)</Label><Input type="number" value={editForm.loan_limit || 0} onChange={e => setEditForm(f => ({ ...f, loan_limit: parseFloat(e.target.value) || 0 }))} className="h-8 text-xs mt-1" /></div>
                    </div>
                  </TabsContent>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button className="flex-1 font-bold h-8 text-xs" onClick={handleEditSave}><Save className="h-3.5 w-3.5 mr-2" /> Save Changes</Button>
                    <Button variant="outline" className="flex-1 h-8 text-xs" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                  </>
                ) : (
                  <>
                  <TabsContent value="personal" className="space-y-2 mt-0">
                    {[
                      { label: "First Name", value: selectedCustomer.first_name },
                      { label: "Last Name", value: selectedCustomer.last_name },
                      { label: "Display Name", value: selectedCustomer.display_name },
                      { label: "Date of Birth", value: selectedCustomer.date_of_birth },
                      { label: "Gender", value: selectedCustomer.gender },
                      { label: "Nationality", value: selectedCustomer.nationality },
                      { label: "Preferred Language", value: selectedCustomer.preferred_language }
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted/30 border border-border/50 rounded-lg p-2.5 flex justify-between items-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                        <p className="font-semibold text-foreground text-xs text-right">{value || "—"}</p>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="address" className="space-y-2 mt-0">
                    {[
                      { label: "Email Address", value: selectedCustomer.email },
                      { label: "Phone Number", value: selectedCustomer.phone },
                      { label: "Mailing Address", value: selectedCustomer.mailing_address },
                      { label: "City", value: selectedCustomer.city },
                      { label: "State/Province", value: selectedCustomer.state_province },
                      { label: "Postal Code", value: selectedCustomer.postal_code },
                      { label: "Country", value: selectedCustomer.country }
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted/30 border border-border/50 rounded-lg p-2.5 flex justify-between items-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                        <p className="font-semibold text-foreground text-xs text-right truncate max-w-[200px]">{value || "—"}</p>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="kyc" className="space-y-2 mt-0">
                    {[
                      { label: "KYC Status", value: selectedCustomer.kyc_status },
                      { label: "KYC Tier", value: selectedCustomer.kyc_tier },
                      { label: "Gov ID Type", value: selectedCustomer.gov_id_type },
                      { label: "Gov ID Number", value: selectedCustomer.gov_id_number },
                      { label: "Tax ID", value: selectedCustomer.tax_id },
                      { label: "Source of Funds", value: selectedCustomer.source_of_funds },
                      { label: "Occupation", value: selectedCustomer.occupation },
                      { label: "Employer Name", value: selectedCustomer.employer_name },
                      { label: "Annual Income", value: selectedCustomer.annual_income_range },
                      { label: "Pref. Currency", value: selectedCustomer.preferred_currency },
                      { label: "Loan Limit ($)", value: selectedCustomer.loan_limit }
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted/30 border border-border/50 rounded-lg p-2.5 flex justify-between items-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                        <p className="font-semibold text-foreground text-xs text-right truncate max-w-[200px]">{value !== undefined && value !== null && value !== "" ? String(value) : "—"}</p>
                      </div>
                    ))}
                  </TabsContent>

                  <div className="flex justify-between mt-6 gap-2">
                    <Button variant="outline" className="font-bold h-8 text-xs" onClick={() => setIsEditing(true)}>
                      <Edit className="h-3.5 w-3.5 mr-2" /> Edit Details
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant={selectedCustomer.account_status === "active" ? "destructive" : "default"} 
                        className="font-bold h-8 text-xs"
                        onClick={() => updateStatus(selectedCustomer.user_id, selectedCustomer.account_status === "active" ? "suspended" : "active")}
                      >
                        {selectedCustomer.account_status === "active" ? "Suspend" : "Activate"}
                      </Button>
                      <Button variant="destructive" className="font-bold h-8 w-8 p-0" onClick={handleDelete}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  </>
                )}
              </Tabs>
            </div>
            </FadeIn>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomersPage;
