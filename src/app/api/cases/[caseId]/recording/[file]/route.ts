import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireSessionAccess, AccessError } from "@/lib/session-auth";
import { getPublicLobbyState } from "@/lib/session-store";
import { apiError } from "@/lib/api-errors";
const files: Record<string, [string,string]> = {
  'browser-film': ['vikram-final-recording-browser.webm','video/webm'],
  'film': ['vikram-final-recording.mp4','video/mp4'],
  'captions': ['vikram-final-recording.vtt','text/vtt; charset=utf-8'],
  'poster': ['vikram-final-recording-frame.png','image/png'],
};
/** The authored bonus recording is available only after the solution, never as a new clue. */
export async function GET(request: Request, context: { params: Promise<{caseId:string;file:string}> }) {
  const {caseId,file}=await context.params;
  if(caseId!=="mussoorie" || !Object.hasOwn(files,file)) return new NextResponse("Not found",{status:404});
  try {
    const sessionId=new URL(request.url).searchParams.get("sessionId");
    if(!sessionId) throw new AccessError("A game session is required",401);
    await requireSessionAccess(sessionId);
    const lobby=await getPublicLobbyState(sessionId);
    if(lobby.session.case_id!==caseId || !lobby.caseData.solution) throw new AccessError("Complete the reconstruction first");
    const [name,type]=files[file];
    const bytes=await readFile(path.join(process.cwd(),"cases/mussoorie/assets/video",name));
    const headers: Record<string,string>={"Content-Type":type,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Accept-Ranges":"bytes"};
    if(file!=="poster") headers["Content-Disposition"]=`attachment; filename="${name}"`;
    const range=request.headers.get("range");
    if(range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(range);
      if(!match || (!match[1] && !match[2])) return new NextResponse(null,{status:416,headers:{...headers,"Content-Range":`bytes */${bytes.length}`}});
      const start=match[1] ? Number(match[1]) : Math.max(0,bytes.length-Number(match[2]));
      const end=match[1] && match[2] ? Math.min(Number(match[2]),bytes.length-1) : bytes.length-1;
      if(start>end || start>=bytes.length) return new NextResponse(null,{status:416,headers:{...headers,"Content-Range":`bytes */${bytes.length}`}});
      return new NextResponse(bytes.subarray(start,end+1),{status:206,headers:{...headers,"Content-Length":String(end-start+1),"Content-Range":`bytes ${start}-${end}/${bytes.length}`}});
    }
    return new NextResponse(bytes,{headers:{...headers,"Content-Length":String(bytes.length)}});
  } catch(error){return apiError(error);}
}
