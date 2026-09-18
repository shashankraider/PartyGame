# PartyGame / Mystery Engine assessment

> Historical assessment/verification record. The current state, subsequent fixes and rollout are documented in [September 18 release](RELEASE_2026-09-18.md) and [Architecture](ARCHITECTURE.md). Statements below about missing deployment or pending P1 migrations describe the original review date.

Assessed September 17, 2026, against working tree at `fb5b7d1`. Existing uncommitted work was preserved. This records the baseline before remediation. Subsequent P1 changes and their verification are tracked in [P1 delivery](P1_DELIVERY.md); the findings and line references below describe the original assessed revision.

**Overall judgment: a substantial playable prototype with a strong content foundation, but not yet a complete, dependable game-night product or a public-release candidate.** The next investment should be finishing and hardening one full multiplayer playthrough. More content and visual polish will have less value until that path is reliable.

The repository is considerably further along than its README says. Conversely, several capabilities described as complete in the handoff are incomplete at the boundaries between UI, server state, and database access.

**Scope and verification**

Reviewed the Next.js pages and API routes, session store, interview/adjudication/host pipeline, realtime hooks, migrations and access policies, case schema and validator, tests and evaluation harnesses, Mussoorie data, printable synchronization, and project documentation. Inspected the production-built case entry and solo preview in a browser. Ran the real OpenRouter evaluation suites once each.

| Check | Observed result |
| --- | --- |
| Production build, including TypeScript | Passed; Next.js 16.2.6 |
| Unit/contract tests | 129 passed, 1 skipped, 0 failed; 130 total |
| Case validation | Mussoorie passed with no issues |
| Printable synchronization | All 30 standalone exhibits current |
| Source-focused ESLint | Passed for `src`, `scripts`, `tests`, and root code configuration |
| Repository-wide `npm run lint` | Failed: 569 errors, 6,982 warnings, caused by scanning the nested `.claude/worktrees/briefing-beats` tree and its generated files |
| Live suspect adjudicator evaluations | 103/104 passed |
| Live host evaluations | 59/60 passed |
| Production dependency audit | 5 affected package entries: 1 critical, 3 high, 1 moderate; registry reports fixes available |
| Isolated API/state probes | Reproduced unauthenticated mutations, invalid lifecycle transitions, and unauthenticated token minting |
| Validator negative probe | A nonexistent `unlockBehavior.evidenceIds` reference incorrectly passed validation |

The configured database points to local Supabase, which was not listening during this assessment. No real session/database mutations were performed. The API probes used an in-memory mock of Supabase HTTP responses and a test-only WebSocket shim; they establish application behavior, not live database/RLS behavior. Live multi-device play, migration application, disconnect recovery, production hosting, accessibility, and sustained-session load remain unverified. Evaluation results are one sample of nondeterministic model behavior.

**What is already strong**

- A worthwhile product structure: shared TV presentation, phone controllers, cooperative investigation, and authored cases separate from application code.
- A substantial first case: 6 suspects, 30 evidence items, 19 chapters, 4 rounds, 8 locations, and 2 authored endgame branches. Portraits and location art are present, and all standalone evidence printables match their source.
- Schema-derived case types, JSONC authoring, cross-reference and cycle checks, template scaffolding, and narrative pin tests provide a useful authoring foundation.
- Suspect dialogue, unlock adjudication, and host pacing are separate concepts. Evidence gates can short-circuit model calls, and the authored evaluation fixtures cover positive, negative, and near-miss questions.
- Persistence, event records, database uniqueness constraints, realtime subscriptions, and polling fallbacks are implemented. These are substantial foundations, even though recovery and authorization need more work.
- Join/rejoin handles unavailable browser storage and ordinary network failures thoughtfully. Player interfaces include evidence browsing, transcripts, input assistance, and microphone handoff.

**Actual feature maturity**

