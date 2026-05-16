# Murder in Mussoorie

**The first case shipped with the Mystery Engine.**
6–8 players · ages 10+ · ~3 hours · 4 rounds · cooperative whodunit · LLM-driven suspect interrogation.

A misty hill-town noir set in present-day Mussoorie, Uttarakhand. Players are a CBI special team investigating the death of a popular YouTuber that the local police have ruled accidental — and discover that the case unlocks a fifteen-year-old cold case underneath.

## Contents

| File / folder | What it contains |
|---|---|
| `design.md` | **The Game Bible** — full plot, suspects, solution, evidence list, two-path endgame, guilt map. The canonical, spoiler-heavy source of truth for this case. |
| `Game_Bible.docx` | Earlier Word-document snapshot of the bible content. `design.md` is now the source of truth; the `.docx` may lag behind in-flight rewrites. Regenerate from `design.md` when needed. |
| `case.json` | *(coming in Phase 1)* The structured data fed to the engine — schema-validated, references all assets and printables. |
| `printables/` | Player-facing HTML printables, one per round. Print to PDF or A4. |
| `assets/portraits/` | Suspect, victim, and backstory-character portraits. |
| `assets/locations/` | Wide images of the 8 key locations. |
| `assets/crime-scene/` | Scene photos used in evidence cards. |
| `assets/audio/` | 5-cue noir soundtrack. |
| `assets/ui/` | Iconography and theming. |

## Story structure (4 rounds)

1. **Round 1 — The Scene** — CBI arrives. Scene briefing, anonymous letter, victim's background, Grey Lady setup. Evidence items 1–5.
2. **Round 2 — Suspects' Stories Crack** — First-pass interviews. Each suspect's surface story collapses under one piece of evidence. Items 6–12.
3. **Round 3 — The Thakur Connection** — A second anonymous letter and an old newspaper clipping pivot the case into the 15-year-old cold case. Items 13–20.
4. **Round 4 — The Solve** — Hard evidence implicates Bisht and Devraj. Two-path endgame depending on who is confronted first. Final reveal, guilt-map discussion. Items 21–26.

## Cast (6 suspects)

| Suspect | Role | Guilt category |
|---|---|---|
| Rhea Bhatia | Vikram's business partner | Tamperer (red herring) |
| Inspector Devraj Khanna | Local cop, investigating officer | **Executor — physically killed Vikram** |
| Naina Kapoor | Ex-fiancée and corporate investigator | Bystander (moral guilt) |
| Mr. Rajveer Bisht | Mussoorie's biggest hotelier | **Mastermind — ordered both murders** |
| Anya Devi | Housekeeper, the Grey Lady | Accessory (and the anonymous tipster) |
| Prof. Kabir Iyer | Vikram's college friend | Coward (sender of the second anonymous letter) |

See `design.md` Section 7 for each suspect's full sheet (public story, secret, breaking points).

## Status

- ✅ Game Bible v1.0 — locked
- ✅ Printables (HTML) — drafted across 4 rounds
- ✅ `case.json` — translated from the Game Bible, validates green, pin-tested in CI
- ⏳ Portraits, location art, crime-scene images — pending Phase 4
- ⏳ Soundtrack cues — pending Phase 4

## A note on spoilers

`design.md` and `Game_Bible.docx` are **for the game designer's eyes only** — they contain the full solution. Players see only what's exposed by the engine, the live LLM interviews, and the printables in `printables/`.
