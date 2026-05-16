import { NextResponse } from "next/server";
import {
  getActiveHostFallbacksForSession,
  SessionStoreError,
  triggerHostUnlock,
} from "@/lib/session-store";

type HostUnlockRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

type HostUnlockRequest = {
  conditionId?: string;
};

export async function GET(_request: Request, context: HostUnlockRouteContext) {
  const { sessionId } = await context.params;
  try {
    const fallbacks = await getActiveHostFallbacksForSession({ sessionId });
    return NextResponse.json({ fallbacks });
  } catch (error) {
    if (error instanceof SessionStoreError) {
      // Not being in an interview chapter is a normal state; return an empty list.
      if (error.code === "invalid_request") {
        return NextResponse.json({ fallbacks: [] });
      }
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Could not load host fallbacks" }, { status: 500 });
  }
}

export async function POST(request: Request, context: HostUnlockRouteContext) {
  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as HostUnlockRequest;

  if (typeof body.conditionId !== "string" || !body.conditionId) {
    return NextResponse.json({ error: "conditionId is required" }, { status: 400 });
  }

  try {
    const result = await triggerHostUnlock({ sessionId, conditionId: body.conditionId });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SessionStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.status },
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not trigger host unlock" }, { status: 500 });
  }
}
