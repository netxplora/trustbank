import { useState, useEffect } from "react";
import { 
  Building2, Bitcoin, ArrowRight, Copy, CheckCircle2, AlertTriangle, 
  Upload, ExternalLink, RefreshCw, X, ShieldCheck, Landmark, User, Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { useToast } from "@/hooks/use-toast";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";
import QRCode from "@/components/ui/QRCode";
import { Textarea } from "@/components/ui/textarea";
import CryptoDepositExperience from "@/components/dashboard/deposits/CryptoDepositExperience";
import { sanitizeInput } from "@/utils/security";

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
type FiatStep = 'account_selection' | 'amount_entry' | 'bank_details' | 'confirmation';

export default function DepositPage() {
  const { user, profile } = useAuth();
  const { identity } = useBrand();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  
  // Data State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>([]);
  const [fiatBusy, setFiatBusy] = useState(false);
  const [showBusyDialog, setShowBusyDialog] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  
  // UI Flow State
  const [fundingMethod, setFundingMethod] = useState<FundingMethod>(null);
  
  // Fiat State
  const [fiatStep, setFiatStep] = useState<FiatStep>('account_selection');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  // Form State
  const [amount, setAmount] = useState("");
  const [depositReference, setDepositReference] = useState("");

  useEffect(() => {
    fetchData();
  }, [user]);

  // Generate a unique deposit reference
  useEffect(() => {
    if (fiatStep === 'bank_details' && !depositReference) {
      const ref = `DEP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setDepositReference(ref);
    }
  }, [fiatStep]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [accRes, walletsRes, fiatRes, cryptoRes, fiatStatusRes] = await Promise.all([
        supabase.from("accounts").select("id, account_type, account_number, balance").eq("user_id", user.id).eq("status", "active"),
        supabase.from("crypto_wallets").select("id, cryptocurrency, network, wallet_address, logo_url, wallet_name, min_deposit, confirmations_required, qr_code_url").eq("enabled", true),
        supabase.from("transactions").select("id, amount, reference, status, created_at").eq("user_id", user.id).eq("type", "deposit").eq("status", "pending"),
        supabase.from("crypto_deposits").select("id, status, tx_hash, created_at, crypto_wallets(cryptocurrency)").eq("user_id", user.id).eq("status", "pending"),
        supabase.from("cms_site_settings").select("value").eq("key", "fiat_network_status").single()
      ]);

      if (accRes.data) setAccounts(accRes.data as Account[]);
      if (walletsRes.data) setCryptoWallets(walletsRes.data as CryptoWallet[]);
      if (fiatStatusRes?.data) {
        try { setFiatBusy((fiatStatusRes.data.value as any)?.isBusy || false); } catch { setFiatBusy(false); }
      }

      const pendingList: PendingDeposit[] = [];
      if (fiatRes.data) {
        fiatRes.data.forEach((d: any) => pendingList.push({ id: d.id, type: 'fiat', amount: d.amount, reference: d.reference, status: d.status, created_at: d.created_at }));
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
    setDepositReference("");
  };

  const handleResume = (deposit: PendingDeposit) => {
    resetFlow();
    if (deposit.type === 'fiat') {
      setFundingMethod('fiat');
      setFiatStep('amount_entry');
      setAmount(deposit.amount?.toString() || "");
    } else {
      setFundingMethod('crypto');
    }
  };

  // Platform name as the deposit bank name
  const platformName = identity?.platform_name || "TrustBank Global";
  // User's registered name as the account name
  const accountHolderName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : profile?.display_name || "Account Holder";

  // ---------------- FIAT WORKFLOW ----------------

  const startFiatWorkflow = () => {
    if (fiatBusy) {
      setShowBusyDialog(true);
      return;
    }
    setFundingMethod('fiat');
    if (accounts.length === 1) {
      setSelectedAccount(accounts[0]);
      setFiatStep('amount_entry');
    } else {
      setFiatStep('account_selection');
    }
  };

  const proceedToBankDetails = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid deposit amount.", variant: "destructive" });
      return;
    }
    setFiatStep('bank_details');
  };

  const confirmDeposit = async () => {
    if (!user || !selectedAccount) return;
    setSubmittingDeposit(true);
    try {
      // Insert into payment_sessions so the admin deposits page can see and approve it.
      // The admin_approve_deposit RPC will create the actual transaction and credit the balance.
      const { error } = await supabase.from("payment_sessions").insert({
        user_id: user.id,
        account_id: selectedAccount.id,
        amount: Number(amount),
        method: "bank_transfer",
        reference: depositReference,
        status: "pending",
      });

      if (error) throw error;

      toast({ title: "Deposit Submitted", description: "Your deposit has been recorded and is pending confirmation by the admin team." });
      setFiatStep('confirmation');
      fetchData();
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message || "Could not record your deposit.", variant: "destructive" });
    } finally {
      setSubmittingDeposit(false);
    }
  };

  // ---------------- RENDERERS ----------------

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-3 max-w-3xl mx-auto px-2 sm:px-4 py-1 font-sans">
      {!fundingMethod && (
        <SlideUp>
          <div>
            <h1 className="text-base sm:text-lg font-bold font-poppins text-foreground mb-0.5">Fund Your Account</h1>
            <p className="text-xs text-muted-foreground">Select a funding method to deposit assets into your portfolio.</p>
          </div>

          {pendingDeposits.length > 0 && (
            <div className="mt-2.5 bg-warning/10 border border-warning/20 rounded-xl p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                <div>
                  <h3 className="font-bold text-warning text-xs">Pending Deposits</h3>
                  <p className="text-[11px] text-muted-foreground">You have {pendingDeposits.length} deposit(s) awaiting confirmation.</p>
                </div>
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                {pendingDeposits.slice(0, 2).map((pd) => (
                  <Button key={pd.id} variant="outline" size="sm" className="font-bold text-xs h-6 px-2.5 border-warning/30 bg-background/50 hover:bg-warning/20" onClick={() => handleResume(pd)}>
                    Resume {pd.type === 'fiat' ? 'Fiat' : pd.asset} Deposit <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 mt-3 max-w-xl mx-auto">
            <div 
              className="bg-card border border-border/60 rounded-xl p-3 shadow-sm hover:border-primary/40 cursor-pointer flex flex-col justify-between group transition-colors"
              onClick={startFiatWorkflow}
            >
              <div>
                <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-2 border border-primary/20">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold font-poppins text-foreground mb-0.5 group-hover:text-primary transition-colors">Fiat Deposit</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  Fund your account using a bank transfer or fiat payment methods.
                </p>
              </div>
              <div className="mt-2.5 flex items-center text-primary font-bold text-xs">
                Proceed <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div 
              className="bg-card border border-border/60 rounded-xl p-3 shadow-sm hover:border-primary/40 cursor-pointer flex flex-col justify-between group transition-colors"
              onClick={() => setFundingMethod('crypto')}
            >
              <div>
                <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-2 border border-primary/20">
                  <Bitcoin className="h-4 w-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold font-poppins text-foreground mb-0.5 group-hover:text-primary transition-colors">Digital Currency</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  Fund your account using supported digital currencies via wallet transfer.
                </p>
              </div>
              <div className="mt-2.5 flex items-center text-primary font-bold text-xs">
                Proceed <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </SlideUp>
      )}

      {fundingMethod === 'fiat' && (
        <FadeIn>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={resetFlow}><X className="h-3.5 w-3.5" /></Button>
            <h2 className="text-sm font-bold font-poppins">Fiat Deposit</h2>
          </div>

          {/* Step 1: Account Selection */}
          {fiatStep === 'account_selection' && (
            <div className="space-y-2.5 max-w-md mx-auto">
              <h3 className="font-bold text-foreground font-poppins text-xs">Select Account to Fund</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-card border border-border/60 rounded-xl p-3 shadow-sm">
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">{acc.account_type} Account</p>
                        <p className="font-mono font-bold text-xs">****{acc.account_number.slice(-4)}</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase bg-success/10 text-success px-2 py-0.5 rounded-md">Active</span>
                    </div>
                    <p className="text-lg font-bold font-poppins mb-2 hover:text-primary">${Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <Button size="sm" className="w-full font-bold text-xs h-7 rounded-lg" onClick={() => { setSelectedAccount(acc); setFiatStep('amount_entry'); }}>Fund {acc.account_type}</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Amount Entry */}
          {fiatStep === 'amount_entry' && selectedAccount && (
            <div className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm max-w-sm mx-auto space-y-3">
              <h3 className="font-bold text-foreground font-poppins text-xs border-b pb-2">Deposit Amount</h3>
              
              <div className="space-y-2 text-xs">
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount (USD)</Label>
                  <Input type="number" step="0.01" min="1" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 h-8 text-sm font-bold rounded-lg" />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 font-bold text-xs h-7 rounded-lg" onClick={resetFlow}>Cancel</Button>
                <Button className="flex-1 font-bold text-xs h-7 rounded-lg" onClick={proceedToBankDetails} disabled={!amount || Number(amount) <= 0}>
                  Proceed
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Bank Transfer Details */}
          {fiatStep === 'bank_details' && selectedAccount && (
            <div className="bg-card border border-border/80 rounded-xl shadow-lg max-w-sm mx-auto overflow-hidden font-sans">
              
              {/* Header Hero Banner */}
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/60 p-3 sm:p-3.5 relative">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary font-poppins">Official Payment Channel</span>
                  </div>
                  <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full bg-background border border-border text-muted-foreground">
                    Instant
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Deposit Amount</p>
                    <p className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                      ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Target Account</p>
                    <p className="text-[11px] font-bold text-primary capitalize font-poppins">{selectedAccount.account_type} (****{selectedAccount.account_number.slice(-4)})</p>
                  </div>
                </div>
              </div>

              {/* 3-Step Quick Guide */}
              <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60 bg-muted/20 text-center py-1.5 px-1 text-[9px]">
                <div className="px-1">
                  <span className="font-bold text-primary block">1. Copy</span>
                  <span className="text-muted-foreground block text-[8.5px]">Account Details</span>
                </div>
                <div className="px-1">
                  <span className="font-bold text-primary block">2. Transfer</span>
                  <span className="text-muted-foreground block text-[8.5px]">Via Bank App</span>
                </div>
                <div className="px-1">
                  <span className="font-bold text-primary block">3. Confirm</span>
                  <span className="text-muted-foreground block text-[8.5px]">Click Button</span>
                </div>
              </div>

              {/* Copyable Details List */}
              <div className="p-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-poppins">
                  Recipient Bank Information
                </p>

                {/* Bank Name */}
                <div 
                  className="group flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/10 hover:bg-primary/5 transition-all cursor-pointer active:scale-[0.99]"
                  onClick={() => handleCopy(platformName, "Bank Name")}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Building2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8.5px] font-bold uppercase tracking-widest text-muted-foreground">Bank Name</p>
                      <p className="text-xs font-bold text-foreground font-poppins truncate">{platformName}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-primary group-hover:bg-primary/10 rounded-md shrink-0 ml-1">
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>

                {/* Account Name */}
                <div 
                  className="group flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/10 hover:bg-primary/5 transition-all cursor-pointer active:scale-[0.99]"
                  onClick={() => handleCopy(accountHolderName, "Account Name")}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8.5px] font-bold uppercase tracking-widest text-muted-foreground">Beneficiary Name</p>
                      <p className="text-xs font-bold text-foreground font-poppins truncate">{accountHolderName}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-primary group-hover:bg-primary/10 rounded-md shrink-0 ml-1">
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>

                {/* Account Number */}
                <div 
                  className="group flex items-center justify-between p-2.5 rounded-lg border border-primary/30 bg-primary/[0.03] hover:bg-primary/10 transition-all cursor-pointer active:scale-[0.99]"
                  onClick={() => handleCopy(selectedAccount.account_number, "Account Number")}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                      <Hash className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8.5px] font-bold uppercase tracking-widest text-primary font-poppins">Account Number</p>
                      <p className="text-sm font-black font-mono tracking-wider text-foreground truncate">{selectedAccount.account_number}</p>
                    </div>
                  </div>
                  <Button variant="default" size="sm" className="h-7 px-2.5 text-[10px] font-bold rounded-md shrink-0 ml-1">
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>

                {/* Payment Reference */}
                <div 
                  className="group flex items-center justify-between p-2.5 rounded-lg border border-warning/30 bg-warning/[0.04] hover:bg-warning/10 transition-all cursor-pointer active:scale-[0.99]"
                  onClick={() => handleCopy(depositReference, "Payment Reference")}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-md bg-warning/15 text-warning-foreground flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-3.5 w-3.5 text-warning" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8.5px] font-bold uppercase tracking-widest text-warning font-poppins">Payment Narration / Reference</p>
                      <p className="text-xs font-bold font-mono text-foreground truncate">{depositReference}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-[10px] font-bold border-warning/30 text-warning hover:bg-warning/10 rounded-md shrink-0 ml-1">
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>

                {/* Important Alert */}
                <div className="mt-2 bg-muted/40 border border-border/60 rounded-lg p-2 flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    <strong className="text-foreground">Important:</strong> Include the Payment Reference in your transfer description for automatic processing.
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-3 bg-muted/20 border-t border-border/60 flex gap-2">
                <Button variant="outline" className="h-8 px-3 font-bold text-xs rounded-lg border-border" onClick={() => setFiatStep('amount_entry')}>
                  Back
                </Button>
                <Button className="flex-1 h-8 font-bold text-xs rounded-lg font-poppins" onClick={confirmDeposit} disabled={submittingDeposit}>
                  {submittingDeposit ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  I Have Sent the Funds
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {fiatStep === 'confirmation' && (
            <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm max-w-md mx-auto text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <div>
                <h3 className="font-bold text-foreground font-poppins text-base">Deposit Submitted</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Your deposit of <strong className="text-foreground">${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> has been recorded. Your account will be credited once the transfer is confirmed by our team.
                </p>
              </div>
              <div className="bg-muted/30 border border-border/40 rounded-lg p-3 text-left space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono font-bold text-foreground">{depositReference}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-bold text-warning">Pending Confirmation</span>
                </div>
              </div>
              <Button className="w-full font-bold text-xs h-8 rounded-lg" onClick={resetFlow}>
                Done
              </Button>
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
}
