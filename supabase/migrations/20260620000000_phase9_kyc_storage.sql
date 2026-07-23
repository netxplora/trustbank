-- Migration: Phase 9 - KYC Storage Setup
-- Description: Creates the kyc_documents storage bucket and appropriate RLS policies.

-- 1. Create the kyc_documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc_documents', 'kyc_documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects if not already enabled (usually enabled by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2.5 Add file_url column to kyc_documents
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS file_url text;

-- 3. Policy: Users can upload their own KYC documents
-- The folder structure will be: {user_id}/{filename}
CREATE POLICY "Users can upload their own KYC documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'kyc_documents' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- 4. Policy: Users can view their own KYC documents
CREATE POLICY "Users can view their own KYC documents" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'kyc_documents' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- 5. Policy: Admins can view all KYC documents
CREATE POLICY "Admins can view all KYC documents" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'kyc_documents' AND 
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'support_admin')
    )
);
