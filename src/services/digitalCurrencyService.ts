import { supabase } from "@/integrations/supabase/client";
import { getLiveCryptoRates as fetchLiveRates } from "./cryptoRateService";

export interface CryptoAsset {
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
  iconUrl?: string;
}

export interface UserCryptoWallet {
  id?: string;
  user_id?: string;
  asset_symbol: string;
  asset_name: string;
  balance: number;
  estimated_fiat_value?: number;
  wallet_address?: string;
}

export interface CryptoQuote {
  quote_id: string;
  conversion_type: string;
  from_asset: string;
  to_asset: string;
  from_amount: number;
  to_amount: number;
  rate_usd: number;
  to_rate_usd: number | null;
  fee_usd: number;
  expires_at: string;
  lock_seconds: number;
}

export const SUPPORTED_CRYPTO_ASSETS = ["BTC", "ETH", "USDT", "USDC", "SOL"];
export const DEFAULT_SWAP_FEE = 0.5; // 0.5%

export interface SwapFeeConfig {
  flat_fee: number;
  percentage_fee: number;
}

export function calculateSwapFee(amount: number, feeConfig: SwapFeeConfig) {
  const percentageFeeAmount = (amount * feeConfig.percentage_fee) / 100;
  return {
    feeUsd: percentageFeeAmount + feeConfig.flat_fee,
    feePercentage: feeConfig.percentage_fee
  };
}

/**
 * Fetch live prices (delegated to cryptoRateService)
 */
export async function getLiveCryptoRates(): Promise<CryptoAsset[]> {
  return fetchLiveRates();
}

/**
 * Get User Digital Currency Wallets
 */
export async function getUserCryptoWallets(userId: string): Promise<UserCryptoWallet[]> {
  const defaultWallets: UserCryptoWallet[] = [
    { asset_symbol: "BTC", asset_name: "Bitcoin", balance: 0, wallet_address: "bc1q" + (userId ? userId.slice(0, 8) : "default") },
    { asset_symbol: "ETH", asset_name: "Ethereum", balance: 0, wallet_address: "0x" + (userId ? userId.slice(0, 8) : "default") },
    { asset_symbol: "USDT", asset_name: "Tether USD", balance: 0, wallet_address: "0x" + (userId ? userId.slice(0, 8) : "default") },
    { asset_symbol: "USDC", asset_name: "USD Coin", balance: 0, wallet_address: "0x" + (userId ? userId.slice(0, 8) : "default") },
    { asset_symbol: "SOL", asset_name: "Solana", balance: 0, wallet_address: "Sol" + (userId ? userId.slice(0, 8) : "default") },
  ];

  if (!userId) return defaultWallets;

  try {
    const { data, error } = await supabase
      .from("digital_currency_wallets")
      .select("id, user_id, asset_symbol, balance, wallet_address")
      .eq("user_id", userId);

    if (error || !data || data.length === 0) {
      return defaultWallets;
    }

    return defaultWallets.map((def) => {
      const found = data.find((d) => d.asset_symbol === def.asset_symbol);
      return {
        ...def,
        id: found?.id,
        user_id: found?.user_id,
        balance: found ? parseFloat(found.balance) : 0,
        wallet_address: found?.wallet_address || def.wallet_address,
      };
    });
  } catch (err) {
    console.error("Error fetching user crypto wallets:", err);
    return defaultWallets;
  }
}

/**
 * Get a locked quote for conversion
 */
export async function getCryptoQuote(params: {
  userId: string;
  conversionType: "fiat_to_crypto" | "crypto_to_fiat" | "crypto_to_crypto";
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  fromAccountId?: string;
  toAccountId?: string;
}): Promise<{ quote: CryptoQuote | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc("get_crypto_quote", {
      p_user_id: params.userId,
      p_conversion_type: params.conversionType,
      p_from_asset: params.fromAsset,
      p_to_asset: params.toAsset,
      p_from_amount: params.fromAmount,
      p_from_account_id: params.fromAccountId || null,
      p_to_account_id: params.toAccountId || null,
    });

    if (error) throw error;
    return { quote: data as CryptoQuote, error: null };
  } catch (err: any) {
    console.error("Error getting quote:", err);
    return { quote: null, error: err.message || "Failed to get quote" };
  }
}

/**
 * Execute a locked conversion quote
 */
export async function executeCryptoConversion(
  userId: string,
  quoteId: string,
  pin: string
): Promise<{ success: boolean; reference?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("execute_crypto_conversion", {
      p_user_id: userId,
      p_quote_id: quoteId,
      p_pin: pin,
    });

    if (error) throw error;
    return { success: true, reference: data.reference };
  } catch (err: any) {
    console.error("Error executing conversion:", err);
    return { success: false, error: err.message || "Failed to execute conversion" };
  }
}

/**
 * Execute external crypto transfer
 */
export async function executeCryptoTransfer(params: {
  userId: string;
  assetSymbol: string;
  network: string;
  destinationAddress: string;
  amount: number;
  pin: string;
}): Promise<{ success: boolean; reference?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("execute_crypto_transfer", {
      p_user_id: params.userId,
      p_asset_symbol: params.assetSymbol,
      p_network: params.network,
      p_destination_address: params.destinationAddress,
      p_amount: params.amount,
      p_pin: params.pin,
    });

    if (error) throw error;
    return { success: true, reference: data.reference };
  } catch (err: any) {
    console.error("Error executing crypto transfer:", err);
    return { success: false, error: err.message || "Failed to transfer crypto" };
  }
}
