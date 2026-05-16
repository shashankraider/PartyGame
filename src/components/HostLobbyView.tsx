"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { Case, Chapter } from "@/engine/types";
import type { LobbyState } from "@/lib/session-store";
import type { MessageRow, SessionScene } from "@/lib/supabase";

type HostLobbyViewProps = {
  initialLobby: LobbyState;
  caseData: Case;
  qrCode: string;
  joinUrl: string;
};

type LobbyResponse = LobbyState & {
  error?: string;
};

const sceneLabels: Record<SessionScene, string> = {
  lobby: "Lobby",
  brief: "Cinematic Brief",
  case_board: "Case Board",
  interview: "Live Interview",
  phone_hack: "Phone Hack",
  accusation: "Accusation",
  reveal: "Reveal",
};

function getCurrentChapter(caseData: Case, chapterId: string | null) {
  return caseData.chapters.find((chapter) => chapter.id === chapterId) ?? null;
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

export function HostLobbyView({ initialLobby, caseData, qrCode, joinUrl }: HostLobbyViewProps) {
  const [lobby, setLobby] = useState(initialLobby);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/sessions/${initialLobby.session.id}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as LobbyResponse;

      if (!response.ok || payload.error) {
        setError(payload.error ?? "Could not refresh lobby.");
        return;
      }

      setLobby(payload);
      setError(null);
    }, 2500);

    return () => window.clearInterval(interval);
  }, [initialLobby.session.id]);

  async function startGame() {
    setIsStarting(true);
    setError(null);

    const response = await fetch(`/api/sessions/${lobby.session.id}/start`, {
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

    setLobby((current) => ({ ...current, session: payload.session! }));
    setIsStarting(false);
  }

  async function changeScene(action: "next" | "previous") {
    setIsAdvancing(true);
    setError(null);

    const response = await fetch(`/api/sessions/${lobby.session.id}/scene`, {
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
      setError(payload.error ?? "Could not change scene.");
      setIsAdvancing(false);
      return;
    }

    setLobby((current) => ({ ...current, session: payload.session! }));
    setIsAdvancing(false);
  }

  const detectives = lobby.players.filter((player) => !player.is_observer);
  const observers = lobby.players.filter((player) => player.is_observer);
  const hasStarted = lobby.session.status !== "lobby";
  const currentChapter = getCurrentChapter(caseData, lobby.session.current_chapter_id);
  const currentChapterIndex = currentChapter
    ? caseData.chapters.findIndex((chapter) => chapter.id === currentChapter.id)
    : -1;
  const hasPrevious = currentChapterIndex > 0;
  const hasNext = currentChapterIndex !== -1 && currentChapterIndex < caseData.chapters.length - 1;

  return (
    <section className="py-10">
      <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#a6a29a]">Current TV scene</p>
          <p className="mt-1 text-xl font-semibold">{sceneLabels[lobby.session.current_scene]}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startGame}
            disabled={isStarting || hasStarted}
            className="rounded-full bg-[#c8a46a] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-[#e6bd77] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {hasStarted ? "Started" : isStarting ? "Starting..." : "Start game"}
          </button>
          <button
            type="button"
            onClick={() => changeScene("previous")}
            disabled={isAdvancing || !hasStarted || !hasPrevious}
            className="rounded-full border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] transition hover:border-[#c8a46a] hover:text-[#e6bd77] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => changeScene("next")}
            disabled={isAdvancing || !hasStarted || !hasNext}
            className="rounded-full border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] transition hover:border-[#c8a46a] hover:text-[#e6bd77] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAdvancing ? "Moving..." : "Next"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mb-5 rounded-2xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-100">
          {error}
        </p>
      ) : null}

      {lobby.session.current_scene === "lobby" ? (
        <LobbyScene
          lobby={lobby}
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
        <CaseBoardScene caseData={caseData} chapter={currentChapter} unlockedEvidence={lobby.session.unlocked_evidence} />
      ) : null}
      {lobby.session.current_scene === "interview" ? (
        <InterviewScene
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
      ) : null}
      {lobby.session.current_scene === "phone_hack" ? (
        <PhoneHackScene chapter={currentChapter} />
      ) : null}
      {lobby.session.current_scene === "accusation" ? (
        <AccusationScene
          caseData={caseData}
          chapter={currentChapter}
          lobby={lobby}
        />
      ) : null}
      {lobby.session.current_scene === "reveal" ? (
        <RevealScene caseData={caseData} chapter={currentChapter} />
      ) : null}
    </section>
  );
}

