import Link from "next/link";
import { notFound } from "next/navigation";
import { HostLobbyLauncher } from "@/components/HostLobbyLauncher";
import { loadCase } from "@/engine/case-loader";

type MultiplayerPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function MultiplayerPage({ params }: MultiplayerPageProps) {
  const { caseId } = await params;
  const caseData = await loadCase(caseId).catch(() => null);

  if (!caseData) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <Link href={`/case/${caseData.id}`} className="text-sm uppercase tracking-[0.2em] text-[#c8a46a]">
        Back to case file
      </Link>

      <section className="grid gap-10 py-12 lg:grid-cols-[1fr_0.85fr]">
        <div>
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-[#c8a46a]">
            Multiplayer Host
          </p>
          <h1 className="text-5xl font-semibold">{caseData.meta.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#cfc8ba]">
            Create a persisted game session, show the TV lobby, and let detectives join from their
            phones with a code or QR scan.
          </p>
        </div>

        <HostLobbyLauncher caseId={caseData.id} />
      </section>
    </main>
  );
}
