import { useState, useEffect } from "react";
import { ArrowRightLeft, ArrowDownLeft, Building2, Globe, Search, Send, User, CheckCircle2, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TransactionPinDialog } from "@/components/dashboard/TransactionPinDialog";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";
import { sanitizeInput } from "@/utils/security";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useBrand } from "@/contexts/BrandContext";
import { processInternalTransfer } from "@/services/accountService";

interface Account { id: string; account_type: string; account_number: string; balance: number; }
interface Transfer { id: string; to_name: string | null; to_bank: string | null; to_account_number: string; amount: number; status: string; created_at: string; reference: string | null; target_currency?: string; destination_amount?: number; transfer_type?: string; }
interface Beneficiary { name: string; account: string; bank: string; color: string; initial: string; }

const CURRENCIES = [
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92, flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79, flag: "🇬🇧" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 151.40, flag: "🇯🇵" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", rate: 0.90, flag: "🇨🇭" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar", rate: 1.36, flag: "🇨🇦" },
  { code: "AUD", symbol: "$", name: "Australian Dollar", rate: 1.52, flag: "🇦🇺" },
];

export default function TransfersPage() {
  const { toast } = useToast();
  const { identity } = useBrand();
  const brandName = identity?.short_name || "TrustBank";
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<"internal" | "same" | "other" | "intl">("internal");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [recentBeneficiaries, setRecentBeneficiaries] = useState<Beneficiary[]>([]);
  
  // Forms
  const [internalForm, setInternalForm] = useState({ fromAccountId: "", toAccountId: "", amount: "" });
  const [form, setForm] = useState({ fromAccountId: "", toAccount: "", toName: "", toBank: "", amount: "", narration: "", saveBeneficiary: false });
  const [intlForm, setIntlForm] = useState({ fromAccountId: "", toName: "", toAccount: "", swiftCode: "", iban: "", bankName: "", targetCurrency: "EUR", amountUsd: "", narration: "", saveBeneficiary: false });
  
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinError, setPinError] = useState<string | undefined>();
  const [pendingTransfer, setPendingTransfer] = useState<"internal" | "local" | "intl" | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchAccounts();
    fetchTransfers();
  }, [user?.id]);

  const fetchAccounts = async () => {
    if (!user) return;
    const { data } = await supabase.from("accounts").select("id, account_type, account_number, balance").eq("user_id", user.id).eq("status", "active");
    const accs = (data as Account[]) || [];
    setAccounts(accs);
    if (accs.length > 0) {
      setForm(f => ({ ...f, fromAccountId: accs[0].id }));
      setIntlForm(f => ({ ...f, fromAccountId: accs[0].id }));
      
      const checking = accs.find(a => a.account_type === 'checking');
      const savings = accs.find(a => a.account_type === 'savings');
      if (checking && savings) {
        setInternalForm({ fromAccountId: checking.id, toAccountId: savings.id, amount: "" });
      } else if (accs.length >= 2) {
        setInternalForm({ fromAccountId: accs[0].id, toAccountId: accs[1].id, amount: "" });
      }
    }
  };

  const fetchTransfers = async () => {
    if (!user) return;
    const { data } = await supabase.from("transfers").select("id, to_name, to_bank, to_account_number, amount, status, created_at, reference, target_currency, destination_amount, transfer_type").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    const txs = (data as Transfer[]) || [];
    setTransfers(txs);

    const { data: bData } = await supabase.from("beneficiaries").select("name, bank, account_number").eq("user_id", user.id);
    const savedBens = (bData || []).map(b => ({
      name: b.name,
      account: b.account_number,
      bank: b.bank,
      color: "bg-primary/20 text-primary border border-primary/30",
      initial: b.name.charAt(0).toUpperCase()
    }));

    // Extract unique recent beneficiaries not already in saved
    const beneficiariesMap: Record<string, Beneficiary> = {};
    const colors = ["bg-blue-500", "bg-purple-500", "bg-teal-500", "bg-orange-500", "bg-pink-500", "bg-indigo-500"];
    let colorIdx = 0;

    txs.forEach(tx => {
      if (tx.to_name && tx.to_account_number && !beneficiariesMap[tx.to_account_number] && !savedBens.find(b => b.account === tx.to_account_number)) {
        beneficiariesMap[tx.to_account_number] = {
          name: tx.to_name,
          account: tx.to_account_number,
          bank: tx.to_bank || brandName,
          color: colors[colorIdx % colors.length],
          initial: tx.to_name.charAt(0).toUpperCase()
        };
        colorIdx++;
      }
    });

    setRecentBeneficiaries([...savedBens, ...Object.values(beneficiariesMap)].slice(0, 10));
  };

  const handleSelectBeneficiary = (b: Beneficiary) => {
    if (b.bank === brandName) {
      setTab("same");
    } else {
      setTab("other");
    }
    setForm(f => ({ ...f, toAccount: b.account, toName: b.name, toBank: b.bank }));
  };

  const checkLimits = (amount: number, tier: number) => {
    if (tier === 0) { toast({ title: "Unverified Account", description: "Please complete Tier 1 KYC to transfer funds.", variant: "destructive" }); return false; }
    if (!amount || amount < 1) { toast({ title: "Invalid amount", variant: "destructive" }); return false; }
    if (tier === 1 && amount > 5000) { toast({ title: "Limit Exceeded", description: "Tier 1 max transfer is $5,000.", variant: "destructive" }); return false; }
    if (tier === 2 && amount > 50000) { toast({ title: "Limit Exceeded", description: "Tier 2 max transfer is $50,000.", variant: "destructive" }); return false; }
    if (tier === 3 && amount > 500000) { toast({ title: "Limit Exceeded", description: "Tier 3 max transfer is $500,000.", variant: "destructive" }); return false; }
    return true;
  };

  const handleInternalTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!internalForm.fromAccountId || !internalForm.toAccountId) {
      toast({ title: "Accounts Required", description: "Please select both from and to accounts.", variant: "destructive" });
      return;
    }
    if (internalForm.fromAccountId === internalForm.toAccountId) {
      toast({ title: "Invalid Accounts", description: "Source and destination must be different.", variant: "destructive" });
      return;
    }
    const amount = parseFloat(internalForm.amount);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid Amount", variant: "destructive" });
      return;
    }
    setPendingTransfer("internal");
    setPinDialogOpen(true);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.fromAccountId) { toast({ title: "Account Required", description: "Please select an account to debit from.", variant: "destructive" }); return; }
    const tier = profile?.kyc_tier || 0;
    const amount = parseFloat(form.amount);
    if (!checkLimits(amount, tier)) return;

    setPendingTransfer("local");
    setPinDialogOpen(true);
  };

  const handleIntlTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!intlForm.fromAccountId) { toast({ title: "Account Required", description: "Please select an account to debit from.", variant: "destructive" }); return; }
    const tier = profile?.kyc_tier || 0;
    const amountUsd = parseFloat(intlForm.amountUsd);
    if (!checkLimits(amountUsd, tier)) return;

    setPendingTransfer("intl");
    setPinDialogOpen(true);
  };

  const executeTransfer = async (pin: string) => {
    if (pendingTransfer === "internal") {
      await executeInternal(pin);
    } else if (pendingTransfer === "local") {
      await executeLocal(pin);
    } else if (pendingTransfer === "intl") {
      await executeIntl(pin);
    }
  };

  const executeInternal = async (pin: string) => {
    setLoading(true);
    setPinError(undefined);
    const amount = parseFloat(internalForm.amount);
    const res = await processInternalTransfer({
      userId: user!.id,
      fromAccountId: internalForm.fromAccountId,
      toAccountId: internalForm.toAccountId,
      amount,
      pin
    });

    if (!res.success) {
      if (res.error?.toLowerCase().includes("pin")) {
        setPinError(res.error);
      } else {
        toast({ title: "Transfer Failed", description: res.error, variant: "destructive" });
        setPinDialogOpen(false);
      }
    } else {
      toast({ title: "Transfer Successful!", description: `$${amount.toLocaleString()} moved between accounts.` });
      setInternalForm(f => ({ ...f, amount: "" }));
      fetchAccounts();
      setPinDialogOpen(false);
    }
    
    setLoading(false);
  };

  const executeLocal = async (pin: string) => {
    setLoading(true);
    setPinError(undefined);
    const amount = parseFloat(form.amount);
    const { data, error } = await (supabase.rpc as any)("process_transfer", {
      p_user_id: user?.id,
      p_from_account_id: form.fromAccountId,
      p_to_account_number: sanitizeInput(form.toAccount),
      p_amount: amount,
      p_narration: form.narration ? sanitizeInput(form.narration) : null,
      p_to_name: form.toName ? sanitizeInput(form.toName) : null,
      p_to_bank: tab === "other" ? sanitizeInput(form.toBank) : brandName,
      p_pin: pin
    });

    if (error) { 
      if (error.message?.toLowerCase().includes("pin")) {
        setPinError(error.message);
      } else {
        toast({ title: "Transfer Failed", description: error.message, variant: "destructive" }); 
        setPinDialogOpen(false); 
      }
      setLoading(false); 
      return; 
    }

    toast({ title: "Transfer Successful!", description: `$${amount.toLocaleString()} sent successfully.` });
    
    if (form.saveBeneficiary) {
      const { data: existing } = await supabase.from("beneficiaries").select("id").eq("user_id", user.id).eq("account_number", sanitizeInput(form.toAccount)).maybeSingle();
      if (!existing) {
        await supabase.from("beneficiaries").insert({
          user_id: user.id,
          name: sanitizeInput(form.toName || "Saved Beneficiary"),
          bank: tab === "other" ? sanitizeInput(form.toBank) : brandName,
          account_number: sanitizeInput(form.toAccount)
        });
        toast({ title: "Beneficiary Saved", description: `${form.toName} has been saved for future transfers.` });
      }
    }

    setForm(f => ({ ...f, toAccount: "", toName: "", toBank: "", amount: "", narration: "", saveBeneficiary: false }));
    setLoading(false);
    setPinDialogOpen(false);
    fetchTransfers();
    fetchAccounts();
  };

    const executeIntl = async (pin: string) => {
    setLoading(true);
    setPinError(undefined);
    const amountUsd = parseFloat(intlForm.amountUsd);
    const selectedCurrency = CURRENCIES.find(c => c.code === intlForm.targetCurrency) || CURRENCIES[0];
    const destinationAmount = amountUsd * selectedCurrency.rate;

    const { data, error } = await (supabase.rpc as any)("process_international_wire", {
      p_user_id: user?.id, p_from_account_id: intlForm.fromAccountId, p_to_account_number: sanitizeInput(intlForm.toAccount), p_to_name: sanitizeInput(intlForm.toName),
      p_to_bank: sanitizeInput(intlForm.bankName), p_swift_code: sanitizeInput(intlForm.swiftCode), p_iban: sanitizeInput(intlForm.iban), p_target_currency: selectedCurrency.code,
      p_exchange_rate: selectedCurrency.rate, p_amount_usd: amountUsd, p_destination_amount: destinationAmount, p_narration: intlForm.narration ? sanitizeInput(intlForm.narration) : null,
      p_pin: pin
    });

    if (error) { 
      if (error.message?.toLowerCase().includes("pin")) {
        setPinError(error.message);
      } else {
        toast({ title: "Wire Failed", description: error.message, variant: "destructive" }); 
        setPinDialogOpen(false); 
      }
      setLoading(false); 
      return; 
    }

    toast({ title: "SWIFT Wire Initiated!", description: `$${amountUsd.toLocaleString()} sent successfully. Reference: ${data?.reference}` });
    
    if (intlForm.saveBeneficiary) {
      const { data: existing } = await supabase.from("beneficiaries").select("id").eq("user_id", user.id).eq("account_number", sanitizeInput(intlForm.toAccount)).maybeSingle();
      if (!existing) {
        await supabase.from("beneficiaries").insert({
          user_id: user.id,
          name: sanitizeInput(intlForm.toName),
          bank: sanitizeInput(intlForm.bankName),
          account_number: sanitizeInput(intlForm.toAccount)
        });
        toast({ title: "Beneficiary Saved", description: `${intlForm.toName} has been saved for future transfers.` });
      }
    }

    setIntlForm(f => ({ ...f, toAccount: "", toName: "", swiftCode: "", iban: "", bankName: "", amountUsd: "", narration: "", saveBeneficiary: false }));
    setLoading(false);
    setPinDialogOpen(false);
    fetchTransfers();
    fetchAccounts();
  };

  const tier = profile?.kyc_tier || 0;
  let txLimit = tier === 1 ? 5000 : tier === 2 ? 50000 : tier === 3 ? 500000 : 0;
  
  const selectedCurrency = CURRENCIES.find(c => c.code === intlForm.targetCurrency) || CURRENCIES[0];
  const fxAmountUsd = parseFloat(intlForm.amountUsd) || 0;
  const fxDestAmount = fxAmountUsd * selectedCurrency.rate;

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground tracking-tight mb-0.5">Send Money</h1>
          <p className="text-xs text-muted-foreground">Transfer funds securely to anyone, anywhere.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-[10px] font-bold text-primary">
          <CheckCircle2 size={12} /> Tier {tier} Limit (${txLimit.toLocaleString()}/Tx)
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="bg-muted/30 p-1 rounded-xl flex gap-1 border border-border/50 text-xs overflow-x-auto hide-scrollbar">
        {[
          { id: "internal", label: "Between Accounts", icon: ArrowDownUp },
          { id: "same", label: brandName, icon: ArrowRightLeft },
          { id: "other", label: "Other Banks", icon: Building2 },
          { id: "intl", label: "Int'l Wire", icon: Globe }
        ].map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex-1 min-w-max flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${isActive ? "bg-background shadow-sm text-primary border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-5 gap-3">
        <div className="lg:col-span-3 space-y-3">
          <SlideUp>
            <div className="bg-card rounded-xl border border-border/60 shadow-sm p-3.5 sm:p-4">
              
              {/* Recent Beneficiaries Quick Select */}
              {recentBeneficiaries.length > 0 && (tab === "same" || tab === "other") && (
                <div className="mb-4 border-b pb-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Saved & Recent Payees</h3>
                  <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
                    {recentBeneficiaries.map((b, i) => (
                      <div key={i} onClick={() => handleSelectBeneficiary(b)} className="flex flex-col items-center gap-1 cursor-pointer group shrink-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold font-poppins text-xs transition-transform group-hover:scale-105 shadow-sm ${b.color}`}>
                          {b.initial}
                        </div>
                        <p className="text-[9px] font-semibold text-foreground truncate w-12 text-center group-hover:text-primary transition-colors">{b.name.split(' ')[0]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Forms */}
              {tab === "internal" ? (
                <form onSubmit={handleInternalTransfer} className="space-y-3">
                  <div className="bg-muted/20 rounded-lg p-2.5 border border-border/40 mb-2">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 block">Transfer From</label>
                    <Select value={internalForm.fromAccountId} onValueChange={(val) => setInternalForm(f => ({ ...f, fromAccountId: val }))}>
                      <SelectTrigger className="w-full h-8 bg-transparent border-0 shadow-none px-0 focus:ring-0 font-bold text-xs text-foreground data-[state=open]:text-primary transition-colors">
                        <SelectValue placeholder="Select Source Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={`from-${a.id}`} value={a.id}>
                            {a.account_type.toUpperCase()} - ****{a.account_number.slice(-4)} (${Number(a.balance).toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-muted/20 rounded-lg p-2.5 border border-border/40 mb-2">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 block">Transfer To</label>
                    <Select value={internalForm.toAccountId} onValueChange={(val) => setInternalForm(f => ({ ...f, toAccountId: val }))}>
                      <SelectTrigger className="w-full h-8 bg-transparent border-0 shadow-none px-0 focus:ring-0 font-bold text-xs text-foreground data-[state=open]:text-primary transition-colors">
                        <SelectValue placeholder="Select Destination Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={`to-${a.id}`} value={a.id} disabled={a.id === internalForm.fromAccountId}>
                            {a.account_type.toUpperCase()} - ****{a.account_number.slice(-4)} (${Number(a.balance).toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-1">
                    <label className="text-[10px] font-bold text-muted-foreground mb-1 block text-center uppercase tracking-wider">Amount to Transfer</label>
                    <div className="relative max-w-xs mx-auto">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">$</span>
                      <Input required type="number" step="0.01" placeholder="0.00" className="h-12 pl-8 text-center text-2xl font-black font-poppins rounded-xl border-2 focus-visible:ring-primary focus-visible:border-primary bg-background shadow-inner" value={internalForm.amount} onChange={(e) => setInternalForm(f => ({ ...f, amount: e.target.value }))} />
                    </div>
                  </div>
                  
                  <div className="flex justify-center pt-2">
                    <Button type="submit" className="w-full max-w-[220px] h-10 rounded-xl text-xs font-bold shadow-md" disabled={loading}>
                      {loading ? "Processing..." : <><ArrowDownUp className="h-3.5 w-3.5 mr-1.5" /> Complete Transfer</>}
                    </Button>
                  </div>
                </form>
              ) : tab !== "intl" ? (
                <form onSubmit={handleTransfer} className="space-y-3">
                  <div className="bg-muted/20 rounded-lg p-2.5 border border-border/40 mb-2">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 block">Debit From Account</label>
                    <Select value={form.fromAccountId} onValueChange={(val) => setForm(f => ({ ...f, fromAccountId: val }))}>
                      <SelectTrigger className="w-full h-8 bg-transparent border-0 shadow-none px-0 focus:ring-0 font-bold text-xs text-foreground data-[state=open]:text-primary transition-colors">
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.account_type.toUpperCase()} - ****{a.account_number.slice(-4)} (${Number(a.balance).toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Account Number</label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input required type="text" placeholder="e.g. 0123456789" className="h-9 pl-8 rounded-lg text-xs font-semibold" value={form.toAccount} onChange={(e) => setForm(f => ({ ...f, toAccount: e.target.value }))} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {tab === "other" && (
                        <div className="col-span-2 sm:col-span-1">
                          <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Bank Name</label>
                          <Input required type="text" placeholder="e.g. First Bank" className="h-9 rounded-lg text-xs font-semibold" value={form.toBank} onChange={(e) => setForm(f => ({ ...f, toBank: e.target.value }))} />
                        </div>
                      )}
                      <div className={tab === "other" ? "col-span-2 sm:col-span-1" : "col-span-2"}>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Recipient Name</label>
                        <Input required type="text" placeholder="John Doe" className="h-9 rounded-lg text-xs font-semibold" value={form.toName} onChange={(e) => setForm(f => ({ ...f, toName: e.target.value }))} />
                      </div>
                    </div>
                    
                    {/* Amount Input */}
                    <div className="pt-1">
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block text-center uppercase tracking-wider">Amount to Send</label>
                      <div className="relative max-w-xs mx-auto">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">$</span>
                        <Input required type="number" step="0.01" placeholder="0.00" className="h-12 pl-8 text-center text-2xl font-black font-poppins rounded-xl border-2 focus-visible:ring-primary focus-visible:border-primary bg-background shadow-inner" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Narration (Optional)</label>
                      <Input type="text" placeholder="What is this for?" className="h-8 rounded-lg text-xs bg-muted/10" value={form.narration} onChange={(e) => setForm(f => ({ ...f, narration: e.target.value }))} />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1 pb-1">
                    <Checkbox id="save-beneficiary" checked={form.saveBeneficiary} onCheckedChange={(checked) => setForm(f => ({ ...f, saveBeneficiary: checked === true }))} />
                    <label htmlFor="save-beneficiary" className="text-[10px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Save this recipient as a beneficiary
                    </label>
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button type="submit" className="w-full max-w-[220px] h-10 rounded-xl text-xs font-bold shadow-md" disabled={loading}>
                      {loading ? "Processing..." : <><Send className="h-3.5 w-3.5 mr-1.5" /> Send Money Now</>}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleIntlTransfer} className="space-y-3">
                  <div className="bg-muted/20 rounded-lg p-2.5 border border-border/40 mb-2">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 block">Debit From Account</label>
                    <Select value={intlForm.fromAccountId} onValueChange={(val) => setIntlForm(f => ({ ...f, fromAccountId: val }))}>
                      <SelectTrigger className="w-full h-8 bg-transparent border-0 shadow-none px-0 focus:ring-0 font-bold text-xs text-foreground data-[state=open]:text-primary transition-colors">
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.account_type.toUpperCase()} - ****{a.account_number.slice(-4)} (${Number(a.balance).toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Recipient Name</label>
                      <Input required className="h-8 rounded-lg text-xs" placeholder="Full Name" value={intlForm.toName} onChange={(e) => setIntlForm(f => ({ ...f, toName: e.target.value }))} />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Bank Name</label>
                      <Input required className="h-8 rounded-lg text-xs" placeholder="Global Bank Ltd" value={intlForm.bankName} onChange={(e) => setIntlForm(f => ({ ...f, bankName: e.target.value }))} />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block">SWIFT / BIC</label>
                      <Input required className="h-8 rounded-lg text-xs uppercase" placeholder="AAAA BB CC 123" value={intlForm.swiftCode} onChange={(e) => setIntlForm(f => ({ ...f, swiftCode: e.target.value }))} />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block">IBAN / Routing</label>
                      <Input required className="h-8 rounded-lg text-xs uppercase" placeholder="GB00 BK..." value={intlForm.iban} onChange={(e) => setIntlForm(f => ({ ...f, iban: e.target.value }))} />
                    </div>
                  </div>

                  <div className="bg-muted/20 rounded-xl border border-border/40 p-3 mt-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Currency Conversion</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[9px] text-muted-foreground font-semibold mb-0.5 block">You Send (USD)</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-xs">$</span>
                            <Input required type="number" placeholder="1000.00" className="h-8 pl-6 rounded-lg font-bold text-xs bg-background" value={intlForm.amountUsd} onChange={(e) => setIntlForm(f => ({ ...f, amountUsd: e.target.value }))} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-muted/40 p-2 rounded-lg border border-border/40">
                        <div className="w-24">
                          <label className="text-[9px] text-muted-foreground font-semibold mb-0.5 block">Receive In</label>
                          <select className="w-full h-7 bg-background rounded-md border px-1.5 text-xs font-bold" value={intlForm.targetCurrency} onChange={(e) => setIntlForm(f => ({ ...f, targetCurrency: e.target.value }))}>
                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                          </select>
                        </div>
                        <div className="flex-1 text-right">
                          <label className="text-[9px] text-muted-foreground font-semibold mb-0.5 block">Recipient Gets Approx</label>
                          <p className="text-lg font-bold font-poppins text-foreground">
                            {selectedCurrency.symbol}{fxDestAmount > 0 ? fxDestAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-[9px] text-muted-foreground font-semibold px-1">
                        <span>Rate: 1 USD = {selectedCurrency.rate} {selectedCurrency.code}</span>
                        <span>Fee: ${tier === 3 ? "0" : "45"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2 pb-1">
                    <Checkbox id="save-beneficiary-intl" checked={intlForm.saveBeneficiary} onCheckedChange={(checked) => setIntlForm(f => ({ ...f, saveBeneficiary: checked === true }))} />
                    <label htmlFor="save-beneficiary-intl" className="text-[10px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Save this recipient as a beneficiary
                    </label>
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button type="submit" className="w-full max-w-[220px] h-10 rounded-xl text-xs font-bold shadow-md" disabled={loading}>
                      {loading ? "Processing..." : <><Globe className="h-3.5 w-3.5 mr-1.5" /> Initiate Global Wire</>}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </SlideUp>
        </div>

        <div className="lg:col-span-2">
          <SlideUp delay={0.1}>
            <div className="bg-card rounded-xl border border-border/60 shadow-sm p-3.5 sm:p-4 flex flex-col h-full">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold font-poppins text-foreground text-xs">Recent Transfers</h3>
                <span className="text-[9px] font-bold text-muted-foreground uppercase">History</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                {transfers.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-6">No recent transfers found.</div>
                ) : (
                  transfers.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/20 transition-colors border-b border-border/20 last:border-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <ArrowRightLeft size={13} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground leading-tight truncate">{tx.to_name || tx.to_account_number}</p>
                          <p className="text-[9px] text-muted-foreground font-mono truncate">{tx.to_bank || brandName} · {tx.reference || tx.id.slice(0,6)}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold font-mono text-foreground">${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${tx.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </SlideUp>
        </div>
      </div>
      
      <TransactionPinDialog
        isOpen={pinDialogOpen}
        onClose={() => { setPinDialogOpen(false); setPinError(undefined); setPendingTransfer(null); }}
        onConfirm={executeTransfer}
        amount={pendingTransfer === "internal" ? parseFloat(internalForm.amount) : (pendingTransfer === "local" ? parseFloat(form.amount) : parseFloat(intlForm.amountUsd))}
        title="Confirm Transfer"
        description={
          pendingTransfer === "internal" 
            ? "You are about to transfer funds between your own accounts."
            : `You are about to transfer funds to ${pendingTransfer === "local" ? (form.toName || form.toAccount) : intlForm.toName}.`
        }
        error={pinError}
        isLoading={loading}
      />
    </div>
  );
}
