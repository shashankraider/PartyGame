import { INVESTIGATION_EVENT_TYPES, investigationProgress, planRecallDelivery, type InvestigationEvent } from './investigation-requests';
import { firstRoundRecallBlock, initialAccountProgress } from './interview-rounds';
import { randomUUID } from "node:crypto";
import { toPublicCase, type PublicCase } from "./public-case";
import { loadCase } from "@/engine/case-loader";
import type { Case, Chapter, Suspect } from "@/engine/types";
import {
  MAX_SESSION_EVENTS,
  type SessionEventRow,
} from "@/lib/session-events";
import { createJoinCode, normalizeJoinCode } from "@/lib/session-codes";
import {
  createSupabaseServerClient,
  getMissingSupabaseServerEnv,
  hasSupabaseServerEnv,
  type AccusationVoteRow,
  type MessageRow,
  type PlayerRow,
  type SessionPhase,
  type SessionScene,
  type SessionRow,
} from "@/lib/supabase";

export type LobbyState = {
  session: SessionRow;
  players: PlayerRow[];
  accusationVotes: AccusationVoteRow[];
  caseData?: PublicCase;
  turnPending?: boolean;
};

export type SessionStoreErrorCode =
  | "supabase_not_configured"
  | "case_not_found"
  | "session_not_found"
  | "join_code_not_found"
  | "invalid_request"
  | "database_error";

export class SessionStoreError extends Error {
  constructor(
    public code: SessionStoreErrorCode,
    message: string,
    public status = 500,
    public details?: unknown,
  ) {
    super(message);
  }
}

function assertSupabaseConfigured() {
  if (!hasSupabaseServerEnv()) {
    throw new SessionStoreError(
      "supabase_not_configured",
      `Supabase server environment is missing: ${getMissingSupabaseServerEnv().join(", ")}`,
      503,
    );
  }
}

function toPublicJoinCode(joinCode: string) {
  return normalizeJoinCode(joinCode).slice(0, 8);
}

function getChapterScene(chapter: Chapter): SessionScene {
  switch (chapter.type) {
    case "interview":
      return "interview";
    case "phone-hack":
      return "phone_hack";
    case "accusation":
      return "accusation";
    case "reveal":
      return "reveal";
    case "narrative":
    case "evidence-reveal":
      return "case_board";
  }
}

const SESSION_PHASES: SessionPhase[] = ["briefing", "interrogation", "accusation", "reveal"];

export function isValidSessionPhaseTransition(from: SessionPhase, to: SessionPhase) {
  return SESSION_PHASES.indexOf(to) === SESSION_PHASES.indexOf(from) + 1;
}

export function assertValidSessionPhaseTransition(from: SessionPhase, to: SessionPhase) {
  if (!isValidSessionPhaseTransition(from, to)) {
    throw new SessionStoreError(
      "invalid_request",
      `Invalid phase transition: ${from} -> ${to}`,
      400,
    );
  }
}

export function getChapterPhase(chapter: Chapter): SessionPhase {
  if (chapter.type === "accusation") return "accusation";
  if (chapter.type === "reveal") return "reveal";
  if (chapter.roundNumber >= 2) return "interrogation";
  return "briefing";
}

export function isInterrogationChapter(chapter: Chapter) {
  return getChapterPhase(chapter) === "interrogation";
}

function getChapterIndex(caseData: Case, chapterId: string | null) {
  if (!chapterId) {
    return -1;
  }

  return caseData.chapters.findIndex((chapter) => chapter.id === chapterId);
}

export function getSessionPhase(session: Pick<SessionRow, "phase">): SessionPhase {
  return session.phase ?? "briefing";
}

export function shouldNoopChapterAdvance(session: Pick<SessionRow, "phase">) {
  return getSessionPhase(session) === "interrogation";
}

