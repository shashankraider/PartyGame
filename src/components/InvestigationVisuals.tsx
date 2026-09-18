"use client";

import { useState, useSyncExternalStore, useRef } from "react";
import type { Chapter } from "@/engine/types";
import type { PublicCase, PublicEvidence } from "@/lib/public-case";
import type { LobbySnapshot } from "@/lib/session-realtime";
import { getEvidencePrintableUrl } from "@/lib/printables";
import { EVIDENCE_ART } from "@/lib/evidence-art";
import { CaseArtwork } from "./CaseArtwork";

export const caseAsset = (c: PublicCase, path?: string) => path ? `/api/cases/${c.id}/assets/${path.replace(/^assets\//, "")}` : "";
const imageUrl = (c: PublicCase, e: PublicEvidence) => `/api/cases/${c.id}/evidence/${e.id}/image?sessionId=${encodeURIComponent(c.sessionId)}`;
const kind = (e: PublicEvidence) => /cctv/i.test(e.title) ? "CCTV" : /photo|shawl|scene/i.test(e.title) ? "Photograph" : /phone|whatsapp|instagram|youtube|memo.*recorded/i.test(e.title) ? "Digital" : /statement/i.test(e.title) ? "Testimony" : "Document";

export function EvidenceVisual({ caseData: c, evidence: e, small = false }: { caseData: PublicCase; evidence: PublicEvidence; small?: boolean }) {
  if (c.id === "mussoorie" && EVIDENCE_ART[e.id]) return <figure className={`exhibit-image${e.id.includes("cctv") ? " exhibit-cctv" : ""}`}><CaseArtwork src={imageUrl(c,e)} alt={e.description} />{!small && <figcaption>{e.id === "building-cctv-rhea" ? "VIKRAM’S LANE · 05:02 · Illustrated reconstruction of the recorded observation" : e.id === "devraj-jeep-cctv" ? "CAMEL’S BACK ROAD · 20:10 · Illustrated reconstruction of the recorded observation" : "Illustrated exhibit · Read the source notes below"}</figcaption>}</figure>;
  if (e.id === "youtube-channel-page") return <ChannelExhibit caseData={c}/>;
  if (e.id === "vikram-working-wall") return <div className="working-wall"><p>Vikram’s working notes · questions, not conclusions</p><div className="working-wall-grid">{[["BISHT","TROPHY?? — see Thakur"],["DEVRAJ","Why so thin?"],["ANYA","Won’t sit · ?"],["KABIR","Loose thread · thesis — decide"]].map(([name,note])=><div key={name}><strong>{name}</strong><span>{note}</span></div>)}</div><footer>Bisht & Devraj each linked to the 2011 clipping. No direct line between them. Anya and Kabir unconnected.</footer></div>;
  if (e.id === "bisht-devraj-call") return <div className="exhibit-flow"><span>20:00</span><strong>Bisht → Devraj</strong><b>47 seconds</b><small>Personal mobiles · Telecom record</small></div>;
  if (e.id === "land-registry" || e.id === "anya-payments") return <div className="exhibit-flow">{(e.id === "land-registry" ? ["Adjacent Thakur plots · 2012–2024", "Highland Properties LLP", "Three layers of trusts / proxies", "Trust controlled by Rajveer Bisht"] : ["Bisht-controlled account", "Monthly transfers since early 2012", "Education trust", "Rohan Devi · beneficiary"]).map((text,i)=><div key={text}>{i>0 && <span aria-hidden="true">↓</span>}<strong>{text}</strong></div>)}</div>;
  if (e.id === "lathi-postmortem") return <div className="exhibit-medical"><svg viewBox="0 0 240 180" role="img" aria-label="Non-graphic schematic indicating a localised injury at the base of the skull"><path d="M85 130V105C50 76 63 20 118 20S185 75 153 105V130M85 130L45 160M153 130L193 160" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="120" cy="109" r="13" fill="none" stroke="#b65846" strokeWidth="3"/><path d="M134 109H225" stroke="#b65846" strokeWidth="2"/></svg><strong>Base of skull</strong><p>Single localised cylindrical impact, before death. See the independent medical review.</p></div>;
  return <div className={`exhibit-type exhibit-type--${kind(e).toLowerCase()}`} aria-hidden="true"><span>{kind(e)==="Digital" ? "▤" : kind(e)==="CCTV" ? "◉" : kind(e)==="Testimony" ? "“ ”" : "▱"}</span><small>{kind(e)}</small><div className="exhibit-lines" /></div>;
}

