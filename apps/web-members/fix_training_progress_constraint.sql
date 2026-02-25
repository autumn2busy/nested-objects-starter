-- Drop the old overly restrictive constraint that prevents users from taking multiple lessons per module
ALTER TABLE public.training_progress 
DROP CONSTRAINT IF EXISTS training_progress_user_module_key;

-- Drop any previous attempts at the new constraint to ensure a clean slate
ALTER TABLE public.training_progress 
DROP CONSTRAINT IF EXISTS training_progress_granular_key;

-- Add the correct granular unique constraint
ALTER TABLE public.training_progress
ADD CONSTRAINT training_progress_granular_key 
UNIQUE (user_id, module_id, lesson_id, resource_type);
