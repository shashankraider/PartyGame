import { NextResponse } from "next/server";
import { requireSessionAccess, checkRequestOrigin, AccessError } from "@/lib/session-auth";
import { apiError } from "@/lib/api-errors";
type Context = { params: Promise<{ sessionId: string }> };
const json = (data: unknown) => NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
import { getActiveHostFallbacksForSession, triggerHostUnlock, SessionStoreError } from "@/lib/session-store";
export async function GET(_request: Request, context: Context) {
  try { const { sessionId } = await context.params; await requireSessionAccess(sessionId, { host: true });
    return json({ fallbacks: await getActiveHostFallbacksForSession({ sessionId }) });
  } catch(error) { if (error instanceof SessionStoreError && error.code === 'invalid_request') return json({ fallbacks: [] }); return apiError(error); }
}
export async function POST(request: Request, context: Context) {
  try { checkRequestOrigin(request); const { sessionId } = await context.params; await requireSessionAccess(sessionId, { host: true });
    const { conditionId } = await request.json(); if (typeof conditionId !== 'string') throw new AccessError('conditionId is required',400);
    return json(await triggerHostUnlock({ sessionId, conditionId }));
  } catch(error) { return apiError(error); }
}
