"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Case, Chapter, Evidence, Round, Suspect } from "@/engine/types";
import type { LobbyState } from "@/lib/session-store";
import { writeActivePlayerSession } from "@/lib/player-session";
import { getEvidencePrintableUrl } from "@/lib/printables";
import {
  useInterviewTranscriptRealtime,
  useSessionLobbyRealtime,
} from "@/lib/session-realtime";
import { useSpeechToText } from "@/lib/use-speech-to-text";
import {
  countQuestionsInCurrentStretch,
  getNextInterviewerName,
  getQuestionsPerDetective,
  listRotatingDetectives,
  questionsUntilRotation,
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
  phone_hack: "Phone hack",
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

export function PlayerLobbyView({ initialLobby, caseData, playerId }: PlayerLobbyViewProps) {
  const { lobby, error: realtimeError, applySnapshot } = useSessionLobbyRealtime(
    initialLobby.session.id,
    initialLobby,
  );
  const [localError, setLocalError] = useState<string | null>(null);
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
    <section className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
      <Header player={player} scene={lobby.session.current_scene} />

      {error ? (
        <p className="mt-5 rounded-2xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-100">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
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
          <PhoneHackMode chapter={chapter} />
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
          <RevealMode caseData={caseData} player={player} />
        ) : null}
      </div>

      {hasStarted && lobby.session.current_scene !== "case_board" ? (
        <DigitalCaseFile
          caseData={caseData}
          unlocked={lobby.session.unlocked_evidence}
          currentChapter={chapter}
        />
      ) : null}
    </section>
  );
}

