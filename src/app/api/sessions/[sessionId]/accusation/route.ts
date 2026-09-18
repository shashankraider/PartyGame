import { NextResponse } from "next/server";
import { requireSessionAccess, checkRequestOrigin, AccessError } from "@/lib/session-auth";
import { apiError } from "@/lib/api-errors";
type Context = { params: Promise<{ sessionId: string }> };
const json = (data: unknown) => NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
import { setAccusationVote } from "@/lib/session-store";
export async function POST(request: Request, context: Context) {
  try {
    checkRequestOrigin(request); const { sessionId } = await context.params;
    const body = await request.json();
    const actor = await requireSessionAccess(sessionId);
    if (!actor.playerId || body.playerId !== actor.playerId) throw new AccessError('You cannot vote as another detective');
    if (body.suspectId !== null && typeof body.suspectId !== 'string') throw new AccessError('suspectId must be a string or null',400);
    return json(await setAccusationVote({ sessionId, playerId: actor.playerId, suspectId: body.suspectId }));
  } catch(error) { return apiError(error); }
}
