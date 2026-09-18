import { NextResponse } from "next/server";
import { requireSessionAccess } from "@/lib/session-auth";
import { apiError } from "@/lib/api-errors";
type Context = { params: Promise<{ sessionId: string }> };
const json = (data: unknown) => NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
import { getLobbyState } from "@/lib/session-store";
import { hasRealtimeAuthEnv, mintSessionRealtimeToken } from "@/lib/realtime-auth";
export async function GET(_request: Request, context: Context) {
  try {
    const { sessionId } = await context.params; await requireSessionAccess(sessionId);
    const { session } = await getLobbyState(sessionId);
    if (!hasRealtimeAuthEnv()) return NextResponse.json({ error: 'Realtime auth not configured', code: 'realtime_disabled' }, { status: 503 });
    return json(await mintSessionRealtimeToken(sessionId, { sessionExpiresAt: session.expires_at }));
  } catch(error) { return apiError(error); }
}
