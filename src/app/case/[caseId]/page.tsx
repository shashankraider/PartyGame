import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCase } from "@/engine/case-loader";

type CasePageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function CasePage({ params }: CasePageProps) {
  const { caseId } = await params;
  const caseData = await loadCase(caseId).catch(() => null);

  if (!caseData) {
    notFound();
  }

  const playerText = `${caseData.meta.recommendedPlayers.min}-${caseData.meta.recommendedPlayers.max} players`;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <Link href="/" className="text-sm uppercase tracking-[0.2em] text-[#c8a46a]">
        Back to cases
      </Link>

      <section className="grid gap-10 py-12 lg:grid-cols-[1.35fr_0.65fr]">
        <div>
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-[#c8a46a]">
            {caseData.meta.setting}
          </p>
          <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">
            {caseData.meta.title}
          </h1>
          <p className="mt-6 text-xl leading-8 text-[#cfc8ba]">{caseData.meta.tagline}</p>

          <div className="mt-8 flex flex-wrap gap-3 text-sm uppercase tracking-[0.18em] text-[#a6a29a]">
            <span className="rounded-full border border-white/10 px-4 py-2">{playerText}</span>
            <span className="rounded-full border border-white/10 px-4 py-2">
              {caseData.meta.estimatedDurationMinutes} minutes
            </span>
            <span className="rounded-full border border-white/10 px-4 py-2">
              Ages {caseData.meta.ageRating}
            </span>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/case/${caseData.id}/solo`}
              className="rounded-full bg-[#c8a46a] px-6 py-4 text-center text-sm font-bold uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-[#e6bd77]"
            >
              Start solo preview
            </Link>
            <Link
              href={`/case/${caseData.id}/multiplayer`}
              className="rounded-full border border-white/15 px-6 py-4 text-center text-sm font-bold uppercase tracking-[0.18em] text-[#f5f2ea] transition hover:border-[#c8a46a] hover:text-[#e6bd77]"
            >
              Host multiplayer
            </Link>
          </div>
        </div>

        <aside className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
          <h2 className="text-xl font-semibold">Case contents</h2>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[#a6a29a]">Suspects</dt>
              <dd className="mt-1 text-2xl font-semibold">{caseData.suspects.length}</dd>
            </div>
            <div>
              <dt className="text-[#a6a29a]">Evidence</dt>
              <dd className="mt-1 text-2xl font-semibold">{caseData.evidence.length}</dd>
            </div>
            <div>
              <dt className="text-[#a6a29a]">Chapters</dt>
              <dd className="mt-1 text-2xl font-semibold">{caseData.chapters.length}</dd>
            </div>
            <div>
              <dt className="text-[#a6a29a]">Rounds</dt>
              <dd className="mt-1 text-2xl font-semibold">{caseData.rounds.length}</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm leading-6 text-[#cfc8ba]">
            This is the Phase 2 shell. The next slices wire these entry points into Supabase
            sessions, lobby joins, and realtime TV/phone scenes.
          </p>
        </aside>
      </section>
    </main>
  );
}
