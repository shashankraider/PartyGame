import { NextResponse } from "next/server";
import { requireSessionAccess, checkRequestOrigin, AccessError } from "@/lib/session-auth";
import { apiError } from "@/lib/api-errors";
type Context = { params: Promise<{ sessionId: string }> };
const json = (data: unknown) => NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
import { setSessionInterviewer, getLobbyState, getPublicLobbyState } from "@/lib/session-store";
export async function POST(request: Request, context: Context) {
  try {
    checkRequestOrigin(request); const { sessionId } = await context.params;
    const actor = await requireSessionAccess(sessionId);
    const { playerId } = await request.json();
    if (playerId !== null && typeof playerId !== 'string') throw new AccessError('playerId must be a string or null',400);
    const { session } = await getLobbyState(sessionId);
    if (!actor.isHost && !(actor.playerId && (session.current_interviewer_player_id === actor.playerId || (!session.current_interviewer_player_id && actor.playerId === playerId)))) throw new AccessError('Only the active detective can pass the microphone');
    await setSessionInterviewer({ sessionId, playerId, actorPlayerId: actor.isHost ? undefined : actor.playerId! }); return json(await getPublicLobbyState(sessionId));
  } catch(error) { return apiError(error); }
}
