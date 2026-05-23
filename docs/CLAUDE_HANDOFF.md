# Mystery Engine — Handoff

**Last updated**: 2026-05-23
**Repository**: Git remote `origin` → `https://github.com/shashankraider/PartyGame.git`. Deploy production on Vercel (or any Next.js host); see **Deployment** below.
**Current phase**: Phase 2i.1 — AI host-judgment service for the second letter — shipped. **Next: Phase 2i.2 — Phase state machine** (collapse rounds 2/3/4 into one Interrogation phase). Sub-phase briefs live in the **Next Recommended Phase** section below — copy-paste 2i.2 into a fresh session and run it in a worktree. Remaining order: 2i.2 → (2i.3 + 2i.5 in parallel, 2i.4 independent) → 2i.6.
**Handoff target**: Cursor (or any other coding agent / fresh Claude session). The five sibling workdirs at `/Users/shashankmendiratta/shire/PartyGame-2g2-*/` from the earlier failed parallel attempt are no longer needed for mainline work — safe to delete with `rm -rf /Users/shashankmendiratta/shire/PartyGame-2g2-*` if you want them gone.

This document is the running handoff for continuing development with any coding agent. It summarizes the product, the repo state, completed work, verification commands, and the next useful development prompt. Designed to be picked up cold by a new client.

---

## ⚡ Pickup TL;DR (read first)

If you're a new agent (Cursor included) taking over this project:

1. **Run the verification suite first**, before touching anything:
   ```bash
   cd /Users/shashankmendiratta/shire/PartyGame
   npm install                 # if node_modules isn't current
   npm run validate-cases      # expect: 0 errors, 0 warnings (Phase 4 art has shipped)
   npm test                    # expect: 72/72 passing
   npm run eval:adjudicator -- all  # expect: 104/104 (one known flake on Bisht 'rifle/challenges' may toggle)
   npm run lint                # expect: clean
   npm run build               # expect: clean build, all routes registered
   ```
   If anything fails here, **stop and investigate before continuing** — the state is not what this doc describes.

2. **Read `docs/CLAUDE_HANDOFF.md` end-to-end** (this file). The most important sections after this TL;DR:
   - "Next Recommended Phase" — Phase 2i breakdown with six `/goal`-ready sub-phase briefs. Run them sequentially in worktrees.
   - "Completed Work" — every shipped phase with its concrete artifacts.
   - "Phase 2g — Adjudicator, Unlock Tiers, and Host Fallback (reference / shipped design)" — the locked design language for the unlock-tier system you'll be extending in 2i.

3. **The codebase is at a stable, fully-built green state.** Phase 2g.2 ships unlock-cue authoring and eval coverage for all six Mussoorie suspects. The round-2 free-choice suspect picker ships on top. The persona-prompt fix scopes the cover-story alibi to whereabouts questions only. The eval harness (`npm run eval:adjudicator -- all`) is the contract between the author and the engine; keep it green whenever cue text changes.

4. **Phase 2i is the active next slice.** It removes story-judgment from the human host (an AI host service makes those calls instead), collapses round-2/3/4 chapter walls into one open Interrogation phase, and adds a round-robin interviewer for participation. Six sub-phases with explicit dependency graph in "Next Recommended Phase" below. **Do them one at a time, each in its own worktree**, commit + push between each, then update the relevant task in your task board.

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

### Phase 2i — AI host + free-form interrogation

Goal: remove the human host from story-judgment decisions. A human still coordinates the room (Start game, Pause, Open accusation, End session — pure social-fabric controls), but every story call — when forensic evidence arrives, when the second anonymous letter lands, when the case opens accusation — is made by an AI host service that watches the conversation. Players collectively run the investigation; nobody at the table has to know the case.

Companion change: round-robin interviewer (mic auto-rotates every 3 questions) so everyone participates. The current "Take control / Pass control" buttons stay as manual override.

Companion structural change: collapse the round-2/3/4 chapter walls into one open **Interrogation phase**. Any suspect, any order, any number of times. Forensic evidence (`anonymous-letter-2`, `bisht-family-history`, `land-registry`, `anya-payments`, `devraj-jeep-cctv`, `lathi-postmortem`, etc.) lands when the AI host judges the moment is right — based on what's been said, asked, and revealed across all six suspects' transcripts. Not on a chapter click.

**Phase 2h (Realtime + token streaming) has been bumped to after 2i.** 2i is the higher-leverage design change; 2h is infrastructure polish that benefits more from landing on top of the new architecture.

This is a real refactor. Split into six sequenced sub-phases below. **Land one, merge, then start the next.** Each sub-phase below has two blocks:

1. **"Paste this into `/goal`"** — a short (<2000 char) command that fits the `/goal` 4000-char limit. Copy the content of that fenced code block, paste into `/goal`, run.
2. **"Full implementation reference"** — the longer detailed brief. The agent reads this from the doc *after* kicking off via `/goal`. Contains exact file paths, test cases, hard-gate command sequence, manual smoke checklist, and handoff-update steps.

Both blocks live in the same section so a new agent finds the long context naturally after `/goal`-ing the short version.

#### Sub-phase dependency graph

| Sub-phase | Depends on | Blocks |
|---|---|---|
| 2i.1 — AI host service ✅ | none | 2i.2, 2i.5 |
| 2i.2 — Phase state machine | 2i.1 | 2i.3 |
| 2i.3 — Author `arrivesWhen` on round-3/4 evidence | 2i.2 | 2i.6 |
| 2i.4 — Round-robin interviewer | none | 2i.6 |
| 2i.5 — TV host strip + case status panel | 2i.2 | 2i.6 |
| 2i.6 — Verify + eval + handoff doc | all others | — |

Strict ordering: **2i.1 → 2i.2 → (2i.3 + 2i.5 in parallel) → 2i.6**. 2i.4 is independent and can land any time before 2i.6.

