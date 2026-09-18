import { NextResponse } from "next/server";
import { AccessError } from "./session-auth";

export function apiError(error: unknown) {
  const status = error instanceof SyntaxError ? 400 : error instanceof AccessError ? error.status
    : error instanceof Error && "status" in error && typeof error.status === "number" ? error.status : 500;
  const message = status < 500 && error instanceof Error ? error.message : "The request could not be completed. Please try again.";
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
