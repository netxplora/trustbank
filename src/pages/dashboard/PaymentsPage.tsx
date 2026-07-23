import { useState, useEffect } from "react";
import { Receipt, Smartphone, Wifi, QrCode, Plus, CheckCircle2, ScanLine, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "react-router-dom";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";
import QRCode from "@/components/ui/QRCode";

interface Payee { id: string; payee_name: string; category: string; account_number_masked: string; payment_method: string; }
interface Payment { id: string; payment_type: string; provider: string | null; amount: number; status: string; created_at: string; }
interface Account { id: string; account_type: string; account_number: string; balance: number; currency: string; }

export default function PaymentsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  
  const [payees, setPayees] = useState<Payee[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [activeTab, setActiveTab] = useState<"bills" | "airtime" | "data" | "qr">("bills");

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get("tab") as any;
    if (tabParam && ["bills", "airtime", "data", "qr"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Bills State
  const [selectedPayeeId, setSelectedPayeeId] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"once" | "weekly" | "monthly">("once");

  // Telecom State
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState("");
  const [dataPlan, setDataPlan] = useState("");
  const [airtimeAmt, setAirtimeAmt] = useState("");

  // QR State
  const [qrMode, setQrMode] = useState<"scan" | "receive">("scan");

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    setFetching(true);
    await Promise.all([fetchPayees(), fetchAccounts(), fetchPayments()]);
    setFetching(false);
  };

  const fetchPayees = async () => {
    try {
      const { data } = await supabase.from("payees").select("*").eq("user_id", user?.id || "");
      const list = (data as Payee[]) || [];
      setPayees(list);
      if (list.length > 0) setSelectedPayeeId(list[0].id);
    } catch (e) { console.error(e); }
  };

  const fetchAccounts = async () => {
    try {
      const { data } = await supabase.from("accounts").select("*").eq("user_id", user?.id || "").eq("status", "active");
      const list = (data as Account[]) || [];
      setAccounts(list);
      if (list.length > 0) setSelectedAccountId(list[0].id);
    } catch (e) { console.error(e); }
  };

  const fetchPayments = async () => {
    try {
      const { data } = await supabase.from("payments").select("*").eq("user_id", user?.id || "").order("created_at", { ascending: false }).limit(8);
      setPayments((data as Payment[]) || []);
    } catch (e) { console.error(e); }
  };

  const handleTransaction = async (type: "bill" | "airtime" | "data", txAmount: number, details: any) => {
    if (!user || !selectedAccountId) return;
    const account = accounts.find((a) => a.id === selectedAccountId);
    if (!account || account.balance < txAmount) {
      toast({ title: "Insufficient Funds", description: "Account balance too low.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let rpcName = "process_bill_payment";
      let p_payee_name = "";
      let p_category = "";
      let p_account_masked = "";

      if (type === "bill") {
        const payee = payees.find((p) => p.id === details.payeeId);
        if (!payee) throw new Error("Payee not found");
        p_payee_name = payee.payee_name;
        p_category = payee.category;
        p_account_masked = payee.account_number_masked;
      } else {
        p_payee_name = `${details.network.toUpperCase()} ${type === "airtime" ? "Airtime" : "Data"}`;
        p_category = type;
        p_account_masked = details.phone;
      }

      if (type === "bill" && frequency !== "once") {
        const nextDate = new Date();
        if (frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
        else if (frequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);

        const { error } = await supabase.from("scheduled_payments").insert({
          payee_id: details.payeeId, account_id: account.id, amount: txAmount, frequency: frequency, next_payment_date: nextDate.toISOString(), status: "active",
        });
        if (error) throw error;
        toast({ title: "Payment Scheduled", description: `Queued recurring payment to ${p_payee_name}.` });
      } else {
        const { error: rpcError } = await (supabase.rpc as any)(rpcName, {
          p_user_id: user.id, p_account_id: account.id, p_payee_name, p_category, p_amount: txAmount, p_account_masked
        });
        if (rpcError) throw rpcError;
        toast({ title: "Transaction Successful!", description: `Paid $${txAmount.toLocaleString()} for ${p_payee_name}.` });
      }

      setAmount(""); setAirtimeAmt(""); setDataPlan("");
      fetchData();
    } catch (e: any) {
      toast({ title: "Transaction Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { toast({ title: "Invalid Amount", variant: "destructive" }); return; }
    handleTransaction("bill", amt, { payeeId: selectedPayeeId });
  };

  const onSubmitTelecom = (e: React.FormEvent, type: "airtime" | "data") => {
    e.preventDefault();
    if (!phone || phone.length < 10) { toast({ title: "Invalid Phone Number", variant: "destructive" }); return; }
    if (!network) { toast({ title: "Select Network", variant: "destructive" }); return; }

    const amt = parseFloat(type === "airtime" ? airtimeAmt : dataPlan.split("-")[1]);
    if (isNaN(amt) || amt <= 0) { toast({ title: "Invalid Amount", variant: "destructive" }); return; }
    handleTransaction(type, amt, { phone, network });
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 pb-8 font-sans">
      <div>
        <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Services & Payments</h1>
        <p className="text-xs text-muted-foreground">Manage bills, prepaid refills, data plans, and QR payments</p>
      </div>

      {/* Fintech Service Tabs */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-muted/30 rounded-xl border border-border/50">
        {[
          { id: "bills", label: "Pay Bills", icon: Receipt },
          { id: "airtime", label: "Prepaid", icon: Smartphone },
          { id: "data", label: "Data Plan", icon: Wifi },
          { id: "qr", label: "QR Code", icon: QrCode },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 ${isActive ? "bg-background shadow-sm border border-border text-primary font-bold" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
            >
              <Icon className="h-4 w-4 mb-1" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] sm:text-xs font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {fetching ? (
        <div className="flex items-center justify-center py-16"><div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 h-full">
            <SlideUp>
              <div className="bg-card rounded-xl border border-border/60 shadow-sm p-4 sm:p-5 relative overflow-hidden h-full">
                
                {/* Account Selection for transactions */}
                {activeTab !== "qr" && (
                  <div className="mb-4">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Debit From</label>
                    <select
                      className="w-full rounded-lg border border-input bg-background px-3 h-9 text-xs font-semibold"
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.account_type.toUpperCase()} - ****{a.account_number.slice(-4)} (${Number(a.balance).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Bill Payments Tab */}
                {activeTab === "bills" && (
                  <form onSubmit={onSubmitBill} className="space-y-3.5">
                    {payees.length === 0 ? (
                      <div className="text-center p-5 bg-muted/10 rounded-xl border border-dashed">
                        <Receipt className="h-6 w-6 text-muted-foreground mx-auto mb-1.5" />
                        <p className="text-xs font-semibold mb-1.5">No Saved Billers</p>
                        <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg" asChild><Link to="/dashboard/payees">Add Biller</Link></Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Select Biller</label>
                          <select className="w-full rounded-lg border border-input bg-background px-3 h-9 text-xs" value={selectedPayeeId} onChange={(e) => setSelectedPayeeId(e.target.value)}>
                            {payees.map((p) => <option key={p.id} value={p.id}>{p.payee_name} ({p.category.toUpperCase()})</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Amount ($)</label>
                            <Input type="number" step="0.01" placeholder="0.00" required value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 text-xs rounded-lg" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Frequency</label>
                            <select className="w-full rounded-lg border border-input bg-background px-2.5 h-9 text-xs" value={frequency} onChange={(e) => setFrequency(e.target.value as any)}>
                              <option value="once">Once</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                            </select>
                          </div>
                        </div>
                        <Button type="submit" size="sm" className="w-full h-9 rounded-lg text-xs font-bold mt-1" disabled={loading}>
                          {loading ? "Processing..." : frequency === "once" ? "Pay Bill Now" : "Schedule Payment"}
                        </Button>
                      </>
                    )}
                  </form>
                )}

                {/* Airtime & Data Tabs */}
                {(activeTab === "airtime" || activeTab === "data") && (
                  <form onSubmit={(e) => onSubmitTelecom(e, activeTab)} className="space-y-3.5">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Select Carrier</label>
                      <div className="grid grid-cols-4 gap-2">
                        {["AT&T", "Verizon", "T-Mobile", "Mint"].map(net => {
                          const key = net.toLowerCase().replace(/[^a-z]/g, '');
                          return (
                          <div 
                            key={net} onClick={() => setNetwork(key)}
                            className={`cursor-pointer rounded-xl border p-2 flex flex-col items-center justify-center transition-all ${network === key ? "bg-primary/10 border-primary ring-1 ring-primary" : "bg-card hover:border-primary/50"}`}
                          >
                            <div className={`w-6 h-6 rounded-full mb-1 flex items-center justify-center font-bold text-[10px] text-white ${net === "AT&T" ? "bg-blue-600" : net === "Verizon" ? "bg-red-600" : net === "T-Mobile" ? "bg-pink-600" : "bg-green-600"}`}>
                              {net.charAt(0)}
                            </div>
                            <span className="text-[9px] font-semibold">{net}</span>
                          </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Phone Number</label>
                      <Input type="tel" placeholder="(555) 123-4567" required value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 text-xs rounded-lg font-mono" />
                    </div>

                    {activeTab === "airtime" && (
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Amount ($)</label>
                        <Input type="number" placeholder="0.00" required value={airtimeAmt} onChange={(e) => setAirtimeAmt(e.target.value)} className="h-9 text-xs rounded-lg" />
                      </div>
                    )}

                    {activeTab === "data" && (
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Select Data Plan</label>
                        <select className="w-full rounded-lg border border-input bg-background px-3 h-9 text-xs" required value={dataPlan} onChange={(e) => setDataPlan(e.target.value)}>
                          <option value="">Choose a plan...</option>
                          <option value="2GB-15">2GB / 30 Days - $15</option>
                          <option value="5GB-25">5GB / 30 Days - $25</option>
                          <option value="15GB-40">15GB / 30 Days - $40</option>
                          <option value="UNL-50">Unlimited / 30 Days - $50</option>
                        </select>
                      </div>
                    )}

                    <Button type="submit" size="sm" className="w-full h-9 rounded-lg text-xs font-bold mt-1" disabled={loading || !network}>
                      {loading ? "Processing..." : `Buy ${activeTab === "airtime" ? "Prepaid Refill" : "Data Plan"}`}
                    </Button>
                  </form>
                )}

                {/* QR Payment Tab */}
                {activeTab === "qr" && (
                  <div className="space-y-4">
                    <div className="flex bg-muted/40 p-1 rounded-lg">
                      <button onClick={() => setQrMode("scan")} className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${qrMode === "scan" ? "bg-background shadow-xs text-primary" : "text-muted-foreground"}`}>Scan to Pay</button>
                      <button onClick={() => setQrMode("receive")} className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${qrMode === "receive" ? "bg-background shadow-xs text-primary" : "text-muted-foreground"}`}>Receive Money</button>
                    </div>

                    {qrMode === "scan" ? (
                      <div className="border border-dashed border-primary/40 rounded-xl h-48 flex flex-col items-center justify-center bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                        <ScanLine className="h-10 w-10 text-primary mb-2 animate-pulse" />
                        <p className="font-bold text-xs text-foreground">Tap to scan QR Code</p>
                        <p className="text-[10px] text-muted-foreground">Camera access required</p>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <div className="bg-white p-3 rounded-xl inline-block shadow-sm border mb-2">
                          <QRCode value={`trustbank:receive:${accounts[0]?.account_number}`} size={120} level="H" />
                        </div>
                        <p className="font-bold text-sm font-poppins text-foreground">{user?.email?.split('@')[0] || "User"}</p>
                        <p className="text-[10px] font-mono text-muted-foreground bg-muted/50 inline-block px-2.5 py-0.5 rounded-full mt-1">A/C: {accounts[0]?.account_number}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SlideUp>
          </div>

          <div className="lg:col-span-2 h-full">
            <SlideUp delay={0.1}>
              <div className="bg-card rounded-xl border border-border/60 shadow-sm p-4 h-full flex flex-col">
                <h3 className="font-bold text-xs font-poppins text-foreground mb-3 border-b border-border/60 pb-2">Recent Transactions</h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {payments.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-6">No recent activity</div>
                  ) : (
                    payments.map((p) => {
                      const isAirtimeOrData = p.payment_type === "airtime" || p.payment_type === "data";
                      const Icon = isAirtimeOrData ? Smartphone : Receipt;
                      return (
                        <div key={p.id} className="flex justify-between items-center group">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                              <Icon size={14} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">{p.provider || p.payment_type}</p>
                              <p className="text-[9px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-foreground">${Number(p.amount).toLocaleString()}</p>
                            <span className="text-[8px] text-success bg-success/10 px-1.5 py-0.2 rounded-full font-bold uppercase">{p.status}</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </SlideUp>
          </div>
        </div>
      )}
    </div>
  );
}
