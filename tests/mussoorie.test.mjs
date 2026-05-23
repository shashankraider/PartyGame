/**
 * Pin test: the shipped Mussoorie case must always validate.
 * Any schema change that breaks Mussoorie should fail CI loudly.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateCaseById } from "../src/engine/validator.mjs";

describe("Mussoorie case", () => {
  test("validates with zero errors (asset warnings expected)", async () => {
    const { issues, hasErrors } = await validateCaseById("mussoorie");
    const errors = issues.filter((i) => i.level === "error");
    assert.equal(
      hasErrors,
      false,
      `Mussoorie has ${errors.length} error(s):\n${errors.map((e) => "  - " + e.message).join("\n")}`
    );
  });

  test("structural sanity: 6 suspects, 30 evidence items, 4 rounds, 19 chapters", async () => {
    // Re-load directly so we can inspect the case content.
    const { loadCaseFromFile } = await import("../src/engine/validator.mjs");
    const { join, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const c = await loadCaseFromFile(
      join(__dirname, "..", "cases", "mussoorie", "case.json")
    );

    assert.equal(c.id, "mussoorie");
    assert.equal(c.suspects.length, 6, "expected 6 suspects");
    assert.equal(c.evidence.length, 30, "expected 30 evidence items");
    assert.equal(c.rounds.length, 4, "expected 4 rounds");
    assert.equal(c.chapters.length, 19, "expected 19 chapters");
    assert.equal(c.locations.length, 8, "expected 8 locations");
    assert.equal(c.backstory.length, 1, "expected 1 backstory event (Thakur cold case)");
    assert.equal(c.atmosphericThreads.length, 1, "expected 1 atmospheric thread (Grey Lady)");
    assert.equal(c.endgame.paths.length, 2, "expected 2 endgame paths");
    assert.deepEqual(
      c.solution.killerSuspectIds.sort(),
      ["bisht", "devraj"],
      "expected Bisht + Devraj as multi-killer solution"
    );
    assert.equal(c.solution.killerRoles.bisht, "mastermind");
    assert.equal(c.solution.killerRoles.devraj, "executor");
  });

  test("evidence is split correctly across 4 rounds", async () => {
    const { loadCaseFromFile } = await import("../src/engine/validator.mjs");
    const { join, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const c = await loadCaseFromFile(
      join(__dirname, "..", "cases", "mussoorie", "case.json")
    );

    const perRound = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const e of c.evidence) perRound[e.revealedInRound]++;
    assert.equal(perRound[1], 6, "Round 1 should have 6 evidence items");
    assert.equal(perRound[2], 9, "Round 2 should have 9 evidence items");
    assert.equal(perRound[3], 9, "Round 3 should have 9 evidence items");
    assert.equal(perRound[4], 6, "Round 4 should have 6 evidence items");
  });

  test("validates with no asset warnings (Phase 4 art has shipped)", async () => {
    const { issues } = await validateCaseById("mussoorie");
    const warnings = issues.filter((i) => i.level === "warn");
    // If any asset warnings reappear (art removed/renamed), surface what's missing
    // in the assertion message rather than failing on a bare count.
    assert.equal(
      warnings.length,
      0,
      `Unexpected warnings:\n${warnings.map((w) => "  - " + w.message).join("\n")}`,
    );
  });
});
