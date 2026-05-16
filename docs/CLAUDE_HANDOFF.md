# Mystery Engine — Handoff

**Last updated**: 2026-05-15
**Current phase**: Phase 2g.2 complete. All six Mussoorie suspects now have authored adjudicator unlock cues and eval coverage; next recommended phase is Phase 2h (Realtime infrastructure + token streaming).
**Handoff target**: Cursor (or any other coding agent / fresh Claude session). The five sibling workdirs at `/Users/shashankmendiratta/shire/PartyGame-2g2-*/` were created for the failed parallel attempt and are no longer needed for mainline work.

This document is the running handoff for continuing development with any coding agent. It summarizes the product, the repo state, completed work, verification commands, and the next useful development prompt. Designed to be picked up cold by a new client.

---

## ⚡ Pickup TL;DR (read first)

If you're a new agent (Cursor included) taking over this project:

1. **Run the verification suite first**, before touching anything:
   ```bash
   cd /Users/shashankmendiratta/shire/PartyGame
   npm install                 # if node_modules isn't current
   npm run validate-cases      # expect: 0 errors, 15 expected asset warnings
   npm test                    # expect: 72/72 passing
   npm run eval:adjudicator -- all  # expect: 104/104 passing
   npm run lint                # expect: clean
   npm run build               # expect: clean build, all routes registered
   ```
   If anything fails here, **stop and investigate before continuing** — the state is not what this doc describes.

2. **Read `docs/CLAUDE_HANDOFF.md` end-to-end** (this file). The most important sections after this TL;DR:
   - "Completed Work" — every shipped phase with its concrete artifacts.
   - "Next Recommended Phase" — full brief on Phase 2h.
   - "Phase 2g.2 — Author Unlock Cues for the Other Five Suspects" — now shipped; useful as historical context for cue design.

3. **The codebase is at a stable, fully-built green state.** Phase 2g.2 ships unlock-cue authoring and eval coverage for all six Mussoorie suspects. The eval harness (`npm run eval:adjudicator -- all`) is the contract between the author and the engine; keep it green whenever cue text changes.

4. **Local environment** required for Phase 2g.2:
   - `.env.local` with `OPENROUTER_API_KEY` (gpt-4o-mini is the default model; works fine).
   - Local Supabase running via `supabase start` from this repo root (needed if you also test in the browser; NOT needed for eval-only work).
   - `OPENROUTER_API_KEY` is the only thing the eval script needs.

5. **`Game_Bible.docx` is stale**; `cases/mussoorie/design.md` is the canonical narrative source.

---

## Why this doc exists

This is a running handoff for continuing development across sessions and agents. It summarizes the product, the repo state, completed work, verification commands, and the next useful development prompt.

---

## Copy/Paste Prompt For Claude

