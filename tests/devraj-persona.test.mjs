import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from '../src/engine/case-loader.ts';
import { activeInterviewLayers, buildRoleplayPrompt, generateInterviewReply } from '../src/lib/interview-safety.ts';
import { advanceUnlockState, evidenceGate } from '../src/lib/interview-planner.ts';
import { listPendingConditions } from '../src/lib/interview-unlocks.ts';
import { subsets } from '../scripts/evals/investigator.ts';
import { devrajScenarios, calibrationControls } from '../scripts/evals/devraj.ts';

test('Devraj posture handles every admission combination without reopening a spent cover story', async () => {
  const caseData = await loadCase('mussoorie');
  const suspect = caseData.suspects.find(s => s.id === 'devraj');
  const bribe = suspect.secrets[0].revealedText;
  const jeep = suspect.breakingPoints[0].reaction;
  const murder = suspect.breakingPoints[1].reaction;
  for (const revelations of subsets([bribe, jeep, murder])) {
    const ids = activeInterviewLayers(suspect, revelations).map(l => l.id);
    assert.ok(ids.includes('interview-trained'));
    assert.equal(ids.includes('old-case-guarded'), !revelations.includes(bribe));
    assert.equal(ids.includes('bribe-exposed'), revelations.includes(bribe));
    assert.equal(ids.includes('station-account'), !revelations.includes(jeep) && !revelations.includes(murder));
    assert.equal(ids.includes('patrol-account'), revelations.includes(jeep) && !revelations.includes(murder));
    assert.equal(ids.includes('murder-exposed'), revelations.includes(murder));
    const prompt = buildRoleplayPrompt({caseData, suspect, revelations, evidence: []});
    const account = prompt.split('Current account, only if asked about whereabouts: ')[1].split('\n\n')[0];
    assert.equal(account, revelations.includes(murder) ? suspect.alibiAfterBreakingPoint['lathi-confession'] : revelations.includes(jeep) ? suspect.alibiAfterBreakingPoint['jeep-cctv'] : suspect.publicAlibi);
  }
  assert.deepEqual(activeInterviewLayers(suspect, ['I know you killed him.']).map(l => l.id), ['interview-trained', 'station-account', 'old-case-guarded']);
  const reversed = buildRoleplayPrompt({caseData, suspect, revelations: [murder, jeep], evidence: []});
  assert.ok(reversed.includes(`Current account, only if asked about whereabouts: ${suspect.alibiAfterBreakingPoint['lathi-confession']}`));
});

test('Devraj murder requires every exhibit and two eligible pressure turns', async () => {
  const caseData = await loadCase('mussoorie'); const suspect = caseData.suspects.find(s => s.id === 'devraj');
  const conditions = listPendingConditions({caseData, suspect, session: {unlocked_evidence: caseData.evidence.map(e => e.id)}, existingStates: []});
  const murder = conditions.find(c => c.conditionId === 'breaking-point:lathi-confession');
  const required = ['devraj-jeep-cctv', 'lathi-postmortem', 'bisht-devraj-call'];
  for (const ids of subsets(required)) assert.equal(evidenceGate(murder, new Set(ids)), ids.length === required.length);
  assert.deepEqual(suspect.breakingPoints[1].trigger.conditions.map(c => c.evidenceId).sort(), [...required].sort());
  for (const id of ['secret:thakur-bribe', 'breaking-point:lathi-confession']) {
    const condition = conditions.find(c => c.conditionId === id);
    const first = advanceUnlockState(condition, undefined, {met: true, confidence: 1, reason: 'Relevant question'}, 'test', 'devraj');
    assert.equal(first.fired, false);
    const irrelevant = advanceUnlockState(condition, first.state, {met: false, confidence: 1, proximity: 0, reason: 'Insult'}, 'test', 'devraj');
    assert.equal(irrelevant.fired, false);
    assert.equal(irrelevant.state.pressure_count, 1);
    const second = advanceUnlockState(condition, irrelevant.state, {met: true, confidence: 1, reason: 'Relevant follow-up'}, 'test', 'devraj');
    assert.equal(second.fired, true);
  }
});

test('rejected Devraj admissions deliver first-person canonical dialogue without other gated confessions', async () => {
  const caseData = await loadCase('mussoorie'); const suspect = caseData.suspects.find(s => s.id === 'devraj');
  const originalFetch = globalThis.fetch; const key = process.env.OPENROUTER_API_KEY; process.env.OPENROUTER_API_KEY = 'test';
  globalThis.fetch = async (_url, init) => Response.json({choices: [{message: {content: JSON.parse(init.body).response_format ? '{"safe":false}' : 'Rejected'}}]});
  try {
    for (const revelation of [suspect.secrets[0].revealedText, ...suspect.breakingPoints.map(bp => bp.reaction)]) {
      const result = await generateInterviewReply({context: {caseData, suspect, revelations: [revelation], evidence: []}, question: 'What did you do?', recentConversation: [], newlyRevealed: [revelation], model: 'test'});
      assert.equal(result.reply, revelation);
      assert.doesNotMatch(result.reply, /Goes very still|Breaks fast|constable|He (looks|says)/);
    }
    assert.doesNotMatch(suspect.breakingPoints[1].reaction, /Thakur|2011|bribe/);
    assert.doesNotMatch(suspect.breakingPoints[0].reaction, /I (struck|killed|falsified)/);
  } finally { globalThis.fetch = originalFetch; if (key === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = key; }
});

test('Devraj evaluation fixtures reference real evidence and admissions', async () => {
  const caseData = await loadCase('mussoorie'); const suspect = caseData.suspects.find(s => s.id === 'devraj');
  const ids = new Set([...suspect.secrets.map(s => `secret:${s.id}`), ...suspect.breakingPoints.map(bp => `breaking-point:${bp.id}`)]);
  const seen = new Set();
  for (const scenario of devrajScenarios) {
    assert.ok(!seen.has(scenario.id)); seen.add(scenario.id);
    for (const turn of scenario.turns) {
      assert.ok(turn.question.length > 0 && turn.question.length <= 600);
      if (turn.evidence) assert.ok(caseData.evidence.some(e => e.id === turn.evidence));
      for (const id of turn.expectedNew) assert.ok(ids.has(id));
    }
  }
  assert.ok(calibrationControls.some(c => c.admission === 'breaking-point:lathi-confession' && c.expectedFailure));
});
