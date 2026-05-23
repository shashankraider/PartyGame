#!/usr/bin/env tsx
/**
 * scripts/eval-host.ts — Phase 2i.1 eval harness for the AI host-judgment
 * service. Loads cases/<case>/evals/host.eval.json, runs each fixture through
 * the real judgeHostAction() (no duplicated prompt), and reports pass/fail.
 *
 * Mirrors scripts/eval-adjudicator.ts in shape — same .env.local loader,
 * same ANSI colors, same usage convention:
 *
 *   npm run eval:host
 *   npm run eval:host -- mussoorie
 *
 * Reads OPENROUTER_API_KEY (required) and OPENROUTER_MODEL (optional) from
 * the environment / .env.local.
 *
 * Exit code: 0 if every case matched its expected verdict; non-zero otherwise.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseJsonc } from "jsonc-parser";
import type { Case } from "../src/engine/types";
import {
  judgeHostAction,
  type HostJudgmentTranscript,
  type HostJudgmentVerdict,
} from "../src/lib/host-judgment";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

// ---------------------------------------------------------------------------
// .env.local loader (mirrors scripts/eval-adjudicator.ts).
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
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnvLocal();

// ---------------------------------------------------------------------------
// Eval file shape.
// ---------------------------------------------------------------------------

type EvalTestCase = {
  name: string;
  expected: "drop-evidence" | "do-nothing";
  expectedEvidenceId?: string;
  transcripts: HostJudgmentTranscript[];
  unlockedEvidence?: string[];
};

type EvalFile = {
  description?: string;
  cases: EvalTestCase[];
};

function loadCase(caseId: string): Case {
  const p = path.join(repoRoot, "cases", caseId, "case.json");
  if (!existsSync(p)) throw new Error(`Case not found: ${p}`);
  return parseJsonc(readFileSync(p, "utf8")) as Case;
}

function loadEvalFile(caseId: string): EvalFile | null {
  const p = path.join(repoRoot, "cases", caseId, "evals", "host.eval.json");
  if (!existsSync(p)) return null;
  return parseJsonc(readFileSync(p, "utf8")) as EvalFile;
}

// ---------------------------------------------------------------------------
// Console formatting.
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
const paint = (color: keyof typeof ANSI, text: string) =>
  `${ANSI[color]}${text}${ANSI.reset}`;
const truncate = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1) + "…");

// ---------------------------------------------------------------------------
// Run.
// ---------------------------------------------------------------------------

function parseCliArgs(): { caseId: string } {
  const args = process.argv.slice(2);
  let caseId = process.env.CASE_ID?.trim() || "mussoorie";
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === "--case") caseId = args[++i];
    else if (a && !a.startsWith("--")) caseId = a;
  }
  return { caseId };
}

type CaseResult = {
  name: string;
  expected: "drop-evidence" | "do-nothing";
  verdict: HostJudgmentVerdict | null;
  passed: boolean;
  errorMessage?: string;
};

async function runOne(args: {
  caseData: Case;
  testCase: EvalTestCase;
}): Promise<CaseResult> {
  const { caseData, testCase } = args;
  try {
    const verdict = await judgeHostAction({
      caseData,
      session: {
        // Minimal session-row shape that the host-judgment service uses.
        // The function only reads unlocked_evidence from session, so the
        // other fields can be empty stubs cast through unknown.
        unlocked_evidence: testCase.unlockedEvidence ?? [],
      } as unknown as Parameters<typeof judgeHostAction>[0]["session"],
      allTranscripts: testCase.transcripts,
      unlockedEvidence: testCase.unlockedEvidence ?? [],
    });

    const actionMatches = verdict.action === testCase.expected;
    const evidenceMatches =
      testCase.expectedEvidenceId === undefined ||
      verdict.evidenceId === testCase.expectedEvidenceId;
    return {
      name: testCase.name,
      expected: testCase.expected,
      verdict,
      passed: actionMatches && evidenceMatches,
    };
  } catch (err) {
    return {
      name: testCase.name,
      expected: testCase.expected,
      verdict: null,
      passed: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error(paint("red", "OPENROUTER_API_KEY is not set. Aborting."));
    process.exit(2);
  }
  const cli = parseCliArgs();
  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

  console.log(paint("bold", `Host-judgment eval — case: ${cli.caseId}, model: ${model}`));

  const caseData = loadCase(cli.caseId);
  const evalFile = loadEvalFile(cli.caseId);
  if (!evalFile) {
    console.error(
      paint("red", `No eval file at cases/${cli.caseId}/evals/host.eval.json`),
    );
    process.exit(2);
  }

  if (evalFile.description) console.log(paint("dim", evalFile.description));
  console.log("");

  let total = 0;
  let failures = 0;

  // Run cases in parallel (each is one cheap LLM call; short-circuit cases
  // skip the call entirely).
  const results = await Promise.all(
    evalFile.cases.map((testCase) => runOne({ caseData, testCase })),
  );

  for (const r of results) {
    total += 1;
    const expectedLabel = r.expected;
    const marker = r.passed ? paint("green", "  ✓") : paint("red", "  ✗");
    if (r.passed && r.verdict) {
      const got = r.verdict.evidenceId
        ? `${r.verdict.action}(${r.verdict.evidenceId})`
        : r.verdict.action;
      console.log(
        `${marker}  ${r.name} ${paint("gray", `(expected=${expectedLabel}, got=${got}, conf=${r.verdict.confidence.toFixed(2)})`)}`,
      );
    } else {
      failures += 1;
      if (r.errorMessage) {
        console.log(`${marker}  ${r.name}`);
        console.log(`        ${paint("red", `ERROR: ${r.errorMessage}`)}`);
      } else if (r.verdict) {
        const got = r.verdict.evidenceId
          ? `${r.verdict.action}(${r.verdict.evidenceId})`
          : r.verdict.action;
        const reason = truncate(r.verdict.reason, 140);
        console.log(`${marker}  ${r.name}`);
        console.log(
          `        ${paint("red", `expected=${expectedLabel} got=${got} conf=${r.verdict.confidence.toFixed(2)}`)}`,
        );
        console.log(`        ${paint("gray", `reason: ${reason}`)}`);
      }
    }
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
