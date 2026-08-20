import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Percent, Edit2, Save, X, RefreshCw, Layers, Bitcoin, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminFeesPage() {
  const [tab, setTab] = useState<'platform' | 'crypto' | 'rules'>('platform');
  const [platformFees, setPlatformFees] = useState<any[]>([]);
  const [cryptoFees, setCryptoFees] = useState<any[]>([]);
  const [accountRules, setAccountRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [pRes, cRes, aRes] = await Promise.all([
      supabase.from('platform_fees').select('*').order('fee_name'),
      supabase.from('crypto_conversion_fees').select('*').order('conversion_type'),
      supabase.from('account_rules').select('*').order('account_type')
    ]);
    
    if (pRes.error) toast({ title: 'Error', description: pRes.error.message, variant: 'destructive' });
    else setPlatformFees(pRes.data || []);
    
    if (cRes.error) toast({ title: 'Error', description: cRes.error.message, variant: 'destructive' });
    else setCryptoFees(cRes.data || []);

    if (aRes.error) toast({ title: 'Error', description: aRes.error.message, variant: 'destructive' });
    else setAccountRules(aRes.data || []);
    
    setLoading(false);
  };

  const startEditPlatform = (fee: any) => {
    setEditingId(fee.id);
    setEditForm({ amount: fee.amount.toString(), description: fee.description || '' });
  };

  const startEditCrypto = (fee: any) => {
    setEditingId(fee.id);
    setEditForm({
      flat_fee: fee.flat_fee.toString(),
      percentage_fee: fee.percentage_fee.toString(),
      min_fee: fee.min_fee.toString(),
      max_fee: fee.max_fee.toString(),
      is_active: fee.is_active
    });
  };

  const startEditRule = (rule: any) => {
    setEditingId(rule.id);
    setEditForm({
      daily_transfer_limit: rule.daily_transfer_limit.toString(),
      per_tx_limit: rule.per_tx_limit.toString(),
      internal_transfer_daily_limit: rule.internal_transfer_daily_limit.toString(),
      internal_transfers_per_day: rule.internal_transfers_per_day.toString(),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const savePlatformFee = async (id: string) => {
    const amount = parseFloat(editForm.amount);
    if (isNaN(amount) || amount < 0) return toast({ title: 'Invalid amount', variant: 'destructive' });

    const { error } = await supabase.from('platform_fees').update({ amount, description: editForm.description }).eq('id', id);
    if (error) toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Fee updated successfully' }); setEditingId(null); fetchData(); }
  };

  const saveCryptoFee = async (id: string) => {
    const { error } = await supabase.from('crypto_conversion_fees').update({
      flat_fee: parseFloat(editForm.flat_fee),
      percentage_fee: parseFloat(editForm.percentage_fee),
      min_fee: parseFloat(editForm.min_fee),
      max_fee: parseFloat(editForm.max_fee),
      is_active: editForm.is_active
    }).eq('id', id);
    if (error) toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Crypto Fee updated' }); setEditingId(null); fetchData(); }
  };

  const saveAccountRule = async (id: string) => {
    const { error } = await supabase.from('account_rules').update({
      daily_transfer_limit: parseFloat(editForm.daily_transfer_limit),
      per_tx_limit: parseFloat(editForm.per_tx_limit),
      internal_transfer_daily_limit: parseFloat(editForm.internal_transfer_daily_limit),
      internal_transfers_per_day: parseInt(editForm.internal_transfers_per_day, 10),
    }).eq('id', id);
    if (error) toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Account Rules updated' }); setEditingId(null); fetchData(); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground tracking-tight">Platform Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage global fees, crypto conversions, and account limits</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2 p-1 bg-muted/30 rounded-xl overflow-x-auto">
        <button onClick={() => setTab('platform')} className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${tab === 'platform' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          <Layers className="h-4 w-4" /> Platform Fees
        </button>
        <button onClick={() => setTab('crypto')} className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${tab === 'crypto' ? 'bg-background shadow-sm text-amber-500' : 'text-muted-foreground hover:text-foreground'}`}>
          <Bitcoin className="h-4 w-4" /> Crypto Conversion
        </button>
        <button onClick={() => setTab('rules')} className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${tab === 'rules' ? 'bg-background shadow-sm text-blue-500' : 'text-muted-foreground hover:text-foreground'}`}>
          <Shield className="h-4 w-4" /> Account Rules
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading configuration...
          </div>
        ) : tab === 'platform' ? (
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
                {platformFees.map(fee => (
                  <tr key={fee.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                      {fee.fee_name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{fee.fee_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${fee.fee_type === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {fee.fee_type === 'percentage' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                        {fee.fee_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium">
                      {editingId === fee.id ? (
                        <Input type="number" step={fee.fee_type === 'percentage' ? '0.01' : '1'} value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className="w-24 text-right ml-auto h-8 text-xs" />
                      ) : (
                        fee.fee_type === 'percentage' ? `${fee.amount}%` : `$${Number(fee.amount).toFixed(2)}`
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                      {editingId === fee.id ? (
                        <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full h-8 text-xs" placeholder="Description..." />
                      ) : (
                        fee.description
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingId === fee.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"><X className="h-4 w-4" /></Button>
                          <Button variant="default" size="sm" onClick={() => savePlatformFee(fee.id)} className="h-8 w-8 p-0"><Save className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => startEditPlatform(fee)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"><Edit2 className="h-4 w-4" /></Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === 'crypto' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Conversion Type</th>
                  <th className="px-6 py-4 text-right">Flat Fee ($)</th>
                  <th className="px-6 py-4 text-right">Rate (%)</th>
                  <th className="px-6 py-4 text-right">Min/Max ($)</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {cryptoFees.map(fee => (
                  <tr key={fee.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                      {fee.conversion_type.replace(/_/g, ' ').toUpperCase()}
                      <div className="mt-1">
                        {editingId === fee.id ? (
                          <div className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} /> Active
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${fee.is_active ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>{fee.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium">
                      {editingId === fee.id ? (
                        <Input type="number" step="0.10" value={editForm.flat_fee} onChange={(e) => setEditForm({ ...editForm, flat_fee: e.target.value })} className="w-20 text-right ml-auto h-8 text-xs" />
                      ) : `$${Number(fee.flat_fee).toFixed(2)}`}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium">
                      {editingId === fee.id ? (
                        <Input type="number" step="0.001" value={editForm.percentage_fee} onChange={(e) => setEditForm({ ...editForm, percentage_fee: e.target.value })} className="w-20 text-right ml-auto h-8 text-xs" />
                      ) : `${(Number(fee.percentage_fee) * 100).toFixed(2)}%`}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium">
                      {editingId === fee.id ? (
                        <div className="flex flex-col gap-1 items-end">
                          <Input type="number" step="0.5" value={editForm.min_fee} onChange={(e) => setEditForm({ ...editForm, min_fee: e.target.value })} className="w-20 text-right h-8 text-xs" placeholder="Min" />
                          <Input type="number" step="1" value={editForm.max_fee} onChange={(e) => setEditForm({ ...editForm, max_fee: e.target.value })} className="w-20 text-right h-8 text-xs" placeholder="Max" />
                        </div>
                      ) : `$${Number(fee.min_fee).toFixed(2)} - $${Number(fee.max_fee).toFixed(2)}`}
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      {editingId === fee.id ? (
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"><X className="h-4 w-4" /></Button>
                          <Button variant="default" size="sm" onClick={() => saveCryptoFee(fee.id)} className="h-8 w-8 p-0"><Save className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => startEditCrypto(fee)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground mt-1"><Edit2 className="h-4 w-4" /></Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Account Type</th>
                  <th className="px-6 py-4 text-right">Ext. Tx Limit / Daily Limit</th>
                  <th className="px-6 py-4 text-right">Int. Tx Daily / Count</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {accountRules.map(rule => (
                  <tr key={rule.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground uppercase tracking-wider">
                      {rule.account_type}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium">
                      {editingId === rule.id ? (
                        <div className="flex flex-col gap-1 items-end">
                          <Input type="number" step="1000" value={editForm.per_tx_limit} onChange={(e) => setEditForm({ ...editForm, per_tx_limit: e.target.value })} className="w-28 text-right h-8 text-xs" title="Per Tx Limit" />
                          <Input type="number" step="1000" value={editForm.daily_transfer_limit} onChange={(e) => setEditForm({ ...editForm, daily_transfer_limit: e.target.value })} className="w-28 text-right h-8 text-xs" title="Daily Limit" />
                        </div>
                      ) : `$${Number(rule.per_tx_limit).toLocaleString()} / $${Number(rule.daily_transfer_limit).toLocaleString()}`}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium">
                      {editingId === rule.id ? (
                        <div className="flex flex-col gap-1 items-end">
                          <Input type="number" step="1000" value={editForm.internal_transfer_daily_limit} onChange={(e) => setEditForm({ ...editForm, internal_transfer_daily_limit: e.target.value })} className="w-28 text-right h-8 text-xs" title="Internal Daily Limit" />
                          <Input type="number" step="1" value={editForm.internal_transfers_per_day} onChange={(e) => setEditForm({ ...editForm, internal_transfers_per_day: e.target.value })} className="w-28 text-right h-8 text-xs" title="Internal Tx Count" />
                        </div>
                      ) : `$${Number(rule.internal_transfer_daily_limit).toLocaleString()} / ${rule.internal_transfers_per_day} tx`}
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      {editingId === rule.id ? (
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"><X className="h-4 w-4" /></Button>
                          <Button variant="default" size="sm" onClick={() => saveAccountRule(rule.id)} className="h-8 w-8 p-0"><Save className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => startEditRule(rule)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground mt-2"><Edit2 className="h-4 w-4" /></Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
