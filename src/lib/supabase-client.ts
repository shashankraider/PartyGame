/**
 * Phase 2h — Browser-side authenticated Supabase client for Realtime
 * subscriptions.
 *
 * Use `createSessionRealtimeClient(sessionId)` from a React effect:
 *   const client = await createSessionRealtimeClient(sessionId);
 *   if (!client) return; // realtime disabled — fall back to legacy polls
 *   const channel = client.channel(...);
 *
 * The client fetches a short-lived JWT from
 * `GET /api/sessions/[id]/realtime-token`, then wires it into the supabase-js
 * client via `realtime.setAuth(token)`. The JWT carries a `session_id` claim
 * that the migration 0006_realtime_jwt_rls.sql wires into the existing RLS
 * policies, so subscribed rows are automatically filtered to the caller's
 * session.
 *
 * Returns `null` when realtime auth is unavailable (missing env, server-side
 * disabled, network error). Callers should treat `null` as a signal to keep
 * the legacy poll helpers running.
 */

import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

const REFRESH_MARGIN_SECONDS = 60;

let memoizedClient: SupabaseClient | null = null;

type RealtimeTokenResponse = {
  token: string;
  expiresAt: number;
};

function getEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function getBaseClient(): SupabaseClient | null {
  if (memoizedClient) return memoizedClient;
  const env = getEnv();
  if (!env) return null;
  memoizedClient = createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 20,
      },
    },
  });
  return memoizedClient;
}

async function fetchRealtimeToken(sessionId: string): Promise<RealtimeTokenResponse | null> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/realtime-token`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json().catch(() => null)) as RealtimeTokenResponse | null;
    if (!payload?.token || !payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

export type SessionRealtimeClient = {
  supabase: SupabaseClient;
  /** Tear down the refresh timer. Channels should be unsubscribed separately. */
  dispose: () => void;
};

/**
 * Returns a Supabase client whose realtime + PostgREST auth carries a
 * short-lived JWT scoped to `sessionId`. Returns `null` when realtime auth is
 * not available (env missing, route 503, network failure) so callers can fall
 * back to the legacy poll helpers without surfacing an error.
 */
export async function createSessionRealtimeClient(
  sessionId: string,
): Promise<SessionRealtimeClient | null> {
  const client = getBaseClient();
  if (!client) return null;

  const initial = await fetchRealtimeToken(sessionId);
  if (!initial) return null;

  client.realtime.setAuth(initial.token);

  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  function scheduleRefresh(expiresAt: number) {
    if (disposed) return;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const refreshIn = Math.max(30, expiresAt - nowSeconds - REFRESH_MARGIN_SECONDS);
    refreshTimer = setTimeout(async () => {
      const next = await fetchRealtimeToken(sessionId);
      if (!next || disposed) return;
      client!.realtime.setAuth(next.token);
      scheduleRefresh(next.expiresAt);
    }, refreshIn * 1000);
  }

  scheduleRefresh(initial.expiresAt);

  return {
    supabase: client,
    dispose() {
      disposed = true;
      if (refreshTimer) clearTimeout(refreshTimer);
    },
  };
}

/**
 * Convenience helper: subscribe to a single channel filter and call `onChange`
 * on every event. Returns an unsubscribe function. The channel is created on
 * the client passed in (must be the one returned from
 * createSessionRealtimeClient).
 */
export function subscribeChannel(
  supabase: SupabaseClient,
  channelName: string,
  configure: (channel: RealtimeChannel) => RealtimeChannel,
): () => void {
  const channel = configure(supabase.channel(channelName));
  channel.subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
