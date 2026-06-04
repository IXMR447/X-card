-- X-card 云存档数据库架构
-- 在 Supabase SQL Editor 中执行此文件
-- https://app.supabase.com/project/_/sql

-- 用户资料表
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 云存档表（每用户最多 3 个槽位）
create table if not exists public.save_slots (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  slot_index smallint not null check (slot_index between 0 and 2),
  game_state jsonb not null,
  character_name text not null,
  floor int not null,
  hp int not null,
  max_hp int not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, slot_index)
);

-- 收集进度表（每位用户一行）
create table if not exists public.collection_progress (
  user_id uuid references auth.users on delete cascade primary key,
  data jsonb not null default '{"characters":[],"cards":[],"enemies":[],"potions":[],"relics":[]}',
  updated_at timestamptz default now()
);

-- 启用行级安全
alter table public.profiles enable row level security;
alter table public.save_slots enable row level security;
alter table public.collection_progress enable row level security;

-- RLS 策略：用户只能访问自己的数据

-- profiles
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- save_slots
create policy "Users can read own saves"
  on public.save_slots for select using (auth.uid() = user_id);

create policy "Users can insert own saves"
  on public.save_slots for insert with check (auth.uid() = user_id);

create policy "Users can update own saves"
  on public.save_slots for update using (auth.uid() = user_id);

create policy "Users can delete own saves"
  on public.save_slots for delete using (auth.uid() = user_id);

-- collection_progress
create policy "Users can read own collection"
  on public.collection_progress for select using (auth.uid() = user_id);

create policy "Users can insert own collection"
  on public.collection_progress for insert with check (auth.uid() = user_id);

create policy "Users can update own collection"
  on public.collection_progress for update using (auth.uid() = user_id);
