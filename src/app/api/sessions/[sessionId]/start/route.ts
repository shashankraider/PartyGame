import { NextResponse } from "next/server";
import { requireSessionAccess, checkRequestOrigin } from "@/lib/session-auth";
import { apiError } from "@/lib/api-errors";
type Context = { params: Promise<{ sessionId: string }> };
const json = (data: unknown) => NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
import { startSession, getPublicLobbyState } from "@/lib/session-store";
export async function POST(request: Request, context: Context) {
  try { checkRequestOrigin(request); const { sessionId } = await context.params; await requireSessionAccess(sessionId, { host: true }); await startSession(sessionId); return json(await getPublicLobbyState(sessionId)); }
  catch(error) { return apiError(error); }
}
