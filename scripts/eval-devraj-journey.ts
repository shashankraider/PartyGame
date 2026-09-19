/** Real production turns + local database. No model mocks, injected evidence or admission overrides. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createSupabaseServerClient } from '../src/lib/supabase';
import { createSession, joinSessionByCode, startSession, advanceSessionChapter, setSessionScene, getLobbyState, getPublicLobbyState, loadInvestigationEvents, setSessionInterviewer, getInterrogationEntryChapter, getInterviewMessages } from '../src/lib/session-store';
import { executeInterview } from '../src/lib/interview-turn';
import { initialAccountProgress } from '../src/lib/interview-rounds';
import { loadCase } from '../src/engine/case-loader';
import { knownRevelations } from '../src/lib/interview-planner';
import { gradeInterview } from './evals/grade-interview';
import { loadSpecs } from './evals/investigator';
for(const [k,v] of Object.entries(parseEnv(readFileSync('.env.local','utf8'))))process.env[k]??=v;
if(!['localhost','127.0.0.1'].includes(new URL(process.env.SUPABASE_URL!).hostname))throw Error('Local database required');
const caseData=await loadCase('mussoorie');const db=createSupabaseServerClient();
const file=`output/evals/devraj-live-journey-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
mkdirSync('output/evals',{recursive:true});
const sourceHashes=Object.fromEntries(['cases/mussoorie/case.json','src/lib/interview-turn.ts','src/lib/session-store.ts','src/lib/interview-rounds.ts','src/lib/investigation-requests.ts','src/lib/interview-safety.ts','src/lib/host-judgment.ts'].map(file=>[file,createHash('sha256').update(readFileSync(file)).digest('hex')]));
const report={sourceHashes,startedAt:new Date().toISOString(),status:'running',model:caseData.llm?.modelOverride??process.env.OPENROUTER_MODEL??'openai/gpt-4o-mini',graderModel:process.env.EVAL_GRADER_MODEL??'openai/gpt-4.1',scope:'Real production server functions and local persisted game, using live request classification, initial-account assessment, roleplay, validation, unlock adjudication and host discovery. No browser/auth-route test, model mocks, seeded reports or admission overrides.',turns:[] as Record<string,unknown>[],checks:[] as string[],issues:[] as string[],warnings:[] as string[],cleanedUp:false};
const save=()=>writeFileSync(file,JSON.stringify(report,null,2)+'\n');
let session:Awaited<ReturnType<typeof createSession>>|undefined;let playerId='';let current='';
const check=(name:string)=>{report.checks.push(name);save();console.log('PASS',name);};
async function enter(id:string){const chapter=caseData.chapters.find(c=>c.type==='interview'&&c.suspectId===id)!;await setSessionScene({sessionId:session!.id,scene:'interview',chapterId:chapter.id});await setSessionInterviewer({sessionId:session!.id,playerId});current=id;}
async function ask(question:string,evidence?:string,requirements:string[]=[]){
 const result=await executeInterview({sessionId:session!.id,playerId,question,presentedEvidenceId:evidence,requestId:randomUUID()});
 const turn:Record<string,unknown>={suspectId:current,question,evidence:evidence??null,reply:result.assistantMessage.content,hostJudgment:result.hostJudgment,systemMessages:result.systemMessages.map(m=>m.content),fired:result.unlockOutcomes.filter(o=>o.fired).map(o=>o.conditionId),unlocked:result.session.unlocked_evidence,issues:[]};
 report.turns.push(turn);save();console.log('ANSWER',current,report.turns.length);
 const notices=turn.systemMessages as string[];
 report.warnings.push(...notices.filter(m=>/check failed|could not be recorded/.test(m)).map(m=>`Turn ${report.turns.length}: ${m}`));save();
 if(current==='devraj'){
  const suspect=caseData.suspects.find(s=>s.id===current)!;
  const messages=await getInterviewMessages({sessionId:session!.id,suspectId:current});
  const presented=[...new Set(messages.flatMap(m=>m.presented_evidence_id?[m.presented_evidence_id]:[]))];
  const {data:states,error}=await db.from('interview_unlock_state').select('*').eq('session_id',session!.id);
  if(error)throw error;
  const revelations=knownRevelations(caseData,suspect,result.session,states??[]);
  const context={caseData,suspect,revelations,presentedEvidenceIds:presented,evidence:caseData.evidence.filter(e=>presented.includes(e.id)).map(e=>`${e.title}: ${e.loreText}`)};
  const constraints=[...requirements];
  if(presented.includes('devraj-duty-log'))constraints.push('The audit has been presented: do not propose checking/fetching patrol logs or return to continuous station presence. Acknowledge the exposed edit if the question asks about it.');
  if(!(states??[]).some(s=>s.condition_id==='breaking-point:lathi-confession'&&s.met_at))constraints.push('Do not confess to striking, pushing or killing Vikram before the murder admission is earned.');
  else constraints.push('Retain responsibility for the admitted strike, push, killing and log falsification. Do not erase any admitted act.');
  const issues=await gradeInterview({context,proof:loadSpecs().devraj.proof,history:messages.slice(0,-2).filter(m=>m.role!=='system').map(m=>({role:m.role,content:m.content})),question,reply:result.assistantMessage.content,model:report.graderModel,category:'stateful-investigation',requirements:constraints});
  turn.issues=issues;report.issues.push(...issues.map(i=>`Turn ${report.turns.length}: ${i}`));save();
 }
 return result;
}
async function initialAccount(id:string){
 await enter(id);
 await ask('Where were you on the evening Vikram died? Give your own account of where you were and what you were doing.');
 await ask('What was your connection to Vikram? Tell me about your relationship, dealings with him, or your role in his case.');
 let progress=initialAccountProgress(await loadInvestigationEvents(session!.id));
 for(const topic of ['whereabouts','connection'] as const){
  if(!progress.topics.get(id)?.has(topic))await ask(topic==='whereabouts'?'Please give your own account of where you were and what you did that evening.':'Please explain your relationship to Vikram or your role in investigating his death.');
  progress=initialAccountProgress(await loadInvestigationEvents(session!.id));
 }
 assert.ok(progress.completed.has(id),`${id}: initial account incomplete`);check(`${id}: substantive initial account recorded`);
}
try{
 session=await createSession('mussoorie','solo',randomUUID());
 playerId=(await joinSessionByCode({joinCode:session.join_code,name:'Live journey detective',deviceId:randomUUID()})).player.id;
 await startSession(session.id);
 for(let i=0;i<12;i++){if((await getLobbyState(session.id)).session.phase==='interrogation')break;await advanceSessionChapter(session.id,'next');}
 await enter('devraj');await ask('Hello Inspector. What is your name and rank?');
 assert.ok(!initialAccountProgress(await loadInvestigationEvents(session.id)).completed.has('devraj'));check('Greeting does not complete first interview');
 for(const question of ['Can we have Devraj’s phone records?','Can we have the extracted location history from Devraj’s handset?','We need an independent audit of changes to Devraj’s duty register.','I need a forensic report on Devraj’s issued lathi.'])await ask(question);
 const requested=caseData.evidence.filter(e=>e.investigationRequest).map(e=>e.id);
 const events=await loadInvestigationEvents(session.id);
 assert.deepEqual(events.filter(e=>e.type==='investigation.requested').map(e=>e.payload.evidenceId).sort(),[...requested].sort());
 assert.ok(!(await getPublicLobbyState(session.id)).caseData.evidence.some(e=>requested.includes(e.id)));check('Four separate reports requested, all sealed');
 await initialAccount('devraj');
 const board=getInterrogationEntryChapter(caseData)!;await setSessionScene({sessionId:session.id,scene:'case_board',chapterId:board.id});
 await assert.rejects(()=>enter('devraj'),/Interview every suspect once/);check('Early recall blocked');
 for(const id of ['rhea','naina','bisht','anya','kabir'])await initialAccount(id);
 await enter('devraj');
 const publicIds=(await getPublicLobbyState(session.id)).caseData.evidence.map(e=>e.id);
 assert.ok(requested.every(id=>publicIds.includes(id)));check('All six first accounts completed; four requested reports arrive on Devraj recall');
 for(const question of ['The call record shows Bisht called you at eight. Were you at the station throughout, or did you leave in your police jeep for Camel’s Back Road?','Was your police jeep on Camel’s Back Road around 8:10 PM? We need the CCTV showing its movements.']){
  if((await getLobbyState(session.id)).session.unlocked_evidence.includes('devraj-jeep-cctv'))break;
  await ask(question,'bisht-devraj-call');
 }
 assert.ok((await getLobbyState(session.id)).session.unlocked_evidence.includes('devraj-jeep-cctv'));check('Jeep CCTV discovered through live host');
 await ask('Your jeep is shown on Camel’s Back Road at 8:10. How does that fit your station account?','devraj-jeep-cctv');
 for(const question of ['Did Vikram suffer a lathi blow before falling? Does the local autopsy conceal a different cause of death?','We need the independent medical review to establish whether the head injury occurred before the fall and was compatible with a police lathi.']){
  if((await getLobbyState(session.id)).session.unlocked_evidence.includes('lathi-postmortem'))break;
  await ask(question);
 }
 assert.ok((await getLobbyState(session.id)).session.unlocked_evidence.includes('lathi-postmortem'));check('Independent medical review discovered through live host');
 await ask('Does this medical review establish a pre-fall injury compatible with a lathi, without uniquely identifying a weapon?','lathi-postmortem');
 await ask('The district audit records your departure and your 8:34 edit replacing it with station throughout. Did you make that change?','devraj-duty-log',['Acknowledge the documented edit and departure; do not invent its motive.']);
 await ask('Do we still need to check your patrol logs, or does this audit already establish your departure and later edit?');
 await ask('The handset report records fixes near the bend at 8:18 and 8:21 with 20-metre accuracy. What does that establish?','devraj-phone-location');
 await ask('The report identifies your issued lathi DK-17 and Vikram’s blood on it. What does it establish and what does it leave unanswered?','devraj-lathi-forensics');
 await ask('Putting the call, jeep, medical injury, handset locations, your log edit and blood on your issued lathi together: did you strike Vikram and conceal that journey?');
 await ask('Did you personally strike Vikram with your service lathi, push him over the railing and falsify the duty log to conceal the killing?');
 const {data:states}=await db.from('interview_unlock_state').select('*').eq('session_id',session.id);
 assert.ok(states?.some(s=>s.condition_id==='breaking-point:lathi-confession'&&s.met_at));check('Murder admission earned through all six presented exhibits and relevant pressure');
 await ask('Why did you replace the departure entry with station throughout?');
 await ask('What did Bisht tell you in that call?');
 report.status=report.issues.length?'flagged':'passed';
}catch(error){report.status='failed';report.issues.push(error instanceof Error?error.message:String(error));console.error('FAILED',report.issues.at(-1));process.exitCode=1;}
finally{
 if(session){const {error}=await db.from('sessions').delete().eq('id',session.id);report.cleanedUp=!error;if(error){report.issues.push('Could not remove temporary test session');process.exitCode=1;}}
 save();console.log('Report:',file);if(report.issues.length)process.exitCode=1;
}
