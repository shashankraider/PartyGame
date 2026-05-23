import type { Case, Suspect, UnlockBehavior } from "@/engine/types";
import {
  judgeUnlock,
  type AdjudicatorTranscriptEntry,
  type AdjudicatorVerdict,
} from "@/lib/adjudicator";
import type {
  InterviewUnlockStateRow,
  MessageRow,
  SessionRow,
} from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase";

const HOST_FALLBACK_ADJACENCY_THRESHOLD = 0.4;

export type UnlockSubject = "secret" | "breaking-point" | "evidence";

export type PendingCondition = {
  subject: UnlockSubject;
  conditionId: string; // "secret:<id>" / "breaking-point:<id>" / "evidence:<id>"
  unlockBehavior: UnlockBehavior;
  revealedText: string;
  /**
   * Optional. For "evidence" subjects, the evidence id whose unlock surfacing
   * we'll add to session.unlocked_evidence when fired.
   */
  evidenceId?: string;
  /**
   * For secret/breaking-point unlocks, the player-facing label used in the
   * system message announcing the unlock. For evidence subjects this is the
   * evidence title.
   */
  label: string;
};

export type UnlockOutcome = {
  conditionId: string;
  subject: UnlockSubject;
  state: InterviewUnlockStateRow;
  verdict: AdjudicatorVerdict | null; // null when the evidence gate short-circuited
  fired: boolean;
  hostFallbackPrompted: boolean;
  /**
   * For fired secret/breaking-point unlocks, the canonical revelation the
   * suspect should weave into their next response. For evidence unlocks this
   * is the evidence loreText (used to provide context, not necessarily spoken).
   */
  revealedText?: string;
  label: string;
};

export type EvaluateUnlocksInput = {
  caseData: Case;
  session: SessionRow;
  suspect: Suspect;
  messages: MessageRow[];
  /**
   * The just-completed exchange. The adjudicator sees the prior `messages`
   * plus this turn's user+assistant content.
   */
  latestUserMessage: MessageRow;
  latestAssistantMessage: MessageRow;
};

export type EvaluateUnlocksResult = {
  outcomes: UnlockOutcome[];
  systemMessagesInserted: MessageRow[];
  updatedSession: SessionRow;
};

export type ActiveHostFallback = {
  conditionId: string;
  subject: UnlockSubject;
  label: string;
  attempts: number;
  maxAdjacency: number;
  evidenceId?: string;
};

/**
 * Pending unlock conditions on the given suspect that:
 *  - have not been met,
 *  - have an authored hostFallbackAfterTurns,
 *  - have been attempted more than that threshold,
 *  - have low max_adjacency (<0.4) — players are LOST, not just slow,
 *  - AND, for evidence-tier/compound conditions, have their evidence gate
 *    already satisfied in this conversation (no point prompting the host to
 *    reveal something whose pre-conditions aren't met).
 *
 * For 2g.1 we only surface evidence-subject fallbacks — secret/breaking-point
 * host-reveals are deferred to 2g.2.
 */
export async function getActiveHostFallbacks(input: {
  caseData: Case;
  session: SessionRow;
  suspect: Suspect;
}): Promise<ActiveHostFallback[]> {
  const states = await loadStates({
    sessionId: input.session.id,
    suspectId: input.suspect.id,
  });
  const pending = listPendingConditions({
    caseData: input.caseData,
    suspect: input.suspect,
    session: input.session,
    existingStates: states,
  });

  const active: ActiveHostFallback[] = [];

  for (const condition of pending) {
    // 2g.1 scope: evidence-subject only.
    if (condition.subject !== "evidence") continue;
    const fallbackAt = condition.unlockBehavior.hostFallbackAfterTurns;
    if (fallbackAt === undefined) continue;
    const state = states.find((s) => s.condition_id === condition.conditionId);
    if (!state) continue;
    if (state.met_at) continue;
    if (state.attempts <= fallbackAt) continue;
    if (state.max_adjacency >= HOST_FALLBACK_ADJACENCY_THRESHOLD) continue;
    active.push({
      conditionId: condition.conditionId,
      subject: condition.subject,
      label: condition.label,
      attempts: state.attempts,
      maxAdjacency: state.max_adjacency,
      evidenceId: condition.evidenceId,
    });
  }

  return active;
}

