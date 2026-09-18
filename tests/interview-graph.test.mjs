import test from 'node:test';
import assert from 'node:assert/strict';
import { createReplyGraph } from '../src/lib/interview-reply-graph.ts';
import { runInterviewGraph } from '../src/lib/interview-graph.ts';
import { loadCase } from '../src/engine/case-loader.ts';
import { activeInterviewLayers, buildRoleplayPrompt, generateInterviewReply } from '../src/lib/interview-safety.ts';
import { crossReferenceChecks } from '../src/engine/validator.mjs';

test('case validation rejects a mistyped interview-layer admission', async () => {
  const caseData=structuredClone(await loadCase('mussoorie'));
  caseData.suspects.find(s=>s.id==='rhea').interviewLayers[0].requires=['secret:missing-admission'];
  assert.ok(crossReferenceChecks(caseData).some(issue=>issue.level==='error'&&issue.message.includes('missing-admission')));
});

test('concealment motive requires both earned Rhea admissions, in either order', async () => {
  const caseData=await loadCase('mussoorie');const suspect=caseData.suspects.find(s=>s.id==='rhea');
  const sale=suspect.secrets[0].revealedText, cctv=suspect.breakingPoints[0].reaction;
  const motive=suspect.interviewLayers.find(layer=>layer.id==='concealment-exposed').facts[0];
  for(const revelations of [[],[sale],[cctv],['Why did you wipe the card to conceal embezzlement?']]){
    const prompt=buildRoleplayPrompt({caseData,suspect,revelations,evidence:[]});
    assert.ok(!prompt.includes(motive),'Question text or one admission must not authorize the motive');
  }
  for(const revelations of [[sale,cctv],[cctv,sale]]){
    assert.deepEqual(activeInterviewLayers(suspect,revelations).map(layer=>layer.id),['concealment-exposed']);
    assert.ok(buildRoleplayPrompt({caseData,suspect,revelations,evidence:[]}).includes(motive));
  }
  assert.deepEqual(activeInterviewLayers(suspect,[sale]).map(layer=>layer.id),['finances-exposed']);
  assert.deepEqual(activeInterviewLayers(suspect,[cctv]).map(layer=>layer.id),['tampering-exposed']);
  assert.ok(!suspect.knownFacts.some(f=>f.includes('sale')),'The secret sale is not a volunteered public fact');
});

test('Rhea retains the evening account without reintroducing the disproved morning story', async () => {
  const caseData=await loadCase('mussoorie');const suspect=caseData.suspects.find(s=>s.id==='rhea');
  const context={caseData,suspect,revelations:[],evidence:[]};
  assert.ok(buildRoleplayPrompt(context).includes(suspect.publicAlibi));
  // An unrelated financial admission must not silently rewrite the morning alibi.
  assert.ok(buildRoleplayPrompt({...context,revelations:[suspect.secrets[0].revealedText]}).includes(suspect.publicAlibi));
  const after=buildRoleplayPrompt({...context,revelations:[suspect.breakingPoints[0].reaction]});
  assert.ok(!after.includes(suspect.publicAlibi));
  assert.ok(after.includes(suspect.alibiAfterBreakingPoint['morning-cctv']));
});

