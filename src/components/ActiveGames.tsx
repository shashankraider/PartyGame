"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type ActiveGame = {
  id: string; caseId: string; title: string; joinCode: string;
  status: "lobby" | "in_progress" | "paused";
  hostUrl: string | null; playerUrl: string | null;
};

export function ActiveGames({ caseId }: { caseId?: string }) {
  const pathname = usePathname();
  const [games, setGames] = useState<ActiveGame[]>([]);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let disposed = false;
    let controller: AbortController | undefined;
    async function refresh() {
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch("/api/sessions", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Could not load games");
        const payload = await response.json();
        if (!disposed) { setGames(payload.sessions); setError(false); }
      } catch (cause) {
        if (!disposed && !(cause instanceof DOMException && cause.name === "AbortError")) setError(true);
      }
    }
    void refresh();
    const onReturn = () => { void refresh(); };
    window.addEventListener("pageshow", onReturn);
    window.addEventListener("focus", onReturn);
    return () => {
      disposed = true;
      controller?.abort();
      window.removeEventListener("pageshow", onReturn);
      window.removeEventListener("focus", onReturn);
    };
  }, [pathname, retry]);

  const visible = games.filter(game => !caseId || game.caseId === caseId);
  if (!visible.length && !error) return null;
  return <section className="active-games" aria-label="Your active games">
    <p className="case-eyebrow">Pick up where you left off</p>
    <h2 className="case-serif">Your active games</h2>
    <p>Your progress is saved. Return to a game you started or joined in this browser.</p>
    {error && <p role="alert">Could not refresh your games. <button type="button" onClick={() => setRetry(n => n + 1)}>Try again</button></p>}
    <div className="active-games-list">{visible.map(game => <article key={game.id}>
      <div><h3>{game.title}</h3><p>Code <strong>{game.joinCode}</strong> · {game.status === "in_progress" ? "In progress" : game.status === "paused" ? "Paused" : "Waiting for detectives"}</p></div>
      <div className="active-games-actions">
        {game.hostUrl && <Link href={game.hostUrl} prefetch={false} className="case-button case-button--gold" aria-label={`Return as host · ${game.joinCode}`}>Return as host →</Link>}
        {game.playerUrl && <Link href={game.playerUrl} prefetch={false} className="case-button" aria-label={`Return as player · ${game.joinCode}`}>Return as player →</Link>}
      </div>
    </article>)}</div>
  </section>;
}
