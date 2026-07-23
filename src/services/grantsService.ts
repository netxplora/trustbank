import { supabase } from "@/integrations/supabase/client";

export interface GrantProgram {
  id: string;
  title: string;
  category: string;
  description: string;
  funding_amount: number;
  eligibility_criteria: string;
  deadline: string;
  status: 'active' | 'closed' | 'upcoming';
  image_url?: string;
  created_at?: string;
}

export interface GrantApplication {
  id?: string;
  grant_program_id: string;
  user_id?: string;
  application_number: string;
  project_title: string;
  requested_amount: number;
  proposal_summary: string;
  business_name?: string;
  business_type?: string;
  industry?: string;
  year_started?: number;
  status: 'draft' | 'submitted' | 'under_review' | 'info_required' | 'approved' | 'rejected' | 'processed' | 'closed';
  documents: { name: string; url: string; uploaded_at: string }[];
  admin_feedback?: string;
  created_at?: string;
  updated_at?: string;
  grant_program?: GrantProgram;
  profiles?: { display_name?: string; email?: string; first_name?: string; last_name?: string };
}

export const DEFAULT_GRANT_PROGRAM_IMAGES: Record<string, string> = {
  "Small Business": "https://images.unsplash.com/photo-1664575602276-acd073f104c1?w=800&auto=format&fit=crop&q=60",
  "Sustainability": "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=60",
  "Community": "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60",
  "Innovation": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=60",
  "Education": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=60",
  "Healthcare": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60",
};

export const DEFAULT_GRANT_PROGRAMS: GrantProgram[] = [
  {
    id: "11111111-1111-4111-a111-111111111111",
    title: "Small Business Expansion & Tech Grant",
    category: "Small Business",
    description: "Financial assistance for small businesses upgrading digital infrastructure, POS systems, and ecommerce capabilities.",
    funding_amount: 15000,
    eligibility_criteria: "Registered business entity in operation for at least 6 months with verified transaction history.",
    deadline: "2026-12-31T23:59:59.000Z",
    status: "active",
    image_url: "https://images.unsplash.com/photo-1664575602276-acd073f104c1?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "22222222-2222-4222-a222-222222222222",
    title: "Green Energy & Clean Tech Innovation Grant",
    category: "Sustainability",
    description: "Funding support for businesses and commercial entities adopting renewable solar, energy-efficient HVAC, or EV fleet solutions.",
    funding_amount: 25000,
    eligibility_criteria: "Commercial or residential property owners implementing verified green energy initiatives.",
    deadline: "2026-11-30T23:59:59.000Z",
    status: "active",
    image_url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "33333333-3333-4333-a333-333333333333",
    title: "Community Entrepreneurship & Equity Fund",
    category: "Community",
    description: "Grant assistance for underrepresented founders, local community enterprises, and youth-led innovation initiatives.",
    funding_amount: 10000,
    eligibility_criteria: "Community-oriented business proposal with clear local economic impact statement.",
    deadline: "2026-10-15T23:59:59.000Z",
    status: "active",
    image_url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60",
  },
];

export async function getGrantPrograms(): Promise<GrantProgram[]> {
  try {
    const { data, error } = await supabase
      .from("grant_programs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching grant programs from DB:", error);
    }

    if (data && data.length > 0) {
      return data.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        description: item.description,
        funding_amount: parseFloat(item.funding_amount),
        eligibility_criteria: item.eligibility_criteria,
        deadline: item.deadline,
        status: item.status,
        image_url: item.image_url || DEFAULT_GRANT_PROGRAM_IMAGES[item.category] || DEFAULT_GRANT_PROGRAM_IMAGES["Small Business"],
        created_at: item.created_at,
      }));
    }

    // Fallback active programs if DB table is empty
    return DEFAULT_GRANT_PROGRAMS;
  } catch (err) {
    console.error("Error fetching grant programs:", err);
    return DEFAULT_GRANT_PROGRAMS;
  }
}

export async function createGrantProgram(
  program: Omit<GrantProgram, "id" | "created_at">
): Promise<boolean> {
  try {
    const payload: Record<string, unknown> = {
      title: program.title,
      category: program.category,
      description: program.description,
      funding_amount: program.funding_amount,
      eligibility_criteria: program.eligibility_criteria,
      deadline: program.deadline,
      status: program.status || "active",
      image_url: program.image_url || DEFAULT_GRANT_PROGRAM_IMAGES[program.category] || DEFAULT_GRANT_PROGRAM_IMAGES["Small Business"],
    };

    const { error } = await supabase.from("grant_programs").insert(payload);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error creating grant program:", err);
    return false;
  }
}

export async function updateGrantProgram(
  programId: string,
  updates: Partial<Omit<GrantProgram, "id" | "created_at">>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("grant_programs")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", programId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating grant program:", err);
    return false;
  }
}

export async function deleteGrantProgram(programId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("grant_programs")
      .delete()
      .eq("id", programId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleting grant program:", err);
    return false;
  }
}

export async function getUserGrantApplications(userId: string): Promise<GrantApplication[]> {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from("grant_applications")
      .select("*, grant_programs(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching grant applications:", error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id,
      grant_program_id: item.grant_program_id,
      user_id: item.user_id,
      application_number: item.application_number,
      project_title: item.project_title,
      requested_amount: parseFloat(item.requested_amount),
      proposal_summary: item.proposal_summary,
      business_name: item.business_name,
      business_type: item.business_type,
      industry: item.industry,
      year_started: item.year_started,
      status: item.status,
      documents: item.documents || [],
      admin_feedback: item.admin_feedback,
      created_at: item.created_at,
      updated_at: item.updated_at,
      grant_program: item.grant_programs,
    }));
  } catch (err) {
    console.error("Error fetching grant applications:", err);
    return [];
  }
}

