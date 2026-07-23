import { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { TrendingUp, ArrowUpRight, ArrowDownLeft, ShieldAlert, BadgeDollarSign, ArrowRightLeft } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@trustbank/shared-ui/components/ui/dialog";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { useAuth } from "@trustbank/shared-utils/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";

interface InvestmentAccount {
  id: string;
  account_type: "brokerage" | "ira_traditional" | "ira_roth";
  account_number: string;
  balance: number;
  cash_balance: number;
  status: string;
}

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avg_cost: number;
  current_price: number;
  asset_class: "stock" | "etf" | "bond" | "mutual_fund";
}

interface Order {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  order_type: "market" | "limit";
  limit_price: number | null;
  status: "pending" | "filled" | "cancelled";
  created_at: string;
}

const ASSET_COLORS = {
  stock: "hsl(350, 65%, 38%)",      // Burgundy Primary
  etf: "hsl(40, 60%, 50%)",        // Gold Secondary
  bond: "hsl(220, 20%, 30%)",       // Navy Slate
  mutual_fund: "hsl(150, 40%, 35%)", // Sage/Green Accent
};

const SYMBOLS_LIST = [
  { symbol: "AAPL", name: "Apple Inc.", type: "stock", price: 185.20 },
  { symbol: "MSFT", name: "Microsoft Corp.", type: "stock", price: 420.50 },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock", price: 175.80 },
  { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock", price: 182.10 },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", type: "etf", price: 510.30 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", type: "etf", price: 435.60 },
  { symbol: "BND", name: "Vanguard Total Bond Market ETF", type: "bond", price: 72.40 },
];

const getPremiumInvestmentName = (type: string) => {
  switch (type.toLowerCase()) {
    case "brokerage":
      return "Private Wealth Brokerage";
    case "ira_traditional":
      return "Traditional IRA Portfolio";
    case "ira_roth":
      return "Roth IRA Portfolio";
    default:
      return `${type.charAt(0).toUpperCase() + type.slice(1)} Portfolio`;
  }
};

export default function InvestmentsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InvestmentAccount | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tickerPrices, setTickerPrices] = useState(
    SYMBOLS_LIST.reduce((acc, curr) => ({ ...acc, [curr.symbol]: curr.price }), {} as Record<string, number>)
  );

  // Order Form State
  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");
  const [orderSymbol, setOrderSymbol] = useState("AAPL");
  const [orderQty, setOrderQty] = useState("");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [orderOpen, setOrderOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();

    // Setup simulated price drift interval (30s)
    const driftInterval = setInterval(() => {
      setTickerPrices((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((sym) => {
          const changePercent = (Math.random() - 0.5) * 0.008; // Max 0.4% change
          next[sym] = Number((next[sym] * (1 + changePercent)).toFixed(2));
        });
        return next;
      });
    }, 30000);

    return () => clearInterval(driftInterval);
  }, [user?.id]);

  useEffect(() => {
    if (selectedAccount) {
      fetchAccountData(selectedAccount.id);
    }
  }, [selectedAccount?.id, tickerPrices]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const { data: accountsData, error } = await (supabase as any)
        .from("investment_accounts")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;

      const items = (accountsData as InvestmentAccount[]) || [];
      setAccounts(items);
      if (items.length > 0) {
        setSelectedAccount(items[0]);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountData = async (accountId: string) => {
    try {
      // Get holdings
      const { data: hlds } = await (supabase as any)
        .from("investment_holdings")
        .select("*")
        .eq("account_id", accountId);

      // Map holdings to update current simulated price
      const holdingsWithPrices = ((hlds as Holding[]) || []).map((h) => {
        const current_price = tickerPrices[h.symbol] || h.current_price;
        return { ...h, current_price };
      });
      setHoldings(holdingsWithPrices);

      // Get orders
      const { data: ords } = await (supabase as any)
        .from("investment_orders")
        .select("*")
        .eq("account_id", accountId)
        .order("created_at", { ascending: false });
      
      setOrders((ords as Order[]) || []);
    } catch (e) {
      console.error(e);
    }
  };

  const openAccount = async (type: "brokerage" | "ira_traditional" | "ira_roth") => {
    if (!user) return;
    try {
      const acctNum = "INV-" + Math.floor(10000000 + Math.random() * 90000000).toString();
      const { error } = await (supabase as any)
        .from("investment_accounts")
        .insert({
          user_id: user.id,
          account_type: type,
          account_number: acctNum,
          balance: 0.00,
          cash_balance: 0.00,
          status: "active",
        });

      if (error) throw error;
      toast({ title: "Account Established", description: `Your ${getPremiumInvestmentName(type)} has been created.` });
      fetchData();
    } catch (e: any) {
      toast({ title: "Opening Failed", description: e.message, variant: "destructive" });
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAccount) return;
    const qty = parseFloat(orderQty);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Invalid Quantity", description: "Please enter a valid positive number.", variant: "destructive" });
      return;
    }

    const price = tickerPrices[orderSymbol];
    const estimatedCost = qty * price;

    if (orderSide === "buy" && selectedAccount.cash_balance < estimatedCost) {
      toast({ title: "Insufficient Available Cash", description: "Deposit funds or liquidate existing holdings to complete this transaction.", variant: "destructive" });
      return;
    }

    if (orderSide === "sell") {
      const holding = holdings.find((h) => h.symbol === orderSymbol);
      if (!holding || holding.quantity < qty) {
        toast({ title: "Insufficient Share Balance", description: "You do not own the requested quantity of this asset.", variant: "destructive" });
        return;
      }
    }

    try {
      const assetClassMap: Record<string, string> = {
        "AAPL": "stock", "MSFT": "stock", "TSLA": "stock", "GOOGL": "stock", "AMZN": "stock", "NVDA": "stock",
        "SPY": "etf", "QQQ": "etf", "VOO": "etf",
        "BND": "bond", "TLT": "bond",
        "BTC": "crypto", "ETH": "crypto"
      };
      
      const { data, error } = await (supabase.rpc as any)("process_trade", {
        p_user_id: user.id,
        p_account_id: selectedAccount.id,
        p_symbol: orderSymbol,
        p_asset_name: orderSymbol + " Equity",
        p_side: orderSide,
        p_quantity: qty,
        p_current_price: price,
        p_asset_class: assetClassMap[orderSymbol] || "stock"
      });

      if (error) throw error;
      toast({ title: "Order Executed", description: `Your ${orderSide.toUpperCase()} order for ${qty} shares of ${orderSymbol} was filled at $${price.toFixed(2)}.` });
      setOrderOpen(false);
      setOrderQty("");
      fetchAccountData(selectedAccount.id);
      fetchData(); // to update cash balance
    } catch (e: any) {
      toast({ title: "Order Submission Failed", description: e.message, variant: "destructive" });
    }
  };

  const [fundOpen, setFundOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [checkingAccounts, setCheckingAccounts] = useState<any[]>([]);
  const [selectedCheckingId, setSelectedCheckingId] = useState("");

  const handleOpenFundDialog = async () => {
    if (!user) return;
    const { data } = await supabase.from("accounts").select("*").eq("user_id", user.id).eq("status", "active");
    const accs = data || [];
    setCheckingAccounts(accs);
    if (accs.length > 0) setSelectedCheckingId(accs[0].id);
    setFundOpen(true);
  };

  const handleFundAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAccount || !selectedCheckingId) return;
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const { error } = await (supabase.rpc as any)("fund_brokerage_account", {
        p_user_id: user.id,
        p_checking_account_id: selectedCheckingId,
        p_brokerage_account_id: selectedAccount.id,
        p_amount: amount
      });
      if (error) throw error;
      toast({ title: "Funding Successful", description: `$${amount.toLocaleString()} transferred to Brokerage.` });
      setFundOpen(false);
      setFundAmount("");
      fetchData();
      fetchAccountData(selectedAccount.id);
    } catch (e: any) {
      toast({ title: "Funding Failed", description: e.message, variant: "destructive" });
    }
  };

  // Calculations for Summary Card
  const getHoldingsValue = () => {
    return holdings.reduce((sum, h) => sum + h.quantity * h.current_price, 0);
  };

  const holdingsVal = getHoldingsValue();
  const cashVal = selectedAccount ? Number(selectedAccount.cash_balance) : 0;
  const totalVal = holdingsVal + cashVal;

  const allocationData = Object.keys(ASSET_COLORS).map((key) => {
    const value = holdings
      .filter((h) => h.asset_class === key)
      .reduce((sum, h) => sum + h.quantity * h.current_price, 0);
    return {
      name: key.toUpperCase(),
      value: value || 0,
      color: ASSET_COLORS[key as keyof typeof ASSET_COLORS],
    };
  }).filter((d) => d.value > 0);

  // Add Cash to allocation if it has balance
  if (cashVal > 0) {
    allocationData.push({
      name: "LIQUID CASH",
      value: cashVal,
      color: "hsl(220, 10%, 70%)",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="font-sans">
          <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">Wealth Management & Portfolios</h1>
          <p className="text-sm text-muted-foreground">Manage your self-directed brokerage and retirement asset allocations</p>
        </div>

        {accounts.length > 0 && selectedAccount && (
          <div className="flex items-center gap-3 font-sans">
            <select
              className="rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold hover-lift"
              value={selectedAccount.id}
              onChange={(e) => {
                const found = accounts.find((a) => a.id === e.target.value);
                if (found) setSelectedAccount(found);
              }}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {getPremiumInvestmentName(a.account_type)} - •••• {a.account_number.slice(-4)}
                </option>
              ))}
            </select>

            <Dialog open={fundOpen} onOpenChange={setFundOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2 font-bold h-10 shadow-sm hover-lift" onClick={handleOpenFundDialog}>
                  <ArrowRightLeft className="h-4 w-4" /> Fund Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md font-sans">
                <DialogHeader>
                  <DialogTitle className="font-poppins font-bold">Fund Brokerage Account</DialogTitle>
                  <DialogDescription>Transfer available cash from your checking account.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleFundAccount} className="space-y-5 mt-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Source Account</label>
                    <select
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold"
                      value={selectedCheckingId}
                      onChange={(e) => setSelectedCheckingId(e.target.value)}
                    >
                      {checkingAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.account_type.toUpperCase()} - •••• {a.account_number.slice(-4)} (${Number(a.balance).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Transfer Amount (USD)</label>
                    <Input
                      type="number"
                      required
                      min={1}
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      placeholder="0.00"
                      className="font-mono font-bold text-lg"
                    />
                  </div>
                  <Button type="submit" className="w-full font-bold h-11 text-sm mt-2">
                    Execute Transfer
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="default" className="gap-2 font-bold h-10 shadow-sm hover-lift">
                  <BadgeDollarSign className="h-4 w-4" /> Place Trade Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md font-sans">
                <DialogHeader>
                  <DialogTitle className="font-poppins font-bold">Order Execution Ticket</DialogTitle>
                  <DialogDescription>Submit a trade request to the Netxplora execution desk.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePlaceOrder} className="space-y-5 mt-2">
                  <div className="flex rounded-lg border overflow-hidden shadow-sm">
                    <button
                      type="button"
                      className={`flex-1 py-2 text-sm font-bold transition-colors uppercase tracking-wider ${orderSide === "buy" ? "bg-primary text-foreground" : "bg-muted/40 text-foreground"}`}
                      onClick={() => setOrderSide("buy")}
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 text-sm font-bold transition-colors uppercase tracking-wider ${orderSide === "sell" ? "bg-primary text-foreground" : "bg-muted/40 text-foreground"}`}
                      onClick={() => setOrderSide("sell")}
                    >
                      Sell
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Select Security</label>
                    <select
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold"
                      value={orderSymbol}
                      onChange={(e) => setOrderSymbol(e.target.value)}
                    >
                      {SYMBOLS_LIST.map((sym) => (
                        <option key={sym.symbol} value={sym.symbol}>
                          {sym.symbol} - {sym.name} (${tickerPrices[sym.symbol] || sym.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Share Quantity</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        required
                        value={orderQty}
                        onChange={(e) => setOrderQty(e.target.value)}
                        className="font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Execution Type</label>
                      <select
                        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold"
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value as any)}
                      >
                        <option value="market">Market</option>
                        <option value="limit">Limit</option>
                      </select>
                    </div>
                  </div>

                  {orderType === "limit" && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Target Limit Price ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        required
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="font-mono font-bold"
                      />
                    </div>
                  )}

                  <div className="pt-3 border-t flex justify-between items-center bg-muted/10 p-3 rounded-lg">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estimated Total Cost</span>
                    <span className="font-mono font-bold text-foreground text-lg">
                      ${(Number(orderQty || 0) * (tickerPrices[orderSymbol] || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <Button type="submit" className="w-full font-bold h-11 text-sm">
                    Submit Order for Execution
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <FadeIn>
        <div className="bg-card rounded-xl border p-12 text-center max-w-lg mx-auto shadow-lg hover-lift font-sans">
          <TrendingUp className="h-12 w-12 text-primary/40 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-poppins mb-2 text-foreground">Establish Your Investment Portfolio</h2>
          <p className="text-sm font-medium text-muted-foreground mb-8">
            Open an institutional-grade self-directed brokerage account or a tax-advantaged retirement IRA portfolio to manage your assets.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => openAccount("brokerage")} className="font-bold h-11">Open Private Wealth Brokerage Account</Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => openAccount("ira_traditional")} className="font-bold h-11">Traditional IRA</Button>
              <Button variant="outline" onClick={() => openAccount("ira_roth")} className="font-bold h-11">Roth IRA</Button>
            </div>
          </div>
        </div>
        </FadeIn>
      ) : (
        <div className="space-y-6">
          {/* Portfolio Summary Widgets */}
          <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
            
            {/* Balance Card */}
            <StaggerItem>
            <div className="bg-card rounded-xl border p-6 flex flex-col justify-between shadow-sm hover-lift h-full">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Combined Portfolio Value</p>
                <h2 className="text-4xl font-mono font-bold text-foreground tracking-tight pt-1">
                  ${totalVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </h2>
                <div className="flex items-center gap-1.5 text-[11px] text-success font-bold pt-2 uppercase tracking-wider">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>+$124.50 Today (+0.85%)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-6">
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Liquid Cash Balance</p>
                  <p className="text-lg font-mono font-bold text-foreground mt-0.5">
                    ${cashVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Market Asset Value</p>
                  <p className="text-lg font-mono font-bold text-foreground mt-0.5">
                    ${holdingsVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
            </StaggerItem>

            {/* Allocation Donut Chart */}
            <StaggerItem>
            <div className="bg-card rounded-xl border p-6 flex flex-col shadow-sm hover-lift h-full">
              <h3 className="text-sm font-bold font-poppins text-foreground mb-4">Portfolio Allocation</h3>
              {allocationData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  No active holdings owned yet
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 flex-1">
                  <div className="h-32 w-32 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          innerRadius={35}
                          outerRadius={55}
                          dataKey="value"
                          paddingAngle={2}
                          stroke="transparent"
                        >
                          {allocationData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Asset Value"]} contentStyle={{ borderRadius: "8px", fontWeight: "bold", fontSize: "12px", border: "1px solid var(--border)", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 text-xs flex-1">
                    {allocationData.map((d) => (
                      <div key={d.name} className="flex justify-between items-center">
                        <span className="flex items-center gap-2 font-bold text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {((d.value / totalVal) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </StaggerItem>

            {/* Ticker Strip */}
            <StaggerItem>
            <div className="bg-card rounded-xl border p-6 flex flex-col shadow-sm hover-lift h-full">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <span className="text-sm font-bold font-poppins text-foreground">Market Security Ticker</span>
                <span className="text-[9px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">
                  Indicative Real-Time
                </span>
              </div>
              
              <div className="space-y-3 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                {SYMBOLS_LIST.map((s) => {
                  const currentPrice = tickerPrices[s.symbol] || s.price;
                  return (
                    <div key={s.symbol} className="flex justify-between text-xs items-center group">
                      <div className="leading-tight">
                        <span className="font-mono font-bold text-foreground">{s.symbol}</span>
                        <p className="text-[10px] font-semibold text-muted-foreground truncate max-w-[120px]">{s.name}</p>
                      </div>
                      <span className="font-mono font-bold text-foreground bg-muted/30 px-2 py-1 rounded transition-colors group-hover:bg-muted/60">${currentPrice.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            </StaggerItem>

          </StaggerContainer>

          {/* Holdings Grid */}
          <SlideUp>
          <div className="bg-card rounded-xl border overflow-hidden shadow-sm font-sans">
            <div className="p-5 border-b bg-muted/10"><h3 className="font-bold font-poppins text-foreground">Securities & Asset Positions</h3></div>
            {holdings.length === 0 ? (
              <div className="p-8 text-center text-sm font-semibold text-muted-foreground flex flex-col items-center gap-2">
                <span className="block text-3xl mb-2">📊</span>
                Your investment portfolio will appear here once investments are created.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/40 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Symbol</th>
                      <th className="p-4">Asset Description</th>
                      <th className="p-4 text-right">Shares Owned</th>
                      <th className="p-4 text-right">Average Acquisition Cost</th>
                      <th className="p-4 text-right">Current Market Price</th>
                      <th className="p-4 text-right">Aggregate Position Value</th>
                      <th className="p-4 text-right">Unrealized Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {holdings.map((h) => {
                      const totalValue = h.quantity * h.current_price;
                      const gainDollars = (h.current_price - h.avg_cost) * h.quantity;
                      const gainPercent = h.avg_cost > 0 ? ((h.current_price - h.avg_cost) / h.avg_cost) * 100 : 0;
                      const isGain = gainDollars >= 0;

                      return (
                        <tr key={h.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4 font-bold text-foreground font-mono">{h.symbol}</td>
                          <td className="p-4 text-muted-foreground font-semibold text-xs">{h.name}</td>
                          <td className="p-4 text-right font-bold font-mono">{Number(h.quantity).toFixed(2)}</td>
                          <td className="p-4 text-right font-mono font-medium">${Number(h.avg_cost).toFixed(2)}</td>
                          <td className="p-4 text-right font-mono font-bold">${Number(h.current_price).toFixed(2)}</td>
                          <td className="p-4 text-right font-bold text-foreground font-mono">
                            ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`p-4 text-right font-bold font-mono ${isGain ? "text-success" : "text-destructive"}`}>
                            {isGain ? "+" : ""}${gainDollars.toFixed(2)} ({isGain ? "+" : ""}{gainPercent.toFixed(2)}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </SlideUp>

          {/* Orders History Grid */}
          <SlideUp>
          <div className="bg-card rounded-xl border overflow-hidden shadow-sm font-sans">
            <div className="p-5 border-b bg-muted/10 flex justify-between items-center">
              <h3 className="font-bold font-poppins text-foreground">Order Ticket Ledger</h3>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-background border px-3 py-1.5 rounded-sm">
                <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                <span>Orders remain pending until filled by the clearing desk.</span>
              </div>
            </div>
            {orders.length === 0 ? (
              <div className="p-8 text-center text-sm font-semibold text-muted-foreground flex flex-col items-center gap-2">
                <span className="block text-3xl mb-2">📋</span>
                Your transaction history will appear here once activity begins.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/40 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Date Logged</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Symbol</th>
                      <th className="p-4 text-right">Shares Requested</th>
                      <th className="p-4">Type</th>
                      <th className="p-4 text-right">Limit Price</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-muted-foreground text-sm">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4 text-[11px] font-mono font-semibold">
                          {new Date(o.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).toUpperCase()}
                        </td>
                        <td className="p-4">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${o.side === "buy" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            {o.side}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-foreground font-mono">{o.symbol}</td>
                        <td className="p-4 text-right font-bold text-foreground font-mono">{Number(o.quantity).toFixed(2)}</td>
                        <td className="p-4 font-semibold text-xs uppercase tracking-wider">{o.order_type} execution</td>
                        <td className="p-4 text-right font-mono font-medium">
                          {o.limit_price ? `$${Number(o.limit_price).toFixed(2)}` : "—"}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-sm ${o.status === "filled" ? "bg-success/10 text-success" : o.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </SlideUp>

        </div>
      )}
    </div>
  );
}
