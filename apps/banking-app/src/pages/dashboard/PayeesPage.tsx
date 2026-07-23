import { useEffect, useState } from "react";
import { Users, Plus, Trash2, Calendar, CheckCircle, ShieldAlert } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@trustbank/shared-ui/components/ui/dialog";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn } from "@trustbank/shared-ui/components/Motion";

interface Payee {
  id: string;
  nickname: string | null;
  payee_name: string;
  category: "utility" | "credit_card" | "mortgage" | "insurance" | "telecom" | "other";
  account_number_masked: string;
  payment_method: "ach" | "check";
  is_verified: boolean;
}

interface ScheduledPayment {
  id: string;
  amount: number;
  frequency: "once" | "weekly" | "monthly";
  next_run_at: string;
  status: string;
  payees: {
    payee_name: string;
    category: string;
  } | null;
}

export default function PayeesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [payees, setPayees] = useState<Payee[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Payee Form State
  const [payeeName, setPayeeName] = useState("");
  const [nickname, setNickname] = useState("");
  const [category, setCategory] = useState<Payee["category"]>("utility");
  const [accountNum, setAccountNum] = useState("");
  const [payMethod, setPayMethod] = useState<"ach" | "check">("ach");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchPayees(), fetchScheduledPayments()]);
    setLoading(false);
  };

  const fetchPayees = async () => {
    try {
      const { data, error } = await supabase
        .from("payees")
        .select("*")
        .eq("user_id", user?.id || "");
      
      if (error) throw error;
      setPayees((data as Payee[]) || []);
    } catch (e: any) {
      console.error(e);
    }
  };

  const fetchScheduledPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("scheduled_payments")
        .select(`
          *,
          payees(payee_name, category)
        `)
        .eq("status", "active")
        .order("next_run_at", { ascending: true });

      if (error) throw error;
      setScheduled((data as any[]) || []);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleAddPayee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (accountNum.length < 4) {
      toast({ title: "Invalid account number", description: "Account number must be at least 4 digits.", variant: "destructive" });
      return;
    }

    const masked = "****" + accountNum.slice(-4);

    try {
      const { error } = await supabase.from("payees").insert({
        user_id: user.id,
        payee_name: payeeName,
        nickname: nickname || payeeName,
        category,
        account_number_masked: masked,
        payment_method: payMethod,
        is_verified: true, // auto-verified for demonstration
      });

      if (error) throw error;

      toast({ title: "Payee Saved", description: `${payeeName} has been added to your payees directory.` });
      setDialogOpen(false);
      resetForm();
      fetchPayees();
    } catch (e: any) {
      toast({ title: "Failed to Add Payee", description: e.message, variant: "destructive" });
    }
  };

  const handleDeletePayee = async (payeeId: string) => {
    try {
      const { error } = await supabase.from("payees").delete().eq("id", payeeId);
      if (error) throw error;
      toast({ title: "Payee Deleted", description: "The payee was removed from your directory." });
      fetchPayees();
    } catch (e: any) {
      toast({ title: "Failed to Delete", description: e.message, variant: "destructive" });
    }
  };

  const handleCancelScheduled = async (scheduledId: string) => {
    try {
      const { error } = await supabase
        .from("scheduled_payments")
        .update({ status: "cancelled" })
        .eq("id", scheduledId);

      if (error) throw error;
      toast({ title: "Payment Cancelled", description: "The upcoming scheduled payment has been removed." });
      fetchScheduledPayments();
    } catch (e: any) {
      toast({ title: "Cancel Failed", description: e.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setPayeeName("");
    setNickname("");
    setCategory("utility");
    setAccountNum("");
    setPayMethod("ach");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Payees Directory</h1>
          <p className="text-sm text-muted-foreground">Manage your list of bill payees and scheduled expenses</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="default" className="gap-2">
              <Plus className="h-4 w-4" /> Add Payee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Payee</DialogTitle>
              <DialogDescription>Save a service provider or bill collector to enable direct bill paying.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPayee} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Payee Name</label>
                <Input
                  placeholder="e.g. Con Edison, Spectrum"
                  required
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Nickname (Optional)</label>
                <Input
                  placeholder="e.g. Electricity, Home Wifi"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Category</label>
                  <select
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                  >
                    <option value="utility">Utility</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="mortgage">Mortgage</option>
                    <option value="insurance">Insurance</option>
                    <option value="telecom">Telecom</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Payment Method</label>
                  <select
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                  >
                    <option value="ach">ACH Transfer</option>
                    <option value="check">Paper Check</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Billing Account Number</label>
                <Input
                  placeholder="Enter account number"
                  required
                  value={accountNum}
                  onChange={(e) => setAccountNum(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full">
                Save Payee
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <StaggerContainer className="grid lg:grid-cols-5 gap-6">
          
          {/* Payee List Side */}
          <StaggerItem className="lg:col-span-3">
            <div className="bg-card rounded-xl border h-full">
              <div className="p-5 border-b"><h3 className="font-semibold text-foreground">Saved Payees</h3></div>
              {payees.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
                  <Users className="h-10 w-10 text-muted-foreground/45" />
                  <div>
                    <p className="font-semibold text-foreground">No saved payees yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Click 'Add Payee' above to save billing details.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {payees.map((p) => (
                    <div key={p.id} className="p-4 flex justify-between items-center hover:bg-muted/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 border">
                          {p.payee_name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">{p.payee_name}</span>
                            {p.nickname && p.nickname !== p.payee_name && (
                              <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                {p.nickname}
                              </span>
                            )}
                            {p.is_verified && (
                              <CheckCircle className="h-4 w-4 text-success fill-emerald-50 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 capitalize">
                            {p.category} · A/C: {p.account_number_masked} · {p.payment_method.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeletePayee(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </StaggerItem>

          {/* Scheduled Payments Queue */}
          <StaggerItem className="lg:col-span-2">
            <div className="bg-card rounded-xl border h-full">
              <div className="p-5 border-b"><h3 className="font-semibold text-foreground">Upcoming Scheduled Queue</h3></div>
              {scheduled.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Calendar className="h-8 w-8 text-muted-foreground/50" />
                  <span>No upcoming scheduled payments queued.</span>
                </div>
              ) : (
                <div className="divide-y">
                  {scheduled.map((s) => (
                    <div key={s.id} className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{s.payees?.payee_name || "Bill Pay"}</p>
                          <p className="text-xs text-muted-foreground capitalize">{s.payees?.category || "Expense"}</p>
                        </div>
                        <span className="text-sm font-bold text-foreground">${Number(s.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-muted/50">
                        <span className="text-muted-foreground">
                          Next Run: {new Date(s.next_run_at).toLocaleDateString()} ({s.frequency})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-destructive hover:text-destructive hover:bg-destructive/10 text-[10px] font-semibold"
                          onClick={() => handleCancelScheduled(s.id)}
                        >
                          Cancel Run
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </StaggerItem>

        </StaggerContainer>
      )}
    </div>
  );
}
