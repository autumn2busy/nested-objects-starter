-- Enable UUID extension (usually enabled by default in Supabase)
create extension if not exists "uuid-ossp";

-- 0. Training Modules Table
create table if not exists public.training_modules (
  id uuid default uuid_generate_v4() primary key,
  module_number integer not null,
  title text not null,
  description text,
  icon text, -- Storage for emoji or icon name
  estimated_hours numeric,
  created_at timestamptz default now()
);

-- 1. Training Lessons Table
create table if not exists public.training_lessons (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references public.training_modules(id) not null,
  lesson_number integer not null,
  title text not null,
  content text, -- Main text content (Markdown)
  content_type text check (content_type in ('video', 'text', 'pdf', 'audio', 'mixed')) default 'text',
  video_url text, -- YouTube or other embed URL
  audio_url text, -- URL to audio file
  estimated_minutes integer,
  created_at timestamptz default now()
);

-- 2. Training Resources Table (Visual Library)
create table if not exists public.training_resources (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references public.training_modules(id) not null,
  lesson_id uuid references public.training_lessons(id), -- Optional link to specific lesson
  title text not null,
  description text,
  file_path text not null,
  file_type text,
  created_at timestamptz default now()
);

-- 3. Training Progress Table
create table if not exists public.training_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  module_id text not null, -- Keeping as text for flexibility, though FK to training_modules is better strict practice
  lesson_id text, -- Added to track granular lesson progress
  resource_type text default 'lesson', -- 'lesson' or 'quiz'
  status text check (status in ('started', 'completed')) default 'started',
  quiz_score integer check (quiz_score >= 0 and quiz_score <= 100),
  completed_at timestamptz,
  updated_at timestamptz default now(),
  
  -- Unique constraint to prevent duplicate rows per item per user
  unique(user_id, module_id, lesson_id, resource_type)
);

-- 4. Row Level Security (RLS)
alter table public.training_modules enable row level security;
alter table public.training_lessons enable row level security;
alter table public.training_resources enable row level security;
alter table public.training_progress enable row level security;

-- Public Read Access for Content
create policy "Public read access for modules" on public.training_modules for select using (true);
create policy "Public read access for lessons" on public.training_lessons for select using (true);
create policy "Public read access for resources" on public.training_resources for select using (true);

-- User Specific Access for Progress
create policy "Users can view own training progress"
  on public.training_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own training progress"
  on public.training_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own training progress"
  on public.training_progress for update
  using (auth.uid() = user_id);

-- 5. Trigger to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_training_progress_updated_at
before update on public.training_progress
for each row execute function update_updated_at_column();
