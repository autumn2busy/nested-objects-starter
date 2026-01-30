-- Add content_data column to training_modules to store specific interactive content
-- (Flashcards, Quiz Questions, Scenarios)

ALTER TABLE training_modules 
ADD COLUMN IF NOT EXISTS content_data JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN training_modules.content_data IS 'Stores interactive content like flashcards, quizzes, and scenarios in JSON format';
