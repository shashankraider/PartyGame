"use client";

import { InterviewClock, useInterviewClock } from "./InterviewClock";
import { gameFetch, newRequestId } from "@/lib/game-fetch";

import { VisualCaseBoard, EvidenceGallery, ExhibitDetail, RecoveredPhone, VisualEnding, GameStatus, caseAsset } from "./InvestigationVisuals";
import { CaseArtwork } from "./CaseArtwork";
import Image from "next/image";
import { CrimeSceneReveal, hasCrimeScene } from "@/components/CrimeSceneReveal";
import { LetterReveal, getOpeningLetter } from "@/components/LetterReveal";
import { OpeningBriefing } from "@/components/OpeningBriefing";
import { DetectiveBadge } from "@/components/DetectiveBadge";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Chapter } from "@/engine/types";
import type { PublicCase as Case, PublicSuspect as Suspect } from "@/lib/public-case";
import type { LobbyState } from "@/lib/session-store";
import { writeActivePlayerSession } from "@/lib/player-session";
import {
  useInterviewTranscriptRealtime,
  useSessionLobbyRealtime,
} from "@/lib/session-realtime";
import { useSpeechToText } from "@/lib/use-speech-to-text";
import {
  getNextInterviewerName,
  pickNextInterviewer,
  listRotatingDetectives,
} from "@/lib/round-robin";
import type { MessageRow, PlayerRow, SessionRow, SessionScene } from "@/lib/supabase";

type PlayerLobbyViewProps = {
  initialLobby: LobbyState;
  caseData: Case;
  playerId: string;
};

type ScenePayload = {
  session?: SessionRow;
  error?: string;
};

const sceneTitles: Record<SessionScene, string> = {
  lobby: "Waiting room",
  brief: "Case briefing",
  case_board: "Case board",
  interview: "Live interview",
  phone_hack: "Recovered phone",
  accusation: "Accusation",
  reveal: "The reveal",
};

function getCurrentChapter(caseData: Case, chapterId: string | null): Chapter | null {
  return caseData.chapters.find((chapter) => chapter.id === chapterId) ?? null;
}

function getCurrentSuspect(caseData: Case, chapter: Chapter | null): Suspect | null {
  if (!chapter || chapter.type !== "interview") {
    return null;
  }
  return caseData.suspects.find((suspect) => suspect.id === chapter.suspectId) ?? null;
}