```text
You are continuing development on the Mystery Engine project in /Users/shashankmendiratta/shire/PartyGame.

Product summary:
Mystery Engine is a reusable, case-agnostic cooperative detective game engine. Cases live as JSONC files under cases/<case-id>/ and are validated by src/engine/schema/case.schema.json plus src/engine/validator.mjs. The first case is Murder in Mussoorie. The app is a Next.js + TypeScript + Tailwind web UI with Supabase for persisted sessions/realtime and OpenRouter for LLM suspect interviews.

Important docs:
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/authoring-guide.md
- docs/CLAUDE_HANDOFF.md
- supabase/README.md

Current status:
- Phase 0 complete: JSON schema, validator CLI, generated TS types, tests, authoring guide, Supabase migration.
- Phase 1 complete: Murder in Mussoorie case.json authored and validates with zero errors; asset warnings are expected until Phase 4.
- Phase 2a complete: Next.js app scaffold, case picker, case detail page, solo/multiplayer entry, env example, OpenRouter API stub.
- Phase 2b complete: Supabase-backed session creation, join-code lobby, phone player registration, seat assignment, observer fallback, host lobby.
- Phase 2c complete: TV host display modes driven by session.current_scene/current_chapter_id, scene runner API, chapter next/previous, evidence unlocking on evidence chapters.
- Phase 2d complete: scene-aware phone controller UI (lobby/brief/case board/interview/phone hack/accusation/reveal), interviewer claim/pass route, accusation vote route.
- Phase 2e complete: chapter prerequisites enforced in advanceSessionChapter, TV evidence locker grouped by round with "new" markers, TV current-interviewer indicator, per-player accusation votes via accusation_votes table with live tally on TV and phone.
- Phase 2f-stub complete: session-aware interview route POST/GET, OpenRouter non-streaming chat with phase-gated minimal prompt (publicAlibi + voice + neverReveal), full message persistence to messages table, "Ask suspect" button wired on phone, transcript polled and rendered on TV + non-interviewer phones at ~1.5s cadence. No token streaming and no adjudicator (deferred to Phase 2g for the adjudicator, Phase 2h for Realtime + true token streaming).
- Phase 2g.1 complete (Naina-only proof-of-concept): unlockBehavior schema extension on Secret/BreakingPoint/Evidence with tier (cooperation/evidence/pressure/compound), 0003/0004 migrations adding 'system' role and interview_unlock_state table, adjudicator helper (`src/lib/adjudicator.ts`) doing per-condition JSON-output LLM calls with evidence-gate short-circuit and structured verdicts, unlock-evaluation pipeline (`src/lib/interview-unlocks.ts`) firing system messages and updating session.unlocked_evidence on met turns, two-pass roleplay in askSuspect that re-prompts with revealed text when an unlock fires so the suspect speaks the revelation in a single visible turn, host-fallback (`GET`/`POST /api/sessions/[id]/interview/host-unlock`) with TV banner when players are stuck (attempts > threshold AND max_adjacency < 0.4), in-interview evidence panels on phone + TV with NEW badges for items unlocked since the panel mounted, system messages styled distinctly in both transcripts, and the engine fix preventing the legacy chapter-mechanism from racing with dynamic unlocks (`getUnlockedEvidenceForChapter` skips evidence with unlockBehavior). Naina's four conditions authored with cooperation/compound tiers. Eval harness (`scripts/eval-adjudicator.ts` + `cases/mussoorie/evals/naina.eval.json`) gives a regression test for cue text.
- Phase 2g.2 complete: authored unlockBehavior blocks for Rhea, Devraj, Bisht, Anya, and Kabir across their secrets and breaking points; added `cases/mussoorie/evals/{rhea,devraj,bisht,anya,kabir}.eval.json`; moved `vikram-voice-memo` from Round 1 to `r3-recap`; added a Round 3 printable voice-memo exhibit; updated the Mussoorie round-distribution pin test. `npm run eval:adjudicator -- all` passes 104/104 cases.

Run and verify:
- npm run dev
- npm run validate-cases
- npm test
- npm run eval:adjudicator -- all
- npm run lint
- npm run build

Known expected warnings:
- npm warns about unknown env config "devdir".
- validate-cases emits 15 missing asset warnings for Mussoorie art. These are expected until Phase 4.

Environment:
Use .env.example as the template. For Phase 2b+ lobby flows, Supabase must be configured:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

Next task:
Implement Phase 2h — Realtime infrastructure + token streaming.

⚠️ **Previous attempt blocked by org usage cap.** Five parallel sub-agents were spawned via the Anthropic Agent tool to author one suspect each in isolated workdirs. All five failed within seconds with "You've hit your org's monthly usage limit." No case-data work was produced. The isolated workdirs are still in place at `/Users/shashankmendiratta/shire/PartyGame-2g2-{rhea,devraj,bisht,anya,kabir}/` and can be reused by Cursor or any other client that picks this up. Each is a copy of `cases/` plus symlinks for everything else; `.env.local` is already in each.

If you're picking up from Cursor: see the **"Phase 2g.2 — Parallel-Authoring Setup (Cursor pickup)"** section further down in this doc. It has the locked per-suspect tier design + key evidence + cue-narrowness guidance for each of the five.

All of the engine work is already shipped in 2g.1 (adjudicator, unlock-tier system, host fallback, two-pass roleplay, in-interview evidence panels, eval harness). 2g.2 is pure authoring on case.json + sibling eval files. Roughly 1-2 hours of writing per suspect using Naina's pattern as the template. Suspect tier guidance (locked in conversation):

- **Rhea** — evidence-tier or compound. Her secrets unlock when specific artifacts are presented (`building-cctv-rhea`, `rhea-draft-email`). Narrow cooperationCue: must directly name the channel sale, Metropolis Media, or the 5 AM cottage visit. Hostile/vague questions stay deflected.
- **Devraj** — pressure-tier with low tolerance (pressureThreshold: 2-3, hostFallbackAfterTurns: 5-6). Breaks fast once the jeep CCTV + lathi post-mortem land. He's been waiting 15 years to be caught.
- **Bisht** — compound-tier with effectively-infinite tolerance (pressureThreshold: 4+, hostFallbackAfterTurns: 999). Even with all the artifacts present he reframes rather than confesses. The endgame branching handles his eventual unmasking.
- **Anya** — mixed. Her witness account is cooperation-tier (gentle questions about the Thakurs, her son's education); her Grey Lady identity is compound (needs the freshly-washed shawl + bus-ticket gap + a direct confrontation). hostFallbackAfterTurns: 6-8.
- **Kabir** — cooperation for the plagiarism (he's a coward, he'll fold under polite pressure once Vikram's chai-shop receipt is on the table); evidence-tier for his role as second anonymous-letter sender.

Authoring workflow per suspect:

1. Read the suspect's existing `secrets[]`, `breakingPoints[]`, `lies[]` from cases/mussoorie/case.json. The revelation content is already written; you're adding the `unlockBehavior` block to each one.
2. Write 4-6 test cases per condition in `cases/mussoorie/evals/<suspect>.eval.json` — see naina.eval.json as the canonical template. Include: positive case, hostile-framing case, off-topic case, adjacent-but-wrong case.
3. Run `npm run eval:adjudicator -- <suspect>` after each suspect is authored. If a case fails, the cue text needs tightening (cue is the contract) OR the test case has the wrong expectation. Pick one before re-running.
4. Resolve the remaining round-1 cadence debt at the same time: move `vikram-voice-memo` from `r1-vikram-life` to `r3-recap` or mid-Anya-interview when Anya's cues are authored. Update the round-1 printable to drop the voice-memo exhibit if you move it out of round 1 (Round1_The_Scene.html currently has Exhibit H rendering the transcript).

Authoring gotchas to remember (see cases/mussoorie/evals/README.md for the full list):

- The cooperationCue is read by the adjudicator LLM as the criterion. Don't write engine-notes into it (no "cascade", no "same cue as X").
- Cue describes player BEHAVIOR, not suspect behavior. "Interviewer asks about X" not "Suspect mentions X."
- For compound-tier conditions, the evidence gate is necessary but NOT sufficient — the cue still applies. Off-topic questions should fail even with the evidence presented.

Keep scope conservative:
- No engine changes. If you find yourself wanting to extend the engine for a suspect's behavior, write the case data first; only extend if there's no data-only way to express what you want.
- Preserve the existing 2g.1 design principles: stateless adjudicator, attempts++ counted only after the evidence gate is open, max_adjacency as high-water mark, hostFallbackAfterTurns gating only when max_adjacency < 0.4.

Before editing, read:
- cases/mussoorie/design.md sections 7.1-7.6 (Rhea, Devraj, Naina, Bisht, Anya, Kabir character sheets — the canonical narrative source)
- cases/mussoorie/case.json suspect blocks
- cases/mussoorie/evals/naina.eval.json (the template)
- cases/mussoorie/evals/README.md (authoring gotchas)
- src/lib/adjudicator.ts (the prompt the cue gets evaluated against)

After editing, run:
npm run eval:adjudicator -- all
npm run validate-cases && npm test && npm run lint && npm run build

Report which suspects passed all their evals, which had cases needing iteration, and any cue language that took multiple tries to land right.

(Alternative next task: Phase 2h — Realtime infrastructure migration. See the "Phase 2h" section in this doc. Same scope as the deferred fast-follow; produces token-by-token streaming + instant evidence-locker updates instead of the current 1.5-2.5s polls. Author Phase 2g.2 first if you want playable narrative content; do 2h first if polling latency is the thing that's bothering you.)

After editing, run:
npm run validate-cases && npm test && npm run lint && npm run build

Report what changed, what passed, and any remaining limitations.
```