export function getInterrogationEntryChapter(caseData: Case) {
  return (
    caseData.chapters.find(
      (chapter) => chapter.type === "evidence-reveal" && isInterrogationChapter(chapter),
    ) ??
    caseData.chapters.find(
      (chapter) => chapter.type === "interview" && isInterrogationChapter(chapter),
    ) ??
    caseData.chapters.find(isInterrogationChapter) ??
    null
  );
}

export function isChapterUnlocked(caseData: Case, chapter: Chapter, currentChapterId: string | null) {
  const prerequisites = chapter.prerequisites ?? [];

  if (prerequisites.length === 0) {
    return true;
  }

  const visitedIndex = getChapterIndex(caseData, currentChapterId);
  const visitedIds = new Set(
    caseData.chapters.slice(0, Math.max(visitedIndex, 0) + 1).map((item) => item.id),
  );

  return prerequisites.every((prerequisiteId) => visitedIds.has(prerequisiteId));
}

export function getChapterNavigability(caseData: Case, currentChapterId: string | null) {
  const index = getChapterIndex(caseData, currentChapterId);

  if (index === -1) {
    return { hasPrevious: false, hasNext: caseData.chapters.length > 0 };
  }

  return {
    hasPrevious: index > 0,
    hasNext: index < caseData.chapters.length - 1,
  };
}

export function getUnlockedEvidenceForChapter(caseData: Case, chapter: Chapter, currentUnlocked: string[]) {
  const unlocked = new Set(currentUnlocked);

  // An evidence row with unlockBehavior is governed by the Phase 2g adjudicator
  // (cooperation/evidence/pressure/compound). The legacy chapter-based eager
  // unlock would race with the dynamic unlock, so we skip it for those rows.
  // The chapter mechanism remains the unlock path for static evidence (the
  // overwhelming majority) and the dynamic mechanism handles its own cases.
  const evidenceById = new Map(caseData.evidence.map((e) => [e.id, e]));

  if (chapter.type === "evidence-reveal") {
    chapter.evidenceIds.forEach((evidenceId) => {
      const evidence = evidenceById.get(evidenceId);
      if (evidence?.unlockBehavior || evidence?.investigationRequest || evidence?.requiresUnlockedEvidenceIds?.some(id => !currentUnlocked.includes(id))) return;
      unlocked.add(evidenceId);
    });
  }

  caseData.evidence.forEach((evidence) => {
    if (evidence.unlockBehavior || evidence.investigationRequest || evidence.requiresUnlockedEvidenceIds?.some(id => !currentUnlocked.includes(id))) return;
    if (evidence.unlockedAtChapter === chapter.id) {
      unlocked.add(evidence.id);
    }
  });

  return Array.from(unlocked);
}

export function assertSessionActive(session: SessionRow, statuses: SessionRow['status'][] = ['in_progress']) {
  if (Date.parse(session.expires_at) <= Date.now()) throw new SessionStoreError('invalid_request', 'This game has expired', 410);
  if (!statuses.includes(session.status)) throw new SessionStoreError('invalid_request', `Game is ${session.status.replace('_', ' ')}`, 409);
}

function databaseError(error: { code?: string; message?: string } | null): never {
  const status = error?.code === 'P0002' ? 404 : error?.code === 'P0003' ? 410 : ['P0001', 'PT409', '23505'].includes(error?.code ?? '') ? 409 : 500;
  throw new SessionStoreError(status === 404 ? 'session_not_found' : 'database_error', status < 500 ? error?.message ?? 'Game changed. Please try again.' : 'Could not save game', status, error);
}

