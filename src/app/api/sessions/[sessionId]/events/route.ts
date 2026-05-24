import { NextResponse } from "next/server";
import { getSessionEvents, SessionStoreError } from "@/lib/session-store";

type EventsRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(request: Request, context: EventsRouteContext) {
  const { sessionId } = await context.params;
  const type = new URL(request.url).searchParams.get("type") ?? undefined;

  try {
    const events = await getSessionEvents(sessionId, { type });
    return NextResponse.json({ events });
  } catch (error) {
    if (error instanceof SessionStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Could not load events" }, { status: 500 });
  }
}
