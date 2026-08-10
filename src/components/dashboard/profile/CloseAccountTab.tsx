import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBrand } from '@/contexts/BrandContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, AlertCircle, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const CloseAccountTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { identity } = useBrand();
  const platformName = identity?.platform_name || 'the platform';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [eligibility, setEligibility] = useState<{ eligible: boolean; blockers: string[] } | null>(null);

  // Existing request tracking
  const [existingRequest, setExistingRequest] = useState<any>(null);

  const [reason, setReason] = useState('');
  const [couldDoBetter, setCouldDoBetter] = useState('');
  const [comments, setComments] = useState('');
  const [password, setPassword] = useState('');

  const REASONS = [
    'I no longer need the account',
    'I am moving to another financial service',
    'I am unhappy with the service',
    'I have security concerns',
    'I have another account',
    'Technical or usability issues',
    'Other',
  ];

  // On mount, check if user already has a pending or rejected request
  useEffect(() => {
    if (user) {
      fetchExistingRequest();
    }
  }, [user]);

  const fetchExistingRequest = async () => {
    setCheckingStatus(true);
    try {
      const { data, error } = await supabase
        .from('account_closure_requests')
        .select('*')
        .eq('user_id', user?.id)
        .in('status', ['pending', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setExistingRequest(data[0]);
      }
    } catch (err: any) {
      console.error('Error checking closure status:', err.message);
    } finally {
      setCheckingStatus(false);
    }
  };

  const checkEligibility = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('check_account_closure_eligibility', { uid: user?.id });
      if (error) throw error;

      const result = data as { eligible: boolean; blockers: string[] };
      setEligibility(result);

      if (result.eligible) {
        setStep(2);
      }
    } catch (err: any) {
      toast({ title: 'Check Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const verifyPasswordAndProceed = async () => {
    if (!password) {
      toast({ title: 'Password Required', description: 'Please enter your password to continue.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: password,
      });

      if (error) {
        throw new Error('Incorrect password. Please try again.');
      }

      setStep(4);
    } catch (err: any) {
      toast({ title: 'Authentication Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const submitClosureRequest = async () => {
    setLoading(true);
    try {
      const fullComments = [
        comments,
        couldDoBetter ? `Could have served me better by: ${couldDoBetter}` : '',
      ].filter(Boolean).join('\n\n');

      const { data, error } = await (supabase.rpc as any)('request_account_closure', {
        p_reason: reason,
        p_comments: fullComments || null,
      });

      if (error) throw error;

      toast({
        title: 'Request Submitted',
        description: 'Your account closure request has been submitted and is now under review.',
      });

      // Refresh to show the pending state
      await fetchExistingRequest();
      setStep(1);
    } catch (err: any) {
      toast({ title: 'Submission Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking account status...
      </div>
    );
  }

  // ── PENDING REQUEST STATE ──
  if (existingRequest?.status === 'pending') {
    return (
      <div className="space-y-5 max-w-2xl">
        <div>
          <h2 className="text-lg font-semibold font-poppins text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Account Closure Under Review
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your account closure request has been submitted and is being reviewed by our team.
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
            <Clock className="h-4 w-4" />
            Request Pending Review
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Reason</span>
              <span className="text-foreground">{existingRequest.reason}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Submitted</span>
              <span className="text-foreground">
                {new Date(existingRequest.created_at || existingRequest.closure_date).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {existingRequest.comments && (
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Your Comments</span>
              <p className="text-sm text-foreground/80">{existingRequest.comments}</p>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          You will receive a notification once a decision has been made. If you have questions, please contact support.
        </p>
      </div>
    );
  }

  // ── REJECTED REQUEST STATE ──
  if (existingRequest?.status === 'rejected') {
    return (
      <div className="space-y-5 max-w-2xl">
        <div>
          <h2 className="text-lg font-semibold font-poppins text-foreground flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Closure Request Declined
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your previous account closure request was reviewed and declined.
          </p>
        </div>

        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5 space-y-3">
          <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
            <XCircle className="h-4 w-4" />
            Request Declined
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Original Reason</span>
              <span className="text-foreground">{existingRequest.reason}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Reviewed On</span>
              <span className="text-foreground">
                {existingRequest.reviewed_at
                  ? new Date(existingRequest.reviewed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '—'}
              </span>
            </div>
          </div>

          {existingRequest.admin_notes && (
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Admin Notes</span>
              <p className="text-sm text-foreground/80">{existingRequest.admin_notes}</p>
            </div>
          )}
        </div>

        <Button
          variant="destructive"
          onClick={() => { setExistingRequest(null); setStep(1); setReason(''); setComments(''); setCouldDoBetter(''); setPassword(''); }}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold"
        >
          Submit a New Request
        </Button>
      </div>
    );
  }

  // ── NORMAL FLOW (no pending/rejected request) ──
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold font-poppins text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Close Account
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Once your closure request is approved, you will not be able to sign back in. Please read carefully before continuing.
        </p>
      </div>

      {/* STEP 1: INITIATION */}
      {step === 1 && (
        <div className="space-y-5 animate-in fade-in">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-foreground space-y-2">
            <p className="font-semibold text-destructive">Before you close your account</p>
            <p>Closing your account means you will lose access to all {platformName} services, including your accounts, transactions, cards, and any active products.</p>
            <p>Your request will be reviewed by our team before it takes effect. Make sure you have withdrawn any remaining funds and resolved all pending activity before proceeding.</p>
          </div>

          {/* Blockers from eligibility check */}
          {eligibility && !eligibility.eligible && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2 font-semibold text-sm">
                <AlertCircle className="h-4 w-4" />
                Your account cannot be closed yet
              </div>
              <p className="text-sm text-amber-600/90 dark:text-amber-400/90 mb-3">
                Please resolve the following before closing your account:
              </p>
              <ul className="list-disc list-inside text-sm text-amber-600/90 dark:text-amber-400/90 space-y-1">
                {eligibility.blockers.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          )}

          <Button
            variant="destructive"
            onClick={checkEligibility}
            disabled={loading}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Close My Account
          </Button>
        </div>
      )}

      {/* STEP 2: REASON + FEEDBACK */}
      {step === 2 && (
        <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">
              Why are you closing your account? <span className="text-destructive">*</span>
            </label>
            <div className="grid gap-2">
              {REASONS.map(r => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    reason === r
                      ? 'border-destructive/50 bg-destructive/5'
                      : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-destructive"
                  />
                  <span className="text-sm">{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Is there anything we could have done better? <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Your honest feedback helps us improve. There's no obligation to answer.
            </p>
            <Textarea
              placeholder="e.g. I wish the app had faster transfers, or better customer support..."
              value={couldDoBetter}
              onChange={(e) => setCouldDoBetter(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Any other comments? <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              placeholder="Anything else you'd like us to know..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => { setStep(1); setEligibility(null); }}>
              Cancel
            </Button>
            <Button
              disabled={!reason}
              onClick={() => setStep(3)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: AUTHENTICATION */}
      {step === 3 && (
        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Confirm your identity</label>
            <p className="text-xs text-muted-foreground">
              For your security, please enter your current password to proceed.
            </p>
            <Input
              type="password"
              placeholder="Current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyPasswordAndProceed()}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button
              disabled={!password || loading}
              onClick={verifyPasswordAndProceed}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Continue
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: FINAL CONFIRMATION */}
      {step === 4 && (
        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-destructive/5 border border-destructive/30 rounded-lg p-5 space-y-4">
            <h3 className="text-base font-bold text-destructive text-center">Submit Closure Request</h3>

            <div className="text-sm text-center text-muted-foreground">
              Your closure request will be submitted for review. If approved, your account will be permanently closed and you will no longer be able to sign in.
            </div>

            <div className="bg-background border border-border rounded p-3 text-sm space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Reason</span>
              <span className="text-foreground">{reason}</span>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={submitClosureRequest}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Closure Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
