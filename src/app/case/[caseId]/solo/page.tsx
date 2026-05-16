import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCase } from "@/engine/case-loader";

type SoloPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function SoloPage({ params }: SoloPageProps) {
  const { caseId } = await params;
  const caseData = await loadCase(caseId).catch(() => null);

  if (!caseData) {
    notFound();
  }

  const openingRound = caseData.rounds[0];

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <Link href={`/case/${caseData.id}`} className="text-sm uppercase tracking-[0.2em] text-[#c8a46a]">
        Back to case file
      </Link>

      <section className="py-12">
        <p className="mb-4 text-sm uppercase tracking-[0.35em] text-[#c8a46a]">Solo Preview</p>
        <h1 className="text-5xl font-semibold">{caseData.meta.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#cfc8ba]">
          Use this route to preview case content without creating a multiplayer lobby. Full chapter
          progression lands later in Phase 2.
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
        <p className="text-sm uppercase tracking-[0.28em] text-[#c8a46a]">Opening round</p>
        <h2 className="mt-3 text-3xl font-semibold">{openingRound.title}</h2>
        {openingRound.tagline ? (
          <p className="mt-3 text-lg leading-8 text-[#cfc8ba]">{openingRound.tagline}</p>
        ) : null}
      </section>
    </main>
  );
}
