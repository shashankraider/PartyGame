"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinCodeEntry() {
  const router = useRouter();
  const [code, setCode] = useState("");
  return <form className="lobby-panel" onSubmit={event => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalized) router.push(`/j/${normalized}`);
  }}>
    <label htmlFor="gameCode" className="case-eyebrow">Game code on the shared screen</label>
    <input id="gameCode" name="gameCode" className="lobby-input lobby-code-input" value={code} onChange={event => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} required maxLength={12} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="YOUR CODE" />
    <button className="case-button case-button--gold lobby-full" type="submit" disabled={!code.trim()}>Find my game <span aria-hidden="true">→</span></button>
    <p className="lobby-small">You can also scan the QR code on your host’s screen.</p>
  </form>;
}