function ChannelExhibit({ caseData }: { caseData: PublicCase }) {
  return <figure className="channel-exhibit" aria-label="Hidden Mussoorie channel exhibit">
    <div className="channel-browser-bar"><span className="channel-youtube-mark" aria-hidden="true">▶</span><strong>YouTube</strong><span>Channel archive</span></div>
    <div className="channel-banner">
      <CaseArtwork src={caseAsset(caseData, "locations/camels-back-road-illustrated.png")} alt="Misty hills and cedar trees above Mussoorie"/>
      <div><span>VIKRAM SINGH</span><strong>HIDDEN<br/>MUSSOORIE</strong><p>Forgotten places. Untold stories.</p></div>
    </div>
    <div className="channel-identity">
      <div className="channel-avatar"><CaseArtwork src={caseAsset(caseData, caseData.victim.portraitUrl)} alt="Vikram Singh" portrait/></div>
      <div><h4>Hidden Mussoorie</h4><p>@hiddenmussoorie · 412K subscribers</p><p>Exploring the forgotten places in the hills.</p></div>
    </div>
    <div className="channel-section-label">Scheduled upload</div>
    <div className="channel-feature">
      <div className="channel-thumbnail">
        <CaseArtwork src={caseAsset(caseData, "locations/vikrams-cottage-illustrated.png")} alt="Illustrated study inside Vikram’s cottage"/>
        <div><span>THE TRUTH ABOUT</span><strong>MUSSOORIE</strong></div>
        <span className="channel-unpublished">UNPUBLISHED</span>
      </div>
      <div className="channel-video-copy"><h4>The Truth About Mussoorie</h4><p className="channel-coming-soon">Coming soon</p><blockquote>“The secrets this hill town doesn’t want you to see.”</blockquote><p className="channel-video-status">Never published · Video unavailable</p></div>
    </div>
    <figcaption>Illustrated reconstruction of the channel exhibit · No playable video was released.</figcaption>
  </figure>;
}

export function ExhibitDetail({ caseData, evidence }: { caseData: PublicCase; evidence: PublicEvidence }) {
  const original = getEvidencePrintableUrl(caseData.id, evidence, caseData.sessionId);
  return <article className="exhibit-detail"><EvidenceVisual caseData={caseData} evidence={evidence}/><p className="case-eyebrow">{evidence.category} / Round {evidence.revealedInRound}</p><h3 className="case-serif">{evidence.title}</h3><p>{evidence.description}</p><details><summary>Read investigator notes</summary><p className="exhibit-notes">{evidence.loreText}</p></details>{original && <details><summary>Inspect original document</summary><iframe src={original} title={evidence.title} sandbox="allow-same-origin" loading="lazy"/><a href={original} target="_blank" rel="noreferrer">Open full-page exhibit ↗</a></details>}</article>;
}

const reviewEvent = "case-exhibit-reviewed";
function subscribeReview(callback: () => void) { window.addEventListener(reviewEvent,callback); window.addEventListener("storage",callback); return () => {window.removeEventListener(reviewEvent,callback);window.removeEventListener("storage",callback);}; }
function readReviewed(key: string) { try {return window.localStorage.getItem(key) ?? "";} catch {return "";} }