#### 2i.1 — AI host-judgment service ✅ SHIPPED

(See **Completed Work → Phase 2i.1** above for the final trigger threshold and shipped files. The brief below is kept for reference; next agent should pick up 2i.2.)

**Paste this into `/goal`** (fits the 4000-char cap):

```text
/goal Phase 2i.1 — AI host-judgment service for the second-letter decision.

Repo: /Users/shashankmendiratta/shire/PartyGame (main branch). Work in a fresh git worktree. Read the full brief in docs/CLAUDE_HANDOFF.md under "#### 2i.1 — AI host-judgment service" — it has all the file paths, test cases, hard-gate command sequence, and handoff-update steps you must follow before committing.

Scope (one-line): build src/lib/host-judgment.ts mirroring src/lib/adjudicator.ts; it judges ONE thing — should anonymous-letter-2 land now? Wire it into askSuspect after the unlock-evaluation pass. Single-decision scope on purpose; phase machine and other forensic drops are 2i.2/2i.3.

Hard gate before commit (do not push if any fail): create tests/host-judgment.test.mjs + scripts/eval-host.ts + cases/mussoorie/evals/host.eval.json with the cases listed in the full brief; then run npm run validate-cases && npm test && npm run eval:adjudicator -- all && npm run eval:host && npm run lint && npm run build.

After tests pass: update CLAUDE_HANDOFF.md as the brief specifies (Current phase banner, Completed Work entry with your final trigger threshold, mark 2i.1 ✅ in Next Recommended Phase). Commit message: "Phase 2i.1 — AI host-judgment service for the second letter." Push to main.

Report back with the trigger threshold text you settled on and the final eval pass counts.
```

**Full implementation reference** (do not paste this into `/goal` — read it from the doc after kicking off):

```
/goal Phase 2i.1 — Build the AI host-judgment service.

Scope:
After the existing askSuspect flow runs (suspect responds + adjudicator
evaluates per-cue unlocks), invoke a new server-side AI host service to
make ONE specific judgment call: should the second anonymous letter
(evidence id `anonymous-letter-2`) be revealed now? Output a structured
JSON verdict. If yes, the engine fires it the same way an adjudicator
unlock fires today: insert a 'system' role message, add the evidence id
to session.unlocked_evidence, log an event.

This is intentionally a single-decision scope. Other forensic drops and
phase transitions are deferred to 2i.2 — they'll plug into the same
service once the surface is proven.

Files to create:
- src/lib/host-judgment.ts — mirrors src/lib/adjudicator.ts in shape.
  Function: judgeHostAction({ caseData, session, allTranscripts,
  unlockedEvidence }) -> { action: 'do-nothing' | 'drop-evidence',
  evidenceId?: string, reason: string }. Cheap model (gpt-4o-mini or
  case.llm.adjudicatorModelOverride).

Files to modify:
- src/lib/session-store.ts — askSuspect calls judgeHostAction after
  evaluatePendingUnlocks. If the verdict says drop-evidence, fire the
  same unlock pipeline as an adjudicator-driven unlock. Add the result
  to AskSuspectResult so the route returns it.

Eval:
- scripts/eval-host.ts (new) — golden test cases for the 'should the
  second letter land now?' decision. At minimum: positive (Thakurs have
  been mentioned multiple times, Naina+Rhea+Kabir have all opened up),
  too-early (only Naina has opened up), too-vague (Thakurs never
  mentioned). Run with `npm run eval:host`. Add the npm script.

What NOT to do:
- Don't extend the phase machine (that's 2i.2).
- Don't touch any other forensic-evidence triggers.
- Don't remove host controls (that's 2i.5).
- Don't change the chapter walk.
- Keep adjudicator.ts and interview-unlocks.ts untouched.

Success criteria:
- npm run lint, npm test, npm run validate-cases, npm run build all clean.
- npm run eval:adjudicator -- all still passes 104/104.
- npm run eval:host passes its authored golden cases.
- Manual: in REPL or live, after firing all the cooperation cues on
  Naina/Rhea/Kabir in a session, the next askSuspect call surfaces the
  second-letter unlock automatically. With only Naina's cue fired, it does
  not. Document the trigger threshold you settled on.

Tests required (hard gate — do not commit if any fail):

Create the following before commit:
- `tests/host-judgment.test.mjs` — node:test unit tests for the new module. Required cases:
  - JSON-parse fallback when the LLM returns prose-wrapped JSON.
  - Short-circuit return when `OPENROUTER_API_KEY` is missing (must throw with `code: 'missing_api_key'` matching the AdjudicatorError pattern, not crash).
  - Short-circuit return when `anonymous-letter-2` is already in `session.unlocked_evidence` (do not fire twice).
  - Verdict shape: when `met: true`, return must include `evidenceId: 'anonymous-letter-2'` and a non-empty `reason`.
- `scripts/eval-host.ts` + `cases/mussoorie/evals/host.eval.json` — golden eval harness for the host-judgment LLM call. Required cases:
  - Positive: Naina + Rhea + Kabir cooperation cues all fired, "Thakurs" mentioned in 2+ transcripts → `met: true`.
  - Too-early: only Naina's cue fired, no Thakur mentions anywhere → `met: false`.
  - Wrong-thread: all three cues fired but no Thakur mentions in any transcript → `met: false` (the AI host shouldn't drop the Thakur letter when nobody's even said "Thakur" yet).
  - Already-fired: same as positive but `anonymous-letter-2` already in unlocked_evidence → `met: false`.
  - Add `eval:host` to the npm scripts in package.json.

Run before commit (all must pass cleanly):
```bash
npm run validate-cases   # 0 errors
npm test                 # 72/72 + your new host-judgment tests
npm run eval:adjudicator -- all   # 104/104 (known Bisht flake okay if it's the same one as before)
npm run eval:host                 # all authored cases pass
npm run lint
npm run build
```

Manual smoke (document the result in the commit body):
- Start a fresh REPL session at `r2-interview-naina`. Fire her cooperation cue. Confirm `anonymous-letter-2` does NOT auto-fire yet (only Naina has opened up).
- Manually advance through Rhea and Kabir's cooperation cues. Confirm `anonymous-letter-2` does NOT fire if Thakurs were not mentioned.
- Drop a Thakur-themed question into Naina's or Anya's transcript. Re-fire any cue. Confirm `anonymous-letter-2` now lands as a system message.

Handoff update (do this before committing):
- Update the **Current phase** banner at the top of CLAUDE_HANDOFF.md to note 2i.1 is shipped and 2i.2 is next.
- Add a 2i.1 entry to the **Completed Work** section with: one-line description of what shipped (the host-judgment service + second-letter decision), files touched (`src/lib/host-judgment.ts`, `scripts/eval-host.ts`, `tests/host-judgment.test.mjs`, edits to `src/lib/session-store.ts`), and the trigger threshold you settled on (the conditions under which the AI host actually fires the second letter — paste your final cooperationCue-equivalent text).
- In the **Next Recommended Phase** section, mark 2i.1 as ✅ shipped (e.g., a checkmark next to the heading) so the next agent picks 2i.2 cleanly.
- If 2i.4 is also shipped by the time of your commit (it can land in parallel), don't touch its line — just make sure your changes don't conflict with theirs.

Commit message: 'Phase 2i.1 — AI host-judgment service for the second letter.'
```

