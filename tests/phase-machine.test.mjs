/**
 * Phase 2i.2 — unit coverage for the coarse session phase machine.
 *
 * These tests stay pure: DB application of the migration is covered by
 * Supabase reset in local verification, while this file pins the transition
 * rules that session-store.ts enforces at runtime.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SessionStoreError,
  assertValidSessionPhaseTransition,
  getChapterPhase,
  getInterrogationEntryChapter,
  isInterrogationChapter,
  shouldNoopChapterAdvance,
} from "../src/lib/session-store.ts";

const root = join(fileURLToPath(import.meta.url), "..", "..");

describe("phase machine — transitions", () => {
  test("allows only briefing -> interrogation -> accusation -> reveal", () => {
    assert.doesNotThrow(() => assertValidSessionPhaseTransition("briefing", "interrogation"));
    assert.doesNotThrow(() => assertValidSessionPhaseTransition("interrogation", "accusation"));
    assert.doesNotThrow(() => assertValidSessionPhaseTransition("accusation", "reveal"));

    for (const [from, to] of [
      ["reveal", "briefing"],
      ["accusation", "interrogation"],
      ["briefing", "accusation"],
      ["interrogation", "reveal"],
    ]) {
      assert.throws(
        () => assertValidSessionPhaseTransition(from, to),
        (err) => err instanceof SessionStoreError && err.code === "invalid_request",
        `${from} -> ${to} should be rejected`,
      );
    }
  });

  test("migration default initializes new sessions to briefing", async () => {
    const sql = await readFile(
      join(root, "supabase", "migrations", "0005_session_phase.sql"),
      "utf8",
    );

    assert.match(sql, /create type session_phase as enum/i);
    assert.match(sql, /'briefing'/);
    assert.match(sql, /add column if not exists phase session_phase not null default 'briefing'/i);
  });
});

describe("phase machine — chapter behavior", () => {
  test("advanceSessionChapter is a no-op during interrogation", () => {
    assert.equal(shouldNoopChapterAdvance({ phase: "interrogation" }), true);
    assert.equal(shouldNoopChapterAdvance({ phase: "briefing" }), false);
  });

  test("round-2 interview chapters stay selectable during interrogation", async () => {
    const { loadCaseFromFile } = await import("../src/engine/validator.mjs");
    const caseData = await loadCaseFromFile(join(root, "cases", "mussoorie", "case.json"));
    const rheaInterview = caseData.chapters.find((chapter) => chapter.id === "r2-interview-rhea");

    assert.ok(rheaInterview, "expected the round-2 Rhea interview chapter to exist");
    assert.equal(getChapterPhase(rheaInterview), "interrogation");
    assert.equal(isInterrogationChapter(rheaInterview), true);
  });

  test("interrogation entry preserves the round-2 picker route", async () => {
    const { loadCaseFromFile } = await import("../src/engine/validator.mjs");
    const caseData = await loadCaseFromFile(join(root, "cases", "mussoorie", "case.json"));
    const entry = getInterrogationEntryChapter(caseData);

    assert.ok(entry, "expected an Interrogation entry chapter");
    assert.equal(getChapterPhase(entry), "interrogation");
    assert.equal(entry.id, "r2-evidence-drop");
  });
});
