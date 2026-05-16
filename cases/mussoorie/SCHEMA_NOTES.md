# Schema notes — implications of the Mussoorie Game Bible

The story in `design.md` is significantly richer than the schema sketched in `docs/ARCHITECTURE.md` § 5.1. This document lists every schema addition or change implied by the Game Bible. These need to land in `case.schema.json` during **Phase 0a** before we author `case.json`.

This is the bridge document between the story and the engine.

---

## 1. Two killers, not one

**Story**: Bisht is the mastermind who ordered the murders; Devraj is the executor who physically did it. The accusation/reveal must accommodate this. Players may name either — both are correct, and the reveal explains the relationship.

**Schema change**:

```ts
interface Solution {
  // was: killerSuspectId: string
  killerSuspectIds: string[];           // ["bisht", "devraj"]
  killerRoles: Record<string, "mastermind" | "executor" | "accomplice">;
  // ...
}
```

The accusation step accepts a single answer but the reveal logic checks against the `killerSuspectIds` set; selecting either Bisht or Devraj counts as "partly correct" and the reveal narrative explicitly resolves the two-killer structure. Players who name only Bisht or only Devraj see a tailored "you got half of it" reveal.

---

## 2. Round structure

**Story**: The game is explicitly organized in **4 rounds** (The Scene → Suspects Crack → Thakur Connection → The Solve), each with its own thematic shift and unlocked evidence set.

**Schema change**: a `round` grouping on chapters and evidence.

```ts
interface Case {
  rounds: Round[];                      // declared up front
  chapters: Chapter[];                  // each chapter belongs to one round
  evidence: Evidence[];                 // each evidence belongs to one round
}

interface Round {
  number: 1 | 2 | 3 | 4 | number;
  title: string;                        // "The Thakur Connection"
  tagline?: string;
  introNarration?: Beat[];
}

interface Chapter { /* ... */ roundNumber: number; }
interface Evidence { /* ... */ revealedInRound: number; }
```

The TV case-board UI uses rounds as a visible progress indicator and the printables index by round.

---

## 3. Backstory layer (cold case)

**Story**: The 15-year-old Thakur murders are referenced throughout but happened before the game starts. Players "uncover" the cold case mid-game. The Thakur family members, Harish Bisht, the staged robbery, and the rifle are all backstory.

**Schema change**: a new `case.backstory` object that the engine treats as a parallel data set the LLM can reference but players unlock gradually.

```ts
interface Case {
  backstory?: BackstoryEvent[];
}

interface BackstoryEvent {
  id: string;                           // "thakur-robbery-2011"
  title: string;
  whenText: string;                     // "December 2011" (display only)
  summary: string;
  fullDescription: string;
  revealedByEvidence: string[];         // evidence ids that unlock players' awareness of this
  characters: BackstoryCharacter[];     // Thakurs, Harish Bisht, the hired killers
}

interface BackstoryCharacter {
  id: string;
  name: string;
  role: string;                         // "Brigadier (deceased)", "victim's father (deceased)"
  portraitUrl?: string;
  summary: string;
}
```

Suspects' system prompts pull from this where relevant (Bisht knows the truth, Anya knows what she saw, Devraj knows what he covered up, the others know nothing).

---

## 4. Atmospheric thread (the Grey Lady)

**Story**: The Grey Lady appears across 4 distinct clue moments (Rounds 1, 1, 2, 3) and resolves in Round 4 when Anya confesses. It's a deliberate slow-burn narrative thread, not a single chapter.

**Schema change**: a first-class concept for spanning narrative threads.

```ts
interface Case {
  atmosphericThreads?: AtmosphericThread[];
}

interface AtmosphericThread {
  id: string;                           // "grey-lady"
  title: string;                        // "The Grey Lady"
  clueIds: string[];                    // evidence ids that contribute to the thread
  introducedInRound: number;
  resolvedByEvidence?: string;          // evidence/event id that resolves it
  resolutionText: string;               // what the reveal says when the thread closes
}
```

The TV "case board" can display open threads as an at-a-glance reminder ("Open thread: The Grey Lady"); when the resolving evidence is unlocked, the thread auto-closes with the resolution text.

---

## 5. Anonymous letters / tipster events

**Story**: Two anonymous letters drive the plot — one (from Anya) opens the game, one (from Kabir) pivots it into the cold case mid-game. They're chapter-triggering events, not regular evidence.

**Schema change**: model anonymous letters as a special evidence-and-chapter pair (or a dedicated chapter type).

Option A — keep them as evidence with a `triggersChapter` field:

```ts
interface Evidence {
  // ...
  triggersChapter?: string;             // when unlocked, advance to this chapter
}
```

Option B — a new chapter type:

```ts
type Chapter =
  | { type: "anonymous-letter"; senderSuspectId?: string; senderShownInRound?: number; body: string; ... }
  | ...
```

Recommended: **Option A** (simpler; the letter is still evidence the players retain).

---

## 6. Per-suspect "what they actually did that night"

