import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from '../src/engine/case-loader.ts';
import { generateInterviewReply, SAFE_DEFLECTION } from '../src/lib/interview-safety.ts';
import { buildScenarios, conditions, cueFixtures, loadSpecs, subsets } from '../scripts/evals/investigator.ts';
import { planUnlocks } from '../src/lib/interview-turn.ts';
import { rheaScenarios, SALE, CCTV } from '../scripts/evals/rhea.ts';
import { gradeInterview } from '../scripts/evals/grade-interview.ts';

const caseData = await loadCase('mussoorie');
test('quality grader catches canonical narrator fallback and does not demand an unearned admission', async () => {
  const originalFetch=globalThis.fetch;
  const originalKey=process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY='test-only';
  globalThis.fetch=async()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({issues:['MISSING_REQUIRED_ANSWER: admit the secret']})}}]}));
  try {
    const suspect=caseData.suspects.find(s=>s.id==='rhea');
    const input={context:{caseData,suspect,evidence:[],revelations:[]},proof:loadSpecs().rhea.proof,history:[],question:'Did you do it?',category:'stateful-investigation',model:'test'};
    assert.deepEqual(await gradeInterview({...input,reply:'I cannot answer that.'}),[]);
    const reaction='She stops mid-sentence. Admits she wiped the memory card.';
    const narratorSuspect={...suspect,breakingPoints:[{...suspect.breakingPoints[0],reaction}]};
    const issues=await gradeInterview({...input,context:{...input.context,suspect:narratorSuspect},reply:reaction});
    assert.equal(issues.length,1);
    assert.match(issues[0],/^STAGE_DIRECTIONS:/);
    const required=await gradeInterview({...input,reply:'I cannot answer that.',requirements:['Admit the earned fact.']});
    assert.match(required[0],/^MISSING_REQUIRED_ANSWER:/);
  } finally {
    globalThis.fetch=originalFetch;
    if(originalKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=originalKey;
  }
});
test('Rhea review covers both admission orders with valid evidence and unique scenario IDs', () => {
  assert.equal(new Set(rheaScenarios.map(s=>s.id)).size,rheaScenarios.length);
  for (const scenario of rheaScenarios) for (const turn of scenario.turns) {
    if(turn.evidence)assert.ok(caseData.evidence.some(e=>e.id===turn.evidence));
    assert.ok(turn.expectedNew.every(id=>[SALE,CCTV].includes(id)));
  }
  assert.deepEqual(rheaScenarios.find(s=>s.id==='sale-first').turns.flatMap(t=>t.expectedNew),[SALE,CCTV]);
  assert.deepEqual(rheaScenarios.find(s=>s.id==='cctv-first').turns.flatMap(t=>t.expectedNew),[CCTV,SALE]);
});
test('production planner keeps previously presented evidence, judges only the new question, and never re-fires a met condition', async () => {
  const originalFetch=globalThis.fetch;
  const originalKey=process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY='test-only';
  const requests=[];
  globalThis.fetch=async(_url,init)=>{
    requests.push(JSON.parse(init.body));
    return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({met:true,confidence:1,reason:'Clear cue'})}}]}),{status:200});
  };
  const context={caseData,suspect:caseData.suspects.find(s=>s.id==='rhea'),session:{id:'test',unlocked_evidence:caseData.evidence.map(e=>e.id)},messages:[]};
  try {
    const absent=await planUnlocks(context,'Why were you there at 5 AM?',null,[]);
    assert.equal(absent.updates.length,0);
    assert.equal(requests.length,0,'Unpresented exhibits cannot satisfy a gate');
    const first=await planUnlocks({...context,messages:[{presented_evidence_id:'building-cctv-rhea'}]},'Explain your 5 AM entry.',null,[]);
    assert.deepEqual(first.updates.filter(u=>u.outcome.fired).map(u=>u.condition.conditionId),[CCTV]);
    assert.match(requests[0].messages[1].content,/Explain your 5 AM entry/);
    assert.equal(requests.length,1,'Draft email gate remains closed');
    const next=await planUnlocks({...context,messages:[{presented_evidence_id:'building-cctv-rhea'}]},'Explain again.',null,first.updates.map(u=>u.state));
    assert.equal(next.updates.length,0);
    assert.equal(requests.length,1,'Already met conditions are not judged again');
  } finally {
    globalThis.fetch=originalFetch;
    if(originalKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=originalKey;
  }
});
test('every suspect and authored unlock has investigator conversation coverage', () => {
  const scenarios = buildScenarios(caseData);
  const specs = loadSpecs();
  for (const suspect of caseData.suspects) {
    assert.ok(specs[suspect.id]);
    for (const category of ['alibi-proof','evidence-challenge','fabricated-evidence','prompt-injection']) {
      assert.ok(scenarios.some(s=>s.suspectId===suspect.id&&s.category===category),`${suspect.id}/${category}`);
    }
    const fixtures = cueFixtures(suspect.id);
    for (const condition of conditions(caseData,suspect)) {
      assert.ok(fixtures[condition.id].some(f=>f.expected==='met'));
      assert.ok(fixtures[condition.id].some(f=>f.expected==='not-met'));
      const scenario = scenarios.find(s=>s.id===`${suspect.id}/admitted/${condition.id}`);
      assert.ok(scenario);
      assert.ok(scenario.questions.length>=2,'A follow-up must test retained admissions');
    }
  }
  for (const scenario of scenarios) for (const id of scenario.evidenceIds) assert.ok(caseData.evidence.some(e=>e.id===id),id);
});
test('compound combination generator includes every omission and the full set', () => {
  assert.deepEqual(subsets(['a','b','c']),[[],['a'],['b'],['a','b'],['c'],['a','c'],['b','c'],['a','b','c']]);
});
test('production reply wrapper withholds rejected drafts and retains authored revelations', async () => {
  const originalFetch=globalThis.fetch;
  const originalKey=process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY='test-only';
  const requests=[];
  const outputs=['Unapproved confession', '{"safe":false}', 'Rejected repair', '{"safe":false}', 'Another unapproved confession', '{"safe":false}', 'Rejected repair', '{"safe":false}', 'I am a hotel owner.', '{"safe":true}'];
  globalThis.fetch=async(_url,init)=>{
    requests.push(JSON.parse(init.body));
    return new Response(JSON.stringify({choices:[{message:{content:outputs.shift()}}]}),{status:200,headers:{'Content-Type':'application/json'}});
  };
  try {
    const context={caseData,suspect:caseData.suspects.find(s=>s.id==='bisht'),evidence:[],revelations:['An approved admission']};
    const input={context,question:'Explain.',recentConversation:Array.from({length:20},(_,i)=>({role:'user',content:`Question ${i}`})),newlyRevealed:['An approved admission'],model:'test-model'};
    const first=await generateInterviewReply(input);
    assert.equal(first.reply,'An approved admission');
    assert.equal(first.valid,false);
    assert.equal(JSON.parse(requests[0].messages[1].content).recentConversation.length,12);
    const followup=await generateInterviewReply({...input,newlyRevealed:[]});
    assert.equal(followup.reply,SAFE_DEFLECTION);
    const accepted=await generateInterviewReply({...input,newlyRevealed:[]});
    assert.equal(accepted.reply,'I am a hotel owner.');
    assert.equal(accepted.valid,true);
  } finally {
    globalThis.fetch=originalFetch;
    if(originalKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=originalKey;
  }
});
