import { supabase } from "@/integrations/supabase/client";

/**
 * Logs an administrative action to the audit_logs table.
 * 
 * @param action The key name of the action performed (e.g. "update_settings", "approve_loan").
 * @param entityType The table or model name (e.g. "loans", "profiles", "investment_orders").
 * @param entityId The primary key ID of the affected entity.
 * @param details Additional context parameters in JSON format.
 */
export async function logAdminAction(
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, any>
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;

    const { error } = await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      details: details || null,
      ip_address: null, // Client-side IP can be parsed server-side or left null
    });

    if (error) {
      console.error("Failed to insert audit log:", error.message);
    }
  } catch (e) {
    console.error("Error during admin action logging:", e);
  }
}
