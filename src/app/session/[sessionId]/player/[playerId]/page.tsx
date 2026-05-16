import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayerLobbyView } from "@/components/PlayerLobbyView";
import { loadCase } from "@/engine/case-loader";
import { getLobbyState, SessionStoreError } from "@/lib/session-store";

type PlayerSessionPageProps = {
  params: Promise<{
    sessionId: string;
    playerId: string;
  }>;
};

export default async function PlayerSessionPage({ params }: PlayerSessionPageProps) {
  const { sessionId, playerId } = await params;
  const lobby = await getLobbyState(sessionId).catch((error) => {
    if (error instanceof SessionStoreError && error.status === 404) {
      notFound();
    }

    throw error;
  });
  const player = lobby.players.find((item) => item.id === playerId);

  if (!player) {
    notFound();
  }

  const caseData = await loadCase(lobby.session.case_id).catch(() => null);

  if (!caseData) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
      <Link
        href={`/j/${lobby.session.join_code}`}
        className="mb-6 text-sm uppercase tracking-[0.2em] text-[#c8a46a]"
      >
        Back to join
      </Link>
      <PlayerLobbyView initialLobby={lobby} caseData={caseData} playerId={playerId} />
    </main>
  );
}