#### 2i.2 — Phase state machine

**Paste this into `/goal`** (fits the 4000-char cap):

```text
/goal Phase 2i.2 — Phase state machine; collapse rounds 2/3/4 into one Interrogation phase.

Depends on: 2i.1 must be merged on main first. Repo: /Users/shashankmendiratta/shire/PartyGame. Work in a fresh worktree. Read the full brief in docs/CLAUDE_HANDOFF.md under "#### 2i.2 — Phase state machine".

Scope (one-line): add migration supabase/migrations/0005_session_phase.sql (sessions.phase column: briefing | interrogation | accusation | reveal). Add arrivesWhen field to Evidence in case.schema.json; regenerate types.ts. Within interrogation, advanceSessionChapter becomes a no-op; setSessionScene still works for free-choice picker. Extend host-judgment service to also decide phase transitions (briefing->interrogation, interrogation->accusation, accusation->reveal).

Hard gate before commit: add tests/phase-machine.test.mjs with the cases listed in the full brief (valid-transitions-only, defaults, interrogation no-op, picker still works). Run supabase db reset --local first, then npm run validate-cases && npm test && npm run eval:adjudicator -- all && npm run eval:host && npm run lint && npm run build.

After tests pass: update CLAUDE_HANDOFF.md per the brief (Current phase, Completed Work entry, mark 2i.2 ✅, add 0005 migration to Repository Map). Commit: "Phase 2i.2 — Phase state machine; collapse rounds 2/3/4 into Interrogation." Push to main.
```

**Full implementation reference** (do not paste — read from doc):

```
/goal Phase 2i.2 — Collapse round-2/3/4 chapters into an open Interrogation phase.

Depends on: 2i.1 merged.

Scope:
Add session.phase column (briefing | interrogation | accusation |
reveal) via a new migration. Replace the chapter-walk progression model
inside round 2/3/4 with a phase machine. Within the Interrogation
phase, ANY suspect can be interviewed in ANY order, multiple times
(the round-2 picker we already shipped becomes the picker for the
whole Interrogation phase).

Round-3/4 chapters get repurposed: their narration/printable hooks
remain as 'forensic events' but they're no longer linear-walkable. The
AI host (extended in this phase to handle more than just the second
letter — see 2i.3 for content authoring) decides when each forensic
event triggers.

Files to modify:
- supabase/migrations/0005_session_phase.sql — add session.phase column
  with default 'briefing'. Set on r1-suspect-board completion to
  'interrogation'.
- src/engine/schema/case.schema.json — Evidence gains an optional
  `arrivesWhen` natural-language condition string. Regenerate types.ts.
- src/lib/session-store.ts — setSessionScene and advanceSessionChapter
  become phase-aware. Within Interrogation, advance is a no-op; only
  phase transitions fire.
- src/lib/host-judgment.ts — extend judgeHostAction to also decide
  phase transitions (briefing -> interrogation when r1-suspect-board
  ends; interrogation -> accusation when AI judges the case is solvable;
  accusation -> reveal after votes are in).
- src/lib/supabase.ts — add `phase` to SessionRow type.

What NOT to do:
- Don't author arrivesWhen content for any evidence (that's 2i.3).
- Don't change UI controls beyond what's necessary for phase rendering
  (the TV strip rewrite is 2i.5).
- Don't break the existing 2i.1 second-letter decision — port it into
  the new arrivesWhen shape.

Success criteria:
- npm run lint, npm test, npm run validate-cases, npm run build clean.
- Manual: a fresh session walks Briefing through r1-* chapters as
  today, then transitions to Interrogation. Inside Interrogation, the
  round-2 picker shows ALL six suspects with no chapter-walk gate; the
  Next/Previous buttons on the TV are no-ops or hidden during this
  phase. Accusation phase opens via AI host judgment OR manual host
  trigger (Open accusation button remains in TV strip).

Tests required (hard gate — do not commit if any fail):

Create the following before commit:
- `tests/phase-machine.test.mjs` — node:test unit tests for the phase transitions. Required cases:
  - Valid transitions only: briefing → interrogation → accusation → reveal. Any other transition (e.g., reveal → briefing, accusation → interrogation) must throw a SessionStoreError with `code: 'invalid_request'`.
  - Initial value is `'briefing'` for a new session (verify the migration default).
  - During `interrogation`, advanceSessionChapter is a no-op (returns the session unchanged or with `last_activity_at` bumped only).
  - During `interrogation`, setSessionScene with `scene: 'interview'` and a valid round-2 interview chapterId still works (free-choice picker route).
- Schema-pin test in `tests/mussoorie.test.mjs` for the new `arrivesWhen` field. Existing pin already covers Evidence shape; just confirm the new optional field doesn't break it.

Migration verification:
- After running `supabase db reset`, confirm `select column_name, column_default from information_schema.columns where table_name='sessions' and column_name='phase'` returns `phase | 'briefing'::session_phase` (or equivalent enum default).
- Existing sessions in dev should auto-default to `'briefing'` on the next read (or the migration explicitly sets them to the right phase based on `status`).

Run before commit (all must pass cleanly):
```bash
supabase db reset --local           # confirm migration applies cleanly
npm run validate-cases
npm test                            # 72/72 + your new phase-machine tests
npm run eval:adjudicator -- all     # 104/104
npm run eval:host                   # still passes from 2i.1
npm run lint
npm run build
```

Manual smoke (document in commit body):
- Start a fresh session. Walk through r1-* chapters as today. Confirm `session.phase` transitions from `'briefing'` to `'interrogation'` when r1-suspect-board completes (or whatever boundary you chose).
- Inside `interrogation`, confirm the TV's old Next/Previous buttons no-op (or are hidden) for round 2/3/4 chapter changes, but the round-2 picker still works for free-choice navigation.
- Trigger phase transition to `accusation` (manually via Open Accusation button OR via AI host judgment) and confirm the suspect-board picker disappears, accusation UI appears.

Handoff update (do this before committing):
- Update the **Current phase** banner to note 2i.2 is shipped; 2i.3 and 2i.5 unblocked.
- Add a 2i.2 entry to **Completed Work** describing: new migration 0005_session_phase.sql (the `phase` column), schema extension (`arrivesWhen` on Evidence), files modified, and exactly what `setSessionScene` / `advanceSessionChapter` now do in the Interrogation phase (e.g., "advance is a no-op").
- In **Next Recommended Phase**, mark 2i.2 ✅ shipped. Note that 2i.3 and 2i.5 can land in parallel from here.
- Update the **Repository Map** section to add the new migration filename.

Commit message: 'Phase 2i.2 — Phase state machine; collapse rounds 2/3/4 into Interrogation.'
```

