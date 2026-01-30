-- Fix Scenarios Table Schema
-- This runs before the seed script to ensure the table has the required columns

-- 1. Ensure module_id column exists
ALTER TABLE scenarios 
ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES training_modules(id);

-- 2. Ensure other columns exist (just in case)
ALTER TABLE scenarios 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS subtitle TEXT,
ADD COLUMN IF NOT EXISTS audience_type TEXT,
ADD COLUMN IF NOT EXISTS icon_name TEXT,
ADD COLUMN IF NOT EXISTS accent_color TEXT,
ADD COLUMN IF NOT EXISTS situation JSONB,
ADD COLUMN IF NOT EXISTS decisions JSONB,
ADD COLUMN IF NOT EXISTS debrief JSONB,
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- 3. Enable RLS if not enabled
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- 4. public read policy
DROP POLICY IF EXISTS "Public can view scenarios" ON scenarios;
CREATE POLICY "Public can view scenarios" ON scenarios FOR SELECT USING (true);
