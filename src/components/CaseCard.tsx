import Link from "next/link";
import { CaseArtwork } from "@/components/CaseArtwork";
import type { CaseSummary } from "@/engine/case-loader";

export function CaseCard({ caseSummary }: { caseSummary: CaseSummary }) {
  const playerText = caseSummary.playerCount?.min && caseSummary.playerCount?.max
    ? `${caseSummary.playerCount.min}–${caseSummary.playerCount.max} players` : "Play together";
  return (
    <article className="case-card">
      <Link href={`/case/${caseSummary.id}`} className="case-card-art" aria-label={`Explore ${caseSummary.title}`}>
        <CaseArtwork src={`/api/cases/${encodeURIComponent(caseSummary.id)}/hero`} alt={`${caseSummary.title} illustrated case poster`} priority />
        <span className="case-art-label" aria-hidden="true">Open for investigation</span>
      </Link>
      <div className="case-card-body">
        <p className="case-eyebrow">Cooperative mystery</p>
        <h2 className="case-serif">{caseSummary.title}</h2>
        <p className="case-description">{caseSummary.tagline}</p>
        <div className="case-facts">
          <span>{playerText}</span>
          {caseSummary.estimatedDurationMinutes ? <span>{caseSummary.estimatedDurationMinutes} min</span> : null}
          {caseSummary.ageRating ? <span>Ages {caseSummary.ageRating}</span> : null}
        </div>
        <Link href={`/case/${caseSummary.id}`} className="case-button case-button--gold">Explore the case <span aria-hidden="true">↗</span></Link>
      </div>
    </article>
  );
}
