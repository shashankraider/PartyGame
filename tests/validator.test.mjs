/**
 * Cross-reference and pure-function tests for src/engine/validator.mjs.
 * Run with: npm test
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  validateCase,
  crossReferenceChecks,
  detectChapterCycles,
  semverSatisfies,
  ENGINE_VERSION,
} from "../src/engine/validator.mjs";
import {
  templateClone,
  getSchemaValidator,
  counts,
  hasMessage,
} from "./helpers/make-case.mjs";

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

describe("semverSatisfies", () => {
  test("exact match", () => {
    assert.equal(semverSatisfies("1.2.3", "1.2.3"), true);
    assert.equal(semverSatisfies("1.2.3", "1.2.4"), false);
  });

  test("caret accepts same major, equal or higher minor/patch", () => {
    assert.equal(semverSatisfies("1.0.0", "^1.0.0"), true);
    assert.equal(semverSatisfies("1.5.2", "^1.0.0"), true);
    assert.equal(semverSatisfies("1.0.1", "^1.0.0"), true);
  });

  test("caret rejects different major", () => {
    assert.equal(semverSatisfies("2.0.0", "^1.0.0"), false);
    assert.equal(semverSatisfies("0.9.0", "^1.0.0"), false);
  });

  test("caret rejects lower minor/patch within same major", () => {
    assert.equal(semverSatisfies("1.4.0", "^1.5.0"), false);
    assert.equal(semverSatisfies("1.5.0", "^1.5.2"), false);
  });

  test("invalid inputs return false", () => {
    assert.equal(semverSatisfies("not-a-version", "^1.0.0"), false);
    assert.equal(semverSatisfies("1.0", "^1.0.0"), false);
    assert.equal(semverSatisfies("1.0.0", "garbage"), false);
  });
});

describe("detectChapterCycles", () => {
  test("returns empty for an acyclic DAG", () => {
    const chapters = [
      { id: "a" },
      { id: "b", prerequisites: ["a"] },
      { id: "c", prerequisites: ["a", "b"] },
    ];
    assert.deepEqual(detectChapterCycles(chapters), []);
  });

  test("detects a direct cycle", () => {
    const chapters = [
      { id: "a", prerequisites: ["b"] },
      { id: "b", prerequisites: ["a"] },
    ];
    const issues = detectChapterCycles(chapters);
    assert.ok(issues.some((i) => i.includes("cycle")), `expected a cycle issue, got: ${issues}`);
  });

  test("detects a transitive cycle", () => {
    const chapters = [
      { id: "a", prerequisites: ["c"] },
      { id: "b", prerequisites: ["a"] },
      { id: "c", prerequisites: ["b"] },
    ];
    const issues = detectChapterCycles(chapters);
    assert.ok(issues.some((i) => i.includes("cycle")));
  });

  test("reports unknown prerequisite reference", () => {
    const chapters = [{ id: "a", prerequisites: ["missing"] }];
    const issues = detectChapterCycles(chapters);
    assert.ok(issues.some((i) => i.includes('unknown prerequisite "missing"')));
  });
});

// ---------------------------------------------------------------------------
// Baseline: the shipped template is valid
// ---------------------------------------------------------------------------

describe("template case", () => {
  test("validates with zero errors (asset warnings expected)", async () => {
    const c = await templateClone();
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, false, `unexpected errors: ${JSON.stringify(issues, null, 2)}`);
  });

  test("schema accepts the template", async () => {
    const c = await templateClone();
    const v = await getSchemaValidator();
    assert.equal(v(c), true, `schema errors: ${JSON.stringify(v.errors, null, 2)}`);
  });

  test("engine version satisfies template's engineVersion range", async () => {
    const c = await templateClone();
    assert.equal(semverSatisfies(ENGINE_VERSION, c.engineVersion), true);
  });
});

// ---------------------------------------------------------------------------
// Cross-reference rules (one rule per test, mutate the template to break it)
// ---------------------------------------------------------------------------

describe("cross-reference: unknown evidence id", () => {
  test("in suspect breakingPoint trigger", async () => {
    const c = await templateClone();
    c.suspects[0].breakingPoints[0].trigger = {
      type: "evidence",
      evidenceId: "does-not-exist",
    };
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, true);
    assert.ok(hasMessage(issues, 'unknown evidence id "does-not-exist"'));
  });

  test("in evidence.relatesToSuspectIds", async () => {
    const c = await templateClone();
    c.evidence[0].relatesToSuspectIds = ["ghost-suspect"];
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, true);
    assert.ok(hasMessage(issues, 'unknown suspect id "ghost-suspect"'));
  });

  test("in atmosphericThread.clueIds", async () => {
    const c = await templateClone();
    c.atmosphericThreads = [
      {
        id: "test-thread",
        title: "Test",
        introducedInRound: 1,
        clueIds: ["ghost-evidence"],
        resolutionText: "n/a",
      },
    ];
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, true);
    assert.ok(hasMessage(issues, 'unknown evidence id "ghost-evidence"'));
  });
});

describe("cross-reference: chapter references", () => {
  test("unknown prerequisite chapter id is an error", async () => {
    const c = await templateClone();
    c.chapters[1].prerequisites = ["nonexistent-chapter"];
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, true);
    assert.ok(hasMessage(issues, 'unknown prerequisite "nonexistent-chapter"'));
  });

  test("interview suspectId must resolve", async () => {
    const c = await templateClone();
    const interviewChapter = c.chapters.find((ch) => ch.type === "interview");
    interviewChapter.suspectId = "ghost-suspect";
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, true);
    assert.ok(hasMessage(issues, 'unknown suspect id "ghost-suspect"'));
  });

  test("unknown roundNumber is an error", async () => {
    const c = await templateClone();
    c.chapters[0].roundNumber = 99;
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, true);
    assert.ok(hasMessage(issues, "unknown round number 99"));
  });
});

describe("cross-reference: chapter DAG", () => {
  test("cycle in chapter prerequisites is an error", async () => {
    const c = await templateClone();
    // create a -> b -> a cycle by adding a prereq on case-brief
    const accuse = c.chapters.find((ch) => ch.id === "accuse");
    const brief = c.chapters.find((ch) => ch.id === "case-brief");
    brief.prerequisites = ["accuse"];
    accuse.prerequisites = ["case-brief"]; // already true
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, true);
    assert.ok(hasMessage(issues, "cycle"));
  });
});

describe("cross-reference: solution", () => {
  test("killer must be a real suspect", async () => {
    const c = await templateClone();
    c.solution.killerSuspectIds = ["nobody"];
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, true);
    assert.ok(hasMessage(issues, 'killerSuspectIds references unknown suspect "nobody"'));
  });

  test("killerRoles keys must be real suspects", async () => {
    const c = await templateClone();
    c.solution.killerRoles = { ghost: "mastermind" };
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, true);
    assert.ok(hasMessage(issues, 'killerRoles references unknown suspect "ghost"'));
  });

  test("redHerrings suspectId must resolve", async () => {
    const c = await templateClone();
    c.solution.redHerrings = [{ suspectId: "ghost", explanation: "n/a" }];
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, true);
    assert.ok(hasMessage(issues, 'redHerrings[].suspectId references unknown suspect id "ghost"'));
  });
});

describe("cross-reference: endgame", () => {
  test("endgame triggerSuspectId must resolve", async () => {
    const c = await templateClone();
    c.endgame.paths[0].triggerSuspectId = "ghost";
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, true);
    assert.ok(hasMessage(issues, 'triggerSuspectId references unknown suspect id "ghost"'));
  });
});

describe("cross-reference: engine version", () => {
  test("incompatible engineVersion is an error", async () => {
    const c = await templateClone();
    c.engineVersion = "^99.0.0";
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, true);
    assert.ok(hasMessage(issues, "this engine is"));
  });
});

// ---------------------------------------------------------------------------
// UnlockCondition variants
// ---------------------------------------------------------------------------

describe("UnlockCondition variants", () => {
  test("'all' nested with unknown evidence id is an error", async () => {
    const c = await templateClone();
    c.suspects[0].breakingPoints[0].trigger = {
      type: "all",
      conditions: [
        { type: "evidence", evidenceId: "evidence-a" },
        { type: "evidence", evidenceId: "does-not-exist" },
      ],
    };
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, true);
    assert.ok(hasMessage(issues, 'unknown evidence id "does-not-exist"'));
  });

  test("'any' nested resolves cleanly when all refs are valid", async () => {
    const c = await templateClone();
    c.suspects[0].breakingPoints[0].trigger = {
      type: "any",
      conditions: [
        { type: "evidence", evidenceId: "evidence-a" },
        { type: "round", roundNumber: 1 },
      ],
    };
    const v = await getSchemaValidator();
    const { hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, false);
  });

  test("'round' condition with unknown round number errors", async () => {
    const c = await templateClone();
    c.suspects[0].breakingPoints[0].trigger = { type: "round", roundNumber: 99 };
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v);
    assert.equal(hasErrors, true);
    assert.ok(hasMessage(issues, "unknown round number 99"));
  });
});

// ---------------------------------------------------------------------------
// Asset checks (only when caseDir is provided)
// ---------------------------------------------------------------------------

describe("asset checks", () => {
  test("without caseDir: no asset warnings", async () => {
    const c = await templateClone();
    const v = await getSchemaValidator();
    const { issues } = validateCase(c, v); // no caseDir
    const { warnings } = counts(issues);
    assert.equal(warnings, 0);
  });

  test("with bogus caseDir: missing portraits emit warnings, not errors", async () => {
    const c = await templateClone();
    const v = await getSchemaValidator();
    const { issues, hasErrors } = validateCase(c, v, {
      caseDir: "/tmp/this-path-does-not-exist",
      checkAssets: true,
    });
    assert.equal(hasErrors, false);
    const { warnings } = counts(issues);
    assert.ok(warnings > 0, "expected warnings about missing portrait files");
  });
});

// ---------------------------------------------------------------------------
// Pure crossReferenceChecks (no schema)
// ---------------------------------------------------------------------------

describe("crossReferenceChecks (pure)", () => {
  test("non-object input returns a single error", () => {
    const issues = crossReferenceChecks(null);
    assert.equal(issues.length, 1);
    assert.equal(issues[0].level, "error");
  });

  test("clean template emits zero issues when called pure (no asset check)", async () => {
    const c = await templateClone();
    const issues = crossReferenceChecks(c, { checkAssets: false });
    assert.equal(issues.length, 0, `unexpected: ${JSON.stringify(issues)}`);
  });
});
