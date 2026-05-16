import { NextResponse } from "next/server";
import { askSuspect, getInterviewMessages, SessionStoreError } from "@/lib/session-store";

type InterviewRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

type AskRequest = {
  playerId?: string;
  question?: string;
  presentedEvidenceId?: string | null;
};

export async function POST(request: Request, context: InterviewRouteContext) {
  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as AskRequest;

  if (typeof body.playerId !== "string" || !body.playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  if (typeof body.question !== "string" || !body.question.trim()) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  if (
    body.presentedEvidenceId !== undefined &&
    body.presentedEvidenceId !== null &&
    typeof body.presentedEvidenceId !== "string"
  ) {
    return NextResponse.json(
      { error: "presentedEvidenceId must be a string or null" },
      { status: 400 },
    );
  }

  try {
    const result = await askSuspect({
      sessionId,
      playerId: body.playerId,
      question: body.question,
      presentedEvidenceId: body.presentedEvidenceId ?? null,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SessionStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Could not ask suspect" }, { status: 500 });
  }
}

export async function GET(request: Request, context: InterviewRouteContext) {
  const { sessionId } = await context.params;
  const url = new URL(request.url);
  const suspectId = url.searchParams.get("suspectId");

  if (!suspectId) {
    return NextResponse.json({ error: "suspectId query param is required" }, { status: 400 });
  }

  try {
    const messages = await getInterviewMessages({ sessionId, suspectId });
    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof SessionStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Could not load messages" }, { status: 500 });
  }
}
