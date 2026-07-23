import { supabase } from "@/integrations/supabase/client";

export interface TaxRefundApplication {
  id?: string;
  user_id?: string;
  application_number: string;
  tax_year: number;
  filing_status: string;
  estimated_refund_amount: number;
  status: 'submitted' | 'under_review' | 'action_required' | 'approved' | 'disbursed' | 'rejected';
  documents: { name: string; url: string; uploaded_at: string }[];
  user_notes?: string;
  admin_notes?: string;
  created_at?: string;
  updated_at?: string;
  profiles?: { display_name?: string; email?: string };
}

export async function getUserTaxRefundApplications(userId: string): Promise<TaxRefundApplication[]> {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from("tax_refund_applications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tax refund applications:", error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id,
      user_id: item.user_id,
      application_number: item.application_number,
      tax_year: item.tax_year,
      filing_status: item.filing_status,
      estimated_refund_amount: parseFloat(item.estimated_refund_amount),
      status: item.status,
      documents: item.documents || [],
      user_notes: item.user_notes,
      admin_notes: item.admin_notes,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  } catch (err) {
    console.error("Error fetching tax refund applications:", err);
    return [];
  }
}

export async function getAllTaxRefundApplications(): Promise<TaxRefundApplication[]> {
  try {
    const { data: apps, error } = await supabase
      .from("tax_refund_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !apps) {
      console.error("Error fetching all tax refund applications:", error);
      return [];
    }

    const userIds = Array.from(new Set(apps.map((a) => a.user_id).filter(Boolean)));
    const profilesMap: Record<string, { display_name?: string; email?: string }> = {};

    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, first_name, last_name, email")
        .in("id", userIds);

      if (profs) {
        profs.forEach((p) => {
          const name = p.first_name ? `${p.first_name} ${p.last_name || ""}`.trim() : p.display_name || p.email;
          profilesMap[p.id] = { display_name: name, email: p.email };
        });
      }
    }

    return apps.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      application_number: item.application_number,
      tax_year: item.tax_year,
      filing_status: item.filing_status,
      estimated_refund_amount: parseFloat(item.estimated_refund_amount),
      status: item.status,
      documents: item.documents || [],
      user_notes: item.user_notes,
      admin_notes: item.admin_notes,
      created_at: item.created_at,
      updated_at: item.updated_at,
      profiles: profilesMap[item.user_id],
    }));
  } catch (err) {
    console.error("Error fetching all tax refund applications:", err);
    return [];
  }
}

export async function submitTaxRefundApplication(
  app: Omit<TaxRefundApplication, "id" | "application_number" | "status" | "created_at">
): Promise<boolean> {
  try {
    const appNumber = `TR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { error } = await supabase.from("tax_refund_applications").insert({
      user_id: app.user_id,
      application_number: appNumber,
      tax_year: app.tax_year,
      filing_status: app.filing_status,
      estimated_refund_amount: app.estimated_refund_amount,
      documents: app.documents,
      user_notes: app.user_notes,
      status: "submitted",
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error submitting tax refund application:", err);
    return false;
  }
}

export async function updateTaxRefundStatus(
  applicationId: string,
  newStatus: TaxRefundApplication["status"],
  adminNotes?: string
): Promise<boolean> {
  try {
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (adminNotes !== undefined) {
      updatePayload.admin_notes = adminNotes;
    }

    const { error } = await supabase
      .from("tax_refund_applications")
      .update(updatePayload)
      .eq("id", applicationId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating tax refund status:", err);
    return false;
  }
}

export async function deleteTaxRefundApplication(applicationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("tax_refund_applications")
      .delete()
      .eq("id", applicationId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleting tax refund application:", err);
    return false;
  }
}
