import { useState, useEffect } from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";

interface Beneficiary { id: string; name: string; bank: string; account_number: string; nickname: string | null; }

const BeneficiariesPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchBeneficiaries();
  }, [user?.id]);

  const fetchBeneficiaries = async () => {
    if (!user) return;
    const { data } = await supabase.from("beneficiaries").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setBeneficiaries((data as Beneficiary[]) || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("beneficiaries").delete().eq("id", id);
    setBeneficiaries(prev => prev.filter(b => b.id !== id));
    toast({ title: "Beneficiary Removed" });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const { error } = await supabase.from("beneficiaries").insert({
      user_id: user.id,
      name: formData.get("name") as string,
      bank: formData.get("bank") as string,
      account_number: formData.get("account") as string,
      nickname: (formData.get("nickname") as string) || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Beneficiary Added!" });
    setShowAdd(false);
    (e.target as HTMLFormElement).reset();
    fetchBeneficiaries();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground mb-0.5 font-poppins">Beneficiaries</h1>
          <p className="text-xs text-muted-foreground">Manage your saved beneficiaries</p>
        </div>
        <Button size="sm" className="text-xs h-7 rounded-lg" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>

      {showAdd && (
        <FadeIn>
        <div className="bg-card rounded-xl border border-border/60 p-3.5 sm:p-4 max-w-lg shadow-sm">
          <h2 className="font-semibold text-xs text-foreground font-poppins mb-3">Add New Beneficiary</h2>
          <form onSubmit={handleAdd} className="space-y-2.5">
            <Input name="name" placeholder="Full Name" required className="h-8 text-xs rounded-lg" />
            <select name="bank" className="w-full rounded-lg border border-input bg-background px-2.5 h-8 text-xs focus:outline-none focus:ring-1 focus:ring-primary" required>
              <option value="">Select Bank</option>
              <option>TrustBank</option>
              <option>Chase</option>
              <option>Bank of America</option>
              <option>Wells Fargo</option>
              <option>Citibank</option>
              <option>Capital One</option>
            </select>
            <Input name="account" placeholder="Account Number" required className="h-8 text-xs rounded-lg" />
            <Input name="nickname" placeholder="Nickname (optional)" className="h-8 text-xs rounded-lg" />
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1 text-xs h-8 rounded-lg font-bold">Save</Button>
              <Button type="button" size="sm" variant="outline" className="text-xs h-8 rounded-lg" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </form>
        </div>
        </FadeIn>
      )}

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {beneficiaries.length === 0 ? (
          <StaggerItem className="md:col-span-2">
          <div className="bg-card rounded-xl border border-border/60 p-6 text-center shadow-sm">
            <Users className="h-6 w-6 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground">No beneficiaries saved yet.</p>
          </div>
          </StaggerItem>
        ) : beneficiaries.map((b) => (
          <StaggerItem key={b.id}>
          <div className="bg-card rounded-xl border border-border/60 p-3.5 flex items-center justify-between hover:shadow-sm transition-shadow h-full">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground leading-tight truncate">{b.name}</p>
                <p className="text-[10px] text-muted-foreground">{b.bank} • {b.account_number}</p>
                {b.nickname && <p className="text-[10px] text-primary">{b.nickname}</p>}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => handleDelete(b.id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
};

export default BeneficiariesPage;
