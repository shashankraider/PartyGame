/**
 * Phase 2h — React hooks that subscribe to Supabase Realtime for the live
 * session state. Each hook gracefully degrades to the legacy poll endpoint
 * when realtime auth isn't available (missing SUPABASE_JWT_SECRET, network
 * failure on the token mint, etc.) so the app stays playable.
 *
 * The hooks intentionally take an `initial` snapshot from the server-rendered
 * page so the first paint never waits for a network round trip.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { createSessionRealtimeClient, type SessionRealtimeClient } from "./supabase-client";
import type {
  AccusationVoteRow,
  MessageRow,
  PlayerRow,
  SessionRow,
} from "./supabase";

export type LobbySnapshot = {
  session: SessionRow;
  players: PlayerRow[];
  accusationVotes: AccusationVoteRow[];
};

type LobbyApiResponse = LobbySnapshot & { error?: string };

const LOBBY_POLL_MS = 2500;
const TRANSCRIPT_POLL_MS = 1500;
const CASE_STATUS_POLL_MS = 2000;
const HOST_FALLBACK_POLL_MS = 2500;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json().catch(() => null)) as T | null;
  } catch {
    return null;
  }
}

async function refetchLobby(sessionId: string): Promise<LobbySnapshot | null> {
  const payload = await fetchJson<LobbyApiResponse>(`/api/sessions/${sessionId}`);
  if (!payload || payload.error || !payload.session) return null;
  return {
    session: payload.session,
    players: payload.players ?? [],
    accusationVotes: payload.accusationVotes ?? [],
  };
}

// ----------------------------------------------------------------------------
// useSessionLobbyRealtime
// ----------------------------------------------------------------------------
// Drives both HostLobbyView and PlayerLobbyView. Subscribes to sessions,
// players, and accusation_votes inserts/updates filtered to this session.
// Every event refetches the full lobby (cheap on the server) so consumers don't
// have to merge partial rows.

export function useSessionLobbyRealtime(
  sessionId: string,
  initial: LobbySnapshot,
): {
  lobby: LobbySnapshot;
  error: string | null;
  applySnapshot: (next: Partial<LobbySnapshot>) => void;
} {
  const [lobby, setLobby] = useState<LobbySnapshot>(initial);
  const [error, setError] = useState<string | null>(null);

  function applySnapshot(next: Partial<LobbySnapshot>) {
    setLobby((current) => ({ ...current, ...next }));
  }

  useEffect(() => {
    let cancelled = false;
    let pollHandle: ReturnType<typeof setInterval> | null = null;
    let realtime: SessionRealtimeClient | null = null;
    let channel: RealtimeChannel | null = null;

    async function start() {
      realtime = await createSessionRealtimeClient(sessionId);
      if (cancelled) {
        realtime?.dispose();
        return;
      }

      if (!realtime) {
        // Fallback: legacy poll.
        pollHandle = setInterval(async () => {
          const next = await refetchLobby(sessionId);
          if (cancelled) return;
          if (!next) {
            setError("Could not refresh lobby.");
            return;
          }
          setError(null);
          setLobby(next);
        }, LOBBY_POLL_MS);
        return;
      }

      const refresh = async () => {
        const next = await refetchLobby(sessionId);
        if (cancelled || !next) return;
        setLobby(next);
        setError(null);
      };

      channel = realtime.supabase
        .channel(`session:${sessionId}:lobby`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
          refresh,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "players", filter: `session_id=eq.${sessionId}` },
          refresh,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "accusation_votes",
            filter: `session_id=eq.${sessionId}`,
          },
          refresh,
        );

      channel.subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // Realtime degraded — keep the channel but layer a slow poll on top
          // so the UI stays current. Cheap insurance.
          if (!pollHandle) {
            pollHandle = setInterval(refresh, LOBBY_POLL_MS);
          }
        }
      });
    }

    void start();

    return () => {
      cancelled = true;
      if (pollHandle) clearInterval(pollHandle);
      if (channel && realtime) void realtime.supabase.removeChannel(channel);
      realtime?.dispose();
    };
  }, [sessionId]);

  return { lobby, error, applySnapshot };
}

// ----------------------------------------------------------------------------
// useInterviewTranscriptRealtime
// ----------------------------------------------------------------------------
// Used by both InterviewScene (TV) and InterviewMode (phone). Subscribes to
// messages inserts/updates for (session_id, suspect_id) so streaming token
// updates (Phase 2h SSE) fan out in real time.

export function useInterviewTranscriptRealtime(
  sessionId: string,
  suspectId: string | null,
): MessageRow[] {
  const [messagesBySuspect, setMessagesBySuspect] = useState<Record<string, MessageRow[]>>({});
  const suspectRef = useRef<string | null>(suspectId);

  useEffect(() => {
    suspectRef.current = suspectId;
    if (!suspectId) return;

    let cancelled = false;
    let pollHandle: ReturnType<typeof setInterval> | null = null;
    let realtime: SessionRealtimeClient | null = null;
    let channel: RealtimeChannel | null = null;

    async function load() {
      if (!suspectId) return;
      const payload = await fetchJson<{ messages?: MessageRow[] }>(
        `/api/sessions/${sessionId}/interview?suspectId=${encodeURIComponent(suspectId)}`,
      );
      if (cancelled || suspectRef.current !== suspectId || !payload?.messages) return;
      setMessagesBySuspect((prev) => ({ ...prev, [suspectId]: payload.messages! }));
    }

    async function start() {
      await load();
      realtime = await createSessionRealtimeClient(sessionId);
      if (cancelled) {
        realtime?.dispose();
        return;
      }

      if (!realtime) {
        pollHandle = setInterval(load, TRANSCRIPT_POLL_MS);
        return;
      }

      channel = realtime.supabase
        .channel(`session:${sessionId}:messages:${suspectId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const row = (payload.new ?? payload.old) as MessageRow | null;
            if (!row || row.suspect_id !== suspectRef.current) return;
            void load();
          },
        );

      channel.subscribe((status) => {
        if ((status === "CHANNEL_ERROR" || status === "TIMED_OUT") && !pollHandle) {
          pollHandle = setInterval(load, TRANSCRIPT_POLL_MS);
        }
      });
    }

    void start();

    return () => {
      cancelled = true;
      if (pollHandle) clearInterval(pollHandle);
      if (channel && realtime) void realtime.supabase.removeChannel(channel);
      realtime?.dispose();
    };
  }, [sessionId, suspectId]);

  return suspectId ? messagesBySuspect[suspectId] ?? [] : [];
}

// ----------------------------------------------------------------------------
// useCaseStatusRealtime
// ----------------------------------------------------------------------------
// Drives the TV's Case Status panel. Subscribes to events inserts filtered to
// type='interview.host_judgment' for the current session.

export type CaseStatusEvent = {
  id: string;
  created_at: string;
  payload: { reason?: string | null; [key: string]: unknown };
};

export function useCaseStatusRealtime(
  sessionId: string,
  eventType: string,
): CaseStatusEvent[] {
  const [events, setEvents] = useState<CaseStatusEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    let pollHandle: ReturnType<typeof setInterval> | null = null;
    let realtime: SessionRealtimeClient | null = null;
    let channel: RealtimeChannel | null = null;

    async function load() {
      const payload = await fetchJson<{ events?: CaseStatusEvent[] }>(
        `/api/sessions/${sessionId}/events?type=${encodeURIComponent(eventType)}`,
      );
      if (cancelled || !payload?.events) return;
      setEvents(payload.events);
    }

    async function start() {
      await load();
      realtime = await createSessionRealtimeClient(sessionId);
      if (cancelled) {
        realtime?.dispose();
        return;
      }

      if (!realtime) {
        pollHandle = setInterval(load, CASE_STATUS_POLL_MS);
        return;
      }

      channel = realtime.supabase
        .channel(`session:${sessionId}:events:${eventType}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "events",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const row = payload.new as CaseStatusEvent & { type?: string };
            if (!row || row.type !== eventType) return;
            void load();
          },
        );

      channel.subscribe((status) => {
        if ((status === "CHANNEL_ERROR" || status === "TIMED_OUT") && !pollHandle) {
          pollHandle = setInterval(load, CASE_STATUS_POLL_MS);
        }
      });
    }

    void start();

    return () => {
      cancelled = true;
      if (pollHandle) clearInterval(pollHandle);
      if (channel && realtime) void realtime.supabase.removeChannel(channel);
      realtime?.dispose();
    };
  }, [sessionId, eventType]);

  return events;
}

// ----------------------------------------------------------------------------
// useHostFallbackRealtime
// ----------------------------------------------------------------------------
// Drives the TV's host-fallback banner. Watches interview_unlock_state so the
// "players stuck on X for 5 turns" banner appears instantly when the
// adjudicator flags it server-side.

export type HostFallback = {
  conditionId: string;
  subject: "secret" | "breaking-point" | "evidence";
  label: string;
  attempts: number;
  maxAdjacency: number;
  evidenceId?: string;
};

export function useHostFallbackRealtime(
  sessionId: string,
  suspectId: string | null,
  bump: number,
): { fallbacks: HostFallback[]; refresh: () => void } {
  const [fallbacks, setFallbacks] = useState<HostFallback[]>([]);
  const [manualBump, setManualBump] = useState(0);

  useEffect(() => {
    if (!suspectId) return;

    let cancelled = false;
    let pollHandle: ReturnType<typeof setInterval> | null = null;
    let realtime: SessionRealtimeClient | null = null;
    let channel: RealtimeChannel | null = null;

    async function load() {
      if (!suspectId) return;
      const payload = await fetchJson<{ fallbacks?: HostFallback[] }>(
        `/api/sessions/${sessionId}/interview/host-unlock`,
      );
      if (cancelled || !payload) return;
      setFallbacks(payload.fallbacks ?? []);
    }

    async function start() {
      await load();
      realtime = await createSessionRealtimeClient(sessionId);
      if (cancelled) {
        realtime?.dispose();
        return;
      }

      if (!realtime) {
        pollHandle = setInterval(load, HOST_FALLBACK_POLL_MS);
        return;
      }

      channel = realtime.supabase
        .channel(`session:${sessionId}:fallback:${suspectId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "interview_unlock_state",
            filter: `session_id=eq.${sessionId}`,
          },
          () => {
            void load();
          },
        );

      channel.subscribe((status) => {
        if ((status === "CHANNEL_ERROR" || status === "TIMED_OUT") && !pollHandle) {
          pollHandle = setInterval(load, HOST_FALLBACK_POLL_MS);
        }
      });
    }

    void start();

    return () => {
      cancelled = true;
      if (pollHandle) clearInterval(pollHandle);
      if (channel && realtime) void realtime.supabase.removeChannel(channel);
      realtime?.dispose();
    };
  }, [sessionId, suspectId, bump, manualBump]);

  return {
    fallbacks: suspectId ? fallbacks : [],
    refresh: () => setManualBump((value) => value + 1),
  };
}

