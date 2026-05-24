/**
 * Phase 2i.5 — unit coverage for session events query helpers + route error mapping.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  applySessionEventsQuery,
  capSessionEvents,
  filterSessionEventsByType,
  MAX_SESSION_EVENTS,
} from "../src/lib/session-events.ts";
import { getSessionEvents, SessionStoreError } from "../src/lib/session-store.ts";
import { hasSupabaseServerEnv } from "../src/lib/supabase.ts";

function makeEvent(id, type, createdAt) {
  return {
    id,
    session_id: "sess-1",
    type,
    payload: {},
    created_at: createdAt,
  };
}

describe("session events — query helpers", () => {
  test("empty session returns an empty array via applySessionEventsQuery", () => {
    assert.deepEqual(applySessionEventsQuery([]), []);
    assert.deepEqual(filterSessionEventsByType([], "interview.host_judgment"), []);
  });

  test("?type=interview.host_judgment filters correctly", () => {
    const events = [
      makeEvent("1", "interview.host_judgment", "2026-05-22T12:00:00.000Z"),
      makeEvent("2", "interview.unlock_fired", "2026-05-22T12:01:00.000Z"),
      makeEvent("3", "interview.host_judgment", "2026-05-22T12:02:00.000Z"),
    ];

    const filtered = applySessionEventsQuery(events, { type: "interview.host_judgment" });
    assert.equal(filtered.length, 2);
    assert.ok(filtered.every((event) => event.type === "interview.host_judgment"));
    assert.equal(filtered[0]?.id, "3");
  });

  test("result count is capped at 20 even when more exist", () => {
    const events = Array.from({ length: 25 }, (_, index) =>
      makeEvent(
        `evt-${index}`,
        "interview.host_judgment",
        `2026-05-22T12:${String(index).padStart(2, "0")}:00.000Z`,
      ),
    );

    const capped = capSessionEvents(events, MAX_SESSION_EVENTS);
    assert.equal(capped.length, 20);
    assert.equal(applySessionEventsQuery(events, { type: "interview.host_judgment" }).length, 20);
  });
});

describe("session events — getSessionEvents", () => {
  test("nonexistent session id returns session_not_found (404)", async (t) => {
    if (!hasSupabaseServerEnv()) {
      t.skip("Supabase server env not configured");
      return;
    }

    await assert.rejects(
      () => getSessionEvents("00000000-0000-4000-8000-000000000099"),
      (error) =>
        error instanceof SessionStoreError &&
        error.code === "session_not_found" &&
        error.status === 404,
    );
  });
});

describe("session events — route handler status mapping", () => {
  test("SessionStoreError surfaces the configured HTTP status for routes", () => {
    const notFound = new SessionStoreError("session_not_found", "Session not found", 404);
    assert.equal(notFound.status, 404);
  });
});
