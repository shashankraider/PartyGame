/**
 * Phase 2h — Realtime auth.
 *
 * Mints short-lived JWTs that scope a browser client's Supabase Realtime
 * connection (and direct anon-key reads) to a single session id. The JWT
 * carries a custom `session_id` claim; the migration 0006_realtime_jwt_rls.sql
 * extends `current_session_id()` to read that claim and the existing RLS
 * policies on sessions/players/messages/events/accusation_votes/
 * interview_unlock_state work unchanged.
 *
 * `SUPABASE_JWT_SECRET` must match the Supabase project's JWT secret. When the
 * secret is missing, callers should fall back to the legacy poll helpers.
 */

import { SignJWT } from "jose";

const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour; clients refresh before expiry.

export type RealtimeTokenPayload = {
  token: string;
  expiresAt: number; // unix seconds
};

export class RealtimeAuthError extends Error {
  constructor(
    message: string,
    public readonly code: "missing_secret" | "mint_failed",
  ) {
    super(message);
    this.name = "RealtimeAuthError";
  }
}

export function hasRealtimeAuthEnv(): boolean {
  return Boolean(process.env.SUPABASE_JWT_SECRET);
}

export async function mintSessionRealtimeToken(
  sessionId: string,
  options: { ttlSeconds?: number; deviceId?: string } = {},
): Promise<RealtimeTokenPayload> {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new RealtimeAuthError(
      "SUPABASE_JWT_SECRET is not set; realtime auth disabled.",
      "missing_secret",
    );
  }

  const ttl = Math.max(60, options.ttlSeconds ?? DEFAULT_TTL_SECONDS);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = nowSeconds + ttl;
  const subject = options.deviceId ? `${sessionId}:${options.deviceId}` : sessionId;

  const key = new TextEncoder().encode(secret);
  const token = await new SignJWT({
    role: "authenticated",
    session_id: sessionId,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer("mystery-engine")
    .setAudience("authenticated")
    .setSubject(subject)
    .setIssuedAt(nowSeconds)
    .setExpirationTime(expiresAt)
    // Supabase treats `role: "authenticated"` claims as a logged-in user so
    // Realtime allows the channel subscription. The custom `session_id` claim
    // is what RLS reads via auth.jwt().
    .sign(key);

  return { token, expiresAt };
}
