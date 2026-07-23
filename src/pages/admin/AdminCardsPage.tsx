import { useState, useEffect } from "react";
import { CreditCard, CheckCircle, XCircle, Loader2, Lock, Unlock, Edit, Trash2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { StaggerContainer, StaggerItem, SlideUp, FadeIn } from "@/components/public/Motion";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EnrichedCard = {
  id: string;
  customer: string;
  type: string;
  account: string;
  status: string;
  date: string;
  is_physical: boolean;
  request_status: string | null;
  delivery_address: string | null;
  raw: any;
};

const AdminCardsPage = () => {
  const { toast } = useToast();
  const [cards, setCards] = useState<EnrichedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [createForm, setCreateForm] = useState({
    cardType: "virtual" as "virtual" | "debit",
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    spendingLimit: "10000",
    status: "active"
  });
  const [creating, setCreating] = useState(false);

  const fetchCards = async () => {
    try {
      const { data: cardsData, error: cardsError } = await supabase.from('cards').select('*').order('created_at', { ascending: false });
      if (cardsError) throw cardsError;

      const userIds = [...new Set(cardsData.map(c => c.user_id))];
      
      let profileMap = new Map();
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*').in('user_id', userIds);
        if (profilesError) throw profilesError;
        profilesData.forEach(p => profileMap.set(p.user_id, p.display_name || p.first_name || 'Unknown'));
      }

      const enriched = cardsData.map(c => ({
        id: c.id,
        customer: c.cardholder_name || profileMap.get(c.user_id) || 'Unknown User',
        type: c.is_physical ? 'Physical Card' : c.card_type === 'digital' ? 'Digital Card' : 'Virtual Card',
        account: `****${c.card_number?.slice(-4) || '0000'}`,
        status: c.status === 'active' && c.is_frozen ? 'Frozen' : c.status === 'active' ? 'Active' : (c.request_status === 'pending' || c.status === 'pending') ? 'Pending' : c.request_status === 'rejected' ? 'Rejected' : 'Inactive',
        date: new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        is_physical: c.is_physical || false,
        request_status: c.request_status || null,
        delivery_address: c.delivery_address || null,
        raw: c
      }));
      
      setCards(enriched);
    } catch (error: any) {
      toast({ title: "Error fetching cards", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleAction = async (id: string, newStatus: string, freeze: boolean = false) => {
    try {
      const card = cards.find(c => c.id === id);
      const isApproving = newStatus === 'active';
      const isRejecting = newStatus === 'rejected';

      let updateData: any = freeze ? { is_frozen: newStatus === "frozen" } : { status: newStatus };
      
      if (!freeze && card?.is_physical && card?.request_status === 'pending') {
        updateData.request_status = isApproving ? 'approved' : 'rejected';
      }

      const { error } = await supabase.from('cards').update(updateData).eq('id', id);
      if (error) throw error;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: freeze ? `card_freeze_toggled` : `updated_card_status`,
          entity_type: "cards",
          entity_id: id,
          details: { new_status: newStatus, request_status: updateData.request_status }
        });
      }
      
      toast({ title: freeze ? (newStatus === "frozen" ? "Card Frozen" : "Card Unfrozen") : `Card ${newStatus}` });
      fetchCards();
    } catch (error: any) {
      toast({ title: "Error updating card", description: error.message, variant: "destructive" });
    }
  };

  const deleteCard = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this card?")) return;
    try {
      const { error } = await supabase.from('cards').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Card Deleted Successfully" });
      fetchCards();
    } catch (err: any) {
      toast({ title: "Error deleting card", description: err.message, variant: "destructive" });
    }
  };

  const updateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    try {
      const { error } = await supabase.from('cards').update({
        cardholder_name: editingCard.cardholder_name,
        card_number: editingCard.card_number,
        expiry_date: editingCard.expiry_date,
        cvv: editingCard.cvv,
        status: editingCard.status,
        is_frozen: editingCard.is_frozen,
        spending_limit: editingCard.spending_limit
      }).eq('id', editingCard.id);
      
      if (error) throw error;
      toast({ title: "Card Updated Successfully" });
      setEditingCard(null);
      fetchCards();
    } catch (err: any) {
      toast({ title: "Error updating card", description: err.message, variant: "destructive" });
    }
  };

  const searchUsers = async () => {
    if (!userSearch.trim()) return;
    const { data } = await supabase.from("profiles").select("user_id, display_name, first_name, last_name, email").or(`display_name.ilike.%${userSearch}%,email.ilike.%${userSearch}%,first_name.ilike.%${userSearch}%`).limit(5);
    setFoundUsers(data || []);
  };

  const generateCardNumber = () => {
    const prefix = "4532";
    let num = prefix;
    for (let i = 0; i < 12; i++) num += Math.floor(Math.random() * 10);
    return num.replace(/(\d{4})/g, "$1 ").trim();
  };

  const generateExpiry = () => {
    const now = new Date();
    const expYear = now.getFullYear() + 4;
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${month}/${String(expYear).slice(-2)}`;
  };

  const generateCvv = () => String(Math.floor(100 + Math.random() * 900));

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) { toast({ title: "Select a user first", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const { error } = await supabase.from("cards").insert({
        user_id: selectedUserId,
        card_type: createForm.cardType,
        card_number: createForm.cardNumber || generateCardNumber(),
        expiry_date: createForm.expiryDate || generateExpiry(),
        cvv: createForm.cvv || generateCvv(),
        cardholder_name: createForm.cardholderName.toUpperCase(),
        card_brand: "Visa",
        status: createForm.status,
        is_frozen: false,
        is_physical: createForm.cardType === "debit",
        spending_limit: parseInt(createForm.spendingLimit) || 10000,
        request_status: createForm.cardType === "debit" ? "approved" : null
      });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "admin_card_created",
          entity_type: "cards",
          details: { for_user: selectedUserId, type: createForm.cardType }
        });
      }

      toast({ title: "Card Created", description: `Card provisioned for the selected user.` });
      setShowCreate(false);
      setSelectedUserId("");
      setFoundUsers([]);
      setUserSearch("");
      setCreateForm({ cardType: "virtual", cardholderName: "", cardNumber: "", expiryDate: "", cvv: "", spendingLimit: "10000", status: "active" });
      fetchCards();
    } catch (err: any) {
      toast({ title: "Error creating card", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const totalCards = cards.length;
  const activeCards = cards.filter(c => c.status === "Active").length;
  const signatureCards = cards.filter(c => c.type === "Signature Elite Debit").length;
  const pendingCards = cards.filter(c => c.status === "Pending").length;

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Card Management</h1>
          <p className="text-xs text-muted-foreground font-sans">Manage customer cards and approvals</p>
        </div>
        <Button size="sm" className="font-bold text-xs h-8 rounded-lg" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Create Card
        </Button>
      </div>

      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-sans">
        {[
          { label: "Total Cards Issued", value: loading ? "-" : totalCards.toString(), icon: CreditCard },
          { label: "Active Digital Cards", value: loading ? "-" : activeCards.toString() },
          { label: "Signature Debit Cards", value: loading ? "-" : signatureCards.toString() },
          { label: "Pending Approvals", value: loading ? "-" : pendingCards.toString() },
        ].map(s => (
          <StaggerItem key={s.label}>
            <div className="bg-card rounded-xl border border-border/60 p-3 shadow-sm h-full">
              <p className="text-[10px] font-semibold text-muted-foreground">{s.label}</p>
              <p className="text-base font-bold text-foreground mt-0.5">{s.value}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <SlideUp className="bg-card rounded-3xl border overflow-hidden shadow-sm hover-lift">
        <div className="overflow-x-auto">
          <table className="w-full font-sans">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Customer</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Card Type</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground hidden md:table-cell">Funding Account</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Status</th>
                <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground hidden lg:table-cell">Request Date</th>
                <th className="text-center p-4 text-xs font-semibold font-poppins text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm">Loading card records...</span>
                    </div>
                  </td>
                </tr>
              ) : cards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">
                    No card requests found.
                  </td>
                </tr>
              ) : cards.map((c) => (
                <tr key={c.id} className="border-b last:border-primary hover:bg-muted/10 transition-colors align-middle">
                  <td className="p-4 text-sm font-bold text-foreground">{c.customer}</td>
                  <td className="p-4"><span className="text-[10px] font-bold uppercase tracking-wider bg-muted/50 border px-2.5 py-1 rounded-sm">{c.type}</span></td>
                  <td className="p-4 text-sm font-semibold text-muted-foreground font-mono hidden md:table-cell">{c.account}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${c.status === "Active" ? "bg-success/10 text-success border-success/20" : c.status === "Pending" ? "bg-warning/10 text-warning border-warning/20" : c.status === "Frozen" ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>{c.status}</span>
                  </td>
                  <td className="p-4 text-xs font-semibold text-muted-foreground hidden lg:table-cell">{c.date}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {c.status === "Pending" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-success/10 transition-colors" onClick={() => handleAction(c.id, "active")}><CheckCircle className="h-4 w-4 text-success" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 transition-colors" onClick={() => handleAction(c.id, "rejected")}><XCircle className="h-4 w-4 text-destructive" /></Button>
                        </>
                      )}
                      {(c.status === "Active" || c.status === "Frozen") && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-warning/10 transition-colors" onClick={() => handleAction(c.id, c.status === "Active" ? "frozen" : "active", true)}>
                          {c.status === "Active" ? <Lock className="h-4 w-4 text-warning" /> : <Unlock className="h-4 w-4 text-success" />}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 transition-colors" onClick={() => setEditingCard(c.raw)}>
                        <Edit className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 transition-colors" onClick={() => deleteCard(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SlideUp>

      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins font-bold">Edit Card Details</DialogTitle>
            <DialogDescription>Modify the raw parameters of this card.</DialogDescription>
          </DialogHeader>
          {editingCard && (
            <FadeIn>
            <form onSubmit={updateCard} className="space-y-4 mt-2">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Card Holder Name</Label>
                <Input value={editingCard.cardholder_name || ""} onChange={e => setEditingCard({...editingCard, cardholder_name: e.target.value})} required className="font-bold uppercase" />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Card Number</Label>
                <Input value={editingCard.card_number || ""} onChange={e => setEditingCard({...editingCard, card_number: e.target.value})} required className="font-mono font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Expiry</Label>
                  <Input value={editingCard.expiry_date || ""} onChange={e => setEditingCard({...editingCard, expiry_date: e.target.value})} required className="font-mono font-bold" />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">CVV</Label>
                  <Input value={editingCard.cvv || ""} onChange={e => setEditingCard({...editingCard, cvv: e.target.value})} required className="font-mono font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Status</Label>
                  <select className="w-full rounded-md border bg-background px-3 py-2 text-base font-bold h-11" value={editingCard.status || "inactive"} onChange={e => setEditingCard({...editingCard, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Frozen</Label>
                  <select className="w-full rounded-md border bg-background px-3 py-2 text-base font-bold h-11" value={editingCard.is_frozen ? "yes" : "no"} onChange={e => setEditingCard({...editingCard, is_frozen: e.target.value === "yes"})}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 font-bold">Save Changes</Button>
                <Button type="button" variant="outline" className="font-bold" onClick={() => setEditingCard(null)}>Cancel</Button>
              </div>
            </form>
            </FadeIn>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Card Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins font-bold">Create New Card</DialogTitle>
            <DialogDescription>Search for a customer and create a card on their behalf.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCard} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Find Customer</Label>
              <div className="flex gap-2">
                <Input placeholder="Search by name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="flex-1" />
                <Button type="button" variant="outline" size="icon" onClick={searchUsers}><Search className="h-4 w-4" /></Button>
              </div>
              {foundUsers.length > 0 && (
                <div className="mt-2 border rounded-lg divide-y max-h-40 overflow-y-auto">
                  {foundUsers.map(u => (
                    <button key={u.user_id} type="button" className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${ selectedUserId === u.user_id ? 'bg-primary/10 font-bold' : ''}`} onClick={() => { setSelectedUserId(u.user_id); setCreateForm(f => ({ ...f, cardholderName: (u.display_name || `${u.first_name || ''} ${u.last_name || ''}`).trim() })); }}>
                      <span className="font-semibold">{u.display_name || `${u.first_name || ''} ${u.last_name || ''}`}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Cardholder Name</Label>
              <Input value={createForm.cardholderName} onChange={e => setCreateForm(f => ({ ...f, cardholderName: e.target.value }))} required className="font-bold uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Card Type</Label>
                <select className="w-full rounded-md border bg-background px-3 py-2 text-base font-bold h-11" value={createForm.cardType} onChange={e => setCreateForm(f => ({ ...f, cardType: e.target.value as any }))}>
                  <option value="virtual">Virtual Card</option>
                  <option value="debit">Physical Debit Card</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Status</Label>
                <select className="w-full rounded-md border bg-background px-3 py-2 text-base font-bold h-11" value={createForm.status} onChange={e => setCreateForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Card Number</Label>
                <Input placeholder="Auto-generated" value={createForm.cardNumber} onChange={e => setCreateForm(f => ({ ...f, cardNumber: e.target.value }))} className="font-mono text-xs" />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Expiry</Label>
                <Input placeholder="Auto" value={createForm.expiryDate} onChange={e => setCreateForm(f => ({ ...f, expiryDate: e.target.value }))} className="font-mono text-xs" />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">CVV</Label>
                <Input placeholder="Auto" value={createForm.cvv} onChange={e => setCreateForm(f => ({ ...f, cvv: e.target.value }))} className="font-mono text-xs" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Spending Limit ($)</Label>
              <Input type="number" value={createForm.spendingLimit} onChange={e => setCreateForm(f => ({ ...f, spendingLimit: e.target.value }))} className="font-bold" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 font-bold" disabled={creating || !selectedUserId}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                Create Card
              </Button>
              <Button type="button" variant="outline" className="font-bold" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCardsPage;
