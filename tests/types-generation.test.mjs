/**
 * Smoke tests for the schema -> types generator.
 * Ensures the produced TypeScript stays usable and exports the expected types.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");
const generator = join(projectRoot, "scripts/generate-types.mjs");
const typesPath = join(projectRoot, "src/engine/types.ts");

function runGenerator() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [generator], { cwd: projectRoot });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("exit", (code) => resolve({ code, stdout, stderr }));
  });
}

describe("types generation", () => {
  test("generator exits 0", async () => {
    const { code, stderr } = await runGenerator();
    assert.equal(code, 0, `stderr was: ${stderr}`);
  });

  test("produces src/engine/types.ts of non-trivial size", async () => {
    const s = await stat(typesPath);
    assert.ok(s.size > 4000, `expected substantial output, got ${s.size} bytes`);
  });

  test("output exports core types", async () => {
    const text = await readFile(typesPath, "utf8");
    for (const symbol of [
      "export interface Case",
      "export interface Suspect",
      "export interface Evidence",
      "export interface Solution",
      "export type UnlockCondition",
      "export type SlugId",
    ]) {
      assert.ok(text.includes(symbol), `missing: ${symbol}`);
    }
  });

  test("output is marked auto-generated", async () => {
    const text = await readFile(typesPath, "utf8");
    assert.ok(text.includes("AUTO-GENERATED"));
  });

  test("output includes discriminated union for Chapter types", async () => {
    const text = await readFile(typesPath, "utf8");
    assert.ok(text.includes('type: "narrative"'), 'should include "narrative" chapter type literal');
    assert.ok(text.includes('type: "interview"'), 'should include "interview" chapter type literal');
    assert.ok(text.includes('type: "accusation"'), 'should include "accusation" chapter type literal');
    assert.ok(text.includes('type: "reveal"'), 'should include "reveal" chapter type literal');
  });
});
