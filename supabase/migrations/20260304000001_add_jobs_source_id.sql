-- Add source_id column if it doesn't already exist
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS source_id text;

-- Secure a UNIQUE constraint on source_id so Adzuna sync can perform "Upserts" correctly
-- without violating Postgres rules. (In Postgres, multiple NULLs don't violate unique constraints).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'jobs_source_id_key'
    ) THEN
        ALTER TABLE public.jobs 
        ADD CONSTRAINT jobs_source_id_key UNIQUE (source_id);
    END IF;
END $$;
