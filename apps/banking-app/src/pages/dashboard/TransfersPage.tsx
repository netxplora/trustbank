import { useState, useEffect } from "react";
import { ArrowRightLeft, Building2, Globe, TrendingUp } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";
import { sanitizeInput } from "@trustbank/shared-utils/utils/security";

interface Account { id: string; account_type: string; account_number: string; balance: number; }
interface Transfer { id: string; to_name: string | null; to_bank: string | null; to_account_number: string; amount: number; status: string; created_at: string; reference: string | null; target_currency?: string; destination_amount?: number; transfer_type?: string; }

const CURRENCIES = [
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 151.40 },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", rate: 0.90 },
  { code: "CAD", symbol: "$", name: "Canadian Dollar", rate: 1.36 },
  { code: "AUD", symbol: "$", name: "Australian Dollar", rate: 1.52 },
];

const TransfersPage = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<"same" | "other" | "intl">("same");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  
  // Domestic/Internal Form
  const [form, setForm] = useState({ fromAccountId: "", toAccount: "", toName: "", toBank: "", amount: "", narration: "" });
  
  // International Form
  const [intlForm, setIntlForm] = useState({
    fromAccountId: "", toName: "", toAccount: "", swiftCode: "", iban: "", 
    bankName: "", targetCurrency: "EUR", amountUsd: "", narration: ""
  });

  useEffect(() => {
    if (!user) return;
    fetchAccounts();
    fetchTransfers();
  }, [user?.id]);

  const fetchAccounts = async () => {
    if (!user) return;
    const { data } = await supabase.from("accounts").select("*").eq("user_id", user.id).eq("status", "active");
    const accs = (data as Account[]) || [];
    setAccounts(accs);
    if (accs.length > 0) {
      setForm(f => ({ ...f, fromAccountId: accs[0].id }));
      setIntlForm(f => ({ ...f, fromAccountId: accs[0].id }));
    }
  };

  const fetchTransfers = async () => {
    if (!user) return;
    const { data } = await supabase.from("transfers").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
    setTransfers((data as Transfer[]) || []);
  };

  const checkLimits = (amount: number, tier: number) => {
    if (tier === 0) { toast({ title: "Unverified Account", description: "Please complete Tier 1 KYC to transfer funds.", variant: "destructive" }); return false; }
    if (!amount || amount < 1) { toast({ title: "Invalid amount", variant: "destructive" }); return false; }
    if (tier === 1 && amount > 5000) { toast({ title: "Limit Exceeded", description: "Tier 1 max transfer is $5,000.", variant: "destructive" }); return false; }
    if (tier === 2 && amount > 50000) { toast({ title: "Limit Exceeded", description: "Tier 2 max transfer is $50,000.", variant: "destructive" }); return false; }
    if (tier === 3 && amount > 500000) { toast({ title: "Limit Exceeded", description: "Tier 3 max transfer is $500,000.", variant: "destructive" }); return false; }
    return true;
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const tier = profile?.kyc_tier || 0;
    const amount = parseFloat(form.amount);
    if (!checkLimits(amount, tier)) return;

    setLoading(true);
    const { data, error } = await (supabase.rpc as any)("process_transfer", {
      p_user_id: user.id,
      p_from_account_id: form.fromAccountId,
      p_to_account_number: sanitizeInput(form.toAccount),
      p_amount: amount,
      p_narration: form.narration ? sanitizeInput(form.narration) : null,
      p_to_name: form.toName ? sanitizeInput(form.toName) : null,
      p_to_bank: tab === "other" ? sanitizeInput(form.toBank) : "TrustBank"
    });

    if (error) { 
      toast({ title: "Transfer Failed", description: error.message, variant: "destructive" }); 
      setLoading(false); 
      return; 
    }

    toast({ title: "Transfer Successful!", description: `$${amount.toLocaleString()} sent successfully.` });
    setForm(f => ({ ...f, toAccount: "", toName: "", toBank: "", amount: "", narration: "" }));
    setLoading(false);
    fetchTransfers();
    fetchAccounts();
  };

  const handleIntlTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const tier = profile?.kyc_tier || 0;
    const amountUsd = parseFloat(intlForm.amountUsd);
    if (!checkLimits(amountUsd, tier)) return;

    const selectedCurrency = CURRENCIES.find(c => c.code === intlForm.targetCurrency) || CURRENCIES[0];
    const destinationAmount = amountUsd * selectedCurrency.rate;

    setLoading(true);
    const { data, error } = await (supabase.rpc as any)("process_international_wire", {
      p_user_id: user.id,
      p_from_account_id: intlForm.fromAccountId,
      p_to_account_number: sanitizeInput(intlForm.toAccount),
      p_to_name: sanitizeInput(intlForm.toName),
      p_to_bank: sanitizeInput(intlForm.bankName),
      p_swift_code: sanitizeInput(intlForm.swiftCode),
      p_iban: sanitizeInput(intlForm.iban),
      p_target_currency: selectedCurrency.code,
      p_exchange_rate: selectedCurrency.rate,
      p_amount_usd: amountUsd,
      p_destination_amount: destinationAmount,
      p_narration: intlForm.narration ? sanitizeInput(intlForm.narration) : null,
    });

    if (error) { 
      toast({ title: "Wire Failed", description: error.message, variant: "destructive" }); 
      setLoading(false); 
      return; 
    }

    toast({ title: "SWIFT Wire Initiated!", description: `$${amountUsd.toLocaleString()} sent successfully. Reference: ${data?.reference}` });
    setIntlForm(f => ({ ...f, toAccount: "", toName: "", swiftCode: "", iban: "", bankName: "", amountUsd: "", narration: "" }));
    setLoading(false);
    fetchTransfers();
    fetchAccounts();
  };

  const tier = profile?.kyc_tier || 0;
  let txLimit = 0;
  let dailyLimit = 0;
  let wireFee = 45;
  if (tier === 1) { txLimit = 5000; dailyLimit = 10000; }
  else if (tier === 2) { txLimit = 50000; dailyLimit = 100000; }
  else if (tier === 3) { txLimit = 500000; dailyLimit = 1000000; wireFee = 0; }

  // FX Simulator Math
  const selectedCurrency = CURRENCIES.find(c => c.code === intlForm.targetCurrency) || CURRENCIES[0];
  const fxAmountUsd = parseFloat(intlForm.amountUsd) || 0;
  const fxDestAmount = fxAmountUsd * selectedCurrency.rate;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">Global Transfers</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground font-sans">Execute domestic and international wire transfers.</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Tx Limit: ${txLimit.toLocaleString()}</span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Daily: ${dailyLimit.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 font-sans">
        <Button variant={tab === "same" ? "default" : "outline"} size="sm" onClick={() => setTab("same")} className="font-bold">
          <ArrowRightLeft className="h-4 w-4 mr-1.5" /> Internal Transfer
        </Button>
        <Button variant={tab === "other" ? "default" : "outline"} size="sm" onClick={() => setTab("other")} className="font-bold">
          <Building2 className="h-4 w-4 mr-1.5" /> Domestic ACH
        </Button>
        <Button variant={tab === "intl" ? "default" : "outline"} size="sm" onClick={() => setTab("intl")} className="font-bold">
          <Globe className="h-4 w-4 mr-1.5" /> International Wire
        </Button>
      </div>

      <StaggerContainer className="grid lg:grid-cols-5 gap-6 font-sans">
        <StaggerItem className="lg:col-span-3">
          <div className="bg-card rounded-xl border p-6 shadow-sm hover-lift h-full">
            <h2 className="font-bold font-poppins text-foreground mb-5 border-b pb-3">
              {tab === "same" ? "Execute Internal Transfer" : tab === "other" ? "Execute Domestic ACH" : "Initiate SWIFT Transfer"}
            </h2>
            
            {tab !== "intl" ? (
              <form onSubmit={handleTransfer} className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Source Portfolio</label>
                  <select className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold" value={form.fromAccountId} onChange={(e) => setForm(f => ({ ...f, fromAccountId: e.target.value }))}>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.account_type.charAt(0).toUpperCase() + a.account_type.slice(1)} - •••• {a.account_number.slice(-4)} (${Number(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</option>
                    ))}
                  </select>
                </div>
                {tab === "other" && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Destination Institution</label>
                    <select className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold" value={form.toBank} onChange={(e) => setForm(f => ({ ...f, toBank: e.target.value }))}>
                      <option value="">Select Financial Institution</option>
                      <option>Chase Bank</option>
                      <option>Bank of America</option>
                      <option>Wells Fargo</option>
                      <option>Citibank</option>
                      <option>Capital One</option>
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Beneficiary Name</label>
                    <Input placeholder="Enter legal name" required value={form.toName} onChange={(e) => setForm(f => ({ ...f, toName: e.target.value }))} className="font-semibold text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Account / IBAN Number</label>
                    <Input placeholder="Enter routing or account number" required value={form.toAccount} onChange={(e) => setForm(f => ({ ...f, toAccount: e.target.value }))} className="font-mono text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Transfer Value (USD)</label>
                  <Input type="number" placeholder="0.00" required min={1} value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} className="font-mono font-bold text-lg" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Transaction Reference / Narration</label>
                  <Input placeholder="Optional reference detail" value={form.narration} onChange={(e) => setForm(f => ({ ...f, narration: e.target.value }))} className="text-sm font-medium" />
                </div>
                <Button type="submit" className="w-full font-bold h-11 text-sm mt-2" disabled={loading}>
                  {loading ? "Authorizing Transfer..." : "Authorize Transfer"}
                </Button>
              </form>
            ) : (
              // International Wire Form
              <form onSubmit={handleIntlTransfer} className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Source Portfolio</label>
                  <select className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold" value={intlForm.fromAccountId} onChange={(e) => setIntlForm(f => ({ ...f, fromAccountId: e.target.value }))}>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.account_type.charAt(0).toUpperCase() + a.account_type.slice(1)} - •••• {a.account_number.slice(-4)} (${Number(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</option>
                    ))}
                  </select>
                </div>
                
                <div className="p-4 bg-slate-50 border rounded-lg space-y-4">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Live Currency Exchange
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Send (USD)</label>
                      <Input type="number" placeholder="0.00" required min={1} value={intlForm.amountUsd} onChange={(e) => setIntlForm(f => ({ ...f, amountUsd: e.target.value }))} className="font-mono font-bold text-lg" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Receive</label>
                      <div className="flex">
                        <select className="rounded-l-lg border-y border-l bg-muted/30 px-3 font-bold text-sm" value={intlForm.targetCurrency} onChange={(e) => setIntlForm(f => ({ ...f, targetCurrency: e.target.value }))}>
                          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                        <div className="flex-1 border rounded-r-lg bg-background px-3 py-2 font-mono font-bold text-lg text-right text-success">
                          {selectedCurrency.symbol}{fxDestAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Live Rate: 1 USD = {selectedCurrency.rate} {selectedCurrency.code}</span>
                    <span className="font-bold text-primary">Wire Fee: {wireFee === 0 ? "Waived (Tier 3)" : `$${wireFee}.00`}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Beneficiary Legal Name</label>
                    <Input placeholder="Enter full legal name" required value={intlForm.toName} onChange={(e) => setIntlForm(f => ({ ...f, toName: e.target.value }))} className="font-semibold text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Beneficiary IBAN / Account</label>
                    <Input placeholder="Enter IBAN or Account No." required value={intlForm.iban} onChange={(e) => setIntlForm(f => ({ ...f, iban: e.target.value }))} className="font-mono text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">SWIFT / BIC Code</label>
                    <Input placeholder="8 or 11 characters" required value={intlForm.swiftCode} onChange={(e) => setIntlForm(f => ({ ...f, swiftCode: e.target.value }))} className="font-mono text-sm uppercase" maxLength={11} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Destination Bank Name</label>
                    <Input placeholder="e.g. Barclays UK" required value={intlForm.bankName} onChange={(e) => setIntlForm(f => ({ ...f, bankName: e.target.value }))} className="font-semibold text-sm" />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Reference / Message to Beneficiary</label>
                  <Input placeholder="Optional reference detail" value={intlForm.narration} onChange={(e) => setIntlForm(f => ({ ...f, narration: e.target.value }))} className="text-sm font-medium" />
                </div>
                
                <Button type="submit" className="w-full font-bold h-11 text-sm mt-2" disabled={loading}>
                  {loading ? "Transmitting via SWIFT..." : `Transmit SWIFT Wire`}
                </Button>
              </form>
            )}
          </div>
        </StaggerItem>

        <StaggerItem className="lg:col-span-2">
          <div className="bg-card rounded-xl border shadow-sm hover-lift h-full">
            <div className="p-5 border-b bg-muted/10"><h2 className="font-bold font-poppins text-foreground">Recent Executions</h2></div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {transfers.length === 0 ? (
                <div className="p-6 text-center text-sm font-semibold text-muted-foreground">No recent executions found</div>
              ) : transfers.map((t) => (
                <div key={t.id} className="p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold text-foreground leading-tight">{t.to_name || "Unknown Beneficiary"}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                        {t.to_bank || "Internal Transfer"} • <span className="font-mono">{t.to_account_number.slice(-4)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-foreground">
                        {t.transfer_type === 'international' ? "-" : ""}${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {t.transfer_type === 'international' && t.destination_amount && t.target_currency && (
                        <p className="text-[10px] font-mono font-bold text-success mt-1">+{Number(t.destination_amount).toLocaleString(undefined, {minimumFractionDigits:2})} {t.target_currency}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                    <span className="bg-muted px-2 py-0.5 rounded">{t.reference}</span>
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
};

export default TransfersPage;
