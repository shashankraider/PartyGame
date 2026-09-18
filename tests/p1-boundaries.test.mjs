import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCase } from '../src/engine/case-loader.ts';
import { toPublicCase } from '../src/lib/public-case.ts';
import { buildRoleplayPrompt, validateRoleplayReply } from '../src/lib/interview-safety.ts';
import { advanceUnlockState } from '../src/lib/interview-turn.ts';
import { readDeviceToken, checkRequestOrigin } from '../src/lib/session-auth.ts';
import { mintSessionRealtimeToken } from '../src/lib/realtime-auth.ts';
import { SignJWT, decodeJwt } from 'jose';

const caseData = await loadCase('mussoorie');
const base = { id: 'test-session', status: 'lobby', phase: 'briefing', current_chapter_id: null, unlocked_evidence: [] };
test('public case excludes private truth and locked material at every prereveal phase', () => {
  for (const phase of ['briefing','interrogation','accusation']) {
    const result = toPublicCase(caseData, { ...base, phase });
    assert.equal(result.solution, undefined);
    assert.deepEqual(result.evidence, []);
    assert.deepEqual(result.ending, []);
    assert.ok(!JSON.stringify(result.suspects).match(/mastermind|anonymous tipster|plagiarised/i));
    assert.ok(result.suspects.every(s => !('persona' in s) && !('secrets' in s) && !('trueTimeline' in s) && !('neverReveal' in s)));
    assert.ok(result.suspects.every(s => !('interviewLayers' in s) && !('alibiAfterBreakingPoint' in s)));
    assert.ok(!('endgame' in result) && !('backstoryEvents' in result));
    assert.ok(result.chapters.every(c => !('unlockCondition' in c)));
  }
});
test('only unlocked exhibits are projected and unlock rules remain private', () => {
  const evidence = caseData.evidence.find(e => e.unlockBehavior);
  const result = toPublicCase(caseData,{ ...base,unlocked_evidence:[evidence.id] });
  assert.deepEqual(result.evidence.map(e=>e.id),[evidence.id]);
  assert.ok(!('unlockBehavior' in result.evidence[0]) && !('arrivesWhen' in result.evidence[0]));
});
test('both confrontation branches expose the next line only after host advancement', () => {
  for (const path of caseData.endgame.paths) {
    const session = { ...base, phase:'reveal',endgame_path_id:path.id,reveal_step:0 };
    const first=toPublicCase(caseData,session);
    assert.deepEqual(first.ending.map(b=>b.text),[path.scriptedSuspectLine]);
    assert.equal(first.solution,undefined);
    const second=toPublicCase(caseData,{...session,reveal_step:1});
    assert.equal(second.ending[1].text,path.followUpScriptedLine);
    assert.equal(second.solution,undefined);
    assert.deepEqual(toPublicCase(caseData,{...session,reveal_step:2}).solution.killerSuspectIds,caseData.solution.killerSuspectIds);
  }
});
test('roleplay receives public context and established admissions, not private persona or solution', () => {
  for (const suspect of caseData.suspects) {
    const prompt=buildRoleplayPrompt({caseData,suspect,revelations:['A previously admitted fact'],evidence:[]});
    assert.ok(!prompt.includes(suspect.persona));
    for (const secret of suspect.secrets ?? []) assert.ok(!prompt.includes(secret.revealedText));
    assert.ok(prompt.includes('A previously admitted fact'));
  }
});
test('a certain negative verdict does not count as proximity or pressure', () => {
  const condition={conditionId:'secret:test',unlockBehavior:{tier:'cooperation',cooperationCue:'ask about work',pressureThreshold:2}};
  const result=advanceUnlockState(condition,undefined,{met:false,confidence:1,proximity:0,reason:'unrelated'},'s','p');
  assert.equal(result.state.max_adjacency,0); assert.equal(result.state.pressure_count,0); assert.equal(result.fired,false);
});
test('cue-less pressure fires precisely at its threshold', () => {
  const condition={conditionId:'secret:test',unlockBehavior:{tier:'pressure',pressureThreshold:2}};
  const a=advanceUnlockState(condition,undefined,{met:false,confidence:0,reason:'count'},'s','p');
  const b=advanceUnlockState(condition,a.state,{met:false,confidence:0,reason:'count'},'s','p');
  assert.equal(a.fired,false);assert.equal(b.fired,true);
});
test('device credentials reject unsigned IDs, tampering, and wrong audiences', async () => {
  process.env.SESSION_AUTH_SECRET='unit-secret-32-characters-long-value';
  const key=new TextEncoder().encode(process.env.SESSION_AUTH_SECRET);
  const id='11111111-2222-4333-8444-555555555555';
  const token=await new SignJWT({}).setProtectedHeader({alg:'HS256'}).setSubject(id).setIssuer('mystery-engine').setAudience('device-identity').setExpirationTime('1h').sign(key);
  assert.equal(await readDeviceToken(id),null);assert.equal(await readDeviceToken(token),id);assert.equal(await readDeviceToken(token+'x'),null);
  const other=await new SignJWT({}).setProtectedHeader({alg:'HS256'}).setSubject(id).setIssuer('mystery-engine').setAudience('authenticated').setExpirationTime('1h').sign(key);
  assert.equal(await readDeviceToken(other),null);
});
test('cross-origin mutations are rejected', () => {
  assert.throws(()=>checkRequestOrigin(new Request('https://game.example/api',{headers:{origin:'https://evil.example'}})));
});
test('realtime token expires no later than session expiry', async () => {
  process.env.SUPABASE_JWT_SECRET='unit-jwt-secret-with-at-least-32-characters';
  const expiry=new Date(Date.now()+10000).toISOString();
  const {token,expiresAt}=await mintSessionRealtimeToken('11111111-2222-4333-8444-555555555555',{sessionExpiresAt:expiry});
  assert.ok(expiresAt<=Date.parse(expiry)/1000);assert.equal(decodeJwt(token).session_expires_at,expiry);
  await assert.rejects(()=>mintSessionRealtimeToken('s',{sessionExpiresAt:new Date(0).toISOString()}));
});
test('answer validation fails closed on provider failure, malformed JSON, and negative verdict', async () => {
  const previous=globalThis.fetch;process.env.OPENROUTER_API_KEY='unit-test';
  const context={caseData,suspect:caseData.suspects[0],revelations:[],evidence:[]};
  try {
    for(const content of ['not json','{"safe":false}','{"safe":"true"}']) {
      globalThis.fetch=async()=>Response.json({choices:[{message:{content}}]});
      assert.equal(await validateRoleplayReply(context,'unsafe','test'),false);
    }
    globalThis.fetch=async()=>{throw new Error('offline')};
    assert.equal(await validateRoleplayReply(context,'unsafe','test'),false);
  } finally {globalThis.fetch=previous;}
});

 test('origin validation uses the requested host when Next uses a bind address', () => {
  assert.doesNotThrow(() => checkRequestOrigin(new Request('http://0.0.0.0:3100/api', {headers: {host: 'localhost:3100', origin: 'http://localhost:3100'}})));
  assert.doesNotThrow(() => checkRequestOrigin(new Request('http://0.0.0.0:3100/api', {headers: {host: '192.168.1.10:3100', origin: 'http://192.168.1.10:3100'}})));
  assert.throws(() => checkRequestOrigin(new Request('http://0.0.0.0:3100/api', {headers: {host: 'localhost:3100', origin: 'https://evil.example'}})));
  assert.throws(() => checkRequestOrigin(new Request('http://0.0.0.0:3100/api', {headers: {host: 'localhost:3100', origin: 'http://localhost:3200'}})));
});

