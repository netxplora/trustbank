import { useState, useEffect, useMemo } from "react";
import { Bitcoin, Plus, Edit, Trash2, Copy, ToggleLeft, ToggleRight, QrCode, Building2, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaggerContainer, StaggerItem, SlideUp, FadeIn } from "@/components/public/Motion";
import QRCode from "@/components/ui/QRCode";

// ─── Interfaces ───────────────────────────────────────────────────
interface CryptoWallet {
  id: string;
  wallet_name: string | null;
  cryptocurrency: string;
  network: string | null;
  wallet_address: string;
  enabled: boolean;
  logo_url: string | null;
  qr_code_url: string | null;
  min_deposit: number;
  confirmations_required: number;
  is_default: boolean;
  created_at: string;
}


interface FiatBank {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string | null;
  swift_code: string | null;
  is_active: boolean;
  created_at: string;
}

// ─── Component ────────────────────────────────────────────────────
const AdminDepositSettingsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  
  // ── Fiat state ──
  const [fiatBanks, setFiatBanks] = useState<FiatBank[]>([]);
  const [showAddFiat, setShowAddFiat] = useState(false);
  const [editFiatBank, setEditFiatBank] = useState<FiatBank | null>(null);
  const [fiatForm, setFiatForm] = useState({
    bank_name: "", account_name: "", account_number: "", routing_number: "", swift_code: ""
  });
  const [isSavingFiat, setIsSavingFiat] = useState(false);
  const [fiatBusy, setFiatBusy] = useState(false);

  // ── Data state ──
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);

  // ── Wallet form state ──
  const [showAdd, setShowAdd] = useState(false);
  const [editWallet, setEditWallet] = useState<CryptoWallet | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    wallet_name: "", cryptocurrency: "", network: "", wallet_address: "",
    logo_url: "", qr_code_url: "", min_deposit: "0", confirmations_required: "1", is_default: false
  });

  // ── Third-party settings ──
  const [thirdPartyForm, setThirdPartyForm] = useState({ name: "MoonPay", url: "https://moonpay.com" });

  // ── Fetch ───────────────────────────────────────────────────────
  useEffect(() => { fetchWallets(); fetchSettings(); fetchFiatBanks(); }, []);

  
  const fetchFiatBanks = async () => {
    const { data, error } = await supabase.from("fiat_banks" as any).select("*").order("created_at");
    if (error) console.error("Error fetching fiat banks:", error);
    setFiatBanks((data as any[]) || []);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from("cms_site_settings").select("value").eq("key", "crypto_third_party").single();
    if (data && data.value) setThirdPartyForm(data.value as any);
    const { data: fiatData } = await supabase.from("cms_site_settings").select("value").eq("key", "fiat_network_status").single();
    if (fiatData && fiatData.value) setFiatBusy((fiatData.value as any).isBusy);
  };

  const fetchWallets = async () => {
    const { data, error } = await supabase.from("crypto_wallets").select("*").order("created_at");
    if (error) console.error("Error fetching wallets:", error);
    setWallets((data as any[]) || []);
  };

  // ── Wallet CRUD ─────────────────────────────────────────────────
  const openAddDialog = () => {
    setEditWallet(null);
    setForm({ wallet_name: "", cryptocurrency: "", network: "", wallet_address: "", logo_url: "", qr_code_url: "", min_deposit: "0", confirmations_required: "1", is_default: false });
    setLogoFile(null);
    setQrFile(null);
    setShowAdd(true);
  };

  const openEditDialog = (w: CryptoWallet) => {
    setEditWallet(w);
    setForm({
      wallet_name: w.wallet_name || "",
      cryptocurrency: w.cryptocurrency,
      network: w.network || "",
      wallet_address: w.wallet_address,
      logo_url: w.logo_url || "",
      qr_code_url: w.qr_code_url || "",
      min_deposit: String(w.min_deposit || 0),
      confirmations_required: String(w.confirmations_required || 1),
      is_default: w.is_default || false
    });
    setLogoFile(null);
    setQrFile(null);
    setShowAdd(true);
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const name = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("documents").upload(name, file);
    if (error) { console.error("Upload error:", error); return null; }
    const { data } = supabase.storage.from("documents").getPublicUrl(name);
    return data.publicUrl;
  };

  const handleSaveWallet = async () => {
    if (!form.cryptocurrency || !form.wallet_address) {
      toast({ title: "Error", description: "Currency and wallet address are required.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      let logoUrl = form.logo_url;
      let qrUrl = form.qr_code_url;
      if (logoFile) { const url = await uploadFile(logoFile, "wallets"); if (url) logoUrl = url; }
      if (qrFile) { const url = await uploadFile(qrFile, "wallet-qr"); if (url) qrUrl = url; }

      const payload: any = {
        wallet_name: form.wallet_name || null,
        cryptocurrency: form.cryptocurrency,
        network: form.network || null,
        wallet_address: form.wallet_address,
        min_deposit: Number(form.min_deposit) || 0,
        confirmations_required: Number(form.confirmations_required) || 1,
        is_default: form.is_default,
        logo_url: logoUrl || null,
        qr_code_url: qrUrl || null
      };

      if (editWallet) {
        const { error } = await supabase.from("crypto_wallets").update(payload).eq("id", editWallet.id);
        if (error) throw error;
        toast({ title: "Wallet Updated" });
      } else {
        payload.created_by = user?.id;
        const { error } = await supabase.from("crypto_wallets").insert(payload);
        if (error) throw error;
        toast({ title: "Wallet Provisioned" });
      }

      setShowAdd(false);
      setEditWallet(null);
      setLogoFile(null);
      setQrFile(null);
      fetchWallets();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleWallet = async (id: string, enabled: boolean) => {
    await supabase.from("crypto_wallets").update({ enabled: !enabled }).eq("id", id);
    fetchWallets();
    toast({ title: enabled ? "Wallet Suspended" : "Wallet Activated" });
  };

  const deleteWallet = async (id: string) => {
    if (!confirm("Are you sure you want to delete this wallet? This action cannot be undone.")) return;
    await supabase.from("crypto_wallets").delete().eq("id", id);
    fetchWallets();
    toast({ title: "Wallet Removed" });
  };

  const saveThirdPartySettings = async () => {
    await supabase.from("cms_site_settings").upsert({
      key: "crypto_third_party", value: thirdPartyForm, updated_by: user?.id
    });
    toast({ title: "Third-Party Provider Updated" });
  };

  
  // ── Fiat CRUD ───────────────────────────────────────────────────
  const toggleFiatBusy = async (busy: boolean) => {
    await supabase.from("cms_site_settings").upsert({
      key: "fiat_network_status", value: { isBusy: busy }, updated_by: user?.id
    });
    setFiatBusy(busy);
    toast({ title: busy ? "Fiat Network set to Busy" : "Fiat Network set to Active" });
  };

  const openAddFiat = () => {
    setEditFiatBank(null);
    setFiatForm({ bank_name: "", account_name: "", account_number: "", routing_number: "", swift_code: "" });
    setShowAddFiat(true);
  };
  
  const openEditFiat = (b: FiatBank) => {
    setEditFiatBank(b);
    setFiatForm({
      bank_name: b.bank_name,
      account_name: b.account_name,
      account_number: b.account_number,
      routing_number: b.routing_number || "",
      swift_code: b.swift_code || ""
    });
    setShowAddFiat(true);
  };

  const handleSaveFiat = async () => {
    if (!fiatForm.bank_name || !fiatForm.account_name || !fiatForm.account_number) {
      toast({ title: "Error", description: "Bank Name, Account Name, and Account Number are required.", variant: "destructive" });
      return;
    }
    setIsSavingFiat(true);
    try {
      const payload = {
        bank_name: fiatForm.bank_name,
        account_name: fiatForm.account_name,
        account_number: fiatForm.account_number,
        routing_number: fiatForm.routing_number || null,
        swift_code: fiatForm.swift_code || null
      };

      if (editFiatBank) {
        const { error } = await supabase.from("fiat_banks" as any).update(payload).eq("id", editFiatBank.id);
        if (error) throw error;
        toast({ title: "Fiat Bank Updated" });
      } else {
        const { error } = await supabase.from("fiat_banks" as any).insert(payload);
        if (error) throw error;
        toast({ title: "Fiat Bank Added" });
      }
      setShowAddFiat(false);
      fetchFiatBanks();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingFiat(false);
    }
  };

  const toggleFiatBank = async (id: string, active: boolean) => {
    await supabase.from("fiat_banks" as any).update({ is_active: !active }).eq("id", id);
    fetchFiatBanks();
    toast({ title: active ? "Bank Deactivated" : "Bank Activated" });
  };

  const deleteFiatBank = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bank?")) return;
    await supabase.from("fiat_banks" as any).delete().eq("id", id);
    fetchFiatBanks();
    toast({ title: "Bank Removed" });
  };

  // ── Status badge helper ──
  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-warning/10 text-warning border-warning/20",
      confirmed: "bg-success/10 text-success border-success/20",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
      info_requested: "bg-primary/10 text-primary border-primary/20"
    };
    return map[status] || "bg-muted/50 text-muted-foreground border-border";
  };

  // ─── RENDER ─────────────────────────────────────────────────────
  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans text-xs">
      <div>
        <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Wallet & Provider Configuration</h1>
        <p className="text-xs text-muted-foreground font-sans">Manage deposit wallets and configure third-party digital currency providers.</p>
      </div>

      <Tabs defaultValue="fiat" className="w-full">
        <TabsList className="mb-3 bg-muted/50 border border-border/60 rounded-lg p-0.5">
          <TabsTrigger value="fiat" className="font-semibold text-xs h-7 rounded-md">Fiat Banks</TabsTrigger>
          <TabsTrigger value="wallets" className="font-semibold text-xs h-7 rounded-md">Crypto Wallets</TabsTrigger>
          <TabsTrigger value="settings" className="font-semibold text-xs h-7 rounded-md">Provider Settings</TabsTrigger>
        </TabsList>

        
        {/* ═══ TAB 0: FIAT BANKS ═══ */}
        <TabsContent value="fiat" className="m-0 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-poppins text-foreground">Institutional Fiat Accounts</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold text-muted-foreground">Network Status:</span>
                <button onClick={() => toggleFiatBusy(!fiatBusy)} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                  {fiatBusy ? <ToggleRight className="h-5 w-5 text-destructive" /> : <ToggleLeft className="h-5 w-5 text-success" />}
                  <span className={`text-xs font-bold ${fiatBusy ? "text-destructive" : "text-success"}`}>{fiatBusy ? "Busy" : "Active"}</span>
                </button>
              </div>
            </div>
            <Button size="sm" className="font-bold" onClick={openAddFiat}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Bank
            </Button>
          </div>

          {fiatBanks.length === 0 ? (
            <div className="bg-card border rounded-3xl p-12 text-center text-muted-foreground">
              <Landmark className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">No fiat banks configured.</p>
              <p className="text-xs mt-1">Add your institutional bank account details for wire transfers.</p>
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
              {fiatBanks.map((b) => (
                <StaggerItem key={b.id}>
                  <div className={`bg-card rounded-3xl border p-5 shadow-sm hover-lift h-full ${!b.is_active ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground text-sm uppercase tracking-wide block leading-tight">{b.bank_name}</span>
                          <span className="text-xs text-muted-foreground font-semibold">{b.account_name}</span>
                        </div>
                      </div>
                      <button onClick={() => toggleFiatBank(b.id, b.is_active)} className="hover:opacity-80 transition-opacity">
                        {b.is_active ? <ToggleRight className="h-6 w-6 text-success" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                      </button>
                    </div>

                    <div className="space-y-2 mb-4 bg-muted/30 p-3 rounded-lg border border-transparent">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-semibold">Account Number</span>
                        <span className="font-bold font-mono">{b.account_number}</span>
                      </div>
                      {b.routing_number && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-semibold">Routing Number</span>
                          <span className="font-bold font-mono">{b.routing_number}</span>
                        </div>
                      )}
                      {b.swift_code && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-semibold">SWIFT/BIC</span>
                          <span className="font-bold font-mono">{b.swift_code}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs font-semibold flex-1 border-muted-foreground/20 hover:bg-muted" onClick={() => openEditFiat(b)}>
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs font-semibold text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => deleteFiatBank(b.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </TabsContent>

        {/* ═══ TAB 1: GLOBAL WALLET MANAGEMENT ═══ */}
        <TabsContent value="wallets" className="m-0 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-poppins text-foreground">Configured Deposit Wallets</h2>
            <Button size="sm" className="font-bold" onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Wallet
            </Button>
          </div>

          {wallets.length === 0 ? (
            <div className="bg-card border rounded-3xl p-12 text-center text-muted-foreground">
              <QrCode className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">No wallets configured yet.</p>
              <p className="text-xs mt-1">Add your first deposit wallet to get started.</p>
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 font-sans">
              {wallets.map((w) => (
                <StaggerItem key={w.id}>
                  <div className={`bg-card rounded-3xl border p-5 shadow-sm hover-lift h-full ${!w.enabled ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 bg-warning/10 rounded-lg border border-warning/20 flex items-center justify-center overflow-hidden shrink-0">
                          {w.logo_url ? <img src={w.logo_url} alt={w.cryptocurrency} className="h-6 w-6 object-contain" /> : <Bitcoin className="h-4 w-4 text-warning" />}
                        </div>
                        <div>
                          <span className="font-bold text-foreground text-sm uppercase tracking-wide block leading-tight">{w.cryptocurrency}</span>
                          {w.wallet_name && <span className="text-[10px] text-muted-foreground font-semibold">{w.wallet_name}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {w.is_default && <span className="text-[8px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">Default</span>}
                        <button onClick={() => toggleWallet(w.id, w.enabled)} className="hover:opacity-80 transition-opacity">
                          {w.enabled ? <ToggleRight className="h-6 w-6 text-success" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                        </button>
                      </div>
                    </div>

                    {w.network && <span className="text-[10px] font-bold uppercase tracking-wider bg-muted/50 border px-2 py-0.5 rounded-sm mb-2 inline-block">{w.network}</span>}

                    <code className="text-xs font-mono font-semibold text-muted-foreground break-all bg-muted/30 p-2 rounded block mb-3 border border-transparent">{w.wallet_address}</code>

                    <div className="grid grid-cols-2 gap-2 text-[10px] mb-4">
                      <div>
                        <span className="text-muted-foreground font-semibold block">Min Deposit</span>
                        <span className="font-bold text-foreground">{w.min_deposit > 0 ? `$${w.min_deposit}` : "None"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold block">Confirmations</span>
                        <span className="font-bold text-foreground">{w.confirmations_required}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold block">Status</span>
                        <span className={`font-bold ${w.enabled ? "text-success" : "text-destructive"}`}>{w.enabled ? "Active" : "Inactive"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold block">QR Code</span>
                        <span className="font-bold text-foreground">{w.qr_code_url ? "Custom" : "Auto"}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs font-semibold flex-1 border-muted-foreground/20 hover:bg-muted" onClick={() => { navigator.clipboard.writeText(w.wallet_address); toast({ title: "Copied!" }); }}>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs font-semibold flex-1 border-muted-foreground/20 hover:bg-muted" onClick={() => openEditDialog(w)}>
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs font-semibold text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => deleteWallet(w.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </TabsContent>

        {/* ═══ TAB 2: PROVIDER SETTINGS ═══ */}
        <TabsContent value="settings" className="m-0">
          <FadeIn className="bg-card rounded-3xl border p-6 shadow-sm max-w-2xl">
            <h2 className="text-lg font-bold font-poppins text-foreground mb-1">Third-Party Digital Currency Provider</h2>
            <p className="text-sm text-muted-foreground font-sans mb-6">Configure the external provider used when users need to purchase digital currency.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Provider Name</Label>
                <Input placeholder="e.g. MoonPay" value={thirdPartyForm.name} onChange={e => setThirdPartyForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Provider URL</Label>
                <Input placeholder="https://..." value={thirdPartyForm.url} onChange={e => setThirdPartyForm(f => ({ ...f, url: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <Button className="mt-4 font-bold" onClick={saveThirdPartySettings}>Save Provider Settings</Button>
          </FadeIn>
        </TabsContent>
      </Tabs>

      {/* ═══ ADD/EDIT WALLET DIALOG ═══ */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg font-sans max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-poppins">{editWallet ? "Edit Wallet Configuration" : "Add New Wallet"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Currency *</Label>
                <Input placeholder="e.g. BTC, ETH, USDT" value={form.cryptocurrency} onChange={(e) => setForm(f => ({ ...f, cryptocurrency: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Network</Label>
                <Input placeholder="e.g. ERC-20, TRC-20" value={form.network} onChange={(e) => setForm(f => ({ ...f, network: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Wallet Name (Display Label)</Label>
              <Input placeholder="e.g. BTC Main Wallet" value={form.wallet_name} onChange={(e) => setForm(f => ({ ...f, wallet_name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Wallet Address *</Label>
              <Input placeholder="Enter wallet address" value={form.wallet_address} onChange={(e) => setForm(f => ({ ...f, wallet_address: e.target.value }))} className="mt-1 font-mono text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Minimum Deposit ($)</Label>
                <Input type="number" placeholder="0" value={form.min_deposit} onChange={(e) => setForm(f => ({ ...f, min_deposit: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Confirmations Required</Label>
                <Input type="number" placeholder="1" value={form.confirmations_required} onChange={(e) => setForm(f => ({ ...f, confirmations_required: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <input type="checkbox" id="is_default" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="is_default" className="text-xs font-semibold cursor-pointer">Set as default wallet for this network</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Currency Logo</Label>
                <Input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) setLogoFile(e.target.files[0]); }} className="mt-1 text-xs" />
                {form.logo_url && !logoFile && <p className="text-[10px] text-muted-foreground mt-1">Current logo exists.</p>}
              </div>
              <div>
                <Label className="text-xs font-semibold">Custom QR Code</Label>
                <Input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) setQrFile(e.target.files[0]); }} className="mt-1 text-xs" />
                {form.qr_code_url && !qrFile && <p className="text-[10px] text-muted-foreground mt-1">Custom QR exists.</p>}
              </div>
            </div>
            <Button className="w-full font-bold" onClick={handleSaveWallet} disabled={isUploading}>
              {isUploading ? "Uploading..." : (editWallet ? "Update Wallet" : "Deploy Wallet")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ ADD/EDIT FIAT DIALOG ═══ */}
      <Dialog open={showAddFiat} onOpenChange={setShowAddFiat}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins">{editFiatBank ? "Edit Fiat Bank" : "Add Fiat Bank"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-semibold">Bank Name *</Label>
              <Input placeholder="e.g. Federal Reserve Central" value={fiatForm.bank_name} onChange={(e) => setFiatForm(f => ({ ...f, bank_name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Account Name *</Label>
              <Input placeholder="e.g. TrustBank Custodial Accounts" value={fiatForm.account_name} onChange={(e) => setFiatForm(f => ({ ...f, account_name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Account Number *</Label>
              <Input placeholder="e.g. 0123999485" value={fiatForm.account_number} onChange={(e) => setFiatForm(f => ({ ...f, account_number: e.target.value }))} className="mt-1 font-mono text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Routing Number</Label>
                <Input placeholder="Optional" value={fiatForm.routing_number} onChange={(e) => setFiatForm(f => ({ ...f, routing_number: e.target.value }))} className="mt-1 font-mono text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold">SWIFT/BIC Code</Label>
                <Input placeholder="Optional" value={fiatForm.swift_code} onChange={(e) => setFiatForm(f => ({ ...f, swift_code: e.target.value }))} className="mt-1 font-mono text-sm" />
              </div>
            </div>
            <Button className="w-full font-bold mt-2" onClick={handleSaveFiat} disabled={isSavingFiat}>
              {isSavingFiat ? "Saving..." : "Save Bank Details"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminDepositSettingsPage;
