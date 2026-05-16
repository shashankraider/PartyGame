# Claude Handoff — Mystery Engine

**Last updated**: 2026-05-15  
**Current phase**: Phase 2g.1 shipped for Naina. Phase 2g.2 next — author unlock cues for the remaining five suspects (or Phase 2h — Realtime infrastructure)

This document is a running handoff for continuing development with Claude or another coding agent. It summarizes the product, repo state, completed work, verification commands, and the next useful development prompt.

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

Run and verify:
- npm run dev
- npm run validate-cases
- npm test
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
Implement Phase 2g.2 — author unlock cues + eval cases for the remaining five suspects (Rhea, Devraj, Bisht, Anya, Kabir). All of the engine work is already shipped in 2g.1 (adjudicator, unlock-tier system, host fallback, two-pass roleplay, in-interview evidence panels, eval harness). 2g.2 is pure authoring on case.json + sibling eval files. Roughly 1-2 hours of writing using Naina's pattern as the template. Suspect tier guidance (locked in conversation):

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
  migrations/0001_initial.sql

tests/
```

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

### Phase 2g — Adjudicator, Unlock Tiers, and Host Fallback

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

Phase 2g.1 partially resolved the original "everything-in-round-1" pacing problem. Current state:

| Artifact | `unlockedAtChapter` | Dynamic unlock |
|---|---|---|
| `instagram-grey-lady`, `youtube-channel-page` | `r1-vikram-life` | None — round 1 establishes the victim |
| `vikram-working-wall` | `r1-vikram-life` | None — the visual gut-punch + diegetic justification for the six suspects |
| `vikram-voice-memo` | `r1-vikram-life` | None *(will move to mid-Anya or round-3 in 2g.2 once Anya's cues are authored)* |
| `vikram-naina-whatsapp` | `r2-interview-naina` *(forgiving fallback)* | Cooperation-tier; fires when player asks Naina any reasonable professional question |
| `naina-corporate-memo` | `r2-interview-naina` *(forgiving fallback)* | Cooperation-tier; cascade with the WhatsApp thread |

**Remaining cadence debt for 2g.2:** the voice memo currently still appears in round 1's evidence locker. The right cadence is mid-Anya-interview or in a round-3 reveal, when Vikram's own line *"Anya knows something. She won't sit down with me"* lands hardest. This will move when Anya's `unlockBehavior` cues are authored.

**Printable inconsistency (low priority):** `cases/mussoorie/printables/Round1_The_Scene.html` still includes Exhibits F (memo) and G (WhatsApp), which are now round-2 dynamic unlocks. The two blocks should be cut from Round 1's printable and moved to Round 2's (where they'd become Exhibits M and N). Engine behavior is unaffected — printables are author-facing HTML, not loaded at runtime. Schedule the cleanup with 2g.2's authoring pass on the rest of the suspects.

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

