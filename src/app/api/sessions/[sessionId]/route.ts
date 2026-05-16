import { NextResponse } from "next/server";
import { getLobbyState, SessionStoreError } from "@/lib/session-store";

type SessionRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(_request: Request, context: SessionRouteContext) {
  const { sessionId } = await context.params;

  try {
    const lobby = await getLobbyState(sessionId);
    return NextResponse.json(lobby);
  } catch (error) {
    if (error instanceof SessionStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Could not load session" }, { status: 500 });
  }
}
