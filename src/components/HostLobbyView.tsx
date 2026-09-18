"use client";

import { gameFetch } from "@/lib/game-fetch";

import { InterviewClock } from "./InterviewClock";
import { VisualCaseBoard, EvidenceGallery, ExhibitDetail, RecoveredPhone, VisualEnding, GameStatus, caseAsset } from "./InvestigationVisuals";
import Image from "next/image";
import { CaseArtwork } from "@/components/CaseArtwork";
import { CrimeSceneReveal, hasCrimeScene } from "@/components/CrimeSceneReveal";
import { LetterReveal, getOpeningLetter } from "@/components/LetterReveal";
import { OpeningBriefing } from "@/components/OpeningBriefing";
import { DetectiveBadge } from "@/components/DetectiveBadge";
import { useMemo, useState } from "react";
import type { Chapter } from "@/engine/types";
import type { PublicCase as Case } from "@/lib/public-case";
import {
  HOST_JUDGMENT_EVENT_TYPE,
  resolveCaseStatusLine,
  type HostJudgmentEventRow,
} from "@/lib/case-status";
import type { LobbyState } from "@/lib/session-store";
import {
  useCaseStatusRealtime,
  useHostFallbackRealtime,
  useInterviewTranscriptRealtime,
  useSessionLobbyRealtime,
} from "@/lib/session-realtime";
import type { SessionScene } from "@/lib/supabase";

type HostLobbyViewProps = {
  initialLobby: LobbyState;
  caseData: Case;
  qrCode: string;
  joinUrl: string;
};

const sceneLabels: Record<SessionScene, string> = {
  lobby: "Lobby",
  brief: "Cinematic Brief",
  case_board: "Case Board",
  interview: "Live Interview",
  phone_hack: "Recovered phone",
  accusation: "Accusation",
  reveal: "Reveal",
};

