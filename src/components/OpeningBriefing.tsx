import { CaseArtwork } from "@/components/CaseArtwork";
import type { PublicCase } from "@/lib/public-case";

function assetUrl(caseId: string, path: string) {
  return `/api/cases/${encodeURIComponent(caseId)}/assets/${path.replace(/^assets\//, "").split("/").map(encodeURIComponent).join("/")}`;
}

/** Shared briefing content: TV and phones receive only the public session projection. */
export function OpeningBriefing({ caseData, compact = false, detectives, observer = false }: {
  caseData: PublicCase;
  compact?: boolean;
  detectives?: number;
  observer?: boolean;
}) {
  const opening = caseData.rounds[0];
  const location = caseData.sceneLocation;
  const image = location?.imageUrl ? assetUrl(caseData.id, location.imageUrl) : `/api/cases/${encodeURIComponent(caseData.id)}/hero`;
  return (
    <div className={`opening-briefing${compact ? " opening-briefing--phone" : ""}`}>
      <section className="opening-scene" aria-label="Arrival">
        <CaseArtwork src={image} alt={location ? `Illustrated arrival at ${location.name}` : `${caseData.meta.title} case illustration`} priority />
        <div className="opening-scene-caption"><p className="case-eyebrow">{opening?.title ?? "Opening briefing"} / Arrival</p><h2 className="case-serif">{location?.name ?? caseData.meta.title}</h2><p>{caseData.id === "mussoorie" ? "Mussoorie, Uttarakhand · Dusk" : caseData.meta.setting}</p></div>
      </section>
      {caseData.id === "mussoorie" ? <div className="opening-route" aria-label="Arrival route, schematic"><span>Dehradun</span><span aria-hidden="true">→</span><strong>Mussoorie</strong><span aria-hidden="true">→</span><span>Police station</span></div> : null}
      <div className="opening-dossier-grid">
        <aside className="opening-victim" aria-labelledby={compact ? "phone-victim" : "tv-victim"}>
          <p className="case-eyebrow">The person behind the case</p>
          <div className="opening-victim-identity">
            {caseData.victim.portraitUrl ? <CaseArtwork src={assetUrl(caseData.id, caseData.victim.portraitUrl)} alt={`Portrait of ${caseData.victim.name}`} portrait /> : null}
            <div><p className="case-eyebrow">Victim dossier</p><h3 id={compact ? "phone-victim" : "tv-victim"} className="case-serif">{caseData.victim.name}</h3></div>
          </div>
          {caseData.victim.publicBackground ? <p className="opening-background">{caseData.victim.publicBackground}</p> : null}
          <div className="opening-file-label"><span>Investigation open</span><span>{detectives !== undefined ? `${detectives} detective${detectives === 1 ? "" : "s"}` : observer ? "Observer copy" : "Detective copy"}</span></div>
        </aside>
        <section className="opening-mandate" aria-labelledby={compact ? "phone-assignment" : "tv-assignment"}>
          <p className="case-eyebrow">Your assignment</p><h3 id={compact ? "phone-assignment" : "tv-assignment"} className="case-serif">Start with the questions.</h3>
          <div className="opening-beats">{opening?.introNarration?.map((beat, index) => <blockquote key={index}><p className="opening-speaker">{beat.speaker ?? "Briefing"}</p><p>{beat.text}</p></blockquote>)}</div>
        </section>
      </div>
      <div className="opening-next"><span className="case-eyebrow">{compact ? "Stay with the room" : "When everyone is ready"}</span><p>{compact ? "Follow the briefing on the shared screen. Your case file updates as the host advances." : "Read the briefing together, then select Continue above to open the first case file."}</p></div>
    </div>
  );
}
