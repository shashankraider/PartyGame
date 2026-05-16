import { NextResponse } from "next/server";
import { joinSessionByCode, SessionStoreError } from "@/lib/session-store";

type JoinRequest = {
  joinCode?: string;
  name?: string;
  deviceId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as JoinRequest;

  try {
    const result = await joinSessionByCode({
      joinCode: body.joinCode ?? "",
      name: body.name ?? "",
      deviceId: body.deviceId ?? "",
    });

    return NextResponse.json(result, { status: result.existing ? 200 : 201 });
  } catch (error) {
    if (error instanceof SessionStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Could not join session" }, { status: 500 });
  }
}
