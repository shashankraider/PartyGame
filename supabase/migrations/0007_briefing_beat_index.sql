-- ============================================================================
-- Phase 2j (Swing #1) — Briefing beat index
-- ============================================================================
-- Adds a cursor tracking which beat within a Briefing chapter is currently on
-- screen. Realtime fans the row update to every TV + phone so they stay in
-- sync. Null outside the Briefing phase; set to 0 on Briefing entry.
-- ============================================================================

set search_path = public;

alter table sessions
  add column if not exists current_beat_index integer;

-- Existing in-progress briefing sessions re-render from beat 0 (safest reset).
update sessions
  set current_beat_index = 0
  where phase = 'briefing' and current_chapter_id is not null;

comment on column sessions.current_beat_index is
  'Beat cursor within the current briefing chapter. Null outside briefing.';
