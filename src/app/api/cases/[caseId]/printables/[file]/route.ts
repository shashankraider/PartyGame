import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { requireSessionAccess, AccessError } from "@/lib/session-auth";
import { getPublicLobbyState } from "@/lib/session-store";
import { EVIDENCE_ART } from "@/lib/evidence-art";
import { apiError } from "@/lib/api-errors";
const CASE_ID = /^[a-z0-9][a-z0-9-]*$/;
const PRINTABLE_FILE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.html$/;

type RouteContext = {
  params: Promise<{ caseId: string; file: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { caseId, file } = await context.params;

  if (!CASE_ID.test(caseId) || !PRINTABLE_FILE.test(file)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const printablesRoot = path.resolve(process.cwd(), "cases", caseId, "printables");
  const resolved = path.resolve(printablesRoot, file);

  if (!resolved.startsWith(printablesRoot + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const sessionId = new URL(request.url).searchParams.get('sessionId');
    if (!sessionId) throw new AccessError('A game session is required',401);
    await requireSessionAccess(sessionId);
    const lobby = await getPublicLobbyState(sessionId);
    if (lobby.session.case_id !== caseId || !lobby.caseData.evidence.some(e => e.printableHtml === `printables/${file}` || e.printableHtml === file)) throw new AccessError('This exhibit has not been unlocked');
    let html = await readFile(resolved, "utf8");
    const exhibit = lobby.caseData.evidence.find(e => e.printableHtml === `printables/${file}` || e.printableHtml === file);
    if (caseId === "mussoorie" && exhibit && Object.hasOwn(EVIDENCE_ART,exhibit.id)) {
      html = html.replaceAll("__EVIDENCE_IMAGE__", `/api/cases/${caseId}/evidence/${exhibit.id}/image?sessionId=${encodeURIComponent(sessionId)}`);
    }
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
