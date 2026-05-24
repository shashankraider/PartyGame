# Mystery Engine — Handoff

**Last updated**: 2026-05-24
**Repository**: Git remote `origin` → `https://github.com/shashankraider/PartyGame.git`. Deploy production on Vercel (or any Next.js host); see **Deployment** below.
**Current phase**: Phase 2i complete. Next: **Phase 2h** (Realtime infrastructure + token streaming).
**Handoff target**: Cursor (or any other coding agent / fresh Claude session). The five sibling workdirs at `/Users/shashankmendiratta/shire/PartyGame-2g2-*/` from the earlier failed parallel attempt are no longer needed for mainline work — safe to delete with `rm -rf /Users/shashankmendiratta/shire/PartyGame-2g2-*` if you want them gone.

This document is the running handoff for continuing development with any coding agent. It summarizes the product, the repo state, completed work, verification commands, and the next useful development prompt. Designed to be picked up cold by a new client.

---

## ⚡ Pickup TL;DR (read first)

If you're a new agent (Cursor included) taking over this project:

1. **Run the verification suite first**, before touching anything:
   ```bash
   cd /Users/shashankmendiratta/shire/PartyGame
   npm install                       # if node_modules isn't current
   npm run validate-cases            # expect: 0 errors
   npm test                          # expect: 118 pass, 1 skipped (live getSessionEvents 404 when Supabase env absent)
   npm run eval:adjudicator -- all   # expect: 103/104 (known Bisht 'the-rifle / challenges collector' flake)
   npm run eval:host                 # expect: 59/60 or 60/60 (occasional 'bisht-devraj-call' positive flake)
   npm run lint                      # expect: clean
   npm run build                     # expect: clean build, all routes registered
   ```
   If anything regresses beyond the documented flakes, **stop and investigate before continuing** — the state is not what this doc describes.

2. **Read `docs/CLAUDE_HANDOFF.md` end-to-end** (this file). The most important sections after this TL;DR:
   - "Next Recommended Phase" — **Phase 2h** (Realtime infrastructure + token streaming). The next mainline initiative; sits on top of the Phase 2i AI-host/free-Interrogation architecture and replaces the remaining 2.5s / 1.5s polls with authenticated Supabase Realtime + true token-by-token streaming.
   - "Completed Work" — every shipped phase with its concrete artifacts.
   - "Phase 2g — Adjudicator, Unlock Tiers, and Host Fallback (reference / shipped design)" — the locked design language for the unlock-tier system that Phase 2i builds on.

3. **The codebase is at a stable, fully-built green state.** Phase 2g.2 ships unlock-cue authoring and eval coverage for all six Mussoorie suspects. Phase 2i ships the AI host + free-Interrogation architecture on top. Naina Kapoor's canon has been corrected: she is a corporate-investigations journalist, not a freelance designer, and her Mussoorie cover/reason now ties to Vikram's Rhea/Metropolis diligence plus his silence. The eval harnesses (`npm run eval:adjudicator -- all` for per-cue cue text; `npm run eval:host` for AI-host evidence-drop / phase-transition decisions) are the contract between the author and the engine; keep them green whenever cue or `arrivesWhen` text changes.

4. **Phase 2i shipped.** What it delivered:
   - **AI host-judgment service** (`src/lib/host-judgment.ts`) — one OpenRouter call per `askSuspect` turn judges (a) whether any authored not-yet-unlocked evidence's `arrivesWhen` clause is satisfied, and (b) whether a `transition-phase` (e.g., Interrogation → Accusation) should fire. Conservative bias toward "wait."
   - **Phase state machine** (`supabase/migrations/0005_session_phase.sql` + `transitionSessionPhase`) — sessions now have `phase: briefing | interrogation | accusation | reveal`. Within Interrogation, `advanceSessionChapter()` is a no-op; the free-choice suspect picker still works via `setSessionScene`.
   - **`arrivesWhen` authoring** on all 14 round-3/4 forensic evidence items in `cases/mussoorie/case.json`, with `cases/mussoorie/evals/host.eval.json` covering 60 host-judgment cases.
   - **Round-robin interviewer** — optional `case.rules.questionsPerDetective` (default 3). Mic auto-rotates after every N questions; manual claim/pass still works.
   - **TV host strip refactor** — story controls (Previous / Next) removed; only social-fabric controls remain (Start game, Pause, Open accusation, End session). New **Case Status panel** polls `GET /api/sessions/[sessionId]/events?type=interview.host_judgment` every 2s.
   - **Design.md rewrite** — `cases/mussoorie/design.md` sections 6 + 9b updated to phase language (Briefing → Interrogation → Accusation → Reveal). The Section 9b playbook is now the canonical host reference for the Interrogation arc.

   Next mainline initiative is **Phase 2h** (Realtime infrastructure + token streaming). See "Next Recommended Phase" below.

