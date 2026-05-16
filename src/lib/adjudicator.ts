import type { Case, Suspect, UnlockBehavior } from "@/engine/types";

export type AdjudicatorInput = {
  caseData: Case;
  suspect: Suspect;
  conditionId: string;
  condition: AdjudicatorCondition;
  transcript: AdjudicatorTranscriptEntry[];
  modelOverride?: string;
};

export type AdjudicatorCondition = {
  unlockBehavior: UnlockBehavior;
  presentedEvidenceIdsInThisConversation: string[];
};

export type AdjudicatorTranscriptEntry = {
  role: "user" | "assistant" | "system";
  content: string;
  presentedEvidenceId?: string | null;
};

export type AdjudicatorVerdict = {
  met: boolean;
  confidence: number;
  reason: string;
  raw?: string;
};

export class AdjudicatorError extends Error {
  constructor(
    public code: "missing_api_key" | "openrouter_failed" | "invalid_response",
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

function evidencePresentedSatisfied(
  required: string[] | undefined,
  presented: string[],
): boolean {
  if (!required || required.length === 0) return true;
  const set = new Set(presented);
  return required.every((id) => set.has(id));
}

function formatTranscript(entries: AdjudicatorTranscriptEntry[]): string {
  if (entries.length === 0) return "(no messages yet)";

  return entries
    .map((entry) => {
      const presented = entry.presentedEvidenceId
        ? ` [evidence presented: ${entry.presentedEvidenceId}]`
        : "";
      const speaker =
        entry.role === "user"
          ? "INTERVIEWER"
          : entry.role === "assistant"
            ? "SUSPECT"
            : "SYSTEM";
      return `${speaker}${presented}: ${entry.content}`;
    })
    .join("\n\n");
}

function buildSystemPrompt(): string {
  return [
    "You are an adjudicator for a cooperative detective mystery game.",
    "Your job is to judge, based on the conversation transcript provided, whether a specific unlock condition has been met.",
    "",
    "You will be given:",
    "- The suspect being interviewed (name and short description).",
    "- The condition's cue: a natural-language description of what to look for in the transcript.",
    "- The transcript of the interview so far, with INTERVIEWER and SUSPECT turns.",
    "",
    "Output a single JSON object with three fields:",
    '{ "met": <boolean>, "confidence": <number from 0 to 1>, "reason": "<one short sentence>" }',
    "",
    "Rules:",
    "- The `met` field is true if and only if the condition has been clearly satisfied by the interviewer's questioning in the transcript.",
    "- The `confidence` field is how certain you are (0 = no signal, 1 = unambiguous).",
    "- The `reason` field is a one-sentence justification (max 25 words).",
    "- You are NOT generating roleplay or dialogue. You are judging a transcript.",
    "- If the condition has not been met, return false — do not be overly generous.",
    "- When the user message includes a section titled COMPOUND EVIDENCE GATE (already satisfied), those exhibit IDs are confirmed on the table for this interview. A single transcript line may only show one [evidence presented: ...] tag; still treat every listed ID as established context when judging the cooperation cue.",
    "- The condition's cue is the entire criterion. Do not add criteria of your own.",
    "",
    "Reply with strict JSON only, no prose, no Markdown fences.",
  ].join("\n");
}

function formatCompoundEvidenceLines(caseData: Case, evidenceIds: string[]): string {
  return evidenceIds
    .map((id) => {
      const ev = caseData.evidence.find((item) => item.id === id);
      return ev ? `- ${id}: ${ev.title}` : `- ${id}`;
    })
    .join("\n");
}

function buildUserPrompt(input: AdjudicatorInput): string {
  const { caseData, suspect, condition, transcript } = input;
  const cue = condition.unlockBehavior.cooperationCue ?? "(no cue provided)";
  const behavior = condition.unlockBehavior;

  let compoundEvidenceBlock = "";
  if (
    behavior.tier === "compound" &&
    behavior.evidenceIds?.length &&
    evidencePresentedSatisfied(behavior.evidenceIds, condition.presentedEvidenceIdsInThisConversation)
  ) {
    compoundEvidenceBlock = [
      "",
      "COMPOUND EVIDENCE GATE (already satisfied for this judgment call):",
      "These exhibits are already on the table in this conversation. The transcript may show only one [evidence presented: ...] tag on the latest turn; the session has still established the full set below:",
      formatCompoundEvidenceLines(caseData, behavior.evidenceIds),
      "",
    ].join("\n");
  }

  return [
    `SUSPECT: ${suspect.name}${suspect.shortDescription ? ` — ${suspect.shortDescription}` : ""}`,
    compoundEvidenceBlock,
    "CONDITION CUE:",
    cue,
    "",
    "TRANSCRIPT:",
    formatTranscript(transcript),
    "",
    "Has the condition been met? Reply with strict JSON only.",
  ].join("\n");
}

function safeParseVerdict(raw: string): AdjudicatorVerdict {
  const trimmed = raw.trim();

  const tryParse = (text: string): AdjudicatorVerdict | null => {
    try {
      const parsed = JSON.parse(text) as Partial<AdjudicatorVerdict>;
      if (
        typeof parsed.met === "boolean" &&
        typeof parsed.confidence === "number" &&
        typeof parsed.reason === "string"
      ) {
        return {
          met: parsed.met,
          confidence: Math.max(0, Math.min(1, parsed.confidence)),
          reason: parsed.reason.slice(0, 240),
          raw: trimmed,
        };
      }
    } catch {
      // fall through
    }
    return null;
  };

  // Direct attempt.
  const direct = tryParse(trimmed);
  if (direct) return direct;

  // Try to extract a JSON object from a longer response.
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    const extracted = tryParse(match[0]);
    if (extracted) return extracted;
  }

  throw new AdjudicatorError(
    "invalid_response",
    `Adjudicator returned malformed JSON: ${trimmed.slice(0, 200)}`,
  );
}

export async function judgeUnlock(input: AdjudicatorInput): Promise<AdjudicatorVerdict> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AdjudicatorError(
      "missing_api_key",
      "OPENROUTER_API_KEY is not configured. Adjudicator cannot run.",
    );
  }

  const behavior = input.condition.unlockBehavior;

  // Evidence-only tier: no LLM call needed; judged purely on presented evidence.
  if (behavior.tier === "evidence") {
    const met = evidencePresentedSatisfied(
      behavior.evidenceIds,
      input.condition.presentedEvidenceIdsInThisConversation,
    );
    return {
      met,
      confidence: met ? 1 : 0,
      reason: met
        ? "All required evidence has been presented in this conversation."
        : "Required evidence has not yet been presented in this conversation.",
    };
  }

  // Cooperation and compound tiers need the LLM to judge the conversational cue.
  // Compound tier also gates on evidence — if the evidence isn't all there, short-circuit.
  if (behavior.tier === "compound") {
    const evidenceMet = evidencePresentedSatisfied(
      behavior.evidenceIds,
      input.condition.presentedEvidenceIdsInThisConversation,
    );
    if (!evidenceMet) {
      return {
        met: false,
        confidence: 0.9,
        reason: "Compound condition: required evidence has not yet been presented.",
      };
    }
  }

  // Pressure-only tier: there's no cue text; just count attempts (handled by caller via attempts counter).
  // We return a "not met by judgment" answer; the caller looks at attempts vs pressureThreshold.
  if (behavior.tier === "pressure" && !behavior.cooperationCue) {
    return {
      met: false,
      confidence: 0,
      reason: "Pressure-tier condition without a cooperation cue is evaluated by the caller, not the LLM.",
    };
  }

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
      "X-Title": "Mystery Engine Adjudicator",
    },
    body: JSON.stringify({
      model,
      stream: false,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
  });

  if (!response.ok) {
    throw new AdjudicatorError(
      "openrouter_failed",
      `OpenRouter returned status ${response.status} from the adjudicator call.`,
    );
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = payload.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) {
    throw new AdjudicatorError(
      "invalid_response",
      "Adjudicator returned an empty response from OpenRouter.",
    );
  }

  return safeParseVerdict(content);
}
