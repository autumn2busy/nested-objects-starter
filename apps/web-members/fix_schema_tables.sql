-- FIX SCRIPT: Run this to resolve schema issues

-- 1. Ensure UUID extension
create extension if not exists "uuid-ossp";

-- 2. Drop policies that might cause errors (to be recreated safely)
drop policy if exists "Users can view own training progress" on public.training_progress;
drop policy if exists "Users can insert own training progress" on public.training_progress;
drop policy if exists "Users can update own training progress" on public.training_progress;

-- 3. Fix training_progress table if it exists with wrong types
do $$
begin
    -- Check if user_id is text, if so, cast it to uuid
    if exists (select 1 from information_schema.columns where table_name = 'training_progress' and column_name = 'user_id' and data_type = 'text') then
        alter table public.training_progress alter column user_id type uuid using user_id::uuid;
    end if;
end $$;

-- 4. Create Tables (IF NOT EXISTS)
-- Training Flashcards
create table if not exists public.training_flashcards (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references public.training_modules(id) not null,
  front_content text not null,
  back_content text not null,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Training Questions
create table if not exists public.training_questions (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references public.training_modules(id) not null,
  question_text text not null,
  question_type text check (question_type in ('multiple_choice', 'true_false')) default 'multiple_choice',
  options jsonb not null,
  correct_answer text not null,
  explanation text,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Training Progress (Ensure column existence)
create table if not exists public.training_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  module_id text not null,
  lesson_id text,
  resource_type text default 'lesson',
  status text check (status in ('started', 'completed')) default 'started',
  quiz_score integer check (quiz_score >= 0 and quiz_score <= 100),
  quiz_passed boolean,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique(user_id, module_id, lesson_id, resource_type)
);

-- Add missing columns to training_progress if table existed safely
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'training_progress' and column_name = 'quiz_passed') then
        alter table public.training_progress add column quiz_passed boolean;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'training_progress' and column_name = 'resource_type') then
        alter table public.training_progress add column resource_type text default 'lesson';
    end if;
     if not exists (select 1 from information_schema.columns where table_name = 'training_progress' and column_name = 'lesson_id') then
        alter table public.training_progress add column lesson_id text;
    end if;
end $$;


-- Quiz Attempts
create table if not exists public.quiz_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  module_id text not null,
  attempt_number integer not null default 1,
  passed boolean default false,
  score integer,
  answers jsonb,
  completed_at timestamptz default now()
);

-- 5. Enable RLS
alter table public.training_flashcards enable row level security;
alter table public.training_questions enable row level security;
alter table public.training_progress enable row level security;
alter table public.quiz_attempts enable row level security;

-- 6. Create Policies (Robust casting)

-- Flashcards
drop policy if exists "Public read access for flashcards" on public.training_flashcards;
create policy "Public read access for flashcards" on public.training_flashcards for select using (true);

-- Questions
drop policy if exists "Public read access for questions" on public.training_questions;
create policy "Public read access for questions" on public.training_questions for select using (true);

-- Progress
-- Note: connecting auth.uid() (uuid) to user_id (uuid). 
-- If user_id is still text for some reason, we cast BOTH to text to be safe in the comparision, 
-- BUT optimal is UUID=UUID. 
-- We attempted to fix the column type above.
create policy "Users can view own training progress"
  on public.training_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own training progress"
  on public.training_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own training progress"
  on public.training_progress for update
  using (auth.uid() = user_id);

-- Quiz Attempts
create policy "Users can view own quiz attempts"
  on public.quiz_attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert own quiz attempts"
  on public.quiz_attempts for insert
  with check (auth.uid() = user_id);
