/**
 * Phase 2i.5 — unit coverage for Case Status panel formatting helpers.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  CASE_STATUS_DO_NOTHING_FALLBACK,
  CASE_STATUS_IDLE_PLACEHOLDER,
  formatHostJudgmentEvent,
  pickMostRecentHostJudgmentEvent,
  resolveCaseStatusLine,
  HOST_JUDGMENT_EVENT_TYPE,
} from "../src/lib/case-status.ts";

function makeEvent(overrides = {}) {
  return {
    id: "evt-1",
    session_id: "sess-1",
    type: HOST_JUDGMENT_EVENT_TYPE,
    payload: { action: "do-nothing", reason: "Three suspects have opened up." },
    created_at: "2026-05-22T12:00:00.000Z",
    ...overrides,
  };
}

describe("case status — resolveCaseStatusLine", () => {
  test("empty events list returns the idle placeholder", () => {
    assert.equal(resolveCaseStatusLine([]), CASE_STATUS_IDLE_PLACEHOLDER);
    assert.equal(formatHostJudgmentEvent(null), CASE_STATUS_IDLE_PLACEHOLDER);
  });

  test("malformed payload never throws and returns a safe fallback", () => {
    assert.doesNotThrow(() => {
      assert.equal(
        formatHostJudgmentEvent(makeEvent({ payload: {} })),
        CASE_STATUS_IDLE_PLACEHOLDER,
      );
      assert.equal(
        formatHostJudgmentEvent(makeEvent({ payload: { action: "do-nothing" } })),
        CASE_STATUS_DO_NOTHING_FALLBACK,
      );
      assert.equal(
        formatHostJudgmentEvent(makeEvent({ payload: null })),
        CASE_STATUS_IDLE_PLACEHOLDER,
      );
    });
  });

  test("multiple events pick the most recent by created_at", () => {
    const events = [
      makeEvent({
        id: "older",
        payload: { reason: "Older update." },
        created_at: "2026-05-22T11:00:00.000Z",
      }),
      makeEvent({
        id: "newer",
        payload: { reason: "Forensic update incoming — second anonymous letter." },
        created_at: "2026-05-22T12:30:00.000Z",
      }),
    ];

    const picked = pickMostRecentHostJudgmentEvent(events);
    assert.equal(picked?.id, "newer");
    assert.equal(
      resolveCaseStatusLine(events),
      "Forensic update incoming — second anonymous letter.",
    );
  });

  test("do-nothing verdict renders reason when present, otherwise the low-key fallback", () => {
    assert.equal(
      formatHostJudgmentEvent(
        makeEvent({
          payload: {
            action: "do-nothing",
            reason: "Thakur thread surfacing.",
          },
        }),
      ),
      "Thakur thread surfacing.",
    );
    assert.equal(
      formatHostJudgmentEvent(
        makeEvent({
          payload: { action: "do-nothing", reason: "   " },
        }),
      ),
      CASE_STATUS_DO_NOTHING_FALLBACK,
    );
  });

  test("ignores non-host-judgment event types", () => {
    const events = [
      makeEvent({
        type: "interview.unlock_fired",
        payload: { reason: "Should not appear." },
        created_at: "2026-05-22T13:00:00.000Z",
      }),
      makeEvent({
        id: "host",
        payload: { reason: "Visible host reasoning." },
        created_at: "2026-05-22T12:00:00.000Z",
      }),
    ];

    assert.equal(resolveCaseStatusLine(events), "Visible host reasoning.");
  });
});
