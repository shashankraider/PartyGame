-- ============================================================================
-- Mystery Engine — add 'system' to the message_role enum
-- ============================================================================
-- Phase 2g introduces a third role for messages: 'system'. The engine writes a
-- system message when an unlock fires during a live interview (e.g., "Naina
-- opens up about her work on Rhea"). The phone and TV transcript renderers
-- display system messages distinctly from user/assistant turns.
--
-- Postgres enum additions cannot run inside a transaction, so this migration
-- intentionally contains only the ALTER TYPE call. The new
-- interview_unlock_state table lives in 0004_interview_unlock_state.sql.
-- ============================================================================

set search_path = public;

alter type message_role add value if not exists 'system';
