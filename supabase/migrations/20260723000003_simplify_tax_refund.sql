-- Add refund_method and ssn_tin columns
ALTER TABLE public.tax_refund_applications
ADD COLUMN IF NOT EXISTS refund_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS ssn_tin VARCHAR(100);
