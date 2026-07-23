import { useState, useEffect } from "react";
import { Receipt, Calendar, ArrowRightLeft, Plus, CheckCircle, ShieldAlert } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { Link } from "react-router-dom";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";

interface Payee {
  id: string;
  payee_name: string;
  nickname: string | null;
  category: string;
  account_number_masked: string;
  payment_method: string;
}

interface Payment {
  id: string;
  payment_type: string;
  provider: string | null;
  amount: number;
  status: string;
  created_at: string;
  reference: string | null;
}

interface Account {
  id: string;
  account_type: string;
  account_number: string;
  balance: number;
}

export default function PaymentsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [payees, setPayees] = useState<Payee[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form State
  const [selectedPayeeId, setSelectedPayeeId] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"once" | "weekly" | "monthly">("once");

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
      const { data } = await (supabase.from as any)("payees")
        .select("*")
        .eq("user_id", user?.id || "");
      
      const list = (data as Payee[]) || [];
      setPayees(list);
      if (list.length > 0) {
        setSelectedPayeeId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user?.id || "")
        .eq("status", "active");

      const list = (data as Account[]) || [];
      setAccounts(list);
      if (list.length > 0) {
        setSelectedAccountId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user?.id || "")
        .order("created_at", { ascending: false })
        .limit(8);

      setPayments((data as Payment[]) || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePayBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPayeeId || !selectedAccountId) return;

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }

    const account = accounts.find((a) => a.id === selectedAccountId);
    if (!account || account.balance < amt) {
      toast({ title: "Insufficient Funds", description: "Your account does not have enough balance to complete this transaction.", variant: "destructive" });
      return;
    }

    const payee = payees.find((p) => p.id === selectedPayeeId);
    if (!payee) return;

    setLoading(true);

    try {
      if (frequency === "once") {
        const { data, error: rpcError } = await (supabase.rpc as any)("process_bill_payment", {
          p_user_id: user.id,
          p_account_id: account.id,
          p_payee_name: payee.payee_name,
          p_category: payee.category,
          p_amount: amt,
          p_account_masked: payee.account_number_masked
        });

        if (rpcError) throw rpcError;

        toast({
          title: "Payment Successful!",
          description: `Paid $${amt.toLocaleString()} to ${payee.payee_name} immediately.`,
        });
        
        fetchAccounts();
        fetchPayments();
      } else {
        // Scheduled payment: queue upcoming payment event
        const nextDate = new Date();
        if (frequency === "weekly") {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (frequency === "monthly") {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        const { error } = await (supabase.from as any)("scheduled_payments").insert({
          payee_id: payee.id,
          account_id: account.id,
          amount: amt,
          frequency: frequency,
          next_run_at: nextDate.toISOString(),
          status: "active",
        });

        if (error) throw error;

        // Create Notification for scheduled queue
        await supabase.from("notifications").insert({
          user_id: user.id,
          title: "Bill Payment Scheduled",
          message: `$${amt.toLocaleString()} payment scheduled for ${payee.payee_name} (${frequency}).`,
          type: "info",
        });

        toast({
          title: "Payment Scheduled",
          description: `Queued recurring ${frequency} payment to ${payee.payee_name} starting ${nextDate.toLocaleDateString()}.`,
        });
      }

      setAmount("");
      fetchData();
    } catch (e: any) {
      toast({ title: "Payment Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Pay Bills</h1>
        <p className="text-sm text-muted-foreground">Submit utility, mortgage, and telecommunications payments securely</p>
      </div>

      {fetching ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : payees.length === 0 ? (
        <FadeIn>
        <div className="bg-card rounded-xl border p-12 text-center max-w-md mx-auto">
          <Receipt className="h-12 w-12 text-primary/30 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">No Saved Payees Found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            You must add a billing provider to your payees directory before completing payments.
          </p>
          <Button asChild>
            <Link to="/dashboard/payees">
              <Plus className="h-4 w-4 mr-2" /> Add Payee Now
            </Link>
          </Button>
        </div>
        </FadeIn>
      ) : (
        <StaggerContainer className="grid lg:grid-cols-5 gap-6">
          {/* Bill Payment Form */}
          <StaggerItem className="lg:col-span-3">
            <div className="bg-card rounded-xl border p-6 h-full hover-lift">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" /> Bill Payment Ticket
              </h2>

              <form onSubmit={handlePayBill} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">From Account</label>
                  <select
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
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

                <div>
                  <label className="text-xs font-semibold block mb-1">Select Saved Payee</label>
                  <select
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                    value={selectedPayeeId}
                    onChange={(e) => setSelectedPayeeId(e.target.value)}
                  >
                    {payees.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.payee_name} ({p.category.toUpperCase()} · ****{p.account_number_masked.slice(-4)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Amount ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Payment Frequency</label>
                    <select
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as any)}
                    >
                      <option value="once">Once (Immediate)</option>
                      <option value="weekly">Weekly Recurring</option>
                      <option value="monthly">Monthly Recurring</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
                  <span>Payee Payment Method:</span>
                  <span className="font-semibold text-foreground">
                    {payees.find((p) => p.id === selectedPayeeId)?.payment_method.toUpperCase() || "ACH"}
                  </span>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Processing transaction..." : frequency === "once" ? "Pay Bill Now" : "Schedule Bill Payment"}
                </Button>
              </form>
            </div>
          </StaggerItem>

          {/* Recent Payments Ledger */}
          <StaggerItem className="lg:col-span-2">
            <div className="bg-card rounded-xl border shadow-sm h-full hover-lift">
              <div className="p-5 border-b"><h3 className="font-semibold text-foreground">Recent Bill Payments</h3></div>
              <div className="divide-y">
                {payments.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No payments sent yet</div>
                ) : (
                  payments.map((p) => (
                    <div key={p.id} className="p-4 flex justify-between items-center hover:bg-muted/5 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-foreground">{p.provider || p.payment_type}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">${Number(p.amount).toLocaleString()}</p>
                        <span className="text-[10px] text-success bg-success/10 px-2 py-0.5 rounded font-bold uppercase">
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      )}
    </div>
  );
}
