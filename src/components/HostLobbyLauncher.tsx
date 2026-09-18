"use client";

import { gameFetch } from "@/lib/game-fetch";

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

    const response = await gameFetch("/api/sessions", {
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
    <div className="lobby-panel">
      <p className="case-eyebrow">Your host station</p><h2 className="case-serif text-3xl mt-3">Gather your detectives.</h2>
      <p className="mt-3 text-sm leading-6 text-[#cfc8ba]">
        Create your lobby to get a private game code and QR. Start the investigation when everyone has joined.
      </p>
      <button
        type="button"
        onClick={createLobby}
        disabled={isCreating}
        className="case-button case-button--gold lobby-full mt-6"
      >
        {isCreating ? "Creating lobby..." : "Create lobby"}
      </button>
      {error ? (
        <p role="alert" className="mt-4 rounded-2xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}
