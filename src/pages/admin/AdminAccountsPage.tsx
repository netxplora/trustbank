import { useState, useEffect } from "react";
import { Search, Plus, Eye, Lock, Unlock, Loader2, Edit, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SlideUp, FadeIn } from "@/components/public/Motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

type EnrichedAccount = {
  id: string;
  user_id: string;
  holder: string;
  type: string;
  raw_type: string;
  number: string;
  balance: string;
  raw_balance: number;
  status: string;
  raw_status: string;
  opened: string;
};

type Profile = {
  user_id: string;
  display_name: string;
};

const AdminAccountsPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [accounts, setAccounts] = useState<EnrichedAccount[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // CRUD state
  const [selectedAccount, setSelectedAccount] = useState<EnrichedAccount | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showProvision, setShowProvision] = useState(false);
  const [editForm, setEditForm] = useState({ balance: "0", status: "", account_type: "" });
  const [provisionForm, setProvisionForm] = useState({ user_id: "", account_type: "savings" });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data: accountsData, error: accountsError } = await supabase.from('accounts').select('*').order('created_at', { ascending: false });
      if (accountsError) throw accountsError;

      const userIds = [...new Set(accountsData.map(a => a.user_id))];
      const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('user_id, display_name, first_name');
      if (profilesError) throw profilesError;

      const profileMap = new Map();
      const profileList: Profile[] = [];
      profilesData.forEach(p => {
        const name = p.display_name || p.first_name || 'Unknown';
        profileMap.set(p.user_id, name);
        profileList.push({ user_id: p.user_id, display_name: name });
      });
      setUsers(profileList);

      const enriched: EnrichedAccount[] = accountsData.map(a => ({
        id: a.id,
        user_id: a.user_id,
        holder: profileMap.get(a.user_id) || 'Unknown User',
        type: a.account_type.charAt(0).toUpperCase() + a.account_type.slice(1),
        raw_type: a.account_type,
        number: a.account_number,
        balance: `$${Number(a.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        raw_balance: Number(a.balance),
        status: a.status === 'active' ? 'Active' : a.status === 'frozen' ? 'Frozen' : 'Inactive',
        raw_status: a.status,
        opened: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }));
      
      setAccounts(enriched);
    } catch (error: any) {
      toast({ title: "Error fetching accounts", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleAccountStatus = async (accountId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "Active" ? "frozen" : "active";
      const { error } = await supabase.from("accounts").update({ status: newStatus }).eq("id", accountId);
      if (error) throw error;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: newStatus === "frozen" ? "account_frozen" : "account_activated",
          entity_type: "accounts",
          entity_id: accountId,
          details: { new_status: newStatus }
        });
      }

      toast({ title: currentStatus === "Active" ? "Account Frozen" : "Account Unfrozen" });
      fetchAccounts();
    } catch (error: any) {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    }
  };

  const handleEditSave = async () => {
    if (!selectedAccount) return;
    try {
      const newBalance = Number(editForm.balance);
      if (isNaN(newBalance)) throw new Error("Invalid balance amount");

      const { error } = await supabase.from("accounts").update({
        balance: newBalance,
        status: editForm.status,
        account_type: editForm.account_type
      }).eq("id", selectedAccount.id);
      
      if (error) throw error;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "admin_edited_account",
          entity_type: "accounts",
          entity_id: selectedAccount.id,
          details: { old_balance: selectedAccount.raw_balance, new_balance: newBalance, status: editForm.status }
        });
      }

      toast({ title: "Account Updated" });
      setIsEditing(false);
      setSelectedAccount(null);
      fetchAccounts();
    } catch (e: any) {
      toast({ title: "Update Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;
    if (!confirm("Are you sure you want to permanently delete this account? This will remove all associated transactions and cannot be undone.")) return;
    try {
      const { error } = await supabase.from("accounts").delete().eq("id", selectedAccount.id);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "admin_deleted_account",
          entity_type: "accounts",
          entity_id: selectedAccount.id,
          details: { account_number: selectedAccount.number }
        });
      }

      toast({ title: "Account Deleted" });
      setSelectedAccount(null);
      fetchAccounts();
    } catch (e: any) {
      toast({ title: "Deletion Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleProvision = async () => {
    if (!provisionForm.user_id || !provisionForm.account_type) {
      toast({ title: "Validation Error", description: "Please select a user and an account type.", variant: "destructive" });
      return;
    }
    try {
      const { data: currentAccounts } = await supabase.from("accounts").select("account_number").order("created_at", { ascending: false }).limit(1);
      
      let nextNumber = "4000000000";
      if (currentAccounts && currentAccounts.length > 0) {
        nextNumber = (parseInt(currentAccounts[0].account_number) + 1).toString();
      }

      const { error } = await supabase.from("accounts").insert({
        user_id: provisionForm.user_id,
        account_type: provisionForm.account_type,
        account_number: nextNumber,
        balance: 0,
        status: "active"
      });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "admin_provisioned_account",
          entity_type: "accounts",
          details: { user_id: provisionForm.user_id, account_type: provisionForm.account_type, account_number: nextNumber }
        });
      }

      toast({ title: "Account Provisioned successfully" });
      setShowProvision(false);
      setProvisionForm({ user_id: "", account_type: "savings" });
      fetchAccounts();
    } catch (e: any) {
      toast({ title: "Provisioning Failed", description: e.message, variant: "destructive" });
    }
  };

  const filtered = accounts.filter(a => a.holder.toLowerCase().includes(search.toLowerCase()) || a.number.includes(search));

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Account Management</h1>
          <p className="text-xs text-muted-foreground">{accounts.length} total active accounts</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search accounts..." className="pl-8 text-xs h-8 rounded-lg" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button size="sm" className="font-bold text-xs h-8 rounded-lg shrink-0" onClick={() => setShowProvision(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Create</Button>
        </div>
      </div>

      <SlideUp className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/30 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="text-left p-2.5 sm:p-3">Holder</th>
                <th className="text-left p-2.5 sm:p-3">Type</th>
                <th className="text-left p-2.5 sm:p-3 hidden md:table-cell">Account Number</th>
                <th className="text-right p-2.5 sm:p-3">Balance</th>
                <th className="text-left p-2.5 sm:p-3">Status</th>
                <th className="text-center p-2.5 sm:p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-xs">Loading accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground text-xs">
                    No accounts found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-2.5 sm:p-3 text-xs font-bold text-foreground">{a.holder}</td>
                    <td className="p-2.5 sm:p-3"><span className="text-[8px] font-bold uppercase tracking-wider bg-muted/40 border border-border/40 px-2 py-0.5 rounded-md">{a.type}</span></td>
                    <td className="p-2.5 sm:p-3 text-xs font-semibold text-muted-foreground font-mono hidden md:table-cell">{a.number}</td>
                    <td className="p-2.5 sm:p-3 text-xs font-bold text-foreground font-mono text-right">{a.balance}</td>
                    <td className="p-2.5 sm:p-3">
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${a.status === "Active" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>{a.status}</span>
                    </td>
                    <td className="p-2.5 sm:p-3 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => { setSelectedAccount(a); setIsEditing(false); setEditForm({ balance: a.raw_balance.toString(), status: a.raw_status, account_type: a.raw_type }); }}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md transition-colors hover:bg-muted" onClick={() => toggleAccountStatus(a.id, a.status)}>
                          {a.status === "Active" ? <Lock className="h-3.5 w-3.5 text-warning" /> : <Unlock className="h-3.5 w-3.5 text-success" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SlideUp>

      {/* PROVISION ACCOUNT DIALOG */}
      <Dialog open={showProvision} onOpenChange={setShowProvision}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader><DialogTitle className="font-poppins">Create New Account</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-xs font-semibold">Select Customer</Label>
              <select 
                className="w-full mt-1 h-11 rounded-md border border-input bg-background px-3 py-2 text-base"
                value={provisionForm.user_id}
                onChange={e => setProvisionForm(f => ({ ...f, user_id: e.target.value }))}
              >
                <option value="">-- Select Customer --</option>
                {users.map(u => (
                  <option key={u.user_id} value={u.user_id}>{u.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Account Type</Label>
              <select 
                className="w-full mt-1 h-11 rounded-md border border-input bg-background px-3 py-2 text-base"
                value={provisionForm.account_type}
                onChange={e => setProvisionForm(f => ({ ...f, account_type: e.target.value }))}
              >
                <option value="savings">Savings</option>
                <option value="current">Current</option>
                <option value="fixed">Fixed Deposit</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowProvision(false)}>Cancel</Button>
            <Button className="font-bold" onClick={handleProvision} disabled={!provisionForm.user_id}>Create Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW / EDIT ACCOUNT DIALOG */}
      <Dialog open={!!selectedAccount} onOpenChange={(open) => !open && setSelectedAccount(null)}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader><DialogTitle className="font-poppins">{isEditing ? "Edit Account Details" : "Account Details"}</DialogTitle></DialogHeader>
          {selectedAccount && (
            <FadeIn>
            <div className="space-y-4 mt-4">
              {isEditing ? (
                <>
                  <div>
                    <Label className="text-xs font-semibold">Account Balance (USD)</Label>
                    <Input type="number" step="0.01" value={editForm.balance} onChange={e => setEditForm(f => ({ ...f, balance: e.target.value }))} className="mt-1" />
                    <p className="text-[10px] text-muted-foreground mt-1">Warning: Editing balance directly bypasses the transaction ledger. Use only for corrections.</p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Account Type</Label>
                    <select 
                      className="w-full mt-1 h-11 rounded-md border border-input bg-background px-3 py-2 text-base"
                      value={editForm.account_type}
                      onChange={e => setEditForm(f => ({ ...f, account_type: e.target.value }))}
                    >
                      <option value="savings">Savings</option>
                      <option value="current">Current</option>
                      <option value="fixed">Fixed Deposit</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Operational Status</Label>
                    <select 
                      className="w-full mt-1 h-11 rounded-md border border-input bg-background px-3 py-2 text-base"
                      value={editForm.status}
                      onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    >
                      <option value="active">Active</option>
                      <option value="frozen">Frozen</option>
                      <option value="inactive">Inactive</option>
                    </select>
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
                      { label: "Account Holder", value: selectedAccount.holder },
                      { label: "Account Number", value: selectedAccount.number },
                      { label: "Account Type", value: selectedAccount.type },
                      { label: "Balance", value: selectedAccount.balance },
                      { label: "Status", value: selectedAccount.status.toUpperCase() },
                      { label: "Opened Date", value: selectedAccount.opened },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted/30 border rounded-lg p-3 flex justify-between items-center">
                        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                        <p className="font-bold text-foreground text-right">{value || "—"}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-6 gap-2">
                    <Button variant="outline" className="font-bold" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant={selectedAccount.status === "Active" ? "destructive" : "default"} 
                        className="font-bold"
                        onClick={() => toggleAccountStatus(selectedAccount.id, selectedAccount.status)}
                      >
                        {selectedAccount.status === "Active" ? "Freeze" : "Unfreeze"}
                      </Button>
                      <Button variant="destructive" className="font-bold bg-destructive hover:bg-destructive/90" onClick={handleDelete}>
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

export default AdminAccountsPage;
