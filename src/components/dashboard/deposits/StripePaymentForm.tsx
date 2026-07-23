import { useState } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

export const StripePaymentForm = ({ clientSecret, amount, accountId, onBack, onSuccess }: { clientSecret: string; amount: number; accountId: string; onBack: () => void; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      toast({ title: "Payment Failed", description: error.message, variant: "destructive" });
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded! Record it in Supabase
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("Not authenticated");

        const depositRef = 'STRIPE-' + paymentIntent.id.slice(-10).toUpperCase();

        // Record in payment_sessions
        const { error: sessionError } = await supabase.from("payment_sessions").insert({
          user_id: userData.user.id,
          account_id: accountId,
          amount: amount,
          method: "stripe",
          reference: depositRef,
          status: "approved"
        });
        if (sessionError) throw sessionError;

        // Insert deposit transaction — the update_account_balance trigger
        // automatically credits the account when type='deposit' and status='completed'
        const { error: txError } = await supabase.from("transactions").insert({
          user_id: userData.user.id,
          account_id: accountId,
          type: "deposit",
          amount: amount,
          description: "Stripe Card Deposit",
          reference: depositRef,
          status: "completed"
        });
        if (txError) throw txError;

        setPaymentDone(true);
        setTimeout(onSuccess, 2000);
      } catch (err: any) {
        toast({ title: "Database Error", description: err.message || "Failed to record deposit.", variant: "destructive" });
      }
      setLoading(false);
    }
  };

  if (paymentDone) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center text-success mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-2xl font-bold font-poppins">Payment Successful!</h3>
        <p className="text-muted-foreground font-sans">Your deposit of ${amount.toLocaleString()} has been added to your account.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" className="flex-1 rounded-xl h-12" onClick={onBack} disabled={loading}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button type="submit" className="flex-1 rounded-xl h-12 font-bold" disabled={!stripe || loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Pay $${amount.toLocaleString()}`}
        </Button>
      </div>
    </form>
  );
};
