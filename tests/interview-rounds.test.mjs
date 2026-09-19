import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from '../src/engine/case-loader.ts';
import { firstInterviewRound, firstRoundRecallBlock } from '../src/lib/interview-rounds.ts';

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