#### 2i.3 — Author `arrivesWhen` on round-3/4 evidence

**Paste this into `/goal`** (fits the 4000-char cap):

```text
/goal Phase 2i.3 — Author arrivesWhen conditions + eval cases for every round-3/4 forensic evidence.

Depends on: 2i.2 must be merged. Repo: /Users/shashankmendiratta/shire/PartyGame. Work in a fresh worktree. Read the full brief in docs/CLAUDE_HANDOFF.md under "#### 2i.3 — Author arrivesWhen on round-3/4 evidence".

Scope (one-line): pure authoring, no engine code. For every round-3 and round-4 evidence in case.json (anonymous-letter-2, old-newspaper-clipping, theft-fir-inventory, wall-mount-photo, office-rifle-photo, land-registry, bisht-family-history, anya-bus-ticket, bisht-devraj-call, devraj-jeep-cctv, lathi-postmortem, grey-shawl-fresh, anya-payments, vikram-research-notes), add an arrivesWhen natural-language condition the AI host evaluates. Extend cases/mussoorie/evals/host.eval.json with 4 cases per evidence (positive, too-early, wrong-thread, already-fired).

CRITICAL gotchas (re-read cases/mussoorie/evals/README.md): arrivesWhen is read literally by the host LLM — never write engine notes ("cascade", "fires after"). Describe player behavior and case state, not engine behavior. Err conservative (under-drop > over-drop).

Hard gate before commit: npm run validate-cases && npm test && npm run eval:adjudicator -- all && npm run eval:host (all ~60+ authored cases) && npm run lint && npm run build.

After tests pass: update CLAUDE_HANDOFF.md per brief (Current phase, Completed Work with final eval count + authoring-gotcha notes, mark 2i.3 ✅). Commit: "Phase 2i.3 — arrivesWhen content + eval for round-3/4 forensic evidence." Push.
```

**Full implementation reference** (do not paste — read from doc):

