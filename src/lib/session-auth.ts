import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { createSupabaseServerClient } from "./supabase";

export const DEVICE_COOKIE = "mystery-device";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AccessError extends Error {
  constructor(message: string, public status = 403) { super(message); }
}

function signingKey() {
  const value = process.env.SESSION_AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new AccessError("Session authentication is not configured", 503);
  return new TextEncoder().encode(value);
}

export async function readDeviceToken(token?: string): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      algorithms: ["HS256"], issuer: "mystery-engine", audience: "device-identity",
    });
    return typeof payload.sub === "string" && UUID.test(payload.sub) ? payload.sub : null;
  } catch { return null; }
}

export async function currentDeviceId() {
  return readDeviceToken((await cookies()).get(DEVICE_COOKIE)?.value);
}

export async function ensureDevice() {
  return (await currentDeviceId()) ?? randomUUID();
}

export async function setDeviceCookie(response: NextResponse, deviceId: string, request: Request) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" }).setSubject(deviceId)
    .setIssuer("mystery-engine").setAudience("device-identity")
    .setIssuedAt().setExpirationTime("30d").sign(signingKey());
  response.cookies.set(DEVICE_COOKIE, token, {
    httpOnly: true, sameSite: "strict", secure: new URL(request.url).protocol === "https:",
    path: "/", maxAge: 30 * 24 * 60 * 60,
  });
}

export function checkRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  // Next dev may use its bind address (0.0.0.0) in request.url.
  // Host is the browser's destination authority; browsers cannot override it.
  const destination = new URL(request.url);
  const host = request.headers.get("host");
  if (host) destination.host = host;
  if (origin && origin !== destination.origin) {
    throw new AccessError("Cross-origin actions are not allowed");
  }
}

export type SessionAccess = { deviceId: string; isHost: boolean; playerId: string | null };

export async function requireSessionAccess(sessionId: string, options: { host?: boolean; playerId?: string } = {}): Promise<SessionAccess> {
  if (!UUID.test(sessionId)) throw new AccessError("Session not found", 404);
  const deviceId = await currentDeviceId();
  if (!deviceId) throw new AccessError("Join this game before continuing", 401);
  const db = createSupabaseServerClient();
  const { data, error } = await db.from("session_memberships").select("is_host,player_id")
    .eq("session_id", sessionId).eq("device_id", deviceId).maybeSingle();
  if (error) throw new AccessError("Could not verify session access", 503);
  if (!data) throw new AccessError("This device is not a member of the game");
  if (options.host && !data.is_host) throw new AccessError("Only the host can do that");
  if (options.playerId && data.player_id !== options.playerId) throw new AccessError("You cannot act as another detective");
  const { data: session, error: sessionError } = await db.from("sessions").select("expires_at").eq("id", sessionId).single();
  if (sessionError || !session) throw new AccessError("Session not found", 404);
  if (Date.parse(session.expires_at) <= Date.now()) throw new AccessError("This game has expired", 410);
  return { deviceId, isHost: data.is_host, playerId: data.player_id };
}
