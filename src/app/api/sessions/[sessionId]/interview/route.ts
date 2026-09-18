import { NextResponse } from "next/server";
import { requireSessionAccess, checkRequestOrigin, AccessError } from "@/lib/session-auth";
import { apiError } from "@/lib/api-errors";
// Includes bounded answer repair; the database turn lease is also 120 seconds.
export const maxDuration = 120;
type Context = { params: Promise<{ sessionId: string }> };
const json = (data: unknown) => NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
import { askSuspect, getInterviewMessages } from "@/lib/session-store";
export async function POST(request: Request, context: Context) {
  try {
    checkRequestOrigin(request); const { sessionId } = await context.params;
    const body = await request.json(); const actor = await requireSessionAccess(sessionId);
    if (!actor.playerId || body.playerId !== actor.playerId) throw new AccessError('You cannot ask as another detective');
    if (typeof body.question !== 'string' || typeof body.requestId !== 'string' || (body.presentedEvidenceId != null && typeof body.presentedEvidenceId !== 'string')) throw new AccessError('A question and requestId are required',400);
    const { userMessage, assistantMessage, systemMessages, session } = await askSuspect({ sessionId, playerId: actor.playerId, question: body.question, requestId: body.requestId, presentedEvidenceId: body.presentedEvidenceId ?? null });
    return json({ userMessage, assistantMessage, systemMessages, session });
  } catch(error) { return apiError(error); }
}
export async function GET(request: Request, context: Context) {
  try { const { sessionId } = await context.params; await requireSessionAccess(sessionId);
    const suspectId = new URL(request.url).searchParams.get('suspectId'); if (!suspectId) throw new AccessError('suspectId is required',400);
    return json({ messages: await getInterviewMessages({ sessionId, suspectId }) });
  } catch(error) { return apiError(error); }
}