export type FireHostUnlockInput = {
  caseData: Case;
  session: SessionRow;
  suspect: Suspect;
  conditionId: string;
};

export type FireHostUnlockResult = {
  outcome: UnlockOutcome;
  systemMessage: MessageRow | null;
  updatedSession: SessionRow;
};

export async function fireHostUnlock(
  input: FireHostUnlockInput,
): Promise<FireHostUnlockResult> {
  const states = await loadStates({
    sessionId: input.session.id,
    suspectId: input.suspect.id,
  });
  const pending = listPendingConditions({
    caseData: input.caseData,
    suspect: input.suspect,
    session: input.session,
    existingStates: states,
  });

  const condition = pending.find((c) => c.conditionId === input.conditionId);
  if (!condition) {
    throw new Error(`Condition not available for host unlock: ${input.conditionId}`);
  }

  if (condition.subject !== "evidence") {
    throw new Error(
      `Host fallback for ${condition.subject} subjects is deferred to Phase 2g.2`,
    );
  }

  const announcement = unlockAnnouncement(condition);
  let systemMessage: MessageRow | null = null;
  if (announcement) {
    systemMessage = await insertSystemMessage({
      sessionId: input.session.id,
      suspectId: input.suspect.id,
      content: announcement,
    });
  }

  let updatedSession = input.session;
  if (condition.evidenceId) {
    updatedSession = await addUnlockedEvidence({
      sessionId: input.session.id,
      evidenceId: condition.evidenceId,
      currentUnlocked: input.session.unlocked_evidence,
    });
  }

  const stateAfterFire = await upsertState({
    sessionId: input.session.id,
    suspectId: input.suspect.id,
    conditionId: condition.conditionId,
    attemptsDelta: 0,
    pressureDelta: 0,
    newMaxAdjacency: 0,
    lastReason: "Host fallback: revealed manually because players were stuck.",
    metVia: "host",
  });

  return {
    outcome: {
      conditionId: condition.conditionId,
      subject: condition.subject,
      state: stateAfterFire,
      verdict: null,
      fired: true,
      hostFallbackPrompted: false,
      revealedText: condition.revealedText,
      label: condition.label,
    },
    systemMessage,
    updatedSession,
  };
}

/**
 * Build the list of conditions on `suspect` that have an unlockBehavior and
 * have not yet been fired in this session. Includes evidence pieces (across
 * the whole case) whose unlockBehavior names this suspect via
 * relatesToSuspectIds and whose evidence id is not in session.unlocked_evidence.
 */
export function listPendingConditions(input: {
  caseData: Case;
  suspect: Suspect;
  session: SessionRow;
  existingStates: InterviewUnlockStateRow[];
}): PendingCondition[] {
  const { caseData, suspect, session, existingStates } = input;
  const metIds = new Set(existingStates.filter((s) => s.met_at).map((s) => s.condition_id));
  const out: PendingCondition[] = [];

  for (const secret of suspect.secrets ?? []) {
    if (!secret.unlockBehavior) continue;
    const conditionId = `secret:${secret.id}`;
    if (metIds.has(conditionId)) continue;
    out.push({
      subject: "secret",
      conditionId,
      unlockBehavior: secret.unlockBehavior,
      revealedText: secret.revealedText,
      label: secret.topic,
    });
  }

  for (const bp of suspect.breakingPoints ?? []) {
    if (!bp.unlockBehavior) continue;
    const conditionId = `breaking-point:${bp.id}`;
    if (metIds.has(conditionId)) continue;
    out.push({
      subject: "breaking-point",
      conditionId,
      unlockBehavior: bp.unlockBehavior,
      revealedText: bp.reaction,
      label: bp.id,
    });
  }

  for (const evidence of caseData.evidence) {
    if (!evidence.unlockBehavior) continue;
    if (!evidence.relatesToSuspectIds?.includes(suspect.id)) continue;
    if (session.unlocked_evidence.includes(evidence.id)) continue;
    const conditionId = `evidence:${evidence.id}`;
    if (metIds.has(conditionId)) continue;
    out.push({
      subject: "evidence",
      conditionId,
      unlockBehavior: evidence.unlockBehavior,
      revealedText: evidence.loreText,
      evidenceId: evidence.id,
      label: evidence.title,
    });
  }

  return out;
}

