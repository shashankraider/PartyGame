/**
 * Phase 2i.5 — session event query helpers (pure + shared constants).
 */

export const MAX_SESSION_EVENTS = 20;

export type SessionEventRow = {
  id: string;
  session_id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export function filterSessionEventsByType(
  events: SessionEventRow[],
  type?: string | null,
): SessionEventRow[] {
  if (!type) {
    return events;
  }
  return events.filter((event) => event.type === type);
}

export function capSessionEvents(
  events: SessionEventRow[],
  limit = MAX_SESSION_EVENTS,
): SessionEventRow[] {
  return events.slice(0, Math.max(0, limit));
}

export function sortSessionEventsNewestFirst(events: SessionEventRow[]): SessionEventRow[] {
  return [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/**
 * Post-processes rows returned from Supabase (already ordered/limit-scoped in SQL).
 * Exported for unit tests when the route handler is not imported directly.
 */
export function applySessionEventsQuery(
  events: SessionEventRow[],
  options: { type?: string | null; limit?: number } = {},
): SessionEventRow[] {
  const limit = options.limit ?? MAX_SESSION_EVENTS;
  const sorted = sortSessionEventsNewestFirst(events);
  const filtered = filterSessionEventsByType(sorted, options.type);
  return capSessionEvents(filtered, limit);
}
