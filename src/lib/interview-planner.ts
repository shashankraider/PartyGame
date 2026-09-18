import type { Case, Suspect } from '@/engine/types';
import type { InterviewUnlockStateRow, MessageRow, SessionRow } from './supabase';
import { listPendingConditions, type PendingCondition, type UnlockOutcome } from './interview-unlocks';
import { judgeUnlock } from './adjudicator';

export function advanceUnlockState(condition: PendingCondition, previous: InterviewUnlockStateRow | undefined, verdict: { met: boolean; confidence: number; proximity?: number; reason: string }, sessionId: string, suspectId: string) {
  const now = new Date().toISOString();
  const purePressure = condition.unlockBehavior.tier === 'pressure' && !condition.unlockBehavior.cooperationCue;
  const proximity = verdict.met ? 1 : Math.max(0, Math.min(1, verdict.proximity ?? 0));
  const pressure = (previous?.pressure_count ?? 0) + (purePressure || verdict.met || proximity >= 0.4 ? 1 : 0);
  const fired = (purePressure || verdict.met) && pressure >= (condition.unlockBehavior.pressureThreshold ?? 1);
  const state: InterviewUnlockStateRow = {
    session_id: sessionId, suspect_id: suspectId, condition_id: condition.conditionId,
    attempts: (previous?.attempts ?? 0) + 1, pressure_count: pressure,
    max_adjacency: Math.max(previous?.max_adjacency ?? 0, proximity),
    last_reason: verdict.reason, last_evaluated_at: now, met_at: fired ? now : null,
    met_via: fired ? 'adjudicator' : null, created_at: previous?.created_at ?? now, updated_at: now,
  };
  return { state, fired };
}

export function evidenceGate(condition: PendingCondition, presented: Set<string>) {
  return (condition.unlockBehavior.evidenceIds ?? []).every(id => presented.has(id));
}
export function knownRevelations(caseData: Case, suspect: Suspect, session: Pick<SessionRow, 'unlocked_evidence'>, states: InterviewUnlockStateRow[]) {
  const all = listPendingConditions({ caseData, suspect, session, existingStates: [] });
  const met = new Set(states.filter(s => s.suspect_id === suspect.id && s.met_at).map(s => s.condition_id));
  return all.filter(c => c.subject !== 'evidence' && met.has(c.conditionId)).map(c => c.revealedText);
}

export async function planUnlocks(context: {
  caseData: Case; suspect: Suspect;
  session: Pick<SessionRow, 'id' | 'unlocked_evidence'>;
  messages: Pick<MessageRow, 'presented_evidence_id'>[];
}, question: string, presentedEvidenceId: string | null, states: InterviewUnlockStateRow[]) {
  const { session, caseData, suspect, messages } = context;
  const pending = listPendingConditions({ caseData, session, suspect, existingStates: states.filter(s => s.suspect_id === suspect.id) });
  const presented = new Set(messages.map(m => m.presented_evidence_id).filter((id): id is string => Boolean(id)));
  if (presentedEvidenceId) presented.add(presentedEvidenceId);
  const results = await Promise.all(pending.map(async condition => {
    if (!evidenceGate(condition, presented)) return null;
    let verdict;
    try {
      verdict = condition.unlockBehavior.tier === 'pressure' && !condition.unlockBehavior.cooperationCue
        ? { met: true, confidence: 1, proximity: 1, reason: 'A pressure turn was completed.' }
        : await judgeUnlock({ caseData, suspect, conditionId: condition.conditionId,
          condition: { unlockBehavior: condition.unlockBehavior, presentedEvidenceIdsInThisConversation: [...presented] },
          // Current question earns pressure; earlier successful questions cannot be counted again.
          transcript: [{ role: 'user', content: question, presentedEvidenceId }],
        });
    } catch { verdict = { met: false, confidence: 0, proximity: 0, reason: 'Judge unavailable; host assistance remains available.' }; }
    const { state, fired } = advanceUnlockState(condition, states.find(s => s.suspect_id === suspect.id && s.condition_id === condition.conditionId), verdict, session.id, suspect.id);
    const outcome: UnlockOutcome = { conditionId: condition.conditionId, subject: condition.subject, state, verdict, fired,
      hostFallbackPrompted: !fired && state.attempts >= (condition.unlockBehavior.hostFallbackAfterTurns ?? 5),
      label: condition.label, ...(fired ? { revealedText: condition.revealedText } : {}),
    };
    return { condition, state, outcome };
  }));
  return { updates: results.filter(r => r !== null), presented };
}
