import { useState, useEffect } from "react";
import { 
  Building2, Bitcoin, ArrowRight, Copy, CheckCircle2, AlertTriangle, 
  Upload, ExternalLink, RefreshCw, X, ShieldCheck, Check, Clock, ChevronRight, Hash, ArrowLeft
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

interface Props {
  accounts: Account[];
  cryptoWallets: CryptoWallet[];
  onBack: () => void;
}

const CryptoDepositExperience = ({ accounts, cryptoWallets, onBack }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<number>(1);
  const [selectedWallet, setSelectedWallet] = useState<CryptoWallet | null>(null);
  const [copied, setCopied] = useState(false);
  const [showThirdPartyNotice, setShowThirdPartyNotice] = useState(false);
  const [showSecurityNotice, setShowSecurityNotice] = useState(true);
  
  // Form State
  const [accountId, setAccountId] = useState("");
  const [txHash, setTxHash] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Pending Deposit State
  const [pendingDeposit, setPendingDeposit] = useState<PendingDeposit | null>(null);

  useEffect(() => {
    fetchPendingDeposits();
    if (cryptoWallets && cryptoWallets.length > 0) {
      setSelectedWallet(cryptoWallets[0]);
    }
  }, [cryptoWallets]);

  const fetchPendingDeposits = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('crypto_deposits')
      .select('*, crypto_wallets(cryptocurrency)')
      .eq('user_id', user.id)
      .in('status', ['pending', 'under_review'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setPendingDeposit({
        id: data[0].id,
        type: 'crypto',
        amount: data[0].amount || undefined,
        asset: (data[0] as any).crypto_wallets?.cryptocurrency,
        status: data[0].status,
        reference: data[0].tx_hash || undefined,
        created_at: data[0].created_at
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Address Copied", description: "Wallet address copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmSecurityNotice = () => {
    setShowSecurityNotice(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
      setScreenshotUrl(publicUrl);
      toast({ title: "Upload Successful", description: "Screenshot attached." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleMadeTransfer = async () => {
    if (!user || !selectedWallet) return;

    if (!pendingDeposit) {
      setIsSubmitting(true);
      const { data, error } = await supabase.from('crypto_deposits').insert({
        user_id: user.id,
        wallet_id: selectedWallet.id,
        status: 'pending'
      }).select().single();

      setIsSubmitting(false);

      if (error) {
        toast({ title: "Failed to initialize deposit", description: error.message, variant: "destructive" });
        return;
      }
      
      setPendingDeposit({
        id: data.id,
        type: 'crypto',
        asset: selectedWallet.cryptocurrency,
        status: data.status,
        created_at: data.created_at
      });
    }
    
    setStep(2);
  };

  const submitDeposit = async () => {
    if (!user || !selectedWallet || !accountId || !txHash || !amount) {
      toast({ title: "Missing Information", description: "Please complete all required fields.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (pendingDeposit) {
        const { error } = await supabase.from('crypto_deposits').update({
          amount: parseFloat(amount),
          tx_hash: txHash,
          proof_url: screenshotUrl,
          admin_notes: notes,
          status: 'under_review'
        }).eq('id', pendingDeposit.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase.from('crypto_deposits').insert({
          user_id: user.id,
          wallet_id: selectedWallet.id,
          amount: parseFloat(amount),
          tx_hash: txHash,
          proof_url: screenshotUrl,
          admin_notes: notes,
          status: 'under_review'
        });
        
        if (error) throw error;
      }

      toast({ title: "Deposit Submitted", description: "Your transaction is now under review." });
      setStep(4);
      fetchPendingDeposits();
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const proceedToThirdParty = () => {
    window.open("https://mercuryo.io", "_blank");
    setShowThirdPartyNotice(false);
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${selectedWallet?.cryptocurrency}-QR.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const renderTimeline = () => (
    <div className="w-full bg-card rounded-2xl sm:rounded-3xl border shadow-sm p-3 sm:p-4 mb-4 sm:mb-6 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[450px] sm:min-w-[600px]">
        {[
          { label: "Wallet Details", num: 1 },
          { label: "Send Crypto", num: 2 },
          { label: "Submit Hash", num: 3 },
          { label: "Verification", num: 4 }
        ].map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex flex-col items-center gap-2 ${step >= s.num ? "text-primary" : "text-muted-foreground opacity-50"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step >= s.num ? "bg-primary/10 border-primary" : "bg-muted border-muted-foreground"}`}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">{s.label}</span>
            </div>
            {i < 3 && (
              <div className={`flex-1 h-0.5 mx-4 ${step > s.num ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 sm:space-y-6 pb-10">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted shrink-0 h-8 w-8 sm:h-10 sm:w-10"><ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /></Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-poppins text-foreground">Digital Currency Deposit</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans">Securely fund your account with supported digital assets.</p>
        </div>
      </div>

      {renderTimeline()}

      {pendingDeposit && pendingDeposit.status !== 'credited' && pendingDeposit.status !== 'rejected' && (
        <SlideUp className="mb-6">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Pending Deposit Detected</h3>
                <p className="text-sm text-muted-foreground">You have a {pendingDeposit.asset} deposit currently in '{pendingDeposit.status.replace('_', ' ')}' status.</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {pendingDeposit.status === 'pending' ? (
                <Button className="w-full sm:w-auto" onClick={() => {
                  if (cryptoWallets && cryptoWallets.length > 0) { 
                    setSelectedWallet(cryptoWallets[0]); 
                  }
                  setStep(3);
                }}>Resume Submission</Button>
              ) : (
                <Button variant="outline" className="w-full sm:w-auto font-bold" disabled>Under Review</Button>
              )}
            </div>
          </div>
        </SlideUp>
      )}

      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="space-y-4 sm:space-y-6">
          {step >= 1 && selectedWallet && step < 4 && (
            <FadeIn className="space-y-4 sm:space-y-6">
              <div className="bg-card border rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
                <div className="bg-muted/30 p-3 sm:p-4 border-b flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 rounded-full bg-background border flex items-center justify-center shrink-0">
                    {selectedWallet.logo_url ? <img src={selectedWallet.logo_url} alt={selectedWallet.cryptocurrency} className="w-5 h-5" /> : <Bitcoin className="w-5 h-5 text-foreground" />}
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground leading-tight text-lg">{selectedWallet.cryptocurrency} Deposit Wallet</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Network: <span className="font-bold text-foreground px-1.5 py-0.5 bg-muted rounded border">{selectedWallet.network || 'Native'}</span></p>
                  </div>
                </div>
                
                <div className="p-4 flex flex-col md:flex-row gap-4 items-center md:items-start">
                  <div className="bg-white p-2 rounded-xl border shrink-0 relative group shadow-sm">
                    <QRCode id="qr-code-svg" value={selectedWallet.wallet_address || ""} size={120} level="H" />
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-xl backdrop-blur-sm">
                      <Button size="sm" variant="secondary" className="text-[10px] font-bold h-7" onClick={downloadQRCode}>Download QR</Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Deposit Address</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <Input value={selectedWallet.wallet_address} readOnly className="font-mono text-xs bg-muted/20 border-primary/20 focus-visible:ring-primary/30 h-10 pr-12 text-foreground" />
                        </div>
                        <Button variant="default" onClick={() => copyToClipboard(selectedWallet.wallet_address)} className="shrink-0 h-10 px-4 text-xs font-bold shadow-sm">
                          {copied ? <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Copied</> : <><Copy className="w-4 h-4 mr-1.5" /> Copy</>}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-muted/20 p-3 rounded-lg border border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Minimum Deposit</p>
                        <p className="font-bold text-sm text-foreground">{selectedWallet.min_deposit} {selectedWallet.cryptocurrency}</p>
                      </div>
                      <div className="bg-muted/20 p-3 rounded-lg border border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Confirmations</p>
                        <p className="font-bold text-sm text-foreground">{selectedWallet.confirmations_required} blocks</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {step === 1 && (
                <div className="flex justify-end pt-2">
                  <Button className="font-bold h-10 px-5 text-xs shadow-sm" onClick={handleMadeTransfer} disabled={isSubmitting}>
                    {isSubmitting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                    I have made the transfer
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="bg-card border rounded-2xl sm:rounded-3xl shadow-sm p-6 sm:p-8 text-center flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-5 border border-primary/20">
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-2 sm:mb-3">Awaiting Transfer</h2>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm leading-relaxed">
                    Once you have successfully sent the funds from your wallet, you must submit the transaction hash (TxID) to complete the verification process.
                  </p>
                  <Button className="font-bold h-10 px-6 text-xs shadow-sm" onClick={() => setStep(3)}>
                    Submit Hash <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              )}

              {step === 3 && (
                <div className="bg-card border rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
                  <div className="flex items-center gap-2 sm:gap-3 border-b pb-3 sm:pb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg font-poppins text-foreground">Submit Verification</h3>
                      <p className="text-[10px] sm:text-sm text-muted-foreground">Provide the transaction details so we can verify and credit your account.</p>
                    </div>
                  </div>

                  <div className="space-y-5 pt-2">
                    <div>
                      <Label className="text-xs font-semibold">Credit To Account</Label>
                      <select className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                        <option value="">Select account...</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.account_type.toUpperCase()} - {a.account_number}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label className="text-xs font-semibold">Deposit Amount ({selectedWallet.cryptocurrency})</Label>
                        <Input type="number" step="0.000001" placeholder="e.g. 1.5" className="mt-1 h-10 text-xs" value={amount} onChange={(e) => setAmount(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Transaction Hash (TxID)</Label>
                        <Input placeholder="Enter hash..." className="mt-1 font-mono text-[10px] h-10" value={txHash} onChange={(e) => setTxHash(e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold flex items-center justify-between">
                        <span>Upload Proof (Screenshot)</span>
                        {uploading && <span className="text-xs text-primary font-bold animate-pulse">Uploading...</span>}
                      </Label>
                      <div className={`mt-1.5 border-2 border-dashed rounded-xl p-5 text-center transition-all ${screenshotUrl ? 'bg-success/5 border-success/30' : 'hover:bg-muted/30 border-muted-foreground/20'}`}>
                        <input type="file" id="crypto-receipt" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} />
                        <label htmlFor="crypto-receipt" className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className={`w-6 h-6 ${screenshotUrl ? 'text-success' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-bold ${screenshotUrl ? 'text-success' : 'text-primary'}`}>
                            {screenshotUrl ? 'Proof Attached' : 'Click to attach proof'}
                          </span>
                          <span className="text-xs text-muted-foreground">JPG, PNG, PDF (Max 5MB)</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Additional Notes (Optional)</Label>
                      <Textarea placeholder="Any instructions or context for our team..." className="mt-1.5 resize-none h-24" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                    <Button variant="outline" className="font-bold h-10 px-4 text-xs" onClick={() => setStep(1)}>Back</Button>
                    <Button className="font-bold h-10 px-6 text-xs shadow-sm" onClick={submitDeposit} disabled={isSubmitting || !accountId || !txHash || !amount || uploading}>
                      {isSubmitting ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-1.5" />}
                      Submit
                    </Button>
                  </div>
                </div>
              )}
            </FadeIn>
          )}

          {step === 4 && (
            <FadeIn>
              <div className="bg-card border rounded-2xl sm:rounded-3xl shadow-sm p-6 sm:p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-success/10 rounded-full flex items-center justify-center mb-4 sm:mb-5 border border-success/20">
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-success" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-poppins text-foreground mb-2 sm:mb-3">Verification Submitted</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm leading-relaxed">
                  Your transaction details have been securely received. Our system will verify the blockchain confirmations and credit your account shortly.
                </p>
                <div className="bg-muted/20 p-5 rounded-xl w-full max-w-md border space-y-3 mb-8 text-left shadow-sm">
                  <div className="flex justify-between items-center text-sm border-b border-border/50 pb-3">
                    <span className="text-muted-foreground font-medium">Status</span>
                    <span className="font-bold text-warning flex items-center gap-1.5 bg-warning/10 px-2.5 py-1 rounded-md"><Clock className="w-3.5 h-3.5" /> Under Review</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-border/50 pb-3">
                    <span className="text-muted-foreground font-medium">Deposit Amount</span>
                    <span className="font-bold font-mono text-foreground">{amount} {selectedWallet?.cryptocurrency}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Tx Hash</span>
                    <span className="font-mono text-xs truncate max-w-[180px] text-foreground font-semibold">{txHash}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                  <Button variant="outline" className="flex-1 font-bold h-11" onClick={() => { setSelectedWallet(null); setStep(1); setTxHash(""); setAmount(""); setScreenshotUrl(null); }}>Make Another Deposit</Button>
                  <Button className="flex-1 font-bold h-11 shadow-sm" onClick={onBack}>Return to Dashboard</Button>
                </div>
              </div>
            </FadeIn>
          )}

        </div>

        <div className="space-y-6">
          {/* NEED DIGITAL CURRENCY CARD */}
          <div className="bg-card border rounded-3xl overflow-hidden shadow-sm relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
            <div className="p-6 relative z-10">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg font-poppins text-foreground mb-2">Need Digital Currency?</h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Don't already own cryptocurrency? Securely purchase supported digital assets through our trusted third-party providers. 
              </p>
              <ul className="text-xs text-foreground/80 space-y-2 mb-4 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success shrink-0" /> Secure purchase & fast onboarding</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success shrink-0" /> Multiple payment methods</li>
              </ul>
              <Button className="w-full font-bold shadow-sm h-10 text-xs" onClick={() => setShowThirdPartyNotice(true)}>
                Buy Digital Currency
              </Button>
            </div>
          </div>
          
          {/* INSTRUCTIONS */}
          <div className="bg-card border rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" /> Quick Guide
            </h3>
            <ol className="text-sm text-foreground space-y-3.5 pl-5 list-decimal marker:font-bold marker:text-primary marker:text-base leading-relaxed">
              <li className="pl-2">Choose your preferred cryptocurrency.</li>
              <li className="pl-2">Verify that the blockchain network matches exactly.</li>
              <li className="pl-2">Copy the wallet address or scan the QR code.</li>
              <li className="pl-2">Send your funds from your external wallet.</li>
              <li className="pl-2">Return here to submit your transaction hash.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* THIRD PARTY NOTICE MODAL */}
      <Dialog open={showThirdPartyNotice} onOpenChange={setShowThirdPartyNotice}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-poppins"><ExternalLink className="h-5 w-5 text-primary" /> You Are Leaving TrustBank</DialogTitle>
            <DialogDescription asChild>
              <div className="text-foreground pt-4 space-y-3 text-sm">
                <p>You are about to visit a trusted third-party platform to purchase digital currency.</p>
                <div className="bg-muted/30 p-4 rounded-xl border mt-4">
                  <p className="font-bold text-xs uppercase tracking-widest text-foreground mb-3">Before continuing:</p>
                  <ul className="list-disc list-inside space-y-2 ml-1 text-muted-foreground text-xs font-medium">
                    <li>Confirm the website URL before entering data.</li>
                    <li>Complete your purchase directly with the provider.</li>
                    <li>After purchasing, return to TrustBank to submit your hash.</li>
                    <li>TrustBank does not control third-party platforms.</li>
                  </ul>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setShowThirdPartyNotice(false)}>Cancel</Button>
            <Button className="font-bold" onClick={proceedToThirdParty}>Continue to Provider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSecurityNotice} onOpenChange={(open) => !open && setShowSecurityNotice(false)}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Important Security Notice
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm font-semibold text-foreground">
              Sending funds to an incorrect address or an unsupported blockchain network will result in permanent loss. TrustBank cannot recover lost transactions.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2 ml-1">
              <li>Never manually type the wallet address. Always use Copy.</li>
              <li>Verify the first 4 and last 4 characters before confirming.</li>
              <li>Ensure the selected blockchain network matches exactly.</li>
            </ul>
          </div>
          <DialogFooter>
            <Button className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground w-full" onClick={confirmSecurityNotice}>
              Acknowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CryptoDepositExperience;
