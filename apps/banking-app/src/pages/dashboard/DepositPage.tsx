import { useState, useEffect } from "react";
import { 
  Building2, Bitcoin, ArrowRight, Copy, CheckCircle2, AlertTriangle, 
  Upload, ExternalLink, RefreshCw, X, ShieldCheck
} from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { Label } from "@trustbank/shared-ui/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@trustbank/shared-ui/components/ui/dialog";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";
import { QRCodeSVG } from "qrcode.react";
import { Textarea } from "@trustbank/shared-ui/components/ui/textarea";
import CryptoDepositExperience from "@/components/dashboard/deposits/CryptoDepositExperience";
import { sanitizeInput } from "@trustbank/shared-utils/utils/security";

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
type FiatStep = 'account_selection' | 'instructions' | 'upload';
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
  const [txHash, setTxHash] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
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
    setTxHash("");
    setProofFile(null);
    setResumedDepositId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleResume = (deposit: PendingDeposit) => {
    resetFlow();
    setResumedDepositId(deposit.id);
    if (deposit.type === 'fiat') {
      setFundingMethod('fiat');
      setFiatStep('upload');
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
      setFiatStep('instructions');
    } else {
      setFiatStep('account_selection');
    }
  };

  const submitFiatDeposit = async () => {
    if (!user || !selectedAccount || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: "Invalid Input", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    setUploading(true);
    
    try {
      const reference = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      let proofUrl = null;
      if (proofFile) {
        // Strict MIME validation for deposit proof
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(proofFile.type)) {
          toast({ title: "Invalid File Type", description: "Only JPG, PNG, WEBP, or PDF allowed for proof of payment.", variant: "destructive" });
          setUploading(false);
          return;
        }
        if (proofFile.size > 10 * 1024 * 1024) {
          toast({ title: "File Too Large", description: "Proof of payment must be under 10MB.", variant: "destructive" });
          setUploading(false);
          return;
        }
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${user.id}/fiat-proof-${reference}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("documents").upload(fileName, proofFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName);
        proofUrl = urlData.publicUrl;
      }

      if (resumedDepositId) {
        const { error } = await supabase.from("payment_sessions").update({
          status: "under_review", proof_url: proofUrl, amount: Number(amount)
        }).eq("id", resumedDepositId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payment_sessions").insert({
          user_id: user.id, account_id: selectedAccount.id, amount: Number(amount),
          method: "bank_transfer", reference, status: proofUrl ? "under_review" : "pending_payment",
          proof_url: proofUrl
        });
        if (error) throw error;
      }

      toast({ title: "Success", description: "Your deposit has been submitted for review.", variant: "default" });
      resetFlow();
      fetchData();
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // ---------------- RENDERERS ----------------

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!fundingMethod && (
        <SlideUp>
          <div>
            <h1 className="text-3xl font-bold font-poppins text-foreground mb-2">Fund Your Account</h1>
            <p className="text-muted-foreground font-sans text-sm">Select a funding method to seamlessly deposit assets into your TrustBank portfolio.</p>
          </div>

          {pendingDeposits.length > 0 && (
            <div className="mt-6 bg-warning/10 border border-warning/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                <div>
                  <h3 className="font-bold text-warning text-sm">Incomplete Deposits Detected</h3>
                  <p className="text-xs text-muted-foreground font-sans">You have {pendingDeposits.length} deposit(s) awaiting confirmation or payment proof.</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                {pendingDeposits.slice(0, 2).map((pd) => (
                  <Button key={pd.id} variant="outline" size="sm" className="font-bold border-warning/30 bg-background/50 hover:bg-warning/20" onClick={() => handleResume(pd)}>
                    Resume {pd.type === 'fiat' ? 'Fiat' : pd.asset} Deposit <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:gap-6 mt-8">
            <div 
              className="bg-card border rounded-2xl p-4 sm:p-6 shadow-sm hover-lift cursor-pointer flex flex-col justify-between group"
              onClick={startFiatWorkflow}
            >
              <div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-3 sm:mb-4 border border-primary/20">
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="text-sm sm:text-xl font-bold font-poppins text-foreground mb-1.5 sm:mb-2 group-hover:text-primary transition-colors">Fiat Deposit</h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed line-clamp-4 sm:line-clamp-none">
                  Fund your TrustBank account using a bank transfer or other supported fiat payment methods. Funds are credited after successful verification where applicable.
                </p>
              </div>
              <div className="mt-4 sm:mt-6 flex items-center text-primary font-bold text-xs sm:text-sm">
                Proceed <ArrowRight className="ml-1 sm:ml-1.5 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div 
              className="bg-card border rounded-2xl p-4 sm:p-6 shadow-sm hover-lift cursor-pointer flex flex-col justify-between group"
              onClick={() => setFundingMethod('crypto')}
            >
              <div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 mb-3 sm:mb-4 border border-purple-500/20">
                  <Bitcoin className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="text-sm sm:text-xl font-bold font-poppins text-foreground mb-1.5 sm:mb-2 group-hover:text-purple-600 transition-colors">Digital Currency</h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed line-clamp-4 sm:line-clamp-none">
                  Fund your TrustBank account using supported digital currencies through a secure wallet transfer process.
                </p>
              </div>
              <div className="mt-4 sm:mt-6 flex items-center text-purple-600 font-bold text-xs sm:text-sm">
                Proceed <ArrowRight className="ml-1 sm:ml-1.5 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </SlideUp>
      )}

      {fundingMethod === 'fiat' && (
        <FadeIn>
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="icon" onClick={resetFlow}><X className="h-4 w-4" /></Button>
            <h2 className="text-xl font-bold font-poppins">Fiat Deposit Workflow</h2>
          </div>

          {fiatStep === 'account_selection' && (
            <div className="space-y-6">
              <h3 className="font-bold text-foreground font-poppins">Select the Account You Want to Fund</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-card border rounded-xl p-5 hover-lift">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{acc.account_type} Account</p>
                        <p className="font-mono font-bold text-lg">{acc.account_number}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-success/10 text-success px-2 py-0.5 rounded-sm">Active</span>
                    </div>
                    <p className="text-2xl font-bold font-poppins mb-4">${Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <Button className="w-full font-bold" onClick={() => { setSelectedAccount(acc); setFiatStep('instructions'); }}>Fund {acc.account_type.charAt(0).toUpperCase() + acc.account_type.slice(1)}</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fiatStep === 'instructions' && selectedAccount && (
            <div className="bg-card border rounded-2xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
              <h3 className="font-bold text-foreground font-poppins text-lg border-b pb-4">Deposit Instructions</h3>
              
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <p className="text-sm font-sans mb-3 text-foreground/80">Please transfer your funds to the following institutional account:</p>
                {fiatBanks.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-xs font-semibold text-muted-foreground">Account Name</span>
                      <span className="font-bold text-sm">{fiatBanks[0].account_name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-xs font-semibold text-muted-foreground">Bank Name</span>
                      <span className="font-bold text-sm">{fiatBanks[0].bank_name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-xs font-semibold text-muted-foreground">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-sm">{fiatBanks[0].account_number}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(fiatBanks[0].account_number, "Account Number")}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    {fiatBanks[0].routing_number && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-xs font-semibold text-muted-foreground">Routing Number</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-sm">{fiatBanks[0].routing_number}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(fiatBanks[0].routing_number!, "Routing Number")}><Copy className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    )}
                    {fiatBanks[0].swift_code && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-xs font-semibold text-muted-foreground">SWIFT/BIC Code</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-sm">{fiatBanks[0].swift_code}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(fiatBanks[0].swift_code!, "SWIFT/BIC Code")}><Copy className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-xs font-semibold text-muted-foreground">Beneficiary Note</span>
                      <span className="font-bold text-sm font-mono">{selectedAccount.account_number} (Your A/C)</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No institutional fiat bank accounts are currently configured. Please contact support.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Process</p>
                <ol className="list-decimal list-inside text-sm text-foreground/80 font-sans space-y-1.5 ml-1">
                  <li>Transfer the desired amount to the account shown above.</li>
                  <li>Use your Account Number as the payment reference if possible.</li>
                  <li>Return to this page after completing the transfer.</li>
                  <li>Click continue to submit your payment confirmation.</li>
                  <li>Your deposit will be credited after verification.</li>
                </ol>
              </div>

              <Button className="w-full font-bold h-12" onClick={() => setFiatStep('upload')}>I have made the transfer</Button>
            </div>
          )}

          {fiatStep === 'upload' && (
            <div className="bg-card border rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-6">
              <h3 className="font-bold text-foreground font-poppins text-lg border-b pb-4">Submit Verification</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Deposit Amount</Label>
                  <Input type="number" placeholder="Enter amount transferred" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Upload Payment Receipt (Optional but recommended)</Label>
                  <div className="mt-1 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center bg-muted/20 hover:bg-muted/40 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                    <Input type="file" className="hidden" id="fiat-proof" onChange={handleFileChange} accept="image/*,.pdf" />
                    <Label htmlFor="fiat-proof" className="cursor-pointer">
                      <span className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-lg text-xs hover:bg-primary/20 transition-colors">Browse Files</span>
                    </Label>
                    {proofFile && <p className="mt-3 text-xs font-bold text-primary">{proofFile.name}</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 font-bold" onClick={resetFlow}>Cancel</Button>
                <Button className="flex-1 font-bold" onClick={submitFiatDeposit} disabled={uploading}>
                  {uploading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Submit Verification
                </Button>
              </div>
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
        <DialogContent className="max-w-sm text-center p-6">
          <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold font-poppins mb-2">Network Busy</DialogTitle>
          <DialogDescription className="text-sm font-sans mb-6">
            The fiat deposit network is currently experiencing high volume and cannot accept new transfers right now. We recommend using Digital Currency deposits which are processed instantly.
          </DialogDescription>
          <div className="flex flex-col gap-3">
            <Button className="w-full font-bold" onClick={() => { setShowBusyDialog(false); setFundingMethod('crypto'); }}>
              <Bitcoin className="w-4 h-4 mr-2" /> Use Digital Currency
            </Button>
            <Button variant="outline" className="w-full font-bold" onClick={() => setShowBusyDialog(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
