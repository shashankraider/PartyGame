import type { Case } from "@/engine/types";
import type { MessageRow, SessionPhase, SessionRow } from "@/lib/supabase";
import {
  addUnlockedEvidence,
  insertSystemMessage,
  type UnlockSubject,
} from "@/lib/interview-unlocks";

/**
 * Phase 2i.1 — AI host-judgment service.
 *
 * After the per-cue adjudicator finishes evaluating suspect-tied unlocks, the
 * engine asks the AI host one separate question: should a forensic event land
 * now? In 2i.1 the *only* decision in scope is whether to surface evidence
 * `anonymous-letter-2` (the Thakur-pivot letter). 2i.2 broadens the surface
 * to other forensic events and phase transitions; 2i.3 ports the trigger
 * conditions into authored `arrivesWhen` text on each evidence row.
 *
 * Intentional separation from the adjudicator: this module never decides
 * suspect cues, never modifies transcripts beyond appending one system row,
 * and never reads/writes interview_unlock_state. It is a thin
 * forensic-pacing service the engine consults once per askSuspect turn.
 */

export const HOST_JUDGMENT_TARGET_EVIDENCE_ID = "anonymous-letter-2";

export type HostJudgmentTranscript = {
  suspectId: string;
  suspectName: string;
  /**
   * Already opened-up? In 2i.1 this is true when the suspect has a cooperation
   * secret that has fired — surfaced by the caller from `interview_unlock_state`.
   */
  hasOpenedUp: boolean;
  messages: HostJudgmentMessage[];
};

export type HostJudgmentMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type HostJudgmentInput = {
  caseData: Case;
  session: SessionRow;
  /** All per-suspect transcripts in the session — the host sees the whole room. */
  allTranscripts: HostJudgmentTranscript[];
  /** Current contents of session.unlocked_evidence. */
  unlockedEvidence: string[];
  /** Optional explicit model override. */
  modelOverride?: string;
};

type HostJudgmentVerdictBase = {
  /** One short sentence explaining the verdict. */
  reason: string;
  /** Confidence 0..1; mostly informational. */
  confidence: number;
  /** Raw LLM payload for debugging. */
  raw?: string;
};

export type HostJudgmentVerdict =
  | (HostJudgmentVerdictBase & {
      action: "do-nothing";
      evidenceId?: undefined;
      targetPhase?: undefined;
    })
  | (HostJudgmentVerdictBase & {
      action: "drop-evidence";
      evidenceId: string;
      targetPhase?: undefined;
    })
  | (HostJudgmentVerdictBase & {
      action: "transition-phase";
      targetPhase: SessionPhase;
      evidenceId?: undefined;
    });

