create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  focus_score integer not null default 75,
  xp integer not null default 0,
  level integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  duration_minutes integer not null,
  completed_minutes integer not null default 0,
  completed_seconds integer not null default 0,
  status text not null default 'planned',
  xp_awarded integer not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_apps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  app_name text not null,
  category text not null default 'other',
  is_blocked boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  app_name text not null,
  category text not null default 'neutral',
  minutes integer not null,
  logged_at timestamptz not null default now()
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  week_start date not null,
  metrics jsonb not null default '{}',
  ai_summary text not null
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text not null default '',
  xp_required integer not null default 0
);

create table if not exists public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  current_count integer not null default 0,
  longest_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reward_type text not null,
  amount integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.blocked_apps enable row level security;
alter table public.usage_logs enable row level security;
alter table public.ai_insights enable row level security;
alter table public.weekly_reports enable row level security;
alter table public.streaks enable row level security;
alter table public.rewards enable row level security;
alter table public.activity_logs enable row level security;

create policy "Users manage own profile" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users manage own focus data" on public.focus_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own blocked apps" on public.blocked_apps
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own usage logs" on public.usage_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own ai insights" on public.ai_insights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own reports" on public.weekly_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own streaks" on public.streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own rewards" on public.rewards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own activity logs" on public.activity_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create unique index if not exists blocked_apps_user_app_name_key
  on public.blocked_apps (user_id, lower(app_name));

create unique index if not exists weekly_reports_user_week_start_key
  on public.weekly_reports (user_id, week_start);

create index if not exists activity_logs_user_created_at_idx
  on public.activity_logs (user_id, created_at desc);
