# Mussoorie — adjudicator evals

Per-suspect test cases for the Phase 2g adjudicator. Each `<suspect>.eval.json`
file pins the expected behavior of every `unlockBehavior` condition on that
suspect (secrets, breaking points, related evidence). The eval script runs
each test case through the real `judgeUnlock()` and reports pass/fail.

## Running

```bash
# Eval one suspect:
npm run eval:adjudicator -- naina

# Eval all suspects in the case:
npm run eval:adjudicator -- all
npm run eval:adjudicator           # same as `all`

# Use a different case:
npm run eval:adjudicator -- naina --case mussoorie

# Use a different model:
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct npm run eval:adjudicator -- naina
```

Reads `OPENROUTER_API_KEY` from `.env.local` (or the environment). Exits 0 if
all cases match expectations, non-zero otherwise — CI-friendly.

## File shape

```jsonc
{
  "suspectId": "naina",
  "conditions": {
    "secret:points-to-rhea": [
      {
        "name": "polite professional question",
        "expected": "met" | "not-met",
        "transcript": [
          { "role": "user", "content": "What kind of work do you do?" }
        ],
        "presentedEvidenceIds": []   // optional; for evidence-tier cues
      },
      ...
    ],
    "secret:obsessive-calls": [ ... ],
    "breaking-point:shopkeeper-and-phone": [ ... ],
    "evidence:vikram-naina-whatsapp": [ ... ]
  }
}
```

The condition keys must match the engine's composite IDs:
- `secret:<id>`
- `breaking-point:<id>`
- `evidence:<id>` (only for evidence pieces whose `relatesToSuspectIds` includes
  this suspect AND that have `unlockBehavior`)

## Authoring guidance

A condition's evals should include at least:

1. **A clear positive case** — the canonical "this fires" question. The first
   case you'd want to handle right.
2. **A clear negative case** — fully off-topic or about a different cue.
3. **An adjacent case** — the close-miss. Asking about the suspect's hotel
   when the cue is about her work, for instance. This is the one that catches
   prompt drift.
4. **A character-fidelity case** — a question that touches the cue's topic
   but in a way the cue explicitly excludes (e.g., hostile framing on Naina).
   The whole point of writing cue text carefully is to make this case fail
   correctly; an eval that doesn't include this isn't really testing the cue.

For **evidence-tier** conditions, also include cases where:
- All required evidence is presented AND the question is right (positive).
- Required evidence missing AND the question is right (should NOT fire).
- All required evidence presented AND the question is wrong (should NOT fire —
  the gate alone is not enough).

The eval is the contract between the author and the engine. If a case fails,
either the cue text needs tightening or the case has the wrong expectation.
Pick one before re-running.

## Authoring gotchas

**Don't write cue text that references the engine.** The adjudicator reads the
cue as the criterion. If you write *"Same cue as the secret above — the memo
lands as a cascade after the WhatsApp"*, the LLM will literally look for
mentions of memos and cascades in the transcript. Every cue must be a
self-contained description of what the *interviewer's question* should look
like. Cross-references and cascade-ordering are engine concerns and should
stay out of cue text.

**Cue text describes player behavior, not suspect behavior.** "Naina mentions
X" is a description of the suspect's response, which the adjudicator doesn't
have control over. Write "The interviewer asks Naina about X" instead.

**For compound-tier conditions, the cooperationCue is necessary even when
evidence is the primary driver.** The evidence gate is necessary but not
sufficient — the LLM still checks the cue. Story-wise, this is the right
default for revelations that need emotional pressure on top of forensic
pressure (e.g., Naina admitting she heard the sound). For pure
evidence-presentation triggers (the CCTV still cracks Rhea on its own),
use evidence-tier instead and skip the cue.
