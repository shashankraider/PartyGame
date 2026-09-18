# Mystery Engine — development handoff

Updated September 18, 2026. The working tree and hosted deployment metadata are authoritative. See [release notes](RELEASE_2026-09-18.md), [architecture](ARCHITECTURE.md) and [README](../README.md).

## Delivered in this release

- Mobile Now / Case file / Team navigation, compact evidence selection and collapsed earlier exchanges.
- Full chapter visuals, focused galleries, YouTube channel exhibit and a face-obscured Grey Lady facing the viewpoint. Earlier visual work and authenticated saved-session recovery are already in the baseline release.
- LangGraph planning and draft → validation → one repair → fallback routing. Supabase owns durable transcripts, discoveries and fenced turns; no LangGraph checkpointer or LangSmith service is configured.
- Rhea's guarded persona, replacement alibi after CCTV, and admission-dependent concealment motive. Finance-only and CCTV-only states do not reveal the combined motive.
- Eight active minutes per suspect, 90 seconds per detective, early pass, paused clocks during AI generation, and host +2 minutes. Suspect switching/rejoining preserves time and discoveries; leaving the browser does not pause the game.
- Investigator contract, evidence-gate, cue and conversation evals; focused Rhea scenarios invoke the production graph. Exact focused answers and caveats are in [Rhea tuning](reviews/RHEA_SUSPECT_TUNING.md).

## Verification and rollout

The local release baseline passed 164 unit tests (one existing environment-dependent skip), 197 API integration assertions, transactional SQL timer checks, lint and production build. Follow the release notes for refreshed case/printable/audit checks, hosted migration, commit and deployment evidence. Historical reports preserve the model/version and counts from their own run; do not present them as current all-suspect passes.

Production: https://party-game-dun.vercel.app. Vercel project `party-game` is connected to `shashankraider/PartyGame`, branch `main`. Supabase project `nfpochmyqmttqirhflac` already has migrations 0001–0007 and the P1 integrity/security migrations. The new timed-interviews migration must precede the application update. Never reset the hosted or shared local database.

Local verification uses `/tmp/partygame-p1-db`, separate from the shared database, and the app on port 3100. Start/build with `SUPABASE_WORKDIR=/tmp/partygame-p1-db node scripts/with-local-supabase.mjs ...`. Node 22.22.x is required. Public Supabase values are baked into the build; do not reuse a local build for hosted production. Keep `.env.local`, personal `.claude/` settings and workspace configuration private.

## Outstanding work

- Rhea phone records and Devraj duty-log exhibits are missing. The offline contract command intentionally reports them; do not fabricate proof dynamically.
- Other suspects still have quality findings in the historical investigator review. The focused Rhea improvements do not prove all possible conversations are correct. Mandatory admission detail can still be omitted; grader false positives/negatives require review.
- Reconcile the channel buyer name across story/printable sources before claiming complete content consistency.
- Long interview quality beyond the 12-message roleplay window is not exhaustively evaluated, although earned admissions persist separately.
- Physical multi-device rehearsal, sustained load, cost/latency accounting, accessibility review and abuse controls remain follow-ups.
- Playable solo, a hacking minigame, observer promotion, host transfer, soundtrack/TTS and inline final-recording playback remain unimplemented/deferred. The recovered phone is a real file viewer; the recording has a guarded download.
- Runtime case validation, legacy gate behavior, saved-case version compatibility and a second-case portability test remain engine work.

## Rules to preserve

Enforce device membership on the server. Keep private story fields and adjudication reasons out of public projections. Use coordinated transactional RPCs, preserve request replay and attempt fencing, and never publish unvalidated draft tokens. Timer reads must not reset budgets or extend retention. Clocks resume after a failed or expired AI lease. Host extensions require host authorization. Keep character posture dependent on earned admissions, not allegations. Preserve user sessions and other worktrees during tests.
