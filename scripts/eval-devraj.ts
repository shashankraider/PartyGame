/** Stateful Devraj review: real production unlock planning and reply validation, in-memory state only. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { loadCase } from '../src/engine/case-loader';
import { runInterviewGraph } from '../src/lib/interview-graph';
import type { InterviewUnlockStateRow } from '../src/lib/supabase';
import { conditions, loadSpecs } from './evals/investigator';
import { gradeInterview } from './evals/grade-interview';
import { admissionRequirements, devrajScenarios, calibrationControls } from './evals/devraj';

if(existsSync('.env.local'))for(const [key,value] of Object.entries(parseEnv(readFileSync('.env.local','utf8'))))process.env[key]??=value;
const args=process.argv.slice(2);
const option=(key:string,fallback:string)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const repeat=Number(option('--repeat','2'));
if(!Number.isInteger(repeat)||repeat<1||repeat>10)throw new Error('Repeat must be 1–10');
const selected=option('--scenario','all');
const selectedIds=selected.split(',');
const scenarios=devrajScenarios.filter(s=>selected==='all'||selectedIds.includes(s.id));
if(!scenarios.length || (selected!=='all' && selectedIds.some(id=>!scenarios.some(s=>s.id===id))))throw new Error('Unknown scenario');
const caseData=await loadCase('mussoorie');
const suspect=caseData.suspects.find(s=>s.id==='devraj')!;
const authored=conditions(caseData,suspect);
const model=caseData.llm?.modelOverride??process.env.OPENROUTER_MODEL??'openai/gpt-4o-mini';
const graderModel=process.env.EVAL_GRADER_MODEL??'openai/gpt-4.1';
const proof=loadSpecs().devraj.proof;
const output=path.resolve(option('--out',`output/evals/devraj-deep-review-${new Date().toISOString().replace(/[:.]/g,'-')}.json`));
mkdirSync(path.dirname(output),{recursive:true});
const startedAt=new Date().toISOString();
const results: {id:string;repeat:number;turns:Record<string,unknown>[];passed:boolean}[]=[];
let complete=false;
const calibration:{name:string;expectedFailure:boolean;issues:string[];passed:boolean}[]=[];
for (const control of calibrationControls) {
  const ids=control.admission ? [control.admission] : [];
  const issues=await gradeInterview({context:{caseData,suspect,evidence:[],revelations:authored.filter(c=>ids.includes(c.id)).map(c=>c.text)},proof,model:graderModel,history:[],category:'fabricated-evidence',question:control.question,reply:control.reply,requirements:[...admissionRequirements(ids),...(control.requirements??[])]});
  calibration.push({name:control.name,expectedFailure:control.expectedFailure,issues,passed:Boolean(issues.length)===control.expectedFailure});
}
function save(){writeFileSync(output,JSON.stringify({startedAt,updatedAt:new Date().toISOString(),status:complete?'complete':'running',model,graderModel,repeat,calibration,
  scope:'Production LangGraph orchestration with in-memory conversation/state. Excludes database commits, host judgment, browser and network retries.',
  caseHash:createHash('sha256').update(JSON.stringify(caseData)).digest('hex'),
  sourceHashes:Object.fromEntries(['scripts/eval-devraj.ts','src/lib/interview-turn.ts','src/lib/interview-planner.ts','src/lib/interview-graph.ts','src/lib/interview-reply-graph.ts','src/lib/interview-safety.ts','src/lib/adjudicator.ts','scripts/evals/devraj.ts','scripts/evals/grade-interview.ts'].map(file=>[file,createHash('sha256').update(readFileSync(file)).digest('hex')])),
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
      const {updates,updatedStates,answer,trace}=await runInterviewGraph({context:{caseData,suspect,session:{id:'eval-devraj',unlocked_evidence:caseData.evidence.map(e=>e.id)},messages:history},question:fixture.question,presentedEvidenceId:fixture.evidence??null,states});
      states=JSON.parse(JSON.stringify(updatedStates)); // Reconstruct committed state between every turn.
      const presented=new Set(history.map(m=>m.presented_evidence_id).filter(Boolean));
      if(fixture.evidence)presented.add(fixture.evidence);
      const fired=updates.filter(u=>u.outcome.fired).map(u=>u.condition.conditionId);
      const issues:string[]=[];
      const permitted = new Set([...fixture.expectedNew, ...(fixture.allowedNew ?? [])]);
      if(fixture.expectedNew.some(id=>!fired.includes(id)) || fired.some(id=>!permitted.has(id)))issues.push(`UNLOCK_MISMATCH: required ${fixture.expectedNew.join(',')||'none'}; optional ${fixture.allowedNew?.join(',')||'none'}; actual ${fired.join(',')||'none'}`);
      for(const u of updates)if(u.outcome.verdict?.reason.startsWith('Judge unavailable'))issues.push('PROVIDER_ERROR: unlock judge unavailable');
      const admitted=authored.filter(c=>states.some(st=>st.condition_id===c.id&&st.met_at));
      for(const id of fixture.requiredAdmitted ?? [])if(!admitted.some(c=>c.id===id))issues.push(`ADMISSION_MISSING: ${id} must be earned by this turn.`);
      const context={caseData,suspect,revelations:admitted.map(c=>c.text),evidence:caseData.evidence.filter(e=>presented.has(e.id)).map(e=>`${e.title}: ${e.loreText}`)};
      const requirements=[...admissionRequirements(fired),...(fixture.requirements??[])];
      const category=['false-forensics','prompt-injection','no-evidence-pressure'].includes(s.id)?'fabricated-evidence':'stateful-investigation';
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
