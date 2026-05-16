import { JoinLobbyForm } from "@/components/JoinLobbyForm";
import { normalizeJoinCode } from "@/lib/session-codes";

type JoinPageProps = {
  params: Promise<{
    joinCode: string;
  }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { joinCode } = await params;
  const normalizedCode = normalizeJoinCode(joinCode);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
      <p className="mb-4 text-sm uppercase tracking-[0.35em] text-[#c8a46a]">Phone Controller</p>
      <h1 className="text-5xl font-semibold">Join lobby {normalizedCode}</h1>
      <JoinLobbyForm joinCode={normalizedCode} />
    </main>
  );
}
