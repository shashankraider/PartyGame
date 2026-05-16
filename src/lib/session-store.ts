import { loadCase } from "@/engine/case-loader";
import type { Case, Chapter, Evidence, Suspect } from "@/engine/types";
import { createJoinCode, normalizeJoinCode } from "@/lib/session-codes";
import {
  createSupabaseServerClient,
  getMissingSupabaseServerEnv,
  hasSupabaseServerEnv,
  type AccusationVoteRow,
  type MessageRow,
  type PlayerRow,
  type SessionScene,
  type SessionRow,
} from "@/lib/supabase";

export type LobbyState = {
  session: SessionRow;
  players: PlayerRow[];
  accusationVotes: AccusationVoteRow[];
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

function getNextSeatNumber(players: PlayerRow[], maxDetectives: number, isObserver: boolean) {
  if (isObserver) {
    return Math.max(0, ...players.map((player) => player.seat_number)) + 1;
  }

  const occupiedDetectiveSeats = new Set(
    players.filter((player) => !player.is_observer).map((player) => player.seat_number),
  );

  for (let seat = 1; seat <= maxDetectives; seat += 1) {
    if (!occupiedDetectiveSeats.has(seat)) {
      return seat;
    }
  }

  return Math.max(maxDetectives, ...players.map((player) => player.seat_number)) + 1;
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

function getChapterIndex(caseData: Case, chapterId: string | null) {
  if (!chapterId) {
    return -1;
  }

  return caseData.chapters.findIndex((chapter) => chapter.id === chapterId);
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

function getUnlockedEvidenceForChapter(caseData: Case, chapter: Chapter, currentUnlocked: string[]) {
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
      if (evidence?.unlockBehavior) return;
      unlocked.add(evidenceId);
    });
  }

  caseData.evidence.forEach((evidence) => {
    if (evidence.unlockBehavior) return;
    if (evidence.unlockedAtChapter === chapter.id) {
      unlocked.add(evidence.id);
    }
  });

  return Array.from(unlocked);
}

export async function createSession(caseId: string, mode: "solo" | "multiplayer" = "multiplayer") {
  assertSupabaseConfigured();

  const caseData = await loadCase(caseId).catch(() => null);

  if (!caseData) {
    throw new SessionStoreError("case_not_found", `Unknown case id: ${caseId}`, 404);
  }

  const supabase = createSupabaseServerClient();
  const dbMode = mode === "solo" ? "solo" : "multi";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const joinCode = createJoinCode();
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        case_id: caseData.id,
        case_version: caseData.version,
        join_code: joinCode,
        mode: dbMode,
      })
      .select("*")
      .single();

    if (!error && data) {
      await supabase.from("events").insert({
        session_id: data.id,
        type: "session.created",
        payload: { caseId: caseData.id, mode: dbMode },
      });

      return data;
    }

    if (error?.code !== "23505") {
      throw new SessionStoreError("database_error", "Could not create session", 500, error);
    }
  }

  throw new SessionStoreError("database_error", "Could not create a unique join code", 500);
}

export async function getLobbyState(sessionId: string): Promise<LobbyState> {
  assertSupabaseConfigured();

  const supabase = createSupabaseServerClient();
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    throw new SessionStoreError("session_not_found", "Session not found", 404, sessionError);
  }

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .eq("session_id", session.id)
    .order("seat_number", { ascending: true });

  if (playersError) {
    throw new SessionStoreError("database_error", "Could not load players", 500, playersError);
  }

  const { data: accusationVotes, error: votesError } = await supabase
    .from("accusation_votes")
    .select("*")
    .eq("session_id", session.id);

  if (votesError) {
    throw new SessionStoreError(
      "database_error",
      "Could not load accusation votes",
      500,
      votesError,
    );
  }

  return {
    session,
    players: players ?? [],
    accusationVotes: accusationVotes ?? [],
  };
}

export function tallyAccusations(votes: AccusationVoteRow[]) {
  const counts = new Map<string, number>();

  for (const vote of votes) {
    counts.set(vote.suspect_id, (counts.get(vote.suspect_id) ?? 0) + 1);
  }

  return counts;
}

