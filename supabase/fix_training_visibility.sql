-- ============================================================================
-- FIX VISIBILITY: Enable Read Access for Training Modules & Lessons
-- ============================================================================

-- 1. Enable RLS on tables (if not already enabled)
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_lessons ENABLE ROW LEVEL SECURITY;

-- 2. Create/Replace Policies for training_modules
-- Allow EVERYONE (Authenticated and Anonymous) to view active modules
DROP POLICY IF EXISTS "Public can view active modules" ON training_modules;
CREATE POLICY "Public can view active modules" 
ON training_modules FOR SELECT 
USING (true); -- Or set to (is_active = true) if you want to hide inactive ones

-- 3. Create/Replace Policies for training_lessons
-- Allow EVERYONE to view lessons
DROP POLICY IF EXISTS "Public can view lessons" ON training_lessons;
CREATE POLICY "Public can view lessons" 
ON training_lessons FOR SELECT 
USING (true);

-- 4. Ensure all modules are marked as Active
UPDATE training_modules 
SET is_active = true 
WHERE is_active = false OR is_active IS NULL;

-- 5. Quick Verification Query (Run this to see if data exists)
SELECT id, title, is_active, (SELECT count(*) FROM training_lessons WHERE module_id = training_modules.id) as lesson_count 
FROM training_modules 
ORDER BY module_number;
