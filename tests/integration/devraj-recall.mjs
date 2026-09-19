/** Local database integration, with deterministic model responses. Removes only its own session. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createSupabaseServerClient } from '../../src/lib/supabase.ts';
import { createSession, joinSessionByCode, startSession, advanceSessionChapter, setSessionScene, getLobbyState, getPublicLobbyState, loadInvestigationEvents, setSessionInterviewer, getInterrogationEntryChapter } from '../../src/lib/session-store.ts';
import { executeInterview } from '../../src/lib/interview-turn.ts';
import { loadCase } from '../../src/engine/case-loader.ts';
if(!['localhost','127.0.0.1'].includes(new URL(process.env.SUPABASE_URL).hostname))throw Error('Local database required');
const db=createSupabaseServerClient();const originalFetch=globalThis.fetch;const oldKey=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='local-test';
let evidenceId='devraj-phone-location';let session;
globalThis.fetch=async(url,init)=>{
 if(!String(url).startsWith('https://openrouter.ai/'))return originalFetch(url,init);
 const body=JSON.parse(init.body);const system=body.messages[0].content;
 let content='Inspector Devraj Khanna, sir.';
 if(system.includes('Classify explicit CBI'))content=JSON.stringify({requests:[{evidenceId,requestQuote:body.messages[1].content}]});
 else if(system.includes('Your job: judge'))content=JSON.stringify({action:'do-nothing',reason:'No immediate report',confidence:1});
 else if(system.includes('Verify one forensic'))content='{"met":true}';
 else if(system.includes('strict safety'))content='{"safe":true}';
 else if(body.response_format)content='{"met":false,"confidence":1,"proximity":0,"reason":"No admission"}';
 return Response.json({choices:[{message:{content}}]});
};
try{
 session=await createSession('mussoorie','solo',randomUUID());
 const joined=await joinSessionByCode({joinCode:session.join_code,name:'Recall test detective',deviceId:randomUUID()});
 await startSession(session.id);
 for(let i=0;i<12;i++){const g=await getLobbyState(session.id);if(g.session.phase==='interrogation')break;await advanceSessionChapter(session.id,'next');}
 const c=await loadCase('mussoorie');const chapter=c.chapters.find(x=>x.type==='interview'&&x.suspectId==='devraj');const board=getInterrogationEntryChapter(c);
 const enter=()=>setSessionScene({sessionId:session.id,scene:'interview',chapterId:chapter.id});
 const leave=()=>setSessionScene({sessionId:session.id,scene:'case_board',chapterId:board.id});
 await enter();
 await setSessionInterviewer({sessionId:session.id,playerId:joined.player.id});
 const turn=await executeInterview({sessionId:session.id,playerId:joined.player.id,question:'Please obtain Devraj’s handset location history.',requestId:randomUUID()});
 assert.ok(turn.systemMessages.some(m=>m.content.startsWith('Investigation requested:')));
 assert.ok(!turn.session.unlocked_evidence.includes(evidenceId));
 assert.ok(!(await getPublicLobbyState(session.id)).caseData.evidence.some(e=>e.id===evidenceId));
 await enter();assert.ok(!(await getLobbyState(session.id)).session.unlocked_evidence.includes(evidenceId));
 await leave();await enter();assert.ok((await getLobbyState(session.id)).session.unlocked_evidence.includes(evidenceId));
 const count=(await loadInvestigationEvents(session.id)).length;await enter();assert.equal((await loadInvestigationEvents(session.id)).length,count);
 evidenceId='devraj-lathi-forensics';
 await executeInterview({sessionId:session.id,playerId:joined.player.id,question:'Please examine Devraj’s issued lathi for blood.',requestId:randomUUID()});
 assert.ok(!(await getLobbyState(session.id)).session.unlocked_evidence.includes(evidenceId));
 await leave();await enter();assert.ok((await getLobbyState(session.id)).session.unlocked_evidence.includes(evidenceId));
 console.log('PASS: atomic request persistence, sealed public evidence, no same-view recall, delivery on second interview, idempotent reopening, late request waits until third.');
}finally{
 globalThis.fetch=originalFetch;if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;
 if(session){const {error}=await db.from('sessions').delete().eq('id',session.id);if(error)throw error;}
}
