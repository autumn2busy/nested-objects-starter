-- Add video_url and audio_url to training_lessons if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_lessons' AND column_name = 'video_url') THEN
        ALTER TABLE public.training_lessons ADD COLUMN video_url text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_lessons' AND column_name = 'audio_url') THEN
        ALTER TABLE public.training_lessons ADD COLUMN audio_url text;
    END IF;

    -- Ensure content_type has 'mixed' and 'audio' in check constraint if possible, 
    -- but usually modifying a check constraint is harder. 
    -- For now, let's just make sure the columns exist.
END $$;

-- Add lesson_id to training_resources if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_resources' AND column_name = 'lesson_id') THEN
        ALTER TABLE public.training_resources ADD COLUMN lesson_id uuid references public.training_lessons(id);
    END IF;
END $$;
