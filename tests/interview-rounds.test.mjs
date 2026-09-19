import { isQuotedSubstring } from '../src/lib/interview-grounding.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from '../src/engine/case-loader.ts';
import { firstInterviewRound, firstRoundRecallBlock, initialAccountProgress, classifyInitialAccount } from '../src/lib/interview-rounds.ts';

const caseData = await loadCase('mussoorie');
const board = { current_scene: 'case_board', current_interview_suspect_id: null };

test('every suspect must have an answered question before any completed interview can be recalled', () => {
  const ids = caseData.suspects.map(s => s.id);
  assert.equal(ids.length, 6);
  for (const target of ids) {
    assert.equal(firstRoundRecallBlock(caseData, board, target, []), null);
    const block = firstRoundRecallBlock(caseData, board, target, [target]);
    assert.match(block, /Interview every suspect once/);
    for (const waiting of caseData.suspects.filter(s => s.id !== target)) assert.ok(block.includes(waiting.name));
    assert.equal(firstRoundRecallBlock(caseData, board, target, ids), null);
  }
});

test('continuing the active interview or resuming an unanswered one is not a recall', () => {
  assert.equal(firstRoundRecallBlock(caseData, { current_scene: 'interview', current_interview_suspect_id: 'devraj' }, 'devraj', ['devraj']), null);
  assert.equal(firstRoundRecallBlock(caseData, board, 'rhea', ['devraj']), null);
  assert.ok(firstRoundRecallBlock(caseData, { current_scene: 'interview', current_interview_suspect_id: 'rhea' }, 'devraj', ['devraj']));
});

test('duplicate answers, unknown speakers and duplicate interview chapters cannot complete the round', () => {
  const source = { ...caseData, chapters: [...caseData.chapters, caseData.chapters.find(c => c.type === 'interview')] };
  const round = firstInterviewRound(source, ['devraj', 'devraj', 'unknown']);
  assert.equal(round.remaining.length, 5);
  assert.ok(round.remaining.every(s => s.id !== 'devraj'));
});


test('greetings, duplicate topics and report requests cannot complete an initial account',()=>{
 const event=(topics)=>({type:'interview.initial_account',payload:{suspectId:'devraj',topics}});
 assert.equal(initialAccountProgress([event([]),event(['name']),{type:'investigation.requested',payload:{suspectId:'devraj'}}]).completed.size,0);
 assert.equal(initialAccountProgress([event(['whereabouts']),event(['whereabouts'])]).completed.size,0);
 assert.ok(initialAccountProgress([event(['whereabouts']),event(['connection'])]).completed.has('devraj'));
});

test('an initial account must be grounded in the delivered answer, not the question',async()=>{
 const oldFetch=globalThis.fetch;const key=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='test';
 globalThis.fetch=async()=>Response.json({choices:[{message:{content:JSON.stringify({covered:[{topic:'whereabouts',answerQuote:'I was at the station.'}]})}}]});
 try{await assert.rejects(()=>classifyInitialAccount({question:'Were you at the station?',reply:'Could you repeat that?',model:'test'}),/Ungrounded/);}
 finally{globalThis.fetch=oldFetch;if(key===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=key;}
});


test('quote grounding tolerates a sentence cut at punctuation but rejects changed words',()=>{
 assert.ok(isQuotedSubstring('Vikram asked me to look into a lead for him, and then he went silent.','Vikram asked me to look into a lead for him.'));
 assert.ok(!isQuotedSubstring('I was not at the station.','I was at the station.'));
 assert.ok(!isQuotedSubstring('Anything','...'));
});