5. **Local environment** required for Phase 2i work:
   - `.env.local` with `OPENROUTER_API_KEY` (gpt-4o-mini is the default model; works fine).
   - Local Supabase running via `supabase start` from this repo root (needed if you also test in the browser; NOT needed for eval-only work).
   - `OPENROUTER_API_KEY` is the only thing the eval script needs.

6. **Phones on Wi‑Fi testing the dev server** (`http://<LAN-IP>:3000`): `npm run dev` listens on `0.0.0.0`; `next.config.ts` auto-adds this machine’s non-loopback IPv4 addresses to `allowedDevOrigins` so Next 16 does not 403 `/_next/*` when the page is loaded from a LAN host. Optional: `NEXT_ALLOWED_DEV_ORIGINS=host1,host2,tailscale.hostname`.

7. **`Game_Bible.docx` is stale**; `cases/mussoorie/design.md` is the canonical narrative source.

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
- Naina canon correction complete: removed the stale freelance-design / wellness-brand cover story from `cases/mussoorie/case.json` and `cases/mussoorie/design.md`. Naina should answer "why were you in Mussoorie?" as a corporate investigator following up on confidential work Vikram requested about Rhea / Metropolis Media, with the personal layer that Vikram then went silent. Verification: `npm run validate-case mussoorie` and `npm run eval:adjudicator -- naina` (29/29).
- Phase 2i.2 complete: added `sessions.phase` (`briefing | interrogation | accusation | reveal`) via `supabase/migrations/0005_session_phase.sql`; added optional `Evidence.arrivesWhen`; extended `HostJudgmentVerdict` with `transition-phase` + `targetPhase` using the existing host-judgment OpenRouter call and prose-fallback parser; made `advanceSessionChapter` a no-op during Interrogation while preserving explicit `setSessionScene(..., scene: "interview", chapterId)` for the free-choice picker. Verification: `supabase db reset --local`, phase default query, `npm run validate-cases`, `npm test`, `npm run eval:host`, `npm run lint`, `npm run build`.
- Phase 2i.3 complete: authored `arrivesWhen` on all 14 round-3/4 host-paced forensic evidence items, including porting the 2i.1 second-letter trigger into `anonymous-letter-2`; generalized `src/lib/host-judgment.ts` so the host evaluates ordered candidate evidence from case data instead of hardcoding the second letter; extended `cases/mussoorie/evals/host.eval.json` to 60 cases. Verification: `npm run validate-cases`, `npm test`, `npm run eval:host` (60/60), `npm run lint`, `npm run build`; `npm run eval:adjudicator -- all` remains 103/104 with the documented Bisht rifle "challenges collector explanation" model flake.

Run and verify:
- npm run dev
- npm run validate-cases
- npm test
- npm run eval:adjudicator -- all
- npm run lint
- npm run build

Known expected warnings:
- npm warns about unknown env config "devdir".
- `npm run eval:adjudicator -- all` may still show the known Bisht `secret:the-rifle` "challenges collector explanation" model flake (103/104); this is unchanged from 2i.2.

Environment:
Use .env.example as the template. For Phase 2b+ lobby flows, Supabase must be configured:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

Next task:
Phase 2i is complete (AI host, phase machine, `arrivesWhen` content, round-robin mic rotation, TV coordination strip + Case Status panel, design.md rewrite, handoff cleanup). Next mainline initiative is **Phase 2h** — Realtime infrastructure + token streaming. See the "Phase 2h" section under "Next Recommended Phase" for the full brief.

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

(After Phase 2h: Phase 2j — Pause/Resume; then Phase 3 — Printables polish; then Phase 4 — Assets. See "Later Phases" in this doc for the full backlog.)

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

## Deployment (production)

Target setup: **Vercel** + GitHub import (private repo works). The production build is standard Next.js (`next build` / Vercel default).

Set these **environment variables** in the Vercel project (Production + Preview as needed); mirror `.env.example`:

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (public) |
| `SUPABASE_URL` | Usually same as `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — server-only |
| `OPENROUTER_API_KEY` | **Secret** — required for live interviews |
| `OPENROUTER_MODEL` | Optional override |
| `CASE_ID` | Optional; e.g. `mussoorie` to pin the case picker |
| `NEXT_PUBLIC_APP_URL` | Production site URL, e.g. `https://your-app.vercel.app` (OpenRouter `HTTP-Referer`); set after first deploy and redeploy |

Apply the same **Supabase migrations** to the hosted project as locally. Host/TV join URLs use `x-forwarded-host` / `x-forwarded-proto` (`src/app/session/[sessionId]/host/page.tsx`) so QR codes should resolve to **https** on Vercel.

