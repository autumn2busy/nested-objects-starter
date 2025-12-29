-- Migration to update training_progress table for granular tracking

-- 1. Add new columns if they don't exist
ALTER TABLE training_progress 
ADD COLUMN IF NOT EXISTS lesson_id TEXT,
ADD COLUMN IF NOT EXISTS resource_type TEXT DEFAULT 'module'; -- 'module', 'lesson', 'quiz', 'scenario', 'flashcard'

-- 2. Drop the old unique constraint if it exists (user_id, module_id)
-- We need to check if it exists first, but safe to drop by name if known. 
-- Assuming standard naming, or we can add a new one.
-- Let's add the NEW unique constraint first.

-- 3. Update the Unique Constraint to include lesson_id
-- Note: complex to drop constraint without name. 
-- Strategy: Add a new index/constraint for the granular tracking.

CREATE UNIQUE INDEX IF NOT EXISTS training_progress_user_module_lesson_idx 
ON training_progress (user_id, module_id, lesson_id);

-- 4. Enable RLS (Should be already enabled, but good to ensure)
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Update or Create)
-- Allow users to insert/update their OWN rows
CREATE POLICY "Users can insert their own progress" 
ON training_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update their own progress" 
ON training_progress FOR UPDATE 
USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can view their own progress" 
ON training_progress FOR SELECT 
USING (auth.uid() = user_id::uuid);
