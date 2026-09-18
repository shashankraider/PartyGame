import Link from "next/link";
import { JoinLobbyForm } from "@/components/JoinLobbyForm";
import { normalizeJoinCode } from "@/lib/session-codes";
export default async function JoinPage({ params }: { params: Promise<{ joinCode: string }> }) {
  const { joinCode } = await params;
  const normalizedCode = normalizeJoinCode(joinCode);
  return <main className="case-shell lobby-phone-shell">
    <header className="case-masthead"><Link className="case-back" href="/join">← Change code</Link><span className="case-brand">M / E</span></header>
    <div className="lobby-phone-intro"><p className="case-eyebrow">Detective registration</p><h1 className="case-serif">Every detective<br />needs a name.</h1><p>This is how your team will see you on the shared screen.</p></div>
    <div className="lobby-code-strip"><span className="case-eyebrow">Game code</span><strong>{normalizedCode}</strong></div>
    <JoinLobbyForm joinCode={normalizedCode} />
  </main>;
}
