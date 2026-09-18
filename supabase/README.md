# Database setup

Use the Supabase CLI with Docker. `supabase start` initializes a new local database from the checked-in migrations. For an existing database, inspect migration history and apply only pending migrations; never reset a shared database to install a feature. Other worktrees may have additional migrations that must be preserved.

Hosted rollout is separate from local development: review pending migrations before using `supabase db push --linked`. This change was verified on an isolated local database, not deployed to a hosted project.

## Access model

The server issues a signed HttpOnly device cookie. Private `session_memberships` bind that device to host privileges and/or a player. Every session API and page checks membership; mutations additionally check the actor and game lifecycle. The server holds the service-role key. An anon key or known session/player ID is not an identity credential.

Members can obtain a short-lived realtime JWT scoped to their session and capped by session expiry. RLS uses its signed claims. Only safe public rows/columns are directly readable. Memberships, turn records, and private adjudication state are inaccessible to browser roles. Clients cannot execute the mutation RPCs or garbage collection.

## Mutation integrity

`create_game_session` and `join_game_session` allocate the lobby and seats atomically. `begin_interview_turn` reserves one pending answer per session. Each attempt has a lease and a fencing token; an expired worker cannot commit over its replacement. `commit_game_update` locks the session and checks its revision, then commits messages, discoveries, votes, events, and microphone handoff together. Pausing or ending cancels pending turns. Completed turn retries return the saved result.

`20260918023306_p1_game_integrity.sql` adds these functions, tables, grants, and ending state. Existing games cannot be assigned an authenticated host safely from their historical public device IDs; create fresh lobbies after rollout. Do not automatically claim old games for the first visitor.

## Retention

Successful game actions update activity and extend expiry by seven days. API reads/joins/actions reject expired sessions; realtime token expiry is capped. `pg_cron` runs `public.gc_expired_sessions()` hourly at minute 17 under the database job owner's privileges. Browser roles cannot execute the function. Review the existing retention timestamps before applying a schedule to a database containing historical games.

## Verification

See `tests/integration/game.mjs` and `scripts/with-local-supabase.mjs`. These require local URLs, test a running production app, and clean up only their own sessions. The integration suite covers separate device cookies, RLS, concurrent joins/votes, turn replay/fencing, provider failure, host assistance, pause, expiry, and both endings.
