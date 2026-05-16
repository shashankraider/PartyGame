/**
 * Subprocess tests for the CLI: exit codes, output format, --all flag.
 * Run with: npm test
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");
const cli = join(projectRoot, "scripts/validate-case.mjs");

function run(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [cli, ...args], { cwd: projectRoot });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("exit", (code) => resolve({ code, stdout, stderr }));
  });
}

describe("CLI: validate-case", () => {
  test("exits 0 on the template", async () => {
    const { code, stdout } = await run(["_template"]);
    assert.equal(code, 0, `stdout was: ${stdout}`);
  });

  test("exits 2 with no arguments and prints usage", async () => {
    const { code, stderr } = await run([]);
    assert.equal(code, 2);
    assert.ok(stderr.includes("Usage"));
  });

  test("exits 1 when case folder does not exist", async () => {
    const { code, stdout } = await run(["this-case-does-not-exist"]);
    assert.equal(code, 1);
    assert.ok(stdout.includes("case.json not found"));
  });

  test("--all skips _template", async () => {
    const { stdout } = await run(["--all"]);
    // _template is skipped by --all so it should not appear as a heading line
    // (heading line format: bold case id followed by newline)
    assert.ok(!stdout.includes("_template\n"), "--all should not include _template");
  });
});
