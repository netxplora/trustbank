import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Link } from "react-router-dom";

export default function AccessDenied() {
  document.title = "Access Denied | TrustBank Premium";
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 opacity-[0.02] flex items-center justify-center select-none pointer-events-none">
        <span className="text-9xl font-bold font-poppins tracking-widest text-center">RESTRICTED</span>
      </div>

      <div className="relative z-10 max-w-md mx-auto p-6 text-center space-y-6">
        <div className="h-16 w-16 bg-destructive/10 border border-red-500/20 text-destructive rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <ShieldAlert className="h-8 w-8" />
        </div>
        
        <h1 className="text-3xl font-poppins font-bold tracking-tight text-foreground">403 Access Denied</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
          You do not carry the administrative credentials required to access this secure terminal. This transaction has been logged.
        </p>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" className="border-border text-foreground hover:bg-surface flex items-center justify-center gap-2" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </Button>
          <Button className="bg-primary hover:bg-primary/90 border-none text-foreground font-bold" asChild>
            <Link to="/contact">Contact Private Office</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
