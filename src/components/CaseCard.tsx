import Link from "next/link";
import type { CaseSummary } from "@/engine/case-loader";

export function CaseCard({ caseSummary }: { caseSummary: CaseSummary }) {
  const playerText =
    caseSummary.playerCount?.min && caseSummary.playerCount?.max
      ? `${caseSummary.playerCount.min}-${caseSummary.playerCount.max} players`
      : "Flexible group";

  return (
    <article className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="mb-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-[#c8a46a]">
        <span>{playerText}</span>
        {caseSummary.estimatedDurationMinutes ? (
          <span>{caseSummary.estimatedDurationMinutes} min</span>
        ) : null}
        {caseSummary.ageRating ? <span>{caseSummary.ageRating}</span> : null}
      </div>
      <h2 className="text-3xl font-semibold">{caseSummary.title}</h2>
      {caseSummary.tagline ? (
        <p className="mt-3 min-h-14 text-base leading-7 text-[#cfc8ba]">{caseSummary.tagline}</p>
      ) : null}
      <Link
        href={`/case/${caseSummary.id}`}
        className="mt-8 inline-flex rounded-full bg-[#c8a46a] px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-[#e6bd77]"
      >
        Open case file
      </Link>
    </article>
  );
}
