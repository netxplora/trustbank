import { useState, useEffect } from "react";
import { Search, Eye, CheckCircle, XCircle, Edit, Trash2, Save, UserPlus } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { Label } from "@trustbank/shared-ui/components/ui/label";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@trustbank/shared-ui/components/ui/dialog";
import { FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";

interface Customer {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  account_status: string;
  kyc_status: string;
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
  const [editForm, setEditForm] = useState({ display_name: "", email: "", phone: "", kyc_status: "pending", loan_limit: 0 });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await (supabase as any).from("profiles").select("id, user_id, display_name, email, phone, account_number, kyc_status, account_status, created_at, loan_limit").order("created_at", { ascending: false });
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
          action: status === "suspended" ? "portfolio_suspended" : "portfolio_activated",
          entity_type: "profiles",
          entity_id: userId,
          details: { new_status: status }
        });
      }

      toast({ title: `Account ${status}`, description: `Portfolio has been ${status === "suspended" ? "frozen" : "reactivated"}.` });
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
      const { error } = await (supabase as any).from("profiles").update({
        display_name: editForm.display_name,
        email: editForm.email,
        phone: editForm.phone,
        kyc_status: editForm.kyc_status,
        loan_limit: editForm.loan_limit
      }).eq("user_id", selectedCustomer.user_id);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">Private Client Roster</h1>
          <p className="text-sm text-muted-foreground font-sans">{customers.length} total verified profiles</p>
        </div>
        <Button onClick={() => alert("To provision a new customer, have the user sign up via the public portal or invite them via the Supabase Auth Admin interface.")} className="font-bold sm:mr-4">
          <UserPlus className="h-4 w-4 mr-2" /> Add Customer
        </Button>
        <div className="relative w-full sm:w-64 font-sans">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <SlideUp>
      <div className="bg-card rounded-xl border overflow-hidden shadow-sm hover-lift">
        <div className="overflow-x-auto">
          <table className="w-full font-sans">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Client Profile</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground hidden md:table-cell">Primary Account</th>
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
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${c.account_status === "active" ? "bg-success/10 text-success border-emerald-100" : "bg-destructive/10 text-destructive border-red-100"}`}>{c.account_status}</span>
                    <span className="ml-2 text-[10px] font-bold uppercase text-muted-foreground border border-muted px-2 py-0.5 rounded-sm">{c.role || "customer"}</span>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${c.kyc_status === "approved" ? "bg-success/10 text-success border-emerald-100" : c.kyc_status === "pending" ? "bg-warning/10 text-warning border-amber-100" : "bg-muted text-muted-foreground border-border"}`}>{c.kyc_status}</span>
                  </td>
                  <td className="p-4 text-xs font-semibold text-muted-foreground hidden lg:table-cell">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => { setSelectedCustomer(c); setIsEditing(false); setEditForm({ display_name: c.display_name || "", email: c.email || "", phone: c.phone || "", kyc_status: c.kyc_status || "pending", loan_limit: c.loan_limit || 0 }); }}><Eye className="h-4 w-4" /></Button>
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
        <DialogContent className="max-w-md font-sans">
          <DialogHeader><DialogTitle className="font-poppins">{isEditing ? "Edit Client Profile" : "Client Profile Details"}</DialogTitle></DialogHeader>
          {selectedCustomer && (
            <FadeIn>
            <div className="space-y-4 mt-4">
              {isEditing ? (
                <>
                  <div>
                    <Label className="text-xs font-semibold">Full Name</Label>
                    <Input value={editForm.display_name} onChange={e => setEditForm(f => ({ ...f, display_name: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Email Address</Label>
                    <Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Phone Number</Label>
                    <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">KYC Status</Label>
                    <select 
                      className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editForm.kyc_status}
                      onChange={e => setEditForm(f => ({ ...f, kyc_status: e.target.value }))}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Loan Limit ($)</Label>
                    <Input type="number" value={editForm.loan_limit} onChange={e => setEditForm(f => ({ ...f, loan_limit: parseFloat(e.target.value) || 0 }))} className="mt-1" />
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button className="flex-1 font-bold" onClick={handleEditSave}><Save className="h-4 w-4 mr-2" /> Save Changes</Button>
                    <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: "Full Name", value: selectedCustomer.display_name },
                      { label: "Email Address", value: selectedCustomer.email },
                      { label: "Phone Number", value: selectedCustomer.phone },
                      { label: "Primary Account Number", value: selectedCustomer.account_number },
                      { label: "KYC Verification", value: selectedCustomer.kyc_status.toUpperCase() },
                      { label: "Loan Limit", value: `$${(selectedCustomer.loan_limit || 0).toLocaleString()}` },
                      { label: "Operational Status", value: selectedCustomer.account_status.toUpperCase() },
                      { label: "Onboarding Date", value: new Date(selectedCustomer.created_at).toLocaleDateString() },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted/30 border rounded-lg p-3 flex justify-between items-center">
                        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                        <p className="font-bold text-foreground text-right">{value || "—"}</p>
                      </div>
                    ))}
                    <div className="bg-muted/30 border rounded-lg p-3 flex justify-between items-center mt-4">
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
                  </div>
                  <div className="flex justify-between mt-6 gap-2">
                    <Button variant="outline" className="font-bold" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant={selectedCustomer.account_status === "active" ? "destructive" : "default"} 
                        className="font-bold"
                        onClick={() => updateStatus(selectedCustomer.user_id, selectedCustomer.account_status === "active" ? "suspended" : "active")}
                      >
                        {selectedCustomer.account_status === "active" ? "Suspend" : "Activate"}
                      </Button>
                      <Button variant="destructive" className="font-bold bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
            </FadeIn>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomersPage;
