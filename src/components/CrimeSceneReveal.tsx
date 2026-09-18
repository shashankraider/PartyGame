"use client";
import { useState } from "react";
import { CaseArtwork } from "@/components/CaseArtwork";
import type { Chapter } from "@/engine/types";
import type { PublicCase } from "@/lib/public-case";
import { getEvidencePrintableUrl } from "@/lib/printables";

export function hasCrimeScene(caseData: PublicCase, chapter: Chapter | null, unlocked: string[]) {
  return caseData.id === "mussoorie" && chapter?.type === "evidence-reveal" && chapter.id === "r1-crime-scene" && chapter.evidenceIds.includes("crime-scene-summary") && unlocked.includes("crime-scene-summary") && caseData.evidence.some(item => item.id === "crime-scene-summary");
}
const observations = [
  { title: "The damaged railing", text: "The old iron railing is twisted outward at the bend near Gun Hill. The scene summary leaves open whether this was a fall or a push." },
  { title: "The broken tripod", text: "The tripod was recovered ten metres from the body. That distance is absent from the local police report." },
  { title: "The missing shoe", text: "One of Vikram’s shoes is missing. The scene summary records this without establishing how it was lost." },
];

export function CrimeSceneReveal({ caseData, chapter, compact = false }: { caseData: PublicCase; chapter: Chapter; compact?: boolean }) {
  const [observation, setObservation] = useState(0);
  const [documentId, setDocumentId] = useState("crime-scene-summary");
  const [original, setOriginal] = useState(false);
  const documents = caseData.evidence.filter(item => ["crime-scene-summary", "police-report"].includes(item.id));
  const document = documents.find(item => item.id === documentId) ?? documents[0];
  const printable = document ? getEvidencePrintableUrl(caseData.id, document, caseData.sessionId) : null;
  return <section className={`crime-scene${compact ? " crime-scene--phone" : ""}`} aria-label="Crime scene investigation">
    <header className="crime-heading"><p className="case-eyebrow">Round {chapter.roundNumber} / The scene</p><h2 className="case-serif">A bend in the road.<br />An unfinished story.</h2><p>{chapter.type === "evidence-reveal" ? chapter.narration : ""}</p></header>
    <figure className="crime-panorama"><CaseArtwork src={`/api/cases/${encodeURIComponent(caseData.id)}/evidence/crime-scene-summary/image?sessionId=${encodeURIComponent(caseData.sessionId)}`} alt="Illustrated misty bend on Camel’s Back Road, with a damaged iron railing above the ravine. No people are depicted." priority /><figcaption><strong>Camel’s Back Road · Near Gun Hill</strong><span>Illustrated overview · Not a measured reconstruction</span></figcaption></figure>
    <div className="crime-workbench">
      <section className="crime-observations" aria-labelledby={compact ? "phone-observations" : "tv-observations"}><p className="case-eyebrow">Examine the observations</p><h3 id={compact ? "phone-observations" : "tv-observations"} className="case-serif">What does the scene tell you?</h3>
        <div className="crime-observation-buttons" role="group" aria-label="Scene observations">{observations.map((item, index) => <button key={item.title} type="button" aria-pressed={observation === index} onClick={() => setObservation(index)}><span aria-hidden="true">0{index + 1}</span>{item.title}</button>)}</div>
        <div className="crime-observation-detail" aria-live="polite">{observation < 2 ? <CaseArtwork key={observation} src={`/api/cases/${caseData.id}/evidence/crime-scene-summary/image?sessionId=${encodeURIComponent(caseData.sessionId)}&detail=${observation===0 ? "railing" : "tripod"}`} alt={observation===0 ? "Illustrated close-up of the outward-twisted railing" : "Illustrated broken tripod on an examination table; recovery position not shown"}/> : <div className="missing-shoe-marker"><span aria-hidden="true">?</span><strong>One shoe unaccounted for</strong><small>No recovery location established</small></div>}<h4>{observations[observation].title}</h4><p>{observations[observation].text}</p></div>
        <svg className="scene-schematic" viewBox="0 0 420 150" role="img" aria-label="Scene observations, not a measured plan: wet path, outward railing, ravine below, broken tripod recovered ten metres from the body, one shoe missing"><path d="M20 45Q180 20 390 50" stroke="#a0b2a1" fill="none" strokeWidth="12"/><path d="M20 70L240 70L280 100" stroke="#c8a46a" fill="none" strokeWidth="3"/><text x="20" y="20" fill="#d9dfd1" fontSize="13">Wet path · no recorded struggle marks</text><text x="20" y="105" fill="#d9dfd1" fontSize="13">Ravine below railing</text><text x="20" y="135" fill="#d9dfd1" fontSize="13">Tripod: 10 m from body · shoe: missing</text></svg><p className="crime-caution">The scene summary notes no drag marks or signs of struggle on the path itself. Compare the observations with the official account before drawing conclusions.</p>
      </section>
      <section className="crime-documents" aria-label="Released case documents"><p className="case-eyebrow">Two accounts. One scene.</p><h3 className="case-serif">Compare the files.</h3>
        <div className="crime-document-buttons" role="group" aria-label="Choose a case document">{documents.map(item => <button type="button" key={item.id} aria-pressed={document?.id === item.id} onClick={() => {setDocumentId(item.id); setOriginal(false);}}>{item.id === "police-report" ? "Police report" : "Scene summary"}</button>)}</div>
        {document ? <><h4>{document.title}</h4><p className="crime-document-text">{document.loreText}</p>{printable ? <><button className="crime-original-toggle" type="button" aria-expanded={original} onClick={() => setOriginal(!original)}>{original ? "Close original document" : "Read original document"}</button>{original ? <div className="crime-original"><iframe title={document.title} src={printable} sandbox="allow-same-origin" /><a href={printable} target="_blank" rel="noopener noreferrer">Open full-page document ↗</a></div> : null}</> : null}</> : null}
      </section>
    </div>
    <footer className="crime-footer">{compact ? "Both documents stay in your digital case file. Follow the shared screen when the host continues." : "Compare the two accounts together. Select Continue above when everyone is ready."}</footer>
  </section>;
}
