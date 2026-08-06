import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CloseAccountTab = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState<{ eligible: boolean; blockers: string[] } | null>(null);

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

  const confirmClosure = async () => {
    setLoading(true);
    try {
      // Combine reason with "could do better" response into comments
      const fullComments = [
        comments,
        couldDoBetter ? `Could have served me better by: ${couldDoBetter}` : '',
      ].filter(Boolean).join('\n\n');

      const { error } = await supabase.rpc('execute_account_closure', {
        p_reason: reason,
        p_comments: fullComments || null,
      });

      if (error) throw error;

      toast({
        title: 'Account Closed',
        description: 'Your account has been closed. You will now be signed out.',
      });

      await signOut();
      navigate('/login');
    } catch (err: any) {
      toast({ title: 'Closure Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold font-poppins text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Close Account
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Once your account is closed, you will not be able to sign back in. Please read carefully before continuing.
        </p>
      </div>

      {/* STEP 1: INITIATION */}
      {step === 1 && (
        <div className="space-y-5 animate-in fade-in">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-foreground space-y-2">
            <p className="font-semibold text-destructive">Before you close your account</p>
            <p>Closing your account means you will immediately lose access to all TrustBank services, including your accounts, transactions, cards, and any active products.</p>
            <p>Make sure you have withdrawn any remaining funds and resolved all pending activity before proceeding.</p>
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
          {/* Reason selection */}
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

          {/* Is there a way we could serve you better? */}
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

          {/* Additional comments */}
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
            <h3 className="text-base font-bold text-destructive text-center">Confirm Account Closure</h3>

            <div className="text-sm text-center text-muted-foreground">
              You are about to permanently close your account. You will be signed out immediately and will not be able to sign back in.
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
                onClick={confirmClosure}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Permanently Close My Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
