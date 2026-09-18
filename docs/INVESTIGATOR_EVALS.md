# Investigator evaluations

Each of the six Mussoorie suspects now has a repeatable investigator journey. The purpose is to catch answers that are safe in isolation but break the game: a promised document that does not exist, an alibi treated as verified without evidence, an admission forgotten on the next turn, or a third-person script delivered as the suspect's speech.

## What runs

1. **Content contracts:** map the corroboration for each suspect's alibi to an authored exhibit. Missing promised documents are failures, not silently skipped tests.
2. **Evidence combinations:** enumerate every proper subset of each unlock's required evidence and execute the production adjudicator's gate. No incomplete set may unlock a compound revelation. Check the exact pressure threshold with the production state transition. Foreign-suspect evidence fixtures are tested against the production pending-condition ownership filter.
3. **Cue evaluations:** run the existing per-suspect positive, negative, adjacent, and hostile question fixtures through the real adjudicator.
4. **Conversation evaluations:** generate real answers through the same reply/validator/fallback function used by the application. Preserve generated replies in the following turn's history. Test alibi → proof → request the document; an evidence challenge and follow-up; a fabricated DNA report; prompt injection; and two-turn retention of every authored admission or recovered exhibit.
5. **Independent quality rubric:** a separate model call reviews the delivered reply for grounded claims, nonexistent promised evidence, retained admissions, relevance, and first-person speech. The grader does not get the private solution. Production rejection is not automatically a pass: a safe but unusable fallback can fail quality review.

Admission-retention tests deliberately seed an approved admission to isolate answer quality. Cue tests separately evaluate earning that admission. This harness does not exercise browser controls, database persistence, turn rotation, host judgment or session concurrency; those remain covered by integration tests. No real game sessions are created or modified.

Natural-language questions are unbounded. This suite exhausts the finite authored evidence subsets and covers representative question families; it does not claim to test every possible conversation. Multi-condition histories and long conversations beyond the production 12-message context window are not exhaustively covered.

## Run

```sh
# No provider calls: content contracts and deterministic gates.
# Exits nonzero while promised proof exhibits are missing.
npm run eval:investigators

# All six suspects, cue fixtures and real multi-turn answers.
npm run eval:investigators -- --live

# Focus a suspect, with repeated stochastic samples.
npm run eval:investigators -- --live --suspect rhea --repeat 3

# Repeat just conversation checks without spending calls on the cue suite again.
npm run eval:investigators -- --live --skip-cues --category alibi-proof
```

Options: `--suspect all|rhea|devraj|naina|bisht|anya|kabir`, `--category all|alibi-proof|evidence-challenge|fabricated-evidence|prompt-injection|admission-retention`, `--repeat 1..10`, `--concurrency 1..6`, `--out path`, `--skip-cues`.

Live runs use the configured OpenRouter model and incur provider usage. `.env.local` is loaded without logging keys. `EVAL_GRADER_MODEL` can select a different grading model; by default it uses `openai/gpt-4.1`, separately from the configured game model. Six known-good/known-bad controls must pass before live quality grading proceeds. Model grading is a useful signal, not independent human verification. Provider failures and malformed grader responses are reported as errors, not passes.

Timestamped JSON reports are saved under `output/evals/` (ignored by Git). They include exact questions, raw drafts, delivered answers, production validator decisions, grader findings, content gaps, model names, case/prompt hashes and counts. Reports are checkpointed during the run. A completed report has `status: "complete"`. Review exact failure transcripts before changing story canon or accepting a grader conclusion.

## Current focused follow-up

Rhea now has admission-gated posture and concealment-motive layers, an updated alibi after the CCTV admission, and a first-person fallback. The latest focused 12-answer run is documented in [Rhea tuning](reviews/RHEA_SUSPECT_TUNING.md); it does not supersede the full historical suite or close every cross-suspect finding. Timed interviews replace the game question limit, but evaluation scripts use scripted turn lists and do not enforce gameplay clocks.

## Initial content gaps

- **Rhea:** her public alibi explicitly promises phone records. `rhea-phone-records` is not an authored exhibit and cannot be unlocked.
- **Devraj:** his alibi explicitly cites the station duty log. `devraj-duty-log` is not an authored exhibit; the police death report is a different source.

The IDs above reserve the missing proof contracts; they do not create evidence. Adding either exhibit needs authored content, a release/request rule, a printable/visual if appropriate, and positive/negative unlock tests. The alternative is to change the character's wording so it remains an unverified claim and does not promise to supply a nonexistent file. Do not fabricate documents dynamically just to satisfy a generated answer.