---

## Product Intent

Build a reusable game framework for family/friends cooperative murder mysteries:

- A TV/laptop browser acts as the cinematic display.
- Player phones act as controllers.
- Case data is JSONC plus assets, not hardcoded app logic.
- Suspect interviews are powered by LLMs, but prompts must be phase-gated so unrevealed solution facts are never leaked.
- Supabase stores sessions, players, messages, events, and supports pause/resume and realtime fan-out.

First case: **Murder in Mussoorie**, a family-friendly noir detective mystery set in Mussoorie, India.

---

## Tech Stack

- **Next.js 16 App Router**
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase** for Postgres and later Realtime
- **OpenRouter** for LLM interviews
- **JSON Schema 2020-12** for case contract
- **AJV** for validation
- **node:test** for tests

---

## Key Commands

```bash
npm run dev
npm run validate-cases
npm test
npm run lint
npm run build
```

Expected current verification status:

- `npm run validate-cases`: passes with 15 expected missing asset warnings.
- `npm test`: 72 tests pass.
- `npm run lint`: passes.
- `npm run build`: passes.

---

## Environment Setup

Create local env from the example:

```bash
cp .env.example .env.local
```

Relevant variables:

```bash
CASE_ID=mussoorie

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Notes:

- Case picker and case detail pages work without Supabase.
- Multiplayer lobby/session flows require Supabase server env vars.
- OpenRouter interview route returns a clean 501-style response if `OPENROUTER_API_KEY` is missing.

---

## Repository Map

Important files and folders:

```text
cases/
  _template/
  mussoorie/
    case.json
    design.md
    assets/
    printables/

docs/
  PRD.md
  ARCHITECTURE.md
  authoring-guide.md
  CLAUDE_HANDOFF.md

scripts/
  generate-types.mjs
  render-diagrams.mjs
  validate-case.mjs

src/
  app/
    api/
      interview/route.ts
      join/route.ts
      sessions/
    case/[caseId]/
    j/[joinCode]/
    session/[sessionId]/
  components/
  engine/
    case-loader.ts
    schema/case.schema.json
    types.ts
    validator.mjs
  lib/
    session-codes.ts
    session-store.ts
    supabase.ts