export function EvidenceGallery({ caseData, focusIds = [], title = "Evidence locker", onlyFocused = false }: {
  caseData: PublicCase;
  focusIds?: string[];
  title?: string;
  onlyFocused?: boolean;
}) {
  const detailRef = useRef<HTMLDivElement>(null);
  const [selectedFocus, setSelectedFocus] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);
  const focusKey = focusIds.join(",");
  const reviewKey = `case-reviewed:${caseData.sessionId}`;
  const reviewedValue = useSyncExternalStore(subscribeReview, () => readReviewed(reviewKey), () => "");
  const reviewed = new Set(reviewedValue.split(","));
  const available = onlyFocused ? caseData.evidence.filter(e => focusIds.includes(e.id)) : caseData.evidence;
  const items = available.filter(e => filter === "All" || kind(e) === filter);
  const evidence = (selectedFocus === focusKey ? items.find(e => e.id === selected) : undefined)
    ?? items.find(e => focusIds.includes(e.id));

  function selectExhibit(id: string) {
    setSelected(id);
    setSelectedFocus(focusKey);
    requestAnimationFrame(() => {
      detailRef.current?.focus({ preventScroll: true });
      detailRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
    try {
      window.localStorage.setItem(reviewKey, [...new Set([...reviewed, id])].join(","));
      window.dispatchEvent(new Event(reviewEvent));
    } catch { /* Browsing remains usable with storage disabled. */ }
  }

  function filterExhibits(value: string) {
    setFilter(value);
    setSelected(available.find(e => value === "All" || kind(e) === value)?.id ?? null);
    setSelectedFocus(focusKey);
  }

  return <section className="visual-locker">
    <div className="visual-section-title"><h3 className="case-serif">{title}</h3><span aria-live="polite">{items.length} {onlyFocused ? `${items.length === 1 ? "clue" : "clues"} in this chapter` : `${items.length === 1 ? "released exhibit" : "released exhibits"}`}{filter !== "All" ? ` · ${filter}` : ""}</span></div>
    <p className="evidence-gallery-help">{onlyFocused ? "These clues have just been added to the investigation. Select one to inspect it together." : "Select an exhibit to read its details and source notes."}</p>
    <div className="visual-filters" role="group" aria-label="Filter evidence">
      {["All", ...new Set(available.map(kind))].map(k => <button key={k} type="button" aria-pressed={filter === k} onClick={() => filterExhibits(k)}>{k}</button>)}
    </div>
    <div className="exhibit-grid">{items.map(e => <button key={e.id} type="button" onClick={() => selectExhibit(e.id)} aria-label={`Inspect ${e.title}`} aria-pressed={evidence?.id === e.id} className="exhibit-choice">
      <span className="case-eyebrow">{kind(e)}{!reviewed.has(e.id) ? " · NEW" : ""}</span><strong>{e.title}</strong>
    </button>)}</div>
    {!items.length && <p>No released exhibits in this category.</p>}
    {evidence && <div ref={detailRef} tabIndex={-1} className="selected-exhibit"><ExhibitDetail key={evidence.id} caseData={caseData} evidence={evidence}/></div>}
    {onlyFocused && <p className="evidence-gallery-help">Earlier clues remain in the digital case file.</p>}
  </section>;
}

export function SuspectDossiers({ caseData }: { caseData: PublicCase }) {
  return <div className="dossier-grid">{caseData.suspects.map(s=><article className="suspect-dossier" key={s.id}><CaseArtwork src={caseAsset(caseData,s.portraitUrl)} alt={s.name} portrait/><p className="case-eyebrow">Person of interest</p><h3 className="case-serif">{s.name}</h3><p>{s.shortDescription}</p><details><summary>Known information</summary>{caseData.evidence.filter(e=>e.relatesToSuspectIds?.includes(s.id)).map(e=><details key={e.id}><summary>{e.title}</summary><ExhibitDetail caseData={caseData} evidence={e}/></details>)}<p>Only released case-file material appears here.</p></details></article>)}</div>;
}

export function VisualCaseBoard({ caseData: c, chapter, compact = false }: { caseData: PublicCase; chapter: Chapter | null; compact?: boolean }) {
  const fresh: string[] = chapter?.type === "evidence-reveal" ? chapter.evidenceIds : [];
  const victim = chapter?.id === "r1-vikram-life";
  const recap = chapter?.id === "r3-recap";
  const archive = chapter?.id === "r3-thakur-research";
  return <section className="visual-stage"><header className="visual-stage-header"><p className="case-eyebrow">Round {chapter?.roundNumber} / Investigation</p><h2 className="case-serif">{chapter?.title ?? "Case file"}</h2></header>{c.sceneLocation?.imageUrl && <figure className="visual-establishing"><CaseArtwork src={caseAsset(c,c.sceneLocation.imageUrl)} alt={c.sceneLocation.name}/><figcaption>{c.sceneLocation.name}</figcaption></figure>}{victim && <div className="victim-profile"><CaseArtwork src={caseAsset(c,c.victim.portraitUrl)} alt={c.victim.name} portrait/><div><p className="case-eyebrow">Victim / Creator / Investigator</p><h3 className="case-serif">{c.victim.name}</h3><p>{c.victim.publicBackground}</p></div></div>}<div className="visual-narration">{chapter?.type === "narrative" && chapter.beats.map((b,i)=><blockquote key={i}>{b.speaker && <small>{b.speaker}</small>}<p>{b.text}</p></blockquote>)}{chapter?.type === "evidence-reveal" && <p>{chapter.narration}</p>}</div>{(chapter?.id === "r1-suspect-board" || recap) && <SuspectDossiers caseData={c}/>} {archive && <div className="exhibit-comparison">{["wall-mount-photo","office-rifle-photo"].map(id=>{const e=c.evidence.find(e=>e.id===id);return e ? <ExhibitDetail key={id} caseData={c} evidence={e}/> : null;})}</div>}{recap && <div className="visual-recap"><p className="case-eyebrow">Source-linked investigation board</p><p>Open each dossier to inspect its released sources. Connections identify people mentioned in an exhibit; they do not establish guilt.</p><label>Your theory notes <textarea placeholder="Record your questions and competing explanations…" aria-label="Personal theory notes" /></label><small>Private scratchpad for this screen; notes are not shared or saved.</small></div>}{compact ? <div className="player-new-exhibits">{c.evidence.filter(e=>fresh.includes(e.id)).map(e=><details key={e.id}><summary>{e.title}</summary><ExhibitDetail caseData={c} evidence={e}/></details>)}<p>Open Case file above to browse all released evidence.</p></div> : <><EvidenceGallery key={chapter?.id} caseData={c} focusIds={fresh} onlyFocused={fresh.length > 0} title={fresh.length ? "New clues in this chapter" : "Released evidence"}/>{fresh.length > 0 && <details className="phone-interview-locker"><summary>Digital case file · all {c.evidence.length} released exhibits</summary><EvidenceGallery caseData={c} title="Complete case file"/></details>}</>}</section>;
}

export function RecoveredPhone({ chapter, compact = false }: { chapter: Chapter | null; compact?: boolean }) {
  const [tab, setTab] = useState("Messages");
  if (chapter?.type !== "phone-hack") return null;
  return <section className="phone-recovery"><div><p className="case-eyebrow">CBI Cyber Unit / Recovery complete</p><h2 className="case-serif">Inside Vikram’s phone</h2>{compact ? <details><summary>About this recovery</summary><p>{chapter.intro}</p></details> : <p>{chapter.intro}</p>}<p className="recovery-label">Recovered-file review</p>{!compact && <p>Read the files together. The host opens the next case file when everyone is ready.</p>}</div><div className="recovered-device"><div className="device-speaker"/><p className="case-eyebrow">{chapter.phoneOwner} / Forensic copy</p><div className="visual-filters" role="group" aria-label="Recovered phone files">{["Messages","Calls","Notes"].map(t=><button type="button" key={t} onClick={()=>setTab(t)} aria-pressed={t===tab}>{t}</button>)}</div><div className="device-files">{tab==="Messages" && chapter.messages?.map((m,i)=><article className={`recovered-message${m.from==="Vikram" ? " recovered-message--sent" : ""}`} key={i}><strong>{m.from}{m.to ? ` → ${m.to}` : ""}</strong><p>{m.text}</p><small>{m.timestamp}</small></article>)}{tab==="Calls" && chapter.callLog?.map((m,i)=><article className="recovered-call" key={i}><span aria-hidden="true">↗</span><div><strong>{m.with}</strong><p>{m.direction} · {m.durationSeconds ?? 0}s</p><small>{m.timestamp}</small></div></article>)}{tab==="Notes" && chapter.notes?.map((m,i)=><article className="recovered-note" key={i}><h3>{m.title}</h3><small>{m.lastEditedDisplay}</small><p>{m.body}</p></article>)}</div></div></section>;
}

export function VisualEnding({ caseData: c, lobby, playerId }: { caseData: PublicCase; lobby: LobbySnapshot; playerId?: string }) {
  const [visible, setVisible] = useState(1);
  const finished = lobby.session.status === "finished";
  const latest = c.ending.at(-1);
  const speaker = c.suspects.find(s=>s.name===latest?.speaker);
  const timeline = c.solution?.timeline ?? [];
  const vote = lobby.accusationVotes.find(v=>v.player_id===playerId);
  const selected = c.suspects.find(s=>s.id===vote?.suspect_id);
  const locations = c.solutionLocations ?? [];
  const sourceIds = c.id === "mussoorie" ? [
    ["chai-shop-receipt"],[],["vikram-research-notes"],["anya-bus-ticket"],[],[],["bisht-devraj-call","bisht-hotel-cctv-log"],["devraj-jeep-cctv"],[],["lathi-postmortem"],["shopkeeper-statement-naina"],["police-report"],["anya-bus-ticket"],["building-cctv-rhea","vikram-research-notes"],["crime-scene-summary"],["police-report"],["anonymous-letter-1"],["anonymous-letter-2"]
  ] : [];
  const decisive = ["bisht-devraj-call","devraj-jeep-cctv","lathi-postmortem","office-rifle-photo","anya-payments"];
  return <section className="visual-ending"><p className="case-eyebrow">{finished ? "CBI / Investigation concluded" : c.solution ? "Reconstruction / The truth" : "Confrontation"}</p><h2 className="case-serif">{finished ? "Case closed." : c.solution ? "The night, reconstructed." : "The story breaks."}</h2>{!c.solution && latest && <div className="speaker-reveal">{speaker && <CaseArtwork src={caseAsset(c,speaker.portraitUrl)} alt={speaker.name} portrait/>}<blockquote><p className="case-eyebrow">{latest.speaker}</p><p>{latest.text}</p></blockquote></div>}{c.ending.length>1 && <details><summary>Earlier exchange</summary>{(c.solution ? c.ending : c.ending.slice(0,-1)).map((b,i)=><blockquote key={i}><strong>{b.speaker}</strong><p>{b.text}</p></blockquote>)}</details>}{c.solution && <><div className="ending-responsible">{c.solution.killerSuspectIds.map(id=>{const s=c.suspects.find(s=>s.id===id);return <article key={id}>{s && <CaseArtwork src={caseAsset(c,s.portraitUrl)} alt={s.name} portrait/>}<div><p className="case-eyebrow">{c.solution?.killerRoles?.[id] ?? "Responsible"}</p><h3>{s?.name}</h3></div></article>;})}</div>{c.solution.revealNarration.map((b,i)=><blockquote key={i}><p>{b.text}</p></blockquote>)}{finished && <div className="closed-dossier"><p className="case-eyebrow">Investigating team</p><div className="visual-roster">{lobby.players.map(p=><span key={p.id}>{p.name}{p.is_observer ? " · Observer" : ` · Detective ${p.seat_number}`}</span>)}</div>{playerId && <p>{selected ? `Your accusation: ${selected.name}. ${c.solution.killerSuspectIds.includes(selected.id) ? "You identified a responsible suspect." : "The reconstruction reveals who was responsible."}` : "You observed this investigation."}</p>}</div>}<details open={!playerId || undefined}><summary>Explore the case locations</summary><div className="truth-map"><TownMap caseData={c}/><p className="case-eyebrow">Case locations · schematic index, not to scale</p><div>{locations.map(l=><figure key={l.id}><CaseArtwork src={caseAsset(c,l.imageUrl)} alt={l.name}/><figcaption>{l.name}</figcaption></figure>)}</div></div></details><details open={!playerId || undefined}><summary>Reconstruct the timeline</summary><ol className="truth-timeline">{timeline.slice(0, finished ? timeline.length : visible).map((event,i)=><li key={i}><strong>{event.time}</strong><div><p>{event.description}</p><small>{locations.find(l=>l.id===event.locationId)?.name}</small>{sourceIds[i]?.map(id=>{const e=c.evidence.find(e=>e.id===id);return e ? <details key={id}><summary>Related source · {e.title}</summary><ExhibitDetail caseData={c} evidence={e}/></details> : null;})}<div className="timeline-actors">{event.actors?.map(id=>{const s=c.suspects.find(s=>s.id===id);return s ? <span key={id}><CaseArtwork src={caseAsset(c,s.portraitUrl)} alt="" portrait/>{s.name}</span> : null;})}</div></div></li>)}</ol>{!finished && visible<timeline.length && <button type="button" className="visual-primary" onClick={()=>setVisible(v=>v+1)}>Next event · {visible} of {timeline.length}</button>}</details><RecoveredRecording caseData={c}/>{!playerId && <EvidenceGallery caseData={c} focusIds={decisive.filter(id=>c.evidence.some(e=>e.id===id))} title="Supporting exhibits"/>}</>}</section>;
}

export function GameStatus({ paused, pending, error, activeName }: { paused: boolean; pending?: boolean; error?: string | null; activeName?: string }) {
  if (!paused && !pending && !error) return null;
  return <aside className="game-status-panel" role="status" aria-live="polite"><span aria-hidden="true">{paused ? "Ⅱ" : error ? "↻" : "◉"}</span><div><strong>{paused ? "Investigation paused" : error ? "Connection needs attention" : "The suspect is answering"}</strong><p>{paused ? "Your current scene is preserved. The host can resume the game." : error ? "Reconnecting automatically. You can reload to retrieve the latest saved game state." : `${activeName ?? "The active detective"} has the floor. Evidence appears after the answer is complete.`}</p>{error && <button type="button" onClick={()=>window.location.reload()}>Reconnect now</button>}</div></aside>;
}

function TownMap({caseData:c}: {caseData:PublicCase}) {
  const points: Record<string,[number,number,string]> = {"thakur-cottage":[110,60,"Thakur Cottage"],"vikrams-cottage":[320,75,"Vikram’s cottage"],"royal-pines":[540,65,"Royal Pines"],"cedar-grove":[190,180,"Cedar grove"],"camels-back-road":[420,195,"Camel’s Back Road"],"lovely-omelette":[100,310,"Lovely Omelette"],"police-station":[330,315,"Police station"],"bus-stand":[550,305,"Bus stand"]};
  return <svg className="town-schematic" viewBox="0 0 660 370" role="img" aria-label="Schematic case map: Thakur and Vikram cottages, Royal Pines, Cedar Grove, Camel’s Back Road, Lovely Omelette, police station and bus stand. Positions are illustrative, not geographical."><path d="M35 130Q180 15 335 145T625 130M30 270Q220 160 350 270T635 270" stroke="#788e7160" strokeWidth="2" fill="none" strokeDasharray="5 6"/>{(c.solutionLocations??[]).filter(l=>points[l.id]).map(l=>{const [x,y,label]=points[l.id];return <g key={l.id}><circle cx={x} cy={y} r="7" fill="#d4ad67"/><text x={x} y={y+27} textAnchor="middle" fill="#f1e8d2" fontSize="14">{label}</text></g>;})}</svg>;
}
function RecoveredRecording({caseData:c}: {caseData:PublicCase}) {
  if(c.id!=="mussoorie" || !c.solution) return null;
  const url=(file:string)=>`/api/cases/${c.id}/recording/${file}?sessionId=${encodeURIComponent(c.sessionId)}`;
  return <details className="recording-appendix"><summary>Final recording · bonus dramatization</summary><p>This illustrated sequence accompanies the solved case. The script’s 8:07 PM sighting describes a jeep following on the approach; the 8:10 PM CCTV records the jeep at Gun Hill. The earlier sighting does not independently establish the driver’s identity.</p><CaseArtwork src={url("poster")} alt="Illustrated still from Vikram’s final recording"/><p>Download the film to watch in your video player. English captions and the transcript are available separately.</p><div className="visual-filters"><a className="visual-primary" href={url("film")} download="vikram-final-recording.mp4">Download film · MP4</a><a className="visual-primary" href={url("captions")} download="vikram-final-recording.vtt">English captions · VTT</a></div><details><summary>Read transcript</summary><p>Vikram: Okay… camera’s on. Vikram Singh. Camel’s Back Road. I was right. The Thakur robbery wasn’t a robbery. Someone has spent fifteen years burying it. Wait… that jeep. It’s been following me since Library Chowk. If this uploads, they failed to stop me. I need to— [Recording corrupted]</p></details></details>;
}
