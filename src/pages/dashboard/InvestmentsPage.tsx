import { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis } from "recharts";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldAlert,
  BadgeDollarSign,
  ArrowRightLeft,
  Search,
  SlidersHorizontal,
  BarChart2,
  Info,
  ChevronRight,
  Sparkles,
  PieChart as PieChartIcon,
  ShoppingBag,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";

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

interface StockMeta {
  symbol: string;
  name: string;
  category: "tech" | "index" | "growth" | "dividend" | "finance";
  asset_class: string;
  current_price: number;
  change_24h: number;
  change_percent_24h: number;
  market_cap: string;
  pe_ratio: string;
  dividend_yield: string;
  high_52w: number;
  low_52w: number;
  volume: string;
  analyst_rating: "Strong Buy" | "Buy" | "Hold";
  description: string;
  chart_data: { day: string; price: number }[];
}

const EXTENDED_STOCKS: StockMeta[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    category: "tech",
    asset_class: "stock",
    current_price: 224.50,
    change_24h: 3.20,
    change_percent_24h: 1.45,
    market_cap: "$3.42 Trillion",
    pe_ratio: "33.8",
    dividend_yield: "0.44%",
    high_52w: 237.23,
    low_52w: 164.08,
    volume: "48.2M",
    analyst_rating: "Strong Buy",
    description: "Global technology leader in consumer electronics, software, and services including iPhone, Mac, and iCloud ecosystems.",
    chart_data: [
      { day: "Mon", price: 218.10 },
      { day: "Tue", price: 220.40 },
      { day: "Wed", price: 219.80 },
      { day: "Thu", price: 222.10 },
      { day: "Fri", price: 221.90 },
      { day: "Sat", price: 223.40 },
      { day: "Sun", price: 224.50 },
    ],
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    category: "tech",
    asset_class: "stock",
    current_price: 128.80,
    change_24h: 4.15,
    change_percent_24h: 3.33,
    market_cap: "$3.16 Trillion",
    pe_ratio: "68.4",
    dividend_yield: "0.03%",
    high_52w: 140.76,
    low_52w: 39.23,
    volume: "82.4M",
    analyst_rating: "Strong Buy",
    description: "Pioneer in GPU design, accelerated computing architectures, data center chips, and artificial intelligence hardware.",
    chart_data: [
      { day: "Mon", price: 121.50 },
      { day: "Tue", price: 123.80 },
      { day: "Wed", price: 122.90 },
      { day: "Thu", price: 125.60 },
      { day: "Fri", price: 127.10 },
      { day: "Sat", price: 126.80 },
      { day: "Sun", price: 128.80 },
    ],
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    category: "tech",
    asset_class: "stock",
    current_price: 448.90,
    change_24h: 2.75,
    change_percent_24h: 0.62,
    market_cap: "$3.33 Trillion",
    pe_ratio: "36.2",
    dividend_yield: "0.67%",
    high_52w: 468.35,
    low_52w: 309.45,
    volume: "22.1M",
    analyst_rating: "Strong Buy",
    description: "Enterprise software giant specializing in Azure cloud platform, Windows OS, Productivity Software, and OpenAI partnership.",
    chart_data: [
      { day: "Mon", price: 442.10 },
      { day: "Tue", price: 444.50 },
      { day: "Wed", price: 443.20 },
      { day: "Thu", price: 446.80 },
      { day: "Fri", price: 447.40 },
      { day: "Sat", price: 448.10 },
      { day: "Sun", price: 448.90 },
    ],
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    category: "growth",
    asset_class: "stock",
    current_price: 186.30,
    change_24h: -1.20,
    change_percent_24h: -0.64,
    market_cap: "$1.94 Trillion",
    pe_ratio: "44.1",
    dividend_yield: "N/A",
    high_52w: 201.20,
    low_52w: 118.35,
    volume: "35.6M",
    analyst_rating: "Buy",
    description: "Leading e-commerce retailer and cloud infrastructure provider through Amazon Web Services (AWS).",
    chart_data: [
      { day: "Mon", price: 189.50 },
      { day: "Tue", price: 188.20 },
      { day: "Wed", price: 187.90 },
      { day: "Thu", price: 186.50 },
      { day: "Fri", price: 187.10 },
      { day: "Sat", price: 186.80 },
      { day: "Sun", price: 186.30 },
    ],
  },
  {
    symbol: "VOO",
    name: "Vanguard S&P 500 ETF",
    category: "index",
    asset_class: "etf",
    current_price: 512.40,
    change_24h: 3.10,
    change_percent_24h: 0.61,
    market_cap: "$1.12 Trillion",
    pe_ratio: "26.4",
    dividend_yield: "1.32%",
    high_52w: 518.90,
    low_52w: 395.20,
    volume: "4.5M",
    analyst_rating: "Strong Buy",
    description: "Low-cost index fund designed to track the performance of the 500 largest US publicly traded companies.",
    chart_data: [
      { day: "Mon", price: 506.20 },
      { day: "Tue", price: 508.40 },
      { day: "Wed", price: 507.90 },
      { day: "Thu", price: 510.10 },
      { day: "Fri", price: 511.30 },
      { day: "Sat", price: 511.90 },
      { day: "Sun", price: 512.40 },
    ],
  },
  {
    symbol: "QQQ",
    name: "Invesco QQQ Trust (Nasdaq-100)",
    category: "index",
    asset_class: "etf",
    current_price: 482.10,
    change_24h: 4.80,
    change_percent_24h: 1.01,
    market_cap: "$285 Billion",
    pe_ratio: "31.5",
    dividend_yield: "0.58%",
    high_52w: 503.52,
    low_52w: 352.10,
    volume: "31.2M",
    analyst_rating: "Buy",
    description: "Exchange-traded fund tracking the 100 largest non-financial companies listed on the Nasdaq stock exchange.",
    chart_data: [
      { day: "Mon", price: 472.50 },
      { day: "Tue", price: 476.10 },
      { day: "Wed", price: 475.20 },
      { day: "Thu", price: 479.40 },
      { day: "Fri", price: 480.90 },
      { day: "Sat", price: 481.50 },
      { day: "Sun", price: 482.10 },
    ],
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase & Co.",
    category: "finance",
    asset_class: "stock",
    current_price: 212.75,
    change_24h: 1.85,
    change_percent_24h: 0.88,
    market_cap: "$608 Billion",
    pe_ratio: "12.4",
    dividend_yield: "2.16%",
    high_52w: 218.05,
    low_52w: 135.20,
    volume: "8.9M",
    analyst_rating: "Buy",
    description: "Largest American banking institution providing commercial banking, investment banking, and asset management.",
    chart_data: [
      { day: "Mon", price: 208.90 },
      { day: "Tue", price: 210.20 },
      { day: "Wed", price: 209.80 },
      { day: "Thu", price: 211.50 },
      { day: "Fri", price: 212.10 },
      { day: "Sat", price: 212.30 },
      { day: "Sun", price: 212.75 },
    ],
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc. (Class A)",
    category: "tech",
    asset_class: "stock",
    current_price: 178.60,
    change_24h: 1.10,
    change_percent_24h: 0.62,
    market_cap: "$2.21 Trillion",
    pe_ratio: "25.7",
    dividend_yield: "0.45%",
    high_52w: 191.75,
    low_52w: 120.21,
    volume: "19.4M",
    analyst_rating: "Strong Buy",
    description: "Parent company of Google Search, YouTube, Android, Google Cloud, and DeepMind AI research labs.",
    chart_data: [
      { day: "Mon", price: 174.20 },
      { day: "Tue", price: 176.10 },
      { day: "Wed", price: 175.80 },
      { day: "Thu", price: 177.30 },
      { day: "Fri", price: 177.90 },
      { day: "Sat", price: 178.20 },
      { day: "Sun", price: 178.60 },
    ],
  },
];

