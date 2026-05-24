/**
 * Phase 2i.5 — pure helpers for the TV Case Status panel.
 * Formats `interview.host_judgment` events only; adjudicator verdicts stay hidden.
 */

export const HOST_JUDGMENT_EVENT_TYPE = "interview.host_judgment";

/** Shown before any host-judgment event exists for the session. */
export const CASE_STATUS_IDLE_PLACEHOLDER = "Watching the room…";

/** Fallback when a do-nothing verdict has no usable reason string. */
export const CASE_STATUS_DO_NOTHING_FALLBACK = "Watching the room…";

export type HostJudgmentEventRow = {
  id: string;
  session_id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export function sortEventsByCreatedAtDesc<T extends { created_at: string }>(events: T[]): T[] {
  return [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function pickMostRecentHostJudgmentEvent(
  events: HostJudgmentEventRow[],
): HostJudgmentEventRow | null {
  const hostJudgments = events.filter((event) => event.type === HOST_JUDGMENT_EVENT_TYPE);
  if (hostJudgments.length === 0) {
    return null;
  }
  return sortEventsByCreatedAtDesc(hostJudgments)[0] ?? null;
}

export function formatHostJudgmentEvent(event: HostJudgmentEventRow | null): string {
  if (!event) {
    return CASE_STATUS_IDLE_PLACEHOLDER;
  }

  const payload = event.payload ?? {};
  const action = typeof payload.action === "string" ? payload.action : null;
  const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";

  if (reason) {
    return reason;
  }

  if (action === "do-nothing") {
    return CASE_STATUS_DO_NOTHING_FALLBACK;
  }

  return CASE_STATUS_IDLE_PLACEHOLDER;
}

/** Pick the newest host-judgment event and format it for the TV status line. */
export function resolveCaseStatusLine(events: HostJudgmentEventRow[]): string {
  return formatHostJudgmentEvent(pickMostRecentHostJudgmentEvent(events));
}