export type GameMessage = Pick<MessageRow, 'suspect_id' | 'role' | 'content'> & Partial<Pick<MessageRow, 'asked_by_player_id' | 'presented_evidence_id'>>;
export async function commitGameUpdate(session: SessionRow, options: {
  patch?: Partial<SessionRow>;
  messages?: GameMessage[];
  states?: import('./supabase').InterviewUnlockStateRow[];
  events?: { type: string; payload?: Record<string, unknown> }[];
  vote?: { player_id: string; suspect_id: string | null };
  turnId?: string;
  attemptId?: string;
  cancelTurn?: boolean;
}): Promise<{ session: SessionRow; messages: MessageRow[] }> {
  const { data, error } = await createSupabaseServerClient().rpc('commit_game_update', {
    p_session: session.id, p_revision: session.revision ?? 0,
    p_patch: options.patch ?? {}, p_messages: options.messages ?? [], p_states: options.states ?? [],
    p_events: options.events ?? [{ type: 'session.changed', payload: {} }],
    p_attempt: options.attemptId ?? null, p_vote: options.vote ?? null, p_turn: options.turnId ?? null, p_cancel_turn: options.cancelTurn ?? false,
  });
  if (error || !data) databaseError(error);
  return data;
}

export async function createSession(caseId: string, mode: 'solo' | 'multiplayer' = 'multiplayer', deviceId?: string) {
  assertSupabaseConfigured();
  if (!deviceId) throw new SessionStoreError('invalid_request', 'Host identity is required', 401);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(caseId)) throw new SessionStoreError('case_not_found', 'Unknown case', 404);
  const caseData = await loadCase(caseId).catch(() => null);
  if (!caseData) throw new SessionStoreError('case_not_found', 'Unknown case', 404);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await createSupabaseServerClient().rpc('create_game_session', {
      p_case_id: caseData.id, p_case_version: caseData.version, p_join_code: createJoinCode(8),
      p_mode: mode === 'solo' ? 'solo' : 'multi', p_device: deviceId,
    });
    if (!error && data) return data as SessionRow;
    if (error?.code !== '23505') databaseError(error);
  }
  throw new SessionStoreError('database_error', 'Could not create a unique game code', 503);
}

export async function getLobbyState(sessionId: string): Promise<LobbyState> {
  assertSupabaseConfigured();
  const db = createSupabaseServerClient();
  const { data: storedSession, error } = await db.rpc('tick_interview_clock', { p_session: sessionId });
  const session = storedSession ? { ...storedSession, clock_observed_at: new Date().toISOString() } as SessionRow : null;
  if (error || !session) throw new SessionStoreError('session_not_found', 'Session not found', 404);
  assertSessionActive(session, ['lobby', 'in_progress', 'paused', 'finished']);
  const [players, votes, turns] = await Promise.all([
    db.from('players').select('id,session_id,name,seat_number,is_host,is_observer,joined_at,last_seen_at').eq('session_id', sessionId).order('seat_number'),
    db.from('accusation_votes').select('*').eq('session_id', sessionId),
    db.from('interview_turns').select('id').eq('session_id', sessionId).eq('status', 'pending').gt('lease_until', new Date().toISOString()),
  ]);
  if (players.error || votes.error || turns.error) databaseError(players.error ?? votes.error ?? turns.error);
  return { session, players: players.data ?? [], accusationVotes: votes.data ?? [], turnPending: Boolean(turns.data?.length) };
}

export async function getPublicLobbyState(sessionId: string): Promise<LobbyState & { caseData: PublicCase }> {
  const lobby = await getLobbyState(sessionId);
  const caseData = await loadCase(lobby.session.case_id);
  return { ...lobby, caseData: toPublicCase(caseData, lobby.session) };
}

export async function getSessionEvents(sessionId: string, options: { type?: string; limit?: number } = {}): Promise<SessionEventRow[]> {
  await getLobbyState(sessionId);
  let query = createSupabaseServerClient().from('events').select('*').eq('session_id', sessionId)
    .order('created_at', { ascending: false }).limit(Math.min(options.limit ?? MAX_SESSION_EVENTS, MAX_SESSION_EVENTS));
  if (options.type) query = query.eq('type', options.type);
  const { data, error } = await query;
  if (error) databaseError(error);
  // AI explanations and internal error details can name undiscovered evidence.
  return (data ?? []).map(row => ({ ...row, payload: { reason: row.type === 'interview.host_judgment_failed' ? 'The host can help if your investigation gets stuck.' : 'Keep comparing evidence and asking questions.' } }));
}