**Production vs LAN:** `allowedDevOrigins` and `--hostname 0.0.0.0` apply only to `next dev`; they are not required for Vercel HTTPS.

**Auth:** Pushing from a developer machine requires GitHub access (SSH key or HTTPS + PAT). The Cursor agent environment may not have your keys; run `git push` locally.

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
    evals/
      naina.eval.json
      rhea.eval.json
      devraj.eval.json
      bisht.eval.json
      anya.eval.json
      kabir.eval.json
      host.eval.json                 # AI host-judgment golden cases (60)

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
      cases/[caseId]/printables/[file]/route.ts   # serves case printables for iframes
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
    adjudicator.ts           # Per-cue unlock judge (Phase 2g)
    host-judgment.ts         # AI host pacing verdicts: evidence drops + phase transitions (Phase 2i)
    interview-unlocks.ts     # Shared unlock-firing primitives (system messages + unlock-state writes)
    case-status.ts           # Pure formatters for the TV Case Status panel
    session-events.ts        # Query helpers for GET /api/sessions/[id]/events
    round-robin.ts           # Pure mic-rotation arithmetic (Phase 2i.4)
    printables.ts            # resolve printable path + URL helper
    session-codes.ts
    session-store.ts
    supabase.ts

supabase/
  migrations/
    0001_initial.sql
    0002_accusation_votes.sql
    0003_message_role_system.sql       # adds 'system' to message_role enum
    0004_interview_unlock_state.sql    # Phase 2g per-condition state
    0005_session_phase.sql             # Phase 2i.2 briefing/interrogation/accusation/reveal phase

tests/
  phase-machine.test.mjs
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

### Phase 2i — AI host + free-form Interrogation (roll-up: 2i.1 → 2i.6)

Shipped a structural shift from the four-round / human-host-paced model to a three-phase / AI-host-paced model. The human at the table now runs only the social-fabric controls (Start game, Pause, Open accusation, End session); every story decision — when forensic evidence lands, when the second anonymous letter pivots the case toward the Thakurs, when the case is ready for Accusation — is made by a thin server-side AI host service that watches every transcript. Players can interview any of the six suspects in any order during the Interrogation phase; the suspect picker, transcript persistence, and round-robin mic rotation handle the rest.

What's in the architecture:

- **Phase machine**: `sessions.phase` is one of `briefing | interrogation | accusation | reveal` (DB default `'briefing'`; enum + column added in `supabase/migrations/0005_session_phase.sql`). Valid-only transitions enforced in `transitionSessionPhase()`. Briefing still walks the r1-* chapters as a guided sequence. Within Interrogation, `advanceSessionChapter()` is a deliberate no-op; the free-choice suspect picker still works via `setSessionScene({ scene: 'interview', chapterId })`.
- **AI host-judgment service** (`src/lib/host-judgment.ts`): one OpenRouter JSON-output call per `askSuspect` turn (after the adjudicator pass), with a strict `HostJudgmentVerdict` union covering `do-nothing | drop-evidence | transition-phase`. The host enumerates not-yet-unlocked authored evidence (anything with an `arrivesWhen` clause) as the ordered candidate list, plus the already-unlocked authored evidence as context. Verdicts are validated against the candidate ids so the model cannot invent. A `drop-evidence` verdict reuses the same unlock pipeline as the adjudicator (`fireHostJudgmentUnlock` → `insertSystemMessage` + `addUnlockedEvidence` + `interview.host_judgment` event). A `transition-phase` verdict calls `transitionSessionPhase` and logs `interview.host_phase_transitioned`. Default model `openai/gpt-4o-mini`; conservative bias ("err toward wait") is built into the prompt.
- **Authored `arrivesWhen` content**: 14 mid-/late-Interrogation evidence items in `cases/mussoorie/case.json` (`anonymous-letter-2`, `old-newspaper-clipping`, `theft-fir-inventory`, `wall-mount-photo`, `office-rifle-photo`, `land-registry`, `bisht-family-history`, `anya-bus-ticket`, `bisht-devraj-call`, `devraj-jeep-cctv`, `lathi-postmortem`, `grey-shawl-fresh`, `anya-payments`, `vikram-research-notes`). The original 2i.1 hardcoded second-letter trigger is now expressed on the evidence row itself; the host-judgment service is generic. Eval coverage in `cases/mussoorie/evals/host.eval.json` (60 cases: positive / too-early / wrong-thread / already-fired per evidence, plus boundary cases). `npm run eval:host` is the contract.
- **Round-robin interviewer rotation**: optional `case.rules.questionsPerDetective` (default 3). `src/lib/round-robin.ts` exposes pure helpers (`pickNextInterviewer`, `countQuestionsInCurrentStretch`, `shouldRotateAfterQuestion`, `getQuestionsPerDetective`); `askSuspect` rotates `current_interviewer_player_id` after the user message when the stretch hits the cap (derived from trailing `messages` rows — no migration). Manual Take Control / Pass Control still works and resets the stretch. Phone UI shows `Next: {detective name}`; TV shows `Mic rotates every N questions`.
- **TV host strip refactor** (`src/components/HostLobbyView.tsx`): Previous / Next removed (story-advance controls — the AI host owns pacing). Start game / Pause / Resume / Open accusation / End session remain. New `CaseStatusPanel` polls `GET /api/sessions/[sessionId]/events?type=interview.host_judgment` every 2000ms and renders the AI host's most recent reasoning (idle placeholder `"Watching the room…"`). Measured CaseStatusPanel update lag: event visible at ~14ms; with the 2s poll the worst-case panel refresh is ~2014ms (within the 2.5s target).
- **New API route**: `GET /api/sessions/[sessionId]/events` — service-role Supabase query via `getSessionEvents()` with optional `?type=` filter; max 20 results, `created_at desc`.
- **Engine extensions**: `Evidence.arrivesWhen` (optional string in `src/engine/schema/case.schema.json`); regenerated `src/engine/types.ts`; `interview_unlock_state` writes shared with the adjudicator path; `askSuspect` rejects further LLM calls when the session is paused or finished.