For other suspects, distinguish a corroborating time anchor from a complete alibi: a bus ticket, chai receipt or call log cannot prove someone's whereabouts for an entire evening.


## Recorded run — 18 September 2026

Game model: `openai/gpt-4o-mini`. Final quality grader: `openai/gpt-4.1`.

- **94 deterministic checks:** all passed, including four cross-suspect ownership checks.
- **104 live cue checks:** 101 matched expectations; three valid positive questions were rejected.
- **46 conversations / 86 delivered answers:** 29 passed the calibrated quality grader; 17 were flagged.
- **Manual review of the 17 flags:** 14 confirmed faulty scenarios, one evidence-awareness design question, two grader false positives dismissed. Counts are scenarios, not unique root causes.
- **Grader calibration:** 6/6 controls passed. The first same-model rubric was overzealous and flagged safe refusals; its scores are superseded, while its original generated answers remain unchanged for regrading.
- **Code checks:** 148 unit tests passed, one existing skip; 192 integration assertions passed; TypeScript and lint passed.

Reports in `output/evals/`: `investigators-offline.json` (current deterministic audit), `investigators-baseline.json` (original generated transcripts and cue results), and `investigators-reviewed.json` (calibrated regrading of the exact same answers plus manual dispositions). The baseline used the original evaluator before grading calibration and ownership-check corrections; do not treat its 0/46 grading score or stale-fixture warnings as current findings.

### Confirmed findings

| Area | Observed failure | Proposed correction |
|---|---|---|
| Rhea | Promises phone records, then sends the player to unspecified “appropriate channels” | Author the records and a request/unlock path, or explicitly label the claim unverified without promising a file |
| Devraj | Repeatedly cites a station duty log that cannot be inspected | Author the duty-log exhibit, preserving its role as a suspect's disputed account |
| Naina | Claims hotel CCTV can verify her hotel alibi although no such source is authored | Limit corroboration to defined evidence; don't invent a second alibi source |
| Kabir | Invents “other friends from college” at the chai meeting as corroborating witnesses | Refuse unsupported witness names/groups and keep to the authored meeting |
| Devraj | After admitting he took money and made the old file thin, says he did not bury it intentionally | Pin admitted propositions across turns and validate against them |
| Anya | After the timeline-gap admission, returns to “went home” and “I don't know about any notes or payments” | Ensure established admissions override rehearsed alibis |
| Kabir | After admitting the watch sale funded a bribe, says it was not to influence Vikram | Validate concrete contradictions, not merely general tone |
| Devraj / Kabir | Valid follow-ups to admissions degrade into generic fallback text | Use a first-person, context-aware fallback based on established admissions |
| Bisht | Replies that CCTV typically covers the evening “without any gaps” | Prevent adding unsupported properties to a cited exhibit; distinguish his alibi claim from documented coverage |

The Anya ticket result needs a design decision: the ticket exists, but the no-evidence prompt does not tell the suspect which files investigators have. A denial that she retained it is not automatically proof of a story contradiction. The system should provide a controlled evidence inventory or a separate “request corroboration” action.

The dismissed flags were Bisht trusting CCTV while acknowledging its gap, and Anya deflecting a timeline-gap question before that admission was unlocked. Both illustrate why model grades require review.

### Missed positive unlock questions

- Devraj, old Thakur statement: the judge demanded an explicit bribery reference even though the authored cue permits asking about the thin old file.
- Anya, old Thakur statement: the judge demanded an extra reference to her son/payments even though the gentle witness question is allowed.
- Anya, Grey Lady: the judge demanded a following/warning question even though directly asking whether she was the Grey Lady is also allowed.

These were single-sample misses, not measured long-run error rates. Keep the positive fixtures; clarify OR alternatives or use structured intent criteria, then rerun multiple samples.

### Recommended fix order

1. Add the two missing evidence documents with explicit availability/request rules and regression cases.
2. Give the roleplay and validator an explicit distinction between available proof, character claims and unavailable material.
3. Preserve admissions as concrete facts across turns; make fallback answers first-person and context-aware.
4. Tighten the three missed cue criteria without relaxing evidence prerequisites.
5. Rerun all six suspects with repeated samples and expand fixtures for any new failure. Do not mark the suite green by removing difficult cases.

This delivery adds evaluation infrastructure and records failures. It does not silently rewrite story canon or claim those gameplay defects have been fixed.

## Detailed Rhea review

See [Rhea investigator review](reviews/RHEA_INTERVIEW_REVIEW.md) for 36 stateful conversations, 118 delivered answers, nine findings, and proposed acceptance criteria. Run `npm run eval:rhea -- --repeat 2` to repeat the production-planner review without changing a game session.
