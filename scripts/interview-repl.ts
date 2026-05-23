#!/usr/bin/env tsx
/**
 * scripts/interview-repl.ts
 *
 * Interactive test harness for the suspect interview flow. Drives the same
 * askSuspect() engine code the live app uses — adjudicator + unlock-firing
 * + two-pass roleplay — against a synthetic session in local Supabase, with
 * no UI involved.
 *
 * Usage:
 *   npm run repl:interview                # starts at the first interview chapter
 *   npm run repl:interview -- --case mussoorie --chapter r2-interview-naina
 *
 * Inside the REPL:
 *   > what kind of work do you do?
 *     (asks the current suspect, prints response + any unlocks)
 *   :advance r2-interview-rhea            # switch to a different interview chapter
 *   :present rhea-draft-email             # next question presents this evidence
 *   :present                              # clear the staged evidence
 *   :state                                # dump session state + unlock progress
 *   :transcript                           # full message history with the current suspect
 *   :unlock <condition-id>                # manually force-unlock (mimic host fallback)
 *   :reset                                # wipe transcript + unlock-state for the current suspect
 *   :quit                                 # delete the synthetic session and exit
 *
 * Requirements:
 *   - Local Supabase reachable (run `supabase start` from the repo root).
 *   - OPENROUTER_API_KEY in .env.local (or env).
 *
 * The script creates one session row and one player row at startup, and
 * deletes them on exit. No production data is touched.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import { stdin as input, stdout as output, exit } from "node:process";
// Node 20 lacks a global WebSocket; supabase-js's RealtimeClient throws at
// construction time even when we never subscribe. Polyfill via `ws` before
// anything else runs, so both this script AND the engine's
// createSupabaseServerClient() (called from imported session-store code) work
// without per-client realtime.transport config.
import WebSocket from "ws";
if (typeof globalThis.WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = WebSocket;
}
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

// ---------------------------------------------------------------------------
// .env.local loader
// ---------------------------------------------------------------------------

function loadDotEnvLocal() {
  const envPath = path.join(repoRoot, ".env.local");
  if (!existsSync(envPath)) return;
  for (const rawLine of readFileSync(envPath, "utf8").split("\n")) {
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
// Console formatting
// ---------------------------------------------------------------------------

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};
const paint = (color: keyof typeof ANSI, text: string) =>
  `${ANSI[color]}${text}${ANSI.reset}`;

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseCliArgs(): { caseId: string; chapterId: string | null } {
  const args = process.argv.slice(2);
  let caseId = process.env.CASE_ID?.trim() || "mussoorie";
  let chapterId: string | null = null;
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === "--case") caseId = args[++i];
    else if (a === "--chapter") chapterId = args[++i];
    else if (a === "--help" || a === "-h") {
      console.log(`Usage: npm run repl:interview -- [--case <id>] [--chapter <chapter-id>]`);
      exit(0);
    }
  }
  return { caseId, chapterId };
}

// ---------------------------------------------------------------------------
// Synthetic session setup
// ---------------------------------------------------------------------------

type SetupResult = {
  sessionId: string;
  playerId: string;
  initialChapterId: string;
  caseId: string;
};

async function pickInitialChapter(args: {
  supabaseUrl: string;
  serviceKey: string;
  caseId: string;
  requested: string | null;
}): Promise<string> {
  // Read case.json directly to find an interview chapter.
  const casePath = path.join(repoRoot, "cases", args.caseId, "case.json");
  const { parse } = await import("jsonc-parser");
  const caseData = parse(readFileSync(casePath, "utf8")) as {
    chapters: { id: string; type: string }[];
  };
  if (args.requested) {
    const ch = caseData.chapters.find((c) => c.id === args.requested);
    if (!ch) throw new Error(`Chapter "${args.requested}" not found in case "${args.caseId}"`);
    if (ch.type !== "interview") {
      throw new Error(
        `Chapter "${args.requested}" is type "${ch.type}", not "interview"`,
      );
    }
    return args.requested;
  }
  const firstInterview = caseData.chapters.find((c) => c.type === "interview");
  if (!firstInterview) {
    throw new Error(`No interview chapter found in case "${args.caseId}"`);
  }
  return firstInterview.id;
}

async function createSyntheticSession(args: {
  supabase: SupabaseClient;
  caseId: string;
  initialChapterId: string;
}): Promise<{ sessionId: string; playerId: string }> {
  // Read case.json to grab case version (sessions table requires it).
  const casePath = path.join(repoRoot, "cases", args.caseId, "case.json");
  const { parse } = await import("jsonc-parser");
  const caseData = parse(readFileSync(casePath, "utf8")) as {
    id: string;
    version: string;
  };

  const joinCode = `REPL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const { data: sessionRow, error: sessionError } = await args.supabase
    .from("sessions")
    .insert({
      case_id: caseData.id,
      case_version: caseData.version,
      join_code: joinCode,
      mode: "multi",
      status: "in_progress",
      phase: "interrogation",
      current_scene: "interview",
      current_chapter_id: args.initialChapterId,
    })
    .select("id")
    .single();
  if (sessionError || !sessionRow) {
    throw new Error(`Failed to insert session row: ${sessionError?.message ?? "unknown"}`);
  }
  const sessionId = sessionRow.id as string;

  const { data: playerRow, error: playerError } = await args.supabase
    .from("players")
    .insert({
      session_id: sessionId,
      name: "REPL Interviewer",
      seat_number: 1,
      device_id: `repl-${joinCode}`,
    })
    .select("id")
    .single();
  if (playerError || !playerRow) {
    throw new Error(`Failed to insert player row: ${playerError?.message ?? "unknown"}`);
  }
  const playerId = playerRow.id as string;

  // Mark this player as the current interviewer.
  const { error: updateError } = await args.supabase
    .from("sessions")
    .update({ current_interviewer_player_id: playerId })
    .eq("id", sessionId);
  if (updateError) {
    throw new Error(`Failed to set interviewer: ${updateError.message}`);
  }

  return { sessionId, playerId };
}

async function advanceUnlockedEvidenceToChapter(args: {
  supabase: SupabaseClient;
  sessionId: string;
  caseId: string;
  chapterId: string;
}): Promise<void> {
  // Walk chapters [0..targetIndex] and accumulate unlocked evidence the way
  // the host clicking through scenes would. Skips evidence with unlockBehavior
  // (those are dynamic-only) — mirroring the engine's getUnlockedEvidenceForChapter.
  const casePath = path.join(repoRoot, "cases", args.caseId, "case.json");
  const { parse } = await import("jsonc-parser");
  const caseData = parse(readFileSync(casePath, "utf8")) as {
    chapters: { id: string; type: string; evidenceIds?: string[] }[];
    evidence: { id: string; unlockedAtChapter: string; unlockBehavior?: unknown }[];
  };
  const targetIndex = caseData.chapters.findIndex((c) => c.id === args.chapterId);
  if (targetIndex === -1) return;

  const evidenceById = new Map(caseData.evidence.map((e) => [e.id, e]));
  const unlocked = new Set<string>();
  for (let i = 0; i <= targetIndex; i += 1) {
    const ch = caseData.chapters[i];
    if (ch.type === "evidence-reveal" && ch.evidenceIds) {
      for (const evId of ch.evidenceIds) {
        if (evidenceById.get(evId)?.unlockBehavior) continue;
        unlocked.add(evId);
      }
    }
    for (const ev of caseData.evidence) {
      if (ev.unlockBehavior) continue;
      if (ev.unlockedAtChapter === ch.id) unlocked.add(ev.id);
    }
  }

  await args.supabase
    .from("sessions")
    .update({ unlocked_evidence: Array.from(unlocked) })
    .eq("id", args.sessionId);
}

async function cleanupSession(supabase: SupabaseClient, sessionId: string) {
  // Cascade delete via the sessions row (FK on delete cascade for players,
  // messages, accusation_votes, interview_unlock_state, events).
  await supabase.from("sessions").delete().eq("id", sessionId);
}

// ---------------------------------------------------------------------------
// REPL
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(
    [
      "",
      paint("bold", "Commands:"),
      `  ${paint("cyan", "<question>")}            Ask the current suspect a question (runs full askSuspect)`,
      `  ${paint("cyan", ":advance <chapter>")}    Switch to a different interview chapter (e.g. r2-interview-rhea)`,
      `  ${paint("cyan", ":present <evidence>")}   Stage an evidence id to present with the NEXT question`,
      `  ${paint("cyan", ":present")}              Clear the staged evidence`,
      `  ${paint("cyan", ":state")}                Print session + unlock state`,
      `  ${paint("cyan", ":transcript")}           Full message history with the current suspect`,
      `  ${paint("cyan", ":unlock <id>")}          Force-fire an unlock (mimics host fallback)`,
      `  ${paint("cyan", ":reset")}                Wipe transcript + unlock-state for current suspect`,
      `  ${paint("cyan", ":help")} / ${paint("cyan", "?")}             Show this help`,
      `  ${paint("cyan", ":quit")} / ${paint("cyan", ":q")}            Delete the synthetic session and exit`,
      "",
      paint(
        "dim",
        "Condition ids look like: secret:<id> | breaking-point:<id> | evidence:<id>",
      ),
      "",
    ].join("\n"),
  );
}

type ReplState = {
  setup: SetupResult;
  presentedEvidenceId: string | null;
};

async function runRepl() {
  // Parse args first so --help can bail before requiring env.
  const cli = parseCliArgs();

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error(
      paint(
        "red",
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (set in .env.local).",
      ),
    );
    exit(2);
  }
  if (!process.env.OPENROUTER_API_KEY) {
    console.error(paint("red", "OPENROUTER_API_KEY is not set."));
    exit(2);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Probe local Supabase.
  const { error: probeError } = await supabase.from("sessions").select("id").limit(1);
  if (probeError) {
    console.error(
      paint(
        "red",
        `Could not reach local Supabase at ${supabaseUrl}: ${probeError.message}`,
      ),
    );
    console.error(paint("dim", "Hint: run `supabase start` from the repo root."));
    exit(2);
  }

  const initialChapterId = await pickInitialChapter({
    supabaseUrl,
    serviceKey,
    caseId: cli.caseId,
    requested: cli.chapterId,
  });

  console.log(paint("bold", paint("cyan", "\n=== Interview REPL ===")));
  console.log(paint("dim", `case: ${cli.caseId}`));
  console.log(paint("dim", `model: ${process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini"}`));
  console.log(paint("dim", `chapter: ${initialChapterId}`));

  const { sessionId, playerId } = await createSyntheticSession({
    supabase,
    caseId: cli.caseId,
    initialChapterId,
  });
  console.log(paint("dim", `synthetic session: ${sessionId}`));
  console.log(paint("dim", `synthetic player:  ${playerId}`));

  await advanceUnlockedEvidenceToChapter({
    supabase,
    sessionId,
    caseId: cli.caseId,
    chapterId: initialChapterId,
  });

  const state: ReplState = {
    setup: {
      sessionId,
      playerId,
      initialChapterId,
      caseId: cli.caseId,
    },
    presentedEvidenceId: null,
  };

  // Cleanup on any exit path.
  const cleanup = async () => {
    try {
      await cleanupSession(supabase, sessionId);
      console.log(paint("dim", "\n(synthetic session deleted)"));
    } catch (err) {
      console.error(paint("red", `Cleanup failed: ${(err as Error).message}`));
    }
  };
  process.on("SIGINT", async () => {
    await cleanup();
    exit(0);
  });

  // Import engine code lazily so dotenv has loaded first.
  const sessionStore = await import("../src/lib/session-store");

  printHelp();

  const rl = readline.createInterface({ input, output });

  const printCurrentChapter = async () => {
    const ctx = await sessionStore.getInterviewContext(sessionId);
    console.log(
      paint("magenta", `\nNow interviewing: ${ctx.suspect.name} (chapter: ${ctx.chapter.id})`),
    );
  };
  await printCurrentChapter();

  while (true) {
    const line = (await rl.question(paint("bold", "\n> "))).trim();
    if (!line) continue;

    if (line === ":quit" || line === ":q") break;
    if (line === ":help" || line === "?") {
      printHelp();
      continue;
    }

    if (line === ":state") {
      const ctx = await sessionStore.getInterviewContext(sessionId);
      console.log(paint("yellow", "\n— session ——"));
      console.log(`  chapter: ${ctx.chapter.id}`);
      console.log(`  suspect: ${ctx.suspect.name}`);
      console.log(`  staged evidence: ${state.presentedEvidenceId ?? "(none)"}`);
      console.log(`  unlocked_evidence: ${ctx.session.unlocked_evidence.length} items`);
      if (ctx.session.unlocked_evidence.length) {
        console.log(
          paint(
            "dim",
            "    " + ctx.session.unlocked_evidence.join(", "),
          ),
        );
      }
      const { data: states } = await supabase
        .from("interview_unlock_state")
        .select("*")
        .eq("session_id", sessionId)
        .eq("suspect_id", ctx.suspect.id);
      console.log(paint("yellow", "— unlock state for this suspect —"));
      if (!states?.length) {
        console.log(paint("dim", "  (no conditions evaluated yet)"));
      } else {
        for (const s of states) {
          const status = s.met_at ? paint("green", "FIRED") : paint("dim", "pending");
          console.log(
            `  ${status}  ${s.condition_id}  attempts=${s.attempts} pressure=${s.pressure_count} maxAdj=${s.max_adjacency.toFixed(2)}`,
          );
          if (s.last_reason) console.log(paint("dim", `    last: ${s.last_reason}`));
        }
      }
      continue;
    }

    if (line === ":transcript") {
      const ctx = await sessionStore.getInterviewContext(sessionId);
      console.log(paint("yellow", `\n— transcript with ${ctx.suspect.name} —`));
      if (!ctx.messages.length) {
        console.log(paint("dim", "  (no messages yet)"));
      } else {
        for (const m of ctx.messages) {
          const speaker =
            m.role === "user"
              ? paint("cyan", "INTERVIEWER")
              : m.role === "system"
                ? paint("yellow", "SYSTEM")
                : paint("green", ctx.suspect.name.toUpperCase());
          console.log(`  ${speaker}: ${m.content}`);
        }
      }
      continue;
    }

    if (line.startsWith(":advance")) {
      const parts = line.split(/\s+/);
      const target = parts[1];
      if (!target) {
        console.log(paint("red", "  usage: :advance <chapter-id>"));
        continue;
      }
      try {
        await sessionStore.setSessionScene({
          sessionId,
          scene: "interview",
          chapterId: target,
        });
        await advanceUnlockedEvidenceToChapter({
          supabase,
          sessionId,
          caseId: cli.caseId,
          chapterId: target,
        });
        state.presentedEvidenceId = null;
        await printCurrentChapter();
      } catch (err) {
        console.error(paint("red", `  ${(err as Error).message}`));
      }
      continue;
    }

    if (line.startsWith(":present")) {
      const parts = line.split(/\s+/);
      const evId = parts[1];
      if (!evId) {
        state.presentedEvidenceId = null;
        console.log(paint("dim", "  staged evidence cleared"));
      } else {
        state.presentedEvidenceId = evId;
        console.log(paint("dim", `  next question will present: ${evId}`));
      }
      continue;
    }

    if (line.startsWith(":unlock")) {
      const parts = line.split(/\s+/);
      const conditionId = parts[1];
      if (!conditionId) {
        console.log(paint("red", "  usage: :unlock <condition-id>"));
        continue;
      }
      try {
        const result = await sessionStore.triggerHostUnlock({ sessionId, conditionId });
        console.log(
          paint(
            "green",
            `  Manually fired ${conditionId} (subject=${result.outcome.subject}).`,
          ),
        );
        if (result.systemMessage) {
          console.log(paint("yellow", `  system: ${result.systemMessage.content}`));
        }
      } catch (err) {
        console.error(paint("red", `  ${(err as Error).message}`));
      }
      continue;
    }

    if (line === ":reset") {
      const ctx = await sessionStore.getInterviewContext(sessionId);
      await supabase
        .from("messages")
        .delete()
        .eq("session_id", sessionId)
        .eq("suspect_id", ctx.suspect.id);
      await supabase
        .from("interview_unlock_state")
        .delete()
        .eq("session_id", sessionId)
        .eq("suspect_id", ctx.suspect.id);
      console.log(paint("dim", `  cleared transcript + unlock state for ${ctx.suspect.name}`));
      continue;
    }

    if (line.startsWith(":")) {
      console.log(paint("red", `  unknown command: ${line.split(/\s+/)[0]}  (try :help)`));
      continue;
    }

    // Free text → ask the current suspect.
    const question = line;
    const presentedEvidenceId = state.presentedEvidenceId;
    state.presentedEvidenceId = null; // consume the staged evidence

    try {
      const beforeUnlocked = (
        await sessionStore.getInterviewContext(sessionId)
      ).session.unlocked_evidence;
      const beforeUnlockedSet = new Set(beforeUnlocked);

      const t0 = Date.now();
      const result = await sessionStore.askSuspect({
        sessionId,
        playerId,
        question,
        presentedEvidenceId,
      });
      const elapsedMs = Date.now() - t0;

      const ctx = await sessionStore.getInterviewContext(sessionId);
      console.log(
        paint(
          "green",
          `\n${ctx.suspect.name}: ${result.assistantMessage.content}`,
        ),
      );

      if (result.systemMessages.length) {
        for (const sysMsg of result.systemMessages) {
          console.log(paint("yellow", `\n  [SYSTEM] ${sysMsg.content}`));
        }
      }

      const newlyUnlocked = ctx.session.unlocked_evidence.filter(
        (id) => !beforeUnlockedSet.has(id),
      );
      if (newlyUnlocked.length) {
        console.log(
          paint("yellow", `\n  + ${newlyUnlocked.length} evidence card(s) unlocked:`),
        );
        for (const id of newlyUnlocked) console.log(paint("yellow", `    • ${id}`));
      }

      // Per-condition verdicts (only for evaluated conditions).
      const interesting = result.unlockOutcomes.filter(
        (o) => o.verdict !== null || o.fired || o.hostFallbackPrompted,
      );
      if (interesting.length) {
        console.log(paint("dim", "\n  adjudicator verdicts:"));
        for (const o of interesting) {
          const tag = o.fired
            ? paint("green", "FIRED")
            : o.hostFallbackPrompted
              ? paint("yellow", "HOST-PROMPT")
              : paint("dim", "no-fire");
          const v = o.verdict;
          const detail = v
            ? `met=${v.met} conf=${v.confidence.toFixed(2)} | ${v.reason}`
            : "(gate not satisfied)";
          console.log(`    ${tag}  ${o.conditionId}  ${detail}`);
        }
      }

      console.log(paint("dim", `\n  (${elapsedMs}ms)`));
    } catch (err) {
      console.error(paint("red", `  Error: ${(err as Error).message}`));
    }
  }

  rl.close();
  await cleanup();
}

runRepl().catch(async (err) => {
  console.error(paint("red", err.stack ?? err.message ?? String(err)));
  exit(1);
});
