import { useState, useEffect } from "react";
import { 
  Building2, Bitcoin, ArrowRight, Copy, CheckCircle2, AlertTriangle, 
  Upload, ExternalLink, RefreshCw, X, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";
import QRCode from "@/components/ui/QRCode";
import { Textarea } from "@/components/ui/textarea";
import CryptoDepositExperience from "@/components/dashboard/deposits/CryptoDepositExperience";
import { StripePaymentForm } from "@/components/dashboard/deposits/StripePaymentForm";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { sanitizeInput } from "@/utils/security";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

// Interfaces
interface Account {
  id: string;
  account_type: string;
  account_number: string;
  balance: number;
}

interface CryptoWallet {
  id: string;
  cryptocurrency: string;
  network: string | null;
  wallet_address: string;
  logo_url: string | null;
  wallet_name: string | null;
  min_deposit: number;
  confirmations_required: number;
  qr_code_url: string | null;
}

interface FiatBank {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string | null;
  swift_code: string | null;
}

interface PendingDeposit {
  id: string;
  type: 'fiat' | 'crypto';
  amount?: number;
  asset?: string;
  status: string;
  reference?: string;
  created_at: string;
}

type FundingMethod = 'fiat' | 'crypto' | null;
type FiatStep = 'account_selection' | 'amount_entry' | 'stripe_payment';
type CryptoStep = 'asset_selection' | 'wallet_details' | 'upload';

export default function DepositPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  
  // Data State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>([]);
  const [fiatBanks, setFiatBanks] = useState<FiatBank[]>([]);
  const [fiatBusy, setFiatBusy] = useState(false);
  const [showBusyDialog, setShowBusyDialog] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);
  
  // UI Flow State
  const [fundingMethod, setFundingMethod] = useState<FundingMethod>(null);
  
  // Fiat State
  const [fiatStep, setFiatStep] = useState<FiatStep>('account_selection');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  // Form State
  const [amount, setAmount] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [resumedDepositId, setResumedDepositId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [accRes, walletsRes, fiatRes, cryptoRes, fiatBanksRes, fiatStatusRes] = await Promise.all([
        supabase.from("accounts").select("id, account_type, account_number, balance").eq("user_id", user.id).eq("status", "active"),
        supabase.from("crypto_wallets").select("*").eq("enabled", true),
        supabase.from("payment_sessions").select("id, amount, reference, status, created_at").eq("user_id", user.id).in("status", ["pending_payment", "under_review"]),
        supabase.from("crypto_deposits").select("id, status, tx_hash, created_at, crypto_wallets(cryptocurrency)").eq("user_id", user.id).eq("status", "pending"),
        supabase.from("fiat_banks" as any).select("*").eq("is_active", true),
        supabase.from("cms_site_settings").select("value").eq("key", "fiat_network_status").single()
      ]);

      if (accRes.data) setAccounts(accRes.data as Account[]);
      if (walletsRes.data) setCryptoWallets(walletsRes.data as CryptoWallet[]);
      if (fiatBanksRes.data) setFiatBanks(fiatBanksRes.data as unknown as FiatBank[]);
      if (fiatStatusRes?.data) setFiatBusy((fiatStatusRes.data.value as any).isBusy);

      const pendingList: PendingDeposit[] = [];
      if (fiatRes.data) {
        fiatRes.data.forEach(d => pendingList.push({ id: d.id, type: 'fiat', amount: d.amount, reference: d.reference, status: d.status, created_at: d.created_at }));
      }
      if (cryptoRes.data) {
        cryptoRes.data.forEach((d: any) => pendingList.push({ id: d.id, type: 'crypto', asset: d.crypto_wallets?.cryptocurrency, status: d.status, created_at: d.created_at }));
      }
      setPendingDeposits(pendingList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      console.error(err);
    }
    
    setLoading(false);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  const resetFlow = () => {
    setFundingMethod(null);
    setFiatStep('account_selection');
    setSelectedAccount(null);
    setAmount("");
    setClientSecret("");
    setResumedDepositId(null);
  };



  const handleResume = (deposit: PendingDeposit) => {
    resetFlow();
    setResumedDepositId(deposit.id);
    if (deposit.type === 'fiat') {
      setFundingMethod('fiat');
      setFiatStep('amount_entry');
      setAmount(deposit.amount?.toString() || "");
    } else {
      setFundingMethod('crypto');
    }
  };

  // ---------------- FIAT WORKFLOW ----------------

  const startFiatWorkflow = () => {
    if (fiatBusy) {
      setShowBusyDialog(true);
      return;
    }
    setFundingMethod('fiat');
    if (accounts.length === 1 && accounts[0].account_type === 'savings') {
      setSelectedAccount(accounts[0]);
      setFiatStep('amount_entry');
    } else {
      setFiatStep('account_selection');
    }
  };

  const startStripePayment = async () => {
    if (!user || !selectedAccount || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: "Invalid Input", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('create-payment-intent', {
        body: { amount: Number(amount) }
      });
      
      if (response.error) throw response.error;
      
      const secret = response.data.clientSecret;
      setClientSecret(secret);
      setFiatStep('stripe_payment');
    } catch (error: any) {
      toast({ title: "Payment Initialization Failed", description: error.message || "Could not connect to payment gateway.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RENDERERS ----------------

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      {!fundingMethod && (
        <SlideUp>
          <div>
            <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Fund Your Account</h1>
            <p className="text-xs text-muted-foreground">Select a funding method to deposit assets into your portfolio.</p>
          </div>

          {pendingDeposits.length > 0 && (
            <div className="mt-3 bg-warning/10 border border-warning/20 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                <div>
                  <h3 className="font-bold text-warning text-xs">Incomplete Deposits Detected</h3>
                  <p className="text-[11px] text-muted-foreground">You have {pendingDeposits.length} deposit(s) awaiting confirmation.</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                {pendingDeposits.slice(0, 2).map((pd) => (
                  <Button key={pd.id} variant="outline" size="sm" className="font-bold text-xs h-7 border-warning/30 bg-background/50 hover:bg-warning/20" onClick={() => handleResume(pd)}>
                    Resume {pd.type === 'fiat' ? 'Fiat' : pd.asset} Deposit <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div 
              className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm hover:border-primary/40 cursor-pointer flex flex-col justify-between group transition-colors"
              onClick={startFiatWorkflow}
            >
              <div>
                <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-2.5 border border-primary/20">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold font-poppins text-foreground mb-1 group-hover:text-primary transition-colors">Fiat Deposit</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                  Fund your account using a bank transfer or fiat payment methods.
                </p>
              </div>
              <div className="mt-3 flex items-center text-primary font-bold text-xs">
                Proceed <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div 
              className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm hover:border-primary/40 cursor-pointer flex flex-col justify-between group transition-colors"
              onClick={() => setFundingMethod('crypto')}
            >
              <div>
                <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-2.5 border border-primary/20">
                  <Bitcoin className="h-4 w-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold font-poppins text-foreground mb-1 group-hover:text-primary transition-colors">Digital Currency</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                  Fund your account using supported digital currencies via wallet transfer.
                </p>
              </div>
              <div className="mt-3 flex items-center text-primary font-bold text-xs">
                Proceed <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </SlideUp>
      )}

      {fundingMethod === 'fiat' && (
        <FadeIn>
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={resetFlow}><X className="h-3.5 w-3.5" /></Button>
            <h2 className="text-base font-bold font-poppins">Fiat Deposit Workflow</h2>
          </div>

          {fiatStep === 'account_selection' && (
            <div className="space-y-3">
              <h3 className="font-bold text-foreground font-poppins text-xs">Select Account to Fund</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">{acc.account_type} Account</p>
                        <p className="font-mono font-bold text-sm">****{acc.account_number.slice(-4)}</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase bg-success/10 text-success px-2 py-0.5 rounded-md">Active</span>
                    </div>
                    <p className="text-xl font-bold font-poppins mb-3">${Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <Button size="sm" className="w-full font-bold text-xs h-8 rounded-lg" onClick={() => { setSelectedAccount(acc); setFiatStep('amount_entry'); }}>Fund {acc.account_type}</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fiatStep === 'amount_entry' && selectedAccount && (
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm max-w-md mx-auto space-y-4">
              <h3 className="font-bold text-foreground font-poppins text-sm border-b pb-2">Deposit Amount</h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount (USD)</Label>
                  <Input type="number" step="0.01" min="1" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 h-9 text-base font-bold rounded-lg" />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 font-bold text-xs h-8 rounded-lg" onClick={resetFlow}>Cancel</Button>
                <Button className="flex-1 font-bold text-xs h-8 rounded-lg" onClick={startStripePayment} disabled={!amount || Number(amount) <= 0 || loading}>
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : "Proceed"}
                </Button>
              </div>
            </div>
          )}

          {fiatStep === 'stripe_payment' && clientSecret && (
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm max-w-md mx-auto space-y-4">
              <h3 className="font-bold text-foreground font-poppins text-sm border-b pb-2">Complete Payment</h3>
              
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <StripePaymentForm 
                  clientSecret={clientSecret} 
                  amount={Number(amount)} 
                  accountId={selectedAccount!.id} 
                  onBack={() => setFiatStep('amount_entry')}
                  onSuccess={() => { resetFlow(); fetchData(); }}
                />
              </Elements>
            </div>
          )}
        </FadeIn>
      )}

      {fundingMethod === 'crypto' && (
        <CryptoDepositExperience 
          accounts={accounts} 
          cryptoWallets={cryptoWallets} 
          onBack={resetFlow} 
        />
      )}

      <Dialog open={showBusyDialog} onOpenChange={setShowBusyDialog}>
        <DialogContent className="max-w-xs text-center p-4 rounded-xl font-sans">
          <div className="mx-auto w-10 h-10 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-3">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-base font-bold font-poppins mb-1">Network Busy</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Fiat deposit networks are experiencing high volume. Digital Currency deposits process instantly.
          </DialogDescription>
          <div className="flex flex-col gap-2">
            <Button size="sm" className="w-full font-bold text-xs h-8 rounded-lg" onClick={() => { setShowBusyDialog(false); setFundingMethod('crypto'); }}>
              <Bitcoin className="w-3.5 h-3.5 mr-1.5" /> Use Digital Currency
            </Button>
            <Button size="sm" variant="outline" className="w-full font-bold text-xs h-8 rounded-lg" onClick={() => setShowBusyDialog(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
