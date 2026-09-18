"use client";

import { useState } from "react";
import type { Chapter } from "@/engine/types";
import type { PublicCase, PublicEvidence } from "@/lib/public-case";
import { getEvidencePrintableUrl } from "@/lib/printables";

export function getOpeningLetter(caseData: PublicCase, chapter: Chapter | null, unlocked: string[]) {
  if (caseData.id !== "mussoorie" || chapter?.type !== "evidence-reveal" || !["r1-anonymous-letter", "r3-second-letter"].includes(chapter.id)) return undefined;
  return caseData.evidence.find(item => item.id === (chapter.id === "r3-second-letter" ? "anonymous-letter-2" : "anonymous-letter-1") && chapter.evidenceIds.includes(item.id) && unlocked.includes(item.id));
}

export function LetterReveal({ caseData, evidence, chapter, compact = false }: {
  caseData: PublicCase;
  evidence: PublicEvidence;
  chapter: Chapter;
  compact?: boolean;
}) {
  const [view, setView] = useState<"letter" | "notes">("letter");
  const second = evidence.id === "anonymous-letter-2";
  const printable = getEvidencePrintableUrl(caseData.id, evidence, caseData.sessionId);
  return <section className={`letter-reveal${compact ? " letter-reveal--phone" : ""}`} aria-label="The anonymous letter">
    <div className="letter-context">
      <p className="case-eyebrow">Round {chapter.roundNumber} / Evidence received</p>
      <h2 className="case-serif">A letter.<br />No signature.</h2>
      <p className="letter-intro">{chapter.type === "evidence-reveal" ? chapter.narration : evidence.description}</p>
      <div className={`letter-envelope${second ? " letter-envelope--second" : ""}`} aria-label="Illustrated envelope addressed to CBI Dehradun">
        <div className="letter-postmark">{second ? "BANGALORE" : "DEHRADUN"}<br /><span>POSTMARK</span></div>
        <p>To the Director<br /><strong>Central Bureau of Investigation</strong><br />Dehradun Division</p>
        <span className="letter-envelope-label">No return address</span>
      </div>
      <dl className="letter-provenance"><div><dt>Format</dt><dd>Typed, unsigned</dd></div><div><dt>Received</dt><dd>{second ? "Three weeks into the investigation" : "Two weeks after the death"}</dd></div><div><dt>Writer</dt><dd>Unknown</dd></div></dl>
      <p className="letter-guidance">Read the allegation together. A claim is a starting point for investigation.</p>
    </div>
    <div className="letter-document">
      <div className="letter-document-header"><span className="case-eyebrow">{second ? "Second correspondence" : "Exhibit C / CBI/EX/003"}</span><span className="letter-filed">Added to case file</span></div>
      <h3 className="case-serif">{evidence.title}</h3>
      <div className="letter-view-controls" role="group" aria-label="Letter display">
        <button type="button" aria-pressed={view === "letter"} onClick={() => setView("letter")}>Original letter</button>
        <button type="button" aria-pressed={view === "notes"} onClick={() => setView("notes")}>Case notes</button>
      </div>
      {view === "letter" && printable ? <><iframe title="Original anonymous letter to the CBI" src={printable} className="letter-sheet" sandbox="allow-same-origin" /><a className="letter-open" href={printable} target="_blank" rel="noopener noreferrer">Open full-page letter ↗</a></> : <div className="letter-notes"><p className="case-eyebrow">Investigator notes</p><p>{evidence.loreText}</p></div>}
      <p className="letter-retained">{compact ? "This letter stays in your digital case file. Follow the shared screen when the host continues." : second ? "Everyone finished reading? Open the next investigation file when the room is ready." : "Everyone finished reading? Select Continue above when the room is ready."}</p>
    </div>
  </section>;
}
