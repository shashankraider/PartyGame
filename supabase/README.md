# Supabase

Database schema, Row-Level Security policies, and Realtime publications for the Mystery Engine.

## Local development

Install the Supabase CLI:

```bash
brew install supabase/tap/supabase
```

Start a local Supabase stack:

```bash
supabase start
```

This brings up Postgres, Auth, Realtime, and Studio (the local dashboard). Migrations in `supabase/migrations/` apply automatically.

## Applying migrations to a hosted project

```bash
supabase link --project-ref <your-project-ref>
supabase db push --linked
```

## Migration files

| File | What it does |
|---|---|
| `0001_initial.sql` | Creates `sessions`, `players`, `messages`, `events` tables. Sets up enums (mode/status/scene/role). Enables RLS with session-scoped read policies. Adds all four tables to the `supabase_realtime` publication. |

## RLS strategy

- The **Next.js server** holds the service-role key and bypasses RLS for trusted server-side mutations through API routes (this is where game logic and validation live).
- **Clients** (TV, phones) use the anon key plus a signed cookie that sets `app.session_id`. The RLS policies use `current_setting('app.session_id')` to scope every read to that session only.
- No INSERT/UPDATE/DELETE policies are exposed to the anon role. Clients never write directly; all mutations flow through the server.

This keeps the attack surface minimal: a leaked anon key gives someone read-only access to one session at most, and only if they also know its id.

## Garbage collection

The `gc_expired_sessions()` function deletes sessions past their `expires_at`. Call it manually for now:

```sql
select gc_expired_sessions();
```

In production we'll schedule it via `pg_cron`:

```sql
select cron.schedule('gc-expired-sessions', '0 * * * *', $$ select gc_expired_sessions(); $$);
```
