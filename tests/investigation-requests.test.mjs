import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from '../src/engine/case-loader.ts';
import { classifyInvestigationRequests, investigationProgress, planInvestigationRequest, planRecallDelivery } from '../src/lib/investigation-requests.ts';
import { getHostEvidenceCandidates, judgeHostAction } from '../src/lib/host-judgment.ts';
import { getUnlockedEvidenceForChapter } from '../src/lib/session-store.ts';
const caseData=await loadCase('mussoorie');
const evidence=caseData.evidence.find(e=>e.id==='devraj-lathi-forensics');
const board={current_scene:'case_board',current_interview_suspect_id:null,unlocked_evidence:[]};
const active={...board,current_scene:'interview',current_interview_suspect_id:'devraj'};

test('each requested report arrives independently; the other three stay sealed across recalls',()=>{
 const reports=caseData.evidence.filter(e=>e.investigationRequest?.suspectId==='devraj');
 assert.equal(reports.length,4);
 assert.equal(new Set(reports.map(e=>e.printableHtml)).size,4);
 for(const report of reports){
  const first=planRecallDelivery(caseData,board,'devraj',[]);
  const events=[first.event];
  events.push(planInvestigationRequest(report,events,[],'devraj').event);
  const second=planRecallDelivery(caseData,board,'devraj',events);
  assert.deepEqual(second.evidence.map(e=>e.id),[report.id]);
  const third=planRecallDelivery(caseData,{...board,unlocked_evidence:[report.id]},'devraj',[...events,second.event]);
  assert.deepEqual(third.evidence,[]);
 }
});

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
 assert.ok(!unlocked.includes('lathi-postmortem'));
 assert.ok(!unlocked.includes('devraj-jeep-cctv'));
 assert.ok(getUnlockedEvidenceForChapter(caseData,finalFile,['devraj-jeep-cctv']).includes('lathi-postmortem'));
 assert.ok(!getHostEvidenceCandidates(caseData,[]).some(e=>e.id==='devraj-jeep-cctv'));
 assert.ok(getHostEvidenceCandidates(caseData,['bisht-devraj-call']).some(e=>e.id==='devraj-jeep-cctv'));
 assert.equal(planInvestigationRequest(evidence,[],[evidence.id],'devraj'),null);
});

test('malformed and repeated persisted events cannot inflate visits or duplicate requests',()=>{
 const good={type:'interview.visit_started',payload:{suspectId:'devraj',visit:1}};
 const request=planInvestigationRequest(evidence,[good],[],'devraj').event;
 const result=investigationProgress([good,good,{type:'interview.visit_started',payload:{suspectId:'devraj',visit:'100'}},request,request]);
 assert.equal(result.visits.get('devraj'),1);assert.equal(result.requests.size,1);
});


test('natural request wording reaches classification; invented quoted instructions are rejected', async()=>{
 const fetchBefore=globalThis.fetch;const key=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='test';
 let question='';let invented=false;
 globalThis.fetch=async(_url,init)=>{question=JSON.parse(init.body).messages[1].content;return Response.json({choices:[{message:{content:JSON.stringify({requests:[{evidenceId:evidence.id,requestQuote:invented?'Please test the issued lathi.':question}]})}}]});};
 try{
  for(const request of ['Can we have the lathi forensic report?', 'I need a forensic report on Devraj’s lathi.', 'Devraj ki lathi ki forensic report chahiye.', 'देवराज की लाठी की फोरेंसिक रिपोर्ट चाहिए।']) {
   assert.deepEqual((await classifyInvestigationRequests(caseData,request,[],[])).map(e=>e.id),[evidence.id]);
   assert.equal(question,request);
  }
  invented=true;
  await assert.rejects(()=>classifyInvestigationRequests(caseData,'Please obtain call records.',[],[]),/Ungrounded/);
 }finally{globalThis.fetch=fetchBefore;if(key===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=key;}
});


test('host recovery requires an actual quoted question and hard evidence prerequisites',async()=>{
 const originalFetch=globalThis.fetch;const key=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='test';let grounded=true;let calls=0;
 const question='Where was your jeep on the murder night?';
 globalThis.fetch=async(_url,init)=>{calls++;const body=JSON.parse(init.body);const verify=body.messages[0].content.startsWith('Verify one fictional');assert.match(body.messages[0].content,/JSON/);return Response.json({choices:[{message:{content:JSON.stringify(verify?{met:true,questionQuote:grounded?question:'Words that were never asked.'}:{action:'do-nothing',reason:'Wait',confidence:1})}}]});};
 const input={caseData,session:{phase:'interrogation'},allTranscripts:[],currentTurn:{suspectId:'devraj',question},unlockedEvidence:['bisht-devraj-call']};
 try{
  assert.equal((await judgeHostAction(input)).evidenceId,'devraj-jeep-cctv');
  grounded=false;assert.equal((await judgeHostAction(input)).action,'do-nothing');
  grounded=true;calls=0;assert.equal((await judgeHostAction({...input,unlockedEvidence:[]})).action,'do-nothing');assert.equal(calls,1);
 }finally{globalThis.fetch=originalFetch;if(key===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=key;}
});