**Story**: Every suspect's sheet has a "What they did that night" section that's the *truth*, separate from the public alibi. This is critical for the LLM to answer truthfully under pressure (e.g., Naina actually was on the road, Rhea actually was at home, Anya actually went to Bisht's hotel).

**Schema change**: extend `Suspect` with a structured `trueTimeline`.

```ts
interface Suspect {
  // existing
  publicAlibi: string;
  lies: Lie[];
  secrets: Secret[];

  // NEW
  trueTimeline: TimelineBeat[];         // ordered, with time + location + action
}

interface TimelineBeat {
  time: string;                         // "8:00 PM"
  location: string;                     // "Royal Pines lobby"
  action: string;                       // "called Devraj from private office"
  revealCondition?: UnlockCondition;    // optional gate; if omitted, considered private until suspect breaks
}
```

The prompt composer chooses between `publicAlibi` (always shown) and beats in `trueTimeline` (gated). When a beat's `revealCondition` is met, the LLM is told the truth for that beat.

---

## 7. Multi-evidence breaking points

**Story**: Several breaking points require *multiple* pieces of evidence (e.g., Anya breaks when confronted with both the timeline gap AND the Bisht payments).

**Schema change**: `UnlockCondition` already supports `{ type: "all", conditions: [...] }` — verify that breaking points and secrets use this for compound triggers. No new schema, just a confirmation that the existing union must be expressive enough.

---

## 8. Two-path endgame

**Story**: The interrogation in Round 4 plays out differently depending on whether players confront Bisht first or Devraj first. Both paths land at the same truth, but the dialogue is distinct.

**Schema change**: an `endgame` section with branching paths, each keyed by which suspect is confronted first.

```ts
interface Case {
  endgame: EndgameDefinition;
}

interface EndgameDefinition {
  branchOn: "firstConfronted";          // currently the only supported branch key
  paths: EndgamePath[];
  finalRevealNarration: Beat[];         // common to both paths
}

interface EndgamePath {
  id: string;                           // "bisht-first", "devraj-first"
  triggerSuspectId: string;             // "bisht" or "devraj"
  scriptedSuspectLine: string;          // the framed defence / confession line that path opens with
  followUpSuspectId: string;            // the other one
  followUpScriptedLine: string;         // their reaction line
}
```

The LLM still runs the interview, but the system prompt for the first-confronted suspect is augmented with `scriptedSuspectLine` as a strong starting beat the model should hew to (rather than diverging wildly).

---

## 9. Guilt map

**Story**: The closing emotional payoff is the guilt-map discussion. Each suspect has a categorical "kind of guilt," from "mastermind" down to "moral guilt only."

**Schema change**: extend `Suspect` with `guiltCategory`, and surface it in the reveal screen.

```ts
type GuiltCategory =
  | "mastermind"
  | "executor"
  | "accessory"
  | "tamperer"
  | "moral-cowardice"
  | "moral-bystander"
  | "innocent";

interface Suspect {
  // ...
  guiltCategory: GuiltCategory;
  guiltSummary: string;                 // 1-2 sentence summary for the reveal screen
}

interface Solution {
  // ...
  closingQuestion: string;              // the "who is truly guilty?" prompt for discussion
}
```

The reveal screen renders a compact guilt-map table (suspect, category, summary) and the closing question is shown for the group to debate.

---

## 10. Locations as first-class entities

**Story**: Section 12 names 8 locations, several of which are referenced repeatedly (Camel's Back Road, Royal Pines, Thakur Cottage, Vikram's cottage, the chai shop, the bus stand, the cedar grove, the police station). Some interview chapters and evidence items should be set "at" a location.

**Schema change**: add a `locations` array; evidence and chapters can reference a `locationId`.

```ts
interface Case {
  locations: Location[];
}

interface Location {
  id: string;
  name: string;
  description: string;
  imageUrl: string;                     // wide image used as TV backdrop
}

interface Chapter { /* ... */ locationId?: string; }
interface Evidence { /* ... */ locationId?: string; }
```

The TV interview screen can pull the location image as the scene backdrop when an interview is set at a specific location.

---

## 11. Recap of schema deltas

To summarize, `case.schema.json` (Phase 0a) needs the following beyond what's currently in `docs/ARCHITECTURE.md` § 5.1:

| New field | On | Purpose |
|---|---|---|
| `rounds[]` | `Case` | Group chapters and evidence into 4 rounds |
| `backstory[]` | `Case` | The cold-case layer |
| `atmosphericThreads[]` | `Case` | Slow-burn narrative threads (Grey Lady) |
| `locations[]` | `Case` | Named locations as first-class entities |
| `endgame` | `Case` | Two-path final confrontation |
| `roundNumber` | `Chapter`, `Evidence` | Round membership |
| `locationId` | `Chapter`, `Evidence` | Place this beat happens |
| `triggersChapter` | `Evidence` | Unlocking some evidence advances a chapter (anonymous letters) |
| `trueTimeline[]` | `Suspect` | What they actually did, gated |
| `guiltCategory` + `guiltSummary` | `Suspect` | For the guilt-map reveal |
| `killerSuspectIds[]` + `killerRoles` | `Solution` | Mastermind + Executor pair |
| `closingQuestion` | `Solution` | Discussion prompt at the end |

And one **semantic clarification**: the existing `Solution.killerSuspectId` becomes `killerSuspectIds[]`, and the accusation logic accepts a partial match (any of the killers).

---

## 12. Open questions for Phase 0

- **OQ-A**: For the two-path endgame, should we hard-script the suspect's opening line (current proposal) or let the LLM generate it freely with stronger system-prompt nudging? The Game Bible quotes verbatim lines — those are good enough to use as canon.
- **OQ-B**: Backstory characters (the Thakurs, Harish Bisht, the hired killers) — do they get full character sheets or just brief dossiers? Brief is fine; they're never interrogated.
- **OQ-C**: Should `atmosphericThreads` resolve via a single triggering evidence or a chapter? Current proposal is evidence-based; Anya's confession (a breaking-point event in a Round 4 interview) is what resolves the Grey Lady — so we'd need either a chapter-completion trigger or an evidence-record that's auto-generated when she breaks.
- **OQ-D**: For "anonymous letters" specifically: is `triggersChapter` strong enough, or do we want a special chapter type for the dramatic letter-arrival moments? Default to `triggersChapter` for now.
