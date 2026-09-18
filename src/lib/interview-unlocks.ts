import type { Case, Suspect, UnlockBehavior } from "@/engine/types";
import type { AdjudicatorVerdict } from "./adjudicator";
import type { InterviewUnlockStateRow, SessionRow } from "./supabase";

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

export type ActiveHostFallback = {
  conditionId: string;
  subject: UnlockSubject;
  label: string;
  attempts: number;
  maxAdjacency: number;
  evidenceId?: string;
};

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
