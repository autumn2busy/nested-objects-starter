-- Create a table to track AI usage per user per feature
create table if not exists ai_usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id text not null, -- Outseta user ID or Supabase auth ID
  feature text not null, -- 'ai_concierge', 'ai_resume'
  created_at timestamptz default now() not null
);

-- Index for faster queries on user usage
create index if not exists ai_usage_logs_user_feature_idx on ai_usage_logs (user_id, feature, created_at);

-- RLS policies (optional, but good practice if exposed to client, though this is server-only for now)
alter table ai_usage_logs enable row level security;

-- Only service role can insert/read for now (server-side tracking)
create policy "Service role can do everything on ai_usage_logs"
  on ai_usage_logs
  using (true)
  with check (true);