export class HostJudgmentError extends Error {
  constructor(
    public code: "missing_api_key" | "openrouter_failed" | "invalid_response",
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

const HOST_JUDGMENT_ACTIONS = ["do-nothing", "drop-evidence", "transition-phase"] as const;
const HOST_JUDGMENT_PHASES = ["briefing", "interrogation", "accusation", "reveal"] as const;

// ---------------------------------------------------------------------------
// Pure helpers (covered by tests/host-judgment.test.mjs).
// ---------------------------------------------------------------------------

/**
 * Short-circuit: if the target evidence is already in session.unlocked_evidence,
 * no need to ask the LLM. Returns a do-nothing verdict.
 */
export function alreadyUnlockedVerdict(
  evidenceId: string,
  unlockedEvidence: string[],
): HostJudgmentVerdict | null {
  if (unlockedEvidence.includes(evidenceId)) {
    return {
      action: "do-nothing",
      reason: `${evidenceId} is already in unlocked_evidence; nothing to do.`,
      confidence: 1,
    };
  }
  return null;
}

/**
 * Parse the LLM's response into a structured verdict. Tries strict JSON first,
 * falls back to extracting a JSON object from a longer response, and throws
 * HostJudgmentError on malformed output.
 */
export function parseHostJudgmentVerdict(raw: string): HostJudgmentVerdict {
  const trimmed = raw.trim();

  const tryParse = (text: string): HostJudgmentVerdict | null => {
    try {
      const parsed = JSON.parse(text) as {
        action?: unknown;
        evidenceId?: unknown;
        targetPhase?: unknown;
        reason?: unknown;
        confidence?: unknown;
      };
      if (
        typeof parsed.action === "string" &&
        HOST_JUDGMENT_ACTIONS.includes(parsed.action as (typeof HOST_JUDGMENT_ACTIONS)[number]) &&
        typeof parsed.reason === "string" &&
        (parsed.confidence === undefined || typeof parsed.confidence === "number")
      ) {
        const base = {
          reason: parsed.reason.slice(0, 240),
          confidence:
            typeof parsed.confidence === "number"
              ? Math.max(0, Math.min(1, parsed.confidence))
              : parsed.action === "drop-evidence"
                ? 0.7
                : parsed.action === "transition-phase"
                  ? 0.7
                  : 0.5,
          raw: trimmed,
        };
        if (parsed.action === "drop-evidence") {
          if (typeof parsed.evidenceId !== "string" || !parsed.evidenceId) {
            return null;
          }
          return { ...base, action: parsed.action, evidenceId: parsed.evidenceId };
        }
        if (parsed.action === "transition-phase") {
          if (
            typeof parsed.targetPhase !== "string" ||
            !HOST_JUDGMENT_PHASES.includes(
              parsed.targetPhase as (typeof HOST_JUDGMENT_PHASES)[number],
            )
          ) {
            return null;
          }
          return { ...base, action: parsed.action, targetPhase: parsed.targetPhase as SessionPhase };
        }
        if (parsed.action === "do-nothing") {
          return { ...base, action: parsed.action };
        }
      }
    } catch {
      // fall through
    }
    return null;
  };

  const direct = tryParse(trimmed);
  if (direct) return direct;

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    const extracted = tryParse(match[0]);
    if (extracted) return extracted;
  }

  throw new HostJudgmentError(
    "invalid_response",
    `Host judgment returned malformed JSON: ${trimmed.slice(0, 200)}`,
  );
}

/**
 * Build the system prompt the host LLM sees. Stateless string-builder; pure.
 */
export function buildHostSystemPrompt(): string {
  return [
    "You are the AI host for a cooperative detective mystery game (Mystery Engine).",
    "Your job: judge whether the case is ready for a forensic-evidence event or phase transition.",
    "",
    "In this call you may judge two kinds of pacing action:",
    "1. Should the second anonymous letter (evidence id `anonymous-letter-2`) be revealed to the players right now?",
    "2. Should the session move to the next phase?",
    "",
    "Evidence trigger criteria (be conservative; err toward 'wait'):",
    "- At least Naina, Rhea, and Kabir have each opened up to the players (their cooperation cues have fired).",
    "- AND the Thakur family (or the Thakurs, or the 2011 Thakur murders) has been mentioned at least twice across all suspect transcripts, by either an interviewer or a suspect.",
    "- Both must hold. If either is missing, return 'do-nothing'.",
    "",
    "Phase transition criteria (be even more conservative):",
    "- briefing -> interrogation only after the suspect-board briefing is complete.",
    "- interrogation -> accusation only when the players have enough revealed evidence and admissions to make a fair accusation.",
    "- accusation -> reveal only after accusation voting is complete.",
    "- Never skip a phase or move backward.",
    "- If evidence and a phase transition both seem ready, prefer the evidence drop first unless the current phase is no longer playable.",
    "",
    "Output a single JSON object:",
    '{ "action": "do-nothing" | "drop-evidence" | "transition-phase", "evidenceId": "<id>", "targetPhase": "briefing" | "interrogation" | "accusation" | "reveal", "reason": "<one short sentence>", "confidence": <number 0..1> }',
    "",
    "Rules:",
    '- `action` is "drop-evidence" only when the trigger criteria above are met AND the target evidence is not already in unlocked_evidence.',
    '- When `action` is "drop-evidence", `evidenceId` must be exactly "anonymous-letter-2".',
    '- When `action` is "transition-phase", `targetPhase` must be exactly the next valid phase.',
    '- When `action` is "do-nothing", omit `evidenceId` or set it to null.',
    "- `reason` is a one-sentence justification (max 30 words).",
    "- `confidence` is your certainty, 0 = no signal, 1 = unambiguous.",
    "- You are NOT generating roleplay or dialogue. You are making a pacing call.",
    "",
    "Reply with strict JSON only, no prose, no Markdown fences.",
  ].join("\n");
}

export function buildHostUserPrompt(input: HostJudgmentInput): string {
  const { allTranscripts, session, unlockedEvidence } = input;

  const openedUp = allTranscripts.filter((t) => t.hasOpenedUp).map((t) => t.suspectName);
  const notOpenedYet = allTranscripts
    .filter((t) => !t.hasOpenedUp)
    .map((t) => t.suspectName);

  const transcriptBlocks = allTranscripts
    .filter((t) => t.messages.length > 0)
    .map((t) => {
      const header = `--- TRANSCRIPT: ${t.suspectName} (${t.hasOpenedUp ? "opened up" : "still guarded"}) ---`;
      const body = t.messages
        .map((m) => {
          const speaker =
            m.role === "user"
              ? "INTERVIEWER"
              : m.role === "assistant"
                ? t.suspectName.toUpperCase()
                : "SYSTEM";
          return `${speaker}: ${m.content}`;
        })
        .join("\n");
      return `${header}\n${body}`;
    })
    .join("\n\n");

  return [
    `TARGET EVIDENCE: ${HOST_JUDGMENT_TARGET_EVIDENCE_ID} ("The Second Anonymous Letter").`,
    `Current phase: ${session.phase ?? "briefing"}.`,
    `Current chapter id: ${session.current_chapter_id ?? "(none)"}.`,
    `Already-unlocked evidence in this session: ${unlockedEvidence.length > 0 ? unlockedEvidence.join(", ") : "(none)"}`,
    `Suspects who have opened up so far: ${openedUp.length > 0 ? openedUp.join(", ") : "(none)"}`,
    `Suspects still guarded: ${notOpenedYet.length > 0 ? notOpenedYet.join(", ") : "(none)"}`,
    "",
    "TRANSCRIPTS:",
    transcriptBlocks || "(no interviews have produced any messages yet)",
    "",
    "Should the second anonymous letter be revealed now? Reply with strict JSON only.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Main entry point.
// ---------------------------------------------------------------------------

export async function judgeHostAction(
  input: HostJudgmentInput,
): Promise<HostJudgmentVerdict> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new HostJudgmentError(
      "missing_api_key",
      "OPENROUTER_API_KEY is not configured. Host judgment cannot run.",
    );
  }

  // Short-circuit the legacy 2i.1 evidence-only case. During Interrogation we
  // still call the host because it may now choose a phase transition.
  const shortCircuit = alreadyUnlockedVerdict(
    HOST_JUDGMENT_TARGET_EVIDENCE_ID,
    input.unlockedEvidence,
  );
  if (shortCircuit && input.session.phase !== "interrogation") return shortCircuit;

  const model =
    input.modelOverride ??
    input.caseData.llm?.modelOverride ??
    process.env.OPENROUTER_MODEL ??
    "openai/gpt-4o-mini";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      // HTTP header values must be ASCII. Do not use em-dashes or other Unicode here.
      "X-Title": "Mystery Engine Host Judgment",
    },
    body: JSON.stringify({
      model,
      stream: false,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildHostSystemPrompt() },
        { role: "user", content: buildHostUserPrompt(input) },
      ],
    }),
  });

  if (!response.ok) {
    throw new HostJudgmentError(
      "openrouter_failed",
      `OpenRouter returned status ${response.status} from the host-judgment call.`,
    );
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = payload.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) {
    throw new HostJudgmentError(
      "invalid_response",
      "Host judgment returned an empty response from OpenRouter.",
    );
  }

  return parseHostJudgmentVerdict(content);
}

