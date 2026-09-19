/** Local database integration, with deterministic model responses. Removes only its own session. */
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createSupabaseServerClient } from '../../src/lib/supabase.ts';
import { createSession, joinSessionByCode, startSession, advanceSessionChapter, setSessionScene, getLobbyState, getPublicLobbyState, loadInvestigationEvents, setSessionInterviewer, getInterrogationEntryChapter, commitGameUpdate } from '../../src/lib/session-store.ts';
import { executeInterview, listHostHelp, applyHostHelp } from '../../src/lib/interview-turn.ts';
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
 // Merely opening and returning to an unanswered interview never creates a second visit.
 await leave();await enter();
 assert.equal((await loadInvestigationEvents(session.id)).filter(e=>e.type==='interview.visit_started').length,1);
 await setSessionInterviewer({sessionId:session.id,playerId:joined.player.id});
 // Exhaust ordinary discoveries: generic host assistance must not offer or queue any deferred report.
 await commitGameUpdate((await getLobbyState(session.id)).session,{patch:{unlocked_evidence:c.evidence.filter(e=>!e.investigationRequest).map(e=>e.id)}});
 assert.ok(!(await listHostHelp(session.id)).some(h=>h.label==='Request the next forensic update'));
 for(const report of c.evidence.filter(e=>e.investigationRequest)){
  const helpId=createHash('sha256').update(`${session.id}:devraj:forensic:${report.id}`).digest('hex');
  await assert.rejects(()=>applyHostHelp(session.id,helpId),/no longer available/);
 }
 assert.ok(!(await loadInvestigationEvents(session.id)).some(e=>e.type==='investigation.requested'));
 const turn=await executeInterview({sessionId:session.id,playerId:joined.player.id,question:'Please obtain Devraj’s handset location history.',requestId:randomUUID()});
 assert.ok(turn.systemMessages.some(m=>m.content.startsWith('Investigation requested:')));
 assert.ok(!turn.session.unlocked_evidence.includes(evidenceId));
 assert.ok(!(await getPublicLobbyState(session.id)).caseData.evidence.some(e=>e.id===evidenceId));
 await enter();assert.ok(!(await getLobbyState(session.id)).session.unlocked_evidence.includes(evidenceId));
 await leave();
 const beforeBlocked=(await getLobbyState(session.id)).session;
 const beforeEvents=(await loadInvestigationEvents(session.id)).length;
 await assert.rejects(enter,/Interview every suspect once/);
 await assert.rejects(()=>setSessionScene({sessionId:session.id,scene:'interview',chapterId:chapter.id,actorPlayerId:joined.player.id}),/Interview every suspect once/);
 assert.equal((await getLobbyState(session.id)).session.revision,beforeBlocked.revision);
 assert.equal((await loadInvestigationEvents(session.id)).length,beforeEvents);
 assert.ok(!(await getPublicLobbyState(session.id)).caseData.evidence.some(e=>e.id===evidenceId));
 const otherChapters=c.chapters.filter(x=>x.type==='interview'&&x.suspectId!=='devraj');
 for(const [index,other] of otherChapters.entries()){
  await setSessionScene({sessionId:session.id,scene:'interview',chapterId:other.id});
  // Opening even the last remaining suspect is not enough; an answer must be recorded.
  await assert.rejects(enter,/Interview every suspect once/);
  if(index>0)await assert.rejects(()=>setSessionScene({sessionId:session.id,scene:'interview',chapterId:otherChapters[0].id}),/Interview every suspect once/);
  await setSessionInterviewer({sessionId:session.id,playerId:joined.player.id});
  await executeInterview({sessionId:session.id,playerId:joined.player.id,question:'Where were you that evening?',requestId:randomUUID()});
 }
 await enter();assert.ok((await getLobbyState(session.id)).session.unlocked_evidence.includes(evidenceId));
 const revealed=(await getPublicLobbyState(session.id)).caseData.evidence;
 assert.deepEqual(revealed.filter(e=>c.evidence.find(original=>original.id===e.id)?.investigationRequest).map(e=>e.id),[evidenceId]);
 const count=(await loadInvestigationEvents(session.id)).length;await enter();assert.equal((await loadInvestigationEvents(session.id)).length,count);
 evidenceId='devraj-lathi-forensics';
 await executeInterview({sessionId:session.id,playerId:joined.player.id,question:'Please examine Devraj’s issued lathi for blood.',requestId:randomUUID()});
 assert.ok(!(await getLobbyState(session.id)).session.unlocked_evidence.includes(evidenceId));
 await leave();await enter();assert.ok((await getLobbyState(session.id)).session.unlocked_evidence.includes(evidenceId));
 const unrequested=['bisht-devraj-call','devraj-duty-log'];
 assert.ok(!(await getPublicLobbyState(session.id)).caseData.evidence.some(e=>unrequested.includes(e.id)));
 console.log('PASS: all six suspects answered before recalls; host and player recall attempts blocked without changes; unfinished interviews resume; requested reports stay sealed until an allowed recall; separate request-only reports, no host-help bypass, and late requests wait until third.');
}finally{
 globalThis.fetch=originalFetch;if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;
 if(session){const {error}=await db.from('sessions').delete().eq('id',session.id);if(error)throw error;}
}
