-- Migration: Add slug, status, revision_history to cms_posts for full CMS support
-- This enables: URL-friendly slugs for article pages, draft/published status, and revision tracking.

-- Add slug column (URL-friendly identifier)
ALTER TABLE public.cms_posts ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add status column (draft or published)
ALTER TABLE public.cms_posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft'));

-- Add revision_history column (JSON array of changes)
ALTER TABLE public.cms_posts ADD COLUMN IF NOT EXISTS revision_history JSONB DEFAULT '[]'::jsonb;

-- Backfill slugs for existing posts that don't have one
UPDATE public.cms_posts
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_cms_posts_slug ON public.cms_posts(slug);

-- Create index on status for filtered queries
CREATE INDEX IF NOT EXISTS idx_cms_posts_status ON public.cms_posts(status);