function getCaseAssetUrl(caseData: Case, assetPath: string | undefined): string | null {
  if (!assetPath?.startsWith("assets/")) {
    return null;
  }

  return `/api/cases/${encodeURIComponent(caseData.id)}/assets/${assetPath
    .slice("assets/".length)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

function getPresentableEvidence(caseData: Case, chapter: Chapter | null, unlocked: string[]) {
  const unlockedSet = new Set(unlocked);
  const unlockedEvidence = caseData.evidence.filter((evidence) => unlockedSet.has(evidence.id));

  if (chapter?.type !== "interview" || !chapter.presentableEvidence?.length) {
    return unlockedEvidence;
  }

  const allowed = new Set(chapter.presentableEvidence);
  return unlockedEvidence.filter((evidence) => allowed.has(evidence.id));
}

export function PlayerLobbyView({ initialLobby, caseData: initialCaseData, playerId }: PlayerLobbyViewProps) {
  const { lobby, error: realtimeError, applySnapshot } = useSessionLobbyRealtime(
    initialLobby.session.id,
    initialLobby,
  );
  const caseData = lobby.caseData ?? initialCaseData;
  const [localError, setLocalError] = useState<string | null>(null);
  const sceneKey = `${lobby.session.current_scene}:${lobby.session.current_chapter_id}`;
  const [navigation, setNavigation] = useState({ scene: sceneKey, panel: "now" });
  const panel = navigation.scene === sceneKey ? navigation.panel : "now";
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [sceneKey]);
  const error = localError ?? realtimeError;
  const setError = setLocalError;
  const hasStarted = lobby.session.status !== "lobby";

  const player = lobby.players.find((item) => item.id === playerId);
  const activePlayerName = player?.name;
  const detectives = useMemo(
    () => lobby.players.filter((item) => !item.is_observer),
    [lobby.players],
  );
  const chapter = useMemo(
    () => getCurrentChapter(caseData, lobby.session.current_chapter_id),
    [caseData, lobby.session.current_chapter_id],
  );

  useEffect(() => {
    if (!activePlayerName) return;

    writeActivePlayerSession(window.localStorage, {
      joinCode: lobby.session.join_code,
      playerName: activePlayerName,
      sessionId: lobby.session.id,
      playerId,
    });
  }, [
    activePlayerName,
    lobby.session.id,
    lobby.session.join_code,
    playerId,
  ]);

  if (!player) {
    return (
      <div className="rounded-3xl border border-red-400/30 bg-red-950/30 p-6 text-red-100">
        This player is no longer in the lobby.
      </div>
    );
  }

  const updateSession = (next: SessionRow) => applySnapshot({ session: next });
  const setLobby = (next: LobbyState | ((current: LobbyState) => LobbyState)) => {
    if (typeof next === "function") {
      const computed = next(lobby);
      applySnapshot(computed);
    } else {
      applySnapshot(next);
    }
  };

  return (
    <section className="player-controller">
      {lobby.session.current_scene !== "lobby" ? <Header player={player} scene={lobby.session.current_scene} /> : null}

      {error ? (
        <p className="mt-5 rounded-2xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-100">
          {error}
        </p>
      ) : null}

      <InterviewClock session={lobby.session} multiplayer={lobby.players.filter(p => !p.is_observer).length > 1} />
      <GameStatus paused={lobby.session.status === "paused"} pending={lobby.turnPending} error={realtimeError} activeName={lobby.players.find(p=>p.id===lobby.session.current_interviewer_player_id)?.name}/>

      {hasStarted && <nav className="player-navigation" aria-label="Your investigation">
        {[["now", "Now"], ["evidence", `Case file · ${caseData.evidence.length}`], ["team", "Team"]].map(([id, label]) =>
          <button key={id} type="button" aria-pressed={panel === id} aria-controls={`player-${id}`} onClick={() => { setNavigation({ scene: sceneKey, panel: id }); window.scrollTo({ top: 0, behavior: "instant" }); }}>{label}</button>
        )}
      </nav>}
      <div id="player-now" hidden={panel !== "now"}>
      <fieldset disabled={lobby.session.status === 'paused' || Boolean(lobby.turnPending)} className="mt-6 min-w-0">
        {lobby.session.current_scene === "lobby" ? (
          <LobbyMode lobby={lobby} player={player} detectives={detectives} />
        ) : null}

        {lobby.session.current_scene === "brief" ? (
          <BriefMode caseData={caseData} player={player} />
        ) : null}

        {lobby.session.current_scene === "case_board" ? (
          <CaseBoardTabs
            caseData={caseData}
            chapter={chapter}
            unlocked={lobby.session.unlocked_evidence}
          />
        ) : null}

        {lobby.session.current_scene === "interview" ? (
          <InterviewMode
            caseData={caseData}
            chapter={chapter}
            session={lobby.session}
            player={player}
            players={lobby.players}
            unlocked={lobby.session.unlocked_evidence}
            onSession={updateSession}
            onError={setError}
          />
        ) : null}

        {lobby.session.current_scene === "phone_hack" ? (
          <RecoveredPhone key={chapter?.id} chapter={chapter} compact />
        ) : null}

        {lobby.session.current_scene === "accusation" ? (
          <AccusationMode
            caseData={caseData}
            chapter={chapter}
            lobby={lobby}
            player={player}
            onLobby={setLobby}
            onError={setError}
          />
        ) : null}

        {lobby.session.current_scene === "reveal" ? (
          <VisualEnding caseData={caseData} lobby={lobby} playerId={player.id} />
        ) : null}
      </fieldset>

      </div>
      {panel === "evidence" && <div id="player-evidence" className="player-case-file">
        <EvidenceGallery caseData={caseData} title="Your case file" />
      </div>}
      {panel === "team" && <section id="player-team" className="player-team">
        <h2>Your team</h2><p>Game {lobby.session.join_code}</p>
        <ul>{lobby.players.map(member => <li key={member.id}><strong>{member.name}{member.id === playerId ? " (you)" : ""}</strong><span>{member.is_observer ? "Observer" : member.id === lobby.session.current_interviewer_player_id ? "Leading the interview" : `Detective ${member.seat_number}`}</span></li>)}</ul>
      </section>}
    </section>
  );
}

function Header({ player, scene }: { player: PlayerRow; scene: SessionScene }) {
  const role = player.is_observer ? "Observer" : `Detective seat ${player.seat_number}`;

  return (
    <header className="player-header">
      <div><p>{role}</p><h1>{player.name}</h1></div>
      <span>{sceneTitles[scene]}</span>
    </header>
  );
}

function LobbyMode({
  lobby,
  player,
  detectives,
}: {
  lobby: LobbyState;
  player: PlayerRow;
  detectives: PlayerRow[];
}) {
  const hasStarted = lobby.session.status !== "lobby";

  return (
    <div className="case-shell lobby-player-wait">
      <div className="lobby-credential"><DetectiveBadge name={player.name} seat={player.seat_number} observer={player.is_observer} /><div><p className="case-eyebrow">{player.is_observer ? "Observer pass" : "Detective credential"}</p><h1 className="case-serif">You’re in, {player.name}.</h1><p>Game {lobby.session.join_code}</p></div></div>
      <p role="status" className="lobby-wait-status">{player.is_observer ? "You’re following as an observer. Watch the shared screen as the case unfolds." : hasStarted ? "The investigation has begun. Watch the shared screen for your briefing." : "Waiting for the host to begin. Keep this page open — your briefing will appear automatically."}</p>
      <div className="lobby-roster-heading"><h3 className="case-serif">Your fellow detectives</h3><span>{detectives.length} joined</span></div>
      <div className="lobby-phone-roster">{detectives.map(detective => <div className="lobby-seat" key={detective.id}><DetectiveBadge name={detective.name} seat={detective.seat_number} /><div><strong>{detective.name}{detective.id === player.id ? " (you)" : ""}</strong><span>Seat {detective.seat_number}</span></div></div>)}</div>
      <p className="lobby-small">Your phone is your case file. Questions and evidence will appear here as you investigate.</p>
    </div>
  );
}

function BriefMode({ caseData, player }: { caseData: Case; player: PlayerRow }) {
  return <OpeningBriefing caseData={caseData} compact observer={player.is_observer} />;
}

function CaseBoardTabs({ caseData, chapter, unlocked }: { caseData: Case; chapter: Chapter | null; unlocked: string[] }) {
  if (hasCrimeScene(caseData, chapter, unlocked) && chapter) return <CrimeSceneReveal caseData={caseData} chapter={chapter} compact />;
  const letter = getOpeningLetter(caseData, chapter, unlocked);
  if (letter && chapter) return <LetterReveal key={letter.id} caseData={caseData} evidence={letter} chapter={chapter} compact />;
  return <VisualCaseBoard caseData={caseData} chapter={chapter} compact />;
}

function InterviewMode({
  caseData,
  chapter,
  session,
  player,
  players,
  unlocked,
  onSession,
  onError,
}: {
  caseData: Case;
  chapter: Chapter | null;
  session: SessionRow;
  player: PlayerRow;
  players: PlayerRow[];
  unlocked: string[];
  onSession: (session: SessionRow) => void;
  onError: (error: string | null) => void;
}) {
  const suspect = getCurrentSuspect(caseData, chapter);
  const presentable = useMemo(
    () => getPresentableEvidence(caseData, chapter, unlocked),
    [caseData, chapter, unlocked],
  );
  const [question, setQuestion] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [isEvidencePickerOpen, setIsEvidencePickerOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const transcript = useTranscript(session.id, suspect?.id ?? null);
  const speech = useSpeechToText();
  const lastAppendedRef = useRef("");
  const selectedEvidenceItem = selectedEvidence
    ? (presentable.find((evidence) => evidence.id === selectedEvidence) ?? null)
    : null;
  const suspectPortraitUrl = getCaseAssetUrl(caseData, suspect?.portraitUrl);

  // Append committed STT chunks to the textarea. We track the last-appended
  // length so finalTranscript growing doesn't re-append previous text.
  useEffect(() => {
    const finalText = speech.finalTranscript;
    if (!finalText) {
      lastAppendedRef.current = "";
      return;
    }
    if (finalText === lastAppendedRef.current) return;
    const delta = finalText.slice(lastAppendedRef.current.length).trim();
    lastAppendedRef.current = finalText;
    if (!delta) return;
    setQuestion((prev) => {
      const joined = prev ? `${prev.trimEnd()} ${delta}` : delta;
      return joined.replace(/\s+/g, " ");
    });
  }, [speech.finalTranscript]);

  const isInterviewer = session.current_interviewer_player_id === player.id;
  const interviewClock = useInterviewClock(session);
  const detectiveCount = listRotatingDetectives(players).length;
  const nextInterviewerName = useMemo(() => {
    if (!session.current_interviewer_player_id || detectiveCount <= 1) {
      return null;
    }
    return getNextInterviewerName(players, session.current_interviewer_player_id);
  }, [players, session.current_interviewer_player_id, detectiveCount]);
  const showNextRotationCue =
    isInterviewer &&
    detectiveCount > 1 &&
    nextInterviewerName !== null &&
    interviewClock.microphone <= 20;

  async function claimInterviewer(targetPlayerId: string | null) {
    setIsClaiming(true);
    onError(null);

    const response = await gameFetch(`/api/sessions/${session.id}/interviewer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: targetPlayerId }),
    });
    const payload = (await response.json().catch(() => ({}))) as ScenePayload;

    if (!response.ok || !payload.session) {
      onError(payload.error ?? "Could not update interviewer.");
      setIsClaiming(false);
      return;
    }

    onSession(payload.session);
    setIsClaiming(false);
  }

  const pendingQuestion = useRef<{ key: string; id: string } | null>(null);
  async function askSuspect() {
    const trimmed = question.trim();
    if (!trimmed || !suspect) return;

    // Cut the mic before send so we don't capture the suspect's response
    // (over loudspeaker) as the next question, and so finalTranscript resets.
    if (speech.isListening) speech.stop();
    speech.reset();
    lastAppendedRef.current = "";

    setIsAsking(true);
    onError(null);

    const requestKey = JSON.stringify([session.id, suspect.id, trimmed, selectedEvidence]);
    if (pendingQuestion.current?.key !== requestKey) pendingQuestion.current = { key: requestKey, id: newRequestId() };
    const response = await gameFetch(`/api/sessions/${session.id}/interview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: player.id,
        question: trimmed,
        requestId: pendingQuestion.current.id,
        presentedEvidenceId: selectedEvidence,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      userMessage?: MessageRow;
      assistantMessage?: MessageRow;
      session?: SessionRow;
      error?: string;
    };

    if (!response.ok || !payload.assistantMessage) {
      onError(payload.error ?? "The suspect did not respond.");
      setIsAsking(false);
      return;
    }

    if (payload.session) {
      onSession(payload.session);
    }

    pendingQuestion.current = null;
    setQuestion("");
    setSelectedEvidence(null);
    setIsEvidencePickerOpen(false);
    transcript.refresh();
    setIsAsking(false);
  }

  if (player.is_observer) {
    return (
      <div>
        <h2 className="text-2xl font-semibold">{chapter?.title ?? "Live interview"}</h2>
        {suspect ? (
          <p className="mt-3 text-sm text-[#cfc8ba]">
            Watch the TV. {suspect.name} is being questioned — you&apos;re spectating.
          </p>
        ) : null}
        <Transcript messages={transcript.messages} suspectName={suspect?.name ?? null} />

      </div>
    );
  }

  if (!isInterviewer) {
    return (
      <div>
        <h2 className="text-2xl font-semibold">{chapter?.title ?? "Live interview"}</h2>
        {suspect ? (
          <div className="mt-3 flex items-center gap-3">
            {suspectPortraitUrl ? (
              <Image
                src={suspectPortraitUrl}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 rounded-xl object-cover"
                unoptimized
              />
            ) : null}
            <p className="text-sm uppercase tracking-[0.22em] text-[#a6a29a]">{suspect.name}</p>
          </div>
        ) : null}
        <p className="mt-4 rounded-2xl border border-white/10 px-4 py-3 text-sm leading-6 text-[#cfc8ba]">
          {session.current_interviewer_player_id
            ? ` ${players.find(p=>p.id===session.current_interviewer_player_id)?.name ?? "Another detective"} is leading the interview. Watch the TV — you’ll get a turn next.`
            : "No interviewer yet. Any detective can take the lead."}
        </p>
        <button
          type="button"
          onClick={() => claimInterviewer(player.id)}
          disabled={isClaiming}
          className="mt-5 w-full rounded-full bg-[#c8a46a] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-[#e6bd77] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isClaiming ? "Claiming..." : "Take control"}
        </button>
        <Transcript messages={transcript.messages} suspectName={suspect?.name ?? null} />

      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold">{chapter?.title ?? "Live interview"}</h2>
      {suspect ? (
        <div className="mt-3 rounded-2xl border border-white/10 p-4">
          <div className="flex items-start gap-4">
            {suspectPortraitUrl ? (
              <Image
                src={suspectPortraitUrl}
                alt=""
                width={72}
                height={72}
                className="h-[72px] w-[72px] shrink-0 rounded-2xl object-cover"
                unoptimized
              />
            ) : null}
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#c8a46a]">Questioning</p>
              <p className="mt-1 text-lg font-semibold">{suspect.name}</p>
              {suspect.shortDescription ? (
                <p className="mt-1 text-sm text-[#cfc8ba]">{suspect.shortDescription}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <Transcript messages={transcript.messages} suspectName={suspect?.name ?? null} />



      {showNextRotationCue ? (
        <p className="mt-5 rounded-2xl border border-[#c8a46a]/40 bg-[#c8a46a]/10 px-4 py-3 text-sm text-[#e6bd77]">
          Next: {nextInterviewerName}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        <label htmlFor="player-question" className="block text-xs uppercase tracking-[0.22em] text-[#a6a29a]">
          Your next question
        </label>
        {speech.isSupported ? (
          <button
            type="button"
            onClick={() => (speech.isListening ? speech.stop() : speech.start())}
            disabled={isAsking}
            aria-pressed={speech.isListening}
            aria-label={speech.isListening ? "Stop voice input" : "Start voice input"}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
              speech.isListening
                ? "border-red-400/60 bg-red-500/15 text-red-100 hover:bg-red-500/25"
                : "border-white/15 text-[#cfc8ba] hover:border-[#c8a46a] hover:text-[#e6bd77]"
            }`}
          >
            <span aria-hidden className="text-base leading-none">
              {speech.isListening ? "■" : "🎙"}
            </span>
            {speech.isListening ? "Stop" : "Voice"}
          </button>
        ) : null}
      </div>
      <textarea
        id="player-question"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        rows={3}
        placeholder={
          speech.isSupported
            ? "Type or tap the mic to dictate."
            : "Where were you between 8 and 10 last night?"
        }
        disabled={isAsking}
        className="mt-2 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-base leading-6 outline-none focus:border-[#c8a46a] disabled:opacity-60"
      />
      {speech.isListening || speech.interimTranscript ? (
        <p className="mt-2 rounded-2xl border border-[#c8a46a]/30 bg-[#c8a46a]/5 px-4 py-2 text-sm italic text-[#cfc8ba]">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-red-400 align-middle" />
          {speech.interimTranscript || "Listening…"}
        </p>
      ) : null}
      {speech.error ? (
        <p className="mt-2 text-xs text-red-300">{speech.error}</p>
      ) : null}

      {selectedEvidenceItem && <details><summary>Preview selected exhibit</summary><ExhibitDetail caseData={caseData} evidence={selectedEvidenceItem}/></details>}
      {presentable.length > 0 ? (
        <div className="relative mt-5">
          <p className="text-xs uppercase tracking-[0.22em] text-[#a6a29a]">Present evidence</p>
          <button
            type="button"
            onClick={() => setIsEvidencePickerOpen((value) => !value)}
            disabled={isAsking}
            className="mt-2 flex w-full items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-left text-sm transition hover:border-[#c8a46a]/60 focus:border-[#c8a46a] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            aria-expanded={isEvidencePickerOpen}
          >
            <span className="min-w-0">
              <span className="block truncate font-semibold text-[#f5f2ea]">
                {selectedEvidenceItem?.title ?? "No evidence (ask plainly)"}
              </span>
              {selectedEvidenceItem ? (
                <span className="mt-1 block truncate text-[10px] uppercase tracking-[0.2em] text-[#a6a29a]">
                  {selectedEvidenceItem.category}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 text-xs uppercase tracking-[0.18em] text-[#e6bd77]">
              {isEvidencePickerOpen ? "Close" : "Choose"}
            </span>
          </button>

          {isEvidencePickerOpen ? (
            <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-[#c8a46a]/30 bg-[#080909] p-2 shadow-2xl shadow-black/60">
              <button
                type="button"
                onClick={() => {
                  setSelectedEvidence(null);
                  setIsEvidencePickerOpen(false);
                }}
                disabled={isAsking}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  selectedEvidence === null
                    ? "bg-[#c8a46a] text-zinc-950"
                    : "text-[#cfc8ba] hover:bg-white/[0.06]"
                }`}
              >
                <span className="font-semibold">No evidence (ask plainly)</span>
                {selectedEvidence === null ? (
                  <span className="text-xs font-semibold">Selected</span>
                ) : null}
              </button>
              {presentable.map((evidence) => {
                const isSelected = selectedEvidence === evidence.id;
                return (
                  <button
                    key={evidence.id}
                    type="button"
                    onClick={() => {
                      setSelectedEvidence(evidence.id);
                      setIsEvidencePickerOpen(false);
                    }}
                    disabled={isAsking}
                    className={`mt-1 w-full rounded-xl px-3 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isSelected
                        ? "bg-[#c8a46a] text-zinc-950"
                        : "text-[#cfc8ba] hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="block font-semibold">{evidence.title}</span>
                    <span
                      className={`mt-1 block text-[10px] uppercase tracking-[0.2em] ${
                        isSelected ? "text-zinc-900/70" : "text-[#a6a29a]"
                      }`}
                    >
                      {evidence.category}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-5 text-xs text-[#a6a29a]">No evidence unlocked yet to present.</p>
      )}

      <button
        type="button"
        onClick={askSuspect}
        disabled={isAsking || !question.trim() || !suspect || interviewClock.remaining <= 0 || (detectiveCount > 1 && interviewClock.microphone <= 0)}
        className="mt-6 w-full rounded-full bg-[#c8a46a] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-[#e6bd77] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isAsking ? "Suspect is responding..." : "Ask suspect"}
      </button>

      {chapter?.roundNumber === 2 ? (
        <SwitchSuspectControl
          sessionId={session.id}
          caseData={caseData}
          currentChapterId={chapter.id}
          disabled={isAsking}
          onError={onError}
        />
      ) : null}

      <button
        type="button"
        onClick={() => claimInterviewer(pickNextInterviewer(players, player.id))}
        disabled={isClaiming || isAsking}
        className="mt-3 w-full rounded-full border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] transition hover:border-[#c8a46a] hover:text-[#e6bd77] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isClaiming ? "Passing..." : "Pass control"}
      </button>
    </div>
  );
}

/**
 * Round 2 only: the player holding interviewer control can move the room to
 * another round-2 suspect without going back to the TV. Collapsed by default
 * so it doesn't clutter the interview view.
 */
function SwitchSuspectControl({
  sessionId,
  caseData,
  currentChapterId,
  disabled,
  onError,
}: {
  sessionId: string;
  caseData: Case;
  currentChapterId: string;
  disabled: boolean;
  onError: (msg: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [busyChapterId, setBusyChapterId] = useState<string | null>(null);

  const otherChapters = useMemo(
    () =>
      caseData.chapters.filter(
        (chapter): chapter is Extract<Chapter, { type: "interview" }> =>
          chapter.type === "interview" &&
          chapter.roundNumber === 2 &&
          chapter.id !== currentChapterId,
      ),
    [caseData.chapters, currentChapterId],
  );

  const suspectsById = useMemo(
    () => new Map(caseData.suspects.map((s) => [s.id, s])),
    [caseData.suspects],
  );

  if (otherChapters.length === 0) return null;

  async function jumpTo(chapterId: string) {
    if (busyChapterId) return;
    setBusyChapterId(chapterId);
    onError(null);
    const response = await gameFetch(`/api/sessions/${sessionId}/scene`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set", scene: "interview", chapterId }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      onError(payload.error ?? "Could not switch suspect.");
    }
    setBusyChapterId(null);
    setExpanded(false);
  }

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-black/20">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        disabled={disabled}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="text-xs uppercase tracking-[0.22em] text-[#c8a46a]">
          Switch suspect
        </span>
        <span className="text-xs text-[#a6a29a]">{expanded ? "▾" : "▸"}</span>
      </button>
      {expanded ? (
        <div className="grid gap-2 border-t border-white/10 p-3">
          {otherChapters.map((chapter) => {
            const suspect = suspectsById.get(chapter.suspectId);
            if (!suspect) return null;
            const isBusy = busyChapterId === chapter.id;
            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => jumpTo(chapter.id)}
                disabled={disabled || busyChapterId !== null}
                className="rounded-2xl border border-white/15 px-4 py-3 text-left text-sm transition hover:border-[#c8a46a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{suspect.name}</span>
                  {isBusy ? (
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#a6a29a]">
                      Loading…
                    </span>
                  ) : null}
                </div>
                {suspect.shortDescription ? (
                  <p className="mt-1 text-xs text-[#a6a29a]">{suspect.shortDescription}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function useTranscript(sessionId: string, suspectId: string | null) {
  const messages = useInterviewTranscriptRealtime(sessionId, suspectId);
  // `refresh` is a no-op now because the hook auto-subscribes and reloads on
  // every messages change. Kept as a stable callback so callers don't need to
  // change. Realtime fallback to a slow poll happens inside the hook.
  return { messages, refresh: () => {} };
}

function Transcript({
  messages,
  suspectName,
}: {
  messages: MessageRow[];
  suspectName: string | null;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const lastQuestion = messages.map(message => message.role).lastIndexOf("user");
  const visibleMessages = showHistory ? messages : messages.slice(Math.max(0, lastQuestion));
  if (messages.length === 0) {
    return (
      <p className="mt-5 rounded-2xl border border-white/10 px-4 py-3 text-xs leading-6 text-[#a6a29a]">
        No questions asked yet.
      </p>
    );
  }

  return (
    <div className="player-transcript mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
      {lastQuestion > 0 && <button type="button" className="player-history-toggle" aria-expanded={showHistory} onClick={() => setShowHistory(value => !value)}>{showHistory ? "Show latest answer" : "Earlier questions & answers"}</button>}
      {visibleMessages.map((message) => {
        if (message.role === "system") {
          return (
            <div
              key={message.id}
              className="my-2 flex items-center gap-3 text-[10px] uppercase tracking-[0.24em] text-[#c8a46a]"
            >
              <span className="h-px flex-1 bg-[#c8a46a]/30" />
              <span>{message.content}</span>
              <span className="h-px flex-1 bg-[#c8a46a]/30" />
            </div>
          );
        }
        return (
          <div key={message.id}>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#a6a29a]">
              {message.role === "user" ? "Interviewer" : (suspectName ?? "Suspect")}
              {message.is_streaming ? (
                <span className="ml-2 text-[#c8a46a]">typing…</span>
              ) : null}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#f5f2ea]">
              {message.content}
              {message.is_streaming ? (
                <span className="ml-1 inline-block h-3 w-[2px] animate-pulse bg-[#c8a46a] align-middle" />
              ) : null}
            </p>
          </div>
        );
      })}
    </div>
  );
}


function AccusationMode({
  caseData,
  chapter,
  lobby,
  player,
  onLobby,
  onError,
}: {
  caseData: Case;
  chapter: Chapter | null;
  lobby: LobbyState;
  player: PlayerRow;
  onLobby: (lobby: LobbyState) => void;
  onError: (error: string | null) => void;
}) {
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const prompt =
    chapter?.type === "accusation"
      ? chapter.promptText ?? chapter.narration
      : "Who is responsible for the murder?";

  const myVote = lobby.accusationVotes.find((vote) => vote.player_id === player.id);
  const tally = useMemo(() => {
    const counts = new Map<string, number>();
    for (const vote of lobby.accusationVotes) {
      counts.set(vote.suspect_id, (counts.get(vote.suspect_id) ?? 0) + 1);
    }
    return counts;
  }, [lobby.accusationVotes]);
  const totalVotes = lobby.accusationVotes.length;
  const detectiveCount = lobby.players.filter((item) => !item.is_observer).length;

  async function vote(suspectId: string) {
    setSubmittingId(suspectId);
    onError(null);

    const response = await gameFetch(`/api/sessions/${lobby.session.id}/accusation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspectId, playerId: player.id }),
    });
    const payload = (await response.json().catch(() => ({}))) as LobbyState & {
      error?: string;
    };

    if (!response.ok || payload.error) {
      onError(payload.error ?? "Could not record accusation.");
      setSubmittingId(null);
      return;
    }

    onLobby(payload);
    setSubmittingId(null);
  }

  if (player.is_observer) {
    return (
      <div>
        <h2 className="text-2xl font-semibold">Accusation</h2>
        <p className="mt-3 text-sm text-[#cfc8ba]">
          Watch the TV — the detectives are choosing who to accuse.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold">Make your accusation</h2>
      {prompt ? <p className="mt-3 text-sm leading-6 text-[#cfc8ba]">{prompt}</p> : null}
      <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#a6a29a]">
        {totalVotes} of {detectiveCount} detective{detectiveCount === 1 ? "" : "s"} voted
      </p>
      <div className="mt-5 grid gap-2">
        {caseData.suspects.map((suspect) => {
          const selected = myVote?.suspect_id === suspect.id;
          const count = tally.get(suspect.id) ?? 0;
          return (
            <button
              key={suspect.id}
              type="button"
              aria-pressed={selected}
              onClick={() => vote(suspect.id)}
              disabled={submittingId !== null}
              className={`player-ballot rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
                selected
                  ? "border-[#c8a46a] bg-[#c8a46a]/10 text-[#f5f2ea]"
                  : "border-white/15 hover:border-[#c8a46a]"
              }`}
            >
              <div className="phone-ballot-portrait"><CaseArtwork src={caseAsset(caseData,suspect.portraitUrl)} alt={suspect.name} portrait/></div><div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{suspect.name}</p>
                <span className="text-xs uppercase tracking-[0.22em] text-[#a6a29a]">
                  {count} vote{count === 1 ? "" : "s"}
                </span>
              </div>
              {suspect.shortDescription ? (
                <p className="mt-1 text-xs text-[#a6a29a]">{suspect.shortDescription}</p>
              ) : null}
              {selected ? (
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#c8a46a]">
                  Your accusation
                </p>
              ) : null}
              {submittingId === suspect.id ? (
                <p className="mt-2 text-xs text-[#a6a29a]">Submitting...</p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