export async function joinSessionByCode(input: {
  joinCode: string;
  name: string;
  deviceId: string;
}) {
  assertSupabaseConfigured();

  const joinCode = toPublicJoinCode(input.joinCode);
  const name = input.name.trim().slice(0, 40);
  const deviceId = input.deviceId.trim().slice(0, 128);

  if (!joinCode || !name || !deviceId) {
    throw new SessionStoreError("invalid_request", "joinCode, name, and deviceId are required", 400);
  }

  const supabase = createSupabaseServerClient();
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("join_code", joinCode)
    .single();

  if (sessionError || !session) {
    throw new SessionStoreError("join_code_not_found", "Join code not found", 404, sessionError);
  }

  const caseData = await loadCase(session.case_id).catch(() => null);

  if (!caseData) {
    throw new SessionStoreError("case_not_found", `Unknown case id: ${session.case_id}`, 404);
  }

  const { data: existingPlayer } = await supabase
    .from("players")
    .select("*")
    .eq("session_id", session.id)
    .eq("device_id", deviceId)
    .maybeSingle();

  if (existingPlayer) {
    const { data: updatedPlayer, error: updateError } = await supabase
      .from("players")
      .update({ name, last_seen_at: new Date().toISOString() })
      .eq("id", existingPlayer.id)
      .select("*")
      .single();

    if (updateError || !updatedPlayer) {
      throw new SessionStoreError("database_error", "Could not update player", 500, updateError);
    }

    return { session, player: updatedPlayer, existing: true };
  }

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .eq("session_id", session.id)
    .order("seat_number", { ascending: true });

  if (playersError) {
    throw new SessionStoreError("database_error", "Could not inspect lobby seats", 500, playersError);
  }

  const currentPlayers = players ?? [];
  const detectiveCount = currentPlayers.filter((player) => !player.is_observer).length;
  const maxDetectives = caseData.meta.recommendedPlayers.max;
  const isObserver = session.status !== "lobby" || detectiveCount >= maxDetectives;
  const seatNumber = getNextSeatNumber(currentPlayers, maxDetectives, isObserver);

  const { data: player, error: insertError } = await supabase
    .from("players")
    .insert({
      session_id: session.id,
      name,
      device_id: deviceId,
      seat_number: seatNumber,
      is_observer: isObserver,
    })
    .select("*")
    .single();

  if (insertError || !player) {
    throw new SessionStoreError("database_error", "Could not join lobby", 500, insertError);
  }

  await supabase.from("events").insert({
    session_id: session.id,
    type: isObserver ? "player.observer_joined" : "player.joined",
    payload: { playerId: player.id, name: player.name, seatNumber: player.seat_number },
  });

  return { session, player, existing: false };
}