function Header({ player, scene }: { player: PlayerRow; scene: SessionScene }) {
  const role = player.is_observer ? "Observer" : `Detective seat ${player.seat_number}`;

  return (
    <header>
      <p className="text-xs uppercase tracking-[0.28em] text-[#c8a46a]">{role}</p>
      <h1 className="mt-2 text-3xl font-semibold">{player.name}</h1>
      <p className="mt-1 text-sm uppercase tracking-[0.24em] text-[#a6a29a]">
        {sceneTitles[scene]}
      </p>
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
    <div>
      <p className="text-base leading-7 text-[#cfc8ba]">
        {player.is_observer
          ? "The lobby is full or the game has started — you'll follow along as an observer."
          : hasStarted
            ? "The host has started the game. Watch the TV for the briefing."
            : "Stay on this screen while the host starts the game on the TV."}
      </p>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Joined detectives</h2>
        <div className="mt-3 grid gap-2">
          {detectives.length === 0 ? (
            <p className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-[#a6a29a]">
              No detectives have joined yet.
            </p>
          ) : (
            detectives.map((detective) => (
              <div
                key={detective.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3"
              >
                <span>{detective.name}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-[#a6a29a]">
                  Seat {detective.seat_number}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BriefMode({ caseData, player }: { caseData: Case; player: PlayerRow }) {
  const openingRound = caseData.rounds[0];
  const openingBeats = openingRound?.introNarration ?? [];

  return (
    <div>
      <p className="text-sm uppercase tracking-[0.24em] text-[#a6a29a]">{caseData.meta.setting}</p>
      <h2 className="mt-2 text-2xl font-semibold">{caseData.meta.title}</h2>
      <p className="mt-4 text-base leading-7 text-[#cfc8ba]">{caseData.meta.tagline}</p>
      {openingBeats.length ? (
        <div className="mt-6 rounded-2xl border border-[#c8a46a]/25 bg-black/25 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#c8a46a]">Your assignment</p>
          <div className="mt-3 grid gap-3">
            {openingBeats.map((beat, index) => (
              <div key={`${beat.speaker ?? "brief"}-${index}`}>
                {beat.speaker ? (
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#a6a29a]">
                    {beat.speaker}
                  </p>
                ) : null}
                <p className="mt-1 text-sm leading-6 text-[#f5f2ea]">{beat.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <p className="mt-6 rounded-2xl border border-white/10 px-4 py-3 text-sm leading-6 text-[#cfc8ba]">
        {player.is_observer
          ? "Watch the TV for the opening narration. You're spectating this case."
          : "Watch the TV for the opening narration. You'll act when the host hands control to phones."}
      </p>
    </div>
  );
}

type EvidenceRoundGroup = { round: Round; items: Evidence[] };

function buildEvidenceByRound(caseData: Case, unlockedSet: Set<string>): EvidenceRoundGroup[] {
  return caseData.rounds
    .map((round) => ({
      round,
      items: caseData.evidence.filter(
        (e) => e.revealedInRound === round.number && unlockedSet.has(e.id),
      ),
    }))
    .filter(({ items }) => items.length > 0);
}

function EvidenceInspector({
  caseData,
  evidence,
  onClose,
  variant,
}: {
  caseData: Case;
  evidence: Evidence;
  onClose: () => void;
  variant: "embedded" | "sheet";
}) {
  const printableSrc = useMemo(
    () => getEvidencePrintableUrl(caseData.id, evidence),
    [caseData.id, evidence],
  );
  const [detailTab, setDetailTab] = useState<"notes" | "exhibit">(
    printableSrc ? "exhibit" : "notes",
  );

  useEffect(() => {
    if (variant !== "sheet") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [variant]);

  const showExhibit = Boolean(printableSrc && detailTab === "exhibit");
  const showNotes = !printableSrc || detailTab === "notes";

  const notesBlock = (
    <div>
      {printableSrc ? (
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#c8a46a]">Investigator notes</p>
      ) : null}
      <p className={`text-sm leading-7 text-[#f5f2ea] ${printableSrc ? "mt-2" : ""}`}>{evidence.loreText}</p>
      {evidence.relatesToSuspectIds?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {evidence.relatesToSuspectIds.map((suspectId) => {
            const suspect = caseData.suspects.find((item) => item.id === suspectId);
            return (
              <span
                key={suspectId}
                className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#a6a29a]"
              >
                {suspect?.name ?? suspectId}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  const exhibitBlock = printableSrc ? (
    <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#2a2520] shadow-inner">
      <iframe
        key={evidence.id}
        title={evidence.title}
        src={printableSrc}
        className="h-[min(52dvh,440px)] w-full border-0 sm:h-[min(58vh,520px)]"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  ) : null;

  const header = (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#c8a46a]">
          {printableSrc ? "Evidence" : "Case file"}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-[#f5f2ea]">{evidence.title}</h3>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[#e6bd77] transition hover:border-[#c8a46a]"
      >
        Close
      </button>
    </div>
  );

  const tabBar = printableSrc ? (
    <div className="flex gap-2 px-4 pt-3 sm:px-5">
      <button
        type="button"
        onClick={() => setDetailTab("notes")}
        className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
          detailTab === "notes"
            ? "bg-[#c8a46a] text-zinc-950"
            : "border border-white/10 text-[#cfc8ba] hover:border-[#c8a46a]/50"
        }`}
      >
        Notes
      </button>
      <button
        type="button"
        onClick={() => setDetailTab("exhibit")}
        className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
          detailTab === "exhibit"
            ? "bg-[#c8a46a] text-zinc-950"
            : "border border-white/10 text-[#cfc8ba] hover:border-[#c8a46a]/50"
        }`}
      >
        Prop sheet
      </button>
    </div>
  ) : null;

  const scrollBody = (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-3 sm:px-5">
      {showNotes ? notesBlock : null}
      {showExhibit ? exhibitBlock : null}
    </div>
  );

  if (variant === "sheet") {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
        <button
          type="button"
          className="absolute inset-0 bg-black/75 backdrop-blur-[1px]"
          onClick={onClose}
          aria-label="Close evidence"
        />
        <div className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-zinc-950 shadow-2xl sm:max-h-[85vh] sm:rounded-3xl">
          {header}
          {tabBar}
          {scrollBody}
        </div>
      </div>
    );
  }

  return (
    <article className="mt-5 flex max-h-[min(82dvh,720px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80">
      {header}
      {tabBar}
      {scrollBody}
    </article>
  );
}

function EvidenceRoundPicker({
  evidenceByRound,
  selectedId,
  onSelect,
  newIds,
  justUnlockedIds,
}: {
  evidenceByRound: EvidenceRoundGroup[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  newIds: Set<string>;
  justUnlockedIds: Set<string>;
}) {
  return (
    <div className="space-y-5">
      {evidenceByRound.map(({ round, items }) => (
        <section key={round.number}>
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#a6a29a]">
            Round {round.number} · {round.title}
          </p>
          <div className="mt-2 grid gap-2">
            {items.map((evidence) => {
              const isSelected = selectedId === evidence.id;
              const isNew = newIds.has(evidence.id) || justUnlockedIds.has(evidence.id);
              return (
                <button
                  key={evidence.id}
                  type="button"
                  onClick={() => onSelect(evidence.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-[#c8a46a] bg-[#c8a46a]/10"
                      : isNew
                        ? "border-[#c8a46a]/60 bg-[#c8a46a]/5"
                        : "border-white/10 hover:border-[#c8a46a]/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#a6a29a]">
                      {evidence.category}
                    </span>
                    {isNew ? (
                      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e6bd77]">
                        New
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#f5f2ea]">{evidence.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#cfc8ba]">{evidence.description}</p>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function CaseBoardTabs({
  caseData,
  chapter,
  unlocked,
}: {
  caseData: Case;
  chapter: Chapter | null;
  unlocked: string[];
}) {
  const [surfaceTab, setSurfaceTab] = useState<"brief" | "evidence">("brief");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initialUnlocked] = useState(() => new Set(unlocked));

  const unlockedSet = useMemo(() => new Set(unlocked), [unlocked]);
  const justUnlockedIds = useMemo(() => {
    if (chapter?.type !== "evidence-reveal") return new Set<string>();
    return new Set(chapter.evidenceIds.filter((id) => unlockedSet.has(id)));
  }, [chapter, unlockedSet]);
  const newIds = useMemo(
    () => new Set(unlocked.filter((id) => !initialUnlocked.has(id))),
    [unlocked, initialUnlocked],
  );
  const evidenceByRound = useMemo(
    () => buildEvidenceByRound(caseData, unlockedSet),
    [caseData, unlockedSet],
  );

  const selectedEvidence = selectedId
    ? (caseData.evidence.find((e) => e.id === selectedId) ?? null)
    : null;

  return (
    <div>
      <div className="mb-5 flex gap-2 rounded-2xl border border-white/10 bg-black/25 p-1">
        <button
          type="button"
          onClick={() => {
            setSelectedId(null);
            setSurfaceTab("brief");
          }}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition ${
            surfaceTab === "brief"
              ? "bg-[#c8a46a] text-zinc-950"
              : "text-[#a6a29a] hover:text-[#f5f2ea]"
          }`}
        >
          Brief
        </button>
        <button
          type="button"
          onClick={() => setSurfaceTab("evidence")}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition ${
            surfaceTab === "evidence"
              ? "bg-[#c8a46a] text-zinc-950"
              : "text-[#a6a29a] hover:text-[#f5f2ea]"
          }`}
        >
          <span className="inline-flex items-center justify-center gap-2">
            Evidence
            {newIds.size > 0 ? (
              <span className="rounded-full bg-zinc-950/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c8a46a]">
                {newIds.size} new
              </span>
            ) : null}
          </span>
        </button>
      </div>

      {surfaceTab === "brief" ? (
        <div>
          {chapter ? (
            <p className="text-xs uppercase tracking-[0.22em] text-[#c8a46a]">
              Round {chapter.roundNumber} · {chapter.type.replace("-", " ")}
            </p>
          ) : null}
          <h2 className="mt-2 text-2xl font-semibold">{chapter?.title ?? "Case board"}</h2>
          {chapter?.type === "narrative" ? (
            <div className="mt-4 grid gap-3">
              {chapter.beats.map((beat, index) => (
                <div key={`${beat.speaker ?? "beat"}-${index}`} className="border-l border-[#c8a46a]/35 pl-3">
                  {beat.speaker ? (
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#a6a29a]">
                      {beat.speaker}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm leading-6 text-[#f5f2ea]">{beat.text}</p>
                </div>
              ))}
            </div>
          ) : null}
          {chapter?.type === "evidence-reveal" ? (
            <p className="mt-4 rounded-2xl border border-[#c8a46a]/25 bg-black/20 px-4 py-3 text-sm leading-6 text-[#f5f2ea]">
              {chapter.narration}
            </p>
          ) : null}
          <p className="mt-3 text-sm text-[#cfc8ba]">
            Follow the TV. When something unlocks, open the <span className="text-[#e6bd77]">Evidence</span>{" "}
            tab — tap an item to read notes and view the prop sheet one step at a time.
          </p>
        </div>
      ) : (
        <div className="relative">
          {unlocked.length === 0 ? (
            <p className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-[#a6a29a]">
              No evidence unlocked yet. Stay on Brief until the host advances.
            </p>
          ) : (
            <EvidenceRoundPicker
              evidenceByRound={evidenceByRound}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
              newIds={newIds}
              justUnlockedIds={justUnlockedIds}
            />
          )}
          {selectedEvidence ? (
            <EvidenceInspector
              key={selectedEvidence.id}
              variant="sheet"
              caseData={caseData}
              evidence={selectedEvidence}
              onClose={() => setSelectedId(null)}
            />
          ) : null}
        </div>
      )}
    </div>
  );
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
  const questionsPerDetective = getQuestionsPerDetective(caseData);
  const detectiveCount = listRotatingDetectives(players).length;
  const questionsInStretch = useMemo(() => {
    if (!suspect || !session.current_interviewer_player_id) {
      return 0;
    }
    return countQuestionsInCurrentStretch(
      transcript.messages,
      suspect.id,
      session.current_interviewer_player_id,
    );
  }, [transcript.messages, suspect, session.current_interviewer_player_id]);
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
    questionsUntilRotation(questionsInStretch, questionsPerDetective) === 1;

  async function claimInterviewer(targetPlayerId: string | null) {
    setIsClaiming(true);
    onError(null);

    const response = await fetch(`/api/sessions/${session.id}/interviewer`, {
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

    const response = await fetch(`/api/sessions/${session.id}/interview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: player.id,
        question: trimmed,
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
        <InterviewEvidencePanel caseData={caseData} unlocked={unlocked} />
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
            ? "Another detective is leading the interview. Watch the TV — you'll get a turn next."
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
        <InterviewEvidencePanel caseData={caseData} unlocked={unlocked} />
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

      <InterviewEvidencePanel caseData={caseData} unlocked={unlocked} />

      {showNextRotationCue ? (
        <p className="mt-5 rounded-2xl border border-[#c8a46a]/40 bg-[#c8a46a]/10 px-4 py-3 text-sm text-[#e6bd77]">
          Next: {nextInterviewerName}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        <label className="block text-xs uppercase tracking-[0.22em] text-[#a6a29a]">
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
        disabled={isAsking || !question.trim() || !suspect}
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
        onClick={() => claimInterviewer(null)}
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
    const response = await fetch(`/api/sessions/${sessionId}/scene`, {
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
  if (messages.length === 0) {
    return (
      <p className="mt-5 rounded-2xl border border-white/10 px-4 py-3 text-xs leading-6 text-[#a6a29a]">
        No questions asked yet.
      </p>
    );
  }

  return (
    <div className="mt-5 max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-4">
      {messages.map((message) => {
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

function PhoneHackMode({ chapter }: { chapter: Chapter | null }) {
  if (!chapter || chapter.type !== "phone-hack") {
    return (
      <div>
        <h2 className="text-2xl font-semibold">Phone hack</h2>
        <p className="mt-3 text-sm text-[#cfc8ba]">Watch the TV for instructions.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-[#c8a46a]">
        Round {chapter.roundNumber} · phone hack
      </p>
      <h2 className="mt-2 text-2xl font-semibold">{chapter.title}</h2>
      <p className="mt-3 text-sm text-[#cfc8ba]">
        Device owner: <span className="font-semibold">{chapter.phoneOwner}</span>
      </p>
      {chapter.intro ? (
        <p className="mt-4 rounded-2xl border border-white/10 px-4 py-3 text-sm leading-6 text-[#cfc8ba]">
          {chapter.intro}
        </p>
      ) : null}
      <button
        type="button"
        disabled
        className="mt-6 w-full rounded-full bg-white/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#a6a29a]"
      >
        Open hack minigame (Phase 5)
      </button>
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

    const response = await fetch(`/api/sessions/${lobby.session.id}/accusation`, {
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
              onClick={() => vote(suspect.id)}
              disabled={submittingId !== null}
              className={`rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
                selected
                  ? "border-[#c8a46a] bg-[#c8a46a]/10 text-[#f5f2ea]"
                  : "border-white/15 hover:border-[#c8a46a]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
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

function RevealMode({ caseData, player }: { caseData: Case; player: PlayerRow }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-[#c8a46a]">The truth</p>
      <h2 className="mt-2 text-2xl font-semibold">{caseData.meta.title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#cfc8ba]">
        {player.is_observer
          ? "Watch the TV for the full reveal."
          : "Great work, detective. Watch the TV for the full reveal."}
      </p>
      <div className="mt-5 grid gap-2">
        {caseData.solution.killerSuspectIds.map((suspectId) => {
          const suspect = caseData.suspects.find((item) => item.id === suspectId);
          return (
            <div
              key={suspectId}
              className="rounded-2xl border border-[#c8a46a]/30 bg-[#c8a46a]/10 p-4"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-[#c8a46a]">
                {caseData.solution.killerRoles?.[suspectId] ?? "Responsible"}
              </p>
              <p className="mt-1 text-lg font-semibold">{suspect?.name ?? suspectId}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DigitalCaseFile({
  caseData,
  unlocked,
  currentChapter,
}: {
  caseData: Case;
  unlocked: string[];
  currentChapter: Chapter | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initialUnlocked] = useState<Set<string>>(() => new Set(unlocked));
  const unlockedSet = useMemo(() => new Set(unlocked), [unlocked]);
  const justUnlockedIds = useMemo(() => {
    if (currentChapter?.type !== "evidence-reveal") return new Set<string>();
    return new Set(currentChapter.evidenceIds.filter((id) => unlockedSet.has(id)));
  }, [currentChapter, unlockedSet]);
  const newIds = useMemo(
    () => new Set(unlocked.filter((id) => !initialUnlocked.has(id))),
    [unlocked, initialUnlocked],
  );
  const selectedEvidence = selectedId
    ? (caseData.evidence.find((evidence) => evidence.id === selectedId) ?? null)
    : null;

  const evidenceByRound = useMemo(
    () => buildEvidenceByRound(caseData, unlockedSet),
    [caseData, unlockedSet],
  );

  return (
    <aside className="mt-8 rounded-3xl border border-[#c8a46a]/25 bg-black/25">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span>
          <span className="block text-xs uppercase tracking-[0.24em] text-[#c8a46a]">
            Digital case file
          </span>
          <span className="mt-1 block text-sm text-[#cfc8ba]">
            {unlocked.length} unlocked evidence item{unlocked.length === 1 ? "" : "s"}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {newIds.size > 0 ? (
            <span className="rounded-full bg-[#c8a46a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-950">
              {newIds.size} new
            </span>
          ) : null}
          <span className="text-sm text-[#a6a29a]">{expanded ? "Hide" : "Open"}</span>
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-white/10 p-4">
          {unlocked.length === 0 ? (
            <p className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-[#a6a29a]">
              Evidence will appear here as soon as the host or an interview unlocks it.
            </p>
          ) : (
            <EvidenceRoundPicker
              evidenceByRound={evidenceByRound}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
              newIds={newIds}
              justUnlockedIds={justUnlockedIds}
            />
          )}

          {selectedEvidence ? (
            <EvidenceInspector
              key={selectedEvidence.id}
              variant="embedded"
              caseData={caseData}
              evidence={selectedEvidence}
              onClose={() => setSelectedId(null)}
            />
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}

/**
 * Collapsible list of evidence in the player's locker, surfaced inside an
 * interview view so the interviewer doesn't have to leave the conversation
 * to consult what they have. Tracks "newly arrived during this interview"
 * via a ref on mount and badges those rows.
 */
function InterviewEvidencePanel({
  caseData,
  unlocked,
}: {
  caseData: Case;
  unlocked: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  // Snapshot the unlocked set at the moment this panel mounts; anything that
  // unlocks later in this interview counts as "new." useState initializer
  // captures mount-time data without triggering re-renders.
  const [initialUnlocked] = useState<Set<string>>(() => new Set(unlocked));

  const unlockedSet = useMemo(() => new Set(unlocked), [unlocked]);
  const items = useMemo(
    () => caseData.evidence.filter((evidence) => unlockedSet.has(evidence.id)),
    [caseData.evidence, unlockedSet],
  );
  const newIds = useMemo(
    () => new Set(unlocked.filter((id) => !initialUnlocked.has(id))),
    [unlocked, initialUnlocked],
  );

  if (items.length === 0 && newIds.size === 0) {
    return null;
  }

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-xs uppercase tracking-[0.22em] text-[#c8a46a]">
          Evidence locker
        </span>
        <span className="flex items-center gap-2">
          {newIds.size > 0 ? (
            <span className="rounded-full bg-[#c8a46a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-950">
              {newIds.size} new
            </span>
          ) : null}
          <span className="text-xs text-[#a6a29a]">
            {items.length} item{items.length === 1 ? "" : "s"} {expanded ? "▾" : "▸"}
          </span>
        </span>
      </button>
      {expanded ? (
        <div className="grid gap-2 border-t border-white/10 p-3">
          {items.map((evidence) => {
            const isNew = newIds.has(evidence.id);
            return (
              <div
                key={evidence.id}
                className={`rounded-2xl border px-4 py-3 ${
                  isNew ? "border-[#c8a46a]/60 bg-[#c8a46a]/10" : "border-white/10"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#a6a29a]">
                    {evidence.category}
                  </p>
                  {isNew ? (
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e6bd77]">
                      New
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-base font-semibold">{evidence.title}</p>
                <p className="mt-1 text-sm leading-6 text-[#cfc8ba]">{evidence.description}</p>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