supabase/
  migrations/
    0001_initial.sql
    0002_accusation_votes.sql
    0003_message_role_system.sql       # adds 'system' to message_role enum
    0004_interview_unlock_state.sql    # Phase 2g per-condition state

tests/
```

### Sibling workdirs (Phase 2g.2 in-progress)

In addition to the repo at `/Users/shashankmendiratta/shire/PartyGame/`, there are five sibling directories at `/Users/shashankmendiratta/shire/PartyGame-2g2-{rhea,devraj,bisht,anya,kabir}/` that were set up for parallel sub-agent authoring. Each contains:

- A writable copy of `cases/` (the agent edits `cases/mussoorie/case.json` and creates `cases/mussoorie/evals/<suspect>.eval.json`).
- A copied `.env.local` (so eval can find `OPENROUTER_API_KEY` without external setup).
- Symlinks for `src/`, `scripts/`, `node_modules/`, `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs` — all pointing back at the main repo so the agent reads the latest engine code.

Inside any of these dirs, `npm run eval:adjudicator -- naina` should still report "All 29 case(s) matched expectations" because the symlinked `src/` and `scripts/` point at the same engine. Use that as a sanity check before authoring.

If a new client (Cursor) ignores these workdirs and authors directly in the main repo, that's fine too — they were only needed for parallel agents to avoid clobbering one another's edits. Sequential or human-driven authoring in the main repo is simpler.

---

## Completed Work

### Phase 0 — Framework Contract

Completed:

- `src/engine/schema/case.schema.json`
- Generated `src/engine/types.ts`
- `src/engine/validator.mjs`
- `scripts/validate-case.mjs`
- Test suite for schema, validator, CLI, type generation, and Mussoorie pin test
- Supabase migration with `sessions`, `players`, `messages`, `events`
- RLS strategy documented in `supabase/README.md`
- Authoring guide and rendered diagrams

### Phase 1 — Mussoorie Case Data

Completed:

- `cases/mussoorie/case.json`
- 6 suspects
- 26 evidence items
- 19 chapters
- 4 rounds
- backstory, atmospheric thread, endgame paths, solution
- Mussoorie validation test

Known expected warnings:

- Missing cover, suspect portraits, and location images until Phase 4.

### Phase 2a — Next.js App Scaffold

Completed:

- Next.js app setup
- Global styling
- Case loader for JSONC
- Case picker page
- Case detail page
- Solo preview route
- Multiplayer entry route
- `.env.example`
- OpenRouter streaming API route scaffold
- Supabase client helper scaffold

### Phase 2b — Lobby Flow

Completed:

- Supabase-backed `POST /api/sessions`
- `GET /api/sessions/[sessionId]`
- `POST /api/join`
- `POST /api/sessions/[sessionId]/start`
- Host lobby display
- QR code and join code
- Phone join form
- Player waiting page
- Seat assignment
- Late/full lobby joins become observers

### Phase 2c — TV Display Modes

Completed:

- `POST /api/sessions/[sessionId]/scene`
- Chapter-to-scene mapping:
  - `narrative` and `evidence-reveal` -> `case_board`
  - `interview` -> `interview`
  - `phone-hack` -> `phone_hack`
  - `accusation` -> `accusation`
  - `reveal` -> `reveal`
- Host controls for start, previous, next
- TV display modes:
  - lobby
  - cinematic brief
  - case board
  - live interview
  - phone hack
  - accusation
  - reveal
- Evidence unlocking when evidence chapters become active

Current limitation:

- Host/player screens poll `/api/sessions/[sessionId]` every 2.5s. True Supabase Realtime subscription is intentionally deferred until session-scoped client auth is finalized.

### Phase 2d — Phone Controller Modes

Completed:

- `POST /api/sessions/[sessionId]/interviewer` to claim/pass interview control
- `POST /api/sessions/[sessionId]/accusation` to submit a vote
- `src/components/PlayerLobbyView.tsx` rewritten as scene-aware controller:
  - lobby (joined detectives, observer/seat info)
  - brief (case title, tagline, observer note)
  - case board (per-round chapter label, unlocked evidence locker)
  - interview (interviewer view with question textarea + present-evidence selector; non-interviewer view with claim button; observer fallback)
  - phone hack (chapter intro, placeholder for Phase 5 minigame)
  - accusation (per-suspect vote buttons reflecting `accusation_target_suspect_id`)
  - reveal (killer summary)
- Player session page now loads `caseData` and passes it to the view.

Current limitation:

- The "Ask suspect" button is intentionally disabled until Phase 2f wires up OpenRouter streaming and the `messages` table fan-out.

---

## Current App Routes

User-facing routes:

```text
/                                   Case picker, or redirect to CASE_ID
/case/[caseId]                      Case detail
/case/[caseId]/solo                 Solo preview
/case/[caseId]/multiplayer          Create multiplayer lobby
/j/[joinCode]                       Phone join page
/session/[sessionId]/host           TV host display
/session/[sessionId]/player/[playerId] Phone player/controller placeholder
```

API routes:

```text
POST /api/sessions
GET  /api/sessions/[sessionId]
POST /api/sessions/[sessionId]/start
POST /api/sessions/[sessionId]/scene
POST /api/sessions/[sessionId]/interviewer
POST /api/sessions/[sessionId]/accusation
POST /api/sessions/[sessionId]/interview      // ask the current suspect a question
GET  /api/sessions/[sessionId]/interview      // ?suspectId=... — fetch transcript for fan-out polling
POST /api/join
```

The old `/api/interview` route has been removed; all interview traffic flows through the session-scoped route above.

---

## Next Recommended Phase

### Phase 2h — Realtime Infrastructure + Token Streaming

Goal: replace the current polling loops with authenticated Supabase Realtime, then upgrade the session-scoped interview route from non-streaming OpenRouter calls to token-by-token streaming. See the Phase 2h section under "Later Phases" for the detailed implementation sketch.

Likely first slice:
- Add a server-side helper that mints short-lived session-scoped Realtime auth tokens.
- Replace host/player polling for sessions, players, accusation votes, messages, and interview unlock state with Realtime subscriptions.
- Convert `POST /api/sessions/[sessionId]/interview` to stream model tokens while updating the persisted message row incrementally.
- Verify two simultaneous sessions cannot see each other's rows.

### Recently Completed Reference — Phase 2g.2

Phase 2g.2 is complete. Phase 2g.1 shipped a complete adjudicator + unlock-tier engine, end-to-end UI, and authored cues for Naina only; Phase 2g.2 added authored cues and eval coverage for Rhea, Devraj, Bisht, Anya, and Kabir.

**Status of the previous attempt.** I tried to spawn five parallel sub-agents (one per suspect) via the Anthropic Agent tool. All five failed within seconds with "You've hit your org's monthly usage limit." The infrastructure they were supposed to use is still in place — five sibling workdirs at `/Users/shashankmendiratta/shire/PartyGame-2g2-{rhea,devraj,bisht,anya,kabir}/`. Each is a copy of `cases/` plus symlinks for `src/`, `scripts/`, `node_modules/`, `package.json`, `tsconfig.json`, and `.env.local`. Each is ready to receive an agent's edits. Cursor (or any new client) can re-spawn the five tasks, or fold them into a single sequential authoring pass.

**Where the per-suspect briefs already live.** The agent prompts I drafted contain the locked design decisions for each suspect's `unlockBehavior` tiering. They're in the agent-launch records but I'm reproducing the gist below so a new client can read them inline.

Across all five suspects, the engine pattern is identical (one code path); difficulty comes entirely from the data. Each condition's `unlockBehavior` carries:

- `tier`: `"cooperation"` | `"evidence"` | `"pressure"` | `"compound"`
- `cooperationCue?`: natural-language description of the *player's question* that fires the unlock. **Critical:** this is read by the LLM as the literal criterion. Never write engine notes ("cascade", "same cue as Y") — those leak into runtime semantics.
- `evidenceIds?`: artifacts that must be presented in conversation (required for `evidence` and `compound` tiers).
- `pressureThreshold?`: how many `met: true` turns the engine waits for before firing the unlock. Defaults to 1.
- `hostFallbackAfterTurns?`: when the host gets a "reveal manually?" prompt on the TV.

#### Rhea Bhatia — business partner, tamperer (red herring)

- **Tier**: evidence-tier or compound-tier.
- **Key evidence**: `building-cctv-rhea` (5 AM cottage visit), `rhea-draft-email` (channel-sale negotiation).
- **CooperationCue (narrow)**: must name the channel sale, name Metropolis Media, OR name the 5 AM cottage visit specifically. Vague business questions don't count. Hostile framing doesn't count — she becomes brittle, not honest.
- **`pressureThreshold`**: 1-2.
- **`hostFallbackAfterTurns`**: 8-10 (players supposed to work for this).
- **Workdir**: `/Users/shashankmendiratta/shire/PartyGame-2g2-rhea/`

#### Inspector Devraj Khanna — corrupt cop, executor

- **Tier**: pressure-tier with low tolerance.
- **Key evidence**: `devraj-jeep-cctv` (jeep at 8:10 PM contradicts station-all-night), `lathi-postmortem`, `bisht-devraj-call` (8 PM call from Bisht).
- **CooperationCue**: questions that contradict his alibi (where he was, why the report is so thin) OR ask about his relationship with Bisht. Vague background questions don't fire. Calling him incompetent without evidence doesn't fire.
- **Two emotional states the case supports**: defensive denial (low pressure, can deflect) and collapse (high pressure with evidence). Map separate secrets to those with different `pressureThreshold` values.
- **`pressureThreshold`**: 2-3 for the collapse condition.
- **`hostFallbackAfterTurns`**: 5-6 (he's been waiting 15 years to be caught; relatively low patience).
- **Workdir**: `/Users/shashankmendiratta/shire/PartyGame-2g2-devraj/`

#### Mr. Rajveer Bisht — hotelier, mastermind

- **Tier**: compound-tier, effectively-infinite tolerance.
- **Key evidence**: `land-registry`, `office-rifle-photo`, `wall-mount-photo`, `bisht-family-history`, `bisht-hotel-cctv-log`.
- **CooperationCue (maximal)**: must have placed multiple specific artifacts in front of him AND directly accused him of ordering the Thakur murders. Even then, the cue should fire so narrowly it almost never triggers in casual play.
- **Selective authoring**: secrets representing direct confession of ordering the murders should be **left without `unlockBehavior`** — those are owned by the `firstConfronted` endgame branching. Author `unlockBehavior` only for partial-admission secrets (acknowledging he knew the Thakurs, that Anya works for him, that he was aware of Vikram's research). Document which secrets you skipped and why.
- **`pressureThreshold`**: 4+.
- **`hostFallbackAfterTurns`**: 999 (host never gets prompted; players are supposed to fail to crack him mid-game).
- **Workdir**: `/Users/shashankmendiratta/shire/PartyGame-2g2-bisht/`

#### Anya Devi — housekeeper, accessory, the Grey Lady

- **Tier mix**: cooperation for her witness account of the Thakurs and her relationship with Vikram (she wants to confess this part); compound for the Grey Lady identity and her warning to Bisht.
- **Key evidence for compound conditions**: `grey-shawl-fresh` + `anya-bus-ticket` for Grey Lady identity. `anya-bus-ticket` + `anya-payments` for the warning to Bisht.
- **CooperationCue (broad)**: gentle, respectful questions about her work, son, time with the Thakurs, her age in 2011. Hostile interrogation of an older Garhwali domestic worker should NOT fire — she goes silent.
- **`hostFallbackAfterTurns`**: 6-8.
- **Care note**: cue text should not frame her as malicious. She's a tragic accomplice carrying 15 years of guilt.
- **Workdir**: `/Users/shashankmendiratta/shire/PartyGame-2g2-anya/`

#### Prof. Kabir Iyer — college friend, coward, second-letter sender

- **Tier mix**: cooperation for plagiarism admission (he's a coward, folds under polite pressure); evidence-tier (or compound with soft cue) for him being the second-letter sender.
- **Key evidence**: `chai-shop-receipt` (argued with Vikram hours before the murder), `pawn-shop-receipt` (sold his watch to raise bribe money), plus any handwriting-match evidence (check `case.json`; design.md mentions handwriting analysis as a breaking-point trigger).
- **CooperationCue (broad and forgiving)**: questions about the chai shop, his PhD/academic career, his college days with Vikram, or the plagiarism specifically. Threats to call his university would SHUT HIM DOWN — should not fire. He needs psychological safety to come clean.
- **`hostFallbackAfterTurns`**: 4-5 (low patience; he wants to talk).
- **Workdir**: `/Users/shashankmendiratta/shire/PartyGame-2g2-kabir/`

#### Authoring workflow (per suspect)

1. `cd` to the suspect's workdir (or work directly in `/Users/shashankmendiratta/shire/PartyGame` if you'd rather not use the isolated dirs).
2. Read `cases/mussoorie/case.json` for that suspect's full block. Read `cases/mussoorie/design.md` section 7.{1-6} for canonical narrative.
3. Read `cases/mussoorie/evals/naina.eval.json` — this is the template. Same shape for every other suspect.
4. Read `cases/mussoorie/evals/README.md` — authoring gotchas. Most important:
   - Cue describes **player behavior** ("interviewer asks X"), not suspect behavior.
   - Never write engine notes into cue text ("cascade", "fires after Y") — the LLM reads it literally.
   - For compound tier, evidence gate is necessary but NOT sufficient — the cue must still apply. Off-topic questions should fail even with evidence presented.
5. Add `unlockBehavior` to each of the suspect's secrets and breakingPoints. Use `Edit` with the unique anchor of each condition's `"id"` field. Don't touch other suspects.
6. Author `cases/mussoorie/evals/{suspect}.eval.json` with 4-6 test cases per condition. Required mix:
   - Positive case (cue fires correctly).
   - Hostile-framing case (should NOT fire — different per suspect).
   - Off-topic case (should NOT fire).
   - Adjacent-but-wrong case (close to the cue but missing the load-bearing element).
   - For evidence/compound tier: evidence-presented-but-wrong-question case (should NOT fire).
7. Run `npm run eval:adjudicator -- {suspect}` and iterate. If a case fails, EITHER tighten the cue OR fix the test expectation — pick one before re-running. Iterate until 100% pass.

#### Merge step (after all five are authored)

Each suspect's authoring touches:
- A unique block in `cases/mussoorie/case.json`.
- A unique new file at `cases/mussoorie/evals/{suspect}.eval.json`.

If you used the isolated workdirs, merge by:
1. For each `cases/mussoorie/evals/{suspect}.eval.json` — copy from the workdir to the main repo. New files, no conflicts.
2. For `cases/mussoorie/case.json` — use a JSON merge or a diff-based approach. Each suspect's edits are scoped to their own block; there should be no conflicts as long as no agent strayed.
3. After merge: from the main repo, run the full check suite:
   ```bash
   npm run validate-cases
   npm test
   npm run lint
   npm run build
   npm run eval:adjudicator -- all
   ```
   Expect 0 errors / 15 expected asset warnings / 72 tests / clean lint / clean build / all eval cases passing.

If you worked directly in the main repo without using the isolated workdirs, just run the check suite.

#### After 2g.2 ships

Update this handoff doc:
- Move 2g.2 to "Completed Work" with the actual artifacts produced.
- Move the deferred items in the "Mussoorie cadence status" table (the `vikram-voice-memo` and Round1 printable Exhibits F/G cleanup) to either resolved or 2g.3.
- Update "Current phase" line at the top.

Then the next phase is **Phase 2h — Realtime infrastructure + token streaming** (see "Later Phases" below).

---

### Phase 2g — Adjudicator, Unlock Tiers, and Host Fallback (reference / shipped design)

Goal: Make interview revelations *conditional* on what the player actually asks. Adds a second LLM call ("the adjudicator") that judges whether the player has earned the next unlock, plus a host-fallback intervention mechanic when players are stuck.

Design principle (locked in conversation, not yet implemented): every secret/breakingPoint has an `unlockBehavior` describing its difficulty profile.

- **`tier: "cooperation"`** — Naina-type. Suspect wants to help. Unlocks when the player asks the right kind of question; no evidence required. Naina's "she points toward Rhea" reveal is the canonical example.
- **`tier: "evidence"`** — Rhea-type. Suspect deflects until a specific physical artifact is in hand. Rhea's "I was selling the channel" needs `building-cctv-rhea` (or the draft email) in front of her.
- **`tier: "pressure"`** — Devraj-type. Suspect breaks after N adjacent-but-not-quite-right pressure points.
- **`tier: "compound"`** — Bisht-type. Needs multiple artifacts AND multiple pressure points. Effectively never cracks under casual play; the endgame's framed-defense structure does the rest.

Each `unlockBehavior` also carries `hostFallbackAfterTurns` — when the adjudicator sees the players have been stuck on a condition for that many turns with no adjacency, the *host* gets a quiet TV-side notification asking whether to reveal. The LLM judges progress; the host judges fun.

Implementation:

- Small schema extension on `Secret` and `BreakingPoint`: add the `unlockBehavior` field. Author Mussoorie's ~25 unlock cues.
- Second LLM call per turn (the adjudicator). Should be cheaper than the roleplay call — Haiku or, as a cost-optimization, Llama-via-OpenRouter.
- New session-state surface for "stuck-detection state per (suspect, unlock-condition)". Probably a small `interview_unlock_state` table or a JSON column on `messages`.
- Host TV view gets a quiet notification surface: *"The players have been stuck on Naina's 'why are you calling' question for 5 turns. Reveal the WhatsApp thread? [Reveal] [Wait]."*
- The cooperation-tier cascade Naina → corporate memo → Rhea-interviewable is the canonical round-2 game loop and should be the first thing playtested.

Cost optimization note: the adjudicator call's structured task (judge a fuzzy condition, output JSON) is a perfect fit for a small/cheap model. OpenRouter exposes Llama 3.x and similar; the adjudicator can ship behind a per-case `llm.adjudicatorModelOverride` so authors can dial the cost/quality knob.

Keep the implementation case-agnostic. The unlock tiers and the host-fallback threshold both live on the suspect data, not in engine code.

**Cadence status — Mussoorie:**

Phase 2g.2 further resolved the original "everything-in-round-1" pacing problem. Current state:

| Artifact | `unlockedAtChapter` | Dynamic unlock |
|---|---|---|
| `instagram-grey-lady`, `youtube-channel-page` | `r1-vikram-life` | None — round 1 establishes the victim |
| `vikram-working-wall` | `r1-vikram-life` | None — the visual gut-punch + diegetic justification for the six suspects |
| `vikram-voice-memo` | `r3-recap` | None — now lands after the Thakur evidence/Anya thread is active |
| `vikram-naina-whatsapp` | `r2-interview-naina` *(forgiving fallback)* | Cooperation-tier; fires when player asks Naina any reasonable professional question |
| `naina-corporate-memo` | `r2-interview-naina` *(forgiving fallback)* | Cooperation-tier; cascade with the WhatsApp thread |

**Resolved in 2g.2 cleanup:** the voice memo no longer appears in round 1's evidence locker and now unlocks at `r3-recap`. `Round3_Thakur_Connection.html` includes a new Exhibit U voice-memo excerpt. `Round1_The_Scene.html` has been pruned so it only contains Round 1 material, with the working wall renumbered as Exhibit F. The Naina memo and WhatsApp thread now live in `Round2_Suspects_Crack.html` as supplemental interview-unlock exhibits M/N.

---

## Later Phases

### Phase 2h — Realtime Infrastructure + Token Streaming

Goal: Replace polling everywhere with authenticated Supabase Realtime, then upgrade the interview route to true token-by-token streaming. Originally planned as a Phase 2f fast-follow ("2f.1"); deferred to after 2g because the adjudicator work is the higher-leverage priority and 2g is fully usable on top of the existing polling.

Likely files:

- New: server-side JWT minting helper (probably `src/lib/realtime-auth.ts`) that signs short-lived tokens with `app.session_id` claim.
- New: browser-side authenticated Supabase client init (probably `src/lib/supabase-client.ts`).
- `src/components/HostLobbyView.tsx` — replace the 2.5s `getLobbyState` poll with Realtime subscriptions on `sessions`, `players`, `accusation_votes`.
- `src/components/PlayerLobbyView.tsx` — same for the phone side.
- `src/app/api/sessions/[sessionId]/interview/route.ts` — switch from non-streaming OpenRouter call to SSE; write incremental updates to `messages.content` with `is_streaming: true` so Realtime fans out tokens to all clients.
- `src/lib/session-store.ts` — adjust `askSuspect` to stream and incrementally update.

Verify:

- All existing 2.5s lobby/scene polls and the 1.5s interview-message polls are removed.
- A suspect's response appears token-by-token on TV and on every phone simultaneously.
- The session-scoped Realtime auth path does not leak rows from other sessions (test by joining two sessions in different tabs).
- The Phase 2g host-fallback notification (which currently lands on the next 2.5s lobby poll) now appears instantly.

### Phase 2i — Pause/Resume

- Pause/resume controls
- Re-enter join code or URL to resume
- Expiry handling
- Host restore flow

### Phase 3 — Printables

- Finalize round printables
- Export PDFs
- Evidence bag checklist

### Phase 4 — Assets

- Suspect portraits
- Location images
- Crime-scene images
- Soundtrack cues

### Phase 5 — Polish

- Victim phone hack minigame UI
- Host guide
- Transitions
- Audio mixing
- Optional TTS voices
- Playtest pass

---

## Guardrails For Future Agents

- Do not hardcode Mussoorie story IDs in engine UI unless explicitly building Mussoorie-only content.
- Keep mutations on server API routes using the Supabase service-role key.
- Do not add anon INSERT/UPDATE/DELETE policies without revisiting the security model.
- Do not include `solution`, killer IDs, or unrevealed secrets in LLM prompts until boundary enforcement is implemented.
- Keep `src/engine/types.ts` generated; modify `case.schema.json` and run `npm run types:generate` if the schema changes.
- If tests fail after type generation, inspect whether generated formatting/content changed intentionally.
- Preserve expected asset warnings until Phase 4.
- Prefer small, verifiable phase slices.

### Phase 2g-specific guardrails

- The cooperationCue field on an `unlockBehavior` is read literally by the adjudicator LLM. Never include engine notes ("cascade", "fires after X", "same cue as Y") in cue text — the LLM treats them as criteria.
- Cue text describes player BEHAVIOR ("interviewer asks/shows X"), not suspect behavior.
- For compound-tier conditions, the evidence gate is necessary but NOT sufficient — the cue must still apply. Off-topic questions should fail even with the evidence presented.
- `pressure_count` increments only on `met: true` turns. The unlock fires when `pressure_count >= pressureThreshold` (default 1).
- Evidence-gated turns where the gate is not satisfied do NOT increment `attempts` — the host-fallback clock only starts ticking once the required evidence is in conversation.
- The legacy `unlockedAtChapter` mechanism is silently skipped for evidence with `unlockBehavior` (see `getUnlockedEvidenceForChapter` in `src/lib/session-store.ts`). This is by design — dynamic unlocks must not race with chapter-completion unlocks.
- The eval harness (`npm run eval:adjudicator`) is the contract between authors and the engine. Whenever a cue is added or changed, eval cases must also be added or updated. CI-style: an unauthored condition is a failure, not a skip.

---

## Manual Smoke Test Flow

With Supabase configured and migration applied:

1. Run `npm run dev`.
2. Open `http://localhost:3000`.
3. Open Mussoorie.
4. Choose Multiplayer.
5. Create lobby.
6. Open the QR/join URL in another browser/device.
7. Join as a player.
8. Confirm player appears on TV lobby.
9. Start game.
10. Use Next/Previous to move through TV scenes.
11. Confirm evidence appears after evidence reveal chapters.

Without Supabase configured:

- Case picker/detail/solo pages should still build and run.
- Multiplayer create lobby should show a clear missing Supabase env error.