export async function startSession(sessionId: string) {
  assertSupabaseConfigured();

  const { session } = await getLobbyState(sessionId);
  const caseData = await loadCase(session.case_id).catch(() => null);

  if (!caseData) {
    throw new SessionStoreError("case_not_found", `Unknown case id: ${session.case_id}`, 404);
  }

  const firstChapterId = caseData.chapters[0]?.id ?? null;
  const firstChapter = firstChapterId
    ? caseData.chapters.find((chapter) => chapter.id === firstChapterId)
    : undefined;
  const unlockedEvidence = firstChapter
    ? getUnlockedEvidenceForChapter(caseData, firstChapter, session.unlocked_evidence)
    : session.unlocked_evidence;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sessions")
    .update({
      status: "in_progress",
      current_scene: "brief",
      current_chapter_id: firstChapterId,
      unlocked_evidence: unlockedEvidence,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", session.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new SessionStoreError("database_error", "Could not start session", 500, error);
  }

  await supabase.from("events").insert({
    session_id: session.id,
    type: "session.started",
    payload: { currentScene: "brief", currentChapterId: data.current_chapter_id },
  });

  return data;
}

export async function setSessionScene(input: {
  sessionId: string;
  scene: SessionScene;
  chapterId?: string | null;
}) {
  assertSupabaseConfigured();

  const { session } = await getLobbyState(input.sessionId);
  const caseData = await loadCase(session.case_id).catch(() => null);

  if (!caseData) {
    throw new SessionStoreError("case_not_found", `Unknown case id: ${session.case_id}`, 404);
  }

  const chapter = input.chapterId
    ? caseData.chapters.find((item) => item.id === input.chapterId)
    : null;

  if (input.chapterId && !chapter) {
    throw new SessionStoreError("invalid_request", `Unknown chapter id: ${input.chapterId}`, 400);
  }

  const supabase = createSupabaseServerClient();
  const unlockedEvidence = chapter
    ? getUnlockedEvidenceForChapter(caseData, chapter, session.unlocked_evidence)
    : session.unlocked_evidence;
  const { data, error } = await supabase
    .from("sessions")
    .update({
      status: input.scene === "lobby" ? "lobby" : "in_progress",
      current_scene: input.scene,
      current_chapter_id: input.chapterId ?? session.current_chapter_id,
      current_interview_suspect_id: chapter?.type === "interview" ? chapter.suspectId : null,
      unlocked_evidence: unlockedEvidence,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", session.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new SessionStoreError("database_error", "Could not update scene", 500, error);
  }

  await supabase.from("events").insert({
    session_id: session.id,
    type: "session.scene_changed",
    payload: {
      currentScene: data.current_scene,
      currentChapterId: data.current_chapter_id,
    },
  });

  return data;
}

export async function setSessionInterviewer(input: {
  sessionId: string;
  playerId: string | null;
}) {
  assertSupabaseConfigured();

  const { session, players } = await getLobbyState(input.sessionId);

  if (input.playerId !== null) {
    const player = players.find((item) => item.id === input.playerId);

    if (!player) {
      throw new SessionStoreError("invalid_request", "Player is not part of this session", 400);
    }

    if (player.is_observer) {
      throw new SessionStoreError("invalid_request", "Observers cannot interview", 400);
    }
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sessions")
    .update({
      current_interviewer_player_id: input.playerId,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", session.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new SessionStoreError("database_error", "Could not update interviewer", 500, error);
  }

  await supabase.from("events").insert({
    session_id: session.id,
    type: input.playerId ? "session.interviewer_set" : "session.interviewer_cleared",
    payload: { playerId: input.playerId },
  });

  return data;
}

export async function setAccusationVote(input: {
  sessionId: string;
  playerId: string;
  suspectId: string | null;
}) {
  assertSupabaseConfigured();

  const { session, players } = await getLobbyState(input.sessionId);
  const caseData = await loadCase(session.case_id).catch(() => null);

  if (!caseData) {
    throw new SessionStoreError("case_not_found", `Unknown case id: ${session.case_id}`, 404);
  }

  const player = players.find((item) => item.id === input.playerId);

  if (!player) {
    throw new SessionStoreError("invalid_request", "Player is not part of this session", 400);
  }

  if (player.is_observer) {
    throw new SessionStoreError("invalid_request", "Observers cannot vote", 400);
  }

  if (input.suspectId !== null) {
    const suspect = caseData.suspects.find((item) => item.id === input.suspectId);

    if (!suspect) {
      throw new SessionStoreError("invalid_request", `Unknown suspect id: ${input.suspectId}`, 400);
    }
  }

  const supabase = createSupabaseServerClient();

  if (input.suspectId === null) {
    const { error } = await supabase
      .from("accusation_votes")
      .delete()
      .eq("session_id", session.id)
      .eq("player_id", input.playerId);

    if (error) {
      throw new SessionStoreError("database_error", "Could not clear accusation", 500, error);
    }
  } else {
    const { error } = await supabase.from("accusation_votes").upsert(
      {
        session_id: session.id,
        player_id: input.playerId,
        suspect_id: input.suspectId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id,player_id" },
    );

    if (error) {
      throw new SessionStoreError("database_error", "Could not record accusation", 500, error);
    }
  }

  await supabase.from("events").insert({
    session_id: session.id,
    type: input.suspectId ? "session.accusation_set" : "session.accusation_cleared",
    payload: { suspectId: input.suspectId, playerId: input.playerId },
  });

  return getLobbyState(input.sessionId);
}

export async function advanceSessionChapter(sessionId: string, direction: "next" | "previous") {
  assertSupabaseConfigured();

  const { session } = await getLobbyState(sessionId);
  const caseData = await loadCase(session.case_id).catch(() => null);

  if (!caseData) {
    throw new SessionStoreError("case_not_found", `Unknown case id: ${session.case_id}`, 404);
  }

  const currentIndex = getChapterIndex(caseData, session.current_chapter_id);
  const nextIndex =
    direction === "next"
      ? Math.min(currentIndex + 1, caseData.chapters.length - 1)
      : Math.max(currentIndex - 1, 0);
  const nextChapter = caseData.chapters[nextIndex] ?? caseData.chapters[0];

  if (
    direction === "next" &&
    !isChapterUnlocked(caseData, nextChapter, session.current_chapter_id)
  ) {
    throw new SessionStoreError(
      "invalid_request",
      `Chapter "${nextChapter.id}" is gated by prerequisites that have not been visited.`,
      400,
    );
  }

  return setSessionScene({
    sessionId,
    scene: getChapterScene(nextChapter),
    chapterId: nextChapter.id,
  });
}

export type InterviewContext = {
  session: SessionRow;
  caseData: Case;
  chapter: Chapter & { type: "interview" };
  suspect: Suspect;
  messages: MessageRow[];
};

export async function getInterviewContext(sessionId: string): Promise<InterviewContext> {
  assertSupabaseConfigured();

  const { session } = await getLobbyState(sessionId);
  const caseData = await loadCase(session.case_id).catch(() => null);

  if (!caseData) {
    throw new SessionStoreError("case_not_found", `Unknown case id: ${session.case_id}`, 404);
  }

  const chapter = caseData.chapters.find((item) => item.id === session.current_chapter_id);

  if (!chapter || chapter.type !== "interview") {
    throw new SessionStoreError(
      "invalid_request",
      "Current chapter is not an interview chapter",
      400,
    );
  }

  const suspect = caseData.suspects.find((item) => item.id === chapter.suspectId);

  if (!suspect) {
    throw new SessionStoreError(
      "invalid_request",
      `Suspect "${chapter.suspectId}" not found in case`,
      400,
    );
  }

  const supabase = createSupabaseServerClient();
  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", session.id)
    .eq("suspect_id", suspect.id)
    .order("sequence", { ascending: true });

  if (error) {
    throw new SessionStoreError("database_error", "Could not load messages", 500, error);
  }

  return {
    session,
    caseData,
    chapter: chapter as Chapter & { type: "interview" },
    suspect,
    messages: messages ?? [],
  };
}

export async function getInterviewMessages(input: {
  sessionId: string;
  suspectId: string;
}): Promise<MessageRow[]> {
  assertSupabaseConfigured();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", input.sessionId)
    .eq("suspect_id", input.suspectId)
    .order("sequence", { ascending: true });

  if (error) {
    throw new SessionStoreError("database_error", "Could not load messages", 500, error);
  }

  return data ?? [];
}

function buildInterviewSystemPrompt(input: {
  caseData: Case;
  suspect: Suspect;
  presentedEvidence: Evidence | null;
  /**
   * Phase 2g: revelations that have just unlocked this turn. The suspect should
   * naturally weave these into the response they're about to give, in their own
   * voice, instead of repeating the surface alibi.
   */
  unlockedRevelations?: string[];
}): string {
  const lines = [
    `You are ${input.suspect.name}, a suspect being questioned by a CBI special team about the death of ${input.caseData.victim.name} in ${input.caseData.meta.title}.`,
    `Voice and speaking style: ${input.suspect.voice}`,
    `Your public alibi and surface story: ${input.suspect.publicAlibi}`,
  ];

  if (input.suspect.neverReveal?.length) {
    lines.push(
      `You must never reveal the following, under any circumstances: ${input.suspect.neverReveal.join("; ")}.`,
    );
  }

  lines.push(
    "Stay strictly in character. If asked about things outside your public story or things you would not plausibly know, deflect naturally in your voice. Do not invent solution details, do not confess, and do not break character. Keep responses to two to four sentences unless asked for more.",
    "Standing context: the CBI has full forensic access to Vikram's iCloud account, email, phone, laptop, and physical effects. Any document, message, recording, or correspondence you ever sent him is already in the CBI's case file. If the interviewer asks you to 'share' or 'produce' a document you've referenced, redirect them to their own case file — do NOT refuse on IP, source-confidentiality, or possession grounds. You want the CBI to find what's already there.",
  );

  if (input.presentedEvidence) {
    lines.push(
      `The interviewer has just placed this piece of evidence in front of you: "${input.presentedEvidence.title}". Context for you: ${input.presentedEvidence.loreText}`,
      "React to it in character. You may acknowledge what you see while continuing to maintain your public story unless your character would credibly break. Do not invent additional facts about the evidence.",
    );
  }

  if (input.unlockedRevelations?.length) {
    lines.push(
      "IMPORTANT — the interviewer has just earned the following revelation(s) from you. Weave them naturally into your response in your own voice; do NOT lead with the surface alibi this turn. Speak the substance below as you would say it, paraphrasing as needed, but stay faithful to the content:",
      input.unlockedRevelations.map((r, i) => `(${i + 1}) ${r}`).join("\n\n"),
      "Deliver the revelation in this turn's response. Do not return to the cover story.",
      "If any of these revelations reference documents you sent to Vikram (emails, memos, WhatsApp messages, recordings, etc.) and the interviewer later asks you to 'share' or 'produce' that artifact, redirect them gently — the CBI has already recovered Vikram's iCloud / email / phone and the artifact is in their case file. Tell them where to look (their evidence locker, the case file). Do not refuse on IP / source-confidentiality grounds; you want them to find it.",
    );
  }

  return lines.join("\n\n");
}

async function callRoleplay(input: {
  apiKey: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  history: { role: "user" | "assistant"; content: string }[];
  question: string;
}): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      // HTTP header values must be ASCII. Do not use em-dashes or other Unicode here.
      "X-Title": "Mystery Engine",
    },
    body: JSON.stringify({
      model: input.model,
      stream: false,
      temperature: input.temperature,
      messages: [
        { role: "system", content: input.systemPrompt },
        ...input.history,
        { role: "user", content: input.question },
      ],
    }),
  });

  if (!response.ok) {
    throw new SessionStoreError(
      "database_error",
      `OpenRouter request failed with status ${response.status}`,
      502,
    );
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) {
    throw new SessionStoreError("database_error", "OpenRouter returned an empty response", 502);
  }
  return content;
}

async function getNextSequence(input: {
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

  if (error) {
    throw new SessionStoreError("database_error", "Could not read message sequence", 500, error);
  }

  const last = data?.[0]?.sequence ?? 0;
  return last + 1;
}

export type AskSuspectInput = {
  sessionId: string;
  playerId: string;
  question: string;
  presentedEvidenceId?: string | null;
};

export type AskSuspectResult = {
  userMessage: MessageRow;
  assistantMessage: MessageRow;
  systemMessages: MessageRow[];
  unlockOutcomes: import("@/lib/interview-unlocks").UnlockOutcome[];
  session: SessionRow;
};

export type HostUnlockInput = {
  sessionId: string;
  conditionId: string;
};

export async function getActiveHostFallbacksForSession(input: {
  sessionId: string;
}): Promise<import("@/lib/interview-unlocks").ActiveHostFallback[]> {
  assertSupabaseConfigured();
  const { session, caseData, suspect } = await getInterviewContext(input.sessionId);
  const { getActiveHostFallbacks } = await import("@/lib/interview-unlocks");
  return getActiveHostFallbacks({ caseData, session, suspect });
}

export async function triggerHostUnlock(input: HostUnlockInput): Promise<{
  outcome: import("@/lib/interview-unlocks").UnlockOutcome;
  systemMessage: MessageRow | null;
  session: SessionRow;
}> {
  assertSupabaseConfigured();
  const { session, caseData, suspect } = await getInterviewContext(input.sessionId);
  const { fireHostUnlock } = await import("@/lib/interview-unlocks");
  const result = await fireHostUnlock({
    caseData,
    session,
    suspect,
    conditionId: input.conditionId,
  });

  const supabase = createSupabaseServerClient();
  await supabase.from("events").insert({
    session_id: session.id,
    type: "interview.unlock_fired",
    payload: {
      suspectId: suspect.id,
      conditionId: input.conditionId,
      subject: result.outcome.subject,
      via: "host",
    },
  });

  return {
    outcome: result.outcome,
    systemMessage: result.systemMessage,
    session: result.updatedSession,
  };
}

export async function askSuspect(input: AskSuspectInput): Promise<AskSuspectResult> {
  assertSupabaseConfigured();

  const trimmedQuestion = input.question.trim();

  if (!trimmedQuestion) {
    throw new SessionStoreError("invalid_request", "Question is required", 400);
  }

  if (trimmedQuestion.length > 600) {
    throw new SessionStoreError(
      "invalid_request",
      "Question is too long (max 600 characters)",
      400,
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new SessionStoreError(
      "invalid_request",
      "OPENROUTER_API_KEY is not configured. Set it to enable live interviews.",
      501,
    );
  }

  const { session, caseData, chapter, suspect, messages } =
    await getInterviewContext(input.sessionId);

  if (session.current_interviewer_player_id !== input.playerId) {
    throw new SessionStoreError(
      "invalid_request",
      "Only the current interviewer can ask the suspect a question",
      403,
    );
  }

  let presentedEvidence: Evidence | null = null;
  if (input.presentedEvidenceId) {
    const ev = caseData.evidence.find((item) => item.id === input.presentedEvidenceId);

    if (!ev) {
      throw new SessionStoreError(
        "invalid_request",
        `Unknown evidence id: ${input.presentedEvidenceId}`,
        400,
      );
    }

    if (!session.unlocked_evidence.includes(ev.id)) {
      throw new SessionStoreError(
        "invalid_request",
        `Evidence "${ev.id}" is not unlocked yet`,
        400,
      );
    }

    if (
      chapter.presentableEvidence?.length &&
      !chapter.presentableEvidence.includes(ev.id)
    ) {
      throw new SessionStoreError(
        "invalid_request",
        `Evidence "${ev.id}" cannot be presented in this interview chapter`,
        400,
      );
    }

    presentedEvidence = ev;
  }

  const baseSystemPrompt = buildInterviewSystemPrompt({
    caseData,
    suspect,
    presentedEvidence,
  });

  const history: { role: "user" | "assistant"; content: string }[] = [];
  for (const row of messages) {
    if (row.role === "user" || row.role === "assistant") {
      history.push({ role: row.role, content: row.content });
    }
  }

  const supabase = createSupabaseServerClient();

  const userSequence = await getNextSequence({
    sessionId: session.id,
    suspectId: suspect.id,
  });

  const { data: userRow, error: userInsertError } = await supabase
    .from("messages")
    .insert({
      session_id: session.id,
      suspect_id: suspect.id,
      role: "user",
      content: trimmedQuestion,
      asked_by_player_id: input.playerId,
      presented_evidence_id: presentedEvidence?.id ?? null,
      is_streaming: false,
      sequence: userSequence,
    })
    .select("*")
    .single();

  if (userInsertError || !userRow) {
    throw new SessionStoreError("database_error", "Could not persist question", 500, userInsertError);
  }

  const model = caseData.llm?.modelOverride ?? process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  const temperature = caseData.llm?.temperature ?? 0.7;

  let assistantContent = await callRoleplay({
    apiKey,
    model,
    temperature,
    systemPrompt: baseSystemPrompt,
    history,
    question: trimmedQuestion,
  });

  const assistantSequence = await getNextSequence({
    sessionId: session.id,
    suspectId: suspect.id,
  });

  const { data: assistantRowInitial, error: assistantInsertError } = await supabase
    .from("messages")
    .insert({
      session_id: session.id,
      suspect_id: suspect.id,
      role: "assistant",
      content: assistantContent,
      is_streaming: false,
      sequence: assistantSequence,
    })
    .select("*")
    .single();

  if (assistantInsertError || !assistantRowInitial) {
    throw new SessionStoreError(
      "database_error",
      "Could not persist suspect response",
      500,
      assistantInsertError,
    );
  }

  let assistantRow = assistantRowInitial;

  await supabase.from("events").insert({
    session_id: session.id,
    type: "interview.exchange",
    payload: {
      suspectId: suspect.id,
      playerId: input.playerId,
      presentedEvidenceId: presentedEvidence?.id ?? null,
      userMessageId: userRow.id,
      assistantMessageId: assistantRow.id,
    },
  });

  // Evaluate pending unlocks. Adjudicator-driven; fires system messages and
  // updates session.unlocked_evidence where conditions are met.
  const { evaluatePendingUnlocks } = await import("@/lib/interview-unlocks");
  const evalResult = await evaluatePendingUnlocks({
    caseData,
    session,
    suspect,
    messages, // history before this turn
    latestUserMessage: userRow,
    latestAssistantMessage: assistantRow,
  });

  // Two-pass roleplay (Phase 2g B1): if any secret/breaking-point unlock fired
  // on this turn, regenerate the assistant message with the revealed content
  // injected into the system prompt and UPDATE the row in place. The narrative
  // stitches in a single visible turn instead of "cover story now, revelation
  // next turn."
  const spokenRevelations = evalResult.outcomes
    .filter((o) => o.fired && (o.subject === "secret" || o.subject === "breaking-point"))
    .map((o) => o.revealedText)
    .filter((text): text is string => Boolean(text));

  if (spokenRevelations.length > 0) {
    const enrichedSystemPrompt = buildInterviewSystemPrompt({
      caseData,
      suspect,
      presentedEvidence,
      unlockedRevelations: spokenRevelations,
    });
    const newContent = await callRoleplay({
      apiKey,
      model,
      temperature,
      systemPrompt: enrichedSystemPrompt,
      history,
      question: trimmedQuestion,
    });
    const { data: updatedAssistant, error: updateError } = await supabase
      .from("messages")
      .update({ content: newContent, updated_at: new Date().toISOString() })
      .eq("id", assistantRow.id)
      .select("*")
      .single();
    if (updateError || !updatedAssistant) {
      throw new SessionStoreError(
        "database_error",
        "Could not update assistant message after unlock",
        500,
        updateError,
      );
    }
    assistantRow = updatedAssistant;
    assistantContent = newContent;
  }

  for (const outcome of evalResult.outcomes) {
    if (outcome.fired) {
      await supabase.from("events").insert({
        session_id: session.id,
        type: "interview.unlock_fired",
        payload: {
          suspectId: suspect.id,
          conditionId: outcome.conditionId,
          subject: outcome.subject,
          via: "adjudicator",
        },
      });
    } else if (outcome.hostFallbackPrompted) {
      await supabase.from("events").insert({
        session_id: session.id,
        type: "interview.host_fallback_prompted",
        payload: {
          suspectId: suspect.id,
          conditionId: outcome.conditionId,
          attempts: outcome.state.attempts,
          maxAdjacency: outcome.state.max_adjacency,
        },
      });
    }
  }

  return {
    userMessage: userRow,
    assistantMessage: assistantRow,
    systemMessages: evalResult.systemMessagesInserted,
    unlockOutcomes: evalResult.outcomes,
    session: evalResult.updatedSession,
  };
}