function LobbyScene({
  lobby,
  qrCode,
  joinUrl,
  detectives,
  observers,
}: {
  lobby: LobbyState;
  qrCode: string;
  joinUrl: string;
  detectives: LobbyState["players"];
  observers: LobbyState["players"];
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 text-center">
        <p className="text-sm uppercase tracking-[0.28em] text-[#c8a46a]">Join Code</p>
        <p className="mt-3 text-7xl font-black tracking-[0.18em]">{lobby.session.join_code}</p>
        <Image
          src={qrCode}
          alt={`QR code for ${joinUrl}`}
          className="mx-auto mt-6 rounded-2xl bg-white p-3"
          width={280}
          height={280}
          unoptimized
        />
        <p className="mt-5 break-all text-sm text-[#a6a29a]">{joinUrl}</p>
      </aside>

      <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
        <p className="text-sm uppercase tracking-[0.28em] text-[#c8a46a]">Lobby</p>
        <h2 className="mt-2 text-3xl font-semibold">Waiting for detectives</h2>
        <div className="mt-8 grid gap-3">
          {detectives.length === 0 ? (
            <p className="rounded-2xl border border-white/10 px-4 py-5 text-[#a6a29a]">
              No detectives have joined yet.
            </p>
          ) : (
            detectives.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-4"
              >
                <span className="text-lg font-semibold">{player.name}</span>
                <span className="text-sm uppercase tracking-[0.2em] text-[#a6a29a]">
                  Seat {player.seat_number}
                </span>
              </div>
            ))
          )}
        </div>

        {observers.length ? (
          <p className="mt-5 text-sm text-[#a6a29a]">
            Observers: {observers.map((player) => player.name).join(", ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function BriefScene({ caseData, detectives }: { caseData: Case; detectives: number }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-8 shadow-2xl shadow-black/30">
      <p className="text-sm uppercase tracking-[0.35em] text-[#c8a46a]">{caseData.meta.setting}</p>
      <h2 className="mt-5 text-6xl font-semibold tracking-tight">{caseData.meta.title}</h2>
      <p className="mt-6 max-w-4xl text-2xl leading-10 text-[#cfc8ba]">{caseData.meta.tagline}</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <InfoCard label="Victim" value={caseData.victim.name} />
        <InfoCard label="Detectives Joined" value={String(detectives)} />
        <InfoCard label="Opening Round" value={caseData.rounds[0]?.title ?? "Round 1"} />
      </div>
    </div>
  );
}

function CaseBoardScene({
  caseData,
  chapter,
  unlockedEvidence,
}: {
  caseData: Case;
  chapter: Chapter | null;
  unlockedEvidence: string[];
}) {
  const unlockedSet = new Set(unlockedEvidence);
  const justUnlockedIds =
    chapter?.type === "evidence-reveal" ? new Set(chapter.evidenceIds) : new Set<string>();

  const evidenceByRound = caseData.rounds
    .map((round) => ({
      round,
      items: caseData.evidence.filter(
        (evidence) => evidence.revealedInRound === round.number && unlockedSet.has(evidence.id),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <article className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6">
        <ChapterBadge chapter={chapter} />
        <h2 className="mt-3 text-4xl font-semibold">{chapter?.title ?? "Case Board"}</h2>
        {chapter?.type === "narrative" ? (
          <div className="mt-6 grid gap-4">
            {chapter.beats.map((beat, index) => (
              <blockquote key={`${beat.speaker ?? "beat"}-${index}`} className="rounded-2xl border border-white/10 p-4">
                {beat.speaker ? (
                  <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#c8a46a]">{beat.speaker}</p>
                ) : null}
                <p className="text-lg leading-8 text-[#f5f2ea]">{beat.text}</p>
              </blockquote>
            ))}
          </div>
        ) : null}
        {chapter?.type === "evidence-reveal" && chapter.narration ? (
          <p className="mt-5 text-xl leading-9 text-[#cfc8ba]">{chapter.narration}</p>
        ) : null}
      </article>

      <aside className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6">
        <p className="text-sm uppercase tracking-[0.28em] text-[#c8a46a]">Evidence Locker</p>
        {evidenceByRound.length === 0 ? (
          <p className="mt-5 text-[#a6a29a]">Evidence will appear here as chapters unlock it.</p>
        ) : (
          <div className="mt-5 grid gap-5">
            {evidenceByRound.map(({ round, items }) => (
              <div key={round.number}>
                <p className="text-xs uppercase tracking-[0.22em] text-[#a6a29a]">
                  Round {round.number} · {round.title}
                </p>
                <div className="mt-2 grid gap-3">
                  {items.map((evidence) => {
                    const isFresh = justUnlockedIds.has(evidence.id);
                    return (
                      <div
                        key={evidence.id}
                        className={`rounded-2xl border p-4 ${
                          isFresh
                            ? "border-[#c8a46a]/60 bg-[#c8a46a]/10"
                            : "border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-[#a6a29a]">
                            {evidence.category}
                          </p>
                          {isFresh ? (
                            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e6bd77]">
                              New
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-2 text-lg font-semibold">{evidence.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#cfc8ba]">
                          {evidence.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
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
  const unlockedSet = useMemo(() => new Set(unlockedEvidence), [unlockedEvidence]);
  const lockerItems = useMemo(
    () => caseData.evidence.filter((evidence) => unlockedSet.has(evidence.id)),
    [caseData.evidence, unlockedSet],
  );
  const newLockerIds = useMemo(
    () => new Set(unlockedEvidence.filter((id) => !initialUnlocked.has(id))),
    [unlockedEvidence, initialUnlocked],
  );

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/75 p-8">
      <ChapterBadge chapter={chapter} />
      <h2 className="mt-3 text-5xl font-semibold">{chapter?.title ?? "Live Interview"}</h2>
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
      </div>
      {suspect ? (
        <HostFallbackBanner sessionId={sessionId} suspectName={suspect.name} />
      ) : null}
      {suspect ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 p-6">
            <p className="text-sm uppercase tracking-[0.28em] text-[#c8a46a]">Suspect</p>
            <h3 className="mt-3 text-4xl font-semibold">{suspect.name}</h3>
            <p className="mt-3 text-lg text-[#cfc8ba]">{suspect.shortDescription}</p>
          </div>
          <div className="rounded-3xl border border-white/10 p-6">
            <p className="text-sm uppercase tracking-[0.28em] text-[#c8a46a]">Interview Brief</p>
            <p className="mt-4 text-xl leading-9 text-[#f5f2ea]">
              {chapter?.type === "interview" && chapter.intro
                ? chapter.intro
                : "The interviewer may question this suspect from their phone controller."}
            </p>
          </div>
        </div>
      ) : null}

      {suspect ? (
        <div className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-6">
          <p className="text-sm uppercase tracking-[0.28em] text-[#c8a46a]">Transcript</p>
          {messages.length === 0 ? (
            <p className="mt-4 text-lg text-[#a6a29a]">
              The interviewer has not asked anything yet.
            </p>
          ) : (
            <div className="mt-4 max-h-[28rem] space-y-4 overflow-y-auto pr-2">
              {messages.map((message) => {
                if (message.role === "system") {
                  return (
                    <div
                      key={message.id}
                      className="my-2 flex items-center gap-4 text-xs uppercase tracking-[0.28em] text-[#c8a46a]"
                    >
                      <span className="h-px flex-1 bg-[#c8a46a]/30" />
                      <span>{message.content}</span>
                      <span className="h-px flex-1 bg-[#c8a46a]/30" />
                    </div>
                  );
                }
                return (
                  <div key={message.id}>
                    <p className="text-xs uppercase tracking-[0.22em] text-[#a6a29a]">
                      {message.role === "user"
                        ? interviewer
                          ? `${interviewer.name} (interviewer)`
                          : "Interviewer"
                        : suspect.name}
                    </p>
                    <p className="mt-1 text-xl leading-9 text-[#f5f2ea]">{message.content}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {suspect && lockerItems.length > 0 ? (
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm uppercase tracking-[0.28em] text-[#c8a46a]">Evidence locker</p>
            {newLockerIds.size > 0 ? (
              <span className="rounded-full bg-[#c8a46a] px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-zinc-950">
                {newLockerIds.size} new
              </span>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lockerItems.map((evidence) => {
              const isNew = newLockerIds.has(evidence.id);
              return (
                <div
                  key={evidence.id}
                  className={`rounded-2xl border p-4 ${
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
                  <h3 className="mt-2 text-lg font-semibold">{evidence.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#cfc8ba]">{evidence.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function useInterviewMessages(sessionId: string, suspectId: string | null) {
  const [messagesBySuspect, setMessagesBySuspect] = useState<Record<string, MessageRow[]>>({});

  useEffect(() => {
    if (!suspectId) return;

    let cancelled = false;

    async function load() {
      const response = await fetch(
        `/api/sessions/${sessionId}/interview?suspectId=${encodeURIComponent(suspectId!)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json().catch(() => ({}))) as { messages?: MessageRow[] };
      if (!cancelled && response.ok && payload.messages) {
        setMessagesBySuspect((prev) => ({ ...prev, [suspectId!]: payload.messages! }));
      }
    }

    load();
    const interval = window.setInterval(load, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [sessionId, suspectId]);

  return suspectId ? messagesBySuspect[suspectId] ?? [] : [];
}

type HostFallback = {
  conditionId: string;
  subject: "secret" | "breaking-point" | "evidence";
  label: string;
  attempts: number;
  maxAdjacency: number;
  evidenceId?: string;
};

function HostFallbackBanner({
  sessionId,
  suspectName,
}: {
  sessionId: string;
  suspectName: string;
}) {
  const [fallbacks, setFallbacks] = useState<HostFallback[]>([]);
  const [revealing, setRevealing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await fetch(
        `/api/sessions/${sessionId}/interview/host-unlock`,
        { cache: "no-store" },
      );
      if (cancelled) return;
      if (response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          fallbacks?: HostFallback[];
        };
        setFallbacks(payload.fallbacks ?? []);
      }
    }

    load();
    const interval = window.setInterval(load, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [sessionId, bump]);

  async function reveal(conditionId: string) {
    setRevealing(conditionId);
    setError(null);
    const response = await fetch(
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
    setBump((value) => value + 1);
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

function PhoneHackScene({ chapter }: { chapter: Chapter | null }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/75 p-8">
      <ChapterBadge chapter={chapter} />
      <h2 className="mt-3 text-5xl font-semibold">{chapter?.title ?? "Phone Hack"}</h2>
      {chapter?.type === "phone-hack" ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <InfoCard label="Device Owner" value={chapter.phoneOwner} />
          <InfoCard label="Messages" value={String(chapter.messages?.length ?? 0)} />
          <InfoCard label="Key Clues" value={String(chapter.keyClueIds?.length ?? 0)} />
        </div>
      ) : null}
      {chapter?.type === "phone-hack" && chapter.intro ? (
        <p className="mt-6 text-xl leading-9 text-[#cfc8ba]">{chapter.intro}</p>
      ) : null}
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
      <div className="mt-10 grid gap-3 md:grid-cols-3">
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
              <div className="flex items-center justify-between gap-3">
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

function RevealScene({ caseData, chapter }: { caseData: Case; chapter: Chapter | null }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/75 p-8">
      <ChapterBadge chapter={chapter} />
      <h2 className="mt-3 text-6xl font-semibold">The Truth</h2>
      <div className="mt-6 grid max-w-5xl gap-4">
        {caseData.solution.revealNarration.map((beat, index) => (
          <blockquote key={`${beat.speaker ?? "reveal"}-${index}`} className="rounded-2xl border border-white/10 p-4">
            {beat.speaker ? (
              <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#c8a46a]">{beat.speaker}</p>
            ) : null}
            <p className="text-2xl leading-10 text-[#cfc8ba]">{beat.text}</p>
          </blockquote>
        ))}
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {caseData.solution.killerSuspectIds.map((suspectId) => {
          const suspect = caseData.suspects.find((item) => item.id === suspectId);
          return (
            <div key={suspectId} className="rounded-2xl border border-[#c8a46a]/30 bg-[#c8a46a]/10 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[#c8a46a]">
                {caseData.solution.killerRoles?.[suspectId] ?? "Responsible"}
              </p>
              <h3 className="mt-2 text-2xl font-semibold">{suspect?.name ?? suspectId}</h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-[#a6a29a]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
