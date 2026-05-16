"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type HostLobbyLauncherProps = {
  caseId: string;
};

type CreateSessionResponse = {
  session?: {
    id: string;
  };
  error?: string;
};

export function HostLobbyLauncher({ caseId }: HostLobbyLauncherProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createLobby() {
    setIsCreating(true);
    setError(null);

    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ caseId, mode: "multiplayer" }),
    });

    const payload = (await response.json().catch(() => ({}))) as CreateSessionResponse;

    if (!response.ok || !payload.session) {
      setError(payload.error ?? "Could not create lobby.");
      setIsCreating(false);
      return;
    }

    router.push(`/session/${payload.session.id}/host`);
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
      <h2 className="text-2xl font-semibold">Create TV lobby</h2>
      <p className="mt-3 text-sm leading-6 text-[#cfc8ba]">
        This creates a persisted Supabase session, generates a join code, and opens the host display.
      </p>
      <button
        type="button"
        onClick={createLobby}
        disabled={isCreating}
        className="mt-6 w-full rounded-full bg-[#c8a46a] px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-[#e6bd77] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCreating ? "Creating lobby..." : "Create lobby"}
      </button>
      {error ? (
        <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}
