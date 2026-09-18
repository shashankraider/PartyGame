import { ActiveGames } from "@/components/ActiveGames";
import Link from "next/link";
import { JoinCodeEntry } from "@/components/JoinCodeEntry";
export default function JoinGamePage() {
  return <main className="case-shell lobby-phone-shell">
    <header className="case-masthead"><Link className="case-back" href="/">← All cases</Link><span className="case-brand">M / E</span></header>
    <div className="lobby-phone-intro"><p className="case-eyebrow">Your investigation awaits</p><h1 className="case-serif">Join your<br />detectives.</h1><p>Enter the code from the shared screen to find your game.</p></div>
    <ActiveGames />
    <JoinCodeEntry />
  </main>;
}