test('briefing projects only public victim fields and the active location', () => {
  const lobby = toPublicCase(caseData, base);
  assert.deepEqual(lobby.victim, {name: caseData.victim.name});
  assert.equal(lobby.sceneLocation, undefined);
  const opening = toPublicCase(caseData, {...base, status: 'in_progress', current_scene: 'brief', current_chapter_id: 'r1-arrival'});
  assert.deepEqual(Object.keys(opening.victim).sort(), ['name', 'portraitUrl', 'publicBackground']);
  assert.equal(opening.victim.portraitUrl, caseData.victim.portraitUrl);
  assert.equal(opening.victim.publicBackground, caseData.victim.publicBackground);
  assert.equal(opening.sceneLocation.imageUrl, 'assets/locations/police-station-arrival.png');
  assert.deepEqual(Object.keys(opening.sceneLocation).sort(), ['imageUrl', 'name']);
  assert.equal(opening.locations, undefined);
  assert.equal(opening.solution, undefined);
  assert.deepEqual(opening.evidence, []);
  const letter = toPublicCase(caseData, {...base, status: 'in_progress', current_chapter_id: 'r1-anonymous-letter'});
  assert.equal(letter.sceneLocation, undefined);
});

test('first unlocked letter keeps its author anonymous', () => {
  const publicCase = toPublicCase(caseData, {...base, status:'in_progress', current_chapter_id:'r1-anonymous-letter', unlocked_evidence:['anonymous-letter-1']});
  const letter = publicCase.evidence.find(e => e.id === 'anonymous-letter-1');
  assert.ok(letter);
  assert.doesNotMatch(JSON.stringify(letter), /Anya|players will eventually/i);
  assert.match(letter.description, /postmark Dehradun/);
  assert.equal(publicCase.solution, undefined);
});

test('recovered phone data is restricted to the active recovery chapter', () => {
  for (const id of ['r1-vikram-life','r3-recap','r4-evidence']) {
    const view=toPublicCase(caseData,{...base,status:'in_progress',phase:'interrogation',current_chapter_id:id});
    assert.ok(!JSON.stringify(view).includes('Not selling. Not now. Not ever.'));
  }
  const phone=toPublicCase(caseData,{...base,status:'in_progress',phase:'interrogation',current_chapter_id:'r4-phone-hack'}).chapters.find(c=>c.type==='phone-hack');
  assert.equal(phone.messages.length,5);
  assert.equal(phone.callLog.length,3);
  assert.equal(phone.notes.length,1);
});
test('timeline and reconstruction locations appear only at the truth stage', () => {
  for (const reveal_step of [0,1]) {
    const view=toPublicCase(caseData,{...base,phase:'reveal',reveal_step});
    assert.equal(view.solutionLocations,undefined);
    assert.equal(view.solution,undefined);
  }
  const view=toPublicCase(caseData,{...base,phase:'reveal',reveal_step:2});
  assert.deepEqual(view.solution.timeline,caseData.solution.timeline);
  assert.ok(view.solutionLocations.every(l=>!('description' in l)));
});
test('released correspondence and working wall do not identify hidden authors or killers', () => {
  const view=toPublicCase(caseData,{...base,unlocked_evidence:['anonymous-letter-2','vikram-working-wall']});
  assert.ok(!view.evidence.find(e=>e.id==='anonymous-letter-2').loreText.includes('Kabir'));
  assert.ok(!view.evidence.find(e=>e.id==='vikram-working-wall').loreText.includes('actually killed'));
});
