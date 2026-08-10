import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StaggerContainer, StaggerItem } from '@/components/public/Motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, UserX, AlertTriangle, ShieldAlert, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
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
  created_at: string;
  closed_email: string;
  reviewed_by: string;
  reviewed_at: string;
  admin_notes: string;
  profiles: {
    display_name: string;
    email: string;
    account_number: string;
  } | null;
};

export const AdminClosedAccountsPage = () => {
  const [accounts, setAccounts] = useState<ClosedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminReason, setAdminReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchClosedAccounts();
  }, []);

  const fetchClosedAccounts = async () => {
    try {
      const { data: closuresData, error: closuresErr } = await supabase
        .from('account_closure_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (closuresErr) throw closuresErr;

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, account_number');

      const profileMap = new Map<string, any>();
      profilesData?.forEach((p: any) => profileMap.set(p.user_id, p));

      const mergedData = closuresData?.map((c: any) => ({
        ...c,
        profiles: profileMap.get(c.user_id) || null
      }));

      setAccounts(mergedData as any);
    } catch (err: any) {
      toast({ title: "Error loading accounts", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const { error } = await (supabase.rpc as any)('admin_approve_account_closure', {
        p_request_id: requestId,
        p_admin_notes: adminNotes || null,
      });

      if (error) throw error;

      toast({ title: "Account Closure Approved", description: "The user's account has been closed and sessions revoked." });
      setAdminNotes('');
      await fetchClosedAccounts();
    } catch (err: any) {
      toast({ title: "Approval Failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectNotes.trim()) {
      toast({ title: "Notes Required", description: "Please provide a reason for declining this request.", variant: "destructive" });
      return;
    }

    setProcessingId(requestId);
    try {
      const { error } = await (supabase.rpc as any)('admin_reject_account_closure', {
        p_request_id: requestId,
        p_admin_notes: rejectNotes,
      });

      if (error) throw error;

      toast({ title: "Request Declined", description: "The closure request has been declined and the user has been notified." });
      setRejectNotes('');
      await fetchClosedAccounts();
    } catch (err: any) {
      toast({ title: "Rejection Failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
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

  // ── Counts ──
  const counts = {
    all: accounts.length,
    pending: accounts.filter(a => a.status === 'pending').length,
    completed: accounts.filter(a => a.status === 'completed').length,
    rejected: accounts.filter(a => a.status === 'rejected').length,
    deleted: accounts.filter(a => a.status === 'deleted').length,
  };

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch =
      acc.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.closed_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.reason?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || acc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Closed</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>;
      case 'deleted':
        return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"><ShieldAlert className="w-3 h-3 mr-1" />Permanently Deleted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <StaggerContainer className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <StaggerItem>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-poppins text-foreground tracking-tight">Account Closures</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Review closure requests, approve or decline them, and manage permanent deletions.
            </p>
          </div>
        </div>
      </StaggerItem>

      {/* Status filter tabs */}
      <StaggerItem>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All', count: counts.all },
            { key: 'pending', label: 'Pending', count: counts.pending },
            { key: 'completed', label: 'Closed', count: counts.completed },
            { key: 'rejected', label: 'Declined', count: counts.rejected },
            { key: 'deleted', label: 'Deleted', count: counts.deleted },
          ].map(tab => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(tab.key)}
              className="text-xs font-semibold"
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              )}
            </Button>
          ))}
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
                <p className="text-muted-foreground font-medium">No closure requests found.</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map((acc) => (
                      <TableRow key={acc.id} className="group">
                        <TableCell>
                          <div className="font-medium">{acc.profiles?.display_name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{acc.profiles?.email || acc.closed_email || '—'}</div>
                          <div className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">{acc.user_id.slice(0, 8)}...</div>
                        </TableCell>
                        <TableCell>
                          {statusBadge(acc.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium max-w-[200px] truncate" title={acc.reason}>{acc.reason}</div>
                          {acc.comments && <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={acc.comments}>{acc.comments}</div>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(acc.created_at || acc.closure_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* ── PENDING: Approve / Reject ── */}
                            {acc.status === 'pending' && (
                              <>
                                {/* Approve Dialog */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white">
                                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                      Approve
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center text-green-600">
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Approve Account Closure
                                      </DialogTitle>
                                      <DialogDescription className="pt-3 space-y-3">
                                        <p className="font-medium text-foreground">
                                          This will permanently close the user's account and revoke all sessions.
                                        </p>
                                        <div className="bg-muted p-3 rounded-md border text-sm">
                                          <span className="font-semibold block mb-1">User:</span>
                                          {acc.profiles?.display_name || 'Unknown'} ({acc.profiles?.email || acc.closed_email})
                                        </div>
                                        <div className="bg-muted p-3 rounded-md border text-sm">
                                          <span className="font-semibold block mb-1">Reason:</span>
                                          {acc.reason}
                                        </div>
                                        {acc.comments && (
                                          <div className="bg-muted p-3 rounded-md border text-sm">
                                            <span className="font-semibold block mb-1">User Comments:</span>
                                            <p className="whitespace-pre-wrap">{acc.comments}</p>
                                          </div>
                                        )}
                                        <div className="pt-2 space-y-2">
                                          <label className="text-sm font-medium text-foreground">Admin Notes (optional)</label>
                                          <Textarea
                                            placeholder="Internal notes about this approval..."
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            rows={2}
                                          />
                                        </div>
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="mt-4">
                                      <Button
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleApprove(acc.id)}
                                        disabled={processingId === acc.id}
                                      >
                                        {processingId === acc.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                        Approve & Close Account
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                {/* Reject Dialog */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 text-destructive border-destructive/20 hover:bg-destructive/10">
                                      <XCircle className="w-3.5 h-3.5 mr-1.5" />
                                      Decline
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center text-destructive">
                                        <XCircle className="w-5 h-5 mr-2" />
                                        Decline Closure Request
                                      </DialogTitle>
                                      <DialogDescription className="pt-3 space-y-3">
                                        <p className="font-medium text-foreground">
                                          The user will be notified that their request was declined.
                                        </p>
                                        <div className="bg-muted p-3 rounded-md border text-sm">
                                          <span className="font-semibold block mb-1">User:</span>
                                          {acc.profiles?.display_name || 'Unknown'} ({acc.profiles?.email || acc.closed_email})
                                        </div>
                                        <div className="pt-2 space-y-2">
                                          <label className="text-sm font-medium text-foreground">Reason for Declining <span className="text-destructive">*</span></label>
                                          <Textarea
                                            placeholder="e.g. Outstanding balance, pending compliance review..."
                                            value={rejectNotes}
                                            onChange={(e) => setRejectNotes(e.target.value)}
                                            rows={3}
                                          />
                                        </div>
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="mt-4">
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleReject(acc.id)}
                                        disabled={processingId === acc.id || !rejectNotes.trim()}
                                      >
                                        {processingId === acc.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        Decline Request
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}

                            {/* ── COMPLETED: Permanent Delete ── */}
                            {acc.status === 'completed' && (
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
                                        {acc.profiles?.display_name || 'Deleted User'} ({acc.profiles?.email || acc.closed_email || '—'})
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

                            {/* ── REJECTED: Info badge ── */}
                            {acc.status === 'rejected' && acc.admin_notes && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
                                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                    View Notes
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Rejection Notes</DialogTitle>
                                    <DialogDescription className="pt-3">
                                      <div className="bg-muted p-3 rounded-md border text-sm">
                                        <span className="font-semibold block mb-1">Admin Notes:</span>
                                        <p className="whitespace-pre-wrap">{acc.admin_notes}</p>
                                      </div>
                                      {acc.reviewed_at && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                          Reviewed on {format(new Date(acc.reviewed_at), 'MMM d, yyyy h:mm a')}
                                        </p>
                                      )}
                                    </DialogDescription>
                                  </DialogHeader>
                                </DialogContent>
                              </Dialog>
                            )}

                            {/* ── DELETED: No actions ── */}
                            {acc.status === 'deleted' && (
                              <span className="text-xs text-muted-foreground italic">No actions available</span>
                            )}
                          </div>
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
