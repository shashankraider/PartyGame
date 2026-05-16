import { NextResponse } from "next/server";
import { SessionStoreError, setSessionInterviewer } from "@/lib/session-store";

type InterviewerRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

type InterviewerRequest = {
  playerId?: string | null;
};

export async function POST(request: Request, context: InterviewerRouteContext) {
  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as InterviewerRequest;

  if (body.playerId !== null && typeof body.playerId !== "string") {
    return NextResponse.json({ error: "playerId is required (string or null)" }, { status: 400 });
  }

  try {
    const session = await setSessionInterviewer({
      sessionId,
      playerId: body.playerId,
    });
    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof SessionStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Could not update interviewer" }, { status: 500 });
  }
}
