/** Live suspect conversations through the production reply+validation path; no game database writes. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { loadCase } from '../src/engine/case-loader';
import { generateInterviewReply, SAFE_DEFLECTION } from '../src/lib/interview-safety';
import { gradeInterview, calibrateGrader } from './evals/grade-interview';
import { judgeUnlock } from '../src/lib/adjudicator';
import { advanceUnlockState } from '../src/lib/interview-turn';
import { listPendingConditions } from '../src/lib/interview-unlocks';
import type { InterviewUnlockStateRow } from '../src/lib/supabase';
import { buildScenarios, conditions, cueFixtures, loadSpecs, subsets, type Scenario } from './evals/investigator';

if (existsSync('.env.local')) for (const [k,v] of Object.entries(parseEnv(readFileSync('.env.local','utf8')))) process.env[k] ??= v;
const args = process.argv.slice(2);
const option = (name: string, fallback: string) => { const i=args.indexOf(name); return i < 0 ? fallback : args[i+1]; };
const live = args.includes('--live');
const skipCues = args.includes('--skip-cues');
let complete = false;
const selected = option('--suspect','all');
const repeat = Number(option('--repeat','1'));
const concurrency = Number(option('--concurrency','3'));
const category = option('--category','all');
if (!Number.isInteger(repeat) || repeat < 1 || repeat > 10 || !Number.isInteger(concurrency) || concurrency < 1 || concurrency > 6) throw new Error('Use repeat 1–10 and concurrency 1–6');
const c = await loadCase('mussoorie');
if(selected !== 'all' && !c.suspects.some(s=>s.id===selected)) throw new Error(`Unknown suspect: ${selected}`);
const specs = loadSpecs();
const allScenarios = buildScenarios(c);
if(category !== 'all' && !allScenarios.some(s=>s.category===category)) throw new Error(`Unknown category: ${category}`);
const scenarios = allScenarios.filter(s=>(selected==='all'||s.suspectId===selected)&&(category==='all'||s.category===category));
const model = c.llm?.modelOverride ?? process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini';
const graderModel = process.env.EVAL_GRADER_MODEL ?? 'openai/gpt-4.1';
const calibration = live ? await calibrateGrader({caseData:c,suspect:c.suspects.find(s=>s.id==='rhea')!,revelations:[],evidence:[]},specs.rhea.proof,graderModel) : [];
if(calibration.some(c=>!c.passed)) throw new Error(`Grader calibration failed: ${JSON.stringify(calibration)}`);
const output = path.resolve(option('--out',`output/evals/investigators-${new Date().toISOString().replace(/[:.]/g,'-')}.json`));
mkdirSync(path.dirname(output),{recursive:true});
type Turn = { question: string; reply: string; draft: string; productionAccepted: boolean; fallback: boolean; issues: string[]; error?: string };
type Result = { id: string; suspectId: string; category: string; repeat: number; passed: boolean; turns: Turn[] };
const results: Result[] = [];
const gaps: {suspectId:string;claim:string;missingEvidenceId:string;note:string}[] = [];
let offlineChecks = 0;
let liveCueChecks = 0;
const cueFailures: string[] = [];
const configurationErrors: string[] = [];
// An absent API key is acceptable only for deterministic gates that never call the provider.
if (!live) process.env.OPENROUTER_API_KEY ??= 'offline-eval-no-provider';
if (live && !process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is required for --live');
const startedAt = new Date().toISOString();
function save() {
  writeFileSync(output,JSON.stringify({startedAt,updatedAt:new Date().toISOString(),status:complete?'complete':'running',model,graderModel,live,skipCues,
    caseHash:createHash('sha256').update(JSON.stringify(c)).digest('hex'),
    promptHash:createHash('sha256').update(readFileSync('src/lib/interview-safety.ts')).digest('hex'),
    scope:{selected,category,repeat,plannedConversations:scenarios.length*repeat},offlineChecks,liveCueChecks,
    calibration,configurationErrors,contentGaps:gaps,cueFailures,results,
    summary:{conversations:results.length,passed:results.filter(r=>r.passed).length,turns:results.reduce((n,r)=>n+r.turns.length,0),failed:results.filter(r=>!r.passed).length}},null,2)+'\n');
}
for (const suspect of c.suspects.filter(s=>selected==='all'||s.id===selected)) {
  const proof = specs[suspect.id].proof;
  if (!c.evidence.some(e=>e.id===proof.evidenceId)) gaps.push({suspectId:suspect.id,claim:proof.claim,missingEvidenceId:proof.evidenceId,note:proof.note});
  const fixtures = cueFixtures(suspect.id);
  const authoredConditions = conditions(c,suspect);
  for(const id of Object.keys(fixtures)) if(!authoredConditions.some(x=>x.id===id)) {
    const foreignEvidence = id.startsWith('evidence:') && c.evidence.some(e=>e.id===id.slice(9)&&e.unlockBehavior);
    if(foreignEvidence && fixtures[id].every(f=>f.expected==='not-met')) {
      const pending = listPendingConditions({caseData:c,suspect,session:{unlocked_evidence:[]},existingStates:[]});
      for(const fixture of fixtures[id]) {
        offlineChecks++;
        if(pending.some(condition=>condition.conditionId===id)) configurationErrors.push(`${suspect.id}/${id}/${fixture.name}: foreign evidence became eligible`);
      }
    } else configurationErrors.push(`${suspect.id}: stale condition fixture ${id}`);
  }
  for (const condition of authoredConditions) {
    const tests = fixtures[condition.id] ?? [];
    if (!tests.some(t=>t.expected==='met') || !tests.some(t=>t.expected==='not-met')) configurationErrors.push(`${suspect.id}/${condition.id}: needs positive and negative cases`);
    const required = condition.behavior.evidenceIds ?? [];
    for(const id of required) if(!c.evidence.some(e=>e.id===id)) configurationErrors.push(`${condition.id}: nonexistent evidence ${id}`);
    // Every proper subset, including empty, must fail the real judge's compound evidence gate.
    for(const evidence of subsets(required).filter(s=>s.length < required.length)) {
      const verdict = await judgeUnlock({caseData:c,suspect,conditionId:condition.id,condition:{unlockBehavior:condition.behavior,presentedEvidenceIdsInThisConversation:evidence},transcript:[{role:'user',content:'Please tell us everything about this.'}]});
      offlineChecks++; if(verdict.met) configurationErrors.push(`${condition.id}: incomplete evidence unlocked (${evidence.join(',')})`);
    }
    const pending = {subject:'secret' as const,conditionId:condition.id,unlockBehavior:condition.behavior,revealedText:condition.text,label:condition.id};
    let prior: InterviewUnlockStateRow | undefined;
    const threshold = condition.behavior.pressureThreshold ?? 1;
    for(let n=1;n<=threshold;n++) {
      const next=advanceUnlockState(pending,prior,{met:true,confidence:1,reason:'Threshold contract'},'eval',suspect.id);
      offlineChecks++; if(next.fired !== (n===threshold)) configurationErrors.push(`${condition.id}: pressure threshold ${n}/${threshold}`); prior=next.state;
    }
    if(live && !skipCues) for(const fixture of tests) {
      try {
        const verdict=await judgeUnlock({caseData:c,suspect,conditionId:condition.id,condition:{unlockBehavior:condition.behavior,presentedEvidenceIdsInThisConversation:fixture.presentedEvidenceIds??[]},transcript:fixture.transcript});
        liveCueChecks++; if(verdict.met !== (fixture.expected==='met')) cueFailures.push(`${suspect.id}/${condition.id}/${fixture.name}: ${verdict.reason}`);
      } catch(error) { liveCueChecks++; cueFailures.push(`${suspect.id}/${condition.id}/${fixture.name}: ERROR ${String(error)}`); }
      save();
    }
  }
  console.log(`Audited ${suspect.id}: ${authoredConditions.length} authored conditions; ${gaps.some(g=>g.suspectId===suspect.id)?'missing proof exhibit':'proof exhibit mapped'}`);
  save();
}

async function runScenario(scenario: Scenario, iteration: number) {
  const suspect=c.suspects.find(s=>s.id===scenario.suspectId)!;
  const context={caseData:c,suspect,revelations:scenario.revelations,evidence:c.evidence.filter(e=>scenario.evidenceIds.includes(e.id)).map(e=>`${e.title}: ${e.loreText}`)};
  const history: {role:string;content:string}[]=[];
  const result:Result={id:scenario.id,suspectId:suspect.id,category:scenario.category,repeat:iteration,passed:true,turns:[]};
  for(const [index,question] of scenario.questions.entries()) {
    try {
      const answer=await generateInterviewReply({context,question,recentConversation:history,newlyRevealed:index===0?scenario.newlyRevealed??[]:[],model,validatorModel:c.llm?.validatorModelOverride??model,temperature:c.llm?.temperature??0.7});
      const issues=await gradeInterview({context,category:scenario.category,proof:specs[suspect.id].proof,history,question,reply:answer.reply,model:graderModel});
      result.turns.push({question,...answer,productionAccepted:answer.valid,fallback:answer.reply===SAFE_DEFLECTION||!answer.valid,issues});
      history.push({role:'user',content:question},{role:'assistant',content:answer.reply});
    } catch(error) {
      result.turns.push({question,reply:'',draft:'',productionAccepted:false,fallback:false,issues:['Evaluation could not complete'],error:error instanceof Error?error.message:String(error)});
      break;
    }
  }
  result.passed=result.turns.length===scenario.questions.length&&result.turns.every(t=>!t.issues.length&&!t.error);
  results.push(result); save();
  console.log(`${result.passed?'PASS':'FAIL'} ${scenario.id} (${result.turns.length} turns)`);
}
if(live) {
  const queue=Array.from({length:repeat},(_,i)=>scenarios.map(s=>({s,i:i+1}))).flat();
  let cursor=0;
  await Promise.all(Array.from({length:concurrency},async()=>{while(cursor<queue.length){const job=queue[cursor++];await runScenario(job.s,job.i);}}));
}
complete = true;
save();
console.log(`\n${offlineChecks} deterministic checks; ${liveCueChecks-cueFailures.length}/${liveCueChecks} cue checks; ${results.filter(r=>r.passed).length}/${results.length} conversations passed; ${gaps.length} content gaps.\nReport: ${output}`);
if(configurationErrors.length||gaps.length||cueFailures.length||results.some(r=>!r.passed))process.exitCode=1;
