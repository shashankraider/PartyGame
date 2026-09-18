import { EVIDENCE_ART } from "@/lib/evidence-art";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireSessionAccess, AccessError } from "@/lib/session-auth";
import { getPublicLobbyState } from "@/lib/session-store";
import { apiError } from "@/lib/api-errors";

/** Evidence artwork is private; never serve it through the public scenery route. */
export async function GET(request: Request, context: { params: Promise<{ caseId: string; evidenceId: string }> }) {
  const { caseId, evidenceId } = await context.params;
  // Fixed asset mapping avoids arbitrary filesystem access and accidental future-art exposure.
  if (caseId !== "mussoorie" || !Object.hasOwn(EVIDENCE_ART, evidenceId)) return new NextResponse("Not found", { status: 404 });
  try {
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!sessionId) throw new AccessError("A game session is required", 401);
    await requireSessionAccess(sessionId);
    const lobby = await getPublicLobbyState(sessionId);
    if (lobby.session.case_id !== caseId || !lobby.caseData.evidence.some(item => item.id === evidenceId)) throw new AccessError("This exhibit has not been unlocked");
    const detail = new URL(request.url).searchParams.get("detail");
    const filename = evidenceId === "crime-scene-summary" && detail === "railing" ? "railing-detail.png" : evidenceId === "crime-scene-summary" && detail === "tripod" ? "tripod-detail.png" : EVIDENCE_ART[evidenceId];
    const bytes = await readFile(path.join(process.cwd(), "cases/mussoorie/assets/crime-scene", filename));
    return new NextResponse(bytes, { headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return apiError(error); }
}
