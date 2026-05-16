"use client";

import { useEffect, useMemo, useState } from "react";
import type { Case, Chapter, Evidence, Suspect } from "@/engine/types";
import type { LobbyState } from "@/lib/session-store";
import type { MessageRow, PlayerRow, SessionRow, SessionScene } from "@/lib/supabase";

type PlayerLobbyViewProps = {
  initialLobby: LobbyState;
  caseData: Case;
  playerId: string;
};

type LobbyResponse = LobbyState & {
  error?: string;
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
  const [lobby, setLobby] = useState(initialLobby);
  const [error, setError] = useState<string | null>(null);

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

  const player = lobby.players.find((item) => item.id === playerId);
  const detectives = useMemo(
    () => lobby.players.filter((item) => !item.is_observer),
    [lobby.players],
  );
  const chapter = useMemo(
    () => getCurrentChapter(caseData, lobby.session.current_chapter_id),
    [caseData, lobby.session.current_chapter_id],
  );

  if (!player) {
    return (
      <div className="rounded-3xl border border-red-400/30 bg-red-950/30 p-6 text-red-100">
        This player is no longer in the lobby.
      </div>
    );
  }

  const updateSession = (next: SessionRow) =>
    setLobby((current) => ({ ...current, session: next }));

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
          <CaseBoardMode
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
  return (
    <div>
      <p className="text-sm uppercase tracking-[0.24em] text-[#a6a29a]">{caseData.meta.setting}</p>
      <h2 className="mt-2 text-2xl font-semibold">{caseData.meta.title}</h2>
      <p className="mt-4 text-base leading-7 text-[#cfc8ba]">{caseData.meta.tagline}</p>
      <p className="mt-6 rounded-2xl border border-white/10 px-4 py-3 text-sm leading-6 text-[#cfc8ba]">
        {player.is_observer
          ? "Watch the TV for the opening narration. You're spectating this case."
          : "Watch the TV for the opening narration. You'll act when the host hands control to phones."}
      </p>
    </div>
  );
}

function CaseBoardMode({
  caseData,
  chapter,
  unlocked,
}: {
  caseData: Case;
  chapter: Chapter | null;
  unlocked: string[];
}) {
  const unlockedSet = new Set(unlocked);
  const items = caseData.evidence.filter((evidence) => unlockedSet.has(evidence.id));

  return (
    <div>
      {chapter ? (
        <p className="text-xs uppercase tracking-[0.22em] text-[#c8a46a]">
          Round {chapter.roundNumber} · {chapter.type.replace("-", " ")}
        </p>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold">{chapter?.title ?? "Case board"}</h2>
      <p className="mt-3 text-sm text-[#cfc8ba]">
        Follow the TV. New evidence unlocks for review here when the host advances.
      </p>

      <div className="mt-6">
        <h3 className="text-sm uppercase tracking-[0.22em] text-[#a6a29a]">Evidence locker</h3>
        <div className="mt-3 grid gap-2">
          {items.length === 0 ? (
            <p className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-[#a6a29a]">
              No evidence unlocked yet.
            </p>
          ) : (
            items.map((evidence) => <EvidenceCard key={evidence.id} evidence={evidence} />)
          )}
        </div>
      </div>
    </div>
  );
}

function InterviewMode({
  caseData,
  chapter,
  session,
  player,
  unlocked,
  onSession,
  onError,
}: {
  caseData: Case;
  chapter: Chapter | null;
  session: SessionRow;
  player: PlayerRow;
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
  const [isClaiming, setIsClaiming] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const transcript = useTranscript(session.id, suspect?.id ?? null);

  const isInterviewer = session.current_interviewer_player_id === player.id;

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
      error?: string;
    };

    if (!response.ok || !payload.assistantMessage) {
      onError(payload.error ?? "The suspect did not respond.");
      setIsAsking(false);
      return;
    }

    setQuestion("");
    setSelectedEvidence(null);
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
          <p className="mt-1 text-sm uppercase tracking-[0.22em] text-[#a6a29a]">{suspect.name}</p>
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
          <p className="text-xs uppercase tracking-[0.22em] text-[#c8a46a]">Questioning</p>
          <p className="mt-1 text-lg font-semibold">{suspect.name}</p>
          {suspect.shortDescription ? (
            <p className="mt-1 text-sm text-[#cfc8ba]">{suspect.shortDescription}</p>
          ) : null}
        </div>
      ) : null}

      <Transcript messages={transcript.messages} suspectName={suspect?.name ?? null} />

      <InterviewEvidencePanel caseData={caseData} unlocked={unlocked} />

      <label className="mt-6 block text-xs uppercase tracking-[0.22em] text-[#a6a29a]">
        Your next question
      </label>
      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        rows={3}
        placeholder="Where were you between 8 and 10 last night?"
        disabled={isAsking}
        className="mt-2 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-base leading-6 outline-none focus:border-[#c8a46a] disabled:opacity-60"
      />

      {presentable.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.22em] text-[#a6a29a]">Present evidence</p>
          <div className="mt-2 grid gap-2">
            <button
              type="button"
              onClick={() => setSelectedEvidence(null)}
              disabled={isAsking}
              className={`rounded-2xl border px-4 py-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                selectedEvidence === null
                  ? "border-[#c8a46a] text-[#e6bd77]"
                  : "border-white/15 text-[#cfc8ba]"
              }`}
            >
              No evidence (ask plainly)
            </button>
            {presentable.map((evidence) => (
              <button
                key={evidence.id}
                type="button"
                onClick={() => setSelectedEvidence(evidence.id)}
                disabled={isAsking}
                className={`rounded-2xl border px-4 py-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                  selectedEvidence === evidence.id
                    ? "border-[#c8a46a] text-[#e6bd77]"
                    : "border-white/15 text-[#cfc8ba]"
                }`}
              >
                <span className="block text-xs uppercase tracking-[0.2em] text-[#a6a29a]">
                  {evidence.category}
                </span>
                <span className="mt-1 block font-semibold">{evidence.title}</span>
              </button>
            ))}
          </div>
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

function useTranscript(sessionId: string, suspectId: string | null) {
  const [messagesBySuspect, setMessagesBySuspect] = useState<Record<string, MessageRow[]>>({});
  const [bump, setBump] = useState(0);

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
  }, [sessionId, suspectId, bump]);

  const messages = suspectId ? messagesBySuspect[suspectId] ?? [] : [];
  return { messages, refresh: () => setBump((value) => value + 1) };
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
            </p>
            <p className="mt-1 text-sm leading-6 text-[#f5f2ea]">{message.content}</p>
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

function EvidenceCard({ evidence }: { evidence: Evidence }) {
  return (
    <div className="rounded-2xl border border-white/10 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-[#a6a29a]">{evidence.category}</p>
      <p className="mt-1 text-base font-semibold">{evidence.title}</p>
      <p className="mt-1 text-sm leading-6 text-[#cfc8ba]">{evidence.description}</p>
    </div>
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
