import React, { useState, useEffect } from "react";
import { Bitcoin, ArrowRightLeft, Settings, Save, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SlideUp } from "@/components/public/Motion";
import { getSwapFeeConfig, updateSwapFeeConfig } from "@/services/swapFeeService";
import { SwapFeeConfig, SUPPORTED_CRYPTO_ASSETS, CryptoAsset } from "@/services/digitalCurrencyService";

export default function AdminDigitalCurrencyPage() {
  const { toast } = useToast();
  const [feeConfig, setFeeConfig] = useState<SwapFeeConfig>({
    flat_fee: 1.50,
    percentage_fee: 0.50,
    min_fee: 0.50,
    max_fee: 50.00,
    promotional_discount: 0,
  });
  const [saving, setSaving] = useState(false);
  const [rates, setRates] = useState<CryptoAsset[]>(SUPPORTED_CRYPTO_ASSETS);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const config = await getSwapFeeConfig();
    setFeeConfig(config);
  };

  const handleSaveFees = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateSwapFeeConfig(feeConfig);
    setSaving(false);

    if (success) {
      toast({ title: "Swap Fee Settings Saved", description: "All currency swaps will now use the updated fee rules." });
    } else {
      toast({ title: "Error Saving Settings", description: "Failed to update swap fee settings.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans">
      <SlideUp>
        <div>
          <h1 className="font-poppins text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-primary" />
            Digital Currency & Swap Fee Administration
          </h1>
          <p className="text-xs text-muted-foreground mb-0.5">
            Configure platform swap fee structures, review digital asset pricing, and monitor active user crypto wallets.
          </p>
        </div>
      </SlideUp>

      {/* Swap Fee Settings Form */}
      <Card className="rounded-xl border border-border/60 shadow-sm">
        <CardHeader className="p-3.5 pb-2 border-b border-border/60 bg-muted/10">
          <CardTitle className="font-poppins text-xs sm:text-sm font-bold flex items-center gap-1.5">
            <Settings className="h-4 w-4 text-primary" /> Swap Fee Engine Configuration
          </CardTitle>
          <CardDescription className="text-[11px]">
            Admin settings for calculating currency exchange and swap fees across all accounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3.5 pt-3">
          <form onSubmit={handleSaveFees} className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Flat Swap Fee ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={feeConfig.flat_fee}
                  onChange={(e) => setFeeConfig({ ...feeConfig, flat_fee: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-xs rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Percentage Swap Fee (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={feeConfig.percentage_fee}
                  onChange={(e) => setFeeConfig({ ...feeConfig, percentage_fee: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-xs rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Minimum Fee Cap ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={feeConfig.min_fee}
                  onChange={(e) => setFeeConfig({ ...feeConfig, min_fee: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-xs rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Maximum Fee Cap ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={feeConfig.max_fee}
                  onChange={(e) => setFeeConfig({ ...feeConfig, max_fee: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-xs rounded-lg"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Promotional Discount Override (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={feeConfig.promotional_discount}
                  onChange={(e) => setFeeConfig({ ...feeConfig, promotional_discount: parseFloat(e.target.value) || 0 })}
                  className="h-12 text-base rounded-xl"
                />
                <p className="text-xs text-muted-foreground">Discount applied on calculated total fee (e.g. 20% promotional discount reduces final fee).</p>
              </div>
            </div>

            <Button type="submit" disabled={saving} className="rounded-xl font-bold gap-2">
              <Save className="h-4 w-4" /> {saving ? "Saving Settings..." : "Save Swap Fee Configuration"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Exchange Rates */}
      <Card className="rounded-2xl border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="font-poppins text-lg">Active Asset Exchange Rates</CardTitle>
          <CardDescription>Live prices utilized by the swap engine.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border/50">
            {rates.map((asset) => (
              <div key={asset.symbol} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="font-poppins font-bold text-sm text-foreground">{asset.name} ({asset.symbol})</h4>
                  <p className="text-xs text-muted-foreground">Market Pair: {asset.symbol}/USD</p>
                </div>
                <div className="text-right font-mono font-bold text-foreground">
                  ${asset.priceUsd.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