const ASSET_COLORS = {
  stock: "hsl(350, 65%, 38%)",
  etf: "hsl(40, 60%, 50%)",
  bond: "hsl(220, 20%, 30%)",
  mutual_fund: "hsl(150, 40%, 35%)",
};

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

  // Active view tab: "explore" vs "portfolio"
  const [activeTab, setActiveTab] = useState<"explore" | "portfolio">("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "gainers" | "symbol">("default");
  const [allStocksList, setAllStocksList] = useState<StockMeta[]>(EXTENDED_STOCKS);

  // Order Ticket State
  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");
  const [orderSymbol, setOrderSymbol] = useState("AAPL");
  const [orderQty, setOrderQty] = useState("");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [orderOpen, setOrderOpen] = useState(false);

  // Stock Analytics Detail State
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockMeta | null>(null);

  // Funding State
  const [fundOpen, setFundOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [checkingAccounts, setCheckingAccounts] = useState<any[]>([]);
  const [selectedCheckingId, setSelectedCheckingId] = useState("");

  // Prices State
  const [tickerPrices, setTickerPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    fetchData();
    fetchDbAvailableStocks();

    // Map initial prices
    const initPrices: Record<string, number> = {};
    EXTENDED_STOCKS.forEach((s) => {
      initPrices[s.symbol] = s.current_price;
    });
    setTickerPrices(initPrices);

    // Price drift interval
    const driftInterval = setInterval(() => {
      setTickerPrices((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((sym) => {
          const changePercent = (Math.random() - 0.48) * 0.006;
          next[sym] = Number((next[sym] * (1 + changePercent)).toFixed(2));
        });
        return next;
      });
    }, 20000);

    return () => clearInterval(driftInterval);
  }, [user?.id]);

  const fetchDbAvailableStocks = async () => {
    try {
      const { data } = await (supabase as any)
        .from("available_stocks")
        .select("*")
        .eq("is_active", true);

      if (data && data.length > 0) {
        const dbItems: StockMeta[] = data.map((d: any) => {
          const existing = EXTENDED_STOCKS.find((s) => s.symbol === d.symbol);
          if (existing) return existing;
          const currentPrice = Number(d.current_price || 100);
          return {
            symbol: d.symbol,
            name: d.name,
            category: (d.asset_class === "etf" ? "index" : "growth") as any,
            asset_class: d.asset_class || "stock",
            current_price: currentPrice,
            change_24h: 1.25,
            change_percent_24h: 0.85,
            market_cap: "$500 Billion",
            pe_ratio: "25.0",
            dividend_yield: "1.2%",
            high_52w: currentPrice * 1.15,
            low_52w: currentPrice * 0.85,
            volume: "12.5M",
            analyst_rating: "Buy",
            description: `${d.name} listed equity asset available for self-directed portfolio trading.`,
            chart_data: [
              { day: "Mon", price: currentPrice * 0.97 },
              { day: "Tue", price: currentPrice * 0.98 },
              { day: "Wed", price: currentPrice * 0.975 },
              { day: "Thu", price: currentPrice * 0.99 },
              { day: "Fri", price: currentPrice * 0.995 },
              { day: "Sat", price: currentPrice * 0.998 },
              { day: "Sun", price: currentPrice },
            ],
          };
        });

        // Merge DB stocks with static extended list (avoiding duplicate symbols)
        const combinedMap = new Map<string, StockMeta>();
        EXTENDED_STOCKS.forEach((s) => combinedMap.set(s.symbol, s));
        dbItems.forEach((s) => combinedMap.set(s.symbol, s));
        setAllStocksList(Array.from(combinedMap.values()));
      }
    } catch (e) {
      console.error("DB stocks sync notice:", e);
    }
  };

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
      const { data: hlds } = await (supabase as any)
        .from("investment_holdings")
        .select("*")
        .eq("account_id", accountId);

      const holdingsWithPrices = ((hlds as Holding[]) || []).map((h) => {
        const current_price = tickerPrices[h.symbol] || h.current_price;
        return { ...h, current_price };
      });
      setHoldings(holdingsWithPrices);

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
      const { error } = await (supabase as any).from("investment_accounts").insert({
        user_id: user.id,
        account_type: type,
        account_number: acctNum,
        balance: 0.0,
        cash_balance: 0.0,
        status: "active",
      });

      if (error) throw error;
      toast({ title: "Account Created", description: `${getPremiumInvestmentName(type)} established.` });
      fetchData();
    } catch (e: any) {
      toast({ title: "Opening Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleOpenTradeModal = (symbol: string, side: "buy" | "sell" = "buy") => {
    setOrderSide(side);
    setOrderSymbol(symbol);
    setOrderQty("");
    setOrderOpen(true);
  };

  const openStockDetail = (stock: StockMeta) => {
    setSelectedStock(stock);
    setDetailOpen(true);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAccount) return;
    const qty = parseFloat(orderQty);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Invalid Quantity", description: "Please enter a valid number of shares.", variant: "destructive" });
      return;
    }

    const price = tickerPrices[orderSymbol] || EXTENDED_STOCKS.find((s) => s.symbol === orderSymbol)?.current_price || 100;
    const estimatedCost = qty * price;

    if (orderSide === "buy" && selectedAccount.cash_balance < estimatedCost) {
      toast({ title: "Insufficient Cash", description: "Fund your account to execute this purchase.", variant: "destructive" });
      return;
    }

    if (orderSide === "sell") {
      const holding = holdings.find((h) => h.symbol === orderSymbol);
      if (!holding || holding.quantity < qty) {
        toast({ title: "Insufficient Shares", description: "You do not own enough shares of this stock.", variant: "destructive" });
        return;
      }
    }

    try {
      const stockObj = EXTENDED_STOCKS.find((s) => s.symbol === orderSymbol);
      const { error } = await (supabase.rpc as any)("process_trade", {
        p_user_id: user.id,
        p_account_id: selectedAccount.id,
        p_symbol: orderSymbol,
        p_asset_name: stockObj?.name || orderSymbol + " Equity",
        p_side: orderSide,
        p_quantity: qty,
        p_current_price: price,
        p_asset_class: stockObj?.asset_class || "stock",
      });

      if (error) throw error;
      toast({ title: "Order Filled", description: `${orderSide.toUpperCase()} ${qty} shares of ${orderSymbol} at $${price.toFixed(2)}.` });
      setOrderOpen(false);
      setDetailOpen(false);
      setOrderQty("");
      fetchAccountData(selectedAccount.id);
      fetchData();
    } catch (e: any) {
      toast({ title: "Order Execution Error", description: e.message, variant: "destructive" });
    }
  };

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
        p_amount: amount,
      });
      if (error) throw error;
      toast({ title: "Funding Completed", description: `$${amount.toLocaleString()} added to your cash balance.` });
      setFundOpen(false);
      setFundAmount("");
      fetchData();
      if (selectedAccount) fetchAccountData(selectedAccount.id);
    } catch (e: any) {
      toast({ title: "Funding Error", description: e.message, variant: "destructive" });
    }
  };

  // Portfolio calculations
  const holdingsVal = holdings.reduce((sum, h) => sum + h.quantity * h.current_price, 0);
  const cashVal = selectedAccount ? Number(selectedAccount.cash_balance) : 0;
  const totalVal = holdingsVal + cashVal;

  // Multi-field search & category filtering logic
  let filteredStocks = allStocksList.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.asset_class.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q);

    const matchesCat =
      categoryFilter === "all"
        ? true
        : categoryFilter === "etf"
        ? s.asset_class === "etf"
        : s.category === categoryFilter;

    return matchesSearch && matchesCat;
  });

  // Sorting logic
  if (sortBy === "price_asc") {
    filteredStocks = [...filteredStocks].sort((a, b) => (tickerPrices[a.symbol] || a.current_price) - (tickerPrices[b.symbol] || b.current_price));
  } else if (sortBy === "price_desc") {
    filteredStocks = [...filteredStocks].sort((a, b) => (tickerPrices[b.symbol] || b.current_price) - (tickerPrices[a.symbol] || a.current_price));
  } else if (sortBy === "gainers") {
    filteredStocks = [...filteredStocks].sort((a, b) => b.change_percent_24h - a.change_percent_24h);
  } else if (sortBy === "symbol") {
    filteredStocks = [...filteredStocks].sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  const allocationData = Object.keys(ASSET_COLORS)
    .map((key) => {
      const value = holdings
        .filter((h) => h.asset_class === key)
        .reduce((sum, h) => sum + h.quantity * h.current_price, 0);
      return {
        name: key.toUpperCase(),
        value: value || 0,
        color: ASSET_COLORS[key as keyof typeof ASSET_COLORS],
      };
    })
    .filter((d) => d.value > 0);

  if (cashVal > 0) {
    allocationData.push({
      name: "LIQUID CASH",
      value: cashVal,
      color: "hsl(220, 10%, 70%)",
    });
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card border border-border/60 p-3.5 sm:p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground flex items-center gap-2 mb-0.5">
            <TrendingUp className="h-5 w-5 text-primary" /> Wealth & Stock Management
          </h1>
          <p className="text-xs text-muted-foreground">Self-directed stock trading and portfolio growth platform</p>
        </div>

        {accounts.length > 0 && selectedAccount && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <select
              className="rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs font-semibold h-8"
              value={selectedAccount.id}
              onChange={(e) => {
                const found = accounts.find((a) => a.id === e.target.value);
                if (found) setSelectedAccount(found);
              }}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {getPremiumInvestmentName(a.account_type)} (•••• {a.account_number.slice(-4)})
                </option>
              ))}
            </select>

            <Button size="sm" variant="outline" className="gap-1 font-bold h-8 text-xs rounded-lg" onClick={handleOpenFundDialog}>
              <ArrowRightLeft className="h-3.5 w-3.5" /> Deposit Cash
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-7 w-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <FadeIn>
          <div className="bg-card rounded-xl border border-border/60 p-6 text-center max-w-md mx-auto shadow-sm font-sans">
            <Building2 className="h-10 w-10 text-primary/40 mx-auto mb-3" />
            <h2 className="text-base font-bold font-poppins mb-1 text-foreground">Activate Investment Account</h2>
            <p className="text-xs font-medium text-muted-foreground mb-5 leading-relaxed">
              Open a brokerage account to trade equities, ETFs, and index funds.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => openAccount("brokerage")} className="font-bold h-8 text-xs rounded-lg">Open Self-Directed Brokerage</Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => openAccount("ira_traditional")} className="font-bold h-8 text-xs rounded-lg">Traditional IRA</Button>
                <Button variant="outline" onClick={() => openAccount("ira_roth")} className="font-bold h-8 text-xs rounded-lg">Roth IRA</Button>
              </div>
            </div>
          </div>
        </FadeIn>
      ) : (
        <div className="space-y-4">
          {/* Main Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("explore")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "explore"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                <Search className="h-3.5 w-3.5" /> Market Explorer & Buy Stocks
              </button>
              <button
                onClick={() => setActiveTab("portfolio")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "portfolio"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                <PieChartIcon className="h-3.5 w-3.5" /> My Portfolio & Orders ({holdings.length})
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-bold">
              <span className="text-muted-foreground">Cash Balance:</span>
              <span className="text-foreground">${cashVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* ════════════ TABS: MARKET EXPLORER ════════════ */}
          {activeTab === "explore" && (
            <div className="space-y-3">
              {/* Search & Filter Bar */}
              <div className="flex flex-col md:flex-row gap-2.5 justify-between items-stretch md:items-center bg-card border border-border/60 p-3 rounded-xl shadow-xs">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search stocks by name, symbol, or asset class (e.g. AAPL, NVDA, VOO)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-8 h-8 text-xs rounded-lg border-border/60"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Category Filter Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                    {[
                      { key: "all", label: "All Securities" },
                      { key: "tech", label: "Tech" },
                      { key: "index", label: "Index ETFs" },
                      { key: "growth", label: "Growth" },
                      { key: "finance", label: "Financials" },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => setCategoryFilter(cat.key)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all whitespace-nowrap border ${
                          categoryFilter === cat.key
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-background text-muted-foreground border-border/60 hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Sort By Dropdown */}
                  <select
                    className="h-8 text-[10px] font-bold rounded-md border border-border/60 bg-background px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="default">Sort: Default</option>
                    <option value="gainers">Sort: Top Gainers</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="symbol">Sort: Ticker A-Z</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Indicator / Result Count */}
              <div className="flex justify-between items-center text-[10px] text-muted-foreground px-1">
                <span className="font-semibold">
                  Showing <strong className="text-foreground">{filteredStocks.length}</strong> matching {filteredStocks.length === 1 ? "security" : "securities"}
                </span>
                {(searchQuery || categoryFilter !== "all" || sortBy !== "default") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("all");
                      setSortBy("default");
                    }}
                    className="text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Empty Search Results */}
              {filteredStocks.length === 0 ? (
                <div className="bg-card rounded-xl border border-border/60 p-8 text-center shadow-xs font-sans">
                  <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <h3 className="text-sm font-bold font-poppins text-foreground mb-1">No Securities Found</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    No stocks or ETFs matched "{searchQuery}". Try searching with a different ticker or clearing filters.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold rounded-lg"
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("all");
                      setSortBy("default");
                    }}
                  >
                    Clear Search & Filters
                  </Button>
                </div>
              ) : (
                /* Stocks Grid */
                <StaggerContainer className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  {filteredStocks.map((stock) => {
                    const currentPrice = tickerPrices[stock.symbol] || stock.current_price;
                    const isPositive = stock.change_24h >= 0;

                    return (
                      <StaggerItem key={stock.symbol}>
                        <div className="bg-card rounded-xl border border-border/60 p-2 sm:p-3.5 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between h-full group">
                          <div>
                            {/* Stock Header */}
                            <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                              <div>
                                <div className="flex items-center gap-1 sm:gap-1.5">
                                  <span className="font-mono font-bold text-xs sm:text-sm text-foreground">{stock.symbol}</span>
                                  <span className="text-[8px] sm:text-[9px] font-bold uppercase px-1 py-0 rounded bg-muted/60 text-muted-foreground">
                                    {stock.asset_class}
                                  </span>
                                </div>
                                <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground truncate max-w-[80px] sm:max-w-[150px]">{stock.name}</p>
                              </div>
                              <span className={`text-[8px] sm:text-[10px] font-bold font-mono px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-md ${stock.analyst_rating === "Strong Buy" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>
                                {stock.analyst_rating}
                              </span>
                            </div>

                            {/* Price & Change */}
                            <div className="flex items-baseline justify-between mb-2 sm:mb-3">
                              <span className="text-xs sm:text-base font-mono font-bold text-foreground">
                                ${currentPrice.toFixed(2)}
                              </span>
                              <span className={`text-[9px] sm:text-[10px] font-mono font-bold flex items-center ${isPositive ? "text-success" : "text-destructive"}`}>
                                {isPositive ? "+" : ""}{stock.change_percent_24h}%
                              </span>
                            </div>

                            {/* Mini Sparkline Chart */}
                            <div className="h-7 sm:h-10 w-full mb-2 sm:mb-3 bg-muted/10 rounded-md p-0.5 sm:p-1 border border-border/30">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stock.chart_data}>
                                  <defs>
                                    <linearGradient id={`grad-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={isPositive ? "hsl(150, 60%, 40%)" : "hsl(350, 65%, 45%)"} stopOpacity={0.4} />
                                      <stop offset="95%" stopColor={isPositive ? "hsl(150, 60%, 40%)" : "hsl(350, 65%, 45%)"} stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <Area
                                    type="monotone"
                                    dataKey="price"
                                    stroke={isPositive ? "hsl(150, 60%, 40%)" : "hsl(350, 65%, 45%)"}
                                    strokeWidth={1.5}
                                    fillOpacity={1}
                                    fill={`url(#grad-${stock.symbol})`}
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Metrics summary */}
                            <div className="grid grid-cols-2 gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] border-t border-border/40 pt-1.5 sm:pt-2 mb-2 sm:mb-3">
                              <div>
                                <span className="text-muted-foreground block text-[7.5px] sm:text-[9px]">Market Cap</span>
                                <span className="font-mono font-semibold text-foreground truncate block">{stock.market_cap}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[7.5px] sm:text-[9px]">P/E Ratio</span>
                                <span className="font-mono font-semibold text-foreground truncate block">{stock.pe_ratio}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-1 sm:gap-1.5 border-t border-border/40 pt-2 sm:pt-2.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6.5 sm:h-7 text-[9px] sm:text-[10px] font-bold rounded-lg px-1 sm:px-3"
                              onClick={() => openStockDetail(stock)}
                            >
                              <Info className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" /> <span className="hidden sm:inline">Analytics</span><span className="sm:hidden">Info</span>
                            </Button>
                            <Button
                              size="sm"
                              className="h-6.5 sm:h-7 text-[9px] sm:text-[10px] font-bold rounded-lg bg-primary px-1 sm:px-3"
                              onClick={() => handleOpenTradeModal(stock.symbol, "buy")}
                            >
                              <ShoppingBag className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" /> Buy
                            </Button>
                          </div>
                        </div>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              )}
            </div>
          )}

          {/* ════════════ TABS: MY PORTFOLIO & ORDERS ════════════ */}
          {activeTab === "portfolio" && (
            <div className="space-y-4">
              {/* Portfolio Summary Widgets */}
              <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Balance Card */}
                <StaggerItem>
                  <div className="bg-card rounded-xl border border-border/60 p-3.5 flex flex-col justify-between shadow-sm h-full">
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total Portfolio Value</p>
                      <h2 className="text-2xl font-mono font-bold text-foreground tracking-tight pt-0.5">
                        ${totalVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </h2>
                      <div className="flex items-center gap-1 text-[10px] text-success font-bold pt-1 uppercase tracking-wider">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>+$124.50 Today (+0.85%)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-2.5 mt-3">
                      <div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Liquid Cash</p>
                        <p className="text-xs font-mono font-bold text-foreground mt-0.5">
                          ${cashVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Invested Assets</p>
                        <p className="text-xs font-mono font-bold text-foreground mt-0.5">
                          ${holdingsVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </StaggerItem>

                {/* Allocation Chart */}
                <StaggerItem>
                  <div className="bg-card rounded-xl border border-border/60 p-3.5 flex flex-col shadow-sm h-full">
                    <h3 className="text-xs font-bold font-poppins text-foreground mb-2">Asset Allocation</h3>
                    {allocationData.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                        No active positions owned yet
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 flex-1">
                        <div className="h-24 w-24 shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={allocationData} innerRadius={24} outerRadius={42} dataKey="value" paddingAngle={2} stroke="transparent">
                                {allocationData.map((d) => (
                                  <Cell key={d.name} fill={d.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Value"]} contentStyle={{ borderRadius: "6px", fontSize: "10px", padding: "4px 8px" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-1 text-[10px] flex-1">
                          {allocationData.map((d) => (
                            <div key={d.name} className="flex justify-between items-center">
                              <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                                <span className="h-2 w-2 rounded-xs shrink-0" style={{ backgroundColor: d.color }} />
                                {d.name}
                              </span>
                              <span className="font-mono font-bold text-foreground">{((d.value / totalVal) * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </StaggerItem>

                {/* Quick Trade Box */}
                <StaggerItem>
                  <div className="bg-card rounded-xl border border-border/60 p-3.5 flex flex-col justify-between shadow-sm h-full">
                    <div>
                      <h3 className="text-xs font-bold font-poppins text-foreground mb-1">Trading Desk</h3>
                      <p className="text-[10px] text-muted-foreground mb-3">Execute market and limit orders instantly</p>
                    </div>

                    <div className="space-y-2">
                      <Button size="sm" className="w-full h-8 text-xs font-bold rounded-lg gap-1.5" onClick={() => handleOpenTradeModal("AAPL", "buy")}>
                        <BadgeDollarSign className="h-3.5 w-3.5" /> Trade Equities & ETFs
                      </Button>
                      <Button size="sm" variant="outline" className="w-full h-8 text-xs font-bold rounded-lg gap-1.5" onClick={() => setActiveTab("explore")}>
                        <Search className="h-3.5 w-3.5" /> Explore Full Market List
                      </Button>
                    </div>
                  </div>
                </StaggerItem>
              </StaggerContainer>

              {/* Holdings Table */}
              <SlideUp>
                <div className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm font-sans">
                  <div className="p-3 border-b border-border/60 bg-muted/10 flex justify-between items-center">
                    <h3 className="font-bold font-poppins text-foreground text-xs">Securities & Active Positions</h3>
                    <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                      {holdings.length} Active Positions
                    </span>
                  </div>
                  {holdings.length === 0 ? (
                    <div className="p-6 text-center text-xs font-semibold text-muted-foreground">
                      No active holdings. Go to Market Explorer to purchase stocks.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/40 border-b border-border/60 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                          <tr>
                            <th className="p-2.5">Symbol</th>
                            <th className="p-2.5">Asset Description</th>
                            <th className="p-2.5 text-right">Shares</th>
                            <th className="p-2.5 text-right">Avg Price</th>
                            <th className="p-2.5 text-right">Market Price</th>
                            <th className="p-2.5 text-right">Total Value</th>
                            <th className="p-2.5 text-right">Unrealized P/L</th>
                            <th className="p-2.5 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 text-xs">
                          {holdings.map((h) => {
                            const totalValue = h.quantity * h.current_price;
                            const gainDollars = (h.current_price - h.avg_cost) * h.quantity;
                            const gainPercent = h.avg_cost > 0 ? ((h.current_price - h.avg_cost) / h.avg_cost) * 100 : 0;
                            const isGain = gainDollars >= 0;

                            return (
                              <tr key={h.id} className="hover:bg-muted/10 transition-colors">
                                <td className="p-2.5 font-bold text-foreground font-mono">{h.symbol}</td>
                                <td className="p-2.5 text-muted-foreground font-semibold text-[10px]">{h.name}</td>
                                <td className="p-2.5 text-right font-bold font-mono">{Number(h.quantity).toFixed(2)}</td>
                                <td className="p-2.5 text-right font-mono text-muted-foreground">${Number(h.avg_cost).toFixed(2)}</td>
                                <td className="p-2.5 text-right font-mono font-bold">${Number(h.current_price).toFixed(2)}</td>
                                <td className="p-2.5 text-right font-bold text-foreground font-mono">
                                  ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </td>
                                <td className={`p-2.5 text-right font-bold font-mono text-[11px] ${isGain ? "text-success" : "text-destructive"}`}>
                                  {isGain ? "+" : ""}${gainDollars.toFixed(2)} ({isGain ? "+" : ""}{gainPercent.toFixed(2)}%)
                                </td>
                                <td className="p-2.5 text-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-[9px] font-bold px-2 rounded-md"
                                    onClick={() => handleOpenTradeModal(h.symbol, "sell")}
                                  >
                                    Sell
                                  </Button>
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

              {/* Order Ledger */}
              <SlideUp>
                <div className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm font-sans">
                  <div className="p-3 border-b border-border/60 bg-muted/10 flex justify-between items-center">
                    <h3 className="font-bold font-poppins text-foreground text-xs">Order Execution History</h3>
                    <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-background border px-2 py-0.5 rounded-md">
                      <ShieldAlert className="h-3 w-3 text-primary" />
                      <span>IRS Compliance Audit Trail</span>
                    </div>
                  </div>
                  {orders.length === 0 ? (
                    <div className="p-6 text-center text-xs font-semibold text-muted-foreground">
                      No transaction history recorded yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/40 border-b border-border/60 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                          <tr>
                            <th className="p-2.5">Execution Date</th>
                            <th className="p-2.5">Side</th>
                            <th className="p-2.5">Symbol</th>
                            <th className="p-2.5 text-right">Shares</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5 text-right">Limit Price</th>
                            <th className="p-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 text-xs text-muted-foreground">
                          {orders.map((o) => (
                            <tr key={o.id} className="hover:bg-muted/10 transition-colors">
                              <td className="p-2.5 text-[10px] font-mono font-semibold">
                                {new Date(o.created_at).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="p-2.5">
                                <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${o.side === "buy" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                                  {o.side}
                                </span>
                              </td>
                              <td className="p-2.5 font-bold text-foreground font-mono">{o.symbol}</td>
                              <td className="p-2.5 text-right font-bold text-foreground font-mono">{Number(o.quantity).toFixed(2)}</td>
                              <td className="p-2.5 text-[10px] uppercase font-semibold">{o.order_type}</td>
                              <td className="p-2.5 text-right font-mono">
                                {o.limit_price ? `$${Number(o.limit_price).toFixed(2)}` : "—"}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${o.status === "filled" ? "bg-success/10 text-success" : o.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
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
      )}

      {/* ════════════ STOCK DETAIL ANALYTICS MODAL ════════════ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl font-sans rounded-xl border border-border/60 p-4 sm:p-5" aria-describedby={undefined}>
          {selectedStock && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex justify-between items-start pr-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg text-foreground">{selectedStock.symbol}</span>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {selectedStock.asset_class}
                      </span>
                    </div>
                    <DialogTitle className="text-sm font-semibold text-muted-foreground">{selectedStock.name}</DialogTitle>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-mono font-bold text-foreground">${(tickerPrices[selectedStock.symbol] || selectedStock.current_price).toFixed(2)}</span>
                    <p className={`text-xs font-mono font-bold ${selectedStock.change_24h >= 0 ? "text-success" : "text-destructive"}`}>
                      {selectedStock.change_24h >= 0 ? "+" : ""}{selectedStock.change_percent_24h}% (24h)
                    </p>
                  </div>
                </div>
              </DialogHeader>

              {/* Interactive Area Chart */}
              <div className="h-40 w-full bg-muted/10 rounded-lg p-2 border border-border/40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedStock.chart_data}>
                    <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                    <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Price"]} contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                    <Area type="monotone" dataKey="price" stroke="hsl(220, 60%, 45%)" fill="hsl(220, 60%, 45%, 0.2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-muted/20 p-3 rounded-lg border border-border/40 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Market Cap</span>
                  <span className="font-mono font-bold text-foreground text-xs">{selectedStock.market_cap}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">P/E Ratio</span>
                  <span className="font-mono font-bold text-foreground text-xs">{selectedStock.pe_ratio}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Div Yield</span>
                  <span className="font-mono font-bold text-foreground text-xs">{selectedStock.dividend_yield}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Analyst Rating</span>
                  <span className="font-bold text-success text-xs">{selectedStock.analyst_rating}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">52-Wk High</span>
                  <span className="font-mono font-bold text-foreground text-xs">${selectedStock.high_52w}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">52-Wk Low</span>
                  <span className="font-mono font-bold text-foreground text-xs">${selectedStock.low_52w}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">24h Volume</span>
                  <span className="font-mono font-bold text-foreground text-xs">{selectedStock.volume}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Company Overview</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{selectedStock.description}</p>
              </div>

              {/* Trade Action Bar */}
              <div className="flex gap-2 border-t border-border/60 pt-3">
                <Button
                  className="flex-1 font-bold h-8 text-xs rounded-lg bg-primary"
                  onClick={() => {
                    handleOpenTradeModal(selectedStock.symbol, "buy");
                  }}
                >
                  Buy {selectedStock.symbol} Stock
                </Button>
                {holdings.some((h) => h.symbol === selectedStock.symbol) && (
                  <Button
                    variant="outline"
                    className="flex-1 font-bold h-8 text-xs rounded-lg"
                    onClick={() => {
                      handleOpenTradeModal(selectedStock.symbol, "sell");
                    }}
                  >
                    Sell Position
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════ ORDER TICKET EXECUTION DIALOG ════════════ */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-w-md font-sans rounded-xl border border-border/60 p-4 sm:p-5" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-poppins font-bold text-sm">Order Execution Ticket</DialogTitle>
            <DialogDescription className="text-xs">Submit buy/sell order to your brokerage execution desk.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePlaceOrder} className="space-y-3.5 mt-1">
            <div className="flex rounded-lg border border-border/60 overflow-hidden shadow-xs">
              <button
                type="button"
                className={`flex-1 py-1.5 text-xs font-bold transition-colors uppercase ${orderSide === "buy" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-foreground"}`}
                onClick={() => setOrderSide("buy")}
              >
                Buy
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 text-xs font-bold transition-colors uppercase ${orderSide === "sell" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-foreground"}`}
                onClick={() => setOrderSide("sell")}
              >
                Sell
              </button>
            </div>

            {selectedAccount && (
              <div className="bg-muted/20 border border-border/60 rounded-lg p-2.5 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Available Cash</span>
                <span className="font-mono font-bold text-foreground text-xs">
                  ${Number(selectedAccount.cash_balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Security Ticker
              </label>
              <select
                className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-semibold h-8"
                value={orderSymbol}
                onChange={(e) => setOrderSymbol(e.target.value)}
              >
                {EXTENDED_STOCKS.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} - {s.name} (${(tickerPrices[s.symbol] || s.current_price).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Share Quantity</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                  className="font-mono font-bold text-xs h-8"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Execution Type</label>
                <select
                  className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-semibold h-8"
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as any)}
                >
                  <option value="market">Market Order</option>
                  <option value="limit">Limit Order</option>
                </select>
              </div>
            </div>

            {orderType === "limit" && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Limit Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="font-mono font-bold text-xs h-8"
                />
              </div>
            )}

            <div className="pt-2 border-t border-border/60 flex justify-between items-center bg-muted/20 p-2.5 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estimated Total Cost</span>
              <span className="font-mono font-bold text-foreground text-sm">
                ${(Number(orderQty || 0) * (tickerPrices[orderSymbol] || EXTENDED_STOCKS.find((s) => s.symbol === orderSymbol)?.current_price || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <Button type="submit" className="w-full font-bold h-8 text-xs rounded-lg">
              Submit Order to Desk
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════ FUND ACCOUNT DIALOG ════════════ */}
      <Dialog open={fundOpen} onOpenChange={setFundOpen}>
        <DialogContent className="max-w-md font-sans rounded-xl border border-border/60 p-4 sm:p-5" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-poppins font-bold text-sm">Deposit Cash to Brokerage</DialogTitle>
            <DialogDescription className="text-xs">Transfer available funds from your active checking account.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFundAccount} className="space-y-3.5 mt-1">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Source Account</label>
              <select
                className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-semibold h-8"
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Deposit Amount (USD)</label>
              <Input
                type="number"
                required
                min={1}
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="0.00"
                className="font-mono font-bold text-sm h-8"
              />
            </div>
            <Button type="submit" className="w-full font-bold h-8 text-xs rounded-lg mt-2">
              Confirm Transfer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
