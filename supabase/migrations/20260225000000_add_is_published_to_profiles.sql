-- Migration to add `is_published` toggle to profiles

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Add a comment to describe the column
COMMENT ON COLUMN public.profiles.is_published IS 'Whether the member profile is visible in the public directory';
