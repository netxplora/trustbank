-- Add gov_id_type and gov_id_number columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gov_id_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS gov_id_number VARCHAR(100);
