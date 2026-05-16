-- ============================================================================
-- Mystery Engine — initial schema
-- ============================================================================
-- Creates sessions, players, messages, events tables.
-- Enables Realtime publications so all clients can subscribe.
-- Adds RLS policies that scope reads/writes to a session via a signed cookie
-- header (set by the Next.js server).
--
-- Apply with the Supabase CLI:
--   supabase db push        (local)
--   supabase db push --linked  (remote)
-- Or via the SQL editor in the Supabase dashboard.
-- ============================================================================

set search_path = public;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------

do $$ begin
  create type session_mode as enum ('solo', 'multi');
exception when duplicate_object then null; end $$;

do $$ begin
  create type session_status as enum ('lobby', 'in_progress', 'paused', 'finished');
exception when duplicate_object then null; end $$;

do $$ begin
  create type session_scene as enum (
    'lobby',
    'brief',
    'case_board',
    'interview',
    'phone_hack',
    'accusation',
    'reveal'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_role as enum ('user', 'assistant');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- sessions
-- ----------------------------------------------------------------------------

create table if not exists sessions (
  id                              uuid primary key default gen_random_uuid(),
  case_id                         text not null,
  case_version                    text not null,
  join_code                       text not null unique,
  mode                            session_mode not null,
  status                          session_status not null default 'lobby',
  current_scene                   session_scene not null default 'lobby',
  current_chapter_id              text,
  current_interviewer_player_id   uuid,
  current_interview_suspect_id    text,
  unlocked_evidence               text[] not null default '{}',
  presented_evidence_by_suspect   jsonb  not null default '{}'::jsonb,
  accusation_target_suspect_id    text,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),
  last_activity_at                timestamptz not null default now(),
  expires_at                      timestamptz not null default (now() + interval '7 days')
);

create index if not exists sessions_status_idx on sessions(status);
create index if not exists sessions_expires_at_idx on sessions(expires_at);

-- ----------------------------------------------------------------------------
-- players
-- ----------------------------------------------------------------------------

create table if not exists players (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references sessions(id) on delete cascade,
  name            text not null,
  seat_number     int  not null,
  is_host         boolean not null default false,
  is_observer     boolean not null default false,
  device_id       text not null,
  joined_at       timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),

  unique (session_id, seat_number),
  unique (session_id, device_id)
);

create index if not exists players_session_id_idx on players(session_id);

-- Now that players exists, link the FK on sessions.current_interviewer_player_id.
do $$ begin
  alter table sessions
    add constraint sessions_current_interviewer_fk
    foreign key (current_interviewer_player_id) references players(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- messages
-- ----------------------------------------------------------------------------

create table if not exists messages (
  id                      uuid primary key default gen_random_uuid(),
  session_id              uuid not null references sessions(id) on delete cascade,
  suspect_id              text not null,
  role                    message_role not null,
  content                 text not null default '',
  presented_evidence_id   text,
  asked_by_player_id      uuid references players(id) on delete set null,
  is_streaming            boolean not null default false,
  sequence                int not null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  unique (session_id, suspect_id, sequence)
);

create index if not exists messages_session_suspect_idx on messages(session_id, suspect_id, sequence);
create index if not exists messages_session_streaming_idx on messages(session_id) where is_streaming = true;

-- ----------------------------------------------------------------------------
-- events (append-only activity log)
-- ----------------------------------------------------------------------------

create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references sessions(id) on delete cascade,
  type         text not null,
  payload      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists events_session_id_idx on events(session_id, created_at);

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sessions_updated_at on sessions;
create trigger trg_sessions_updated_at
  before update on sessions
  for each row execute function set_updated_at();

drop trigger if exists trg_messages_updated_at on messages;
create trigger trg_messages_updated_at
  before update on messages
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Garbage collection helper (manual or scheduled)
-- ----------------------------------------------------------------------------

create or replace function gc_expired_sessions()
returns int language plpgsql as $$
declare
  deleted_count int;
begin
  delete from sessions where expires_at < now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- ----------------------------------------------------------------------------
-- Row-Level Security
-- ----------------------------------------------------------------------------
-- Strategy: the Next.js server holds the SUPABASE_SERVICE_ROLE_KEY and bypasses
-- RLS for trusted server-side mutations (API routes). Clients use the anon key
-- and read via a Postgres role that can only see rows belonging to the session
-- specified by a signed cookie/JWT claim `app.session_id` set by the server.
--
-- This migration sets up policies that read `current_setting('app.session_id')`
-- per request. The Next.js client SDK passes this as a custom header that the
-- Supabase Realtime / PostgREST layer maps to that setting.
-- ----------------------------------------------------------------------------

alter table sessions enable row level security;
alter table players  enable row level security;
alter table messages enable row level security;
alter table events   enable row level security;

-- Helper: returns the session id the caller is permitted to access.
create or replace function current_session_id()
returns uuid language sql stable as $$
  select nullif(current_setting('app.session_id', true), '')::uuid
$$;

-- Sessions: a client can SELECT their own session row.
drop policy if exists sessions_select_own on sessions;
create policy sessions_select_own on sessions
  for select using (id = current_session_id());

-- Players: a client can SELECT any player in their session.
drop policy if exists players_select_own_session on players;
create policy players_select_own_session on players
  for select using (session_id = current_session_id());

-- Messages: same.
drop policy if exists messages_select_own_session on messages;
create policy messages_select_own_session on messages
  for select using (session_id = current_session_id());

-- Events: same.
drop policy if exists events_select_own_session on events;
create policy events_select_own_session on events
  for select using (session_id = current_session_id());

-- INSERT/UPDATE/DELETE policies are intentionally NOT created for the anon role:
-- all mutations must go through Next.js API routes using the service-role key.
-- This keeps game logic and validation centralised on the server.

-- ----------------------------------------------------------------------------
-- Realtime publications
-- ----------------------------------------------------------------------------
-- Add tables to the supabase_realtime publication so clients receive
-- postgres_changes events.

do $$ begin
  alter publication supabase_realtime add table sessions;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table players;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table events;
exception when duplicate_object then null; end $$;

-- ============================================================================
-- End of migration 0001_initial.sql
-- ============================================================================
