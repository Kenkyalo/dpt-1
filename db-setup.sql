-- ============================================================
-- DPT — Complete Database Setup
-- Run this in Supabase SQL Editor (once)
-- ============================================================

-- PROFILES
create table if not exists profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid unique references auth.users(id) on delete cascade,
  name          text,
  business_name text,
  sector        text,
  location      text,
  description   text,
  language      text default 'en',
  platforms     text[] default '{}',
  has_onboarded boolean default false,
  last_login    timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- PLATFORM CONNECTIONS (OAuth tokens)
create table if not exists platform_connections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  platform      text not null,
  access_token  text,
  refresh_token text,
  expires_at    timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(user_id, platform)
);

-- SCORES
create table if not exists scores (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade,
  score            int not null default 0,
  grade            text,
  profile_complete int default 0,
  post_freq        int default 0,
  engagement       int default 0,
  responsiveness   int default 0,
  platform_count   int default 0,
  platforms        text[] default '{}',
  source           text default 'manual',
  created_at       timestamptz default now()
);

-- RECOMMENDATIONS
create table if not exists recommendations (
  id        uuid primary key default gen_random_uuid(),
  score_id  uuid references scores(id) on delete cascade,
  icon      text,
  priority  text default 'MEDIUM',
  title_en  text,
  title_sw  text,
  desc_en   text,
  desc_sw   text,
  created_at timestamptz default now()
);

-- INTEGRATIONS (raw platform data cache)
create table if not exists integrations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  platform   text not null,
  raw_data   jsonb default '{}',
  synced_at  timestamptz default now(),
  unique(user_id, platform)
);

-- LDVS_SCORES (detailed score view — same as scores but with more fields)
create table if not exists ldvs_scores (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade,
  score            int,
  grade            text,
  profile_complete int,
  post_freq        int,
  engagement       int,
  responsiveness   int,
  platform_count   int,
  created_at       timestamptz default now()
);

-- SESSIONS
create table if not exists sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- SYNC LOGS
create table if not exists sync_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  platform   text,
  status     text,
  message    text,
  created_at timestamptz default now()
);

-- USER DASHBOARD VIEW
create or replace view user_dashboard as
select
  u.id as user_id,
  p.business_name,
  p.sector,
  p.location,
  p.language,
  p.has_onboarded,
  (select score from scores s where s.user_id = u.id order by created_at desc limit 1) as latest_score,
  (select grade from scores s where s.user_id = u.id order by created_at desc limit 1) as latest_grade,
  (select count(*) from scores s where s.user_id = u.id) as total_scores,
  (select count(*) from platform_connections pc where pc.user_id = u.id) as connected_platforms
from auth.users u
left join profiles p on p.user_id = u.id;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — VERY IMPORTANT
-- Users can only see and edit their own data
-- ============================================================

alter table profiles              enable row level security;
alter table platform_connections  enable row level security;
alter table scores                enable row level security;
alter table recommendations       enable row level security;
alter table integrations          enable row level security;
alter table ldvs_scores           enable row level security;
alter table sessions              enable row level security;
alter table sync_logs             enable row level security;

-- PROFILES policies
create policy "Users can view own profile"   on profiles for select using (auth.uid() = user_id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = user_id);
create policy "Users can delete own profile" on profiles for delete using (auth.uid() = user_id);

-- PLATFORM CONNECTIONS policies
create policy "Users can view own connections"   on platform_connections for select using (auth.uid() = user_id);
create policy "Users can insert own connections" on platform_connections for insert with check (auth.uid() = user_id);
create policy "Users can update own connections" on platform_connections for update using (auth.uid() = user_id);
create policy "Users can delete own connections" on platform_connections for delete using (auth.uid() = user_id);

-- SCORES policies
create policy "Users can view own scores"   on scores for select using (auth.uid() = user_id);
create policy "Users can insert own scores" on scores for insert with check (auth.uid() = user_id);
create policy "Users can delete own scores" on scores for delete using (auth.uid() = user_id);

-- RECOMMENDATIONS policies
create policy "Users can view own recs" on recommendations for select
  using (score_id in (select id from scores where user_id = auth.uid()));
create policy "Users can insert own recs" on recommendations for insert
  with check (score_id in (select id from scores where user_id = auth.uid()));
create policy "Users can delete own recs" on recommendations for delete
  using (score_id in (select id from scores where user_id = auth.uid()));

-- INTEGRATIONS policies
create policy "Users can view own integrations"   on integrations for select using (auth.uid() = user_id);
create policy "Users can insert own integrations" on integrations for insert with check (auth.uid() = user_id);
create policy "Users can update own integrations" on integrations for update using (auth.uid() = user_id);
create policy "Users can delete own integrations" on integrations for delete using (auth.uid() = user_id);

-- LDVS SCORES policies
create policy "Users can view own ldvs"   on ldvs_scores for select using (auth.uid() = user_id);
create policy "Users can insert own ldvs" on ldvs_scores for insert with check (auth.uid() = user_id);

-- SYNC LOGS policies
create policy "Users can view own logs" on sync_logs for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on sync_logs for insert with check (auth.uid() = user_id);
