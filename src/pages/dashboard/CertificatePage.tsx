import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Printer, ArrowLeft, ShieldCheck, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "@/components/ui/QRCode";
import logo from "@/assets/logo.png";
import { PageLoader } from "@/components/ui/PageLoader";
import { useBrand } from "@/contexts/BrandContext";

interface CertificateData {
  id: string;
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
    account_number: string;
  };
  investment_accounts: {
    account_number: string;
  };
}

export default function CertificatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { identity, visuals } = useBrand();
  const brandName = identity?.short_name || "TrustBank";

  useEffect(() => {
    if (id && user) {
      fetchCertificate(id);
    }
  }, [id, user]);

  const fetchCertificate = async (certId: string) => {
    try {
      const { data, error: err } = await supabase
        .from("stock_certificates")
        .select(`
          *,
          profiles:user_id ( first_name, last_name, display_name, account_number ),
          investment_accounts:account_id ( account_number )
        `)
        .eq("id", certId)
        .single();

      if (err) throw err;
      setCert(data as any);
    } catch (err: any) {
      console.error(err);
      setError("Certificate not found or you do not have permission to view it.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <PageLoader />;

  if (error || !cert) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-destructive font-medium">{error}</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/investments")}>
          Return to Investments
        </Button>
      </div>
    );
  }

  const shareholderName = cert.profiles.first_name 
    ? `${cert.profiles.first_name} ${cert.profiles.last_name || ''}` 
    : cert.profiles.display_name || "Valued Customer";
    
  const maskedId = cert.profiles.account_number 
    ? `****${cert.profiles.account_number.slice(-4)}` 
    : "N/A";
    
  const verifyUrl = `${window.location.origin}/verify/${cert.verification_code}`;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-8 px-4 font-sans print:bg-white print:py-0 print:px-0">
      {/* Non-printable controls */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={() => navigate("/dashboard/investments")} className="flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </Button>
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer size={16} /> Print Certificate
        </Button>
      </div>

      {/* A4 Certificate Container */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white text-slate-900 shadow-2xl print:shadow-none relative p-6">
        
        {/* Outer Premium Border */}
        <div className="w-full h-full border-[12px] border-slate-100 p-2 relative flex flex-col">
          {/* Inner Thin Border */}
          <div className="w-full h-full border-[2px] border-slate-300 relative flex flex-col p-10 sm:p-14 z-10 bg-white">
            
            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
              <img src={logo} alt="Watermark" className="w-[400px] h-[400px] object-contain grayscale" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="flex justify-between items-start mb-14">
                <div className="flex items-center gap-4">
                <img src={visuals?.primary_logo || logo} alt={brandName} className="h-12 w-12 object-contain" />
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-poppins">{brandName}</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Wealth Management</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <h2 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Certificate Number</h2>
                  <p className="text-sm font-mono font-bold text-slate-800">{cert.certificate_number}</p>
                  <h2 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3 block">Issue Date</h2>
                  <p className="text-sm font-mono font-bold text-slate-800">{new Date(cert.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {/* Title Section */}
              <div className="text-center mb-12 space-y-3">
                <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em] font-poppins">Official Proof of Ownership</h2>
                <h1 className="text-5xl font-black text-slate-900 font-poppins tracking-tight uppercase">Holdings Certificate</h1>
                <div className="flex justify-center items-center gap-4 mt-6">
                  <div className="h-[1px] w-16 bg-slate-300"></div>
                  <BadgeCheck className="text-primary w-6 h-6" />
                  <div className="h-[1px] w-16 bg-slate-300"></div>
                </div>
              </div>

              {/* Formal Attestation */}
              <div className="text-center mb-12 px-8">
                <p className="text-base leading-loose text-slate-700 font-medium font-sans">
                  This is to officially certify and attest that <br />
                  <strong className="text-2xl font-bold text-slate-900 font-poppins block my-4 uppercase tracking-wide">{shareholderName}</strong>
                  is the registered holder of the specified shares listed below, maintained in official registry by TrustBank Wealth Management.
                </p>
              </div>

              {/* Data Table */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden mb-16">
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                  
                  {/* Shareholder Info */}
                  <div className="p-6 space-y-5">
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer ID</h3>
                      <p className="text-base font-mono font-bold text-slate-800">{maskedId}</p>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Investment Account</h3>
                      <p className="text-base font-mono font-bold text-slate-800">{cert.investment_accounts?.account_number || "INV-****"}</p>
                    </div>
                  </div>

                  {/* Asset Info */}
                  <div className="p-6 space-y-5 bg-white">
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Security / Ticker</h3>
                      <p className="text-lg font-bold text-slate-900 font-poppins">{cert.company_name} <span className="text-slate-400 font-mono text-base font-normal ml-1">({cert.ticker})</span></p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Shares Held</h3>
                        <p className="text-xl font-black text-primary font-mono">{Number(cert.shares_held).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</p>
                      </div>
                      <div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Value</h3>
                        <p className="text-xl font-black text-slate-900 font-mono">
                          {cert.currency === "USD" ? "$" : cert.currency} {Number(cert.total_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex-grow"></div>

              {/* Signatures & Verification */}
              <div className="flex justify-between items-end pt-8">
                {/* QR Code */}
                <div className="flex gap-6 items-end">
                  <div className="p-2 bg-white border border-slate-200 shadow-sm rounded-lg">
                    <QRCode value={verifyUrl} size={90} level="M" />
                  </div>
                  <div className="space-y-2 max-w-[200px]">
                    <div className="flex items-center gap-1.5 text-primary">
                      <ShieldCheck size={18} />
                      <span className="font-bold font-poppins text-xs tracking-wider uppercase">Verified</span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                      Scan this QR code to verify the authenticity of this document via the official TrustBank portal.
                    </p>
                    <p className="text-[10px] font-mono font-bold text-slate-800 bg-slate-100 inline-block px-2 py-1 rounded">
                      {cert.verification_code}
                    </p>
                  </div>
                </div>

                {/* Signature */}
                <div className="text-center w-48">
                  <div className="h-16 flex items-end justify-center mb-1">
                    {/* Simulated Signature */}
                    <span className="font-poppins text-2xl text-slate-800 italic opacity-80" style={{ transform: "rotate(-5deg)", display: "inline-block" }}>
                      TrustBank
                    </span>
                  </div>
                  <div className="w-full h-px bg-slate-800 mb-2"></div>
                  <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Authorized Signatory</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">TrustBank Wealth Management</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      {/* Global Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          #root {
            display: contents;
          }
        }
      `}</style>
    </div>
  );
}
