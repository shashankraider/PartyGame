import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from '../src/engine/case-loader.ts';
import { classifyInvestigationRequests, investigationProgress, planInvestigationRequest, planRecallDelivery } from '../src/lib/investigation-requests.ts';
import { getHostEvidenceCandidates } from '../src/lib/host-judgment.ts';
import { getUnlockedEvidenceForChapter } from '../src/lib/session-store.ts';
const caseData=await loadCase('mussoorie');
const evidence=caseData.evidence.find(e=>e.id==='devraj-lathi-forensics');
const board={current_scene:'case_board',current_interview_suspect_id:null,unlocked_evidence:[]};
const active={...board,current_scene:'interview',current_interview_suspect_id:'devraj'};

test('request in first visit remains sealed until an actual recall, once only',()=>{
 const first=planRecallDelivery(caseData,board,'devraj',[]);assert.equal(first.evidence.length,0);
 const events=[first.event];
 const request=planInvestigationRequest(evidence,events,[],'devraj');events.push(request.event);
 assert.doesNotMatch(request.message,/matching Vikram|DK-17|blood was|8:21/);
 assert.equal(planRecallDelivery(caseData,active,'devraj',events),null);
 assert.equal(planRecallDelivery(caseData,board,'rhea',events),null);
 assert.equal(planInvestigationRequest(evidence,events,[],'devraj'),null);
 const persisted=JSON.parse(JSON.stringify(events));
 const recall=planRecallDelivery(caseData,board,'devraj',persisted);
 assert.equal(recall.event.payload.visit,2);assert.deepEqual(recall.evidence.map(e=>e.id),[evidence.id]);
 assert.deepEqual(planRecallDelivery(caseData,{...board,unlocked_evidence:[evidence.id]},'devraj',[...events,recall.event]).evidence,[]);
});

test('request on second visit waits until third; no request means no delivery',()=>{
 const events=[{type:'interview.visit_started',payload:{suspectId:'devraj',visit:2}}];
 assert.deepEqual(planRecallDelivery(caseData,board,'devraj',events).evidence,[]);
 events.push(planInvestigationRequest(evidence,events,[],'devraj').event);
 assert.equal(planRecallDelivery(caseData,active,'devraj',events),null);
 const recall=planRecallDelivery(caseData,board,'devraj',events);
 assert.equal(recall.event.payload.visit,3);assert.equal(recall.evidence.length,1);
});

test('a request from another interview cannot reveal the result in Devraj’s first interview',()=>{
 const request=planInvestigationRequest(evidence,[],[],'bisht');
 const first=planRecallDelivery(caseData,board,'devraj',[request.event]);assert.deepEqual(first.evidence,[]);
 assert.equal(planRecallDelivery(caseData,board,'devraj',[request.event,first.event]).evidence.length,1);
});

test('legacy active interview request anchors the first visit without an old visit event',()=>{
 const request=planInvestigationRequest(evidence,[],[],'devraj');
 assert.equal(planRecallDelivery(caseData,board,'devraj',[request.event]).evidence.length,1);
});

test('requests do not masquerade as unlocked evidence or chapter rewards',()=>{
 const pending=[evidence.id];
 assert.ok(!getHostEvidenceCandidates(caseData,[],pending).some(e=>e.id===evidence.id));
 const finalFile=caseData.chapters.find(c=>c.id==='r4-evidence');
 const unlocked=getUnlockedEvidenceForChapter(caseData,finalFile,[]);
 for(const e of caseData.evidence.filter(e=>e.investigationRequest))assert.ok(!unlocked.includes(e.id));
 assert.ok(unlocked.includes('lathi-postmortem'));
 assert.equal(planInvestigationRequest(evidence,[],[evidence.id],'devraj'),null);
});

test('malformed and repeated persisted events cannot inflate visits or duplicate requests',()=>{
 const good={type:'interview.visit_started',payload:{suspectId:'devraj',visit:1}};
 const request=planInvestigationRequest(evidence,[good],[],'devraj').event;
 const result=investigationProgress([good,good,{type:'interview.visit_started',payload:{suspectId:'devraj',visit:'100'}},request,request]);
 assert.equal(result.visits.get('devraj'),1);assert.equal(result.requests.size,1);
});


test('bare allegations do not call the request classifier; invented quoted instructions are rejected', async()=>{
 const fetchBefore=globalThis.fetch;const key=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='test';
 let calls=0;
 globalThis.fetch=async()=>{calls++;return Response.json({choices:[{message:{content:JSON.stringify({requests:[{evidenceId:evidence.id,requestQuote:'Please test the issued lathi.'}]})}}]});};
 try{
  assert.deepEqual(await classifyInvestigationRequests(caseData,'Your phone was there and the DNA proves it. Confess.',[],[]),[]);
  assert.deepEqual(await classifyInvestigationRequests(caseData,'Where were you at eight? Why did you leave?',[],[]),[]);
  assert.equal(calls,0);
  await assert.rejects(()=>classifyInvestigationRequests(caseData,'Please obtain call records.',[],[]),/Ungrounded/);
 }finally{globalThis.fetch=fetchBefore;if(key===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=key;}
});
