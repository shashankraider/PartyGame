import { ActiveGames } from "@/components/ActiveGames";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HostLobbyLauncher } from "@/components/HostLobbyLauncher";
import { CaseArtwork } from "@/components/CaseArtwork";
import { loadCase } from "@/engine/case-loader";
export default async function MultiplayerPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const caseData = await loadCase(caseId).catch(() => null);
  if (!caseData) notFound();
  return <main className="case-shell">
    <header className="case-masthead"><Link href={`/case/${caseData.id}`} className="case-back">← Back to case</Link><span className="case-brand">M / E <span>Host briefing</span></span></header>
    <ActiveGames caseId={caseData.id} />
    <section className="lobby-setup-grid">
      <div><p className="case-eyebrow">You bring the room. We bring the mystery.</p><h1 className="case-serif lobby-title">Set the scene.</h1><p className="lobby-subtitle">{caseData.meta.title}</p><div className="case-poster"><CaseArtwork src={`/api/cases/${encodeURIComponent(caseData.id)}/hero`} alt={`${caseData.meta.title} illustrated poster`} priority /></div></div>
      <div><HostLobbyLauncher caseId={caseData.id} /><div className="lobby-checklist"><p className="case-eyebrow">Before your detectives arrive</p><ol><li><strong>One shared screen</strong><span>Use a laptop or connect it to your TV. Keep this browser open as the host.</span></li><li><strong>A phone for each detective</strong><span>Everyone scans the QR code or enters the game code to join.</span></li><li><strong>A little time to investigate</strong><span>Plan for {caseData.meta.estimatedDurationMinutes} minutes with {caseData.meta.recommendedPlayers.min}–{caseData.meta.recommendedPlayers.max} players.</span></li></ol><p className="lobby-small">Playing from a laptop on your home network? Open its network address before sharing the QR code, and connect phones to the same Wi-Fi.</p></div></div>
    </section>
    <footer className="case-footer"><span>Already have a host?</span><Link href="/join">Join with a game code →</Link></footer>
  </main>;
}