What it shipped in code (file inventory):

- New: `src/lib/host-judgment.ts`, `src/lib/round-robin.ts`, `src/lib/case-status.ts`, `src/lib/session-events.ts`, `src/app/api/sessions/[sessionId]/events/route.ts`, `scripts/eval-host.ts`, `cases/mussoorie/evals/host.eval.json`, `supabase/migrations/0005_session_phase.sql`, `tests/host-judgment.test.mjs`, `tests/phase-machine.test.mjs`, `tests/round-robin.test.mjs`, `tests/case-status.test.mjs`, `tests/events-route.test.mjs`.
- Modified: `src/lib/session-store.ts` (host-judgment integration, phase machine, round-robin rotation, paused/finished gating), `src/lib/interview-unlocks.ts` (exported `insertSystemMessage` + `addUnlockedEvidence`), `src/lib/supabase.ts` (`SessionPhase`, `SessionRow.phase`), `src/engine/schema/case.schema.json` + `src/engine/types.ts` (`arrivesWhen`, `questionsPerDetective`), `src/components/HostLobbyView.tsx` (strip refactor + CaseStatusPanel + interview mic label), `src/components/PlayerLobbyView.tsx` (Next: detective label), `cases/mussoorie/case.json` (14 `arrivesWhen` clauses), `cases/mussoorie/design.md` (sections 6 + 9b rewritten to phase language), `package.json` (`eval:host` script, `tsx --test`).

Design caveats authors should know going forward:

- **`arrivesWhen` is read literally by the host LLM.** Never include engine notes ("cascade", "fires after X"). Describe player behavior and case state, not engine behavior. Include explicit "do NOT fire if…" clauses for false positives. Err conservative — under-drop > over-drop. Same discipline as the adjudicator's `cooperationCue`.
- **Same-noun adjacent threads need narrow text.** `land-registry` had to require land/property/shell-company nouns so rifle-only Bisht pressure does not pull property evidence early. `bisht-devraj-call` and `devraj-jeep-cctv` need present-day wording; 2011 corruption is not enough. `vikram-research-notes` has an explicit "do NOT fire for laptop deletion without Thakur research" clause.
- **The host LLM can fail open.** If the OpenRouter call errors or returns malformed JSON, the engine logs `interview.host_judgment_failed` and the turn proceeds without auto-firing. The case is still playable manually via the (preserved) Open Accusation button.

**Verification (this commit)**:
- `npm run validate-cases` — 0 errors.
- `npm test` — 118 pass, 0 fail, 1 skipped (live `getSessionEvents` 404 when Supabase env absent in test runner).
- `npm run eval:adjudicator -- all` — 103/104 (known pre-existing Bisht `secret:the-rifle` "challenges collector explanation" model flake; reproduces identically on untouched main).
- `npm run eval:host` — 59/60 (known pre-existing `bisht-devraj-call` positive flake; reproduces identically on untouched main).
- `npm run lint` — clean.
- `npm run build` — clean; `/api/sessions/[sessionId]/events` registered.

The sub-phase entries (2i.1 → 2i.5) below are kept for archaeology — they document the per-sub-phase shipped artifacts and verification.

### Phase 2i.5 — TV host strip refactor + Case Status panel

Shipped coordination-only TV host controls and a Case Status panel driven by AI host reasoning events:

