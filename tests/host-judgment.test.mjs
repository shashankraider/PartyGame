/**
 * Phase 2i.1 — Unit tests for src/lib/host-judgment.ts.
 *
 * Covers the four mandatory cases from the brief:
 *   1. JSON-parse fallback when the LLM returns prose-wrapped JSON.
 *   2. judgeHostAction throws HostJudgmentError code="missing_api_key" when
 *      OPENROUTER_API_KEY is missing.
 *   3. Short-circuit verdict when anonymous-letter-2 is already in
 *      session.unlocked_evidence.
 *   4. Verdict shape: drop-evidence verdicts carry evidenceId and reason.
 *
 * Pure-helper coverage: parseHostJudgmentVerdict, alreadyUnlockedVerdict,
 * buildHostSystemPrompt, buildHostUserPrompt.
 *
 * Run via `npm test` (tsx --test resolves the @/ alias in the SUT).
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  HOST_JUDGMENT_TARGET_EVIDENCE_ID,
  HostJudgmentError,
  alreadyUnlockedVerdict,
  buildHostSystemPrompt,
  buildHostUserPrompt,
  getHostEvidenceCandidates,
  judgeHostAction,
  parseHostJudgmentVerdict,
} from "../src/lib/host-judgment.ts";

describe("host-judgment — parseHostJudgmentVerdict", () => {
  test("parses strict JSON into a do-nothing verdict", () => {
    const raw = JSON.stringify({
      action: "do-nothing",
      reason: "Not enough suspects have opened up yet.",
      confidence: 0.4,
    });
    const v = parseHostJudgmentVerdict(raw);
    assert.equal(v.action, "do-nothing");
    assert.equal(v.reason, "Not enough suspects have opened up yet.");
    assert.equal(v.confidence, 0.4);
    assert.equal(v.evidenceId, undefined);
  });

  test("parses strict JSON into a drop-evidence verdict (case 4: verdict shape)", () => {
    const raw = JSON.stringify({
      action: "drop-evidence",
      evidenceId: "anonymous-letter-2",
      reason: "Three suspects opened up and Thakurs mentioned twice.",
      confidence: 0.9,
    });
    const v = parseHostJudgmentVerdict(raw);
    assert.equal(v.action, "drop-evidence");
    assert.equal(v.evidenceId, "anonymous-letter-2");
    assert.ok(v.reason.length > 0, "drop-evidence verdicts must have a non-empty reason");
    assert.equal(v.confidence, 0.9);
  });

  test("case 1: JSON-parse fallback when the LLM returns prose-wrapped JSON", () => {
    // Real-world: cheaper models sometimes emit prose around the JSON.
    const raw = `Sure! Based on the transcripts, here's my verdict:\n\n\`\`\`json\n{ "action": "do-nothing", "reason": "Players still on Naina only.", "confidence": 0.3 }\n\`\`\`\n\nLet me know if you need more.`;
    const v = parseHostJudgmentVerdict(raw);
    assert.equal(v.action, "do-nothing");
    assert.equal(v.reason, "Players still on Naina only.");
    assert.equal(v.confidence, 0.3);
  });

  test("parses a phase-transition verdict with targetPhase", () => {
    const raw = JSON.stringify({
      action: "transition-phase",
      targetPhase: "accusation",
      reason: "The case is now solvable from revealed evidence.",
      confidence: 0.82,
    });
    const v = parseHostJudgmentVerdict(raw);
    assert.equal(v.action, "transition-phase");
    assert.equal(v.targetPhase, "accusation");
    assert.equal(v.reason, "The case is now solvable from revealed evidence.");
    assert.equal(v.confidence, 0.82);
  });

  test("clamps out-of-range confidence to [0, 1]", () => {
    const tooHigh = JSON.stringify({ action: "do-nothing", reason: "ok", confidence: 5 });
    assert.equal(parseHostJudgmentVerdict(tooHigh).confidence, 1);
    const tooLow = JSON.stringify({ action: "do-nothing", reason: "ok", confidence: -3 });
    assert.equal(parseHostJudgmentVerdict(tooLow).confidence, 0);
  });

  test("supplies a default confidence when omitted", () => {
    const raw = JSON.stringify({ action: "do-nothing", reason: "no signal" });
    const v = parseHostJudgmentVerdict(raw);
    assert.ok(v.confidence >= 0 && v.confidence <= 1);
  });

  test("rejects drop-evidence verdict without evidenceId", () => {
    const raw = JSON.stringify({ action: "drop-evidence", reason: "fire" });
    assert.throws(
      () => parseHostJudgmentVerdict(raw),
      (err) =>
        err instanceof HostJudgmentError && err.code === "invalid_response",
    );
  });

  test("rejects transition-phase verdict without targetPhase", () => {
    const raw = JSON.stringify({ action: "transition-phase", reason: "advance" });
    assert.throws(
      () => parseHostJudgmentVerdict(raw),
      (err) =>
        err instanceof HostJudgmentError && err.code === "invalid_response",
    );
  });

  test("throws on completely malformed output", () => {
    assert.throws(
      () => parseHostJudgmentVerdict("not even close to JSON"),
      (err) =>
        err instanceof HostJudgmentError && err.code === "invalid_response",
    );
  });

  test("rejects unknown action values", () => {
    const raw = JSON.stringify({ action: "fire-everything", reason: "bug" });
    assert.throws(
      () => parseHostJudgmentVerdict(raw),
      (err) =>
        err instanceof HostJudgmentError && err.code === "invalid_response",
    );
  });
});

describe("host-judgment — alreadyUnlockedVerdict", () => {
  test("case 3: returns do-nothing verdict when target evidence is already unlocked", () => {
    const v = alreadyUnlockedVerdict("anonymous-letter-2", [
      "police-report",
      "anonymous-letter-2",
      "youtube-channel-page",
    ]);
    assert.ok(v !== null);
    assert.equal(v.action, "do-nothing");
    assert.equal(v.confidence, 1);
    assert.match(v.reason, /already in unlocked_evidence/);
  });

  test("returns null when target evidence is not yet unlocked", () => {
    const v = alreadyUnlockedVerdict("anonymous-letter-2", [
      "police-report",
      "youtube-channel-page",
    ]);
    assert.equal(v, null);
  });

  test("returns null on empty unlocked_evidence", () => {
    assert.equal(alreadyUnlockedVerdict("anonymous-letter-2", []), null);
  });
});

describe("host-judgment — buildHostSystemPrompt / buildHostUserPrompt", () => {
  test("system prompt describes generic authored evidence candidates", () => {
    const sys = buildHostSystemPrompt();
    assert.match(sys, /candidate forensic evidence/);
    assert.match(sys, /arrivesWhen/);
    assert.match(sys, /Check candidates in listed order/);
    assert.match(sys, /transition-phase/);
    assert.match(sys, /targetPhase/);
  });

  test("user prompt surfaces opened-up vs guarded suspects", () => {
    const input = {
      caseData: {
        suspects: [],
        evidence: [
          {
            id: "anonymous-letter-2",
            title: "The Second Anonymous Letter",
            category: "letter",
            description: "test",
            loreText: "test",
            revealedInRound: 3,
            unlockedAtChapter: "r3-second-letter",
            arrivesWhen: "Naina, Rhea, and Kabir have opened up and the Thakur family has been mentioned twice. Do NOT fire if either condition is missing.",
          },
        ],
      },
      session: { unlocked_evidence: ["police-report"] },
      allTranscripts: [
        {
          suspectId: "naina",
          suspectName: "Naina Kapoor",
          hasOpenedUp: true,
          messages: [
            { role: "user", content: "What do you do?" },
            { role: "assistant", content: "I'm a corporate-investigations journalist." },
          ],
        },
        {
          suspectId: "rhea",
          suspectName: "Rhea Bhatia",
          hasOpenedUp: false,
          messages: [],
        },
      ],
      unlockedEvidence: ["police-report"],
    };
    const user = buildHostUserPrompt(input);
    assert.match(user, /Naina Kapoor/);
    assert.match(user, /opened up/);
    assert.match(user, /Rhea Bhatia/);
    assert.match(user, /still guarded/);
    assert.match(user, /police-report/);
    assert.match(user, /anonymous-letter-2/);
    assert.match(user, /arrivesWhen/);
  });

  test("user prompt omits already-unlocked authored evidence from candidates", () => {
    const input = {
      caseData: {
        suspects: [],
        evidence: [
          {
            id: HOST_JUDGMENT_TARGET_EVIDENCE_ID,
            title: "The Second Anonymous Letter",
            category: "letter",
            description: "test",
            loreText: "test",
            revealedInRound: 3,
            unlockedAtChapter: "r3-second-letter",
            arrivesWhen: "Fire on the old 2i.1 trigger.",
          },
        ],
      },
      session: { unlocked_evidence: [HOST_JUDGMENT_TARGET_EVIDENCE_ID] },
      allTranscripts: [],
      unlockedEvidence: [HOST_JUDGMENT_TARGET_EVIDENCE_ID],
    };
    const user = buildHostUserPrompt(input);
    assert.match(user, /no candidate evidence/);
    assert.doesNotMatch(user, /Fire on the old 2i\.1 trigger/);
  });
});

describe("host-judgment — getHostEvidenceCandidates", () => {
  test("returns authored, not-yet-unlocked evidence in case order", () => {
    const caseData = {
      suspects: [],
      evidence: [
        {
          id: "first",
          title: "First",
          category: "document",
          description: "test",
          loreText: "test",
          revealedInRound: 3,
          unlockedAtChapter: "r3-a",
          arrivesWhen: "Ready first.",
        },
        {
          id: "second",
          title: "Second",
          category: "document",
          description: "test",
          loreText: "test",
          revealedInRound: 3,
          unlockedAtChapter: "r3-b",
          arrivesWhen: "Ready second.",
        },
        {
          id: "third",
          title: "Third",
          category: "document",
          description: "test",
          loreText: "test",
          revealedInRound: 3,
          unlockedAtChapter: "r3-c",
        },
      ],
    };
    assert.deepEqual(
      getHostEvidenceCandidates(caseData, ["first"]).map((candidate) => candidate.id),
      ["second"],
    );
  });
});

describe("host-judgment — judgeHostAction (network not exercised)", () => {
  test("case 2: throws HostJudgmentError with code missing_api_key when OPENROUTER_API_KEY is missing", async () => {
    const original = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    try {
      await assert.rejects(
        () =>
          judgeHostAction({
            caseData: { suspects: [], evidence: [], llm: undefined },
            session: { unlocked_evidence: [] },
            allTranscripts: [],
            unlockedEvidence: [],
          }),
        (err) =>
          err instanceof HostJudgmentError && err.code === "missing_api_key",
      );
    } finally {
      if (original !== undefined) {
        process.env.OPENROUTER_API_KEY = original;
      }
    }
  });

  test("case 3 (integration): short-circuits without an API call when target is already unlocked", async () => {
    // Set a fake key so the function doesn't bail on the missing-key path.
    // It should bail on the already-unlocked path BEFORE hitting fetch.
    const original = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "fake-key-not-used";
    try {
      const v = await judgeHostAction({
        caseData: { suspects: [], evidence: [], llm: undefined },
        session: { unlocked_evidence: ["anonymous-letter-2", "police-report"] },
        allTranscripts: [],
        unlockedEvidence: ["anonymous-letter-2", "police-report"],
      });
      assert.equal(v.action, "do-nothing");
      assert.match(v.reason, /already in unlocked_evidence/);
    } finally {
      if (original === undefined) {
        delete process.env.OPENROUTER_API_KEY;
      } else {
        process.env.OPENROUTER_API_KEY = original;
      }
    }
  });

  test("coerces drop-evidence verdicts for non-candidate evidence to do-nothing", async () => {
    const originalKey = process.env.OPENROUTER_API_KEY;
    const originalFetch = globalThis.fetch;
    process.env.OPENROUTER_API_KEY = "fake-key-used-by-mock";
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "drop-evidence",
                  evidenceId: "anonymous-letter-1",
                  reason: "Not a candidate.",
                  confidence: 0.9,
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    try {
      const v = await judgeHostAction({
        caseData: {
          suspects: [],
          evidence: [
            {
              id: "anonymous-letter-2",
              title: "The Second Anonymous Letter",
              category: "letter",
              description: "test",
              loreText: "test",
              revealedInRound: 3,
              unlockedAtChapter: "r3-second-letter",
              arrivesWhen: "Fire when the old trigger is met.",
            },
          ],
          llm: undefined,
        },
        session: { phase: "interrogation", unlocked_evidence: [] },
        allTranscripts: [],
        unlockedEvidence: [],
      });
      assert.equal(v.action, "do-nothing");
      assert.match(v.reason, /not an available host evidence candidate/);
    } finally {
      globalThis.fetch = originalFetch;
      if (originalKey === undefined) {
        delete process.env.OPENROUTER_API_KEY;
      } else {
        process.env.OPENROUTER_API_KEY = originalKey;
      }
    }
  });
});
