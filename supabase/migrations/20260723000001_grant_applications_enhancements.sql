-- Add new columns for business information
ALTER TABLE public.grant_applications
ADD COLUMN IF NOT EXISTS business_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS business_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS year_started INTEGER;

-- Drop the old constraint if it exists (usually auto-named table_column_check)
ALTER TABLE public.grant_applications DROP CONSTRAINT IF EXISTS grant_applications_status_check;

-- Update status constraint to include the new workflow statuses
ALTER TABLE public.grant_applications 
ADD CONSTRAINT grant_applications_status_check 
CHECK (status IN ('draft', 'submitted', 'under_review', 'info_required', 'approved', 'rejected', 'processed', 'closed', 'awarded'));

-- Update trigger function to handle 'processed' instead of 'awarded' (or keep 'awarded' compatibility).
-- Let's update the trigger if necessary later, but we rely on the service layer to do the disbursement right now.