- **TV strip removed**: Previous, Next (story-advance controls — AI host owns pacing now). Drop-evidence was never on the top strip; host-unlock **Reveal** remains in `InterviewScene`'s `HostFallbackBanner` (unchanged).
- **TV strip kept**: Start game, Pause / Resume (toggles `sessions.status`), Open accusation (calls `transitionSessionPhase` → `accusation`), End session (sets `status: finished`; `askSuspect` rejects further LLM calls when paused or finished).
- **CaseStatusPanel** (`HostLobbyView.tsx`): polls `GET /api/sessions/[sessionId]/events?type=interview.host_judgment` every **2000ms**; renders only `interview.host_judgment` rows (not adjudicator unlock events, not `host_judgment_fired`).
- **Idle placeholder**: `"Watching the room…"` (also used as do-nothing fallback when the host verdict has no usable `reason` string).
- **Do-nothing verdicts**: when `payload.reason` is present, the panel shows it; empty/missing reason → low-key `"Watching the room…"`.
- **New route**: `GET /api/sessions/[sessionId]/events` — service-role Supabase query via `getSessionEvents()`, optional `?type=` filter, max **20** results, `created_at desc`.
- **Pure helpers**: `src/lib/case-status.ts` (`formatHostJudgmentEvent`, `resolveCaseStatusLine`), `src/lib/session-events.ts` (query post-process + cap).
- **Tests**: `tests/case-status.test.mjs`, `tests/events-route.test.mjs` (pure query helpers + `getSessionEvents` 404 when Supabase env is configured).

**Measured CaseStatusPanel update lag** (local smoke, dev server + Supabase REST event insert): event visible to events API in **14ms**; with the 2s poll interval, worst-case panel refresh bound **~2014ms** (≤ 2.5s target).

**Verification**:
- `npm run validate-cases` passed.
- `npm test` passed **118/118** (1 skipped: live `getSessionEvents` 404 when Supabase env absent in test runner).
- `npm run eval:adjudicator -- all` returned **103/104** — known pre-existing Bisht `secret:the-rifle` flake unchanged.
- `npm run eval:host` returned **59/60** — known occasional `bisht-devraj-call` positive flake unchanged.
- `npm run lint` passed.
- `npm run build` passed; `/api/sessions/[sessionId]/events` registered.

### Phase 2i.4 — Round-robin interviewer rotation

Shipped automatic mic rotation during live interviews:

- **Schema**: optional `case.rules.questionsPerDetective` (integer, default **3** when omitted). Regenerated `src/engine/types.ts`.
- **Engine**: `src/lib/round-robin.ts` — pure helpers `pickNextInterviewer`, `countQuestionsInCurrentStretch`, `shouldRotateAfterQuestion`, `getQuestionsPerDetective`. `askSuspect` in `src/lib/session-store.ts` rotates `current_interviewer_player_id` after the user message when the current stretch hits the cap; stretch count is derived from trailing `messages` rows (no migration). Manual **Take Control** / **Pass Control** still writes `current_interviewer_player_id` via the existing route and resets the stretch because only consecutive questions from the current interviewer count.
- **Phone UI**: `PlayerLobbyView` **InterviewMode** shows **`Next: {detective name}`** on the question that will trigger rotation; applies returned `session` after each ask so mic handoff is immediate.
- **TV UI**: `HostLobbyView` **InterviewScene** shows **`Mic rotates every N questions`** beside the interviewer badge.
- **Tests**: `tests/round-robin.test.mjs` + schema pin in `tests/mussoorie.test.mjs`.

### Phase 2i.3 — `arrivesWhen` content + eval for round-3/4 forensic evidence

Shipped: authored natural-language `arrivesWhen` conditions on all 14 host-paced round-3/4 forensic evidence items in `cases/mussoorie/case.json`: `anonymous-letter-2`, `old-newspaper-clipping`, `theft-fir-inventory`, `wall-mount-photo`, `office-rifle-photo`, `land-registry`, `bisht-family-history`, `anya-bus-ticket`, `bisht-devraj-call`, `devraj-jeep-cctv`, `lathi-postmortem`, `grey-shawl-fresh`, `anya-payments`, and `vikram-research-notes`. The second anonymous letter's 2i.1 trigger is now authored on the evidence row instead of only living in prompt code.

The host-judgment service is now generic over authored evidence candidates: `src/lib/host-judgment.ts` enumerates not-yet-unlocked evidence with `arrivesWhen`, shows the host the ordered candidate list plus already-unlocked authored evidence, and validates that any `drop-evidence` verdict names one of those candidates. `src/lib/session-store.ts` now accepts any valid host evidence verdict instead of only `anonymous-letter-2`. The single-call verdict shape remains `{ action, evidenceId?, reason, confidence }` / phase transition as before.

