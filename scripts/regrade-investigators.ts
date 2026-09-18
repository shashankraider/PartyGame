/** Regrade saved answers without regenerating them; keeps the original report intact. */
import { readFileSync,writeFileSync,existsSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { loadCase } from '../src/engine/case-loader';
import { buildScenarios,loadSpecs } from './evals/investigator';
import { calibrateGrader,gradeInterview } from './evals/grade-interview';
if(existsSync('.env.local'))for(const [k,v] of Object.entries(parseEnv(readFileSync('.env.local','utf8'))))process.env[k]??=v;
const [source,destination]=process.argv.slice(2);
if(!source||!destination||source===destination)throw new Error('Provide distinct source and destination JSON files');
const report=JSON.parse(readFileSync(source,'utf8'));
const c=await loadCase('mussoorie');
const specs=loadSpecs();
const scenarios=buildScenarios(c);
const model=process.env.EVAL_GRADER_MODEL??'openai/gpt-4.1';
const calibration=await calibrateGrader({caseData:c,suspect:c.suspects.find(s=>s.id==='rhea')!,revelations:[],evidence:[]},specs.rhea.proof,model);
console.log('Grader controls:',calibration.filter(c=>c.passed).length,'/',calibration.length);
if(calibration.some(c=>!c.passed)){console.log(JSON.stringify(calibration,null,2));process.exit(1);}
report.graderModel=model;report.calibration=calibration;report.regradedFrom=source;report.status='running';
let cursor=0;
await Promise.all(Array.from({length:3},async()=>{
  while(cursor<report.results.length){
    const result=report.results[cursor++];
    const scenario=scenarios.find(s=>s.id===result.id)!;
    const suspect=c.suspects.find(s=>s.id===result.suspectId)!;
    const context={caseData:c,suspect,revelations:scenario.revelations,evidence:c.evidence.filter(e=>scenario.evidenceIds.includes(e.id)).map(e=>`${e.title}: ${e.loreText}`)};
    const history:{role:string;content:string}[]=[];
    for(const turn of result.turns){
      turn.originalIssues=turn.issues;
      if(!turn.error)try{turn.issues=await gradeInterview({context,category:scenario.category,proof:specs[suspect.id].proof,history,question:turn.question,reply:turn.reply,model});}catch(error){turn.error=String(error);turn.issues=['Grading unavailable'];}
      history.push({role:'user',content:turn.question},{role:'assistant',content:turn.reply});
    }
    result.passed=result.turns.length===scenario.questions.length&&result.turns.every((t:{issues:string[];error?:string})=>!t.issues.length&&!t.error);
    console.log(`${result.passed?'PASS':'FAIL'} ${result.id}`);
    writeFileSync(destination,JSON.stringify(report,null,2)+'\n');
  }
}));
report.summary={conversations:report.results.length,passed:report.results.filter((r:{passed:boolean})=>r.passed).length,turns:report.results.reduce((n:number,r:{turns:unknown[]})=>n+r.turns.length,0),failed:report.results.filter((r:{passed:boolean})=>!r.passed).length};
report.status='complete';report.updatedAt=new Date().toISOString();
writeFileSync(destination,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
if(report.summary.failed||report.contentGaps.length||report.cueFailures.length)process.exitCode=1;
