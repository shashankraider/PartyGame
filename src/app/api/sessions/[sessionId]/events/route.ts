import { NextResponse } from "next/server";
import { requireSessionAccess } from "@/lib/session-auth";
import { apiError } from "@/lib/api-errors";
type Context = { params: Promise<{ sessionId: string }> };
const json = (data: unknown) => NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
import { getSessionEvents } from "@/lib/session-store";
export async function GET(request: Request, context: Context) {
  try { const { sessionId } = await context.params; await requireSessionAccess(sessionId);
    return json({ events: await getSessionEvents(sessionId, { type: new URL(request.url).searchParams.get('type') ?? undefined }) });
  } catch(error) { return apiError(error); }
}
