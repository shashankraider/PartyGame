"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
};

function getOrCreateDeviceId() {
  const key = "mystery-engine-device-id";
  const existing = window.localStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const deviceId = window.crypto.randomUUID();
  window.localStorage.setItem(key, deviceId);
  return deviceId;
}

export function JoinLobbyForm({ joinCode }: JoinLobbyFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function joinLobby(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsJoining(true);
    setError(null);

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
      setError(payload.error ?? "Could not join lobby.");
      setIsJoining(false);
      return;
    }

    router.push(`/session/${payload.session.id}/player/${payload.player.id}`);
  }

  return (
    <form onSubmit={joinLobby} className="mt-10 rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
      <label className="text-sm uppercase tracking-[0.22em] text-[#a6a29a]" htmlFor="playerName">
        Detective name
      </label>
      <input
        id="playerName"
        name="playerName"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Enter your name"
        required
        maxLength={40}
        className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-lg outline-none transition placeholder:text-[#736f68] focus:border-[#c8a46a]"
      />
      <button
        type="submit"
        disabled={isJoining || !name.trim()}
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
  );
}
