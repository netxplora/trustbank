import React, { useState, useEffect } from "react";
import { 
  Bitcoin, ArrowRightLeft, Wallet, TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownLeft, ShieldCheck, RefreshCw, Layers, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";
import { 
  getLiveCryptoRates, getUserCryptoWallets, calculateSwapFee, 
  CryptoAsset, UserCryptoWallet, SwapFeeConfig 
} from "@/services/digitalCurrencyService";
import { getSwapFeeConfig } from "@/services/swapFeeService";

export default function DigitalCurrencyPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [wallets, setWallets] = useState<UserCryptoWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [feeConfig, setFeeConfig] = useState<SwapFeeConfig>({
    flat_fee: 1.50,
    percentage_fee: 0.50,
    min_fee: 0.50,
    max_fee: 50.00,
    promotional_discount: 0,
  });

  // Swap State
  const [fromType, setFromType] = useState<"fiat" | "crypto">("fiat");
  const [selectedAsset, setSelectedAsset] = useState<string>("BTC");
  const [swapAmount, setSwapAmount] = useState<string>("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    const [liveRates, userWallets, currentFees] = await Promise.all([
      getLiveCryptoRates(),
      getUserCryptoWallets(user?.id || ""),
      getSwapFeeConfig(),
    ]);
    setAssets(liveRates);
    setWallets(userWallets);
    setFeeConfig(currentFees);
    setLoading(false);
  };

  const selectedCryptoAsset = assets.find((a) => a.symbol === selectedAsset) || assets[0] || {
    symbol: "BTC", name: "Bitcoin", priceUsd: 64250, change24h: 2.45
  };

  // Calculate total portfolio value in USD
  const totalPortfolioUsd = wallets.reduce((acc, wallet) => {
    const asset = assets.find((a) => a.symbol === wallet.asset_symbol);
    const price = asset ? asset.priceUsd : 0;
    return acc + wallet.balance * price;
  }, 0);

  const numSwapAmount = parseFloat(swapAmount) || 0;
  const swapAmountUsd = fromType === "fiat" ? numSwapAmount : numSwapAmount * selectedCryptoAsset.priceUsd;
  const { feeUsd, feePercentage } = calculateSwapFee(swapAmountUsd, feeConfig);

  const estimatedReceivedFiat = Math.max(0, swapAmountUsd - feeUsd);
  const estimatedReceivedCrypto = selectedCryptoAsset.priceUsd > 0
    ? Math.max(0, (swapAmountUsd - feeUsd) / selectedCryptoAsset.priceUsd)
    : 0;

  const handleExecuteSwap = async () => {
    if (numSwapAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid swap amount.", variant: "destructive" });
      return;
    }

    setIsSwapping(true);
    // Simulate transaction execution
    setTimeout(() => {
      setIsSwapping(false);
      setSwapDialogOpen(false);
      setSwapAmount("");
      toast({
        title: "Currency Swap Successful",
        description: `Successfully swapped ${fromType === "fiat" ? `$${numSwapAmount.toFixed(2)}` : `${numSwapAmount} ${selectedAsset}`} with a fee of $${feeUsd.toFixed(2)}.`,
      });
      loadData();
    }, 1200);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <SlideUp>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="font-poppins text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Bitcoin className="h-5 w-5 text-primary" />
              Digital Currency Account
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage digital assets, execute instant swaps, and monitor portfolio value.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5 rounded-lg text-xs h-8">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Rates
            </Button>
            <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 rounded-lg text-xs h-8 font-bold">
                  <ArrowRightLeft className="h-3.5 w-3.5" /> Instant Swap
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[460px] rounded-xl font-sans">
                <DialogHeader>
                  <DialogTitle className="font-poppins text-base font-bold">Currency Swap Engine</DialogTitle>
                  <DialogDescription className="text-xs">
                    Convert between fiat balances and digital assets using live market rates.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-1 text-xs">
                  <div className="flex bg-muted/40 p-1 rounded-lg">
                    <button
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${fromType === "fiat" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                      onClick={() => setFromType("fiat")}
                    >
                      Fiat (USD) → Digital Asset
                    </button>
                    <button
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${fromType === "crypto" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                      onClick={() => setFromType("crypto")}
                    >
                      Digital Asset → Fiat (USD)
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Digital Asset</label>
                    <select
                      className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      value={selectedAsset}
                      onChange={(e) => setSelectedAsset(e.target.value)}
                    >
                      {assets.map((a) => (
                        <option key={a.symbol} value={a.symbol}>
                          {a.name} ({a.symbol}) - ${a.priceUsd.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {fromType === "fiat" ? "Amount in USD ($)" : `Amount in ${selectedAsset}`}
                    </label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={swapAmount}
                      onChange={(e) => setSwapAmount(e.target.value)}
                      className="h-8 text-xs rounded-lg font-bold"
                    />
                  </div>

                  {/* Fee Calculation Breakdown */}
                  <div className="bg-muted/30 p-3 rounded-lg space-y-1.5 text-[11px] border border-border/40">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Rate:</span>
                      <span className="font-semibold text-foreground">1 {selectedAsset} = ${selectedCryptoAsset.priceUsd.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Est. Received:</span>
                      <span className="font-bold text-foreground">
                        {fromType === "fiat"
                          ? `${estimatedReceivedCrypto.toFixed(6)} ${selectedAsset}`
                          : `$${estimatedReceivedFiat.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Fee:</span>
                      <span className="font-semibold text-destructive">${feeUsd.toFixed(2)} ({feePercentage}%)</span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleExecuteSwap}
                    disabled={isSwapping || numSwapAmount <= 0}
                    className="w-full h-8 rounded-lg text-xs font-bold"
                  >
                    {isSwapping ? "Executing Swap..." : "Confirm & Swap"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SlideUp>

      {/* Portfolio Overview Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StaggerItem>
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader className="p-3.5 pb-1">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Total Portfolio Value</CardDescription>
              <CardTitle className="font-poppins text-xl font-bold text-foreground mt-0.5">
                ${totalPortfolioUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 pt-0">
              <div className="flex items-center gap-1.5 text-[10px] text-success font-semibold">
                <TrendingUp className="h-3 w-3" /> +3.4% this week
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader className="p-3.5 pb-1">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Available Assets</CardDescription>
              <CardTitle className="font-poppins text-xl font-bold text-foreground mt-0.5">
                {wallets.length} Assets
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 pt-0">
              <div className="text-[10px] text-muted-foreground">
                BTC, ETH, USDT, USDC, SOL
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader className="p-3.5 pb-1">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Security Tier</CardDescription>
              <CardTitle className="font-poppins text-base font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="h-4 w-4 text-primary" /> Tier 2 Verified
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 pt-0">
              <div className="text-[10px] text-muted-foreground">
                Multi-signature security active
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Assets & Wallet Breakdown */}
      <Card className="rounded-xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-3.5 pb-2">
          <CardTitle className="font-poppins text-sm font-bold">Digital Assets Breakdown</CardTitle>
          <CardDescription className="text-xs">Current holdings, asset quantities, and estimated fiat valuations.</CardDescription>
        </CardHeader>
        <CardContent className="p-3.5 pt-0">
          <div className="divide-y divide-border/40">
            {wallets.map((wallet) => {
              const asset = assets.find((a) => a.symbol === wallet.asset_symbol);
              const price = asset ? asset.priceUsd : 0;
              const fiatVal = wallet.balance * price;

              return (
                <div key={wallet.asset_symbol} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                      {wallet.asset_symbol.slice(0, 3)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-poppins font-bold text-foreground text-xs leading-tight truncate">{wallet.asset_name}</h4>
                      <p className="text-[9px] text-muted-foreground font-mono truncate">{wallet.wallet_address || "Standard Wallet"}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-poppins font-bold text-foreground text-xs">
                      {wallet.balance.toFixed(4)} {wallet.asset_symbol}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-semibold font-mono">
                      ${fiatVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
