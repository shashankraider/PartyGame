import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { HostLobbyView } from "@/components/HostLobbyView";
import { loadCase } from "@/engine/case-loader";
import { getLobbyState, SessionStoreError } from "@/lib/session-store";

type HostSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

async function getOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export default async function HostSessionPage({ params }: HostSessionPageProps) {
  const { sessionId } = await params;
  const lobby = await getLobbyState(sessionId).catch((error) => {
    if (error instanceof SessionStoreError && error.status === 404) {
      notFound();
    }

    throw error;
  });
  const caseData = await loadCase(lobby.session.case_id);
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
        <h1 className="text-5xl font-semibold">{caseData.meta.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[#cfc8ba]">
          Keep this screen visible on the TV. It follows the session scene, refreshes automatically,
          and lets the host advance through the case chapters.
        </p>
      </section>
      <HostLobbyView initialLobby={lobby} caseData={caseData} qrCode={qrCode} joinUrl={joinUrl} />
    </main>
  );
}
