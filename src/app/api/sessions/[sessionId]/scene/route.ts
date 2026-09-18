import { NextResponse } from "next/server";
import { requireSessionAccess, checkRequestOrigin, AccessError } from "@/lib/session-auth";
import { apiError } from "@/lib/api-errors";
type Context = { params: Promise<{ sessionId: string }> };
const json = (data: unknown) => NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
import { advanceInvestigationFile, advanceSessionChapter, endSession, pauseSession, resumeSession, setSessionScene, transitionSessionPhase, getPublicLobbyState, getLobbyState } from "@/lib/session-store";
export async function POST(request: Request, context: Context) {
  try {
    checkRequestOrigin(request);
    const { sessionId } = await context.params;
    const actor = await requireSessionAccess(sessionId);
    const body = await request.json();
    const { session } = await getLobbyState(sessionId);
    if (!actor.isHost && !(actor.playerId && actor.playerId === session.current_interviewer_player_id && body.action === 'set' && body.scene === 'interview')) throw new AccessError('Only the host or active interviewer can do that');
    switch(body.action) {
      case 'next-file': await advanceInvestigationFile(sessionId); break;
      case 'next': case 'previous': await advanceSessionChapter(sessionId,body.action); break;
      case 'set': await setSessionScene({ sessionId, scene: body.scene, chapterId: body.chapterId, actorPlayerId: actor.isHost ? undefined : actor.playerId! }); break;
      case 'pause': await pauseSession(sessionId); break;
      case 'resume': await resumeSession(sessionId); break;
      case 'open-accusation': await transitionSessionPhase({ sessionId, targetPhase: 'accusation' }); break;
      case 'end-session': await endSession(sessionId); break;
      default: throw new AccessError('Invalid scene action',400);
    }
    return json(await getPublicLobbyState(sessionId));
  } catch(error) { return apiError(error); }
}
