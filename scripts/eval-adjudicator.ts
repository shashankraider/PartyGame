#!/usr/bin/env tsx
/**
 * scripts/eval-adjudicator.ts
 *
 * Per-suspect evaluation harness for the Phase 2g adjudicator. Loads a case's
 * authored unlock cues from case.json and a sibling eval file with hand-written
 * test transcripts; runs each test case through the real judgeUnlock() (NOT a
 * duplicate prompt), and reports pass/fail per condition.
 *
 * Usage:
 *   npm run eval:adjudicator -- naina
 *   npm run eval:adjudicator -- all
 *   npm run eval:adjudicator -- naina --case mussoorie
 *
 * Reads OPENROUTER_API_KEY (required) and OPENROUTER_MODEL (optional) from the
 * environment. Pre-loads .env.local so a normal dev setup works without extra
 * exports.
 *
 * Exit code: 0 if every case matched its expected verdict; non-zero otherwise.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseJsonc } from "jsonc-parser";
import type { Case, Suspect, UnlockBehavior } from "../src/engine/types";
import {
  judgeUnlock,
  type AdjudicatorTranscriptEntry,
  type AdjudicatorVerdict,
} from "../src/lib/adjudicator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

// ---------------------------------------------------------------------------
// .env.local loader (tiny, no devDep)
// ---------------------------------------------------------------------------

function loadDotEnvLocal() {
  const envPath = path.join(repoRoot, ".env.local");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnvLocal();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EvalTestCase = {
  name: string;
  expected: "met" | "not-met";
  transcript: AdjudicatorTranscriptEntry[];
  presentedEvidenceIds?: string[];
  /** Optional: pin pressure_count semantics for testing pressureThreshold cues. */
  simulatedPriorMet?: number;
};

type EvalFile = {
  suspectId: string;
  conditions: Record<string, EvalTestCase[]>;
};

type ConditionMeta = {
  conditionId: string; // "secret:foo" | "breaking-point:bar" | "evidence:baz"
  label: string;
  cooperationCue?: string;
  // The full UnlockBehavior is passed through to judgeUnlock unchanged.
  fullBehavior: UnlockBehavior;
};

// ---------------------------------------------------------------------------
// Case + eval-file loaders
// ---------------------------------------------------------------------------

function loadCase(caseId: string): Case {
  const casePath = path.join(repoRoot, "cases", caseId, "case.json");
  if (!existsSync(casePath)) throw new Error(`Case not found: ${casePath}`);
  return parseJsonc(readFileSync(casePath, "utf8")) as Case;
}

function loadEvalFile(caseId: string, suspectId: string): EvalFile | null {
  const evalPath = path.join(repoRoot, "cases", caseId, "evals", `${suspectId}.eval.json`);
  if (!existsSync(evalPath)) return null;
  return parseJsonc(readFileSync(evalPath, "utf8")) as EvalFile;
}

