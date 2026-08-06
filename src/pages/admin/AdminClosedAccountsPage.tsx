import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StaggerContainer, StaggerItem } from '@/components/public/Motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, UserX, AlertTriangle, ShieldAlert } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ClosedAccount = {
  id: string;
  user_id: string;
  reason: string;
  comments: string;
  status: string;
  closure_date: string;
  deletion_date: string;
  profiles: {
    display_name: string;
    email: string;
    account_number: string;
  };
};

export const AdminClosedAccountsPage = () => {
  const [accounts, setAccounts] = useState<ClosedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adminReason, setAdminReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchClosedAccounts();
  }, []);

  const fetchClosedAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('account_closure_requests')
        .select(`
          *,
          profiles!inner(display_name, email, account_number)
        `)
        .order('closure_date', { ascending: false });

      if (error) throw error;
      setAccounts(data as any);
    } catch (err: any) {
      toast({ title: "Error loading accounts", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDeletion = async (userId: string) => {
    if (!adminReason) {
      toast({ title: "Reason Required", description: "You must provide a reason for permanent deletion.", variant: "destructive" });
      return;
    }

    setDeletingId(userId);
    try {
      const { error } = await supabase.rpc('permanently_delete_account', {
        target_user_id: userId,
        p_admin_reason: adminReason
      });

      if (error) throw error;

      toast({ title: "Account Permanently Deleted", description: "The user data has been anonymized successfully." });
      setAdminReason('');
      await fetchClosedAccounts();
    } catch (err: any) {
      toast({ title: "Deletion Failed", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <StaggerContainer className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <StaggerItem>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-poppins text-foreground tracking-tight">Closed Accounts</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage user account closures, data retention, and execute permanent deletions.
            </p>
          </div>
        </div>
      </StaggerItem>

      <StaggerItem>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center p-12 border border-dashed rounded-lg">
                <UserX className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No closed accounts found.</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Closure Reason</TableHead>
                      <TableHead>Closure Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map((acc) => (
                      <TableRow key={acc.id} className="group">
                        <TableCell>
                          <div className="font-medium">{acc.profiles.display_name}</div>
                          <div className="text-xs text-muted-foreground">{acc.profiles.email}</div>
                          <div className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">{acc.user_id}</div>
                        </TableCell>
                        <TableCell>
                          {acc.status === 'deleted' ? (
                            <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">Permanently Deleted</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">Closed (Retained)</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium max-w-[200px] truncate" title={acc.reason}>{acc.reason}</div>
                          {acc.comments && <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={acc.comments}>{acc.comments}</div>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(acc.closure_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          {acc.status !== 'deleted' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="h-8">
                                  <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                                  Permanently Delete
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="flex items-center text-destructive">
                                    <AlertTriangle className="w-5 h-5 mr-2" />
                                    Permanently Delete Account
                                  </DialogTitle>
                                  <DialogDescription className="pt-3 space-y-3">
                                    <p className="font-medium text-foreground">
                                      This action permanently removes data that is legally eligible for deletion.
                                    </p>
                                    <p>
                                      This cannot be undone. Confirm that all retention, legal, regulatory, financial, and security requirements have been satisfied before continuing.
                                    </p>
                                    <div className="bg-muted p-3 rounded-md border text-sm mt-2">
                                      <span className="font-semibold block mb-1">Target User:</span>
                                      {acc.profiles.display_name} ({acc.profiles.email})
                                    </div>
                                    <div className="pt-2 space-y-2">
                                      <label className="text-sm font-medium text-foreground">Authorization Reason</label>
                                      <Input 
                                        placeholder="e.g. Compliance retention period ended" 
                                        value={adminReason}
                                        onChange={(e) => setAdminReason(e.target.value)}
                                      />
                                    </div>
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="mt-4">
                                  <Button variant="destructive" onClick={() => handlePermanentDeletion(acc.user_id)} disabled={deletingId === acc.user_id || !adminReason}>
                                    {deletingId === acc.user_id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    I understand, Permanently Delete
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
};
