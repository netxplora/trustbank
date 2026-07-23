import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SWAP_FEE, SwapFeeConfig } from "./digitalCurrencyService";

export async function getSwapFeeConfig(): Promise<SwapFeeConfig> {
  try {
    const { data, error } = await supabase
      .from("swap_fee_settings")
      .select("*")
      .limit(1)
      .single();

    if (error || !data) {
      return DEFAULT_SWAP_FEE;
    }

    return {
      flat_fee: parseFloat(data.flat_fee),
      percentage_fee: parseFloat(data.percentage_fee),
      min_fee: parseFloat(data.min_fee),
      max_fee: parseFloat(data.max_fee),
      promotional_discount: parseFloat(data.promotional_discount || 0),
    };
  } catch (err) {
    console.error("Error loading swap fee configuration:", err);
    return DEFAULT_SWAP_FEE;
  }
}

export async function updateSwapFeeConfig(config: SwapFeeConfig): Promise<boolean> {
  try {
    const { data: existing } = await supabase
      .from("swap_fee_settings")
      .select("id")
      .limit(1)
      .single();

    if (existing?.id) {
      const { error } = await supabase
        .from("swap_fee_settings")
        .update({
          flat_fee: config.flat_fee,
          percentage_fee: config.percentage_fee,
          min_fee: config.min_fee,
          max_fee: config.max_fee,
          promotional_discount: config.promotional_discount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("swap_fee_settings").insert({
        flat_fee: config.flat_fee,
        percentage_fee: config.percentage_fee,
        min_fee: config.min_fee,
        max_fee: config.max_fee,
        promotional_discount: config.promotional_discount,
      });

      if (error) throw error;
    }
    return true;
  } catch (err) {
    console.error("Error updating swap fee settings:", err);
    return false;
  }
}
