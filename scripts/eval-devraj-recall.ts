/** Real request classification + deterministic recall scheduling, without database writes. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { loadCase } from '../src/engine/case-loader';
import { classifyInvestigationRequests, planInvestigationRequest, planRecallDelivery, type InvestigationEvent } from '../src/lib/investigation-requests';
for(const [k,v] of Object.entries(parseEnv(readFileSync('.env.local','utf8'))))process.env[k]??=v;
const caseData=await loadCase('mussoorie');
const questions=[
 ['bisht-devraj-call','Please obtain telecom records of Bisht calling Devraj on the murder night, including time and duration.'],
 ['devraj-phone-location','CBI should extract Devraj’s handset location history around the fatal bend at 8:20. Please request that examination.'],
 ['devraj-duty-log','Obtain the original station duty register and an independent audit showing revisions and who made them.'],
 ['devraj-lathi-forensics','Please seize and examine Devraj’s issued service lathi for Vikram’s blood and compare it with the pre-fall injury.'],
];
const results=[];
async function classify(question:string, events:InvestigationEvent[] = []) {
 try { return { evidence: await classifyInvestigationRequests(caseData, question, events, []), error: undefined as string|undefined }; }
 catch(error) { return { evidence: [], error: error instanceof Error ? error.message : String(error) }; }
}
for(let repeat=1;repeat<=2;repeat++){
 const board={current_scene:'case_board',current_interview_suspect_id:null,unlocked_evidence:[]};
 const events:InvestigationEvent[]=[planRecallDelivery(caseData,board,'devraj',[])!.event];
 const active={...board,current_scene:'interview',current_interview_suspect_id:'devraj'};
 for(const [id,question] of questions){
  const {evidence:classified,error}=await classify(question,events);
  const passed=!error&&classified.length===1&&classified[0].id===id;
  if(passed)events.push(planInvestigationRequest(classified[0],events,[],'devraj')!.event);
  results.push({repeat,id,question,classified:classified.map(e=>e.id),error,passed});
  console.log(passed?'PASS':'FAIL',repeat,id);
 }
 const recall=planRecallDelivery(caseData,board,'devraj',events)!;
 results.push({repeat,id:'recall-boundary',passed:planRecallDelivery(caseData,active,'devraj',events)===null&&recall.event.payload.visit===2&&recall.evidence.length===4,delivered:recall.evidence.map(e=>e.id)});
 for(const [id,question,expected] of [
  ['bare-claim-not-request','Your phone was there and Vikram’s DNA is on your lathi. Confess.',[]],
  ['personal-account-not-request','Where were you at eight? Why did you leave the station?',[]],
  ['negated-request','Do not obtain Devraj’s phone records or test his lathi.',[]],
  ['past-test-not-request','We already asked the lab to test your lathi. Explain why you were there.',[]],
  ['account-check-not-request','Check your story, Devraj. Were you at the station or on patrol?',[]],
  ['natural-have','Can we have Devraj’s phone records?',['bisht-devraj-call']],
  ['natural-need','I need a forensic report on Devraj’s issued lathi.',['devraj-lathi-forensics']],
  ['hinglish-request','Devraj ke phone records chahiye.',['bisht-devraj-call']],
  ['hindi-request','देवराज के फोन रिकॉर्ड चाहिए।',['bisht-devraj-call']],
  ['natural-audit','We need an independent audit of changes to Devraj’s duty register.',['devraj-duty-log']],
  ['natural-location','Can we have the extracted location history from Devraj’s handset?',['devraj-phone-location']],
  ['bundled-request','Please obtain Bisht-Devraj call records and send Devraj’s issued lathi for forensic blood/DNA testing.',['bisht-devraj-call','devraj-lathi-forensics']],
 ] as const){
  const {evidence,error}=await classify(question);
  const classified=evidence.map(e=>e.id).sort();
  results.push({repeat,id,question,classified,error,passed:!error&&JSON.stringify(classified)===JSON.stringify([...expected].sort())});
 }
}
mkdirSync('output/evals',{recursive:true});
writeFileSync('output/evals/devraj-recall-final.json',JSON.stringify({at:new Date().toISOString(),scope:'Real request classifier and production recall helpers. No database writes or generated suspect replies.',results},null,2)+'\n');
console.log(`${results.filter(r=>r.passed).length}/${results.length} checks passed`);
if(results.some(r=>!r.passed))process.exitCode=1;
