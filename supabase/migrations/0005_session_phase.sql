-- ============================================================================
-- Phase 2i.2 — session phase state machine
-- ============================================================================
-- Adds a coarse game phase separate from the legacy chapter pointer. Round 1
-- remains the Briefing chapter walk; rounds 2/3/4 collapse into Interrogation
-- until the host transitions to Accusation and then Reveal.
-- ============================================================================

set search_path = public;

do $$ begin
  create type session_phase as enum (
    'briefing',
    'interrogation',
    'accusation',
    'reveal'
  );
exception when duplicate_object then null; end $$;

alter table sessions
  add column if not exists phase session_phase not null default 'briefing';

create index if not exists sessions_phase_idx on sessions(phase);
