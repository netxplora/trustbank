import { useEffect, useState } from "react";
import { BadgeDollarSign, ShieldAlert, Check, X, ClipboardList } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { StaggerContainer, StaggerItem, SlideUp } from "@trustbank/shared-ui/components/Motion";

interface AdminOrder {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  order_type: "market" | "limit";
  limit_price: number | null;
  status: "pending" | "filled" | "cancelled";
  created_at: string;
  investment_accounts: {
    account_number: string;
    account_type: string;
    cash_balance: number;
    profiles: {
      display_name: string;
      email: string;
    };
  };
}

export default function AdminInvestmentsPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [fillPrices, setFillPrices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await (supabase as any)
        .from("investment_orders")
        .select(`
          *,
          investment_accounts(
            user_id,
            account_number,
            account_type,
            cash_balance
          )
        `)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Extract user_ids to fetch profiles manually
      const userIds: string[] = Array.from(new Set(ordersData?.map((o: any) => o.investment_accounts?.user_id).filter(Boolean) as string[]));
      
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase.from("profiles").select("user_id, display_name, email").in("user_id", userIds);
        profilesData?.forEach(p => {
          profilesMap[p.user_id] = p;
        });
      }

      // Merge profiles into orders
      const finalData = ordersData?.map((o: any) => {
        const userId = o.investment_accounts?.user_id;
        return {
          ...o,
          investment_accounts: {
            ...(o.investment_accounts || {}),
            profiles: userId ? profilesMap[userId] : null
          }
        };
      });

      setOrders((finalData as any[]) || []);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Fetch Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFillOrder = async (orderId: string, limitPrice: number | null) => {
    const priceStr = fillPrices[orderId] || (limitPrice ? limitPrice.toString() : "");
    const price = parseFloat(priceStr);
    
    if (isNaN(price) || price <= 0) {
      toast({ title: "Invalid Fill Price", description: "Please enter a valid positive decimal number.", variant: "destructive" });
      return;
    }

    try {
      const { data, error } = await (supabase as any).rpc("execute_order", {
        order_id: orderId,
        fill_price: price,
      });

      if (error) throw error;

      toast({ title: "Order Executed", description: `Order ${orderId.slice(0, 8)} successfully filled at $${price.toFixed(2)}.` });
      setFillPrices((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      fetchOrders();
    } catch (e: any) {
      toast({ title: "Execution Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("investment_orders")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      toast({ title: "Order Cancelled", description: `Order ${orderId.slice(0, 8)} has been cancelled.` });
      fetchOrders();
    } catch (e: any) {
      toast({ title: "Cancel Failed", description: e.message, variant: "destructive" });
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const processedOrders = orders.filter((o) => o.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">Institutional Trading Desk</h1>
        <p className="text-sm text-muted-foreground font-sans">Approve, execute, or reject client pending securities transactions</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <StaggerContainer className="space-y-8 font-sans">
          {/* Pending Orders Section */}
          <StaggerItem>
            <div className="bg-card rounded-xl border overflow-hidden shadow-sm hover-lift h-full">
              <div className="p-5 border-b flex justify-between items-center bg-warning/5">
                <h3 className="font-semibold font-poppins text-foreground flex items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 text-warning animate-pulse" /> Pending Execution Queue ({pendingOrders.length})
              </h3>
              <span className="text-xs text-warning font-bold bg-warning/10 px-2 py-1 rounded-sm border border-amber-200 uppercase tracking-wider">
                Action Required
              </span>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No pending orders in the queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/20 border-b text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-4 font-poppins">Customer</th>
                      <th className="p-4 font-poppins">Portfolio / Cash</th>
                      <th className="p-4 font-poppins">Execution Details</th>
                      <th className="p-4 text-right font-poppins">Shares</th>
                      <th className="p-4 text-right font-poppins">Limit Price</th>
                      <th className="p-4 font-poppins">Fill Price Input ($)</th>
                      <th className="p-4 text-center font-poppins">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pendingOrders.map((o) => {
                      const profileName = o.investment_accounts?.profiles?.display_name || "Unknown Customer";
                      const profileEmail = o.investment_accounts?.profiles?.email || "";
                      const cashBalance = o.investment_accounts?.cash_balance || 0;
                      const acctType = "Managed Portfolio";
                      const acctNum = o.investment_accounts?.account_number || "";

                      return (
                        <tr key={o.id} className="hover:bg-muted/10 transition-colors align-middle">
                          <td className="p-4">
                            <p className="font-bold text-foreground text-sm">{profileName}</p>
                            <p className="text-xs text-muted-foreground">{profileEmail}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-xs font-mono font-bold text-foreground">{acctNum}</p>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase">{acctType} · ${cashBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} cash</p>
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${o.side === "buy" ? "bg-success/10 text-success border-emerald-100" : "bg-destructive/10 text-destructive border-red-100"}`}>
                              {o.side}
                            </span>
                            <span className="font-bold text-foreground text-sm ml-2">{o.symbol}</span>
                            <span className="text-xs text-muted-foreground ml-1">({o.order_type})</span>
                          </td>
                          <td className="p-4 text-right font-bold text-foreground font-mono">{Number(o.quantity).toFixed(2)}</td>
                          <td className="p-4 text-right font-mono text-xs font-semibold">
                            {o.limit_price ? `$${Number(o.limit_price).toFixed(2)}` : "—"}
                          </td>
                          <td className="p-4">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder={o.limit_price ? o.limit_price.toString() : "0.00"}
                              className="h-8 max-w-[120px] font-mono text-xs"
                              value={fillPrices[o.id] || ""}
                              onChange={(e) => setFillPrices({ ...fillPrices, [o.id]: e.target.value })}
                            />
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8 bg-success hover:bg-emerald-700 text-foreground font-bold text-xs py-1"
                                onClick={() => handleFillOrder(o.id, o.limit_price)}
                              >
                                <Check className="h-3.5 w-3.5 mr-0.5" /> Execute
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 text-xs font-bold py-1 bg-destructive hover:bg-red-700"
                                onClick={() => handleCancelOrder(o.id)}
                              >
                                <X className="h-3.5 w-3.5 mr-0.5" /> Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </StaggerItem>

          {/* Processed Orders Section */}
          <StaggerItem>
            <div className="bg-card rounded-xl border overflow-hidden shadow-sm hover-lift h-full">
              <div className="p-5 border-b bg-muted/10">
              <h3 className="font-semibold font-poppins text-foreground flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-muted-foreground" /> Execution History Ledger
              </h3>
            </div>

            {processedOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No processed orders in history.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/20 border-b text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-4 font-poppins">Customer</th>
                      <th className="p-4 font-poppins">Account</th>
                      <th className="p-4 font-poppins">Details</th>
                      <th className="p-4 text-right font-poppins">Shares</th>
                      <th className="p-4 text-right font-poppins">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-muted-foreground">
                    {processedOrders.map((o) => {
                      const profileName = o.investment_accounts?.profiles?.display_name || "Unknown Customer";
                      const acctNum = o.investment_accounts?.account_number || "";

                      return (
                        <tr key={o.id} className="hover:bg-muted/5 transition-colors align-middle">
                          <td className="p-4">
                            <p className="font-bold text-foreground text-sm">{profileName}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-xs font-mono font-semibold">{acctNum}</p>
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${o.side === "buy" ? "bg-success/10 text-success border-emerald-100" : "bg-destructive/10 text-destructive border-red-100"}`}>
                              {o.side}
                            </span>
                            <span className="font-bold text-foreground text-sm ml-2">{o.symbol}</span>
                          </td>
                          <td className="p-4 text-right font-bold text-foreground font-mono">{Number(o.quantity).toFixed(2)}</td>
                          <td className="p-4 text-right">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${o.status === "filled" ? "bg-success/10 text-success border-emerald-100" : "bg-destructive/10 text-destructive border-red-100"}`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            </div>
          </StaggerItem>
        </StaggerContainer>
      )}
    </div>
  );
}
