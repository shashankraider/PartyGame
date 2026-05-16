-- ============================================================================
-- Mystery Engine — interview unlock state
-- ============================================================================
-- The Phase 2g adjudicator tracks, per (session, suspect, condition), how many
-- adjudicator attempts have been made and what the highest seen adjacency was.
-- When attempts > hostFallbackAfterTurns without firing, the host TV view is
-- prompted to manually reveal.
--
-- condition_id is composite:
--   "secret:<secret-id>"          — for Secret unlocks
--   "breaking-point:<bp-id>"      — for BreakingPoint unlocks
--   "evidence:<evidence-id>"      — for dynamic Evidence unlocks
-- ============================================================================

set search_path = public;

create table if not exists interview_unlock_state (
  session_id        uuid not null references sessions(id) on delete cascade,
  suspect_id        text not null,
  condition_id      text not null,
  attempts          int  not null default 0,
  pressure_count    int  not null default 0,
  max_adjacency     real not null default 0,
  last_reason       text,
  last_evaluated_at timestamptz not null default now(),
  met_at            timestamptz,
  met_via           text check (met_via in ('adjudicator', 'host', 'evidence-only')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  primary key (session_id, suspect_id, condition_id)
);

create index if not exists interview_unlock_state_session_idx on interview_unlock_state(session_id);
create index if not exists interview_unlock_state_pending_idx on interview_unlock_state(session_id, suspect_id) where met_at is null;

drop trigger if exists trg_interview_unlock_state_updated_at on interview_unlock_state;
create trigger trg_interview_unlock_state_updated_at
  before update on interview_unlock_state
  for each row execute function set_updated_at();

alter table interview_unlock_state enable row level security;

drop policy if exists interview_unlock_state_select_own_session on interview_unlock_state;
create policy interview_unlock_state_select_own_session on interview_unlock_state
  for select using (session_id = current_session_id());

do $$ begin
  alter publication supabase_realtime add table interview_unlock_state;
exception when duplicate_object then null; end $$;
