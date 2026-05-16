import { NextResponse } from "next/server";
import {
  advanceSessionChapter,
  SessionStoreError,
  setSessionScene,
} from "@/lib/session-store";
import type { SessionScene } from "@/lib/supabase";

type SceneRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

type SceneRequest =
  | {
      action: "next" | "previous";
    }
  | {
      action: "set";
      scene: SessionScene;
      chapterId?: string | null;
    };

export async function POST(request: Request, context: SceneRouteContext) {
  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Partial<SceneRequest>;

  try {
    if (body.action === "next" || body.action === "previous") {
      const session = await advanceSessionChapter(sessionId, body.action);
      return NextResponse.json({ session });
    }

    if (body.action === "set" && body.scene) {
      const session = await setSessionScene({
        sessionId,
        scene: body.scene,
        chapterId: "chapterId" in body ? body.chapterId : undefined,
      });
      return NextResponse.json({ session });
    }

    return NextResponse.json({ error: "Invalid scene action" }, { status: 400 });
  } catch (error) {
    if (error instanceof SessionStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Could not update scene" }, { status: 500 });
  }
}