| Area | Assessment |
| --- | --- |
| Case authoring and Mussoorie content | Strongest area; validation gaps still affect new authoring |
| Case entry and lobby | Implemented; runtime setup, permissions, and simultaneous joins need work |
| Briefing and evidence browsing | Implemented |
| Live suspect interviews | Substantial implementation; concurrency, failure recovery, and story boundaries incomplete |
| AI host and evidence pacing | Implemented with strong fixture coverage; observed false negatives and incomplete rescue paths |
| Voting | Implemented, but normal UI does not continue into reveal |
| Reveal and branching ending | Reveal renderer exists; authored endgame branches are not executed |
| Solo play | Static preview only |
| Phone hack | Placeholder; disabled player button |
| Pause/resume | Basic state changes exist; lifecycle enforcement and phone behavior incomplete |
| Expiry/retention | Timestamp and deletion helper exist; enforcement and scheduling are not wired in the repository |
| Public deployment | Blocked by access control, dependency findings, and runtime configuration |

**Priority findings**

Priorities below describe remediation order: P1 blocks dependable play or public release; P2 addresses reliability, maintainability, or the reusable-engine promise. Security severity from the dependency registry is reported separately.

**1. P1 — Host and player identity are not authenticated at the server boundary.**

Session endpoints trust session IDs and body-supplied player IDs. The start endpoint takes no host identity. Scene controls can pause, advance, or end a session without authenticating the requester. Voting verifies that the supplied player belongs to the session, but not that the caller owns that player. Interview authorization similarly compares a supplied ID with the current interviewer ID. The realtime token endpoint verifies only that the session exists.

The lobby response includes full player rows, including `device_id`. Joining trusts a caller-supplied device ID. That identifier is therefore neither secret nor proof of ownership. `is_host` exists in the database model but is not used to authorize these routes.

Isolated probes returned HTTP 200 for starting a finished/expired session, voting as another player in a finished session, and minting a realtime token without credentials. Knowing a session ID is enough to reach these behaviors; a participant naturally knows it.

Use server-issued host/player credentials bound to the session, authorize every route, remove private device identifiers from public responses, and gate realtime token issuance on membership and expiry. Accounts are not required to implement this.

Evidence: [start route](/Users/shashankmendiratta/shire/PartyGame/src/app/api/sessions/[sessionId]/start/route.ts:12), [token route](/Users/shashankmendiratta/shire/PartyGame/src/app/api/sessions/[sessionId]/realtime-token/route.ts:35), [session reads and joins](/Users/shashankmendiratta/shire/PartyGame/src/lib/session-store.ts:248), [interview check](/Users/shashankmendiratta/shire/PartyGame/src/lib/session-store.ts:1321).

