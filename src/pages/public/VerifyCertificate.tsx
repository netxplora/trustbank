import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { PageLoader } from "@/components/ui/PageLoader";

interface VerifyData {
  certificate_number: string;
  verification_code: string;
  company_name: string;
  ticker: string;
  shares_held: number;
  total_value: number;
  currency: string;
  issue_date: string;
  profiles: {
    first_name: string;
    last_name: string;
    display_name: string;
  };
}

export default function VerifyCertificate() {
  const { code } = useParams();
  const [cert, setCert] = useState<VerifyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (code) {
      verifyCode(code);
    } else {
      setError("No verification code provided.");
      setLoading(false);
    }
  }, [code]);

  const verifyCode = async (verificationCode: string) => {
    try {
      const { data, error: err } = await supabase
        .from("stock_certificates")
        .select(`
          *,
          profiles:user_id ( first_name, last_name, display_name )
        `)
        .eq("verification_code", verificationCode)
        .single();

      if (err) throw err;
      setCert(data as any);
    } catch (err: any) {
      console.error(err);
      setError("Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      <header className="h-16 border-b border-border bg-background flex items-center px-4 sm:px-8 shrink-0 shadow-sm">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logo} alt="TrustBank" className="h-6 w-6" />
          <span className="font-poppins text-lg font-bold text-foreground">TrustBank</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6">
        <div className="max-w-2xl w-full">
          {error || !cert ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center shadow-xl">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="h-10 w-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold font-poppins text-foreground mb-3">Verification Failed</h1>
              <p className="text-muted-foreground mb-8">
                {error || "The certificate could not be found. Please check the URL and try again."}
              </p>
              <Button asChild className="rounded-xl px-8">
                <Link to="/">Return to Homepage</Link>
              </Button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              {/* Success Header */}
              <div className="bg-success/10 border-b border-success/20 p-8 text-center">
                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-8 w-8 text-success" />
                </div>
                <h1 className="text-2xl font-bold font-poppins text-success mb-2">Verified Official Document</h1>
                <p className="text-sm text-success/80 font-medium">This Stock Holdings Certificate is authentic and was issued by TrustBank.</p>
              </div>

              {/* Document Details */}
              <div className="p-8 sm:p-10 space-y-8">
                <div className="grid sm:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Shareholder Name</h3>
                    <p className="text-lg font-bold text-foreground">
                      {cert.profiles.first_name ? `${cert.profiles.first_name} ${cert.profiles.last_name || ''}` : cert.profiles.display_name || "Valued Customer"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Issue Date</h3>
                    <p className="text-lg font-mono font-medium text-foreground">
                      {new Date(cert.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border w-full"></div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Security Details</h3>
                    <p className="text-xl font-bold text-foreground font-poppins">{cert.company_name} <span className="text-muted-foreground font-mono text-lg ml-2">({cert.ticker})</span></p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Shares Held</h3>
                      <p className="text-2xl font-black text-primary font-mono">{Number(cert.shares_held).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Value</h3>
                      <p className="text-2xl font-black text-foreground font-mono">
                        {cert.currency === "USD" ? "$" : cert.currency} {Number(cert.total_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-muted-foreground font-mono">
                    Certificate No: <strong className="text-foreground">{cert.certificate_number}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
