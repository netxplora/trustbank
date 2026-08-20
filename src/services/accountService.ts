import { supabase } from "@/integrations/supabase/client";

export interface AccountRule {
  account_type: "savings" | "checking";
  daily_transfer_limit: number;
  per_tx_limit: number;
  max_daily_tx_count: number;
  min_balance: number;
  max_balance: number | null;
  internal_transfer_min: number;
  internal_transfer_max: number;
  internal_transfer_daily_limit: number;
  internal_transfers_per_day: number;
  quote_lock_seconds: number;
}

export interface InternalTransferRequest {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  pin: string;
}

export interface InternalTransferResponse {
  success: boolean;
  transfer_id?: string;
  reference?: string;
  amount?: number;
  fee?: number;
  net_amount?: number;
  error?: string;
}

export async function getAccountRules(): Promise<AccountRule[]> {
  try {
    const { data, error } = await supabase.from("account_rules").select("*");
    if (error) throw error;
    return data as AccountRule[];
  } catch (err) {
    console.error("Error fetching account rules:", err);
    return [];
  }
}

export async function getAccountRule(accountType: "savings" | "checking"): Promise<AccountRule | null> {
  try {
    const { data, error } = await supabase
      .from("account_rules")
      .select("*")
      .eq("account_type", accountType)
      .single();
    if (error) throw error;
    return data as AccountRule;
  } catch (err) {
    console.error(`Error fetching account rule for ${accountType}:`, err);
    return null;
  }
}

export async function processInternalTransfer(req: InternalTransferRequest): Promise<InternalTransferResponse> {
  try {
    const { data, error } = await supabase.rpc("process_internal_transfer", {
      p_user_id: req.userId,
      p_from_account_id: req.fromAccountId,
      p_to_account_id: req.toAccountId,
      p_amount: req.amount,
      p_pin: req.pin,
    });

    if (error) throw error;
    return data as InternalTransferResponse;
  } catch (err: any) {
    console.error("Internal transfer error:", err);
    return { success: false, error: err.message || "Failed to process internal transfer" };
  }
}
