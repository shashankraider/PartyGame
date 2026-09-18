import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { HostLobbyView } from "@/components/HostLobbyView";
import { requireSessionAccess } from "@/lib/session-auth";
import { getPublicLobbyState, SessionStoreError } from "@/lib/session-store";

type HostSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

async function getOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" || /^(localhost|127\.|192\.168\.|10\.)/.test(host) ? "http" : "https");
  return `${protocol}://${host}`;
}

export default async function HostSessionPage({ params }: HostSessionPageProps) {
  const { sessionId } = await params;
  await requireSessionAccess(sessionId, { host: true }).catch(() => notFound());
  const lobby = await getPublicLobbyState(sessionId).catch((error) => {
    if (error instanceof SessionStoreError && error.status === 404) {
      notFound();
    }

    throw error;
  });
  const caseData = lobby.caseData;
  const joinUrl = `${await getOrigin()}/j/${lobby.session.join_code}`;
  const qrCode = await QRCode.toDataURL(joinUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 280,
  });

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <Link href={`/case/${caseData.id}`} className="text-sm uppercase tracking-[0.2em] text-[#c8a46a]">
        Back to case file
      </Link>
      <section className="pt-10">
        <p className="mb-4 text-sm uppercase tracking-[0.35em] text-[#c8a46a]">TV Host Display</p>
        <h1 className="case-serif text-4xl md:text-5xl">{caseData.meta.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[#cfc8ba]">
          Keep this screen visible to everyone. Start when your detectives have joined.
        </p>
      </section>
      <HostLobbyView initialLobby={lobby} caseData={caseData} qrCode={qrCode} joinUrl={joinUrl} />
    </main>
  );
}