RLS does not compensate for this: these server calls use the service role, which bypasses RLS. That behavior is documented in [Supabase's RLS reference](https://supabase.com/docs/guides/database/postgres/row-level-security).

**2. P1 — Every player receives the private case, including the solution.**

The player server page passes the complete `caseData` object into a client component. That includes solution data, private timelines, secrets, future evidence, and endgame scripts. The host page does the same. Hiding sections in React does not keep these serialized props out of the browser. Printable routes also serve later-round exhibits without checking session unlock state.

Create an explicit public case/session view containing only currently visible material; keep narrative truth and future unlock criteria on the server. Return reveal material only when the session reaches the reveal.

Evidence: [player page](/Users/shashankmendiratta/shire/PartyGame/src/app/session/[sessionId]/player/[playerId]/page.tsx:40), [host page](/Users/shashankmendiratta/shire/PartyGame/src/app/session/[sessionId]/host/page.tsx:52), [printable route](/Users/shashankmendiratta/shire/PartyGame/src/app/api/cases/[caseId]/printables/[file]/route.ts:12).

**3. P1 — The normal voting flow stops before the ending.**

The host's Continue button is rendered only during briefing. The accusation scene renders the tally without a reveal action. Casting the final vote does not transition the phase. AI host evaluation happens only after an interview turn, so it cannot observe completion of voting after the app leaves interviews. End session changes the status to finished without revealing the solution.

The backend can advance accusation to reveal, but no normal UI action invokes that path. In addition, `caseData.endgame.paths` is authored and validated but never executed by the gameplay UI; the reveal directly renders `solution.revealNarration`.

Add a deterministic vote-completion/host-reveal action, execute the selected confrontation branch, render the reveal, and finish the session. Make this the first full browser journey test.

Evidence: [host navigation](/Users/shashankmendiratta/shire/PartyGame/src/components/HostLobbyView.tsx:144), [accusation scene](/Users/shashankmendiratta/shire/PartyGame/src/components/HostLobbyView.tsx:1020), [vote persistence](/Users/shashankmendiratta/shire/PartyGame/src/lib/session-store.ts:777), [ending renderer](/Users/shashankmendiratta/shire/PartyGame/src/components/HostLobbyView.tsx:1082).

**4. P1 — Pause, finish, and expiry are not enforced consistently.**

`startSession` resets any existing session to briefing. `setSessionScene` sets status back to `in_progress` for any non-lobby scene, including when previously paused or finished. Votes and interviewer changes lack lifecycle guards. The phone interface continues rendering ordinary controls without a pause/finished overlay. An in-flight interview can continue writing after a pause, including a host transition that resumes the session implicitly.

An isolated paused-session suspect switch returned 200 and changed status to `in_progress`. No application code checks `expires_at`; expiry is initially seven days from creation and is not extended with activity. A deletion helper exists, but there is no repository-defined schedule invoking it.

Centralize lifecycle validation, use conditional database updates to reject stale actions, coordinate in-flight turns with pause/end, and enforce expiry on reads, joins, mutations, and token issuance.

Evidence: [start](/Users/shashankmendiratta/shire/PartyGame/src/lib/session-store.ts:548), [scene update](/Users/shashankmendiratta/shire/PartyGame/src/lib/session-store.ts:670), [player rendering](/Users/shashankmendiratta/shire/PartyGame/src/components/PlayerLobbyView.tsx:79), [expiry schema](/Users/shashankmendiratta/shire/PartyGame/supabase/migrations/0001_initial.sql:56).

**5. P1 — The current local runtime fails before database access.**

The shell runs Node 20.19.5. Constructing the installed Supabase client throws “Node.js 20 detected without native WebSocket support.” The package has no Node engine declaration or version pin. Static pages and the production build pass because they do not exercise this client construction path.

Pin a supported Node runtime consistently for local development, CI, and hosting, then verify a real session creation. Supabase documents [dropping Node 20 support](https://supabase.com/changelog/45715-deprecation-notice-dropping-support-for-node-js-20).

Evidence: [server client construction](/Users/shashankmendiratta/shire/PartyGame/src/lib/supabase.ts:161), [package configuration](/Users/shashankmendiratta/shire/PartyGame/package.json:1).

**6. P1 before public exposure — Dependencies have current security findings.**

`npm audit --omit=dev` reported affected entries for Next.js (critical), sharp (high), nanoid (high), PostCSS (high), and baseline-browser-mapping (moderate). These are package-level advisory matches, not five demonstrated exploits against this app.

Installed Next.js 16.2.6 falls within the affected range of the [AVIF image optimization advisory](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4), which names 16.3.3 as a patched 16.x release. Actual reachability depends on image optimization and attacker-controlled input; this review did not attempt exploitation. Upgrade to patched compatible dependencies and rerun build, audit, and gameplay verification.

**7. P1 — Concurrent turns and failures can leave inconsistent state.**

Seats and message sequences are allocated by reading current rows and then inserting. Database uniqueness prevents duplicate values but there is no conflict retry for joins or turn allocation. Evidence arrays and unlock counters are read/modify/write operations without atomic coordination.

Microphone rotation occurs immediately after saving the question, before the answer and unlock evaluation finish. The next phone can ask while the previous turn is still running. There is no server-side turn lock or idempotency key. If streaming and its fallback both fail, the preinserted answer can remain `is_streaming=true`. Client submit handlers in the host/interview/vote flows lack `try/finally`, so a rejected network request can leave controls busy indefinitely.

Serialize turns per session, allocate sequences/seats atomically or retry conflicts, make unlock application atomic, and give turns explicit pending/completed/failed states. Move microphone handoff to a safe completion boundary and make retries idempotent.

Evidence: [seat allocation](/Users/shashankmendiratta/shire/PartyGame/src/lib/session-store.ts:517), [message sequence](/Users/shashankmendiratta/shire/PartyGame/src/lib/session-store.ts:1193), [early rotation](/Users/shashankmendiratta/shire/PartyGame/src/lib/session-store.ts:1419), [stream fallback](/Users/shashankmendiratta/shire/PartyGame/src/lib/session-store.ts:1494), [phone submit](/Users/shashankmendiratta/shire/PartyGame/src/components/PlayerLobbyView.tsx:752).

**8. P1/P2 — AI pacing has real rescue and boundary gaps.**

Observed evaluation failures were the Bisht rifle “challenges collector explanation” case and the positive `bisht-devraj-call` host evidence case. Both match known handoff notes; they remain observable failures rather than resolved exceptions.

More significantly, adjudicator `confidence` is defined as certainty in its verdict, but stored as `max_adjacency`, which is used as closeness to an unlock. A confidently negative result can permanently suppress the “players are stuck” fallback. The live evaluation produced negative verdicts with confidence 1. Host fallback additionally supports evidence subjects only, excluding secrets and breaking points.

Pure pressure conditions without a cue return `met=false`, while firing requires `met=true`; those schema-supported conditions can never fire. The current Mussoorie case does not use cue-less pressure, so this is an engine extensibility defect rather than a current-case blocker.

Roleplay includes private facts in a “never reveal” instruction, streams output before any semantic validation, and can visibly replace an already-streamed cover story with a revelation. No implemented response validator enforces the documented story-safety/family-tone boundary. Previously unlocked revelations are explicitly injected only on the unlocking turn; later turns depend on transcript history to retain them. These are risks requiring adversarial and multi-turn evaluations; this assessment did not demonstrate an actual spoiler leak through the model.

Separate verdict confidence from player proximity, provide a deterministic rescue path for every required discovery, include established facts in each roleplay context, and validate the final visible answer where story boundaries require it.

Evidence: [fallback eligibility](/Users/shashankmendiratta/shire/PartyGame/src/lib/interview-unlocks.ts:109), [confidence and firing](/Users/shashankmendiratta/shire/PartyGame/src/lib/interview-unlocks.ts:594), [roleplay prompt](/Users/shashankmendiratta/shire/PartyGame/src/lib/session-store.ts:982), [visible rewrite](/Users/shashankmendiratta/shire/PartyGame/src/lib/session-store.ts:1593).

**9. P2 — Cost, latency, and reconnect behavior are not bounded.**

Each question can involve a roleplay call, multiple condition judges, another roleplay pass, and a host call containing the room's transcripts. Histories grow without a token budget or summarization; provider calls have no explicit timeout or output-token cap. No per-session usage/cost accounting or request rate limiting is implemented. The stated sub-$1 session goal is therefore unverified.

Streaming writes the growing answer into Postgres repeatedly. Every message update causes every subscribed device to fetch the full suspect transcript again. This amplifies both database writes and HTTP reads; even 50 updates with eight viewers implies roughly 400 transcript fetches for an answer, before other refreshes. That is an illustration of the code path, not a measured benchmark.

Realtime hooks load before subscribing and do not reconcile on successful subscription/reconnection, leaving a window for missed updates. Failed token refresh stops rescheduling; fallback handling does not cover every close/reconnect state. Add snapshot reconciliation, bounded retries, coalesced updates, and measurements under eight-device play before claiming latency or resilience targets.

Evidence: [stream writer](/Users/shashankmendiratta/shire/PartyGame/src/lib/session-store.ts:1101), [host transcript collection](/Users/shashankmendiratta/shire/PartyGame/src/lib/session-store.ts:1793), [transcript subscriptions](/Users/shashankmendiratta/shire/PartyGame/src/lib/session-realtime.ts:169), [token refresh](/Users/shashankmendiratta/shire/PartyGame/src/lib/supabase-client.ts:96).

**10. P2 — The reusable case contract exceeds what the runtime implements.**

`loadCase` parses and casts without invoking the schema/cross-reference validator or checking JSONC parse errors. The validator does not check evidence references inside `unlockBehavior`; a deliberately nonexistent reference passed with zero issues. Legacy `revealOnlyIf`/breaking-point conditions are represented by the schema but not evaluated by the new pending-condition pipeline when `unlockBehavior` is absent.

Round-two interview selection is hardcoded, phase classification assumes round two starts interrogation, and roleplay prompts refer to CBI and Vikram even for a different case. Sessions record `case_version` but always load the latest file. A content update can change the rules of a saved session.

Validate and cache cases at a clear boundary, cover all current reference-bearing fields, explicitly define supported condition semantics, move case-specific assumptions into case data, and define saved-session version compatibility. A small second fixture case should exercise this before authoring another full mystery.

Evidence: [runtime loader](/Users/shashankmendiratta/shire/PartyGame/src/engine/case-loader.ts:36), [validator](/Users/shashankmendiratta/shire/PartyGame/src/engine/validator.mjs:188), [pending conditions](/Users/shashankmendiratta/shire/PartyGame/src/lib/interview-unlocks.ts:224), [suspect picker](/Users/shashankmendiratta/shire/PartyGame/src/components/HostLobbyView.tsx:609).

**Product, UX, and maintenance observations**

The entry screen has a consistent dark/gold visual identity and clear primary choices. However, production-facing copy still describes development phases and says existing features are future work. Solo is accurately labeled a preview but does not satisfy the planned playable solo mode. The phone-hack button is disabled. Late arrivals become observers permanently: passing interview control rejects observers and there is no promotion flow, contrary to the late-join scenario in the PRD.

The QR origin helper defaults non-localhost hosts to HTTPS when a forwarded protocol is absent; this can generate unusable links for plain HTTP LAN hosting. The untracked final-recording video is not integrated into the player: the asset endpoint currently permits image formats only. These should be explicit backlog items rather than implied shipped features.

Three files carry much of the system: `session-store.ts` (1,849 lines), `PlayerLobbyView.tsx` (1,555), and `HostLobbyView.tsx` (1,320). UI components import pure helpers from the server session-store module, weakening the intended boundary and complicating testing. Split authorization/lifecycle, persistence, turn execution, and pure rules into focused modules; share evidence/transcript presentation where useful. A wholesale rewrite is unnecessary.

The unit tests are useful but mostly verify schemas, helpers, parsers, and fixture contracts. There are no checked-in full browser journeys, RLS integration tests, or automated CI workflow. The single skipped database test would not load `.env.local` under the current test command. This explains how passing tests coexist with unreachable reveal and runtime-client failure.

The README reports 72 tests, Next.js 14, and an unbuilt Phase 2. The handoff is newer but contains conflicting “next phase” sections and outdated completion claims. Replace this with one short status/setup document grounded in verified behavior; keep historical notes separate. Explicitly exclude local worktrees from lint/typechecking and repository hygiene rules.

**Recommended sequence and acceptance criteria**

| Order | Work | Acceptance criterion |
| --- | --- | --- |
| 1 | Runtime and dependency baseline | Supported Node pinned; production build and real database-backed session creation pass; dependency findings triaged and patched |
| 2 | Identity and private data boundaries | Guest cannot operate host controls or impersonate a player; player responses contain no solution/future secrets; expired sessions cannot mint tokens |
| 3 | Complete the ending | Browser journey goes from create/join through briefing, interview, accusation, confrontation, reveal, and finished without direct API intervention |
| 4 | Lifecycle and turn reliability | Pause cannot be bypassed; finished stays finished; duplicate/concurrent requests do not duplicate or lose turns/evidence; failed requests recover |
| 5 | AI rescue and observability | Both known false negatives investigated; stalled discoveries have host recovery; roleplay multi-turn/story-boundary evals exist; session cost and latency are measured |
| 6 | Release discipline | CI runs build, source lint, unit tests, cases, printables, and database/browser integration checks; clean setup documentation reproduces results |
| 7 | Product breadth and polish | Decide solo/minigame scope explicitly; implement or remove placeholders; connect final media; verify TV readability and phone interaction with a real group |

A release decision should follow a complete six-to-eight-device playthrough, including a disconnect, pause/resume, simultaneous action attempts, provider failure, and the final reveal. Until then, describe the project as an implemented multiplayer prototype under integration hardening.