function collectPresentedEvidenceIds(
  messages: MessageRow[],
  latestUserMessage: MessageRow,
): string[] {
  const seen = new Set<string>();
  for (const m of messages) {
    if (m.role === "user" && m.presented_evidence_id) seen.add(m.presented_evidence_id);
  }
  if (latestUserMessage.presented_evidence_id) seen.add(latestUserMessage.presented_evidence_id);
  return [...seen];
}

function evidenceGateSatisfied(
  behavior: UnlockBehavior,
  presentedEvidenceIds: string[],
): boolean {
  if (behavior.tier !== "evidence" && behavior.tier !== "compound") return true;
  const required = behavior.evidenceIds ?? [];
  if (required.length === 0) return true;
  const set = new Set(presentedEvidenceIds);
  return required.every((id) => set.has(id));
}

function buildTranscriptForAdjudicator(
  history: MessageRow[],
  user: MessageRow,
  assistant: MessageRow,
): AdjudicatorTranscriptEntry[] {
  const entries: AdjudicatorTranscriptEntry[] = [];
  for (const m of history) {
    entries.push({
      role: m.role,
      content: m.content,
      presentedEvidenceId: m.presented_evidence_id ?? undefined,
    });
  }
  entries.push({
    role: "user",
    content: user.content,
    presentedEvidenceId: user.presented_evidence_id ?? undefined,
  });
  entries.push({ role: "assistant", content: assistant.content });
  return entries;
}

async function loadStates(input: {
  sessionId: string;
  suspectId: string;
}): Promise<InterviewUnlockStateRow[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_unlock_state")
    .select("*")
    .eq("session_id", input.sessionId)
    .eq("suspect_id", input.suspectId);
  if (error) throw error;
  return data ?? [];
}

async function upsertState(input: {
  sessionId: string;
  suspectId: string;
  conditionId: string;
  attemptsDelta: number;
  pressureDelta: number;
  newMaxAdjacency: number;
  lastReason: string | null;
  metVia?: "adjudicator" | "host" | "evidence-only";
}): Promise<InterviewUnlockStateRow> {
  const supabase = createSupabaseServerClient();

  // Read existing.
  const { data: existing } = await supabase
    .from("interview_unlock_state")
    .select("*")
    .eq("session_id", input.sessionId)
    .eq("suspect_id", input.suspectId)
    .eq("condition_id", input.conditionId)
    .maybeSingle();

  const nextAttempts = (existing?.attempts ?? 0) + input.attemptsDelta;
  const nextPressure = (existing?.pressure_count ?? 0) + input.pressureDelta;
  const nextMaxAdjacency = Math.max(existing?.max_adjacency ?? 0, input.newMaxAdjacency);

  const row = {
    session_id: input.sessionId,
    suspect_id: input.suspectId,
    condition_id: input.conditionId,
    attempts: nextAttempts,
    pressure_count: nextPressure,
    max_adjacency: nextMaxAdjacency,
    last_reason: input.lastReason,
    last_evaluated_at: new Date().toISOString(),
    met_at: input.metVia ? existing?.met_at ?? new Date().toISOString() : (existing?.met_at ?? null),
    met_via: input.metVia ?? existing?.met_via ?? null,
  };

  const { data, error } = await supabase
    .from("interview_unlock_state")
    .upsert(row, { onConflict: "session_id,suspect_id,condition_id" })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Failed to upsert interview_unlock_state");
  return data;
}