// ---------------------------------------------------------------------------
// Unlock firing. Re-uses helpers from interview-unlocks.ts so the system
// message + unlocked_evidence update follow the same pattern as adjudicator
// unlocks.
// ---------------------------------------------------------------------------

export type FireHostJudgmentInput = {
  session: SessionRow;
  evidenceId: string;
  /**
   * Which suspect's transcript to attach the system message to. The forensic
   * letter isn't tied to one suspect, but the messages table requires a
   * suspect_id. The caller passes the *current* interview suspect (the one
   * the players were talking to when the judgment fired) so the announcement
   * lands inline with the conversation that triggered it.
   */
  suspectId: string;
  announcement: string;
  reason: string;
};

export type FireHostJudgmentResult = {
  systemMessage: MessageRow;
  updatedSession: SessionRow;
};

/**
 * Fire the unlock. Inserts a `system` message into the current suspect's
 * transcript and appends the evidence id to session.unlocked_evidence.
 *
 * Returns the inserted message + updated session so the caller can wire them
 * into the askSuspect return shape.
 */
export async function fireHostJudgmentUnlock(
  input: FireHostJudgmentInput,
): Promise<FireHostJudgmentResult> {
  const systemMessage = await insertSystemMessage({
    sessionId: input.session.id,
    suspectId: input.suspectId,
    content: input.announcement,
  });

  const updatedSession = await addUnlockedEvidence({
    sessionId: input.session.id,
    evidenceId: input.evidenceId,
    currentUnlocked: input.session.unlocked_evidence,
  });

  return { systemMessage, updatedSession };
}

// Re-export UnlockSubject so callers that need it don't have to dual-import.
export type { UnlockSubject };
