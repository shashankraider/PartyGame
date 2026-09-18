/** Stateful Rhea review: real production unlock planning and reply validation, in-memory state only. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { loadCase } from '../src/engine/case-loader';
import { runInterviewGraph } from '../src/lib/interview-graph';
import type { InterviewUnlockStateRow } from '../src/lib/supabase';
import { conditions, loadSpecs } from './evals/investigator';
import { calibrateGrader, gradeInterview } from './evals/grade-interview';
import { admissionRequirements, rheaScenarios, CCTV } from './evals/rhea';

if(existsSync('.env.local'))for(const [key,value] of Object.entries(parseEnv(readFileSync('.env.local','utf8'))))process.env[key]??=value;
const args=process.argv.slice(2);
const option=(key:string,fallback:string)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const repeat=Number(option('--repeat','2'));
if(!Number.isInteger(repeat)||repeat<1||repeat>10)throw new Error('Repeat must be 1–10');
const selected=option('--scenario','all');
const scenarios=rheaScenarios.filter(s=>selected==='all'||s.id===selected);
if(!scenarios.length)throw new Error('Unknown scenario');
const caseData=await loadCase('mussoorie');
const suspect=caseData.suspects.find(s=>s.id==='rhea')!;
const authored=conditions(caseData,suspect);
const model=caseData.llm?.modelOverride??process.env.OPENROUTER_MODEL??'openai/gpt-4o-mini';
const graderModel=process.env.EVAL_GRADER_MODEL??'openai/gpt-4.1';
const proof=loadSpecs().rhea.proof;
const output=path.resolve(option('--out',`output/evals/rhea-deep-review-${new Date().toISOString().replace(/[:.]/g,'-')}.json`));
mkdirSync(path.dirname(output),{recursive:true});
const startedAt=new Date().toISOString();
const results: {id:string;repeat:number;turns:Record<string,unknown>[];passed:boolean}[]=[];
let complete=false;
const calibration=await calibrateGrader({caseData,suspect,evidence:[],revelations:[]},proof,graderModel);
// Calibrate the additional completeness check independently of the ordinary fidelity rubric.
for(const [name,reply,expectedFailure] of [
  ['omitted earned confession','I was there to retrieve materials for the channel.',true],
  ['complete earned confession','I entered the cottage at 5 AM. I wiped the camera memory card. I did not kill Vikram and did not know he was dead.',false],
] as const){
  const issues=await gradeInterview({context:{caseData,suspect,evidence:[],revelations:[authored.find(c=>c.id===CCTV)!.text]},proof,model:graderModel,history:[],category:'admission-retention',question:'Why were you there and what did you wipe?',reply,requirements:admissionRequirements([CCTV])});
  calibration.push({name,expectedFailure,issues,passed:Boolean(issues.length)===expectedFailure});
}
function save(){writeFileSync(output,JSON.stringify({startedAt,updatedAt:new Date().toISOString(),status:complete?'complete':'running',model,graderModel,repeat,calibration,
  scope:'Production LangGraph orchestration with in-memory conversation/state. Excludes database commits, host judgment, browser and network retries.',
  caseHash:createHash('sha256').update(JSON.stringify(caseData)).digest('hex'),
  sourceHashes:Object.fromEntries(['src/lib/interview-turn.ts','src/lib/interview-planner.ts','src/lib/interview-graph.ts','src/lib/interview-reply-graph.ts','src/lib/interview-safety.ts','src/lib/adjudicator.ts','scripts/evals/rhea.ts','scripts/evals/grade-interview.ts'].map(file=>[file,createHash('sha256').update(readFileSync(file)).digest('hex')])),
  planned:{conversations:scenarios.length*repeat,turns:scenarios.reduce((n,s)=>n+s.turns.length,0)*repeat},results,
  summary:{conversations:results.length,passed:results.filter(r=>r.passed).length,turns:results.reduce((n,r)=>n+r.turns.length,0),failed:results.filter(r=>!r.passed).length}},null,2)+'\n');}
save();
if(calibration.some(c=>!c.passed))throw new Error('Grader calibration failed; see report');
const queue=Array.from({length:repeat},(_,i)=>scenarios.map(s=>({s,iteration:i+1}))).flat();
let cursor=0;
await Promise.all(Array.from({length:3},async()=>{while(cursor<queue.length){
  const {s,iteration}=queue[cursor++];
  let states:InterviewUnlockStateRow[]=[];
  const history:{role:'user'|'assistant';content:string;presented_evidence_id:string|null}[]=[];
  const result={id:s.id,repeat:iteration,turns:[] as Record<string,unknown>[],passed:true};
  for(const fixture of s.turns){
    try{
      const {updates,updatedStates,answer,trace}=await runInterviewGraph({context:{caseData,suspect,session:{id:'eval-rhea',unlocked_evidence:caseData.evidence.map(e=>e.id)},messages:history},question:fixture.question,presentedEvidenceId:fixture.evidence??null,states});
      states=updatedStates;
      const presented=new Set(history.map(m=>m.presented_evidence_id).filter(Boolean));
      if(fixture.evidence)presented.add(fixture.evidence);
      const fired=updates.filter(u=>u.outcome.fired).map(u=>u.condition.conditionId);
      const issues:string[]=[];
      if([...fired].sort().join('|')!==[...fixture.expectedNew].sort().join('|'))issues.push(`UNLOCK_MISMATCH: expected ${fixture.expectedNew.join(',')||'none'}; actual ${fired.join(',')||'none'}`);
      for(const u of updates)if(u.outcome.verdict?.reason.startsWith('Judge unavailable'))issues.push('PROVIDER_ERROR: unlock judge unavailable');
      const admitted=authored.filter(c=>states.some(st=>st.condition_id===c.id&&st.met_at));
      const context={caseData,suspect,revelations:admitted.map(c=>c.text),evidence:caseData.evidence.filter(e=>presented.has(e.id)).map(e=>`${e.title}: ${e.loreText}`)};
      const requirements=[...admissionRequirements(fired),...(fixture.requirements??[])];
      const category=['false-proof','unknown-killer','no-evidence'].includes(s.id)?'fabricated-evidence':'stateful-investigation';
      issues.push(...await gradeInterview({context,proof,history,question:fixture.question,reply:answer.reply,model:graderModel,category,requirements}));
      result.turns.push({...fixture,fired,admitted:admitted.map(c=>c.id),verdicts:updates.map(u=>({id:u.condition.conditionId,...u.outcome.verdict})),...answer,trace,requirements,issues});
      history.push({role:'user',content:fixture.question,presented_evidence_id:fixture.evidence??null},{role:'assistant',content:answer.reply,presented_evidence_id:null});
      if(issues.length)result.passed=false;
    }catch(error){result.passed=false;result.turns.push({...fixture,error:error instanceof Error?error.message:String(error),issues:['Evaluation incomplete']});break;}
  }
  results.push(result);save();console.log(`${result.passed?'PASS':'FAIL'} ${s.id} repeat ${iteration} (${result.turns.length} turns)`);
}}));
complete=true;save();console.log(`Report: ${output}`);
if(results.some(r=>!r.passed))process.exitCode=1;