async function getNextMessageSequence(input: {
  sessionId: string;
  suspectId: string;
}): Promise<number> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("messages")
    .select("sequence")
    .eq("session_id", input.sessionId)
    .eq("suspect_id", input.suspectId)
    .order("sequence", { ascending: false })
    .limit(1);
  if (error) throw error;
  const last = data?.[0]?.sequence ?? 0;
  return last + 1;
}

export async function insertSystemMessage(input: {
  sessionId: string;
  suspectId: string;
  content: string;
}): Promise<MessageRow> {
  const supabase = createSupabaseServerClient();
  const sequence = await getNextMessageSequence({
    sessionId: input.sessionId,
    suspectId: input.suspectId,
  });
  const { data, error } = await supabase
    .from("messages")
    .insert({
      session_id: input.sessionId,
      suspect_id: input.suspectId,
      role: "system",
      content: input.content,
      is_streaming: false,
      sequence,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to insert system message");
  return data;
}

export async function addUnlockedEvidence(input: {
  sessionId: string;
  evidenceId: string;
  currentUnlocked: string[];
}): Promise<SessionRow> {
  if (input.currentUnlocked.includes(input.evidenceId)) {
    // Already unlocked — return the existing session unchanged.
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", input.sessionId)
      .single();
    if (!data) throw new Error("Session not found");
    return data;
  }
  const supabase = createSupabaseServerClient();
  const next = [...input.currentUnlocked, input.evidenceId];
  const { data, error } = await supabase
    .from("sessions")
    .update({
      unlocked_evidence: next,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", input.sessionId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update unlocked_evidence");
  return data;
}

/**
 * What (if anything) to write to the messages table as a system row when an
 * unlock fires. Returns null for secret/breaking-point unlocks because their
 * revelation is woven into the suspect's own assistant turn (see B1 design).
 * Evidence unlocks still get a brief system banner because they correspond to
 * a real evidence card landing in the locker, which is a different surface.
 */
function unlockAnnouncement(condition: PendingCondition): string | null {
  switch (condition.subject) {
    case "secret":
    case "breaking-point":
      return null;
    case "evidence":
      return `Evidence added: ${condition.label}.`;
  }
}

export async function evaluatePendingUnlocks(
  input: EvaluateUnlocksInput,
): Promise<EvaluateUnlocksResult> {
  const { caseData, session, suspect, messages, latestUserMessage, latestAssistantMessage } =
    input;

  const states = await loadStates({ sessionId: session.id, suspectId: suspect.id });
  const pending = listPendingConditions({
    caseData,
    suspect,
    session,
    existingStates: states,
  });

  if (pending.length === 0) {
    return { outcomes: [], systemMessagesInserted: [], updatedSession: session };
  }

  const presentedEvidenceIds = collectPresentedEvidenceIds(messages, latestUserMessage);
  const transcript = buildTranscriptForAdjudicator(
    messages,
    latestUserMessage,
    latestAssistantMessage,
  );

  const outcomes: UnlockOutcome[] = [];

  // Phase 1: judge every pending condition. Evidence-gated conditions short-circuit.
  const judgments = await Promise.all(
    pending.map(async (condition): Promise<{
      condition: PendingCondition;
      verdict: AdjudicatorVerdict | null;
      gateOpen: boolean;
    }> => {
      const gateOpen = evidenceGateSatisfied(condition.unlockBehavior, presentedEvidenceIds);
      if (!gateOpen) {
        return { condition, verdict: null, gateOpen: false };
      }
      // For pure pressure-tier without a cue, no LLM call.
      const behavior = condition.unlockBehavior;
      if (behavior.tier === "pressure" && !behavior.cooperationCue) {
        return {
          condition,
          verdict: {
            met: false,
            confidence: 0,
            reason: "Pressure-only tier without cue; advanced by pressureThreshold only.",
          },
          gateOpen: true,
        };
      }
      try {
        const verdict = await judgeUnlock({
          caseData,
          suspect,
          conditionId: condition.conditionId,
          condition: {
            unlockBehavior: behavior,
            presentedEvidenceIdsInThisConversation: presentedEvidenceIds,
          },
          transcript,
        });
        return { condition, verdict, gateOpen: true };
      } catch {
        // Treat adjudicator errors as a non-firing turn — don't crash the interview.
        return {
          condition,
          verdict: {
            met: false,
            confidence: 0,
            reason: "Adjudicator call failed; treated as non-firing.",
          },
          gateOpen: true,
        };
      }
    }),
  );

  // Phase 2: update state rows and decide what fires.
  let workingSession = session;
  const systemMessagesInserted: MessageRow[] = [];

  for (const { condition, verdict, gateOpen } of judgments) {
    if (!gateOpen) {
      // No attempt increment, no state change for evidence-gated conditions
      // whose evidence has not been presented yet. The host-fallback clock
      // starts only after the evidence is in hand.
      const existingState = states.find((s) => s.condition_id === condition.conditionId);
      outcomes.push({
        conditionId: condition.conditionId,
        subject: condition.subject,
        state:
          existingState ??
          ({
            session_id: session.id,
            suspect_id: suspect.id,
            condition_id: condition.conditionId,
            attempts: 0,
            pressure_count: 0,
            max_adjacency: 0,
            last_reason: null,
            last_evaluated_at: new Date().toISOString(),
            met_at: null,
            met_via: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as InterviewUnlockStateRow),
        verdict: null,
        fired: false,
        hostFallbackPrompted: false,
        label: condition.label,
      });
      continue;
    }

    if (!verdict) continue; // defensive; shouldn't happen

    const threshold = condition.unlockBehavior.pressureThreshold ?? 1;
    const pressureDelta = verdict.met ? 1 : 0;

    const updatedState = await upsertState({
      sessionId: session.id,
      suspectId: suspect.id,
      conditionId: condition.conditionId,
      attemptsDelta: 1,
      pressureDelta,
      newMaxAdjacency: verdict.confidence,
      lastReason: verdict.reason,
    });

    const willFire = verdict.met && updatedState.pressure_count >= threshold;
    let fired = false;
    let stateAfterFire = updatedState;

    if (willFire) {
      // Optional system-message announcement (evidence unlocks only — secret
      // and breaking-point revelations are woven into the suspect's own next
      // assistant turn via the two-pass roleplay in askSuspect).
      const announcement = unlockAnnouncement(condition);
      if (announcement) {
        const systemMessage = await insertSystemMessage({
          sessionId: session.id,
          suspectId: suspect.id,
          content: announcement,
        });
        systemMessagesInserted.push(systemMessage);
      }

      // If it's an evidence unlock, add to session.unlocked_evidence.
      if (condition.subject === "evidence" && condition.evidenceId) {
        workingSession = await addUnlockedEvidence({
          sessionId: session.id,
          evidenceId: condition.evidenceId,
          currentUnlocked: workingSession.unlocked_evidence,
        });
      }

      // Mark the state as met.
      stateAfterFire = await upsertState({
        sessionId: session.id,
        suspectId: suspect.id,
        conditionId: condition.conditionId,
        attemptsDelta: 0,
        pressureDelta: 0,
        newMaxAdjacency: verdict.confidence,
        lastReason: verdict.reason,
        metVia: "adjudicator",
      });
      fired = true;
    }

    const fallbackThreshold = condition.unlockBehavior.hostFallbackAfterTurns;
    const hostFallbackPrompted =
      !fired &&
      fallbackThreshold !== undefined &&
      stateAfterFire.attempts > fallbackThreshold &&
      stateAfterFire.max_adjacency < HOST_FALLBACK_ADJACENCY_THRESHOLD;

    outcomes.push({
      conditionId: condition.conditionId,
      subject: condition.subject,
      state: stateAfterFire,
      verdict,
      fired,
      hostFallbackPrompted,
      revealedText: fired ? condition.revealedText : undefined,
      label: condition.label,
    });
  }

  return {
    outcomes,
    systemMessagesInserted,
    updatedSession: workingSession,
  };
}
