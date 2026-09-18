# P1 delivery and verification

> Historical assessment/verification record. The current state, subsequent fixes and rollout are documented in [September 18 release](RELEASE_2026-09-18.md) and [Architecture](ARCHITECTURE.md). Statements below about missing deployment or pending P1 migrations describe the original review date.

September 17, 2026. This accompanies the [baseline assessment](PROJECT_ASSESSMENT.md). Changes are in the working tree; no hosted deployment or shared-database migration was performed.

## Delivered changes

| Baseline finding | Implementation |
| --- | --- |
| Unauthenticated host/player actions | Server-issued signed HttpOnly identity; private membership records; membership and role checks on API reads/writes, host/player pages, and realtime token issuance; body-supplied device IDs are ignored. Player responses exclude device IDs. |
| Private case and locked printable leakage | Allowlist public case projection; only unlocked exhibits and the current chapter are sent; ending lines are released in stages; private author persona/solution is excluded. Public suspect descriptions no longer identify the mastermind or tipster. Printables require membership and unlock state. Arbitrary story asset folders are not public. |
| Voting stops before reveal | Host controls continue after all detectives vote. Votes select one of the two authored confrontations, followed by its response, the full truth, and a finished state. The larger vote total among the two confrontation suspects wins; ties, including zero votes for both, choose the first branch. |
| Pause, finish, expiry bypasses | Central lifecycle guards plus database revision checks; pause/end cancel pending turns; stale writers cannot resume the game; phone/host controls reflect paused/finished/pending states. Reads, joins, actions and token issuance enforce expiry. Successful game mutations renew seven-day retention. Hourly GC is defined in the migration. |
| Unsupported Node runtime | Node 22.22.0 pinned in both version files; package engines and pre-start/build/dev checks added; CI uses the same pin. |
| Vulnerable dependencies | Patched Next.js and compatible dependency updates; synchronized lockfile; clean production and full audits at verification time. |
| Races and unrecoverable failures | Database transactions serialize seat allocation, votes, message ordering, discoveries and microphone handoff. Turns have leases, request IDs, saved results and per-attempt fencing tokens. Provider failures leave no partial transcript. Network failures produce recoverable UI errors; snapshots reconcile after subscription and poll as a backup. |
| AI rescue and story boundaries | Confidence and cue proximity are separate. Cue-less pressure reaches its threshold. Host assistance can reveal eligible secrets, breaking points and evidence, independent of model confidence. Established admissions are included in subsequent prompts. Generated answers are validated before publication; rejection/provider-validation failure uses authored text or a safe deflection. Automatic forensic releases receive a separate trigger verification. AI phase changes cannot advance the live game. |

The old non-transactional unlock/host write helpers were removed so the runtime has one coordinated mutation path. Roleplay no longer receives the private author persona or a list of secrets to “never reveal.”

## Verification evidence

- Clean dependency installation on Node 22.22.0; production build and TypeScript passed.
- Unit/contract checks: 139 passed, one legacy environment-dependent database test skipped. Real database behavior is exercised by the separate integration suite.
- ESLint passed; case validation passed; all 30 printables current.
- `npm audit`: zero reported vulnerabilities at this check, including the production-only audit.
- Migration applied from scratch to an isolated local Supabase database. Checked private table grants, column grants, mutation/GC function privileges, cross-session RLS, and the hourly GC job.
- Database/API integration: **122 assertions passed** against the final production build. Covers eight concurrent joins/votes, separate device cookies, spoofed identity attempts, host/page restrictions, locked and unlocked printables, turn reservation, pause cancellation, expired lease replacement, stale-attempt rejection, saved-result replay, provider outage, rejected answer handling, retained admissions, host rescue, terminal states, expiry, and both branches.
- Browser journey through ordinary controls: create → join → briefing → suspect selection → microphone claim → live OpenRouter answer and two discoveries → pause/resume on both screens → vote → confrontation → follow-up → truth → finished. This used host and phone views in separate tabs, with independent-device authorization/concurrency covered by the HTTP suite.
- Live host evaluation after trigger clarification and independent confirmation: **60/60**.
- Live story-boundary evaluation: **9/9**, including unsupported confessions/accusations, validator injection, private identity disclosure, retained admissions, and adversarial questions.
- Latest full live adjudicator evaluation: **103/104**. The original Bisht rifle failure passed after clarification (also **21/21** in the targeted Bisht suite). A different Anya “Grey Lady” positive cue was missed in the latest full run. Host assistance provides recovery; this is not evidence of perfect model accuracy. Results vary across calls.

Automated checks are in `tests/p1-boundaries.test.mjs`, `tests/integration/game.mjs`, and `scripts/eval-boundaries.ts`. The CI workflow includes unit, lint, content, audit, build and local database/API checks. The workflow itself has not been run on GitHub in this task.

## Rollout

1. Use the pinned Node runtime and install the lockfile.
2. Review and apply `supabase/migrations/20260918094606_p1_game_integrity.sql` to the intended database before running the updated app. Preserve any additional migrations from other checkouts.
3. Configure server-only authentication/Supabase secrets and the OpenRouter key. Start fresh lobbies: historical public device IDs cannot safely establish host ownership.
4. Build against the intended public Supabase URL/key. Run the integration checks against a local test database, then perform a real multi-device rehearsal before public release.

The existing shared local database had 24 sessions and a separate `0007` migration from another worktree. Both were left intact. Testing used `/tmp/partygame-p1-db`; that database is separate from the normal `.env.local` database. No reset or migration was applied to the shared database, and no changes were committed or published.

## Remaining scope

Solo and phone-hack remain unfinished product features. Model cost/latency accounting, sustained eight-device/network-failure testing, accessibility review, generic case-validator gaps, saved-case version compatibility, and production hosting remain follow-up work from the assessment. Response checks reduce story leaks but do not prove semantic perfection. The new host rescue and staged ending keep occasional model misses from being permanent game-progression failures.