```
/goal Phase 2i.3 — Author arrivesWhen conditions on every round-3/4 forensic evidence.

Depends on: 2i.2 merged.

Scope:
For every evidence currently gated by entering r3-* or r4-* chapters,
author a natural-language arrivesWhen condition the AI host will
evaluate. Plus eval cases proving each condition fires when expected
and doesn't fire when not.

Affected evidence (check current case.json against r3-* and r4-*
chapters for the actual list):
- anonymous-letter-2 — already wired in 2i.1 as the proof-of-concept;
  port its trigger into the new arrivesWhen field on Evidence.
- old-newspaper-clipping, theft-fir-inventory, wall-mount-photo,
  office-rifle-photo, land-registry, bisht-family-history,
  anya-bus-ticket — round-3 evidence; arrives when Thakur-related
  questioning is sustained or when the second letter has landed.
- bisht-devraj-call, devraj-jeep-cctv, lathi-postmortem,
  grey-shawl-fresh, anya-payments, vikram-research-notes — round-4
  forensic; arrives when the case is mid-late game (most suspects
  opened up, Thakur thread surfaced).

Authoring pattern (mirrors how unlockBehavior.cooperationCue works for
suspects):
- Describe the conversational/state preconditions for the AI host to
  judge 'yes, drop this now.' Use plain English; the host LLM reads it
  literally. Don't write engine notes.
- Include 'do NOT fire if...' clauses for false positives (premature
  drops, wrong-thread drops).

Eval:
- cases/mussoorie/evals/host.eval.json (new) — per-evidence golden
  test cases. Each case carries a fake session-state snapshot (which
  suspects' cues have fired, what's been asked across transcripts) and
  expected: 'drop-now' | 'wait'. Run via the npm run eval:host harness
  built in 2i.1.

What NOT to do:
- Don't add engine logic. This is pure authoring + eval.
- Don't change unlockBehavior on existing suspect secrets/BPs.
- Don't remove the legacy unlockedAtChapter values — leave them as a
  forgiving fallback for the rare case where the AI host never triggers
  but the host manually opens accusation.

Success criteria:
- npm run eval:host passes all authored cases.
- npm run eval:adjudicator -- all still passes.
- npm run validate-cases clean.
- A live REPL run can walk through Naina -> Rhea -> Kabir, then push
  Thakur-themed questions to any other suspect, and the second letter
  + Bisht family history + land registry land in roughly the right
  order without any human action.

Tests required (hard gate — do not commit if any fail):

This sub-phase is **pure authoring** — no engine code. But the authoring is load-bearing and each `arrivesWhen` condition needs eval cases to prove it fires when expected and doesn't fire when not. The eval is the contract.

Extend `cases/mussoorie/evals/host.eval.json` with per-evidence test cases. For each authored `arrivesWhen` condition, add at minimum:
- One positive case (the conditions described actually hold; expected `met: true`).
- One too-early case (related-but-insufficient state; expected `met: false`).
- One wrong-thread case (some prerequisites satisfied but not the load-bearing one; expected `met: false`).
- One already-fired case (evidence is in unlocked_evidence already; expected `met: false`).

Affected evidence (verify against the case.json after 2i.2's schema landing):
- `anonymous-letter-2` (port from 2i.1's hardcoded trigger).
- `old-newspaper-clipping`, `theft-fir-inventory`, `wall-mount-photo`, `office-rifle-photo`, `land-registry`, `bisht-family-history`, `anya-bus-ticket` (round-3 evidence).
- `bisht-devraj-call`, `devraj-jeep-cctv`, `lathi-postmortem`, `grey-shawl-fresh`, `anya-payments`, `vikram-research-notes` (round-4 forensic).

Authoring gotchas (re-read `cases/mussoorie/evals/README.md`):
- `arrivesWhen` is read literally by the host LLM. Never write engine notes ("cascade", "fires after", "see X").
- Describe state and player behavior, not engine behavior.
- Include explicit "do NOT fire if..." clauses for false positives. The AI host should err toward conservative timing — better to under-drop than blow the case.

Run before commit (all must pass cleanly):
```bash
npm run validate-cases
npm test                            # all existing
npm run eval:adjudicator -- all     # still 104/104
npm run eval:host                   # ALL authored cases — total count likely ~60+
npm run lint
npm run build
```

Manual smoke (document in commit body):
- Run a REPL session through the canonical Naina → Rhea → Kabir chain. Drop in 2-3 Thakur-themed questions across those transcripts. Confirm the second letter fires, then the Thakur-pivot evidence (newspaper clipping, family history, land registry) lands in the right order — not all at once, not too early.
- Run a second REPL session where the players never bring up the Thakurs. Confirm the round-3 evidence does NOT auto-fire just because the cooperation cues fired.

Handoff update (do this before committing):
- Update the **Current phase** banner to note 2i.3 is shipped.
- Add a 2i.3 entry to **Completed Work** listing: how many evidence pieces now have `arrivesWhen`, the new eval file path (`cases/mussoorie/evals/host.eval.json`), and the total eval count (`npm run eval:host` final number).
- In **Next Recommended Phase**, mark 2i.3 ✅ shipped.
- If 2i.5 is also shipped by the time of your commit, mark both ✅ and note 2i.6 is next.
- Flag any forensic evidence that needed *especially* narrow `arrivesWhen` text — same pattern as the 2g.2 Bisht caveat. Document it under a "Phase 2i.3 authoring notes" sub-section in the Completed Work entry so future authoring (Phase 2k+ new cases) doesn't relearn the lesson.

Commit message: 'Phase 2i.3 — arrivesWhen content + eval for round-3/4 forensic evidence.'
```

#### 2i.4 — Round-robin interviewer

**Paste this into `/goal`** (fits the 4000-char cap):

```text
/goal Phase 2i.4 — Round-robin interviewer rotation (default 3 questions per detective).

Depends on: nothing. Can land in parallel with 2i.1/2i.2/2i.3. Repo: /Users/shashankmendiratta/shire/PartyGame. Work in a fresh worktree. Read the full brief in docs/CLAUDE_HANDOFF.md under "#### 2i.4 — Round-robin interviewer".

Scope (one-line): add optional case.rules.questionsPerDetective (default 3) to case.schema.json; regenerate types.ts. After every N askSuspect calls from the current interviewer, auto-rotate current_interviewer_player_id to the next non-observer seat. Existing manual Take Control / Pass Control buttons stay as override. Phone UI shows "Next: Detective X" label.

Hard gate before commit: extract the pure rotation arithmetic into a unit-testable helper (e.g., pickNextInterviewer(players, currentId, stepIndex)). Add tests/round-robin.test.mjs with the cases listed in the full brief: 6 detectives wrap-around, observers excluded, 1-detective no-op, custom step size, 0-detectives edge. Run npm run validate-cases && npm test && npm run eval:adjudicator -- all && npm run eval:host && npm run lint && npm run build.

After tests pass: update CLAUDE_HANDOFF.md per brief (Current phase, Completed Work entry, mark 2i.4 ✅). 2i.4 is independent; do not touch other sub-phases' statuses. Commit: "Phase 2i.4 — Round-robin interviewer rotation (default 3 questions)." Push.
```

