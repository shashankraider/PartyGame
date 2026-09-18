import { ActiveGames } from "@/components/ActiveGames";
import Link from "next/link";
import { CaseCard } from "@/components/CaseCard";
import { loadConfiguredCaseSummaries } from "@/engine/case-loader";

export default async function Home() {
  const cases = await loadConfiguredCaseSummaries();
  return (
    <main className="case-shell">
      <header className="case-masthead"><span className="case-brand">M / E <span>Mystery Engine</span></span><Link href="/join" className="case-back">Join a game →</Link></header>
      <ActiveGames />
      <section className="case-picker-intro">
        <p className="case-eyebrow">An evening of questions. A room full of detectives.</p>
        <h1 className="case-serif">Every town has secrets.<br /><em>Choose yours.</em></h1>
        <p>Gather your people. Examine the evidence. Find the truth together.</p>
      </section>
      <section aria-label="Available cases" className={`case-collection${cases.length === 1 ? " case-collection--single" : ""}`}>
        {cases.map((caseSummary) => <CaseCard key={caseSummary.id} caseSummary={caseSummary} />)}
        {!cases.length ? <p className="case-description">No case files are available yet. Check back soon.</p> : null}
      </section>
      <footer className="case-footer"><span>One shared screen. Your phones. Your collective instincts.</span><span>No one solves it alone.</span></footer>
    </main>
  );
}
