import { createHash } from 'node:crypto';
import type { Case, Suspect } from '@/engine/types';
import { createSupabaseServerClient, type InterviewUnlockStateRow, type MessageRow, type SessionRow } from './supabase';
import { listPendingConditions, type PendingCondition, type UnlockOutcome, type ActiveHostFallback } from './interview-unlocks';
import { judgeUnlock } from './adjudicator';
import { judgeHostAction, type HostJudgmentVerdict } from './host-judgment';
import { assertSessionActive, commitGameUpdate, getInterviewContext, getLobbyState, SessionStoreError, type AskSuspectInput, type AskSuspectResult, type GameMessage, type InterviewContext } from './session-store';
import { countQuestionsInCurrentStretch, getQuestionsPerDetective, listRotatingDetectives, pickNextInterviewer, shouldRotateAfterQuestion } from './round-robin';
import { buildRoleplayPrompt, modelCompletion, SAFE_DEFLECTION, validateRoleplayReply } from './interview-safety';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function loadStates(sessionId: string): Promise<InterviewUnlockStateRow[]> {
  const { data, error } = await createSupabaseServerClient().from('interview_unlock_state').select('*').eq('session_id', sessionId);
  if (error) throw new SessionStoreError('database_error', 'Could not load interview progress', 503);
  return data ?? [];
}

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

function evidenceGate(condition: PendingCondition, presented: Set<string>) {
  return (condition.unlockBehavior.evidenceIds ?? []).every(id => presented.has(id));
}
function knownRevelations(caseData: Case, suspect: Suspect, session: SessionRow, states: InterviewUnlockStateRow[]) {
  const all = listPendingConditions({ caseData, suspect, session, existingStates: [] });
  const met = new Set(states.filter(s => s.suspect_id === suspect.id && s.met_at).map(s => s.condition_id));
  return all.filter(c => c.subject !== 'evidence' && met.has(c.conditionId)).map(c => c.revealedText);
}

