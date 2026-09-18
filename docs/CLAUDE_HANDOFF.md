# Mystery Engine — current development handoff

**Updated September 17, 2026.** This replaces the historical phase-by-phase handoff. Use the current working tree as authority; do not infer deployment from a completed implementation.

## Current state

The multiplayer path works from lobby through briefing, free suspect interviews, discoveries, voting, both authored confrontation paths, reveal and finish. P1 hardening adds device membership/role checks, public case projections, guarded printables, lifecycle enforcement, atomic turns with retry fencing, host rescue, validated answers, Node 22.22.0 and patched dependencies.

Read [README](../README.md), [current architecture](ARCHITECTURE.md), and [P1 delivery](P1_DELIVERY.md) first. [Project assessment](PROJECT_ASSESSMENT.md) records the pre-fix baseline; its original findings/line references are historical, not a claim that every defect still exists.

The key change from the old handoff is that answers are validated **before publication** and committed with discoveries and microphone rotation. There is no live draft-token streaming. The AI host releases verified forensic evidence but does not move the live game between phases. Realtime has ongoing polling reconciliation. Pause/finish guards and scheduled expiry cleanup are implemented.

## Verification recorded for this working tree

| Check | Latest recorded result |
| --- | --- |
| Clean install, production build/TypeScript, ESLint | Passed |
| Unit/contract suite | 139 passed, one environment-dependent database test skipped |
| Local database/API integration | 122 assertions passed against the production build |
| Mussoorie / printables | Valid; 30 standalone exhibits current |
| Dependency audit | Zero findings at the recorded check |
| Live host evaluations | 60/60 |
| Live story-boundary evaluations | 9/9 |
| Live adjudicator evaluations | 103/104; missed Anya Grey Lady positive cue |
| Browser journey | Create/join, briefing, live answer, discoveries, pause/resume, vote, confrontation, reveal, finish |

The original Bisht rifle miss passed after cue clarification. The remaining model miss is recoverable with host assistance. Live evaluations are nondeterministic and incur provider usage; recorded results are not a guarantee for later runs. The checked-in CI workflow has not yet been verified on GitHub. No physical eight-device rehearsal, sustained load test or hosted deployment is claimed.

## Rollout and local environment

Use `nvm use` and `npm ci`. Configure `.env.local` from `.env.example`. `SESSION_AUTH_SECRET` is optional but should be a stable server-only secret in production; otherwise device signing uses the service-role key. `SUPABASE_JWT_SECRET` must match the database project to enable realtime; polling keeps the UI usable without it.

The pending migration is `supabase/migrations/20260918023306_p1_game_integrity.sql`. It was tested from scratch in an isolated local database, not applied to the shared database. During verification the shared database had 24 sessions and a separate `0007_briefing_beat_index` migration belonging to another worktree. Preserve those records and migration history; re-inspect before rollout. Do not reset shared data or delete sibling worktrees as a setup step.

Old lobbies have no trustworthy ownership credentials. Create fresh lobbies after migrating; never grant host access based on a legacy device ID or the first visitor. Review expired historical rows before enabling the migration's GC schedule.

Testing used `/tmp/partygame-p1-db`, with distinct ports and project ID. Its stack was stopped with a local backup after verification, and the test app on port 3100 was stopped. The regular `.env.local` configuration was not redirected. Follow README instructions to start the intended stack and build with its public URL/key.

## Checks for subsequent changes

```sh
nvm use
npm ci
npm run lint
npm test
npm run validate-cases
npm run printables:check
npm run build
npm audit --omit=dev
```

Run `npm run test:integration:local` against a matching running local production app when changing authorization, SQL, lifecycle, or turns; README explains the environment wrapper and isolated workdir. It creates/removes only its own sessions. For cue/roleplay changes, run the relevant `eval:adjudicator`, `eval:host`, or `eval:boundaries` command. Do not turn a one-run model score into a release guarantee.

## Next priorities

1. Review/apply the integrity migration to the intended environment, then rehearse with physical devices, disconnects, paused/reloaded browsers, and provider outages.
2. Measure session cost, latency and growing host transcript size; add usage accounting and appropriate abuse limits before public exposure.
3. Close runtime case-validation, reference-validation, legacy unlock semantics, and saved-case version compatibility gaps before claiming a reusable engine for arbitrary cases.
4. Decide scope for playable solo mode and the phone-hack minigame; integrate final-recording media and soundtrack only with explicit product work.
5. Review accessibility, TV readability, observer promotion/recovery, and production deployment.

## Rules to preserve

- Enforce actor ownership on the server, not from a supplied player/device ID.
- Keep private case fields and raw adjudication reasons out of browser props and public events.
- Route game writes through the coordinated RPCs; do not restore removed non-atomic unlock helpers.
- Commit a whole answer before microphone handoff. Keep request replay and per-attempt fencing intact.
- Preserve committed work on pause; reject stale writes after pause, finish or expiry.
- Treat `shortDescription`, voice guidance, known facts and displayed exhibits as public/approved narrative surfaces. Keep author secrets in private fields.
- Keep host rescue for secrets, breaking points and evidence. Confidence is not proximity.
- `cases/mussoorie/design.md` is the narrative reference; the earlier Word snapshot may be stale.
- Keep the user's existing edits, media assets, workspace files and other worktrees intact.
