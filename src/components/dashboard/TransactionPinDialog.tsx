import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ShieldAlert, ShieldCheck, KeyRound, Loader2 } from "lucide-react";

interface TransactionPinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  isLoading?: boolean;
}

export function TransactionPinDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Transaction",
  description,
  amount,
  currency = "$",
  isLoading = false,
}: TransactionPinDialogProps) {
  const [pin, setPin] = useState("");

  // Reset PIN when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPin("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4 && !isLoading) {
      onConfirm(pin);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isLoading) onClose();
    }}>
      <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl">
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2 text-sm leading-relaxed">
            {description || "Please enter your 4-digit Transaction PIN to authorize this action."}
          </DialogDescription>
        </DialogHeader>

        {amount !== undefined && (
          <div className="py-4 my-2 border-y border-border flex flex-col items-center justify-center space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Amount to Process</span>
            <span className="text-3xl font-bold text-foreground">
              {currency}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-8 py-4">
          <div className="relative group">
            <InputOTP 
              maxLength={4} 
              value={pin} 
              onChange={setPin}
              disabled={isLoading}
              className="gap-3"
            >
              <InputOTPGroup className="gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <InputOTPSlot 
                    key={i} 
                    index={i} 
                    className="w-14 h-16 text-2xl font-bold border-2 rounded-xl transition-all
                               focus-visible:ring-primary focus-visible:border-primary bg-background" 
                    style={{ WebkitTextSecurity: "disc" }}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pin.length !== 4 || isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Authorize"
              )}
            </Button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Secured by TrustBank Zero-Trust Infrastructure</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
