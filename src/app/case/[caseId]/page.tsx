import { ActiveGames } from "@/components/ActiveGames";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseArtwork } from "@/components/CaseArtwork";
import { loadCase } from "@/engine/case-loader";

type CasePageProps = { params: Promise<{ caseId: string }> };

export default async function CasePage({ params }: CasePageProps) {
  const { caseId } = await params;
  const caseData = await loadCase(caseId).catch(() => null);
  if (!caseData) notFound();
  const { meta } = caseData;
  return (
    <main className="case-shell">
      <header className="case-masthead">
        <Link href="/" className="case-back">← All cases</Link>
        <span className="case-brand">M / E <span>Mystery Engine</span></span>
      </header>
      <ActiveGames caseId={caseData.id} />
      <section className="case-landing-hero">
        <div className="case-poster">
          <CaseArtwork src={`/api/cases/${encodeURIComponent(caseData.id)}/hero`} alt={`${meta.title} illustrated case poster`} priority />
          <div className="case-poster-caption"><span>Case file / {caseData.id.replaceAll("-", " ")}</span><span>Investigation open</span></div>
        </div>
        <div className="case-landing-intro">
          <p className="case-eyebrow">{meta.subtitle ?? "A cooperative investigation"}</p>
          <h1 className="case-serif">{meta.title}</h1>
          <p className="case-tagline">{meta.tagline}</p>
          <dl className="case-stat-row">
            <div><dt>Gather</dt><dd>{meta.recommendedPlayers.min}–{meta.recommendedPlayers.max} <span>players</span></dd></div>
            <div><dt>Set aside</dt><dd>{meta.estimatedDurationMinutes} <span>minutes</span></dd></div>
            <div><dt>Recommended</dt><dd><span>Ages</span> {meta.ageRating}</dd></div>
          </dl>
          <Link href={`/case/${caseData.id}/multiplayer`} className="case-button case-button--gold">Host a game <span aria-hidden="true">→</span></Link>
          <p className="case-setup-note">Open the game on a shared screen. Your detectives join with their phones.</p>
          <Link href={`/case/${caseData.id}/solo`} className="case-preview-link">Read the opening preview <span aria-hidden="true">↗</span></Link>
          <p className="case-preview-note">A short introduction to the case.</p>
        </div>
      </section>
      <section className="case-setting" aria-labelledby="setting-title">
        <div><p className="case-eyebrow">The setting</p><h2 id="setting-title" className="case-serif">A place worth looking closer.</h2></div>
        <p>{meta.setting}</p>
      </section>
      <section className="case-suspects" aria-labelledby="suspects-title">
        <div className="case-section-heading"><div><p className="case-eyebrow">The people in the file</p><h2 id="suspects-title" className="case-serif">Everyone has a story.</h2></div><p>{caseData.suspects.length} suspects. Who will you believe?</p></div>
        <div className="case-portrait-grid">
          {caseData.suspects.map((suspect) => (
            <figure key={suspect.id} className="case-portrait">
              <CaseArtwork portrait src={suspect.portraitUrl ? `/api/cases/${encodeURIComponent(caseData.id)}/assets/${suspect.portraitUrl.replace(/^assets\//, "").split("/").map(encodeURIComponent).join("/")}` : "/missing-portrait"} alt={`Portrait of ${suspect.name}`} />
              <figcaption>{suspect.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section className="case-how" aria-labelledby="how-title">
        <div className="case-section-heading"><div><p className="case-eyebrow">Your evening, in three acts</p><h2 id="how-title" className="case-serif">Bring curiosity. Follow the clues.</h2></div></div>
        <div className="case-step-grid">
          {[
            ["01", "Gather your detectives", "Start a lobby on your shared screen. Everyone joins from their phone using the code or QR."],
            ["02", "Build your case", `Question ${caseData.suspects.length} suspects, inspect the evidence, and compare what you've discovered.`],
            ["03", "Make your accusation", "Choose who you believe is responsible. Then discover how the story really unfolded."],
          ].map(([number, title, text]) => <div className="case-step" key={number}><span className="case-step-number">{number}</span><h3>{title}</h3><p>{text}</p></div>)}
        </div>
      </section>
      <footer className="case-footer"><span>A cooperative mystery · Ages {meta.ageRating}</span><Link href={`/case/${caseData.id}/multiplayer`}>Ready to investigate? Host a game →</Link></footer>
    </main>
  );
}