**Files shipped**:
- `cases/mussoorie/case.json` — 14 `arrivesWhen` strings; legacy `unlockedAtChapter` values preserved as fallback.
- `cases/mussoorie/evals/host.eval.json` — 60 host eval cases: positive, too-early, wrong-thread, and already-fired for each authored evidence item, plus four extra boundary cases.
- `src/lib/host-judgment.ts` — generic candidate collection, prompt updates, candidate-id guard for model outputs.
- `src/lib/session-store.ts` — host evidence unlock path now accepts any valid candidate evidence id.
- `scripts/eval-host.ts` — eval snapshots run in `interrogation` phase so the 2i.3 forensic-drop path is exercised.
- `tests/host-judgment.test.mjs` — prompt/candidate tests plus non-candidate verdict guard coverage.

**Phase 2i.3 authoring notes**:
- The trickiest clauses were the ones where the same nouns appear in adjacent threads. `land-registry` needed an explicit land/property/shell-company requirement so rifle-only Bisht pressure does not pull property evidence early.
- `bisht-devraj-call` and `devraj-jeep-cctv` needed narrow present-day wording: old 2011 Devraj corruption is not enough; the players must pursue the 8:00 PM gap/call or present-night movement.
- `vikram-research-notes` needed an explicit "do NOT fire for laptop deletion without Thakur research" clause, because Rhea's 5 AM deletion alone is a separate thread.
- For all "already-fired" cases, the eval contract is that already-unlocked authored evidence is excluded from candidates; the host may not re-drop it or invent a non-candidate id.

**Verification**:
- `npm run validate-cases` passed.
- `npm test` passed 98/98.
- `npm run eval:host` passed 60/60.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run eval:adjudicator -- all` returned 103/104 with the known pre-existing Bisht `secret:the-rifle` "both rifle images and challenges collector explanation" model flake; unchanged from prior handoff notes.

### Phase 2i.2 — Phase state machine; collapse rounds 2/3/4 into Interrogation

Shipped: a coarse session phase state machine that separates the player-facing investigation phase from the legacy chapter pointer. Sessions now have `phase: "briefing" | "interrogation" | "accusation" | "reveal"` with DB default `"briefing"`. Briefing still uses the existing round-1 chapter walk. Entering Interrogation lands on the round-2 evidence-drop / picker surface; after that, `advanceSessionChapter()` is intentionally a no-op while `setSessionScene({ scene: "interview", chapterId })` still allows the free-choice suspect picker to jump to any round-2 interview chapter.

The existing `src/lib/host-judgment.ts` service was extended rather than replaced: `HostJudgmentVerdict` now includes `action: "transition-phase"` with `targetPhase`, and the same OpenRouter JSON call plus prose-wrapped JSON fallback parser handles evidence-drop and phase-transition verdicts. In `askSuspect()`, a valid `transition-phase` verdict is applied through the same phase-transition helper and logged as `interview.host_phase_transitioned`.

**Files shipped**:
- `supabase/migrations/0005_session_phase.sql` — `session_phase` enum + `sessions.phase` column defaulting to `'briefing'`.
- `src/lib/supabase.ts` — `SessionPhase` and `SessionRow.phase`.
- `src/lib/session-store.ts` — phase helpers, valid-transition guard, `transitionSessionPhase()`, Interrogation no-op advance, and host-driven phase transitions.
- `src/lib/host-judgment.ts` — verdict union extension (`transition-phase`, `targetPhase`), prompt updates, parser coverage.
- `src/engine/schema/case.schema.json` + `src/engine/types.ts` — optional `Evidence.arrivesWhen` for 2i.3 authoring.
- `src/components/HostLobbyView.tsx` — disables chapter Previous/Next during Interrogation and keeps the suspect picker available from the case board.
- `tests/phase-machine.test.mjs`, `tests/host-judgment.test.mjs`, `tests/mussoorie.test.mjs` — phase-transition, parser, no-op, picker, migration-default, and schema-pin coverage.

**Verification**:
- `supabase db reset --local` applied migrations through `0005_session_phase.sql`.
- `supabase db query "select column_name, column_default from information_schema.columns where table_name='sessions' and column_name='phase';"` returned `'briefing'::session_phase`.
- `npm run validate-cases` passed.
- `npm test` passed 96/96.
- `npm run eval:host` passed 5/5.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run eval:adjudicator -- all` still has the known pre-existing Bisht `secret:the-rifle` "both rifle images and challenges collector explanation" miss (1/104) with the current model; this path is unrelated to 2i.2.

### Content correction — Naina Kapoor canon

Shipped: removed the stale "freelance design job / wellness brand" cover story from Naina's live case data and canonical design notes. Naina Kapoor is now consistently authored as a Delhi-based corporate-investigations journalist. Her reason for being in Mussoorie is that Vikram asked her to quietly investigate Rhea / Metropolis Media, then stopped replying; the personal layer is the unanswered calls and unresolved breakup, not a design side job.