export async function joinSessionByCode(input: { joinCode: string; name: string; deviceId: string }) {
  assertSupabaseConfigured();
  if (typeof input.joinCode !== 'string' || typeof input.name !== 'string' || typeof input.deviceId !== 'string') throw new SessionStoreError('invalid_request', 'Code and name are required', 400);
  const code = toPublicJoinCode(input.joinCode);
  const name = input.name.trim().slice(0, 40);
  if (!name || !code || !input.deviceId) throw new SessionStoreError('invalid_request', 'Code and name are required', 400);
  const db = createSupabaseServerClient();
  const { data: session } = await db.from('sessions').select('case_id').eq('join_code', code).maybeSingle();
  if (!session) throw new SessionStoreError('join_code_not_found', 'Join code not found', 404);
  const caseData = await loadCase(session.case_id);
  const { data, error } = await db.rpc('join_game_session', { p_join_code: code, p_name: name, p_device: input.deviceId, p_max_players: caseData.meta.recommendedPlayers.max });
  if (error || !data) databaseError(error);
  return data as { session: SessionRow; player: PlayerRow; existing: boolean };
}

export async function startSession(sessionId: string) {
  const { session, players } = await getLobbyState(sessionId);
  assertSessionActive(session, ['lobby']);
  if (!players.some(p => !p.is_observer)) throw new SessionStoreError('invalid_request', 'At least one detective must join first', 409);
  const caseData = await loadCase(session.case_id);
  const chapter = caseData.chapters[0];
  return (await commitGameUpdate(session, { patch: {
    status: 'in_progress', phase: 'briefing', current_scene: 'brief', current_chapter_id: chapter.id,
    unlocked_evidence: getUnlockedEvidenceForChapter(caseData, chapter, session.unlocked_evidence),
  }, events: [{ type: 'session.started' }] })).session;
}

export async function pauseSession(sessionId: string) {
  const { session } = await getLobbyState(sessionId);
  assertSessionActive(session, ['in_progress', 'paused']);
  if (session.status === 'paused') return session;
  return (await commitGameUpdate(session, { patch: { status: 'paused' }, cancelTurn: true, events: [{ type: 'session.paused' }] })).session;
}
export async function resumeSession(sessionId: string) {
  const { session } = await getLobbyState(sessionId);
  assertSessionActive(session, ['paused']);
  return (await commitGameUpdate(session, { patch: { status: 'in_progress' }, events: [{ type: 'session.resumed' }] })).session;
}
export async function endSession(sessionId: string) {
  const { session } = await getLobbyState(sessionId);
  assertSessionActive(session, ['in_progress', 'paused']);
  return (await commitGameUpdate(session, { patch: { status: 'finished' }, cancelTurn: true, events: [{ type: 'session.ended' }] })).session;
}

export async function transitionSessionPhase(input: { sessionId: string; targetPhase: SessionPhase; chapterId?: string | null }) {
  const { session } = await getLobbyState(input.sessionId);
  assertSessionActive(session);
  assertValidSessionPhaseTransition(getSessionPhase(session), input.targetPhase);
  // Reveal must use the vote-completion path, never a free-form phase setter.
  if (input.targetPhase === 'reveal') return revealSession(input.sessionId);
  const caseData = await loadCase(session.case_id);
  const chapter = input.chapterId ? caseData.chapters.find(c => c.id === input.chapterId)
    : input.targetPhase === 'interrogation' ? getInterrogationEntryChapter(caseData)
      : caseData.chapters.find(c => getChapterPhase(c) === input.targetPhase);
  if (!chapter || getChapterPhase(chapter) !== input.targetPhase) throw new SessionStoreError('invalid_request', 'Invalid phase chapter', 400);
  return (await commitGameUpdate(session, { patch: { phase: input.targetPhase, current_scene: getChapterScene(chapter), current_chapter_id: chapter.id,
    current_interview_suspect_id: chapter.type === 'interview' ? chapter.suspectId : null,
    unlocked_evidence: getUnlockedEvidenceForChapter(caseData, chapter, session.unlocked_evidence),
  } })).session;
}

