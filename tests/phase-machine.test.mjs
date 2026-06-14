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

describe("Briefing beats — enumeration", () => {
  test("narrative chapter yields one beat per authored entry", async () => {
    const { enumerateBriefingBeats, getBriefingBeatCount, isBriefingBeatChapter } = await import(
      "../src/lib/briefing-beats.ts"
    );
    const { loadCaseFromFile } = await import("../src/engine/validator.mjs");
    const caseData = await loadCaseFromFile(join(root, "cases", "mussoorie", "case.json"));
    const arrival = caseData.chapters.find((chapter) => chapter.id === "r1-arrival");
    assert.ok(arrival, "expected r1-arrival to exist");
    assert.equal(isBriefingBeatChapter(arrival), true);
    const beats = enumerateBriefingBeats(arrival);
    assert.equal(beats.length, arrival.beats.length);
    assert.equal(getBriefingBeatCount(arrival), arrival.beats.length);
    for (const beat of beats) assert.equal(beat.kind, "narration");
  });

  test("evidence-reveal chapter prepends narration as beat 0, then one beat per evidence", async () => {
    const { enumerateBriefingBeats } = await import("../src/lib/briefing-beats.ts");
    const { loadCaseFromFile } = await import("../src/engine/validator.mjs");
    const caseData = await loadCaseFromFile(join(root, "cases", "mussoorie", "case.json"));
    const vikramLife = caseData.chapters.find((chapter) => chapter.id === "r1-vikram-life");
    assert.ok(vikramLife);
    const beats = enumerateBriefingBeats(vikramLife);
    // narration paragraph + 3 evidence items
    assert.equal(beats.length, 1 + vikramLife.evidenceIds.length);
    assert.equal(beats[0].kind, "narration");
    for (let i = 1; i < beats.length; i++) {
      assert.equal(beats[i].kind, "exhibit");
      assert.equal(beats[i].evidenceId, vikramLife.evidenceIds[i - 1]);
    }
  });

  test("evidence-reveal chapter without narration skips beat 0", async () => {
    const { enumerateBriefingBeats } = await import("../src/lib/briefing-beats.ts");
    const fakeChapter = {
      type: "evidence-reveal",
      id: "fake",
      title: "Fake",
      roundNumber: 1,
      evidenceIds: ["one", "two"],
    };
    const beats = enumerateBriefingBeats(fakeChapter);
    assert.equal(beats.length, 2);
    assert.equal(beats[0].kind, "exhibit");
    assert.equal(beats[1].kind, "exhibit");
  });

  test("non-briefing chapters return empty beat list", async () => {
    const { enumerateBriefingBeats, isBriefingBeatChapter } = await import(
      "../src/lib/briefing-beats.ts"
    );
    const { loadCaseFromFile } = await import("../src/engine/validator.mjs");
    const caseData = await loadCaseFromFile(join(root, "cases", "mussoorie", "case.json"));
    const interview = caseData.chapters.find((chapter) => chapter.type === "interview");
    assert.ok(interview);
    assert.equal(isBriefingBeatChapter(interview), false);
    assert.equal(enumerateBriefingBeats(interview).length, 0);
  });

  test("isBriefingBeatChapter rejects round-2 evidence-reveal chapters", async () => {
    const { isBriefingBeatChapter } = await import("../src/lib/briefing-beats.ts");
    const { loadCaseFromFile } = await import("../src/engine/validator.mjs");
    const caseData = await loadCaseFromFile(join(root, "cases", "mussoorie", "case.json"));
    const r2Drop = caseData.chapters.find((chapter) => chapter.id === "r2-evidence-drop");
    assert.ok(r2Drop, "expected r2-evidence-drop");
    assert.equal(r2Drop.roundNumber, 2);
    assert.equal(isBriefingBeatChapter(r2Drop), false);
  });

  test("resolveBeatBackdrop falls back through beat → location → null", async () => {
    const { resolveBeatBackdrop } = await import("../src/lib/briefing-beats.ts");
    const { loadCaseFromFile } = await import("../src/engine/validator.mjs");
    const caseData = await loadCaseFromFile(join(root, "cases", "mussoorie", "case.json"));
    const arrival = caseData.chapters.find((chapter) => chapter.id === "r1-arrival");
    const narrationBeat = { kind: "narration", text: "x", imageUrl: "assets/portraits/vikram.png" };
    assert.equal(
      resolveBeatBackdrop(narrationBeat, arrival, caseData),
      "assets/portraits/vikram.png",
      "beat.imageUrl wins over chapter location",
    );

    const plainBeat = { kind: "narration", text: "x" };
    const policeStation = caseData.locations.find((loc) => loc.id === "police-station");
    assert.ok(policeStation, "expected police-station location");
    assert.equal(
      resolveBeatBackdrop(plainBeat, arrival, caseData),
      policeStation.imageUrl,
      "falls back to chapter location",
    );

    const noLocChapter = { ...arrival, locationId: undefined };
    assert.equal(resolveBeatBackdrop(plainBeat, noLocChapter, caseData), null);
  });
});
