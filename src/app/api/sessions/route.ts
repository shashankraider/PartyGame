import { NextResponse } from "next/server";
import { createSession } from "@/lib/session-store";
import { currentDeviceId, ensureDevice, setDeviceCookie, checkRequestOrigin, AccessError } from "@/lib/session-auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { loadConfiguredCaseSummaries } from "@/engine/case-loader";
import { apiError } from "@/lib/api-errors";
export async function POST(request: Request) {
  try {
    checkRequestOrigin(request);
    const body = await request.json();
    const caseId = body.caseId ?? process.env.CASE_ID;
    if (typeof caseId !== 'string' || !caseId.trim()) throw new AccessError('caseId is required', 400);
    if (body.mode && !['solo','multiplayer'].includes(body.mode)) throw new AccessError('Invalid mode', 400);
    const deviceId = await ensureDevice();
    const session = await createSession(caseId.trim(), body.mode ?? 'multiplayer', deviceId);
    const response = NextResponse.json({ session, persisted: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
    await setDeviceCookie(response, deviceId, request);
    return response;
  } catch(error) { return apiError(error); }
}

/** List only unexpired active games belonging to the signed browser identity. */
export async function GET() {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  try {
    const deviceId = await currentDeviceId();
    if (!deviceId) return NextResponse.json({ sessions: [] }, { headers });
    const db = createSupabaseServerClient();
    const { data: memberships, error: membershipError } = await db.from("session_memberships")
      .select("session_id,is_host,player_id").eq("device_id", deviceId);
    if (membershipError) throw new AccessError("Could not load your games", 503);
    if (!memberships?.length) return NextResponse.json({ sessions: [] }, { headers });
    const { data, error } = await db.from("sessions")
      .select("id,case_id,join_code,status,updated_at")
      .in("id", memberships.map(m => m.session_id))
      .in("status", ["lobby", "in_progress", "paused"])
      .gt("expires_at", new Date().toISOString()).order("updated_at", { ascending: false });
    if (error) throw new AccessError("Could not load your games", 503);
    const cases = await loadConfiguredCaseSummaries();
    const sessions = (data ?? []).map(session => {
      const membership = memberships.find(m => m.session_id === session.id)!;
      return {
        id: session.id, caseId: session.case_id,
        title: cases.find(c => c.id === session.case_id)?.title ?? session.case_id,
        joinCode: session.join_code, status: session.status,
        hostUrl: membership.is_host ? `/session/${session.id}/host` : null,
        playerUrl: membership.player_id ? `/session/${session.id}/player/${membership.player_id}` : null,
      };
    });
    return NextResponse.json({ sessions }, { headers });
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
