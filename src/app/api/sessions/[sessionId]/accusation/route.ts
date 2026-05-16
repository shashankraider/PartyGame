import { NextResponse } from "next/server";
import { SessionStoreError, setAccusationVote } from "@/lib/session-store";

type AccusationRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

type AccusationRequest = {
  playerId?: string;
  suspectId?: string | null;
};

export async function POST(request: Request, context: AccusationRouteContext) {
  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as AccusationRequest;

  if (typeof body.playerId !== "string" || !body.playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  if (body.suspectId !== null && typeof body.suspectId !== "string") {
    return NextResponse.json(
      { error: "suspectId must be a string or null" },
      { status: 400 },
    );
  }

  try {
    const lobby = await setAccusationVote({
      sessionId,
      playerId: body.playerId,
      suspectId: body.suspectId,
    });
    return NextResponse.json(lobby);
  } catch (error) {
    if (error instanceof SessionStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Could not record accusation" }, { status: 500 });
  }
}