function collectConditions(suspect: Suspect, caseData: Case): ConditionMeta[] {
  const out: ConditionMeta[] = [];
  for (const secret of suspect.secrets ?? []) {
    if (!secret.unlockBehavior) continue;
    out.push({
      conditionId: `secret:${secret.id}`,
      label: secret.topic,
      cooperationCue: secret.unlockBehavior.cooperationCue,
      fullBehavior: secret.unlockBehavior,
    });
  }
  for (const bp of suspect.breakingPoints ?? []) {
    if (!bp.unlockBehavior) continue;
    out.push({
      conditionId: `breaking-point:${bp.id}`,
      label: bp.id,
      cooperationCue: bp.unlockBehavior.cooperationCue,
      fullBehavior: bp.unlockBehavior,
    });
  }
  for (const ev of caseData.evidence) {
    if (!ev.unlockBehavior) continue;
    if (!ev.relatesToSuspectIds?.includes(suspect.id)) continue;
    out.push({
      conditionId: `evidence:${ev.id}`,
      label: ev.title,
      cooperationCue: ev.unlockBehavior.cooperationCue,
      fullBehavior: ev.unlockBehavior,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Console formatting
// ---------------------------------------------------------------------------

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function paint(color: keyof typeof ANSI, text: string): string {
  return `${ANSI[color]}${text}${ANSI.reset}`;
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

// ---------------------------------------------------------------------------
// Eval runner
// ---------------------------------------------------------------------------

type CaseResult = {
  testName: string;
  conditionId: string;
  expected: boolean;
  verdict: AdjudicatorVerdict | null;
  passed: boolean;
  errorMessage?: string;
};

async function runOneCase(args: {
  caseData: Case;
  suspect: Suspect;
  condition: ConditionMeta;
  testCase: EvalTestCase;
}): Promise<CaseResult> {
  const { caseData, suspect, condition, testCase } = args;
  const expectedBool = testCase.expected === "met";

  try {
    const verdict = await judgeUnlock({
      caseData,
      suspect,
      conditionId: condition.conditionId,
      condition: {
        unlockBehavior: condition.fullBehavior,
        presentedEvidenceIdsInThisConversation: testCase.presentedEvidenceIds ?? [],
      },
      transcript: testCase.transcript,
    });
    return {
      testName: testCase.name,
      conditionId: condition.conditionId,
      expected: expectedBool,
      verdict,
      passed: verdict.met === expectedBool,
    };
  } catch (err) {
    return {
      testName: testCase.name,
      conditionId: condition.conditionId,
      expected: expectedBool,
      verdict: null,
      passed: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}

async function evalSuspect(args: {
  caseId: string;
  caseData: Case;
  suspectId: string;
}): Promise<{ total: number; failures: number }> {
  const { caseId, caseData, suspectId } = args;
  const suspect = caseData.suspects.find((s) => s.id === suspectId);
  if (!suspect) {
    console.error(paint("red", `Suspect "${suspectId}" not found in case "${caseId}".`));
    return { total: 0, failures: 1 };
  }

  const conditions = collectConditions(suspect, caseData);
  const evalFile = loadEvalFile(caseId, suspectId);

  console.log("\n" + paint("bold", paint("cyan", `=== ${suspect.name} (${suspectId}) ===`)));

  if (conditions.length === 0) {
    console.log(paint("yellow", "  No conditions with unlockBehavior. Skipping."));
    return { total: 0, failures: 0 };
  }

  if (!evalFile) {
    console.log(
      paint("yellow", `  No eval file at cases/${caseId}/evals/${suspectId}.eval.json. Skipping.`),
    );
    console.log(paint("dim", `    Conditions that need eval cases:`));
    for (const c of conditions) {
      console.log(paint("dim", `      - ${c.conditionId} (${c.label})`));
    }
    return { total: 0, failures: conditions.length };
  }

  let total = 0;
  let failures = 0;

  for (const condition of conditions) {
    const cases = evalFile.conditions[condition.conditionId] ?? [];
    console.log("\n  " + paint("bold", condition.conditionId) + paint("dim", ` — ${condition.label}`));

    if (cases.length === 0) {
      console.log("    " + paint("yellow", "no test cases authored yet"));
      failures += 1;
      total += 1;
      continue;
    }

    const results = await Promise.all(
      cases.map((testCase) => runOneCase({ caseData, suspect, condition, testCase })),
    );

    for (const result of results) {
      total += 1;
      const marker = result.passed ? paint("green", "  ✓") : paint("red", "  ✗");
      const expected = result.expected ? "met" : "not-met";
      if (result.passed) {
        const got = result.verdict ? `met=${result.verdict.met} conf=${result.verdict.confidence}` : "-";
        console.log(
          `  ${marker}  ${result.testName} ${paint("gray", `(${expected}, ${got})`)}`,
        );
      } else {
        failures += 1;
        if (result.errorMessage) {
          console.log(`  ${marker}  ${result.testName}`);
          console.log(`        ${paint("red", `ERROR: ${result.errorMessage}`)}`);
        } else if (result.verdict) {
          const reason = truncate(result.verdict.reason, 120);
          console.log(
            `  ${marker}  ${result.testName}  ${paint("gray", `expected=${expected}`)}`,
          );
          console.log(
            `        ${paint("red", `got: met=${result.verdict.met} conf=${result.verdict.confidence}`)}`,
          );
          console.log(`        ${paint("gray", `reason: ${reason}`)}`);
        }
      }
    }
  }

  return { total, failures };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseCliArgs(): { suspects: "all" | string[]; caseId: string } {
  const args = process.argv.slice(2);
  let caseId = process.env.CASE_ID?.trim() || "mussoorie";
  const suspects: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === "--case") {
      caseId = args[++i];
    } else if (a === "all") {
      return { suspects: "all", caseId };
    } else if (!a.startsWith("--")) {
      suspects.push(a);
    }
  }
  if (suspects.length === 0) return { suspects: "all", caseId };
  return { suspects, caseId };
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error(paint("red", "OPENROUTER_API_KEY is not set. Aborting."));
    process.exit(2);
  }
  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  const cli = parseCliArgs();

  console.log(paint("bold", `Adjudicator eval — case: ${cli.caseId}, model: ${model}`));

  const caseData = loadCase(cli.caseId);

  const ids =
    cli.suspects === "all"
      ? caseData.suspects.map((s) => s.id)
      : (cli.suspects as string[]);

  let total = 0;
  let failures = 0;
  for (const id of ids) {
    const result = await evalSuspect({ caseId: cli.caseId, caseData, suspectId: id });
    total += result.total;
    failures += result.failures;
  }

  console.log("\n" + "=".repeat(72));
  if (failures === 0) {
    console.log(paint("green", `All ${total} case(s) matched expectations.`));
    process.exit(0);
  } else {
    console.log(paint("red", `${failures} of ${total} case(s) failed.`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
