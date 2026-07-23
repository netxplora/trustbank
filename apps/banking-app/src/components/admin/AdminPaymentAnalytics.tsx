import { useState, useEffect } from "react";
import { DollarSign, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";

interface AnalyticsData {
  totalDeposits: number;
  totalVolume: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export function AdminPaymentAnalytics({ refreshTrigger }: { refreshTrigger: number }) {
  const [data, setData] = useState<AnalyticsData>({
    totalDeposits: 0,
    totalVolume: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [refreshTrigger]);

  const fetchAnalytics = async () => {
    const { data: sessions, error } = await supabase
      .from("payment_sessions")
      .select("amount, status");

    if (error || !sessions) return;

    const stats = sessions.reduce(
      (acc, s) => {
        acc.totalDeposits++;
        acc.totalVolume += Number(s.amount);
        if (s.status === "pending_payment" || s.status === "under_review") acc.pendingCount++;
        else if (s.status === "approved") acc.approvedCount++;
        else if (s.status === "rejected") acc.rejectedCount++;
        return acc;
      },
      { totalDeposits: 0, totalVolume: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0 }
    );

    setData(stats);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-card rounded-xl border p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">Total Volume</p>
        </div>
        <p className="text-2xl font-bold font-mono">${data.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        <p className="text-xs text-muted-foreground mt-1">From {data.totalDeposits} total deposits</p>
      </div>

      <div className="bg-card rounded-xl border p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-warning/20 rounded-full flex items-center justify-center text-warning">
            <AlertCircle className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">Pending Action</p>
        </div>
        <p className="text-2xl font-bold font-mono">{data.pendingCount}</p>
        <p className="text-xs text-muted-foreground mt-1">Awaiting proof or review</p>
      </div>

      <div className="bg-card rounded-xl border p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-success/20 rounded-full flex items-center justify-center text-success">
            <CheckCircle className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">Approved</p>
        </div>
        <p className="text-2xl font-bold font-mono">{data.approvedCount}</p>
        <p className="text-xs text-muted-foreground mt-1">Successfully credited</p>
      </div>

      <div className="bg-card rounded-xl border p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-destructive/20 rounded-full flex items-center justify-center text-destructive">
            <XCircle className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">Rejected</p>
        </div>
        <p className="text-2xl font-bold font-mono">{data.rejectedCount}</p>
        <p className="text-xs text-muted-foreground mt-1">Failed verifications</p>
      </div>
    </div>
  );
}