**Files updated**:
- `cases/mussoorie/case.json` — Naina `persona`, `knownFacts`, `publicAlibi`, and `vikram-naina-whatsapp.loreText`.
- `cases/mussoorie/design.md` — Naina character sheet day-job and public-story bullets.

**Verification**:
- `rg "freelance design|wellness brand|design contract|just designing|design feedback" cases/mussoorie/case.json cases/mussoorie/design.md cases/mussoorie/evals src tests` returns no matches.
- `npm run validate-case mussoorie` passes.
- `npm run eval:adjudicator -- naina` passes 29/29.

### Phase 2i.1 — AI host-judgment service for the second letter

Shipped: a thin server-side AI host service that judges ONE thing per `askSuspect` turn — should the second anonymous letter (`anonymous-letter-2`, the Thakur-pivot letter) be revealed now? Mirrors `src/lib/adjudicator.ts` in shape (system+user prompt builder, strict-JSON `response_format`, prose-fallback parser, OpenRouter call with `temperature: 0.1`, model defaults to `openai/gpt-4o-mini`). Single-decision scope on purpose; broader forensic events and the phase machine are deferred to 2i.2/2i.3.

**Trigger threshold** the AI host enforces (verbatim from the system prompt):
- At least Naina, Rhea, and Kabir have each opened up to the players (their cooperation cues have fired).
- AND the Thakur family (or the Thakurs, or the 2011 Thakur murders) has been mentioned at least twice across all suspect transcripts, by either an interviewer or a suspect.
- Both must hold; if either is missing, the host returns `do-nothing`. Conservative by design.

**Files shipped**:
- `src/lib/host-judgment.ts` — `judgeHostAction()`, `parseHostJudgmentVerdict()`, `alreadyUnlockedVerdict()`, `fireHostJudgmentUnlock()`, system + user prompt builders, `HOST_JUDGMENT_TARGET_EVIDENCE_ID = "anonymous-letter-2"`. Short-circuits without an LLM call when the letter is already in `session.unlocked_evidence`.
- `scripts/eval-host.ts` + `cases/mussoorie/evals/host.eval.json` — golden eval harness (5 cases: positive, too-early, wrong-thread, already-fired, boundary). All 5 pass at `temperature: 0.1` against `openai/gpt-4o-mini`. Run via `npm run eval:host`.
- `tests/host-judgment.test.mjs` — 16 unit tests (pure helpers + the `missing_api_key` and `already-unlocked short-circuit` paths). Run via `npm test`.
- `src/lib/session-store.ts` — extended `AskSuspectResult` with `hostJudgment: HostJudgmentVerdict | null`; added a new pass in `askSuspect` after `evaluatePendingUnlocks` that calls `judgeHostAction()`, fires the unlock when the verdict is `drop-evidence`, and logs `interview.host_judgment_failed` events on non-fatal LLM failures. New helper `collectAllTranscriptsForHost(sessionId, caseData)` queries all messages + `interview_unlock_state` and derives `hasOpenedUp` from `condition_id LIKE 'secret:%' AND met_at IS NOT NULL`.
- `src/lib/interview-unlocks.ts` — exported `insertSystemMessage` and `addUnlockedEvidence` so host-judgment can reuse the same unlock-firing primitives as the adjudicator.
- `package.json` — `test`/`test:watch` now use `tsx --test` (was `node --test`) so tests importing `.ts` modules from `src/lib/` run without compile step; added `eval:host` script.

**Eval results**: 88/88 unit tests, 5/5 host-eval cases, 103/104 adjudicator cases (the one failure is the pre-existing Bisht `secret:the-rifle` "challenges collector explanation" flake — reproduces identically on untouched `main`; called out as acceptable in the brief).

### Post–Phase 2g.2 — LAN dev, join robustness, mobile case board, printables route

Shipped in mainline after 2g.2 content freeze:

- **`next.config.ts`**: `allowedDevOrigins` populated from local non-loopback IPv4 interfaces at config load + optional `NEXT_ALLOWED_DEV_ORIGINS`. Fixes Next 16 dev cross-origin blocking of `/_next/*` when opening the app as `http://192.168.x.x:3000`.
- **`package.json`**: `dev` script uses `next dev --hostname 0.0.0.0` so other devices on LAN can reach the dev server.
- **`JoinLobbyForm`**: Uncontrolled name field + `fetch` POST to `/api/join` (no native form navigation). **`suppressHydrationWarning`** and explicit `spellCheck` / `autoCorrect` / `autoCapitalize` to reduce WebKit hydration mismatches on the name input. **`newDeviceId()`** falls back when `crypto.randomUUID()` is missing (HTTP LAN is not a secure context — iOS Safari).
- **`PlayerLobbyView`**: Case board uses **Brief | Evidence** tabs; evidence opens in a **bottom sheet** on small screens; detail uses **Notes** vs **Prop sheet** tabs so the printable iframe and long lore are not one endless scroll. **Digital case file** is hidden on `case_board` scene to avoid duplicating the same evidence three times; other scenes keep the collapsible file with the same inspector pattern.
- **Printables**: `src/lib/printables.ts` + **`GET /api/cases/[caseId]/printables/[file]`** for in-app exhibits (engine + Mussoorie assets in repo).

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

