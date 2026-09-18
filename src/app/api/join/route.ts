import { NextResponse } from "next/server";
import { joinSessionByCode } from "@/lib/session-store";
import { ensureDevice, setDeviceCookie, checkRequestOrigin } from "@/lib/session-auth";
import { apiError } from "@/lib/api-errors";
export async function POST(request: Request) {
  try {
    checkRequestOrigin(request);
    const body = await request.json();
    const deviceId = await ensureDevice();
    const result = await joinSessionByCode({ joinCode: body.joinCode ?? '', name: body.name ?? '', deviceId });
    const response = NextResponse.json(result, { status: result.existing ? 200 : 201, headers: { 'Cache-Control': 'no-store' } });
    await setDeviceCookie(response, deviceId, request);
    return response;
  } catch(error) { return apiError(error); }
}
