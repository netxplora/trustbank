import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Link } from "react-router-dom";

export default function ServerErrorPage() {
  document.title = "Internal Server Exception | TrustBank Premium";
  
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 opacity-[0.02] flex items-center justify-center select-none pointer-events-none">
        <span className="text-9xl font-bold font-poppins tracking-widest text-center">EXCEPTION</span>
      </div>

      <div className="relative z-10 max-w-md mx-auto p-6 text-center space-y-6">
        <div className="h-16 w-16 bg-destructive/10 border border-red-500/20 text-destructive rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <AlertCircle className="h-8 w-8" />
        </div>
        
        <h1 className="text-3xl font-poppins font-bold tracking-tight text-foreground">500 Server Error</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
          An unexpected internal exception occurred while executing this secure request. Our systems desk has been notified.
        </p>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" className="border-border text-foreground hover:bg-surface" asChild>
            <Link to="/">Return to Home</Link>
          </Button>
          <Button onClick={handleReload} className="bg-primary hover:bg-primary/90 border-none text-foreground font-bold flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4" /> Retry Request
          </Button>
        </div>
      </div>
    </div>
  );
}
