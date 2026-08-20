import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Percent, Edit2, Save, X, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminFeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', description: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('platform_fees').select('*').order('fee_name');
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setFees(data || []);
    }
    setLoading(false);
  };

  const startEdit = (fee: any) => {
    setEditingId(fee.id);
    setEditForm({ amount: fee.amount.toString(), description: fee.description || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveFee = async (id: string) => {
    const amount = parseFloat(editForm.amount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('platform_fees')
      .update({ amount, description: editForm.description })
      .eq('id', id);

    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Fee updated successfully' });
      setEditingId(null);
      fetchFees();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground tracking-tight">Platform Fees</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage global fees for transfers, cards, and crypto</p>
        </div>
        <Button onClick={fetchFees} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Fee Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading fees...
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No fees found. Run the migration to seed data.
                  </td>
                </tr>
              ) : fees.map(fee => (
                <tr key={fee.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                    {fee.fee_name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{fee.fee_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${fee.fee_type === 'percentage' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                      {fee.fee_type === 'percentage' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                      {fee.fee_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium">
                    {editingId === fee.id ? (
                      <Input
                        type="number"
                        step={fee.fee_type === 'percentage' ? '0.01' : '1'}
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        className="w-24 text-right ml-auto h-8 text-xs"
                      />
                    ) : (
                      fee.fee_type === 'percentage' ? `${fee.amount}%` : `$${Number(fee.amount).toFixed(2)}`
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                    {editingId === fee.id ? (
                      <Input
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full h-8 text-xs"
                        placeholder="Description..."
                      />
                    ) : (
                      fee.description
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === fee.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive">
                          <X className="h-4 w-4" />
                        </Button>
                        <Button variant="default" size="sm" onClick={() => saveFee(fee.id)} className="h-8 w-8 p-0">
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => startEdit(fee)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
