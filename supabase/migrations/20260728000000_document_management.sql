-- ============================================================
-- Migration: Platform Document Management System
-- Description: Creates the platform_documents registry table
--              for tracking all generated receipts, statements,
--              certificates, and letters.
-- ============================================================

-- 1. Document Registry Table
CREATE TABLE IF NOT EXISTS public.platform_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_category TEXT NOT NULL,
  reference_number TEXT NOT NULL UNIQUE,
  verification_code TEXT NOT NULL UNIQUE,
  entity_type TEXT,
  entity_id UUID,
  title TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'issued',
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_platform_docs_user ON public.platform_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_docs_ref ON public.platform_documents(reference_number);
CREATE INDEX IF NOT EXISTS idx_platform_docs_verification ON public.platform_documents(verification_code);
CREATE INDEX IF NOT EXISTS idx_platform_docs_entity ON public.platform_documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_platform_docs_category ON public.platform_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_platform_docs_created ON public.platform_documents(created_at DESC);

-- 3. Row Level Security
ALTER TABLE public.platform_documents ENABLE ROW LEVEL SECURITY;

-- Customers can view their own documents
CREATE POLICY "Users can view own documents"
  ON public.platform_documents FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all documents
CREATE POLICY "Admins can view all documents"
  ON public.platform_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin', 'support_admin')
    )
  );

-- System (authenticated users) can insert their own documents
CREATE POLICY "Users can insert own documents"
  ON public.platform_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can insert documents for any user
CREATE POLICY "Admins can insert any documents"
  ON public.platform_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin', 'support_admin')
    )
  );

-- Admins can update document status (void, supersede)
CREATE POLICY "Admins can update documents"
  ON public.platform_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin', 'support_admin')
    )
  );

-- 4. Constraint to validate status values
ALTER TABLE public.platform_documents
  ADD CONSTRAINT chk_document_status
  CHECK (status IN ('issued', 'void', 'superseded'));

-- 5. Constraint to validate category values
ALTER TABLE public.platform_documents
  ADD CONSTRAINT chk_document_category
  CHECK (document_category IN (
    'banking', 'accounts', 'investments', 'loans',
    'grants', 'tax', 'kyc', 'security', 'general'
  ));