export async function loadInvestigationEvents(sessionId: string): Promise<InvestigationEvent[]> {
  const events: InvestigationEvent[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await createSupabaseServerClient().from('events').select('type,payload').eq('session_id', sessionId).in('type', [...INVESTIGATION_EVENT_TYPES]).order('created_at').range(offset, offset + 999);
    if (error) databaseError(error);
    events.push(...(data ?? []));
    if (!data || data.length < 1000) return events;
  }
}

export async function setSessionScene(input: { sessionId: string; scene: SessionScene; chapterId?: string | null; actorPlayerId?: string }) {
  const { session } = await getLobbyState(input.sessionId);
  assertSessionActive(session);
  if (input.actorPlayerId && session.current_interviewer_player_id !== input.actorPlayerId) throw new SessionStoreError('invalid_request', 'The microphone has moved', 403);
  const caseData = await loadCase(session.case_id);
  const chapter = caseData.chapters.find(c => c.id === (input.chapterId ?? session.current_chapter_id));
  if (!chapter || getChapterPhase(chapter) !== session.phase || getChapterScene(chapter) !== input.scene) throw new SessionStoreError('invalid_request', 'Scene does not belong to the active phase', 409);
  if (session.phase === 'reveal' || session.phase === 'accusation') throw new SessionStoreError('invalid_request', 'Use the ending controls', 409);
  if (session.phase === 'briefing' && !isChapterUnlocked(caseData, chapter, session.current_chapter_id)) throw new SessionStoreError('invalid_request', 'Finish the preceding chapter first', 409);
  if (session.phase === 'interrogation' && chapter.type !== 'interview' && chapter.id !== getInterrogationEntryChapter(caseData)?.id) throw new SessionStoreError('invalid_request', 'Choose an available interview', 409);
  let recall: ReturnType<typeof planRecallDelivery> = null;
  if (chapter.type === 'interview') {
    const events = await loadInvestigationEvents(session.id);
    const answered = initialAccountProgress(events).completed;
    const blocked = firstRoundRecallBlock(caseData, session, chapter.suspectId, answered);
    if (blocked) throw new SessionStoreError('invalid_request', blocked, 409);
    // Returning to an incomplete first interview resumes it; it cannot advance
    // the visit counter or deliver a report ordered in another interview.
    const unfinishedVisit = !answered.has(chapter.suspectId) && (investigationProgress(events).visits.get(chapter.suspectId) ?? 0) > 0;
    if (!unfinishedVisit) recall = planRecallDelivery(caseData, session, chapter.suspectId, events);
  }
  return (await commitGameUpdate(session, { patch: { current_scene: input.scene, current_chapter_id: chapter.id,
    current_interview_suspect_id: chapter.type === 'interview' ? chapter.suspectId : null,
    unlocked_evidence: [...new Set([...getUnlockedEvidenceForChapter(caseData, chapter, session.unlocked_evidence), ...(recall?.evidence.map(e => e.id) ?? [])])],
  }, ...(recall ? {
    events: [recall.event],
    messages: recall.evidence.map(e => ({ suspect_id: chapter.type === 'interview' ? chapter.suspectId : '', role: 'system' as const, content: `Requested report received: ${e.title}. It is now available in the case file for this interview.` })),
  } : {}) })).session;
}

