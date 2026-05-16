# Mystery Engine — a cooperative whodunit framework

A reusable engine for cooperative murder-mystery party games, with the first case shipped as **Murder in Mussoorie** — a family-friendly noir mystery set in the Indian hill town, designed for 6–8 players, ages 10+.

Inspired by [Murder in Prague](https://murderinprague.com/). Evolved with **live LLM-driven suspect interrogation**, **multi-device play** (TV display + player phones), and a **JSON case format** so new cases can be authored (by humans or AI) without touching engine code.

## Status

Pre-alpha. **Phases 0 and 1 complete** — framework contract is locked, tested, and Mussoorie is fully structured:

### Phase 0 — Framework
- ✅ JSON Schema (`src/engine/schema/case.schema.json`) covering Case, Suspect, Evidence, Chapter, UnlockCondition, Solution, Round, Location, BackstoryEvent, AtmosphericThread, EndgameDefinition
- ✅ Auto-generated TypeScript types (`src/engine/types.ts`)
- ✅ CLI validator with schema + cross-reference checks (`npm run validate-case <id>`)
- ✅ Case template scaffold (`cases/_template/`)
- ✅ Authoring guide (`docs/authoring-guide.md`)
- ✅ Supabase schema (sessions, players, messages, events) + RLS + Realtime in `supabase/migrations/0001_initial.sql`

### Phase 1 — Mussoorie case data
- ✅ Game Bible (`cases/mussoorie/design.md`) — canonical narrative source
- ✅ `cases/mussoorie/case.json` — 6 suspects, 26 evidence items, 19 chapters, 4 rounds, 8 locations, Thakur backstory, Grey Lady atmospheric thread, two-path endgame, multi-killer solution. Validates green.
- ✅ Round 1–4 HTML printables under `cases/mussoorie/printables/`

### Tests
- ✅ **72 tests across 5 files, all passing** (`npm test`) — includes a pin test that fails CI if Mussoorie ever stops validating

**Next: Phase 2** — build the Next.js app (scaffold, lobby, TV/phone modes, engine UI, LLM interview, boundary enforcement, pause/resume).

## Scripts

```bash
npm test                   # run the test suite
npm run validate-case <id> # validate one case
npm run validate-cases     # validate every case
npm run types:generate     # regenerate src/engine/types.ts from the schema
npm run docs:render        # render mermaid diagrams in docs/ to SVG
```

## Documentation

- [`docs/PRD.md`](docs/PRD.md) — Product Requirements: vision, goals, user scenarios, gameplay flow diagrams, functional & non-functional requirements (2 diagrams)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System architecture: stack, data model, streaming, display modes, lobby, LLM boundaries, session state machine (7 diagrams)
- [`docs/diagrams/INDEX.md`](docs/diagrams/INDEX.md) — All 9 diagrams rendered as standalone SVGs, regenerable via `npm run docs:render`
- [`docs/authoring-guide.md`](docs/authoring-guide.md) — How to author a new case, by hand or with an LLM
- [`cases/mussoorie/`](cases/mussoorie/) — The first case (Game Bible, printables, schema notes)
- [`supabase/`](supabase/) — Database migrations, RLS, Realtime setup

### Rendering the diagrams

The markdown files contain `mermaid` code blocks that render inline in Cursor's markdown preview and on GitHub. To export them as standalone SVG files (e.g., for embedding in slides or external docs):

```bash
npm install        # one-time
npm run docs:render
```

Output lands in `docs/diagrams/` with descriptive filenames.

## How it plays (short version)

1. Open the app, pick a case, and choose **Solo** or **Multiplayer** mode.
2. In Multiplayer: TV shows a join code + QR. Players scan with their phones, enter a name, take a seat.
3. The case unfolds in chapters on the TV: case briefing, evidence reveals, suspect interviews, a phone-hack minigame.
4. During interviews, one **designated interviewer** at a time types questions on their phone. Suspects answer live (via LLM), in character, never revealing more than they should.
5. The interviewer can **present evidence** mid-conversation to crack alibis, and can **pass control** to anyone at any time.
6. After all the interviews and twists, the group votes for the killer. The TV reveals the truth.
7. Pause anytime; resume within ~7 days from the same join code.

## Architecture at a glance

- **Frontend / API**: Next.js 14 (App Router) + TypeScript + Tailwind, deployed on Vercel
- **Backend**: Supabase (Postgres + Realtime) for session state, persistence, and cross-device sync
- **LLM**: OpenRouter (model-swappable via env var) for live suspect interrogation
- **Engine vs cases**: code is case-agnostic; cases are JSON files in `cases/<id>/case.json` plus assets

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for diagrams and details.

## License

TBD.
