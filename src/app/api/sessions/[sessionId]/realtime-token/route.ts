import { NextResponse } from "next/server";
import { hasSupabaseServerEnv } from "@/lib/supabase";
import { getLobbyState } from "@/lib/session-store";
import { hasRealtimeAuthEnv, mintSessionRealtimeToken, RealtimeAuthError } from "@/lib/realtime-auth";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { sessionId } = await context.params;

  if (!hasSupabaseServerEnv()) {
    return NextResponse.json(
      { error: "Supabase server env not configured." },
      { status: 503 },
    );
  }

  if (!hasRealtimeAuthEnv()) {
    // Client expects this exact `code` so it can switch to the legacy poll
    // helpers without surfacing a noisy error to the user.
    return NextResponse.json(
      { error: "Realtime auth not configured.", code: "realtime_disabled" },
      { status: 503 },
    );
  }

  try {
    // Validate the session exists before minting a token. Cheap guard that
    // prevents minting tokens for arbitrary UUIDs.
    await getLobbyState(sessionId);
  } catch {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  try {
    const payload = await mintSessionRealtimeToken(sessionId);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof RealtimeAuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: "Could not mint realtime token." }, { status: 500 });
  }
}
