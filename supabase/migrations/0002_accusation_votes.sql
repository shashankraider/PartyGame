-- ============================================================================
-- Mystery Engine — accusation votes
-- ============================================================================
-- Each detective casts at most one accusation per session. Stored as upserts
-- keyed on (session_id, player_id). The TV reads the tally; phones read the
-- player's own current vote.
-- ============================================================================

set search_path = public;

create table if not exists accusation_votes (
  session_id   uuid not null references sessions(id) on delete cascade,
  player_id    uuid not null references players(id) on delete cascade,
  suspect_id   text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  primary key (session_id, player_id)
);

create index if not exists accusation_votes_session_idx on accusation_votes(session_id);

drop trigger if exists trg_accusation_votes_updated_at on accusation_votes;
create trigger trg_accusation_votes_updated_at
  before update on accusation_votes
  for each row execute function set_updated_at();

alter table accusation_votes enable row level security;

drop policy if exists accusation_votes_select_own_session on accusation_votes;
create policy accusation_votes_select_own_session on accusation_votes
  for select using (session_id = current_session_id());

do $$ begin
  alter publication supabase_realtime add table accusation_votes;
exception when duplicate_object then null; end $$;
