import { useEffect, useState } from "react";
import { BadgeDollarSign, ShieldAlert, Check, X, ClipboardList, Plus, Pencil, Trash2, Users, BarChart3, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StaggerContainer, StaggerItem, SlideUp } from "@/components/public/Motion";

// ─── Types ────────────────────────────────────────────────────
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

interface AvailableStock {
  id: string;
  symbol: string;
  name: string;
  asset_class: string;
  current_price: number;
  is_active: boolean;
  created_at: string;
}

interface InvestmentAccountRow {
  id: string;
  user_id: string;
  account_type: string;
  account_number: string;
  balance: number;
  cash_balance: number;
  status: string;
  created_at: string;
  profile?: { display_name: string; email: string };
}

type TabId = "stocks" | "accounts" | "orders";

// ─── Component ────────────────────────────────────────────────
export default function AdminInvestmentsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("stocks");

  // ─── Orders State ──────────────────────────────────────────
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [fillPrices, setFillPrices] = useState<Record<string, string>>({});
  const [ordersLoading, setOrdersLoading] = useState(true);

  // ─── Stocks State ──────────────────────────────────────────
  const [stocks, setStocks] = useState<AvailableStock[]>([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<AvailableStock | null>(null);
  const [stockForm, setStockForm] = useState({ symbol: "", name: "", asset_class: "stock", current_price: "" });

  // ─── Accounts State ────────────────────────────────────────
  const [investmentAccounts, setInvestmentAccounts] = useState<InvestmentAccountRow[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustAccount, setAdjustAccount] = useState<InvestmentAccountRow | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");

  // ─── Lifecycle ─────────────────────────────────────────────
  useEffect(() => {
    fetchStocks();
    fetchOrders();
    fetchInvestmentAccounts();
  }, []);

  // ═══════════════════════════════════════════════════════════
  // STOCKS CRUD
  // ═══════════════════════════════════════════════════════════
  const fetchStocks = async () => {
    try {
      const { data, error } = await (supabase as any).from("available_stocks").select("*").order("symbol");
      if (error) throw error;
      setStocks((data as AvailableStock[]) || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setStocksLoading(false);
    }
  };

  const openAddStock = () => {
    setEditingStock(null);
    setStockForm({ symbol: "", name: "", asset_class: "stock", current_price: "" });
    setStockDialogOpen(true);
  };

  const openEditStock = (stock: AvailableStock) => {
    setEditingStock(stock);
    setStockForm({
      symbol: stock.symbol,
      name: stock.name,
      asset_class: stock.asset_class,
      current_price: stock.current_price.toString(),
    });
    setStockDialogOpen(true);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(stockForm.current_price);
    if (!stockForm.symbol.trim() || !stockForm.name.trim() || isNaN(price) || price <= 0) {
      toast({ title: "Validation Error", description: "All fields are required. Price must be a positive number.", variant: "destructive" });
      return;
    }

    try {
      if (editingStock) {
        // Update
        const { error } = await (supabase as any)
          .from("available_stocks")
          .update({
            symbol: stockForm.symbol.toUpperCase().trim(),
            name: stockForm.name.trim(),
            asset_class: stockForm.asset_class,
            current_price: price,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingStock.id);
        if (error) throw error;
        toast({ title: "Stock Updated", description: `${stockForm.symbol.toUpperCase()} has been updated.` });
      } else {
        // Insert
        const { error } = await (supabase as any)
          .from("available_stocks")
          .insert({
            symbol: stockForm.symbol.toUpperCase().trim(),
            name: stockForm.name.trim(),
            asset_class: stockForm.asset_class,
            current_price: price,
            is_active: true,
          });
        if (error) throw error;
        toast({ title: "Stock Added", description: `${stockForm.symbol.toUpperCase()} is now available for trading.` });
      }
      setStockDialogOpen(false);
      fetchStocks();
    } catch (e: any) {
      toast({ title: "Save Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteStock = async (stock: AvailableStock) => {
    if (!confirm(`Are you sure you want to delist ${stock.symbol}? Users will no longer be able to trade this stock.`)) return;
    try {
      const { error } = await (supabase as any).from("available_stocks").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", stock.id);
      if (error) throw error;
      toast({ title: "Stock Delisted", description: `${stock.symbol} has been removed from the trading catalog.` });
      fetchStocks();
    } catch (e: any) {
      toast({ title: "Delete Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleReactivateStock = async (stock: AvailableStock) => {
    try {
      const { error } = await (supabase as any).from("available_stocks").update({ is_active: true, updated_at: new Date().toISOString() }).eq("id", stock.id);
      if (error) throw error;
      toast({ title: "Stock Reactivated", description: `${stock.symbol} is now available for trading again.` });
      fetchStocks();
    } catch (e: any) {
      toast({ title: "Reactivation Failed", description: e.message, variant: "destructive" });
    }
  };

  // ═══════════════════════════════════════════════════════════
  // INVESTMENT ACCOUNTS
  // ═══════════════════════════════════════════════════════════
  const fetchInvestmentAccounts = async () => {
    try {
      const { data, error } = await (supabase as any).from("investment_accounts").select("*").order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data as any[]) || [];
      const userIds: string[] = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));

      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase.from("profiles").select("user_id, display_name, email").in("user_id", userIds);
        profilesData?.forEach((p) => {
          profilesMap[p.user_id] = p;
        });
      }

      const finalRows: InvestmentAccountRow[] = rows.map((r) => ({
        ...r,
        profile: profilesMap[r.user_id] || null,
      }));

      setInvestmentAccounts(finalRows);
    } catch (e: any) {
      console.error(e);
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleToggleAccountStatus = async (acct: InvestmentAccountRow) => {
    const newStatus = acct.status === "active" ? "frozen" : "active";
    try {
      const { error } = await (supabase as any)
        .from("investment_accounts")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", acct.id);
      if (error) throw error;
      toast({ title: `Account ${newStatus === "active" ? "Activated" : "Frozen"}`, description: `Account ${acct.account_number} is now ${newStatus}.` });
      fetchInvestmentAccounts();
    } catch (e: any) {
      toast({ title: "Status Update Failed", description: e.message, variant: "destructive" });
    }
  };

  const openAdjustDialog = (acct: InvestmentAccountRow) => {
    setAdjustAccount(acct);
    setAdjustAmount("");
    setAdjustDialogOpen(true);
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAccount) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      toast({ title: "Invalid Amount", description: "Enter a positive number to add funds, or a negative number to debit.", variant: "destructive" });
      return;
    }

    try {
      const newBalance = Number(adjustAccount.cash_balance) + amount;
      if (newBalance < 0) {
        toast({ title: "Insufficient Balance", description: "Cannot debit more than the available cash balance.", variant: "destructive" });
        return;
      }

      const { error } = await (supabase as any)
        .from("investment_accounts")
        .update({ cash_balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", adjustAccount.id);
      if (error) throw error;

      toast({
        title: amount > 0 ? "Funds Added" : "Funds Debited",
        description: `$${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${amount > 0 ? "added to" : "debited from"} account ${adjustAccount.account_number}.`,
      });
      setAdjustDialogOpen(false);
      fetchInvestmentAccounts();
    } catch (e: any) {
      toast({ title: "Adjustment Failed", description: e.message, variant: "destructive" });
    }
  };

  // ═══════════════════════════════════════════════════════════
  // ORDERS (Existing Logic)
  // ═══════════════════════════════════════════════════════════
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

      const userIds: string[] = Array.from(new Set(ordersData?.map((o: any) => o.investment_accounts?.user_id).filter(Boolean) as string[]));

      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase.from("profiles").select("user_id, display_name, email").in("user_id", userIds);
        profilesData?.forEach((p) => {
          profilesMap[p.user_id] = p;
        });
      }

      const finalData = ordersData?.map((o: any) => {
        const userId = o.investment_accounts?.user_id;
        return {
          ...o,
          investment_accounts: {
            ...(o.investment_accounts || {}),
            profiles: userId ? profilesMap[userId] : null,
          },
        };
      });

      setOrders((finalData as any[]) || []);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Fetch Failed", description: e.message, variant: "destructive" });
    } finally {
      setOrdersLoading(false);
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

  // ─── Tab Config ────────────────────────────────────────────
  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "stocks", label: "Stock Catalog", icon: <Package className="h-4 w-4" />, count: stocks.filter((s) => s.is_active).length },
    { id: "accounts", label: "Investment Accounts", icon: <Users className="h-4 w-4" />, count: investmentAccounts.length },
    { id: "orders", label: "Orders", icon: <BarChart3 className="h-4 w-4" />, count: pendingOrders.length },
  ];

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <div>
        <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Wealth Management & Portfolios</h1>
        <p className="text-xs text-muted-foreground font-sans">Manage stocks, investment accounts, and customer orders</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-[9px] px-1 py-0.2 rounded-sm font-mono ${
                activeTab === tab.id ? "bg-white/20" : "bg-muted"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* TAB: Stock Catalog                                  */}
      {/* ════════════════════════════════════════════════════ */}
      {activeTab === "stocks" && (
        <StaggerContainer className="space-y-6 font-sans">
          <StaggerItem>
            <div className="bg-card rounded-3xl border overflow-hidden shadow-sm">
              <div className="p-5 border-b flex justify-between items-center">
                <h3 className="font-semibold font-poppins text-foreground flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> Available Stocks ({stocks.filter((s) => s.is_active).length} active)
                </h3>
                <Button size="sm" className="gap-2 font-bold h-9 text-xs" onClick={openAddStock}>
                  <Plus className="h-3.5 w-3.5" /> Add Stock
                </Button>
              </div>

              {stocksLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : stocks.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No stocks in the catalog. Click "Add Stock" to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/20 border-b text-xs font-semibold text-muted-foreground">
                      <tr>
                        <th className="p-4 font-poppins">Symbol</th>
                        <th className="p-4 font-poppins">Name</th>
                        <th className="p-4 font-poppins">Asset Class</th>
                        <th className="p-4 text-right font-poppins">Current Price</th>
                        <th className="p-4 font-poppins">Status</th>
                        <th className="p-4 text-center font-poppins">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {stocks.map((stock) => (
                        <tr key={stock.id} className={`hover:bg-muted/10 transition-colors align-middle ${!stock.is_active ? "opacity-50" : ""}`}>
                          <td className="p-4 font-bold text-foreground font-mono">{stock.symbol}</td>
                          <td className="p-4 text-muted-foreground font-semibold text-xs">{stock.name}</td>
                          <td className="p-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-muted text-muted-foreground">
                              {stock.asset_class}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-foreground">
                            ${Number(stock.current_price).toFixed(2)}
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
                              stock.is_active
                                ? "bg-success/10 text-success border-success/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                            }`}>
                              {stock.is_active ? "Active" : "Delisted"}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button size="sm" variant="outline" className="h-7 text-xs px-2 font-bold" onClick={() => openEditStock(stock)}>
                                <Pencil className="h-3 w-3 mr-1" /> Edit
                              </Button>
                              {stock.is_active ? (
                                <Button size="sm" variant="destructive" className="h-7 text-xs px-2 font-bold" onClick={() => handleDeleteStock(stock)}>
                                  <Trash2 className="h-3 w-3 mr-1" /> Delist
                                </Button>
                              ) : (
                                <Button size="sm" variant="default" className="h-7 text-xs px-2 font-bold bg-success hover:bg-success/90" onClick={() => handleReactivateStock(stock)}>
                                  <Check className="h-3 w-3 mr-1" /> Reactivate
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </StaggerItem>
        </StaggerContainer>
      )}

      {/* Stock Add/Edit Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins font-bold">{editingStock ? "Edit Stock" : "Add New Stock"}</DialogTitle>
            <DialogDescription>{editingStock ? `Update details for ${editingStock.symbol}` : "Add a new stock to the trading catalog."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveStock} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Ticker Symbol</label>
              <Input
                required
                placeholder="e.g. TSLA"
                value={stockForm.symbol}
                onChange={(e) => setStockForm({ ...stockForm, symbol: e.target.value })}
                className="font-mono font-bold uppercase"
                disabled={!!editingStock}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Company / Fund Name</label>
              <Input
                required
                placeholder="e.g. Tesla Inc."
                value={stockForm.name}
                onChange={(e) => setStockForm({ ...stockForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Asset Class</label>
                <select
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold"
                  value={stockForm.asset_class}
                  onChange={(e) => setStockForm({ ...stockForm, asset_class: e.target.value })}
                >
                  <option value="stock">Stock</option>
                  <option value="etf">ETF</option>
                  <option value="bond">Bond</option>
                  <option value="mutual_fund">Mutual Fund</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Current Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={stockForm.current_price}
                  onChange={(e) => setStockForm({ ...stockForm, current_price: e.target.value })}
                  className="font-mono font-bold"
                />
              </div>
            </div>
            <Button type="submit" className="w-full font-bold h-11 text-sm mt-2">
              {editingStock ? "Save Changes" : "Add to Catalog"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════ */}
      {/* TAB: Investment Accounts                            */}
      {/* ════════════════════════════════════════════════════ */}
      {activeTab === "accounts" && (
        <StaggerContainer className="space-y-6 font-sans">
          <StaggerItem>
            <div className="bg-card rounded-3xl border overflow-hidden shadow-sm">
              <div className="p-5 border-b">
                <h3 className="font-semibold font-poppins text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> All Investment Accounts ({investmentAccounts.length})
                </h3>
              </div>

              {accountsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : investmentAccounts.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No investment accounts have been created yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/20 border-b text-xs font-semibold text-muted-foreground">
                      <tr>
                        <th className="p-4 font-poppins">Customer</th>
                        <th className="p-4 font-poppins">Account Number</th>
                        <th className="p-4 font-poppins">Type</th>
                        <th className="p-4 text-right font-poppins">Cash Balance</th>
                        <th className="p-4 text-right font-poppins">Total Balance</th>
                        <th className="p-4 font-poppins">Status</th>
                        <th className="p-4 text-center font-poppins">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {investmentAccounts.map((acct) => (
                        <tr key={acct.id} className="hover:bg-muted/10 transition-colors align-middle">
                          <td className="p-4">
                            <p className="font-bold text-foreground text-sm">{acct.profile?.display_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{acct.profile?.email || ""}</p>
                          </td>
                          <td className="p-4 font-mono font-bold text-foreground text-xs">{acct.account_number}</td>
                          <td className="p-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-primary/10 text-primary">
                              {acct.account_type.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-foreground">
                            ${Number(acct.cash_balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-foreground">
                            ${Number(acct.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
                              acct.status === "active"
                                ? "bg-success/10 text-success border-success/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                            }`}>
                              {acct.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button size="sm" variant="outline" className="h-7 text-xs px-2 font-bold" onClick={() => openAdjustDialog(acct)}>
                                <BadgeDollarSign className="h-3 w-3 mr-1" /> Adjust
                              </Button>
                              <Button
                                size="sm"
                                variant={acct.status === "active" ? "destructive" : "default"}
                                className={`h-7 text-xs px-2 font-bold ${acct.status !== "active" ? "bg-success hover:bg-success/90" : ""}`}
                                onClick={() => handleToggleAccountStatus(acct)}
                              >
                                {acct.status === "active" ? (
                                  <><ShieldAlert className="h-3 w-3 mr-1" /> Freeze</>
                                ) : (
                                  <><Check className="h-3 w-3 mr-1" /> Activate</>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </StaggerItem>
        </StaggerContainer>
      )}

      {/* Adjust Balance Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins font-bold">Adjust Cash Balance</DialogTitle>
            <DialogDescription>
              {adjustAccount ? `Account: ${adjustAccount.account_number} · Current Cash: $${Number(adjustAccount.cash_balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjustBalance} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Amount (positive to add, negative to debit)
              </label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 5000 or -1000"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="font-mono font-bold text-lg"
              />
            </div>
            <Button type="submit" className="w-full font-bold h-11 text-sm mt-2">
              Apply Adjustment
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════ */}
      {/* TAB: Orders                                         */}
      {/* ════════════════════════════════════════════════════ */}
      {activeTab === "orders" && (
        ordersLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <StaggerContainer className="space-y-8 font-sans">
            {/* Pending Orders Section */}
            <StaggerItem>
              <div className="bg-card rounded-3xl border overflow-hidden shadow-sm hover-lift h-full">
                <div className="p-5 border-b flex justify-between items-center bg-warning/5">
                  <h3 className="font-semibold font-poppins text-foreground flex items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5 text-warning animate-pulse" /> Pending Orders ({pendingOrders.length})
                </h3>
                <span className="text-xs text-warning font-bold bg-warning/10 px-2 py-1 rounded-sm border border-warning/20 uppercase tracking-wider">
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
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${o.side === "buy" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
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
                                  className="h-8 bg-success hover:bg-success/90 text-foreground font-bold text-xs py-1"
                                  onClick={() => handleFillOrder(o.id, o.limit_price)}
                                >
                                  <Check className="h-3.5 w-3.5 mr-0.5" /> Execute
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 text-xs font-bold py-1 bg-destructive hover:bg-destructive/90"
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
              <div className="bg-card rounded-3xl border overflow-hidden shadow-sm hover-lift h-full">
                <div className="p-5 border-b bg-muted/10">
                <h3 className="font-semibold font-poppins text-foreground flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" /> Order History
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
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${o.side === "buy" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                                {o.side}
                              </span>
                              <span className="font-bold text-foreground text-sm ml-2">{o.symbol}</span>
                            </td>
                            <td className="p-4 text-right font-bold text-foreground font-mono">{Number(o.quantity).toFixed(2)}</td>
                            <td className="p-4 text-right">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${o.status === "filled" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
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
        )
      )}
    </div>
  );
}
