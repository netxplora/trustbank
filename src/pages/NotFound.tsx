import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { HelpCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  document.title = "Page Not Found | TrustBank Premium";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 opacity-[0.02] flex items-center justify-center select-none pointer-events-none">
        <span className="text-9xl font-bold font-poppins tracking-widest text-center">ABSENT</span>
      </div>

      <div className="relative z-10 max-w-md mx-auto p-6 text-center space-y-6">
        <div className="h-16 w-16 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <HelpCircle className="h-8 w-8" />
        </div>
        
        <h1 className="text-3xl font-poppins font-bold tracking-tight text-foreground">404 Page Not Found</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
          The banking terminal at <code className="font-mono text-warning text-xs px-1.5 py-0.5 bg-surface rounded">{location.pathname}</code> does not exist or has been relocated.
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
};

export default NotFound;