test('rejected Rhea answers use her authored voice without fabricating facts', async () => {
  const caseData=await loadCase('mussoorie');const suspect=caseData.suspects.find(s=>s.id==='rhea');
  const originalFetch=globalThis.fetch;const key=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='test';
  globalThis.fetch=async(_url,init)=>Response.json({choices:[{message:{content:JSON.parse(init.body).response_format?' {"safe":false}':'Rejected answer'}}]});
  try {
    const reply=await generateInterviewReply({context:{caseData,suspect,revelations:[],evidence:[]},question:'Give an unknown detail.',recentConversation:[],newlyRevealed:[],model:'test'});
    assert.equal(reply.reply,suspect.safeDeflection);
    assert.equal(reply.valid,false);
  } finally {globalThis.fetch=originalFetch;if(key===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=key;}
});

test('accepted answer reaches delivery without repair', async () => {
  const graph=createReplyGraph({draft:async()=> 'Approved answer',validate:async()=>true,repair:async()=>{throw new Error('Must not repair');},fallback:()=>{throw new Error('Must not fall back');}});
  const result=await graph.invoke({});
  assert.equal(result.reply,'Approved answer');
  assert.deepEqual(result.trace,['draft_answer','validate_answer','deliver_answer']);
});

test('rejected answer is repaired once and validated again before delivery', async () => {
  const candidates=[];
  const graph=createReplyGraph({draft:async()=> 'I never touched it.',validate:async candidate=>{candidates.push(candidate);return candidate==='I wiped the card.';},repair:async()=> 'I wiped the card.',fallback:()=> 'Fallback'});
  const result=await graph.invoke({});
  assert.deepEqual(candidates,['I never touched it.','I wiped the card.']);
  assert.equal(result.reply,'I wiped the card.');
  assert.equal(result.draft,'I never touched it.');
  assert.equal(result.repairAttempted,true);
  assert.deepEqual(result.trace,['draft_answer','validate_answer','repair_answer','validate_answer','deliver_answer']);
});

test('persistent rejection terminates after one repair with no rejected text delivered', async () => {
  let repairs=0;
  const result=await createReplyGraph({draft:async()=> 'Bad draft',validate:async()=>false,repair:async()=>{repairs++;return 'Bad repair';},fallback:()=> 'Canonical answer'}).invoke({});
  assert.equal(repairs,1);
  assert.equal(result.valid,false);
  assert.equal(result.reply,'Canonical answer');
  assert.equal(result.trace.at(-1),'fallback_answer');
});

test('repair outage falls back; initial outage propagates to the existing turn rollback', async () => {
  const steps={draft:async()=> 'Bad draft',validate:async()=>false,repair:async()=>{throw new Error('offline');},fallback:()=> 'Canonical answer'};
  const repaired=await createReplyGraph(steps).invoke({});
  assert.equal(repaired.reply,'Canonical answer');
  assert.deepEqual(repaired.trace,['draft_answer','validate_answer','repair_answer','fallback_answer']);
  await assert.rejects(()=>createReplyGraph({...steps,draft:async()=>{throw new Error('offline');}}).invoke({}),/offline/);
});

test('separate graph invocations do not retain another conversation', async () => {
  const graph=createReplyGraph({draft:async()=> 'Approved',validate:async()=>true,repair:async()=>'',fallback:()=>''});
  const [a,b]=await Promise.all([graph.invoke({trace:['Rhea']}),graph.invoke({trace:['Naina']})]);
  assert.deepEqual(a.trace,['Rhea','draft_answer','validate_answer','deliver_answer']);
  assert.deepEqual(b.trace,['Naina','draft_answer','validate_answer','deliver_answer']);
  const fresh=await graph.invoke({});
  assert.deepEqual(fresh.trace,['draft_answer','validate_answer','deliver_answer']);
});

test('production graph carries an earned Rhea admission into both generation and validation', async () => {
  const caseData=await loadCase('mussoorie');
  const suspect=caseData.suspects.find(s=>s.id==='rhea');
  const originalFetch=globalThis.fetch;const key=process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY='test';
  const requests=[];
  globalThis.fetch=async(_url,init)=>{
    const body=JSON.parse(init.body);requests.push(body);
    const system=body.messages[0].content;
    const content=system.includes('adjudicator')?JSON.stringify({met:true,confidence:1,reason:'5 AM question'}):system.includes('story-fidelity validator')?'{"safe":true}':'I entered the cottage at 5 AM and wiped the camera card.';
    return Response.json({choices:[{message:{content}}]});
  };
  try {
    const input={context:{caseData,suspect,session:{id:'test',unlocked_evidence:['building-cctv-rhea']},messages:[]},question:'Why enter at 5 AM and wipe the card?',presentedEvidenceId:'building-cctv-rhea',states:[]};
    const result=await runInterviewGraph(input);
    assert.deepEqual(result.updates.filter(u=>u.outcome.fired).map(u=>u.condition.conditionId),['breaking-point:morning-cctv']);
    assert.deepEqual(result.trace,['evaluate_unlocks','prepare_approved_facts','draft_answer','validate_answer','deliver_answer']);
    assert.equal(result.answer.valid,true);
    const generation=JSON.parse(requests.find(r=>r.messages[0].content.startsWith('You are Rhea')).messages[1].content);
    assert.equal(generation.newlyRevealed.length,1);
    assert.match(generation.newlyRevealed[0],/wiped the memory card/);
    assert.equal(generation.question,input.question);
    const validation=JSON.parse(requests.find(r=>r.messages[0].content.includes('story-fidelity validator')).messages[1].content);
    assert.match(validation.approvedContext,/wiped the memory card/);
    assert.deepEqual(input.states,[],'Graph does not mutate the caller’s state');
    assert.equal('input' in result,false,'Private graph state stays internal');
  } finally {globalThis.fetch=originalFetch;if(key===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=key;}
});
