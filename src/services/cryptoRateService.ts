import { supabase } from "@/integrations/supabase/client";

export interface CryptoAsset {
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
  iconUrl?: string;
}

const COINGECKO_IDS: Record<string, string> = {
  BTC:  "bitcoin",
  ETH:  "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  SOL:  "solana",
};

const FALLBACK_RATES: Record<string, number> = {
  BTC:  64250.00,
  ETH:   3480.50,
  USDT:     1.00,
  USDC:     1.00,
  SOL:    148.20,
};

export const SUPPORTED_SYMBOLS = Object.keys(COINGECKO_IDS);

/**
 * Fetch live rates from CoinGecko and persist to DB.
 * Falls back to DB snapshot, then hardcoded values.
 */
export async function getLiveCryptoRates(): Promise<CryptoAsset[]> {
  try {
    const ids = Object.values(COINGECKO_IDS).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error("CoinGecko response not ok");

    const data = await res.json();

    const assets: CryptoAsset[] = SUPPORTED_SYMBOLS.map((symbol) => {
      const id = COINGECKO_IDS[symbol];
      const entry = data[id];
      return {
        symbol,
        name: nameFor(symbol),
        priceUsd: entry?.usd ?? FALLBACK_RATES[symbol],
        change24h: entry?.usd_24h_change ?? 0,
      };
    });

    // Persist snapshot to DB (best effort, non-blocking)
    persistRates(assets).catch(() => {});

    return assets;
  } catch {
    // Fall back to DB snapshot
    return getRatesFromDB();
  }
}

async function getRatesFromDB(): Promise<CryptoAsset[]> {
  try {
    const { data } = await supabase
      .from("crypto_exchange_rates")
      .select("asset_symbol, rate_usd")
      .order("recorded_at", { ascending: false });

    if (!data || data.length === 0) return getFallbackRates();

    // Keep only most recent per symbol
    const latest: Record<string, number> = {};
    for (const row of data) {
      if (!latest[row.asset_symbol]) {
        latest[row.asset_symbol] = parseFloat(row.rate_usd);
      }
    }

    return SUPPORTED_SYMBOLS.map((symbol) => ({
      symbol,
      name: nameFor(symbol),
      priceUsd: latest[symbol] ?? FALLBACK_RATES[symbol],
      change24h: 0,
    }));
  } catch {
    return getFallbackRates();
  }
}

async function persistRates(assets: CryptoAsset[]): Promise<void> {
  const rows = assets.map((a) => ({
    asset_symbol: a.symbol,
    rate_usd: a.priceUsd,
    source: "coingecko",
    recorded_at: new Date().toISOString(),
  }));

  await supabase.from("crypto_exchange_rates").insert(rows);
}

function getFallbackRates(): CryptoAsset[] {
  return SUPPORTED_SYMBOLS.map((symbol) => ({
    symbol,
    name: nameFor(symbol),
    priceUsd: FALLBACK_RATES[symbol],
    change24h: 0,
  }));
}

function nameFor(symbol: string): string {
  const names: Record<string, string> = {
    BTC: "Bitcoin", ETH: "Ethereum", USDT: "Tether USD", USDC: "USD Coin", SOL: "Solana",
  };
  return names[symbol] ?? symbol;
}

/**
 * Get the latest rate for a single asset from the DB.
 */
export async function getRateForAsset(symbol: string): Promise<number> {
  const { data } = await supabase
    .from("crypto_exchange_rates")
    .select("rate_usd")
    .eq("asset_symbol", symbol)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .single();

  return data ? parseFloat(data.rate_usd) : FALLBACK_RATES[symbol] ?? 1;
}
