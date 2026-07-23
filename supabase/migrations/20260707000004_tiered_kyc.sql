-- Migration: Phase 13 - Tiered KYC
-- Description: Extends the profiles table with comprehensive fields and tiered KYC support

-- 1. Add new columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS mailing_address text,
  ADD COLUMN IF NOT EXISTS state_province text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS employer_name text,
  ADD COLUMN IF NOT EXISTS annual_income_range text,
  ADD COLUMN IF NOT EXISTS source_of_funds text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS kyc_tier integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS membership_level text DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_preferences boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb;

-- 2. Modify kyc_status constraints if needed
-- Currently it allows 'not_started', 'pending', 'approved', 'rejected'.
-- We will keep the same statuses, but map them to tiers in the application logic.

-- 3. Notify existing profiles that they might need to update info
-- This can be an optional insert into notifications, but omitted here to avoid spamming all users.