async function planUnlocks(context: InterviewContext, question: string, presentedEvidenceId: string | null, states: InterviewUnlockStateRow[]) {
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

function resultFromCommit(saved: { session: SessionRow; messages: MessageRow[] }): AskSuspectResult {
  return { session: saved.session, userMessage: saved.messages.find(m => m.role === 'user')!, assistantMessage: saved.messages.find(m => m.role === 'assistant')!,
    systemMessages: saved.messages.filter(m => m.role === 'system'), unlockOutcomes: [], hostJudgment: null };
}

export async function executeInterview(input: AskSuspectInput & { requestId: string }): Promise<AskSuspectResult> {
  const question = input.question.trim();
  if (!question || question.length > 600 || !uuid.test(input.requestId)) throw new SessionStoreError('invalid_request', 'Use a question of 1–600 characters and a valid request ID', 400);
  const evidenceId = input.presentedEvidenceId ?? null;
  const hash = createHash('sha256').update(JSON.stringify([question, evidenceId])).digest('hex');
  const db = createSupabaseServerClient();
  const { data: lease, error } = await db.rpc('begin_interview_turn', { p_session: input.sessionId, p_player: input.playerId, p_id: input.requestId, p_hash: hash });
  if (error || !lease) throw new SessionStoreError('invalid_request', error?.message ?? 'Could not begin turn', error?.code === 'P0003' ? 410 : 409);
  if (lease.completed) return resultFromCommit(lease.result);
  try {
    const context = await getInterviewContext(input.sessionId);
    const { session, caseData, chapter, suspect, messages } = context;
    assertSessionActive(session);
    if (session.phase !== 'interrogation') throw new SessionStoreError('invalid_request', 'Interviews are closed', 409);
    if (evidenceId && (!session.unlocked_evidence.includes(evidenceId) || !caseData.evidence.some(e => e.id === evidenceId) || (chapter.presentableEvidence?.length && !chapter.presentableEvidence.includes(evidenceId)))) throw new SessionStoreError('invalid_request', 'That evidence is not available in this interview', 400);
    const states = await loadStates(session.id);
    const { updates, presented } = await planUnlocks(context, question, evidenceId, states);
    const updatedStates = states.filter(s => !updates.some(u => u.state.suspect_id === s.suspect_id && u.state.condition_id === s.condition_id)).concat(updates.map(u => u.state));
    const unlocked = new Set(session.unlocked_evidence);
    const newMessages: GameMessage[] = [];
    for (const { condition, outcome } of updates) if (outcome.fired && condition.evidenceId) {
      unlocked.add(condition.evidenceId);
      newMessages.push({ suspect_id: suspect.id, role: 'system', content: `Evidence added: ${condition.label}.` });
    }
    const safetyContext = { caseData, suspect, revelations: knownRevelations(caseData, suspect, session, updatedStates), evidence: caseData.evidence.filter(e => presented.has(e.id)).map(e => `${e.title}: ${e.loreText}`) };
    const model = caseData.llm?.modelOverride ?? process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini';
    const draft = await modelCompletion({ model, system: buildRoleplayPrompt(safetyContext),
      user: JSON.stringify({ recentConversation: messages.filter(m => m.role !== 'system').slice(-12).map(m => ({ role: m.role, content: m.content })), question }), temperature: caseData.llm?.temperature ?? 0.7 });
    const valid = await validateRoleplayReply(safetyContext, draft, caseData.llm?.validatorModelOverride ?? model);
    // Fail closed. Authored revelations are safe and must remain visible even if a
    // generated paraphrase fails validation or the validation provider is offline.
    const newlyRevealed = updates.filter(u => u.outcome.fired && u.condition.subject !== 'evidence').map(u => u.condition.revealedText);
    const reply = valid ? draft : newlyRevealed.join('\n\n') || SAFE_DEFLECTION;
    let hostJudgment: HostJudgmentVerdict | null = null;
    const { data: allMessages, error: transcriptError } = await db.from('messages').select('suspect_id,role,content').eq('session_id', session.id).order('created_at');
    if (transcriptError) throw new SessionStoreError('database_error', 'Could not read the investigation', 503);
    try {
      hostJudgment = await judgeHostAction({ caseData, session, unlockedEvidence: [...unlocked], allTranscripts: caseData.suspects.map(s => ({
        suspectId: s.id, suspectName: s.name,
        hasOpenedUp: updatedStates.some(state => state.suspect_id === s.id && state.condition_id.startsWith('secret:') && state.met_at),
        messages: (allMessages ?? []).filter(m => m.suspect_id === s.id).map(m => ({ role: m.role, content: m.content })).concat(s.id === suspect.id ? [{ role: 'user', content: question }, { role: 'assistant', content: reply }] : []),
      })) });
      if (hostJudgment.action === 'drop-evidence' && !unlocked.has(hostJudgment.evidenceId)) {
        const evidence = caseData.evidence.find(e => e.id === hostJudgment!.evidenceId)!;
        unlocked.add(evidence.id);
        newMessages.push({ suspect_id: suspect.id, role: 'system', content: `Forensic update: ${evidence.title} arrived in the case file.` });
      }
      // Phase changes are deliberate host actions, never decisions taken in an
      // in-flight answer. In particular an AI call cannot resume a paused game.
    } catch { hostJudgment = null; }
    const { players } = await getLobbyState(session.id);
    const userMessage: GameMessage = { suspect_id: suspect.id, role: 'user', content: question, asked_by_player_id: input.playerId, presented_evidence_id: evidenceId };
    const stretch = countQuestionsInCurrentStretch([...messages, userMessage], suspect.id, input.playerId);
    const rotate = shouldRotateAfterQuestion(stretch, getQuestionsPerDetective(caseData), listRotatingDetectives(players).length);
    const saved = await commitGameUpdate(session, { turnId: input.requestId, attemptId: lease.attemptId,
      patch: { unlocked_evidence: [...unlocked], current_interviewer_player_id: rotate ? pickNextInterviewer(players, input.playerId) : session.current_interviewer_player_id },
      messages: [userMessage, { suspect_id: suspect.id, role: 'assistant', content: reply }, ...newMessages], states: updates.map(u => u.state),
      events: [{ type: 'interview.completed', payload: { validated: valid } }, { type: 'interview.host_judgment', payload: { reason: 'The investigation is progressing.' } }],
    });
    return { ...resultFromCommit(saved), unlockOutcomes: updates.map(u => u.outcome), hostJudgment };
  } catch (error) {
    await db.from('interview_turns').update({ status: 'failed' }).eq('id', input.requestId).eq('attempt_id', lease.attemptId).eq('status', 'pending');
    throw error;
  }
}

function helpId(sessionId: string, suspectId: string, conditionId: string) {
  return createHash('sha256').update(`${sessionId}:${suspectId}:${conditionId}`).digest('hex');
}
async function availableHelp(sessionId: string) {
  const context = await getInterviewContext(sessionId);
  assertSessionActive(context.session);
  if (context.session.phase !== 'interrogation') throw new SessionStoreError('invalid_request', 'Interviews are closed', 409);
  const states = await loadStates(sessionId);
  const pending = listPendingConditions({ ...context, existingStates: states.filter(s => s.suspect_id === context.suspect.id) });
  const presented = new Set(context.messages.map(m => m.presented_evidence_id).filter((id): id is string => Boolean(id)));
  // A manual host rescue is always available for the next eligible discovery.
  // It does not depend on an LLM's confidence or unavailable adjudicator calls.
  const conditions = pending.filter(c => evidenceGate(c, presented));
  const hostEvidence = context.caseData.evidence.filter(e => e.arrivesWhen && !context.session.unlocked_evidence.includes(e.id));
  return { context, states, conditions, hostEvidence };
}
export async function listHostHelp(sessionId: string): Promise<ActiveHostFallback[]> {
  const { context, states, conditions, hostEvidence } = await availableHelp(sessionId);
  const result: ActiveHostFallback[] = conditions.map((c, i) => ({ conditionId: helpId(sessionId, context.suspect.id, c.conditionId), subject: c.subject,
    label: c.subject === 'evidence' ? `Recover interview evidence ${i + 1}` : `Help ${context.suspect.name} explain more (${i + 1})`,
    attempts: states.find(s => s.suspect_id === context.suspect.id && s.condition_id === c.conditionId)?.attempts ?? 0, maxAdjacency: 0,
  }));
  if (hostEvidence[0]) result.push({ conditionId: helpId(sessionId, context.suspect.id, `forensic:${hostEvidence[0].id}`), subject: 'evidence', label: 'Request the next forensic update', attempts: 0, maxAdjacency: 0 });
  return result;
}
export async function applyHostHelp(sessionId: string, conditionId: string) {
  const { context, states, conditions, hostEvidence } = await availableHelp(sessionId);
  const { session, suspect } = context;
  const condition = conditions.find(c => helpId(sessionId, suspect.id, c.conditionId) === conditionId);
  const evidence = hostEvidence.find((e,i) => i === 0 && helpId(sessionId, suspect.id, `forensic:${e.id}`) === conditionId);
  if (!condition && !evidence) throw new SessionStoreError('invalid_request', 'That assistance is no longer available', 409);
  const unlocked = new Set(session.unlocked_evidence);
  const pendingStates: InterviewUnlockStateRow[] = [];
  let content: string;
  if (condition) {
    const prior = states.find(s => s.suspect_id === suspect.id && s.condition_id === condition.conditionId);
    const { state } = advanceUnlockState(condition, prior, { met: true, confidence: 1, reason: 'Host assistance' }, sessionId, suspect.id);
    state.met_at = new Date().toISOString(); state.met_via = 'host';
    pendingStates.push(state);
    if (condition.evidenceId) unlocked.add(condition.evidenceId);
    content = condition.subject === 'evidence' ? `Evidence added: ${condition.label}.` : `${suspect.name}: ${condition.revealedText}`;
  } else {
    unlocked.add(evidence!.id); content = `Forensic update: ${evidence!.title} arrived in the case file.`;
  }
  const saved = await commitGameUpdate(session, { patch: { unlocked_evidence: [...unlocked] }, states: pendingStates,
    messages: [{ suspect_id: suspect.id, role: 'system', content }], events: [{ type: 'interview.completed' }] });
  return { session: saved.session, systemMessage: saved.messages[0] };
}
