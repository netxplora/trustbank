-- Add new columns for tax refund information
ALTER TABLE public.tax_refund_applications
ADD COLUMN IF NOT EXISTS tax_refund_program VARCHAR(150),
ADD COLUMN IF NOT EXISTS refund_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS claim_description TEXT,
ADD COLUMN IF NOT EXISTS requested_amount NUMERIC(12, 2);

-- Drop the old constraint if it exists
ALTER TABLE public.tax_refund_applications DROP CONSTRAINT IF EXISTS tax_refund_applications_status_check;

-- Update status constraint to include the new workflow statuses (including old ones for backward compatibility)
ALTER TABLE public.tax_refund_applications 
ADD CONSTRAINT tax_refund_applications_status_check 
CHECK (status IN (
  'draft', 'submitted', 'under_review', 'info_required', 
  'approved', 'rejected', 'processing', 'completed', 
  'closed', 'action_required', 'disbursed'
));
