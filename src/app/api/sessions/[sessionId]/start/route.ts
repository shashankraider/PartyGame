import { NextResponse } from "next/server";
import { SessionStoreError, startSession } from "@/lib/session-store";

type StartRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function POST(_request: Request, context: StartRouteContext) {
  const { sessionId } = await context.params;

  try {
    const session = await startSession(sessionId);
    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof SessionStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Could not start session" }, { status: 500 });
  }
}