Phase 2i shipped the AI-host + free-Interrogation architecture on top of the existing polling/non-streaming infrastructure. Phase 2h is the infrastructure layer that makes the new design feel instant: replace every poll with authenticated Supabase Realtime, then upgrade the interview route to true token-by-token streaming. Originally planned as a Phase 2f fast-follow ("2f.1"); deferred so 2g and 2i could land first. Now the highest-leverage next move — every Phase 2i UX win (AI host firing forensic evidence, mic auto-rotating, Case Status panel) currently waits up to 2s for a poll cycle, and the interview suspect responses arrive as a single full-message render rather than streaming.

Goal: A suspect's response appears token-by-token on the TV and on every phone simultaneously; the AI host's forensic drops, phase transitions, and Case Status panel update instantly; the round-robin mic handoff and the host-fallback banner refresh without a 1.5–2.5s lag.

Likely files:

- New: server-side JWT minting helper (probably `src/lib/realtime-auth.ts`) that signs short-lived tokens with `app.session_id` claim.
- New: browser-side authenticated Supabase client init (probably `src/lib/supabase-client.ts`).
- `src/components/HostLobbyView.tsx` — replace the 2.5s `getLobbyState` poll AND the 2s `CaseStatusPanel` events poll with Realtime subscriptions on `sessions`, `players`, `accusation_votes`, and a filtered subscription to the `events` table for `interview.host_judgment` rows.
- `src/components/PlayerLobbyView.tsx` — same for the phone side. Replace the 1.5–2.5s transcript poll inside `InterviewMode` with a Realtime subscription on `messages` filtered by session + suspect.
- `src/app/api/sessions/[sessionId]/interview/route.ts` — switch from non-streaming OpenRouter call to SSE; write incremental updates to `messages.content` with `is_streaming: true` so Realtime fans out tokens to all clients.
- `src/lib/session-store.ts` — adjust `askSuspect` to stream and incrementally update. The Phase 2i `adjudicator → host-judgment → unlocks → mic rotation` post-roleplay pipeline still runs after the stream completes; only the visible LLM response shape changes.
- `src/lib/supabase.ts` / `supabase/migrations/` — possible new column `messages.is_streaming` (boolean, default false) so the UI can render a "typing" indicator while incremental tokens land.

Verify:

- All existing 2.5s lobby/scene polls, the 1.5s interview-message polls, and the 2s `CaseStatusPanel` events poll are removed.
- A suspect's response appears token-by-token on TV and on every phone simultaneously.
- The session-scoped Realtime auth path does not leak rows from other sessions (test by joining two sessions in different tabs).
- AI-host forensic drops (`interview.host_judgment` events written by `src/lib/host-judgment.ts`) and phase transitions (`interview.host_phase_transitioned`) appear on the TV's Case Status panel within ~100ms instead of ~2000ms.
- Round-robin mic handoff (`current_interviewer_player_id` change after every N questions) lights up on every phone within ~100ms.
- Phase 2g host-fallback notification (currently lands on the next 2.5s lobby poll) now appears instantly.
- Full hard gate still green: `npm run validate-cases && npm test && npm run eval:adjudicator -- all && npm run eval:host && npm run lint && npm run build`.

What NOT to do:

- Don't touch any Phase 2i case-data (`arrivesWhen`, `unlockBehavior`, eval files). This is pure infrastructure; the contract between author and engine doesn't change.
- Don't reintroduce the chapter-walk navigation removed in 2i.2/2i.5. The phase machine and AI host stay in charge of pacing.
- Don't bundle in Phase 2j (Pause/Resume) features. Pause already works as a status toggle; resume is its own phase.

Open design questions for whoever picks this up:

- **JWT scope shape.** Probably `app.session_id` only, with RLS policies filtering `messages`, `events`, `players`, `accusation_votes`, `sessions`, `interview_unlock_state` by that claim. Anything beyond that risks the same boundary leakage we're guarding against in interview prompts.
- **Streaming buffer policy.** Whether to flush every token, every word boundary, or every 50ms. Word-boundary flushes tend to feel best and reduce write amplification on the `messages` table.
- **Fallback when Realtime is unavailable.** Probably keep the current poll helpers around behind a feature flag; the UI degrades to polling if the Realtime subscription fails to connect.

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

### Phase 2j — Pause/Resume

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
