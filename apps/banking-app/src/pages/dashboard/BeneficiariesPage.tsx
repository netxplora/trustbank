import { useState, useEffect } from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Beneficiaries</h1>
          <p className="text-sm text-muted-foreground">Manage your saved beneficiaries</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-4 w-4 mr-1" /> Add Beneficiary
        </Button>
      </div>

      {showAdd && (
        <FadeIn>
        <div className="bg-card rounded-xl border p-6 max-w-lg">
          <h2 className="font-semibold text-foreground mb-4">Add New Beneficiary</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input name="name" placeholder="Full Name" required />
            <select name="bank" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" required>
              <option value="">Select Bank</option>
              <option>TrustBank</option>
              <option>Chase</option>
              <option>Bank of America</option>
              <option>Wells Fargo</option>
              <option>Citibank</option>
              <option>Capital One</option>
            </select>
            <Input name="account" placeholder="Account Number" required />
            <Input name="nickname" placeholder="Nickname (optional)" />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Save</Button>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </form>
        </div>
        </FadeIn>
      )}

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {beneficiaries.length === 0 ? (
          <StaggerItem className="md:col-span-2">
          <div className="bg-card rounded-xl border p-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No beneficiaries saved yet.</p>
          </div>
          </StaggerItem>
        ) : beneficiaries.map((b) => (
          <StaggerItem key={b.id}>
          <div className="bg-card rounded-xl border p-5 flex items-center justify-between hover:shadow-sm transition-shadow h-full">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.bank} • {b.account_number}</p>
                {b.nickname && <p className="text-xs text-primary">{b.nickname}</p>}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
};

export default BeneficiariesPage;
