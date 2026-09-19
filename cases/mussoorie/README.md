# Murder in Mussoorie

**The first implemented case for the Mystery Engine prototype.**

Status reconciled September 18, 2026. See [release notes](../../docs/RELEASE_2026-09-18.md) for current checks and rollout.
6–8 players · ages 10+ · ~3 hours · 4 rounds · cooperative whodunit · LLM-driven suspect interrogation.

A misty hill-town noir set in present-day Mussoorie, Uttarakhand. Players are a CBI special team investigating the death of a popular YouTuber that the local police have ruled accidental — and discover that the case unlocks a fifteen-year-old cold case underneath.

## Contents

| File / folder | What it contains |
|---|---|
| `design.md` | **The Game Bible** — full plot, suspects, solution, evidence list, two-path endgame, guilt map. The canonical, spoiler-heavy source of truth for this case. |
| `Game_Bible.docx` | Earlier Word-document snapshot of the bible content. `design.md` is now the source of truth; the `.docx` may lag behind in-flight rewrites. Regenerate from `design.md` when needed. |
| `case.json` | The implemented structured data fed to the engine — schema-validated, references all assets and printables. |
| `printables/` | Player-facing HTML exhibits, one standalone file per evidence item, plus print-all-round source bundles. |
| `assets/portraits/` | Suspect, victim, and backstory-character portraits. |
| `assets/locations/` | Wide images of the 8 key locations. |
| `assets/crime-scene/` | Authored ravine, Grey Lady and evidence illustrations with prompt provenance. |
| `assets/audio/` | Planned five-cue soundtrack; no soundtrack files supplied yet. |
| `assets/ui/` | Cover image present; other listed UI assets are planned. |
| `assets/video/` | Final-recording media and captions; guarded download after the truth reveal, inline playback deferred. |

## Story structure (4 rounds)

The case contains **33 evidence items, 19 chapters, four content rounds, eight locations and two authored ending branches**. Round groups contain 6, 9, 9 and 9 exhibits respectively. The live engine walks the opening briefing, then uses free-form interrogation across the later evidence groups, followed by accusation and staged reveal; it does not force a linear playthrough of all 19 chapters.


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

- Implemented: structured case, all six suspect cue sets, HTML exhibits and both confrontation branches.
- Assets present: six suspect portraits, victim portrait, eight location images and cover art.
- Pending: dedicated crime-scene/backstory art, soundtrack, final video integration and playable phone hack.
- Latest recorded checks: case validation and all 30 printable synchronization checks passed. Live host 60/60; adjudicator 103/104 with a recoverable Anya cue miss; story boundaries 9/9. These are dated observations, not guaranteed future model results.


## A note on spoilers

This README, `case.json`, `design.md`, and `Game_Bible.docx` are **for the game designer's eyes only** — they contain the full solution. Players see only what's exposed by the engine, the live LLM interviews, and the printables in `printables/`.
