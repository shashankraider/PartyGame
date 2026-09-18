import { notFound } from "next/navigation";
import { PlayerLobbyView } from "@/components/PlayerLobbyView";
import { requireSessionAccess } from "@/lib/session-auth";
import { getPublicLobbyState, SessionStoreError } from "@/lib/session-store";

type PlayerSessionPageProps = {
  params: Promise<{
    sessionId: string;
    playerId: string;
  }>;
};

export default async function PlayerSessionPage({ params }: PlayerSessionPageProps) {
  const { sessionId, playerId } = await params;
  await requireSessionAccess(sessionId, { playerId }).catch(() => notFound());
  const lobby = await getPublicLobbyState(sessionId).catch((error) => {
    if (error instanceof SessionStoreError && error.status === 404) {
      notFound();
    }

    throw error;
  });
  const player = lobby.players.find((item) => item.id === playerId);

  if (!player) {
    notFound();
  }

  const caseData = lobby.caseData;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col overflow-x-hidden px-0 py-8 sm:py-10">
      <p className="mx-4 mb-6 text-sm uppercase tracking-[0.2em] text-[#c8a46a] sm:mx-6">
        Detective controller
      </p>
      <div className="mx-4 min-w-0 sm:mx-6">
        <PlayerLobbyView initialLobby={lobby} caseData={caseData} playerId={playerId} />
      </div>
    </main>
  );
}
