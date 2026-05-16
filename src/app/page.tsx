import { redirect } from "next/navigation";
import { CaseCard } from "@/components/CaseCard";
import { loadConfiguredCaseSummaries } from "@/engine/case-loader";

export default async function Home() {
  const cases = await loadConfiguredCaseSummaries();

  if (process.env.CASE_ID && cases.length === 1) {
    redirect(`/case/${cases[0].id}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12">
      <section className="max-w-3xl py-16">
        <p className="mb-4 text-sm uppercase tracking-[0.35em] text-[#c8a46a]">Mystery Engine</p>
        <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">
          Choose tonight&apos;s case.
        </h1>
        <p className="mt-6 text-lg leading-8 text-[#cfc8ba]">
          Phase 2 starts with a runnable case picker backed by the same JSON case files the
          validator already protects.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {cases.map((caseSummary) => (
          <CaseCard key={caseSummary.id} caseSummary={caseSummary} />
        ))}
      </section>
    </main>
  );
}
