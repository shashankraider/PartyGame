#!/usr/bin/env node
/**
 * Thin CLI wrapper around src/engine/validator.mjs.
 *
 * Usage:
 *   npm run validate-case <id>      e.g. npm run validate-case mussoorie
 *   npm run validate-cases           validate every case folder under cases/
 *
 * Exit codes:
 *   0  all targets valid
 *   1  at least one target has errors
 *   2  usage error
 */
import { readdir } from "node:fs/promises";
import { CASES_ROOT, validateCaseById } from "../src/engine/validator.mjs";

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function printResult(caseId, { issues, hasErrors }) {
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");
  if (errors.length === 0 && warns.length === 0) {
    console.log(`${GREEN}OK${RESET} ${BOLD}${caseId}${RESET} — no issues`);
    return !hasErrors;
  }
  console.log(`\n${BOLD}${caseId}${RESET}`);
  for (const e of errors) console.log(`  ${RED}ERROR${RESET} ${e.message}`);
  for (const w of warns) console.log(`  ${YELLOW}warn${RESET}  ${w.message}`);
  console.log(`  -> ${errors.length} error(s), ${warns.length} warning(s)`);
  return !hasErrors;
}

async function listCaseIds() {
  const entries = await readdir(CASES_ROOT, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith(".") && e.name !== "_template")
    .map((e) => e.name);
}

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const targets = all ? await listCaseIds() : args.filter((a) => !a.startsWith("--"));

  if (targets.length === 0) {
    console.error("Usage:");
    console.error("  npm run validate-case <case-id>");
    console.error("  npm run validate-cases   (every case)");
    process.exit(2);
  }

  let allOk = true;
  for (const caseId of targets) {
    const result = await validateCaseById(caseId);
    const ok = printResult(caseId, result);
    allOk = allOk && ok;
  }
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
