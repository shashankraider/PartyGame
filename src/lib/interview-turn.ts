import { classifyInvestigationRequests, investigationProgress, planInvestigationRequest, type InvestigationEvent } from './investigation-requests';
import { createHash } from 'node:crypto';
import { createSupabaseServerClient, type InterviewUnlockStateRow, type MessageRow, type SessionRow } from './supabase';
import { listPendingConditions, type ActiveHostFallback } from './interview-unlocks';
import { advanceUnlockState, evidenceGate } from './interview-planner';
export { advanceUnlockState, planUnlocks } from './interview-planner';
import { runInterviewGraph } from './interview-graph';
import { judgeHostAction, type HostJudgmentVerdict } from './host-judgment';
import { assertSessionActive, commitGameUpdate, getInterviewContext, getLobbyState, loadInvestigationEvents, SessionStoreError, type AskSuspectInput, type AskSuspectResult, type GameMessage } from './session-store';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function loadStates(sessionId: string): Promise<InterviewUnlockStateRow[]> {
  const { data, error } = await createSupabaseServerClient().from('interview_unlock_state').select('*').eq('session_id', sessionId);
  if (error) throw new SessionStoreError('database_error', 'Could not load interview progress', 503);
  return data ?? [];
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
    const { session, caseData, chapter, suspect } = context;
    assertSessionActive(session);
    if (session.phase !== 'interrogation') throw new SessionStoreError('invalid_request', 'Interviews are closed', 409);
    if (evidenceId && (!session.unlocked_evidence.includes(evidenceId) || !caseData.evidence.some(e => e.id === evidenceId) || (chapter.presentableEvidence?.length && !chapter.presentableEvidence.includes(evidenceId)))) throw new SessionStoreError('invalid_request', 'That evidence is not available in this interview', 400);
    const states = await loadStates(session.id);
    const { updates, updatedStates, answer, trace } = await runInterviewGraph({
      context, question, presentedEvidenceId: evidenceId, states,
    });
    const investigationEvents = await loadInvestigationEvents(session.id);
    const pendingEvidenceIds = [...investigationProgress(investigationEvents).requests.keys()];
    const requestEvents: InvestigationEvent[] = [];
    const unlocked = new Set(session.unlocked_evidence);
    const newMessages: GameMessage[] = [];
    for (const { condition, outcome } of updates) if (outcome.fired && condition.evidenceId) {
      unlocked.add(condition.evidenceId);
      newMessages.push({ suspect_id: suspect.id, role: 'system', content: `Evidence added: ${condition.label}.` });
    }
    const { valid, reply } = answer;
    let hostJudgment: HostJudgmentVerdict | null = null;
    const { data: allMessages, error: transcriptError } = await db.from('messages').select('suspect_id,role,content').eq('session_id', session.id).order('created_at');
    if (transcriptError) throw new SessionStoreError('database_error', 'Could not read the investigation', 503);
    try {
      const requestedReports = await classifyInvestigationRequests(caseData, question, investigationEvents, [...unlocked]);
      for (const evidence of requestedReports) {
        const request = planInvestigationRequest(evidence, investigationEvents, [...unlocked], suspect.id);
        if (request) {
          requestEvents.push(request.event);
          pendingEvidenceIds.push(evidence.id);
          newMessages.push({ suspect_id: suspect.id, role: 'system', content: request.message });
        }
      }
      hostJudgment = await judgeHostAction({ caseData, session, pendingEvidenceIds, unlockedEvidence: [...unlocked], allTranscripts: caseData.suspects.map(s => ({
        suspectId: s.id, suspectName: s.name,
        hasOpenedUp: updatedStates.some(state => state.suspect_id === s.id && state.condition_id.startsWith('secret:') && state.met_at),
        messages: (allMessages ?? []).filter(m => m.suspect_id === s.id).map(m => ({ role: m.role, content: m.content })).concat(s.id === suspect.id ? [{ role: 'user', content: question }, { role: 'assistant', content: reply }] : []),
      })) });
      if (hostJudgment.action === 'drop-evidence' && !unlocked.has(hostJudgment.evidenceId)) {
        const evidence = caseData.evidence.find(e => e.id === hostJudgment!.evidenceId)!;
        if (evidence.investigationRequest) {
          const request = planInvestigationRequest(evidence, investigationEvents, [...unlocked], suspect.id);
          if (request) {
            requestEvents.push(request.event);
            newMessages.push({ suspect_id: suspect.id, role: 'system', content: request.message });
          }
        } else {
          unlocked.add(evidence.id);
          newMessages.push({ suspect_id: suspect.id, role: 'system', content: `Forensic update: ${evidence.title} arrived in the case file.` });
        }
      }
      // Phase changes are deliberate host actions, never decisions taken in an
      // in-flight answer. In particular an AI call cannot resume a paused game.
    } catch { hostJudgment = null; }
    const userMessage: GameMessage = { suspect_id: suspect.id, role: 'user', content: question, asked_by_player_id: input.playerId, presented_evidence_id: evidenceId };
    const saved = await commitGameUpdate(session, { turnId: input.requestId, attemptId: lease.attemptId,
      patch: { unlocked_evidence: [...unlocked], current_interviewer_player_id: session.current_interviewer_player_id },
      messages: [userMessage, { suspect_id: suspect.id, role: 'assistant', content: reply }, ...newMessages], states: updates.map(u => u.state),
      events: [...requestEvents, { type: 'interview.completed', payload: { validated: valid, graphVersion: 'interview-v1', graphPath: trace, repairAttempted: answer.repairAttempted } }, { type: 'interview.host_judgment', payload: { reason: 'The investigation is progressing.' } }],
    });
    saved.session = (await getLobbyState(session.id)).session;
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
  const investigationEvents = await loadInvestigationEvents(sessionId);
  const requested = investigationProgress(investigationEvents).requests;
  const hostEvidence = context.caseData.evidence.filter(e => e.arrivesWhen && !context.session.unlocked_evidence.includes(e.id) && !requested.has(e.id));
  return { context, states, conditions, hostEvidence, investigationEvents };
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
  const { context, states, conditions, hostEvidence, investigationEvents } = await availableHelp(sessionId);
  const { session, suspect } = context;
  const condition = conditions.find(c => helpId(sessionId, suspect.id, c.conditionId) === conditionId);
  const evidence = hostEvidence.find((e,i) => i === 0 && helpId(sessionId, suspect.id, `forensic:${e.id}`) === conditionId);
  if (!condition && !evidence) throw new SessionStoreError('invalid_request', 'That assistance is no longer available', 409);
  const unlocked = new Set(session.unlocked_evidence);
  const pendingStates: InterviewUnlockStateRow[] = [];
  const requestEvents: InvestigationEvent[] = [];
  let content: string;
  if (condition) {
    const prior = states.find(s => s.suspect_id === suspect.id && s.condition_id === condition.conditionId);
    const { state } = advanceUnlockState(condition, prior, { met: true, confidence: 1, reason: 'Host assistance' }, sessionId, suspect.id);
    state.met_at = new Date().toISOString(); state.met_via = 'host';
    pendingStates.push(state);
    if (condition.evidenceId) unlocked.add(condition.evidenceId);
    content = condition.subject === 'evidence' ? `Evidence added: ${condition.label}.` : `${suspect.name}: ${condition.revealedText}`;
  } else {
    const request = planInvestigationRequest(evidence!, investigationEvents, [...unlocked], suspect.id);
    if (request) { requestEvents.push(request.event); content = request.message; }
    else { unlocked.add(evidence!.id); content = `Forensic update: ${evidence!.title} arrived in the case file.`; }
  }
  const saved = await commitGameUpdate(session, { patch: { unlocked_evidence: [...unlocked] }, states: pendingStates,
    messages: [{ suspect_id: suspect.id, role: 'system', content }], events: [...requestEvents, { type: 'interview.completed' }] });
  return { session: saved.session, systemMessage: saved.messages[0] };
}
