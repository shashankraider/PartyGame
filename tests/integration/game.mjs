/** Run against an already running LOCAL app + migrated LOCAL Supabase. Creates and removes only its own sessions. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { loadCase } from '../../src/engine/case-loader.ts';
import { executeInterview } from '../../src/lib/interview-turn.ts';
const base=process.env.INTEGRATION_BASE_URL;
const dbUrl=process.env.INTEGRATION_DB_URL;
if(!base || !dbUrl || ![base,dbUrl].every(u=>['localhost','127.0.0.1'].includes(new URL(u).hostname))) throw new Error('Set local INTEGRATION_BASE_URL and INTEGRATION_DB_URL');
const db=createClient(dbUrl,process.env.INTEGRATION_SERVICE_KEY,{auth:{persistSession:false}});
const anonKey=process.env.INTEGRATION_ANON_KEY;
const game=await loadCase('mussoorie');
const created=[];let checks=0;
function check(condition,message){assert.ok(condition,message);checks++;}
function client(){return {cookie:''};}
async function request(c,path,body,expected=200,extra={}) {
 if(process.env.INTEGRATION_DEBUG) console.log('HTTP',path,body?.action??'');
 const res=await fetch(base+path,{signal:AbortSignal.timeout(15000),method:body===undefined?'GET':'POST',headers:{...(c.cookie?{cookie:c.cookie}:{}),...(body===undefined?{}:{'Content-Type':'application/json',origin:base}),...extra},body:body===undefined?undefined:JSON.stringify(body)});
 const cookie=res.headers.get('set-cookie'); if(cookie)c.cookie=cookie.split(';')[0];
 const text=await res.text();let payload;try{payload=JSON.parse(text)}catch{payload=text}
 assert.equal(res.status,expected,`${path}: ${text.slice(0,250)}`);checks++;
 return payload;
}
async function rpc(name,args,ok=true){if(process.env.INTEGRATION_DEBUG)console.log('RPC',name,ok);const result=await db.rpc(name,args);if(ok)assert.ifError(result.error);else check(Boolean(result.error),name+' should reject');return result.data;}
async function snapshot(id){const {data,error}=await db.from('sessions').select('*').eq('id',id).single();assert.ifError(error);return data;}
async function makeGame(n=2){const host=client();const {session}=await request(host,'/api/sessions',{caseId:'mussoorie'},201);created.push(session.id);const players=await Promise.all(Array.from({length:n},async(_,i)=>{const c=client();const joined=await request(c,'/api/join',{joinCode:session.join_code,name:`Test ${i}`,deviceId:'spoofed-client-id'},201);return {...c,...joined};}));return {host,session,players:players.sort((a,b)=>a.player.seat_number-b.player.seat_number)};}
async function scene(c,id,action,expected=200,more={}){return request(c,`/api/sessions/${id}/scene`,{action,...more},expected);}
async function startInvestigation(g){await request(g.host,`/api/sessions/${g.session.id}/start`,{});let lobby;for(let i=0;i<12;i++){lobby=await request(g.host,`/api/sessions/${g.session.id}`);if(lobby.session.phase==='interrogation')return lobby;await scene(g.host,g.session.id,'next');}throw new Error('Briefing did not end');}
try {
 const g=await makeGame(8);const {session,host,players}=g;const id=session.id;const guest=client();
 check(new Set(players.map(p=>p.player.seat_number)).size===8,'concurrent joins allocate unique seats');
 check(players.every(p=>!('device_id'in p.player)),'no device IDs exposed');
 const rejoined=await request(players[0],'/api/join',{joinCode:session.join_code,name:'Rejoined',deviceId:'different'});check(rejoined.player.id===players[0].player.id,'rejoin bound to signed device');
 for(const path of ['', '/events','/realtime-token','/interview?suspectId=naina','/interview/host-unlock'])await request(guest,`/api/sessions/${id}${path}`,undefined,401);
 await request(players[0],`/api/sessions/${id}/start`,{},403);
 await scene(players[0],id,'pause',403);
 await request(host,`/api/sessions/${id}/start`,{},403,{origin:'https://attacker.example'});
 const lobby=await request(players[0],`/api/sessions/${id}`);check(!lobby.caseData.solution && lobby.caseData.evidence.length===0,'private case stays server-side');
 await request(guest,`/session/${id}/host`,undefined,404);
 await request(players[0],`/session/${id}/player/${players[1].player.id}`,undefined,404);
 const hidden=game.evidence.find(e=>e.printableHtml && e.revealedInRound>=3);const file=hidden.printableHtml.split('/').at(-1);
 await request(players[0],`/api/cases/mussoorie/printables/${file}?sessionId=${id}`,undefined,403);
 const sceneImage = `/api/cases/mussoorie/evidence/crime-scene-summary/image?sessionId=${id}`;
 await request(guest,sceneImage,undefined,401);
 await request(host,sceneImage,undefined,403);
 await request(host,'/api/cases/mussoorie/evidence/crime-scene-summary/image',undefined,401);
 await request(host,'/api/cases/mussoorie/assets/crime-scene/ravine-overview.png',undefined,404);
 const {token}=await request(players[0],`/api/sessions/${id}/realtime-token`);
 async function rest(path,method='GET',body){return fetch(dbUrl+'/rest/v1/'+path,{method,headers:{apikey:anonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});}
 for(const table of ['session_memberships','interview_turns'])check(!(await rest(table+'?select=*')).ok,'private table '+table+' denied');
 check((await (await rest('interview_unlock_state?select=*')).json()).length===0,'unlock reasons hidden by RLS');
 check(!(await rest('players?select=device_id')).ok,'device column denied');
 check(!(await rest('rpc/gc_expired_sessions','POST',{})).ok,'client cannot run GC');
 check(!(await rest('rpc/commit_game_update','POST',{p_session:id,p_revision:0})).ok,'client cannot call mutation RPC');
 const other=await makeGame(1);const foreign=await rest(`sessions?id=eq.${other.session.id}&select=id`);check((await foreign.json()).length===0,'cross-session rows denied');

 const anonymousGames=await request(guest,'/api/sessions');
 check(anonymousGames.sessions.length===0,'anonymous browser cannot list games');
 const hostGames=await request(host,'/api/sessions');
 check(hostGames.sessions.length===1 && hostGames.sessions[0].hostUrl===`/session/${id}/host` && !hostGames.sessions[0].playerUrl,'host can rediscover only its own game');
 const playerGames=await request(players[0],'/api/sessions');
 check(playerGames.sessions.length===1 && !playerGames.sessions[0].hostUrl && playerGames.sessions[0].playerUrl.endsWith(players[0].player.id),'player return link is bound to membership');
 check(!JSON.stringify(hostGames).includes('device_id') && !JSON.stringify(hostGames).includes('unlocked_evidence'),'session list contains no private state');
 const listing=await fetch(base+'/api/sessions',{headers:{cookie:host.cookie}});
 check(listing.headers.get('cache-control')==='private, no-store','saved-game listing is not cached');
 const closedListing=await makeGame(1);
 await request(closedListing.host,`/api/sessions/${closedListing.session.id}/start`,{});
 await scene(closedListing.host,closedListing.session.id,'end-session');
 check((await request(closedListing.host,'/api/sessions')).sessions.length===0,'finished games leave active list');
 const investigation=await startInvestigation(g);
 await request(other.host,sceneImage,undefined,403);
 await request(host,sceneImage.replace('/mussoorie/','/other-case/'),undefined,404);
 const artworkResponse=await fetch(base+sceneImage,{headers:{cookie:players[0].cookie}});
 check(artworkResponse.status===200,'unlocked scene image is available to a member');
 check(artworkResponse.headers.get('cache-control')==='private, no-store','evidence image is not publicly cached');
 check(artworkResponse.headers.get('content-type')==='image/png','scene image has image content type');
 const imageBytes=new Uint8Array(await artworkResponse.arrayBuffer());
 check(imageBytes[0]===137 && imageBytes[1]===80 && imageBytes.length>1000,'scene artwork is a real PNG');

 const visible=investigation.caseData.evidence.find(e=>e.printableHtml);
 await request(players[0],`/api/cases/mussoorie/printables/${visible.printableHtml}?sessionId=${id}`);

 const chapter=game.chapters.find(c=>c.type==='interview'&&c.suspectId==='naina');
 await scene(host,id,'set',200,{scene:'interview',chapterId:chapter.id});
 await request(players[0],`/api/sessions/${id}/interviewer`,{playerId:players[0].player.id});
 await request(players[1],`/api/sessions/${id}/interviewer`,{playerId:players[1].player.id},403);
 await request(players[1],`/api/sessions/${id}/interview`,{playerId:players[0].player.id,question:'hi',requestId:randomUUID()},403);
 const turn=randomUUID(),args={p_session:id,p_player:players[0].player.id,p_id:turn,p_hash:'test'};
 const competing=await Promise.all([db.rpc('begin_interview_turn',args),db.rpc('begin_interview_turn',{...args,p_id:randomUUID()})]);
 check(competing.filter(r=>!r.error).length===1,'one concurrent question accepted');
 await scene(host,id,'pause');
 const {data:pending}=await db.from('interview_turns').select('*').eq('session_id',id);const cancelled=pending.find(t=>t.status==='cancelled');check(Boolean(cancelled),'pause cancels pending answer');
 await rpc('commit_game_update',{p_session:id,p_revision:cancelled.revision,p_turn:cancelled.id,p_attempt:cancelled.attempt_id,p_messages:[{role:'assistant',suspect_id:'naina',content:'late'}]},false);
 await scene(host,id,'set',409,{scene:'interview',chapterId:chapter.id});
 await request(players[0],`/api/sessions/${id}/interviewer`,{playerId:players[0].player.id},409);
 await scene(host,id,'resume');
 const retryId=randomUUID();const retryArgs={...args,p_id:retryId};const first=await rpc('begin_interview_turn',retryArgs);
 await db.from('interview_turns').update({lease_until:new Date(0).toISOString()}).eq('id',retryId);
 const second=await rpc('begin_interview_turn',retryArgs);check(first.attemptId!==second.attemptId,'expired retry gets fresh fencing token');
 const s=await snapshot(id);const commit={p_session:id,p_revision:s.revision,p_turn:retryId,p_messages:[{role:'user',suspect_id:'naina',content:'Where were you?',asked_by_player_id:players[0].player.id},{role:'assistant',suspect_id:'naina',content:'At the hotel.'}],p_patch:{unlocked_evidence:s.unlocked_evidence}};
 await rpc('commit_game_update',{...commit,p_attempt:first.attemptId},false);
 const saved=await rpc('commit_game_update',{...commit,p_attempt:second.attemptId});check(saved.messages.length===2&&saved.messages[1].sequence===saved.messages[0].sequence+1,'exchange stored atomically in order');
 const duplicate=await rpc('begin_interview_turn',retryArgs);check(duplicate.completed&&duplicate.result.messages[0].id===saved.messages[0].id,'retry returns committed result');
 await rpc('begin_interview_turn',{...retryArgs,p_hash:'changed'},false);
 // Inject a provider outage into the real turn orchestrator; the database is real.
 const nativeFetch=globalThis.fetch;const priorKey=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='test';
 globalThis.fetch=async(input,init)=>String(input).startsWith('https://openrouter.ai')?Promise.reject(new Error('provider offline')):nativeFetch(input,init);
 try {await assert.rejects(()=>executeInterview({sessionId:id,playerId:players[0].player.id,question:'Tell me about your work.',requestId:randomUUID()}));checks++;} finally {globalThis.fetch=nativeFetch;if(priorKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=priorKey;}
 const afterFailure=await request(host,`/api/sessions/${id}`);check(!afterFailure.turnPending,'failed provider releases turn');
 const transcript=await request(players[0],`/api/sessions/${id}/interview?suspectId=naina`);check(transcript.messages.length===2&&transcript.messages.every(m=>!m.is_streaming),'outage leaves no partial messages');
 await request(players[0],`/api/sessions/${id}/interview/host-unlock`,undefined,403);
 const help=await request(host,`/api/sessions/${id}/interview/host-unlock`);check(help.fallbacks.some(f=>f.subject==='secret'),'secret rescue available');
 await request(host,`/api/sessions/${id}/interview/host-unlock`,{conditionId:help.fallbacks.find(f=>f.subject==='secret').conditionId});

 // A later turn must retain the authored admission. Unsafe provider output must
 // never enter the transcript, even when the provider attempts a spoiler.
 const recordedPrompts=[];
 const restoredFetch=globalThis.fetch;const savedKey=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='test';
 globalThis.fetch=async(input,init)=>{
   if(!String(input).startsWith('https://openrouter.ai'))return restoredFetch(input,init);
   const body=JSON.parse(init.body);const system=body.messages[0].content;recordedPrompts.push(system);
   if(system.startsWith('You are Naina'))check((await snapshot(id)).current_interviewer_player_id===players[0].player.id,'microphone stays with interviewer until answer commit');
   const content=system.startsWith('You are Naina')?'I ordered the murder.':system.includes('story-fidelity validator')?'{"safe":false}':system.includes('AI host')?'{"action":"do-nothing","reason":"wait","confidence":1}':'{"met":false,"confidence":1,"proximity":0,"reason":"unrelated"}';
   return Response.json({choices:[{message:{content}}]});
 };
 try {
   const actual=await executeInterview({sessionId:id,playerId:players[0].player.id,question:'What else can you tell us?',requestId:randomUUID()});
   check(!actual.assistantMessage.content.includes('ordered the murder'),'unsafe draft never committed');
   const {data:states}=await db.from('interview_unlock_state').select('condition_id').eq('session_id',id).eq('met_via','host');
   const secret=game.suspects.find(s=>s.id==='naina').secrets.find(s=>`secret:${s.id}`===states[0].condition_id);
   check(recordedPrompts.some(p=>p.startsWith('You are Naina')&&p.includes(secret.revealedText)),'established admissions included on later turns');
   const third=await executeInterview({sessionId:id,playerId:players[0].player.id,question:'Can you clarify that?',requestId:randomUUID()});
   check(third.session.current_interviewer_player_id===players[0].player.id,'three answers do not exhaust an active microphone');
 } finally {globalThis.fetch=restoredFetch;if(savedKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=savedKey;}
 await scene(players[0],id,'extend-interview',403);
 const beforeExtension=await snapshot(id);
 const extended=await scene(host,id,'extend-interview');
 check(extended.session.interview_clocks.naina>beforeExtension.interview_clocks.naina+115,'host adds two minutes through the API');
 const recording=`/api/cases/mussoorie/recording/film?sessionId=${id}`;
 await request(guest,recording,undefined,401);
 await request(host,recording,undefined,403);
 await request(host,`/api/cases/mussoorie/evidence/office-rifle-photo/image?sessionId=${id}`,undefined,403);
 await scene(players[0],id,'next-file',403);
 await scene(host,id,'pause');await scene(host,id,'next-file',409);await scene(host,id,'resume');
 for(const chapterId of ['r3-second-letter','r3-thakur-research','r3-recap','r4-phone-hack','r4-evidence']) {
   const file=await scene(host,id,'next-file');
   check(file.session.current_chapter_id===chapterId,'research sequence opens '+chapterId);
   check(!file.caseData.solution && !file.caseData.solutionLocations,'research never exposes final reconstruction');
   if(chapterId==='r4-phone-hack')check(file.caseData.chapters.some(c=>c.type==='phone-hack'&&c.messages.length===5),'recovered phone files available');
 }
 await scene(host,id,'next-file',409);
 // Research navigation cannot bypass requested reports or their dependent evidence.
 for(const evidenceId of ['bisht-devraj-call','devraj-phone-location','devraj-duty-log','devraj-lathi-forensics','devraj-jeep-cctv','lathi-postmortem']) {
   const evidence=game.evidence.find(e=>e.id===evidenceId);
   await request(host,`/api/cases/mussoorie/printables/${evidence.printableHtml.split('/').at(-1)}?sessionId=${id}`,undefined,403);
 }
 await request(host,`/api/cases/mussoorie/evidence/devraj-jeep-cctv/image?sessionId=${id}`,undefined,403);
 // Establish the discovery fixture only after verifying the lock, to exercise image authorization below.
 const beforeArtwork=await snapshot(id);
 await rpc('commit_game_update',{p_session:id,p_revision:beforeArtwork.revision,p_patch:{unlocked_evidence:[...beforeArtwork.unlocked_evidence,'bisht-devraj-call','devraj-jeep-cctv']}});
 const originalPhoto=await request(host,`/api/cases/mussoorie/printables/office-rifle-photo.html?sessionId=${id}`);
 check(originalPhoto.includes(`/evidence/office-rifle-photo/image?sessionId=${id}`)&&!originalPhoto.includes('__EVIDENCE_IMAGE__'),'original photo uses protected artwork');
 const secondLetter=await request(host,`/api/cases/mussoorie/printables/anonymous-letter-2.html?sessionId=${id}`);
 check(secondLetter.includes('Bangalore postmark')&&!secondLetter.includes('hand-delivered'),'letter original matches canonical provenance');

 for(const evidenceId of ['office-rifle-photo','wall-mount-photo','devraj-jeep-cctv','grey-shawl-fresh','building-cctv-rhea']) {
   const url=`/api/cases/mussoorie/evidence/${evidenceId}/image?sessionId=${id}`;
   await request(other.host,url,undefined,403);
   const response=await fetch(base+url,{headers:{cookie:host.cookie}});
   check(response.status===200 && response.headers.get('cache-control')==='private, no-store','unlocked artwork protected: '+evidenceId);
   await response.arrayBuffer();
 }
 await scene(host,id,'open-accusation');await scene(host,id,'next',409);
 await request(players[0],`/api/sessions/${id}/accusation`,{playerId:players[1].player.id,suspectId:game.suspects[0].id},403);
 await Promise.all(players.map(p=>request(p,`/api/sessions/${id}/accusation`,{playerId:p.player.id,suspectId:game.endgame.paths[0].triggerSuspectId})));
 let ending=await scene(host,id,'next');check(ending.session.endgame_path_id===game.endgame.paths[0].id&&!ending.caseData.solution,'first branch begins without early solution');
 ending=await scene(host,id,'next');check(ending.caseData.ending.length===2&&!ending.caseData.solution,'follow-up confrontation');
 ending=await scene(host,id,'next');check(Boolean(ending.caseData.solution),'truth revealed');
 const media=await fetch(base+recording,{headers:{cookie:host.cookie,range:'bytes=0-99'}});
 check(media.status===206 && media.headers.get('content-range').startsWith('bytes 0-99/'),'recording supports seeking after truth');
 check((await media.arrayBuffer()).byteLength===100,'range serves requested bytes');
 await request(host,recording,undefined,416,{range:'bytes=999999999-'});
 const captions=await request(host,`/api/cases/mussoorie/recording/captions?sessionId=${id}`);
 check(captions.startsWith('WEBVTT'),'accessible captions available');
 const webm=await fetch(base+`/api/cases/mussoorie/recording/browser-film?sessionId=${id}`,{headers:{cookie:host.cookie,range:'bytes=0-99'}});
 check(webm.status===206 && webm.headers.get('content-type')==='video/webm','compatible recording supports authenticated range download');
 check(webm.headers.get('content-disposition').startsWith('attachment;'),'recording downloads without invoking embedded playback');
 await request(other.host,recording,undefined,403);
 ending=await scene(host,id,'next');check(ending.session.status==='finished','game finishes');
 await request(host,`/api/sessions/${id}/start`,{},409);await scene(host,id,'resume',409);await scene(host,id,'set',409,{scene:'interview',chapterId:chapter.id});
 await request(players[0],`/api/sessions/${id}/accusation`,{playerId:players[0].player.id,suspectId:game.suspects[0].id},409);
 await startInvestigation(other);await scene(other.host,other.session.id,'open-accusation');
 await request(other.players[0],`/api/sessions/${other.session.id}/accusation`,{playerId:other.players[0].player.id,suspectId:game.endgame.paths[1].triggerSuspectId});
 const branch2=await scene(other.host,other.session.id,'next');check(branch2.session.endgame_path_id===game.endgame.paths[1].id,'second branch reachable');
 await db.from('sessions').update({expires_at:new Date(0).toISOString()}).eq('id',other.session.id);
 for(const path of ['', '/realtime-token'])await request(other.host,`/api/sessions/${other.session.id}${path}`,undefined,410);
 await scene(other.host,other.session.id,'next',410);
 await request(client(),'/api/join',{joinCode:other.session.join_code,name:'late'},410);
 console.log(`PASS: ${checks} integration assertions (auth, RLS, concurrency, recovery, lifecycle, both endings).`);
} finally {for(const id of created){const {error}=await db.from('sessions').delete().eq('id',id);if(error)console.error('Test cleanup failed:',error.code);}}
