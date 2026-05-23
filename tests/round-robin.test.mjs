/**
 * Phase 2i.4 — Unit tests for src/lib/round-robin.ts.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  countQuestionsInCurrentStretch,
  getQuestionsPerDetective,
  listRotatingDetectives,
  pickNextInterviewer,
  shouldRotateAfterQuestion,
} from "../src/lib/round-robin.ts";

function detective(id, seat) {
  return { id, seat_number: seat, is_observer: false, name: `Detective ${seat}` };
}

function observer(id, seat) {
  return { id, seat_number: seat, is_observer: true, name: `Observer ${seat}` };
}

describe("round-robin — pickNextInterviewer", () => {
  test("6 detectives wrap seat 1 → 2 → 3 → … → 6 → 1", () => {
    const players = [
      detective("d1", 1),
      detective("d2", 2),
      detective("d3", 3),
      detective("d4", 4),
      detective("d5", 5),
      detective("d6", 6),
    ];

    assert.equal(pickNextInterviewer(players, "d1", 1), "d2");
    assert.equal(pickNextInterviewer(players, "d2", 1), "d3");
    assert.equal(pickNextInterviewer(players, "d3", 1), "d4");
    assert.equal(pickNextInterviewer(players, "d4", 1), "d5");
    assert.equal(pickNextInterviewer(players, "d5", 1), "d6");
    assert.equal(pickNextInterviewer(players, "d6", 1), "d1");
  });

  test("3 detectives + 1 observer: observer is never selected", () => {
    const players = [
      detective("d1", 1),
      detective("d2", 2),
      observer("o1", 3),
      detective("d3", 4),
    ];

    const rotating = listRotatingDetectives(players);
    assert.deepEqual(
      rotating.map((player) => player.id),
      ["d1", "d2", "d3"],
    );
    assert.equal(pickNextInterviewer(players, "d1", 1), "d2");
    assert.equal(pickNextInterviewer(players, "d3", 1), "d1");
    assert.ok(!rotating.some((player) => player.id === "o1"));
  });

  test("1 detective: returns the same detective", () => {
    const players = [detective("solo", 1)];
    assert.equal(pickNextInterviewer(players, "solo", 1), "solo");
  });

  test("0 detectives: returns null", () => {
    assert.equal(pickNextInterviewer([], null, 1), null);
    assert.equal(pickNextInterviewer([observer("o1", 1)], null, 1), null);
  });
});

describe("round-robin — rotation cap", () => {
  test("custom questionsPerDetective: 1 rotates every single question", () => {
    assert.equal(shouldRotateAfterQuestion(1, 1, 3), true);
    assert.equal(shouldRotateAfterQuestion(0, 1, 3), false);
  });

  test("default cap of 3 does not rotate until the third question", () => {
    assert.equal(shouldRotateAfterQuestion(2, 3, 3), false);
    assert.equal(shouldRotateAfterQuestion(3, 3, 3), true);
  });

  test("single detective never rotates", () => {
    assert.equal(shouldRotateAfterQuestion(99, 3, 1), false);
  });
});

describe("round-robin — stretch counting resets on manual override", () => {
  test("trailing count only includes the current interviewer's consecutive questions", () => {
    const suspectId = "naina";
    const afterManualPass = [
      { role: "user", suspect_id: suspectId, asked_by_player_id: "a" },
      { role: "user", suspect_id: suspectId, asked_by_player_id: "a" },
      { role: "user", suspect_id: suspectId, asked_by_player_id: "b" },
    ];

    assert.equal(countQuestionsInCurrentStretch(afterManualPass, suspectId, "a"), 0);
    assert.equal(countQuestionsInCurrentStretch(afterManualPass, suspectId, "b"), 1);

    const afterPassBack = [
      ...afterManualPass,
      { role: "user", suspect_id: suspectId, asked_by_player_id: "a" },
    ];
    assert.equal(countQuestionsInCurrentStretch(afterPassBack, suspectId, "a"), 1);
    assert.equal(countQuestionsInCurrentStretch(afterPassBack, suspectId, "b"), 0);
  });
});

describe("round-robin — getQuestionsPerDetective", () => {
  test("defaults to 3 when rules are omitted", () => {
    assert.equal(getQuestionsPerDetective({}), 3);
    assert.equal(getQuestionsPerDetective({ rules: undefined }), 3);
  });

  test("honours case.rules.questionsPerDetective when set", () => {
    assert.equal(getQuestionsPerDetective({ rules: { questionsPerDetective: 5 } }), 5);
  });
});