**Full implementation reference** (do not paste — read from doc):

```
/goal Phase 2i.4 — Round-robin interviewer rotation.

Depends on: nothing. Can land in parallel with 2i.1/2i.2/2i.3.

Scope:
Add automatic mic rotation: after every N questions from the current
interviewer (default 3, configurable per case via
case.rules.questionsPerDetective), the engine auto-rotates
current_interviewer_player_id to the next detective seat. The phone
UI shows 'Your turn next' / 'Detective X's turn'. The existing manual
Take Control / Pass Control buttons stay as override.

Files to modify:
- src/engine/schema/case.schema.json — case gains optional
  `rules.questionsPerDetective` (default 3). Regenerate types.ts.
- src/lib/session-store.ts — askSuspect, after persisting the user
  message, checks if the current interviewer has hit the cap; if so,
  rotates current_interviewer_player_id to the next non-observer seat
  in seat-number order. Tracks per-(session, suspect) question count
  via a small denormalized counter or computed from messages.
- src/components/PlayerLobbyView.tsx InterviewMode — show 'Next:
  Detective X' label when the rotation is about to fire. Same Take
  Control / Pass Control buttons remain.
- src/components/HostLobbyView.tsx InterviewScene — surface 'Mic
  rotates every N questions' label near the current-interviewer badge.

What NOT to do:
- Don't change the underlying interviewer-claim mechanics. Auto-rotate
  is just another reason current_interviewer_player_id changes.
- Don't touch the AI host service.

Success criteria:
- npm run lint / test / build clean.
- Manual: with 3 detectives, after 3 questions from detective A, the
  mic auto-passes to detective B. Detective A's phone shows 'Detective
  B is now the interviewer.' Detective B's phone shows the Ask suspect
  button. Manual pass / claim still works.

Tests required (hard gate — do not commit if any fail):

Create the following before commit:
- `tests/round-robin.test.mjs` — node:test unit tests for the pure rotation arithmetic. Extract the seat-picking logic into a pure helper (e.g., `pickNextInterviewer(players, currentInterviewerId, rotationStepIndex)`) so it's unit-testable without the DB. Required cases:
  - 6 detectives, no observers: after 3 questions, rotates from seat 1 to seat 2; after 6, to seat 3; wraps from seat 6 back to seat 1.
  - 3 detectives + 1 observer: observer is never selected.
  - 1 detective: returns the same detective (no rotation needed; no error).
  - 0 detectives somehow: returns null and the engine falls back to "no interviewer."
  - Custom `questionsPerDetective: 1`: rotates every single question.
- Schema-pin test: confirm `case.rules.questionsPerDetective` is optional with default 3 (in `tests/mussoorie.test.mjs` or a new schema test).

Run before commit (all must pass cleanly):
```bash
npm run validate-cases
npm test                            # 72/72 + your new round-robin tests
npm run eval:adjudicator -- all     # 104/104, unchanged
npm run eval:host                   # unchanged from 2i.1/2i.3
npm run lint
npm run build
```

Manual smoke (document in commit body):
- 3 detectives joined. Detective A asks 3 questions. Confirm mic auto-passes to Detective B. Detective B's phone shows the Ask suspect button; A's doesn't.
- Detective B manually passes control back to A via the existing "Pass control" button (override). Confirm rotation counter resets correctly so A gets another 3-question stretch before auto-rotating to B.
- Manually claim control as Detective C while A is mid-rotation. Confirm rotation counter resets and C gets a fresh 3-question turn.
- 1 detective in the session: confirm rotation is a no-op (they stay interviewer forever).

Handoff update (do this before committing):
- Update the **Current phase** banner to note 2i.4 is shipped.
- Add a 2i.4 entry to **Completed Work**: schema extension (`case.rules.questionsPerDetective`), files touched, default value (3), what the UI shows ("Next: Detective X" label), and confirmation that manual claim/pass still works as override.
- In **Next Recommended Phase**, mark 2i.4 ✅ shipped. 2i.4 is independent of 2i.1/2i.2/2i.3/2i.5 — your commit shouldn't change any of their statuses.

Commit message: 'Phase 2i.4 — Round-robin interviewer rotation (default 3 questions).'
```

#### 2i.5 — TV host strip + case status panel

**Paste this into `/goal`** (fits the 4000-char cap):

```text
/goal Phase 2i.5 — Strip story controls from the TV host strip; add a Case Status panel.

Depends on: 2i.2 must be merged (needs the phase machine to drive what shows). Repo: /Users/shashankmendiratta/shire/PartyGame. Work in a fresh worktree. Read the full brief in docs/CLAUDE_HANDOFF.md under "#### 2i.5 — TV host strip + case status panel".

Scope (one-line): in src/components/HostLobbyView.tsx replace the existing host control strip with coordination-only buttons (Start game, Pause, Open accusation, End session — remove Previous/Next/Drop-evidence). Add a CaseStatusPanel that polls /api/sessions/[id]/events for recent interview.host_judgment events and shows the AI host's most recent reasoning ("Forensic update incoming", "Three suspects opened up", etc.). New route: GET /api/sessions/[sessionId]/events that returns filtered recent events.

Hard gate before commit: if you extracted any pure formatting helper from CaseStatusPanel, add tests/case-status.test.mjs. If you added the events route, add tests/events-route.test.mjs covering empty session / type filter / invalid session / max-20 results. Manual smoke is the primary verification for UI changes (no React component framework in repo); paste the checklist results in the commit body — see the brief.

Run npm run validate-cases && npm test && npm run eval:adjudicator -- all && npm run eval:host && npm run lint && npm run build before commit.

After tests pass: update CLAUDE_HANDOFF.md per brief (Current phase, Completed Work entry, mark 2i.5 ✅). Commit: "Phase 2i.5 — TV host strip refactor + Case Status panel." Push.
```

