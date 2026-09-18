# Mystery Engine

A cooperative murder-mystery game with a shared TV display and phone controllers. The first case, **Murder in Mussoorie**, contains six suspects, 30 exhibits, and two confrontation endings.

The multiplayer flow includes lobby creation, briefing, live suspect interviews, evidence discovery, host assistance, voting, confrontation, reveal, and a finished state. Solo is a preview; the recovered-phone screen supports Messages, Calls and Notes, while a hacking minigame remains unimplemented. This is a prototype under integration hardening, not a claim of production readiness.

## Run locally

1. Use Node **22.22.0** (`nvm use`), then `npm ci`.
2. Start Docker and run `supabase start` for a new local database. Existing databases need the new migrations; do not reset a database containing games you want to keep.
3. Copy `.env.example` to `.env.local`. Set both Supabase URLs, the anon key, and the server-only service-role key from `supabase status`. Add the matching JWT secret for realtime and an OpenRouter key for live interviews. Keep server keys out of `NEXT_PUBLIC_` variables.
4. Run `npm run dev`, open the multiplayer case page on the host, then join using the displayed code on each phone. Use the same browser and hostname when returning to a game.

The session membership migration is a security boundary: old lobbies have no verifiable host credentials. Create new lobbies after migrating. Existing rows are retained until their normal expiry. Never backfill host ownership from public device IDs.

## Play

Start after detectives join. Continue through the briefing, choose a suspect, and let a detective take the microphone. Each suspect has eight minutes of active interview time. Detectives share the microphone in 90-second stretches, with an early pass option. Generated answers pause both clocks; the host can extend a suspect by two minutes. Switching suspects preserves time and discoveries. Answers are validated before publication and committed atomically. The host can help with stalled revelations or request the next forensic update. Pause cancels an unfinished answer; resume permits a retry.

Open accusation when the group is ready. After every detective votes, select **Begin confrontation**, **Continue confrontation**, **Reveal the truth**, then **Finish game**. Among the two confrontation suspects, the larger vote total selects the branch; ties, including neither receiving a vote, select the first authored branch.

Sessions expire after seven days without a successful game action. An hourly database job removes expired games. Clearing browser cookies loses that device's identity; join codes do not grant host access.

## Checks

```sh
npm run lint
npm test
npm run validate-cases
npm run printables:check
npm run build
npm audit --omit=dev
```

Database/API integration checks create their own games in a **local** database and delete only those games. Apply migrations first. Run the app and test harness against the same database:

```sh
node scripts/with-local-supabase.mjs npm run build
node scripts/with-local-supabase.mjs npm run start -- --port 3100
# In another terminal:
npm run test:integration:local
```

Set `SUPABASE_WORKDIR` to an isolated Supabase project directory when working alongside another checkout. Do not reset the shared database. `INTEGRATION_BASE_URL` overrides the default `http://localhost:3100`.

Live evaluations use OpenRouter and incur provider usage:

```sh
npm run eval:adjudicator -- all
npm run eval:host
npm run eval:boundaries
npm run eval:investigators
npm run eval:rhea -- --scenario concealment-followup --repeat 1
```

CI runs lint, unit tests, case/printable checks, audit, production build, and local database/API integration checks. Live model evaluations and the browser playthrough are separate checks; model results can vary between runs.

The investigator contract audit currently reports missing Rhea phone records and Devraj duty-log exhibits. These are known content gaps, not infrastructure failures. Live eval transcripts and grader findings need manual review.

## Project guides

- [September 18 release](docs/RELEASE_2026-09-18.md): release scope, checks, and deployment evidence.
- [Timed interviews](docs/TIMED_INTERVIEWS.md): clock, handoff, pause and extension rules.
- [LangGraph interviews](docs/INTERVIEW_LANGGRAPH.md): orchestration and persistence boundaries.
- [Investigator evaluations](docs/INVESTIGATOR_EVALS.md): per-suspect evaluation coverage and known gaps.
- [Visual delivery](docs/GAMEPLAY_VISUAL_ASSESSMENT.md): delivered host/phone treatments.
- [Project assessment](docs/PROJECT_ASSESSMENT.md): baseline findings and priorities.
- [P1 delivery and verification](docs/P1_DELIVERY.md): fixes, evidence, and rollout limits.
- [Authoring guide](docs/authoring-guide.md): case format and validation.
- [Supabase setup](supabase/README.md): migrations and access model.
- [Architecture](docs/ARCHITECTURE.md): current data flow, authorization, turns and lifecycle.
- [Development handoff](docs/CLAUDE_HANDOFF.md): pickup instructions, verified status and next priorities.
- [PRD](docs/PRD.md): product targets with an implementation-status map.

License: TBD.