/** Host-directed research sequence, independent of free-choice suspect interviews. */
export async function advanceInvestigationFile(sessionId: string) {
  const { session } = await getLobbyState(sessionId);
  assertSessionActive(session);
  if (session.phase !== 'interrogation') throw new SessionStoreError('invalid_request', 'Research is available during investigation', 409);
  const source = await loadCase(session.case_id);
  const current = getChapterIndex(source, session.current_chapter_id);
  const chapter = source.chapters.find((item, index) => index > current && item.roundNumber >= 3 && getChapterPhase(item) === 'interrogation' && item.type !== 'interview');
  if (!chapter) throw new SessionStoreError('invalid_request', 'All investigation files have been opened', 409);
  return (await commitGameUpdate(session, { patch: { current_scene: getChapterScene(chapter), current_chapter_id: chapter.id, current_interview_suspect_id: null,
    unlocked_evidence: getUnlockedEvidenceForChapter(source, chapter, session.unlocked_evidence) } })).session;
}

export async function advanceSessionChapter(sessionId: string, direction: 'next' | 'previous') {
  const { session } = await getLobbyState(sessionId);
  assertSessionActive(session);
  if (shouldNoopChapterAdvance(session)) return session;
  if (session.phase === 'reveal') {
    if (direction !== 'next') throw new SessionStoreError('invalid_request', 'The ending only moves forward', 409);
    const step = session.reveal_step ?? 0;
    return (await commitGameUpdate(session, { patch: step < 2 ? { reveal_step: step + 1 } : { status: 'finished' } })).session;
  }
  if (session.phase === 'accusation') return revealSession(sessionId);
  const caseData = await loadCase(session.case_id);
  const index = getChapterIndex(caseData, session.current_chapter_id);
  const chapter = caseData.chapters[Math.max(0, Math.min(caseData.chapters.length - 1, index + (direction === 'next' ? 1 : -1)))];
  if (getChapterPhase(chapter) !== session.phase) return transitionSessionPhase({ sessionId, targetPhase: getChapterPhase(chapter) });
  return setSessionScene({ sessionId, scene: getChapterScene(chapter), chapterId: chapter.id });
}

export async function setSessionInterviewer(input: { sessionId: string; playerId: string | null; actorPlayerId?: string }) {
  const { session, players } = await getLobbyState(input.sessionId);
  assertSessionActive(session);
  if (session.phase !== 'interrogation') throw new SessionStoreError('invalid_request', 'Interviews have not opened', 409);
  if (input.actorPlayerId && !(session.current_interviewer_player_id === input.actorPlayerId || (!session.current_interviewer_player_id && input.playerId === input.actorPlayerId))) throw new SessionStoreError('invalid_request', 'The microphone has moved', 403);
  if (input.playerId && !players.some(p => p.id === input.playerId && !p.is_observer)) throw new SessionStoreError('invalid_request', 'Choose a detective in this game', 400);
  return (await commitGameUpdate(session, { patch: { current_interviewer_player_id: input.playerId } })).session;
}

export function tallyAccusations(votes: AccusationVoteRow[]) {
  const tally = new Map<string, number>();
  for (const vote of votes) tally.set(vote.suspect_id, (tally.get(vote.suspect_id) ?? 0) + 1);
  return tally;
}
export async function setAccusationVote(input: { sessionId: string; playerId: string; suspectId: string | null }) {
  // Each vote reads the current revision. A concurrent vote can safely retry its upsert.
  for (let attempt = 0; attempt < 10; attempt++) {
    const { session, players } = await getLobbyState(input.sessionId);
    assertSessionActive(session);
    if (session.phase !== 'accusation') throw new SessionStoreError('invalid_request', 'Voting is closed', 409);
    if (!players.some(p => p.id === input.playerId && !p.is_observer)) throw new SessionStoreError('invalid_request', 'Only detectives can vote', 403);
    const caseData = await loadCase(session.case_id);
    if (input.suspectId !== null && !caseData.suspects.some(s => s.id === input.suspectId)) throw new SessionStoreError('invalid_request', 'Unknown suspect', 400);
    try {
      await commitGameUpdate(session, { vote: { player_id: input.playerId, suspect_id: input.suspectId }, events: [{ type: 'session.accusation_set' }] });
      return getPublicLobbyState(input.sessionId);
    } catch (error) {
      if (!(error instanceof SessionStoreError) || (error.details as { code?: string })?.code !== 'PT409' || attempt === 9) throw error;
    }
  }
  throw new SessionStoreError('database_error', 'Please retry your vote', 409);
}

