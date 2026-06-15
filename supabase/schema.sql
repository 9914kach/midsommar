-- Users
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  created_at timestamptz default now()
);

-- Official day-long teams (randomized once, persistent)
create table if not exists official_teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  color text not null default '#2d6a1f',
  emoji text not null default '🌿',
  created_at timestamptz default now()
);

-- Each user belongs to exactly one official team
create table if not exists official_team_members (
  user_id uuid references users(id) on delete cascade,
  team_id uuid references official_teams(id) on delete cascade,
  primary key (user_id)
);

-- Tournaments (beer pong, kubb, etc.)
create table if not exists tournaments (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  game text not null,
  format text not null check (format in ('bracket', 'round_robin', 'free')),
  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  created_at timestamptz default now()
);

-- Teams per tournament (may link to an official team)
create table if not exists tournament_teams (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments(id) on delete cascade,
  name text not null,
  color text,
  official_team_id uuid references official_teams(id) on delete set null,
  points int not null default 0
);

-- Members per tournament team
create table if not exists tournament_team_members (
  tournament_team_id uuid references tournament_teams(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  primary key (tournament_team_id, user_id)
);

-- Matches
create table if not exists matches (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments(id) on delete cascade,
  team_a_id uuid references tournament_teams(id),
  team_b_id uuid references tournament_teams(id),
  score_a int not null default 0,
  score_b int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed')),
  round int not null default 1,
  bracket_position int,
  created_at timestamptz default now()
);

-- RLS: allow anon read/write (private party app, password-gated at app level)
alter table users enable row level security;
alter table official_teams enable row level security;
alter table official_team_members enable row level security;
alter table tournaments enable row level security;
alter table tournament_teams enable row level security;
alter table tournament_team_members enable row level security;
alter table matches enable row level security;

create policy "public read" on users for select using (true);
create policy "public insert" on users for insert with check (true);

create policy "public read" on official_teams for select using (true);
create policy "public insert" on official_teams for insert with check (true);
create policy "public update" on official_teams for update using (true);

create policy "public read" on official_team_members for select using (true);
create policy "public insert" on official_team_members for insert with check (true);
create policy "public delete" on official_team_members for delete using (true);

create policy "public read" on tournaments for select using (true);
create policy "public insert" on tournaments for insert with check (true);
create policy "public update" on tournaments for update using (true);

create policy "public read" on tournament_teams for select using (true);
create policy "public insert" on tournament_teams for insert with check (true);
create policy "public update" on tournament_teams for update using (true);
create policy "public delete" on tournament_teams for delete using (true);

create policy "public read" on tournament_team_members for select using (true);
create policy "public insert" on tournament_team_members for insert with check (true);
create policy "public delete" on tournament_team_members for delete using (true);

create policy "public read" on matches for select using (true);
create policy "public insert" on matches for insert with check (true);
create policy "public update" on matches for update using (true);