export async function getAllGrantApplications(): Promise<GrantApplication[]> {
  try {
    const { data: apps, error } = await supabase
      .from("grant_applications")
      .select("*, grant_programs(*)")
      .order("created_at", { ascending: false });

    if (error || !apps) {
      console.error("Error fetching all grant applications:", error);
      return [];
    }

    // Fetch profiles separately to avoid PostgREST FK join errors
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
      grant_program_id: item.grant_program_id,
      user_id: item.user_id,
      application_number: item.application_number,
      project_title: item.project_title,
      requested_amount: parseFloat(item.requested_amount),
      proposal_summary: item.proposal_summary,
      business_name: item.business_name,
      business_type: item.business_type,
      industry: item.industry,
      year_started: item.year_started,
      status: item.status,
      documents: item.documents || [],
      admin_feedback: item.admin_feedback,
      created_at: item.created_at,
      updated_at: item.updated_at,
      grant_program: item.grant_programs,
      profiles: profilesMap[item.user_id],
    }));
  } catch (err) {
    console.error("Error fetching all grant applications:", err);
    return [];
  }
}

export async function submitGrantApplication(
  app: Omit<GrantApplication, "id" | "application_number" | "created_at">
): Promise<boolean> {
  try {
    // Ensure grant program exists in DB before inserting application (prevents FK error)
    if (app.grant_program_id) {
      const { data: prog } = await supabase
        .from("grant_programs")
        .select("id")
        .eq("id", app.grant_program_id)
        .maybeSingle();

      if (!prog) {
        // Find default program matching this ID and insert it into DB
        const matchDef = DEFAULT_GRANT_PROGRAMS.find((p) => p.id === app.grant_program_id);
        if (matchDef) {
          await supabase.from("grant_programs").insert({
            id: matchDef.id,
            title: matchDef.title,
            category: matchDef.category,
            description: matchDef.description,
            funding_amount: matchDef.funding_amount,
            eligibility_criteria: matchDef.eligibility_criteria,
            deadline: matchDef.deadline,
            status: matchDef.status,
            image_url: matchDef.image_url,
          });
        }
      }
    }

    const appNumber = `GR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { error } = await supabase.from("grant_applications").insert({
      grant_program_id: app.grant_program_id,
      user_id: app.user_id,
      application_number: appNumber,
      project_title: app.project_title,
      requested_amount: app.requested_amount,
      proposal_summary: app.proposal_summary,
      business_name: app.business_name,
      business_type: app.business_type,
      industry: app.industry,
      year_started: app.year_started,
      documents: app.documents,
      status: app.status || "submitted",
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error submitting grant application:", err);
    return false;
  }
}

export async function updateGrantApplicationStatus(
  applicationId: string,
  newStatus: GrantApplication["status"],
  adminFeedback?: string
): Promise<boolean> {
  try {
    // 1. Fetch current application details to check previous status and get requested amount & user_id
    const { data: existingApp, error: fetchErr } = await supabase
      .from("grant_applications")
      .select("id, user_id, project_title, requested_amount, status")
      .eq("id", applicationId)
      .single();

    if (fetchErr || !existingApp) {
      console.error("Error fetching existing application:", fetchErr);
      return false;
    }

    const previousStatus = existingApp.status;
    // Processed means the funds are going to be transferred
    const isNowProcessed = newStatus === "processed";
    const wasAlreadyProcessed = previousStatus === "processed" || previousStatus === "awarded";

    // 2. Perform database update for application status & feedback
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (adminFeedback !== undefined) {
      updatePayload.admin_feedback = adminFeedback;
    }

    const { error: updateErr } = await supabase
      .from("grant_applications")
      .update(updatePayload)
      .eq("id", applicationId);

    if (updateErr) throw updateErr;

    // 3. If transitioning to processed for the first time, credit user's savings account & notify
    if (isNowProcessed && !wasAlreadyProcessed && existingApp.user_id) {
      const grantAmount = parseFloat(existingApp.requested_amount);

      // Find user's savings account
      const { data: userAccounts } = await supabase
        .from("accounts")
        .select("id, balance, account_type")
        .eq("user_id", existingApp.user_id);

      let targetAccount = userAccounts?.find((acc) => acc.account_type === "savings");
      if (!targetAccount && userAccounts && userAccounts.length > 0) {
        targetAccount = userAccounts[0];
      }

      if (targetAccount) {
        const currentBalance = parseFloat(targetAccount.balance || 0);
        const newBalance = currentBalance + grantAmount;

        // Update balance
        await supabase
          .from("accounts")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("id", targetAccount.id);

        // Record credit transaction
        const refNumber = `GRT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await supabase.from("transactions").insert({
          user_id: existingApp.user_id,
          account_id: targetAccount.id,
          type: "credit",
          amount: grantAmount,
          balance_after: newBalance,
          description: `Grant Funding Disbursement: ${existingApp.project_title}`,
          reference: refNumber,
          status: "completed",
        });
      }

      // Send notification to user
      await supabase.from("notifications").insert({
        user_id: existingApp.user_id,
        title: "Grant Application Approved!",
        message: `Congratulations! Your grant application for "${existingApp.project_title}" has been ${newStatus}. Grant funds of $${grantAmount.toLocaleString()} have been credited to your savings account.`,
        type: "success",
        read: false,
      });
    }

    return true;
  } catch (err) {
    console.error("Error updating grant application status:", err);
    return false;
  }
}

export async function deleteGrantApplication(applicationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("grant_applications")
      .delete()
      .eq("id", applicationId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleting grant program:", err);
    return false;
  }
}
