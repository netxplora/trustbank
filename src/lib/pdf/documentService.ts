/**
 * Document Service
 * 
 * Handles saving document records to the platform_documents table
 * and provides utilities for document lookup and verification.
 */

import { supabase } from "@/integrations/supabase/client";

export interface SaveDocumentParams {
  userId: string;
  documentType: string;
  documentCategory: string;
  referenceNumber: string;
  verificationCode: string;
  title: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  generatedBy?: string;
}

/**
 * Save a document record to the platform_documents table.
 * Called after a PDF is generated so there's a permanent audit trail.
 */
export async function saveDocumentRecord(params: SaveDocumentParams): Promise<string | null> {
  try {
    const { data, error } = await (supabase as any)
      .from("platform_documents")
      .insert({
        user_id: params.userId,
        document_type: params.documentType,
        document_category: params.documentCategory,
        reference_number: params.referenceNumber,
        verification_code: params.verificationCode,
        title: params.title,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
        metadata: params.metadata || {},
        generated_by: params.generatedBy || params.userId,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error saving document record:", error);
      return null;
    }

    return data?.id || null;
  } catch (e) {
    console.error("Error saving document record:", e);
    return null;
  }
}

/**
 * Fetch all documents for a given user, grouped and sorted.
 */
export async function getUserDocuments(userId: string) {
  const { data, error } = await (supabase as any)
    .from("platform_documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching documents:", error);
    return [];
  }

  return data || [];
}

/**
 * Fetch all documents for admin view (all users).
 */
export async function getAllDocuments(filters?: {
  category?: string;
  documentType?: string;
  search?: string;
  limit?: number;
}) {
  let query = (supabase as any)
    .from("platform_documents")
    .select("*, profiles!platform_documents_user_id_fkey(display_name, email, account_number)")
    .order("created_at", { ascending: false });

  if (filters?.category) {
    query = query.eq("document_category", filters.category);
  }
  if (filters?.documentType) {
    query = query.eq("document_type", filters.documentType);
  }
  if (filters?.search) {
    query = query.or(
      `reference_number.ilike.%${filters.search}%,verification_code.ilike.%${filters.search}%,title.ilike.%${filters.search}%`
    );
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching all documents:", error);
    return [];
  }

  return data || [];
}

/**
 * Verify a document by its verification code.
 */
export async function verifyDocument(verificationCode: string) {
  const { data, error } = await (supabase as any)
    .from("platform_documents")
    .select("*")
    .eq("verification_code", verificationCode)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Void a document (admin action).
 */
export async function voidDocument(documentId: string) {
  const { error } = await (supabase as any)
    .from("platform_documents")
    .update({ status: "void", updated_at: new Date().toISOString() })
    .eq("id", documentId);

  return !error;
}
