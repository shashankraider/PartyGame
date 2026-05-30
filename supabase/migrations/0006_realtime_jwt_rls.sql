-- ============================================================================
-- Mystery Engine — Phase 2h: Realtime JWT-based session scoping
-- ============================================================================
-- Existing RLS policies (added in 0001) read the session id from a Postgres
-- GUC, `current_setting('app.session_id')`. That works for PostgREST requests
-- that set the GUC per-connection, but Supabase Realtime uses a different
-- transport (Phoenix channels) and exposes the verified JWT via the
-- `auth.jwt()` function instead of GUCs.
--
-- This migration teaches `current_session_id()` to read the session id from
-- either source:
--   1. `auth.jwt() ->> 'session_id'` — set by short-lived JWTs minted by the
--      Next.js server for Realtime clients (Phase 2h).
--   2. `current_setting('app.session_id', true)` — the original PostgREST
--      path, preserved for any cookie/header-based callers we still have.
--
-- The RLS policies on sessions/players/messages/events/accusation_votes/
-- interview_unlock_state from 0001/0002/0004 do NOT need to change; they
-- already call `current_session_id()`, which now resolves either way.
-- ============================================================================

set search_path = public;

-- Update the helper. Tries JWT claim first (Realtime path), falls back to GUC
-- (PostgREST path). `auth.jwt()` is provided by Supabase's auth schema; it
-- returns NULL when no JWT is present, so the COALESCE short-circuits safely.
create or replace function current_session_id()
returns uuid language sql stable as $$
  select coalesce(
    nullif(auth.jwt() ->> 'session_id', '')::uuid,
    nullif(current_setting('app.session_id', true), '')::uuid
  )
$$;