function getCurrentChapter(caseData: Case, chapterId: string | null) {
  return caseData.chapters.find((chapter) => chapter.id === chapterId) ?? null;
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

function ChapterBadge({ chapter }: { chapter: Chapter | null }) {
  if (!chapter) {
    return null;
  }

  return (
    <p className="text-sm uppercase tracking-[0.28em] text-[#c8a46a]">
      Round {chapter.roundNumber} · {chapter.type.replace("-", " ")}
    </p>
  );
}

export function HostLobbyView({ initialLobby, caseData: initialCaseData, qrCode, joinUrl }: HostLobbyViewProps) {
  const { lobby, error: realtimeError, applySnapshot } = useSessionLobbyRealtime(
    initialLobby.session.id,
    initialLobby,
  );
  const caseData = lobby.caseData ?? initialCaseData;
  const [localError, setLocalError] = useState<string | null>(null);
  const error = localError ?? realtimeError;
  const setError = setLocalError;
  const [isStarting, setIsStarting] = useState(false);
  const [isHostActionBusy, setIsHostActionBusy] = useState(false);

  async function startGame() {
    setIsStarting(true);
    setError(null);

    const response = await gameFetch(`/api/sessions/${lobby.session.id}/start`, {
      method: "POST",
    });
    const payload = (await response.json().catch(() => ({}))) as {
      session?: LobbyState["session"];
      error?: string;
    };

    if (!response.ok || !payload.session) {
      setError(payload.error ?? "Could not start game.");
      setIsStarting(false);
      return;
    }

    applySnapshot(payload as LobbyState);
    setIsStarting(false);
  }

  async function hostControlAction(
    action: "extend-interview" | "pause" | "resume" | "open-accusation" | "end-session" | "next" | "next-file",
  ) {
    setIsHostActionBusy(true);
    setError(null);

    const response = await gameFetch(`/api/sessions/${lobby.session.id}/scene`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      session?: LobbyState["session"];
      error?: string;
    };

    if (!response.ok || !payload.session) {
      setError(payload.error ?? "Could not update session.");
      setIsHostActionBusy(false);
      return;
    }

    applySnapshot(payload as LobbyState);
    setIsHostActionBusy(false);
  }

  const detectives = lobby.players.filter((player) => !player.is_observer);
  const observers = lobby.players.filter((player) => player.is_observer);
  const hasStarted = lobby.session.status !== "lobby";
  const isPaused = lobby.session.status === "paused";
  const isFinished = lobby.session.status === "finished";
  const currentChapter = getCurrentChapter(caseData, lobby.session.current_chapter_id);
  const isBriefingPhase = (lobby.session.phase ?? "briefing") === "briefing";
  const isInterrogationPhase = lobby.session.phase === "interrogation";
  const canOpenAccusation = hasStarted && !isPaused && !isFinished && !lobby.turnPending && isInterrogationPhase;
  // Continue advances Briefing chapters one-by-one (r1-arrival → ... → r1-suspect-board)
  // and the final click crosses into Interrogation. Belt-and-suspenders: also require the
  // current chapter to be a Briefing chapter (roundNumber 1, narrative/evidence-reveal type)
  // so we don't accidentally render Continue if session.phase and current_chapter_id drift
  // out of sync — the moment we land on r2-evidence-drop, the suspect picker owns the screen.
  const isBriefingChapter =
    currentChapter !== null &&
    currentChapter.roundNumber === 1 &&
    (currentChapter.type === "narrative" || currentChapter.type === "evidence-reveal");
  const canAdvanceBriefing =
    hasStarted && !isPaused && !isFinished && isBriefingPhase && isBriefingChapter;

  return (
    <section className="py-4">
      <div className="mb-4 rounded-2xl border border-white/10 bg-[#0b0c0c]/90 p-3 shadow-2xl shadow-black/25">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border-white/10 sm:border-r sm:pr-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#a6a29a]">Scene</p>
              <p className="mt-1 text-base font-semibold">{sceneLabels[lobby.session.current_scene]}</p>
            </div>
            <div className="border-white/10 sm:border-r sm:pr-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#a6a29a]">Status</p>
              <p className="mt-1 text-base font-semibold capitalize">
                {lobby.session.status.replace(/[-_]/g, " ")}
                {currentChapter ? ` · Round ${currentChapter.roundNumber}` : ""}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#a6a29a]">Join code</p>
              <p className="mt-1 font-mono text-base font-semibold tracking-[0.16em]">
                {lobby.session.join_code}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            type="button"
            onClick={startGame}
            disabled={isStarting || hasStarted}
            className="rounded-lg bg-[#d4ad67] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-zinc-950 transition hover:bg-[#edc77d] disabled:opacity-50"
          >
            {hasStarted ? "Started" : isStarting ? "Starting..." : "Start game"}
          </button>
          {isInterrogationPhase && !isFinished && currentChapter?.id !== "r4-evidence" ? <button type="button" className="visual-primary" disabled={isPaused || isHostActionBusy || Boolean(lobby.turnPending)} onClick={() => hostControlAction("next-file")}>{(currentChapter?.roundNumber ?? 2) < 3 ? "Open research files" : "Next investigation file"}</button> : null}
          {canAdvanceBriefing ? (
            <button
              type="button"
              onClick={() => hostControlAction("next")}
              disabled={isHostActionBusy}
              className="rounded-lg bg-[#d4ad67] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-zinc-950 transition hover:bg-[#edc77d] disabled:opacity-50"
            >
              {isHostActionBusy ? "Advancing..." : "Continue"}
            </button>
          ) : null}
          {(lobby.session.phase === 'accusation' || lobby.session.phase === 'reveal') && !isFinished ? (
            <button type="button" onClick={() => hostControlAction('next')}
              disabled={isHostActionBusy || isPaused || (lobby.session.phase === 'accusation' && (!detectives.length || !detectives.every(p => lobby.accusationVotes.some(v => v.player_id === p.id))))}
              className="rounded-lg bg-[#d4ad67] px-4 py-2.5 text-xs font-bold text-zinc-950 disabled:opacity-50">
              {lobby.session.phase === 'accusation' ? 'Begin confrontation' : (lobby.session.reveal_step ?? 0) >= 2 ? 'Finish game' : (lobby.session.reveal_step ?? 0) === 1 ? 'Reveal the truth' : 'Continue confrontation'}
            </button>
          ) : null}
          {hasStarted ? <>
          <button
            type="button"
            onClick={() => hostControlAction(isPaused ? "resume" : "pause")}
            disabled={isHostActionBusy || !hasStarted || isFinished}
            className="rounded-lg border border-white/15 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#cfc8ba] transition hover:border-[#d4ad67] hover:text-[#edc77d] disabled:opacity-50"
          >
            {isHostActionBusy ? "Updating..." : isPaused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={() => hostControlAction("open-accusation")}
            disabled={isHostActionBusy || !canOpenAccusation}
            className="rounded-lg border border-white/15 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#cfc8ba] transition hover:border-[#d4ad67] hover:text-[#edc77d] disabled:opacity-50"
          >
            Open accusation
          </button>
          <button
            type="button"
            onClick={() => hostControlAction("end-session")}
            disabled={isHostActionBusy || !hasStarted || isFinished}
            className="rounded-lg border border-red-400/35 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-red-100 transition hover:border-red-300 hover:text-red-50 disabled:opacity-50"
          >
            End session
          </button>
          </> : null}
          </div>
        </div>
      </div>

      {hasStarted && !isFinished ? (
        <CaseStatusPanel sessionId={lobby.session.id} />
      ) : null}

      {error ? (
        <p className="mb-5 rounded-2xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-100">
          {error}
        </p>
      ) : null}

      <InterviewClock session={lobby.session} multiplayer={lobby.players.filter(p => !p.is_observer).length > 1} onExtend={() => hostControlAction("extend-interview")} busy={isHostActionBusy || Boolean(lobby.turnPending) || isFinished} />
      <GameStatus paused={isPaused} pending={lobby.turnPending} error={realtimeError} activeName={lobby.players.find(p=>p.id===lobby.session.current_interviewer_player_id)?.name}/>

      <fieldset disabled={isPaused || Boolean(lobby.turnPending)} className="min-w-0">
      {lobby.session.current_scene === "lobby" ? (
        <LobbyScene
          lobby={lobby}
          caseData={caseData}
          qrCode={qrCode}
          joinUrl={joinUrl}
          detectives={detectives}
          observers={observers}
        />
      ) : null}
      {lobby.session.current_scene === "brief" ? (
        <BriefScene caseData={caseData} detectives={detectives.length} />
      ) : null}
      {lobby.session.current_scene === "case_board" ? (
        <>
          {isInterrogationPhase ? (
            <Round2InterviewPicker
              sessionId={lobby.session.id}
              caseData={caseData}
              currentChapterId={currentChapter?.id ?? ""}
              onError={setError}
            />
          ) : null}
          <CaseBoardScene
            key={currentChapter?.id ?? "case-board"}
            caseData={caseData}
            chapter={currentChapter}
            unlockedEvidence={lobby.session.unlocked_evidence}
          />
        </>
      ) : null}
      {lobby.session.current_scene === "interview" ? (
        <>
          {currentChapter?.roundNumber === 2 ? (
            <Round2InterviewPicker
              sessionId={lobby.session.id}
              caseData={caseData}
              currentChapterId={currentChapter.id}
              onError={setError}
            />
          ) : null}
          <InterviewScene
            key={currentChapter?.id ?? "interview"}
            sessionId={lobby.session.id}
            caseData={caseData}
            chapter={currentChapter}
            unlockedEvidence={lobby.session.unlocked_evidence}
            interviewer={
              lobby.players.find(
                (player) => player.id === lobby.session.current_interviewer_player_id,
              ) ?? null
            }
          />
        </>
      ) : null}
      {lobby.session.current_scene === "phone_hack" ? (
        <RecoveredPhone key={currentChapter?.id} chapter={currentChapter} />
      ) : null}
      {lobby.session.current_scene === "accusation" ? (
        <AccusationScene
          caseData={caseData}
          chapter={currentChapter}
          lobby={lobby}
        />
      ) : null}
      {lobby.session.current_scene === "reveal" ? (
        <VisualEnding caseData={caseData} lobby={lobby} />
      ) : null}

      {hasStarted &&
      lobby.session.current_scene !== "lobby" &&
      lobby.session.current_scene !== "case_board" &&
      lobby.session.current_scene !== "interview" ? (
        <HostDigitalCaseFile
          caseData={caseData}
          unlocked={lobby.session.unlocked_evidence}
          currentChapter={currentChapter}
          currentScene={lobby.session.current_scene}
        />
      ) : null}
      </fieldset>
    </section>
  );
}

function CaseStatusPanel({ sessionId }: { sessionId: string }) {
  const events = useCaseStatusRealtime(sessionId, HOST_JUDGMENT_EVENT_TYPE);
  const statusLine = resolveCaseStatusLine(events as HostJudgmentEventRow[]);

  return (
    <div className="mb-4 rounded-2xl border border-[#d4ad67]/25 bg-[#d4ad67]/10 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[#d4ad67]">Case status</p>
      <p className="mt-1 text-base leading-7 text-[#f6f0e4]">{statusLine}</p>
    </div>
  );
}

function LobbyScene({ lobby, caseData, qrCode, joinUrl, detectives, observers }: {
  lobby: LobbyState;
  caseData: Case;
  qrCode: string;
  joinUrl: string;
  detectives: LobbyState["players"];
  observers: LobbyState["players"];
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const capacity = caseData.meta.recommendedPlayers.max;
  const localOnly = ["localhost", "127.0.0.1", "[::1]"].includes(new URL(joinUrl).hostname);
  async function copyLink() {
    try { await navigator.clipboard.writeText(joinUrl); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  }
  return (
    <div className="case-shell lobby-stage">
      <div className="lobby-banner"><CaseArtwork src={`/api/cases/${encodeURIComponent(caseData.id)}/hero`} alt={`${caseData.meta.title} case artwork`} /><div><p className="case-eyebrow">The investigation begins with you</p><h2 className="case-serif">Assemble your team.</h2><p>Scan. Join. Take your seat.</p></div></div>
      <div className="lobby-room-grid">
        <aside className="lobby-join-panel">
          <p className="case-eyebrow">01 / Scan with your phone</p>
          <Image src={qrCode} alt="Scan this QR code to join the game" width={280} height={280} unoptimized className="lobby-qr" />
          <p className="lobby-small">Or visit <span className="lobby-url">{new URL("/join", joinUrl).toString()}</span> and enter</p>
          <p className="lobby-big-code" aria-label={`Game code ${lobby.session.join_code}`}>{lobby.session.join_code}</p>
          <button type="button" className="lobby-copy" onClick={copyLink}>{copied ? "Link copied ✓" : "Copy join link"}</button>
          <p role="status" className="lobby-small">{copyError ? <>Copy this address to share: <span className="lobby-url">{joinUrl}</span></> : copied ? "Send the link to your detectives." : "Keep this screen visible while everyone joins."}</p>
          {localOnly ? <p className="lobby-network-note">This address only works on this computer. Open the host page using your computer’s network address before scanning from phones on the same Wi-Fi.</p> : null}
        </aside>
        <div className="lobby-roster-panel">
          <div className="lobby-roster-heading"><div><p className="case-eyebrow">02 / Take your seat</p><h3 className="case-serif">Your detectives</h3></div><p role="status" aria-live="polite">{detectives.length} / {capacity} joined</p></div>
          <div className="lobby-seat-grid">
            {Array.from({ length: capacity }, (_, index) => {
              const player = detectives.find(detective => detective.seat_number === index + 1);
              return player ? <div className="lobby-seat" key={index}><DetectiveBadge name={player.name} seat={player.seat_number} /><div><strong>{player.name}</strong><span>Seat {player.seat_number} · Joined</span></div></div> : <div className="lobby-seat lobby-seat--empty" key={index}><span className="lobby-empty-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><strong>Open seat</strong><span>Waiting for a detective</span></div></div>;
            })}
          </div>
          <p className="lobby-small">{detectives.length === 0 ? "Your first detective will appear here after joining." : "Everyone here? The host can select Start game above."} Recommended: {caseData.meta.recommendedPlayers.min}–{capacity} detectives.</p>
          {observers.length ? <div className="lobby-observers"><p className="case-eyebrow">Following as observers</p><p>{observers.map(player => player.name).join(", ")}</p></div> : null}
        </div>
      </div>
    </div>
  );
}

function BriefScene({ caseData, detectives }: { caseData: Case; detectives: number }) {
  return <OpeningBriefing caseData={caseData} detectives={detectives} />;
}

function CaseBoardScene({ caseData, chapter, unlockedEvidence }: { caseData: Case; chapter: Chapter | null; unlockedEvidence: string[] }) {
  if (hasCrimeScene(caseData, chapter, unlockedEvidence) && chapter) return <CrimeSceneReveal caseData={caseData} chapter={chapter} />;
  const letter = getOpeningLetter(caseData, chapter, unlockedEvidence);
  if (letter && chapter) return <LetterReveal key={letter.id} caseData={caseData} evidence={letter} chapter={chapter} />;
  return <VisualCaseBoard caseData={caseData} chapter={chapter} />;
}

/**
 * Round 2 free-choice suspect picker. Lets the host (and the room) pick which
 * suspect to interview next. Tapping a card jumps to that suspect's chapter
 * via the existing scene/set route; the engine reloads that suspect's
 * transcript and unlock state from the DB so re-entry is lossless.
 */
function Round2InterviewPicker({
  sessionId,
  caseData,
  currentChapterId,
  onError,
}: {
  sessionId: string;
  caseData: Case;
  currentChapterId: string;
  onError: (msg: string | null) => void;
}) {
  const round2InterviewChapters = useMemo(
    () =>
      caseData.chapters.filter(
        (chapter): chapter is Extract<Chapter, { type: "interview" }> =>
          chapter.type === "interview" && chapter.roundNumber === 2,
      ),
    [caseData.chapters],
  );

  const suspectsById = useMemo(
    () => new Map(caseData.suspects.map((suspect) => [suspect.id, suspect])),
    [caseData.suspects],
  );

  const [busyChapterId, setBusyChapterId] = useState<string | null>(null);

  async function jumpTo(chapterId: string) {
    if (chapterId === currentChapterId || busyChapterId) return;
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
  }

  if (round2InterviewChapters.length === 0) return null;

  return (
    <details className="mb-6 rounded-3xl border border-white/10 bg-zinc-950/70 p-6" open={currentChapterId.startsWith("r2-") || undefined}><summary className="case-eyebrow">Interview a suspect</summary>
      <p className="text-sm uppercase tracking-[0.28em] text-[#c8a46a]">Choose who to question</p>
      <p className="mt-2 text-sm text-[#a6a29a]">
        Interview anyone in any order. Switch between suspects to follow leads as they emerge —
        each suspect remembers your conversation.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {round2InterviewChapters.map((chapter) => {
          const suspect = suspectsById.get(chapter.suspectId);
          if (!suspect) return null;
          const isCurrent = chapter.id === currentChapterId;
          const isBusy = busyChapterId === chapter.id;
          const portraitUrl = getCaseAssetUrl(caseData, suspect.portraitUrl);
          return (
            <button
              key={chapter.id}
              type="button"
              onClick={() => jumpTo(chapter.id)}
              disabled={isCurrent || busyChapterId !== null}
              className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed ${
                isCurrent
                  ? "border-[#c8a46a] bg-[#c8a46a]/15"
                  : "border-white/10 hover:border-[#c8a46a]/60 hover:bg-white/[0.03]"
              } ${busyChapterId !== null && !isCurrent ? "opacity-60" : ""}`}
            >
              <div className="flex items-start gap-4">
                {portraitUrl ? (
                  <Image
                    src={portraitUrl}
                    alt=""
                    width={72}
                    height={72}
                    className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover"
                    unoptimized
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-semibold">{suspect.name}</p>
                    {isCurrent ? (
                      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e6bd77]">
                        Current
                      </span>
                    ) : isBusy ? (
                      <span className="text-[10px] uppercase tracking-[0.22em] text-[#a6a29a]">
                        Loading…
                      </span>
                    ) : null}
                  </div>
                  {suspect.shortDescription ? (
                    <p className="mt-2 text-sm leading-6 text-[#cfc8ba]">
                      {suspect.shortDescription}
                    </p>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </details>
  );
}

function InterviewScene({
  sessionId,
  caseData,
  chapter,
  unlockedEvidence,
  interviewer,
}: {
  sessionId: string;
  caseData: Case;
  chapter: Chapter | null;
  unlockedEvidence: string[];
  interviewer: LobbyState["players"][number] | null;
}) {
  const suspect = chapter?.type === "interview" ? caseData.suspects.find((item) => item.id === chapter.suspectId) : null;
  const messages = useInterviewMessages(sessionId, suspect?.id ?? null);
  const [initialUnlocked] = useState<Set<string>>(() => new Set(unlockedEvidence));
  const newLockerIds = new Set(unlockedEvidence.filter(id=>!initialUnlocked.has(id)));
  const suspectPortraitUrl = getCaseAssetUrl(caseData, suspect?.portraitUrl);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0c0c]/85 p-6 shadow-2xl shadow-black/25">
      <ChapterBadge chapter={chapter} />
      <h2 className="mt-3 text-5xl font-semibold tracking-tight">{chapter?.title ?? "Live Interview"}</h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-[#c8a46a]/40 bg-[#c8a46a]/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#e6bd77]">
          Interviewer
        </span>
        <span className="text-lg font-semibold">
          {interviewer ? interviewer.name : "Awaiting interviewer..."}
        </span>
        {interviewer ? (
          <span className="text-xs uppercase tracking-[0.22em] text-[#a6a29a]">
            Seat {interviewer.seat_number}
          </span>
        ) : null}
        <span className="text-xs uppercase tracking-[0.22em] text-[#a6a29a]">
          Follow up freely within the interview time
        </span>
      </div>
      {suspect ? (
        <HostFallbackBanner sessionId={sessionId} suspectName={suspect.name} />
      ) : null}
      {suspect ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="interview-portrait-stage">
              {suspectPortraitUrl ? (
                <Image
                  src={suspectPortraitUrl}
                  alt=""
                  width={320}
                  height={320}
                  className="interview-large-portrait"
                  unoptimized
                />
              ) : null}
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#d4ad67]">Suspect</p>
                <h3 className="mt-3 text-4xl font-semibold">{suspect.name}</h3>
                <p className="mt-3 text-lg text-[#cfc8ba]">{suspect.shortDescription}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#d4ad67]">Interview Brief</p>
            <p className="mt-3 text-lg leading-8 text-[#f5f2ea]">
              {chapter?.type === "interview" && chapter.intro
                ? chapter.intro
                : "The interviewer may question this suspect from their phone controller."}
            </p>
          </div>
        </div>
      ) : null}

      {suspect && <div className="interview-exchanges"><p className="case-eyebrow">Latest exchange</p>{messages.filter(m=>m.role!=="system").slice(-2).map(m=><blockquote key={m.id}><small>{m.role==="user" ? interviewer?.name ?? "Detective" : suspect.name}</small><p>{m.content}</p></blockquote>)}{!messages.length && <p>The active detective can ask the first question from their phone.</p>}<details><summary>Earlier transcript ({Math.max(0,messages.length-2)} entries)</summary>{messages.slice(0,-2).map(m=><blockquote key={m.id}><small>{m.role==="user" ? "Detective" : m.role==="system" ? "Case update" : suspect.name}</small><p>{m.content}</p></blockquote>)}</details>{(() => { const id=messages.filter(m=>m.presented_evidence_id).at(-1)?.presented_evidence_id; const e=caseData.evidence.find(e=>e.id===id); return e ? <details><summary>Presented exhibit · {e.title}</summary><ExhibitDetail caseData={caseData} evidence={e}/></details> : null; })()}</div>}
      <EvidenceGallery caseData={caseData} focusIds={[...newLockerIds]} title="Interview evidence"/>

    </div>
  );
}

function useInterviewMessages(sessionId: string, suspectId: string | null) {
  return useInterviewTranscriptRealtime(sessionId, suspectId);
}

function HostFallbackBanner({
  sessionId,
  suspectName,
}: {
  sessionId: string;
  suspectName: string;
}) {
  const [revealing, setRevealing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { fallbacks, refresh } = useHostFallbackRealtime(sessionId, "current", 0);

  async function reveal(conditionId: string) {
    setRevealing(conditionId);
    setError(null);
    const response = await gameFetch(
      `/api/sessions/${sessionId}/interview/host-unlock`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditionId }),
      },
    );
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Could not reveal evidence.");
      setRevealing(null);
      return;
    }
    setRevealing(null);
    refresh();
  }

  if (fallbacks.length === 0 && !error) return null;

  return (
    <div className="mt-6 rounded-3xl border border-[#c8a46a]/40 bg-[#c8a46a]/10 p-6">
      <p className="text-sm uppercase tracking-[0.28em] text-[#e6bd77]">
        Host fallback
      </p>
      <p className="mt-2 text-base leading-7 text-[#cfc8ba]">
        The interviewer has been stuck on {suspectName} for several turns. You may
        choose to reveal a held-back artifact to keep the case moving.
      </p>
      {error ? (
        <p className="mt-3 rounded-2xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-100">
          {error}
        </p>
      ) : null}
      <div className="mt-4 grid gap-3">
        {fallbacks.map((fb) => (
          <div
            key={fb.conditionId}
            className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold">{fb.label}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-[#a6a29a]">
                {fb.attempts} turn{fb.attempts === 1 ? "" : "s"} without progress
              </p>
            </div>
            <button
              type="button"
              onClick={() => reveal(fb.conditionId)}
              disabled={revealing !== null}
              className="rounded-full bg-[#c8a46a] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-[#e6bd77] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {revealing === fb.conditionId ? "Revealing..." : "Reveal"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


function AccusationScene({
  caseData,
  chapter,
  lobby,
}: {
  caseData: Case;
  chapter: Chapter | null;
  lobby: LobbyState;
}) {
  const prompt =
    chapter?.type === "accusation"
      ? chapter.promptText ?? chapter.narration
      : "Who is responsible for the murder?";

  const tally = new Map<string, number>();
  for (const vote of lobby.accusationVotes) {
    tally.set(vote.suspect_id, (tally.get(vote.suspect_id) ?? 0) + 1);
  }
  const detectives = lobby.players.filter((player) => !player.is_observer);
  const totalVotes = lobby.accusationVotes.length;
  const leadingCount = Math.max(0, ...Array.from(tally.values()));

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/75 p-8 text-center">
      <ChapterBadge chapter={chapter} />
      <h2 className="mt-5 text-6xl font-semibold">Make Your Accusation</h2>
      <p className="mx-auto mt-6 max-w-4xl text-2xl leading-10 text-[#cfc8ba]">{prompt}</p>
      <p className="mt-5 text-sm uppercase tracking-[0.22em] text-[#a6a29a]">
        {totalVotes} of {detectives.length} detective{detectives.length === 1 ? "" : "s"} voted
      </p>
      <div className="visual-roster">{detectives.map(p=><span key={p.id}>{p.name} · {lobby.accusationVotes.some(v=>v.player_id===p.id) ? "Submitted" : "Choosing"}</span>)}</div><div className="mt-10 grid gap-3 md:grid-cols-3 portrait-ballots">
        {caseData.suspects.map((suspect) => {
          const count = tally.get(suspect.id) ?? 0;
          const isLeading = count > 0 && count === leadingCount;
          return (
            <div
              key={suspect.id}
              className={`rounded-2xl border p-4 text-left ${
                isLeading ? "border-[#c8a46a]/60 bg-[#c8a46a]/10" : "border-white/10"
              }`}
            >
              <CaseArtwork src={caseAsset(caseData,suspect.portraitUrl)} alt={suspect.name} portrait/><div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold">{suspect.name}</p>
                <span
                  className={`text-xs font-bold uppercase tracking-[0.22em] ${
                    isLeading ? "text-[#e6bd77]" : "text-[#a6a29a]"
                  }`}
                >
                  {count}
                </span>
              </div>
              {suspect.shortDescription ? (
                <p className="mt-1 text-sm text-[#a6a29a]">{suspect.shortDescription}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}



function HostDigitalCaseFile({ caseData }: {caseData:Case;unlocked:string[];currentChapter:Chapter|null;currentScene:SessionScene}) {
  return <details className="phone-interview-locker"><summary>Digital case file · {caseData.evidence.length} released exhibits</summary><EvidenceGallery caseData={caseData}/></details>;
}
