import { useEffect, useState } from "react";
import { Users, Plus, Trash2, Calendar, CheckCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/public/Motion";
import { PAYEE_SEEDS, PayeeCategory } from "@/data/payeeSeeds";

interface Payee {
  id: string;
  nickname: string | null;
  payee_name: string;
  category: PayeeCategory;
  account_number_masked: string;
  payment_method: "ach" | "check";
  is_verified: boolean;
}

interface ScheduledPayment {
  id: string;
  amount: number;
  frequency: "once" | "weekly" | "monthly";
  next_payment_date: string;
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
        .order("next_payment_date", { ascending: true });

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
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground mb-0.5 font-poppins">Payees Directory</h1>
          <p className="text-xs text-muted-foreground">Manage your list of bill payees and scheduled expenses</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="default" className="gap-1.5 h-7 text-xs rounded-lg">
              <Plus className="h-3.5 w-3.5" /> Add Payee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm rounded-xl p-4">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-sm font-poppins">Add New Payee</DialogTitle>
              <DialogDescription className="text-xs">Save a service provider or bill collector for bill paying.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPayee} className="space-y-2.5">
              <div>
                <label className="text-[11px] font-semibold block mb-1">Payee Name</label>
                <Input
                  list="payee-seeds"
                  placeholder="e.g. Con Edison, Spectrum"
                  required
                  className="h-8 text-xs rounded-lg"
                  value={payeeName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPayeeName(val);
                    const seed = PAYEE_SEEDS.find((s) => s.name === val);
                    if (seed) setCategory(seed.category);
                  }}
                />
                <datalist id="payee-seeds">
                  {PAYEE_SEEDS.map((seed) => (
                    <option key={seed.id} value={seed.name} />
                  ))}
                </datalist>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-muted-foreground self-center mr-1">Quick Select:</span>
                  {PAYEE_SEEDS.slice(0, 4).map((seed) => (
                    <button
                      key={seed.id}
                      type="button"
                      className="text-[9px] bg-muted hover:bg-primary/10 hover:text-primary px-1.5 py-0.5 rounded transition-colors"
                      onClick={() => {
                        setPayeeName(seed.name);
                        setCategory(seed.category);
                      }}
                    >
                      {seed.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold block mb-1">Nickname (Optional)</label>
                <Input
                  placeholder="e.g. Electricity, Home Wifi"
                  className="h-8 text-xs rounded-lg"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold block mb-1">Category</label>
                  <select
                    className="w-full rounded-lg border border-input bg-background px-2 h-8 text-xs"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                  >
                    <option value="utility">Utility</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="mortgage">Mortgage</option>
                    <option value="insurance">Insurance</option>
                    <option value="telecom">Telecom</option>
                    <option value="education">Education</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="tax">Tax</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold block mb-1">Payment Method</label>
                  <select
                    className="w-full rounded-lg border border-input bg-background px-2 h-8 text-xs"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                  >
                    <option value="ach">ACH Transfer</option>
                    <option value="check">Paper Check</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold block mb-1">Billing Account Number</label>
                <Input
                  placeholder="Enter account number"
                  required
                  className="h-8 text-xs rounded-lg"
                  value={accountNum}
                  onChange={(e) => setAccountNum(e.target.value)}
                />
              </div>

              <Button type="submit" size="sm" className="w-full h-8 text-xs font-bold rounded-lg mt-1">
                Save Payee
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <StaggerContainer className="grid lg:grid-cols-5 gap-4">
          
          {/* Payee List Side */}
          <StaggerItem className="lg:col-span-3">
            <div className="bg-card rounded-xl border border-border/60 h-full overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-border/60 bg-muted/10">
                <h3 className="font-semibold text-xs text-foreground font-poppins">Saved Payees</h3>
              </div>
              {payees.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <Users className="h-8 w-8 text-muted-foreground/45" />
                  <div>
                    <p className="font-semibold text-foreground text-xs">No saved payees yet</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Click 'Add Payee' above to save billing details.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {payees.map((p) => (
                    <div key={p.id} className="p-3 flex justify-between items-center hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 border border-primary/20 text-xs font-bold">
                          {p.payee_name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground text-xs truncate">{p.payee_name}</span>
                            {p.nickname && p.nickname !== p.payee_name && (
                              <span className="text-[9px] bg-muted px-1.5 py-0.2 rounded text-muted-foreground">
                                {p.nickname}
                              </span>
                            )}
                            {p.is_verified && (
                              <CheckCircle className="h-3.5 w-3.5 text-success fill-emerald-50 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                            {p.category} · A/C: {p.account_number_masked} · {p.payment_method.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => handleDeletePayee(p.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </StaggerItem>

          {/* Scheduled Payments Queue */}
          <StaggerItem className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border/60 h-full overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-border/60 bg-muted/10">
                <h3 className="font-semibold text-xs text-foreground font-poppins">Upcoming Scheduled Queue</h3>
              </div>
              {scheduled.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                  <Calendar className="h-6 w-6 text-muted-foreground/50" />
                  <span>No upcoming scheduled payments queued.</span>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {scheduled.map((s) => (
                    <div key={s.id} className="p-3 space-y-1.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-semibold text-foreground">{s.payees?.payee_name || "Bill Pay"}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{s.payees?.category || "Expense"}</p>
                        </div>
                        <span className="text-xs font-bold text-foreground">${Number(s.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] pt-1 border-t border-border/30">
                        <span className="text-muted-foreground">
                          Next: {new Date(s.next_payment_date).toLocaleDateString()} ({s.frequency})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 text-[9px] font-semibold"
                          onClick={() => handleCancelScheduled(s.id)}
                        >
                          Cancel
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