export async function revealSession(sessionId: string) {
  const { session, players, accusationVotes } = await getLobbyState(sessionId);
  assertSessionActive(session);
  if (session.phase !== 'accusation') throw new SessionStoreError('invalid_request', 'Finish voting before the reveal', 409);
  const detectives = players.filter(p => !p.is_observer);
  if (!detectives.length || !detectives.every(p => accusationVotes.some(v => v.player_id === p.id))) throw new SessionStoreError('invalid_request', 'Every detective must vote before the reveal', 409);
  const caseData = await loadCase(session.case_id);
  const tally = tallyAccusations(accusationVotes);
  const path = [...caseData.endgame.paths].sort((a,b) => (tally.get(b.triggerSuspectId) ?? 0) - (tally.get(a.triggerSuspectId) ?? 0))[0];
  const chapter = caseData.chapters.find(c => c.type === 'reveal');
  if (!chapter || !path) throw new SessionStoreError('invalid_request', 'This case has no ending', 409);
  return (await commitGameUpdate(session, { patch: { phase: 'reveal', current_scene: 'reveal', current_chapter_id: chapter.id, current_interview_suspect_id: null, endgame_path_id: path.id, reveal_step: 0 } })).session;
}

export type InterviewContext = { session: SessionRow; caseData: Case; chapter: Chapter & { type: 'interview' }; suspect: Suspect; messages: MessageRow[] };
export async function getInterviewMessages(input: { sessionId: string; suspectId: string }): Promise<MessageRow[]> {
  await getLobbyState(input.sessionId);
  const { data, error } = await createSupabaseServerClient().from('messages').select('*').eq('session_id', input.sessionId).eq('suspect_id', input.suspectId).order('sequence');
  if (error) databaseError(error);
  return data ?? [];
}
export async function getInterviewContext(sessionId: string): Promise<InterviewContext> {
  const { session } = await getLobbyState(sessionId);
  const caseData = await loadCase(session.case_id);
  const chapter = caseData.chapters.find(c => c.id === session.current_chapter_id);
  if (!chapter || chapter.type !== 'interview' || session.current_scene !== 'interview') throw new SessionStoreError('invalid_request', 'Choose a suspect to interview', 409);
  const suspect = caseData.suspects.find(s => s.id === chapter.suspectId)!;
  return { session, caseData, chapter, suspect, messages: await getInterviewMessages({ sessionId, suspectId: suspect.id }) };
}

export type AskSuspectInput = { sessionId: string; playerId: string; question: string; presentedEvidenceId?: string | null; requestId?: string };
export type AskSuspectResult = { userMessage: MessageRow; assistantMessage: MessageRow; systemMessages: MessageRow[]; session: SessionRow; unlockOutcomes: import('./interview-unlocks').UnlockOutcome[]; hostJudgment: import('./host-judgment').HostJudgmentVerdict | null };
export async function askSuspect(input: AskSuspectInput): Promise<AskSuspectResult> {
  const { executeInterview } = await import('./interview-turn');
  return executeInterview({ ...input, requestId: input.requestId ?? randomUUID() });
}
export async function getActiveHostFallbacksForSession(input: { sessionId: string }) {
  const { listHostHelp } = await import('./interview-turn');
  return listHostHelp(input.sessionId);
}
export async function triggerHostUnlock(input: { sessionId: string; conditionId: string }) {
  const { applyHostHelp } = await import('./interview-turn');
  return applyHostHelp(input.sessionId, input.conditionId);
}

export async function extendInterview(sessionId: string) {
  const { session } = await getLobbyState(sessionId);
  const { error } = await createSupabaseServerClient().rpc('extend_interview_clock', { p_session: sessionId, p_revision: session.revision });
  if (error) databaseError(error);
}