**Full implementation reference** (do not paste — read from doc):

```
/goal Phase 2i.5 — Strip story controls from the TV host strip; add case status panel.

Depends on: 2i.2 merged (needs the phase machine to drive what shows).

Scope:
The TV's existing host strip has Start game / Previous / Next / Pause.
Replace with coordination-only controls: Start game, Pause, Open
accusation, End session. Remove Previous/Next. The Open Accusation
button is the explicit social-fabric handoff between Interrogation and
Accusation phases (the AI host can also trigger this automatically
when it judges the case is solvable).

Add a 'Case status' panel near the host strip showing the AI host's
most recent reasoning. Pulled from a new server-side event stream
(interview.host_judgment events written by the AI host service in
2i.1/2i.2). Examples:
  - 'Forensic update incoming — bank records.'
  - 'Three suspects have opened up.'
  - 'Thakur thread surfacing — second letter en route.'

Files to modify:
- src/components/HostLobbyView.tsx — replace top control strip;
  add CaseStatusPanel component that polls /api/sessions/[id]/events
  for recent interview.host_judgment events.
- src/app/api/sessions/[sessionId]/events/route.ts (probably new) —
  GET returns the most recent N events of certain types, filtered.

What NOT to do:
- Don't remove the existing host-fallback banner inside InterviewScene.
- Don't redesign the round-2 picker (already exists and works inside
  Interrogation phase).
- Don't touch phone UI.

Success criteria:
- TV no longer shows Previous/Next buttons.
- Case status line updates within ~2.5s of the AI host making a
  judgment call (limited by the lobby poll until Phase 2h ships
  Realtime).
- Open accusation button works; AI host can also trigger phase
  transition automatically when judging the case is solvable.

Tests required (hard gate — do not commit if any fail):

This sub-phase is largely UI work. The codebase currently has no React component-test framework (no Vitest / RTL / Playwright). Don't introduce one as part of this sub-phase — that's its own goal. Focus tests on what can be unit-tested without a UI runtime.

Create the following before commit:
- If you extract any pure helper from the new components (e.g., a function that formats the AI host's reasoning event into a status-line string, or filters event types for the CaseStatusPanel), add `tests/case-status.test.mjs` covering edge cases (empty events list, malformed payload, ordering by created_at).
- If you ship a new API route (`GET /api/sessions/[id]/events`), add `tests/events-route.test.mjs` that imports the route handler and confirms:
  - Returns empty array for a session with no events.
  - Filters by `type` query param if present.
  - Returns 401/403 equivalent if session ID is invalid.
  - Limits results to a sensible max (e.g., last 20 events).

Run before commit (all must pass cleanly):
```bash
npm run validate-cases
npm test                            # all existing + any new helper tests
npm run eval:adjudicator -- all     # unchanged
npm run eval:host                   # unchanged
npm run lint
npm run build                       # confirms the new route compiles + appears in route map
```

Manual smoke (THIS IS THE PRIMARY VERIFICATION for UI changes — document each result in the commit body):
- TV displays Start game / Pause / Open accusation / End session only. Previous and Next are gone.
- During Interrogation phase, the CaseStatusPanel shows the AI host's most recent reasoning (e.g., "Forensic update incoming" after the AI host fires `anonymous-letter-2`). Update lag is ≤ 2.5s (lobby poll interval).
- Open Accusation manually moves the session to `accusation` phase. The host strip's other buttons remain available.
- End session correctly transitions out of in-progress and stops further LLM calls.
- The case-status panel does NOT show host-internal debug spam (e.g., adjudicator per-cue verdicts). Only `interview.host_judgment` events.

Handoff update (do this before committing):
- Update the **Current phase** banner to note 2i.5 is shipped.
- Add a 2i.5 entry to **Completed Work**: which TV controls were removed (Previous, Next, Drop evidence) vs which remain (Start game, Pause, Open accusation, End session), the new CaseStatusPanel component, and any new route you added (e.g., `GET /api/sessions/[id]/events`).
- In **Next Recommended Phase**, mark 2i.5 ✅ shipped.
- If 2i.3 is also shipped by your commit time, mark both ✅ — 2i.6 is the next remaining task.

Commit message: 'Phase 2i.5 — TV host strip refactor + Case Status panel.'
```

#### 2i.6 — Verify + eval + handoff doc

**Paste this into `/goal`** (fits the 4000-char cap):

```text
/goal Phase 2i.6 — Phase 2i wrap: full verify, design.md rewrite, handoff cleanup. Promote Phase 2h to Next Recommended.

Depends on: 2i.1, 2i.2, 2i.3, 2i.4, 2i.5 all merged. Repo: /Users/shashankmendiratta/shire/PartyGame. Work in a fresh worktree on tip of main. Read the full brief in docs/CLAUDE_HANDOFF.md under "#### 2i.6 — Verify + eval + handoff doc".

Scope (one-line): no new code. End-to-end verification that the new AI-host + free-interrogation model plays cleanly. Then rewrite cases/mussoorie/design.md sections 5/6/9b/10 to reflect three phases (Briefing → Interrogation → Accusation → Reveal) instead of four rounds, keeping all narrative content. Then promote Phase 2h (Realtime + token streaming) into the Next Recommended Phase slot in CLAUDE_HANDOFF.md; consolidate 2i.1-2i.5 into a single roll-up Completed Work entry; delete the six sub-phase /goal briefs (they're done).

Hard gate before commit: full suite green simultaneously — npm run validate-cases && npm test && npm run eval:adjudicator -- all && npm run eval:host && npm run lint && npm run build. Plus an end-to-end manual walkthrough (briefing → interrogation → suspect picks → Thakur thread → automatic forensic drops → accusation → reveal) with NO Next/Previous click on the TV. If any step regresses behavior from earlier sub-phases, fix it here — the buck stops with 2i.6.

Commit: "Phase 2i.6 — Wrap: design.md + handoff updated; Phase 2i complete." Push to main.
```

