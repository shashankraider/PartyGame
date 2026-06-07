"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearActivePlayerSession,
  getPlayerSessionPath,
  readActivePlayerSession,
  type ActivePlayerSession,
  writeActivePlayerSession,
} from "@/lib/player-session";

type JoinLobbyFormProps = {
  joinCode: string;
};

type JoinResponse = {
  session?: {
    id: string;
  };
  player?: {
    id: string;
    is_observer: boolean;
  };
  error?: string;
  code?: string;
};

/**
 * `crypto.randomUUID()` is only available in a secure context (https or localhost).
 * Over plain http://192.168.x.x it is undefined, so join must not depend on it.
 */
function newDeviceId(): string {
  const c = typeof window !== "undefined" ? window.crypto : undefined;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateDeviceId() {
  const key = "mystery-engine-device-id";
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) {
      return existing;
    }
    const deviceId = newDeviceId();
    window.localStorage.setItem(key, deviceId);
    return deviceId;
  } catch {
    // iOS private mode / storage blocked: still join; session may not remember this device across reloads.
    return newDeviceId();
  }
}

export function JoinLobbyForm({ joinCode }: JoinLobbyFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [savedSession, setSavedSession] = useState<ActivePlayerSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectPlayer = useCallback(async (name: string, isResume = false) => {
    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch("/api/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          joinCode,
          name,
          deviceId: getOrCreateDeviceId(),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as JoinResponse;

      if (!response.ok || !payload.session || !payload.player) {
        if (isResume && ["join_code_not_found", "case_not_found"].includes(payload.code ?? "")) {
          clearActivePlayerSession(window.localStorage, joinCode);
          setSavedSession(null);
        } else if (isResume) {
          setSavedSession(readActivePlayerSession(window.localStorage, joinCode));
        }
        setError(
          isResume
            ? "Could not reconnect automatically. Tap Return to game to try again."
            : (payload.error ?? "Could not join lobby."),
        );
        return;
      }

      const activeSession: ActivePlayerSession = {
        version: 1,
        joinCode,
        playerName: name,
        sessionId: payload.session.id,
        playerId: payload.player.id,
      };
      writeActivePlayerSession(window.localStorage, activeSession);
      setSavedSession(activeSession);
      router.replace(getPlayerSessionPath(activeSession));
    } catch {
      setError(
        isResume
          ? "Could not reconnect automatically. Tap Return to game to try again."
          : "Could not join lobby. Check your connection and try again.",
      );
      if (isResume) {
        setSavedSession(readActivePlayerSession(window.localStorage, joinCode));
      }
    } finally {
      setIsJoining(false);
    }
  }, [joinCode, router]);

  const joinLobby = useCallback(async () => {
    const form = formRef.current;
    if (!form) return;

    const raw = String(new FormData(form).get("playerName") ?? "");
    const name = raw.trim();
    if (!name) {
      setError("Please enter your name.");
      return;
    }

    await connectPlayer(name);
  }, [connectPlayer]);

  useEffect(() => {
    const activeSession = readActivePlayerSession(window.localStorage, joinCode);
    if (!activeSession) return;

    queueMicrotask(() => {
      void connectPlayer(activeSession.playerName, true);
    });
  }, [connectPlayer, joinCode]);

  return (
    <div className="mt-10">
      {savedSession ? (
        <section className="mb-4 rounded-3xl border border-[#c8a46a]/30 bg-[#c8a46a]/10 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#c8a46a]">Active investigation</p>
          <h2 className="mt-2 text-xl font-semibold">Return as {savedSession.playerName}</h2>
          <p className="mt-2 text-sm leading-6 text-[#cfc8ba]">
            This phone is already connected to the game.
          </p>
          <button
            type="button"
            disabled={isJoining}
            onClick={() => void connectPlayer(savedSession.playerName, true)}
            className="mt-5 w-full rounded-full bg-[#c8a46a] px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-[#e6bd77] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isJoining ? "Returning..." : "Return to game"}
          </button>
        </section>
      ) : null}

      <form
        ref={formRef}
        className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6"
        onSubmit={(event) => {
          // Never allow a native GET/POST navigation (e.g. iOS Safari, failed hydration).
          // Join must go through /api/join only.
          event.preventDefault();
          void joinLobby();
        }}
      >
      <label className="text-sm uppercase tracking-[0.22em] text-[#a6a29a]" htmlFor="playerName">
        Detective name
      </label>
      <input
        suppressHydrationWarning
        type="text"
        id="playerName"
        name="playerName"
        placeholder="Enter your name"
        required
        maxLength={40}
        autoComplete="name"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="words"
        className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-lg outline-none transition placeholder:text-[#736f68] focus:border-[#c8a46a]"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void joinLobby();
          }
        }}
      />
      <button
        type="button"
        disabled={isJoining}
        onClick={() => void joinLobby()}
        className="mt-5 w-full rounded-full bg-[#c8a46a] px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-[#e6bd77] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isJoining ? "Joining..." : "Join as detective"}
      </button>
      {error ? (
        <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-100">
          {error}
        </p>
      ) : null}
      <p className="mt-4 text-sm leading-6 text-[#a6a29a]">
        If the game has already started or the detective seats are full, you will join as an
        observer.
      </p>
      </form>
    </div>
  );
}
