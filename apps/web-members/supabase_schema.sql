-- Enable UUID extension (usually enabled by default in Supabase)
create extension if not exists "uuid-ossp";

-- 1. Training Progress Table
create table if not exists public.training_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  module_id text not null,
  status text check (status in ('started', 'completed')) default 'started',
  quiz_score integer check (quiz_score >= 0 and quiz_score <= 100),
  completed_at timestamptz,
  updated_at timestamptz default now(),
  
  -- Unique constraint to prevent duplicate rows per module per user
  unique(user_id, module_id)
);

-- 2. Row Level Security (RLS)
alter table public.training_progress enable row level security;

-- Policy: Users can view their own progress
create policy "Users can view own training progress"
  on public.training_progress for select
  using (auth.uid() = user_id);

-- Policy: Users can insert/update their own progress
create policy "Users can update own training progress"
  on public.training_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can modify own training progress"
  on public.training_progress for update
  using (auth.uid() = user_id);

-- 3. Trigger to update updated_at
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