**Full implementation reference** (do not paste — read from doc):

```
/goal Phase 2i.6 — Phase 2i wrap: full verify, design.md update, handoff cleanup.

Depends on: 2i.1, 2i.2, 2i.3, 2i.4, 2i.5 all merged.

Scope:
End-to-end verification that the new AI-host + free-interrogation model
plays cleanly. Update design.md to reflect the new phase model (the
existing '9b. Round 2 scenario playbook' becomes obsolete or merges
into a broader 'Interrogation scenario playbook'). Update
CLAUDE_HANDOFF.md to mark Phase 2i complete and point next at 2h.

Files to modify:
- cases/mussoorie/design.md — rewrite sections 5/6/9b/10 to reflect
  three phases (Briefing -> Interrogation -> Accusation -> Reveal)
  instead of four rounds. Keep the narrative content; just update the
  pacing language.
- docs/CLAUDE_HANDOFF.md — move Phase 2i to Completed Work. Update
  Current phase line. Set Next Recommended Phase to 2h (Realtime).
- Test pin updates if the evidence count per round changed.

What NOT to do:
- Don't author new evidence. (2i.3 owns content; this phase is wrap-up.)
- Don't touch any engine code. (Verify; don't rebuild.)

Success criteria:
- Full suite green: validate-cases / test / lint / build / eval:adjudicator -- all / eval:host.
- A walkthrough of the case from briefing through reveal works without
  any Next/Previous click on the TV. Players pick suspects, AI host
  drops forensic evidence at story-relevant moments, accusation opens
  when the case is ready.
- CLAUDE_HANDOFF.md cleanly hands off to whoever picks up Phase 2h.

Tests required (hard gate — do not commit if any fail):

This sub-phase is the wrap. The bar is that **the full suite passes cleanly with no regressions** after all five preceding sub-phases land. No new test code is required, but **all** existing suites must be green simultaneously — confirm by re-running each one fresh after pulling main.

Run before commit (all must pass cleanly):
```bash
npm run validate-cases              # 0 errors
npm test                            # full count: 72 + tests added by 2i.1/2i.2/2i.4 + any from 2i.5
npm run eval:adjudicator -- all     # 104/104 (Bisht 'rifle/challenges' flake okay if stable from before)
npm run eval:host                   # all 2i.1 + 2i.3 cases pass
npm run lint
npm run build                       # all routes including any new ones from 2i.5
```

Manual smoke (end-to-end run; document each step's outcome in commit body):
- Open a session. Walk briefing → interrogation cleanly (phase auto-advances per 2i.2).
- Interrogate Naina until her cooperation cue fires. Confirm system message lands. Confirm `naina-corporate-memo` and `vikram-naina-whatsapp` arrive in locker.
- Mic auto-rotates after 3 questions (2i.4).
- Switch to Rhea via picker. Present the memo. Her cue fires.
- Switch to Kabir. Present the chai-shop receipt. His plagiarism reveal fires.
- Now mention "Thakur" in any active transcript. Confirm `anonymous-letter-2` lands automatically (2i.1 + 2i.3).
- Continue Thakur-themed questioning. Confirm round-3 evidence (`bisht-family-history`, `land-registry`, etc.) lands at story-relevant moments — not all at once, not too early.
- Open accusation manually (or wait for AI host to suggest it). Confirm accusation UI appears.
- Vote, reveal, see the closing question.
- Confirm the TV's Case Status panel reflected each AI-host action in near-real-time.

If ANY of those steps regresses behavior shipped in earlier sub-phases, fix it in 2i.6 (this is the wrap; the buck stops here).

Handoff update (this is the wrap; do all of the following before committing):
- Update the **Current phase** banner to: "Phase 2i complete. Next: Phase 2h (Realtime infrastructure + token streaming)."
- In the **Completed Work** section, add a single Phase 2i roll-up entry that consolidates 2i.1–2i.5 (the individual sub-phase entries added by previous commits can stay or you can collapse them into the roll-up — your call, but pick one).
- **Delete or archive the six sub-phase /goal briefs** from the **Next Recommended Phase** section. Replace with the existing Phase 2h brief (currently in "Later Phases") — promote it to Next Recommended Phase.
- Move the old "Phase 2h - Realtime Infrastructure + Token Streaming" section under "Later Phases" up to "Next Recommended Phase".
- Update the **Pickup TL;DR**: point step 2 at Phase 2h instead of Phase 2i; update step 4 to summarize what Phase 2i shipped (AI host, free-form interrogation, round-robin); update the verification suite expectations if eval counts changed.
- Confirm the `Repository Map` mentions any new files (host-judgment.ts, host.eval.json, the 0005 migration).

Commit message: 'Phase 2i.6 — Wrap: design.md + handoff updated; Phase 2i complete.'
```

### Open design questions for any sub-phase

A few details I (the previous session) left open and the next agent should decide based on their judgment:

- **Adjudicator vs host LLM model.** Today the adjudicator uses the same model as roleplay (gpt-4o-mini default). The host-judgment service is the natural place to use a cheaper structured-output model. Author 2i.1 should set this up with case.llm.hostJudgmentModelOverride for future flexibility.
- **How aggressively the AI host drops evidence.** Better to be conservative on day one (under-drop) than over-eager (drop the second letter at minute 4). 2i.3's eval cases should bias the cue language toward 'wait'.
- **What happens if the AI host service fails (LLM down, JSON parse error).** Should fall back to NOT firing the unlock — the case is still playable without forensic auto-drops; the human host can manually trigger via the (preserved) Open Accusation button.

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

