import { NextResponse } from "next/server";
import { createSession, SessionStoreError } from "@/lib/session-store";

type CreateSessionRequest = {
  caseId?: string;
  mode?: "solo" | "multiplayer";
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateSessionRequest;
  const caseId = body.caseId?.trim() || process.env.CASE_ID?.trim();

  if (!caseId) {
    return NextResponse.json({ error: "caseId is required" }, { status: 400 });
  }

  try {
    const session = await createSession(caseId, body.mode ?? "multiplayer");
    return NextResponse.json({ session, persisted: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SessionStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Could not create session" }, { status: 500 });
  }
}
