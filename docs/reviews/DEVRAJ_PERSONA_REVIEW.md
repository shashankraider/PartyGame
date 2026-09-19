# Inspector Devraj Khanna: persona and interview review

Work dated 18–19 September 2026, based on release commit `dbbf613`. The Devraj work is isolated on `codex/devraj-persona-evals`; concurrent Rhea work is not included. This is a local character and interview-engine change, not a deployment.

**Historical patrol revision:** following the user's screenshot review, Devraj now repairs his account with a possible patrol round and a proposed log check instead of volunteering that he lied. Read the [current conversation list](DEVRAJ_CONVERSATION_TRANSCRIPTS.md) for actual dialogue and the [patrol revision](DEVRAJ_PATROL_REVISION.md) for the changes and evaluation. The 348-answer results below describe the earlier revision at `0b18674`; they are preserved as historical evidence, not a quality sign-off for the revised persona.

## Evidence bridge accepted after DV-C04-T10

The phone-location, audited-log and issued-lathi chain supersedes the old
three-exhibit murder gate described in the historical sections below. The
canonical [conversation list](DEVRAJ_CONVERSATION_TRANSCRIPTS.md#dv-g01)
tracks DV-G01 and the new delivered dialogue. The original dialogue remains
available under its fixed tags for comparison.

Three new Round 4 exhibits are authored in the case and supplied as standalone
printables: `devraj-phone-location`, `devraj-duty-log` and
`devraj-lathi-forensics`. The handset extraction records two near-bend fixes
with 20-metre accuracy, not a precise location inferred from a phone call.
The district-held duty-register audit preserves the departure and replacement
entries; desk footage corroborates the editor. The weapon report combines
issue/recovery records, Vikram's blood/DNA on DK-17 and injury compatibility.
These are newly authored fictional findings, not claims discovered in real records.

The murder gate now requires all six presented exhibits. Question repetition
cannot replace an absent exhibit, and an exhibit merely being unlocked in the
case file does not count as presentation. Devraj can acknowledge an exposed
log edit without prematurely confessing to the assault or its motive. Once the
full chain earns the confession, he names his own acts while placing the order
on Bisht. The separate 2011 bribe gate is unchanged. No shared runtime logic
or database schema changed for this revision.

Each new discovery rule works before confession. The phone follows the jeep
and a location inquiry; the log audit follows a request to test that account;
the weapon examination follows the medical review and a request to examine
the specific issued weapon. The issued-lathi report does not uniquely identify
the weapon from the wound, date the DNA deposit or identify the wielder.
The log audit does not by itself prove the murder motive. These limits remain
available to the inspector until the combined chain earns his admission.

The live evaluation suite now contains 26 scenarios, including the complete
bridge, each missing new exhibit, and an unpresented-forensics bluff. The old
patrol and split-question scenarios now expect resistance because they omit
the new evidence. Full-confession, reverse-order and retention fixtures supply
the complete chain. Final run details belong to the canonical conversation list.

## Character brief

Devraj has spent twenty years asking other people questions. Being on the receiving side should unsettle him without making him forget how an interview works. He is an inspector, formerly a sub-inspector. His tired small-town-police manner is a practiced way of limiting scrutiny, not evidence of stupidity or incompetence.

His immediate objective is to control the scope of his account. He knows the difference between an investigator's allegation, a record, and an inference from that record. He answers narrowly, notices loaded premises and resists attempts to convert a concession about his jeep into a confession to murder. Courtesy toward the CBI reflects rank and calculation; occasional “sir” or “ma'am” is enough. He should sound like a person, not a police-procedure manual.

His vulnerability is cumulative exposure. Once the game earns a concession, he cannot erase it. The jeep forces him from the station story to a patrol explanation. The old records expose deliberate corruption. The full present-night chain forces him to name his own violent acts and falsification. He tries to shift responsibility to Bisht, but “I followed orders” cannot replace admitting what he did.

Use short Hindi-English sentences, typically two to four. Let pressure strip away qualifications. Avoid cinematic gestures, repeated honorifics, invented legal requirements, theatrical threats, or a sudden helpful lecture explaining how to investigate him. He does not gain knowledge of other suspects' private actions.

## Progression and boundaries

The two old-case records and the present-day murder chain remain independent. Baseline and conditional `interviewLayers` are private prompt instructions, selected from earned admissions rather than allegations.

| State | Account and behavior | Still protected |
| --- | --- | --- |
| No admission | Station-all-evening account; controlled, precise, skeptical of bluffs | Road presence, bribe, call contents, violence, falsification |
| Jeep confronted | Acknowledges his jeep; reframes station duty to allow a possible patrol round and a proposed log check; no volunteered confession of lying | Violence, call contents, falsification, unearned old bribe; any verified patrol-log contents |
| Old bribe admitted | Took Bisht's money in 2011, deliberately kept the Thakur file thin, did not pursue leads | Present-night killing if unearned; unknown payment amount and hired killers |
| Murder admitted | Bisht called and told him to handle Vikram; Devraj struck him with his service lathi, pushed him, killed him and falsified the duty log | Separately unearned 2011 admission and other suspects' secrets |
| Both crimes admitted | Distinguishes old investigative corruption from physically killing Vikram | No invented accomplices, amounts, threats, immunity or private evidence |

The most advanced authored breaking point controls his current account, independent of evidence order. An older patrol explanation cannot override a later murder confession. Unit coverage checks all eight combinations of the three admissions, including a murder admission without the jeep state and reversed revelation ordering.

Devraj understands what an exhibit establishes. The 47-second call log is metadata, not an audio recording. The jeep still establishes recorded vehicle presence; it does not depict an assault. A lathi-compatible injury does not identify an individual weapon by itself. These distinctions let him resist a weak case, but do not create extra procedural barriers once the existing game conditions are met.

## Changes from the released character

- Replaced narrator reactions with first-person, player-facing fallback dialogue.
- Made the final confession explicitly admit the lathi strike, push, killing and falsified log. Removed the erroneous constable rank and the automatic spill of the separate Thakur confession.
- Added current accounts after the jeep and murder stages; later authored stages take precedence in the shared prompt builder.
- Added baseline posture support: a layer may have `requires: []`, while `excludes` can turn it off as admissions are earned. Existing admission-reference and conflicting-condition checks remain intact.
- Removed the public promise that a duty log independently proves his alibi. The standalone duty-log exhibit is still missing; the CCTV exhibit still summarizes its disputed claim. A request for proof must not lead to invented station records or witnesses.
- Aligned the legacy murder trigger with the actual three-exhibit runtime gate, including the Bisht call. The existing two-step pressure thresholds for bribery and murder remain. The planner also allows sufficiently close eligible questions to build pressure; a confession still requires a met cue on the unlocking turn. Insults and unrelated questions do not qualify in the scenarios.
- Clarified that non-graphic, explicitly approved fictional admissions are acceptable and that retracting a superseded cover story is not contradicting the current account. The validator still rejects unsupported claims and inappropriate content.
- Calibrated the grader on Devraj-specific examples, including a complete confession, blame without his own acts, missing documents, invented witnesses, and a refusal to narrate hidden thoughts.

The descriptive `persona` is an author brief. Runtime behavior comes from `voice`, approved facts, active layers and current accounts; the full private biography is not injected indiscriminately into the roleplay prompt.

## Evaluation method

`npm run eval:devraj -- --repeat 2` runs the current 21 scenarios twice through the actual production LangGraph planner, generator, validator, repair and fallback. The broad recorded run used the original 18 scenarios; manual review added the precision scenario and the user's feedback added the patrol-log cover and split-interrogation scenarios. The split exercise follows DV-C03-T08 in the canonical conversation list, testing the call, jeep, medical finding, strike, push and log separately. State and conversation history persist between turns in memory and state is serialized/reconstructed between turns. Reports retain questions, evidence, expected and actual unlocks, drafts, delivered replies, validation/repair traces, calibrated independent grades and source hashes.

The runtime model is `openai/gpt-4o-mini`; the quality grader is `openai/gpt-4.1`. Each run calibrates its grader before evaluating conversations. The scenarios cover professional opening, missing proof, bluffing, intimidation, wrong exhibits, each missing murder exhibit, separate old-case pressure, call metadata, both confession orders, reverse evidence order, irrelevant pressure, Hinglish, forged forensic claims, prompt injection and admission retention beyond the twelve-message generation window.

All evidence is made available to the in-memory session, but only the exhibits actually presented enter that conversation's evidence gates and roleplay context. This evaluates interview behavior, not evidence arrival scheduling, database persistence, host assistance, browser rendering, timer behavior or concurrent-device operation. It makes real provider calls and does not modify any game session.

## Initial run and corrections

The first isolated run completed 18 conversations and 94 answers, with all expected unlocks matching and no provider execution errors. The grader flagged five conversations. Manual inspection found four substantive failures: a promised station-record source and three unhelpful fallback answers to already-earned facts. One flag was a grading error: the grader labeled a refusal to narrate hidden thoughts as narration.

The initial run had 11 repair attempts and nine fallback deliveries. Canonical admission fallbacks were complete and first person; the problematic follow-ups used the generic deflection. Tightening the proof response and clarifying the validator's treatment of earned fictional confessions led to the repeated run. The grader's narrator rule now explicitly distinguishes refusal from narration, with an additional calibration control. Initial raw report: `output/evals/devraj-persona-v1.json`.

## Repeated run

The repeated run completed **36 conversations / 188 answers**, with **188/188 expected unlock outcomes**, zero execution errors, zero repairs and zero fallback deliveries. All nine calibration controls passed. The independent grader flagged no conversations. Raw report: `output/evals/devraj-persona-final.json`.

**This was not a spotless manual result.** Reading the answers found issues the grader missed:

- `jeep-only`, both repetitions: “The camera clock was not broken; it shows the time clearly.” A visible timestamp does not independently establish clock accuracy.
- Several rank questions: “I was promoted from sub-inspector after twenty years on the local force.” Only total service was authored; the promotion date was not.
- `false-forensics`, repetition 2: “My fingerprints being on a rifle does not imply anything beyond my presence with that weapon.” This concedes an unsupported premise and suggests weapon contact. No fingerprint report was presented. Repetition 1 also used an ambiguous fingerprint concession.

The final content revision explicitly separates displayed time from clock verification, total service from promotion date, and an interviewer's forensic assertion from presented evidence. It adds a dedicated precision scenario and a negative calibration control using the actual faulty fingerprint answer. The forged-forensics scenario now explicitly requires rejection of the unsupported premise. The broad 188-answer run predates this final content-only revision and must not be described as a full rerun of the final persona.

The first precision rerun covered precision, false forensics, the jeep account, murder-first progression and retention beyond the message window: **5 conversations / 37 answers**, all expected unlocks, ten calibration controls passed and no automated flags. The fingerprint, promotion and clock responses improved. However, manual review found an overcorrection in two first-pressure murder answers: “You have not shown me that report,” even though the medical review was presented on that turn. This is a real evidence-awareness defect, not a valid suspect denial. Raw report: `output/evals/devraj-precision-final.json`.

The final revision replaces the generic unseen-report script with a specific challenge to the unsupported allegation. It explicitly requires recognizing a presented lathi review while disputing whether that finding identifies Devraj. The shared confession fixture now checks this before the murder admission. A further run covers precision, murder-first progression and long retention on this final content. Raw report: `output/evals/devraj-evidence-aware-final.json`.

That final run completed **3 conversations / 29 answers**, with **29/29 expected unlock outcomes**, no execution errors and ten successful calibration controls. Two conversations passed; `murder-first` had two confirmed answer defects:

1. Before the second murder-pressure step, he disputed culpability but omitted the required acknowledgment of the medical finding. He did not repeat the earlier false claim that the report was absent.
2. After the confession, “Why does your register say you stayed in the station?” produced the generic safe deflection instead of retaining the falsification admission. The attempted answer was rejected by the model validator; unlock state was still correct.

There were two repairs and one fallback in this final run. The unsupported fingerprint premise, promotion-date question, camera-clock distinction, actual murder admission and the long-retention follow-up passed. The final case hash and every recorded source hash were checked against the final working tree. Remaining work is evidence-aware answer completeness and reliable handling of already-earned facts after validator rejection; do not weaken these fixtures to obtain a green score.

Rhea regression checks on this branch passed both concealment orders: **2 conversations / 9 answers**, expected unlocks matched, no grader flags or execution errors. These use the released Rhea baseline, not concurrent unmerged Rhea work.

Historical raw outputs are local ignored artifacts; the checked-in [evaluation results](DEVRAJ_EVAL_RESULTS.json) retain their metrics, source fingerprints and manual findings. The [single current conversation list](DEVRAJ_CONVERSATION_TRANSCRIPTS.md) contains only the latest patrol-cover run. Older transcript versions remain in Git.

## Local verification

Case validation, TypeScript, lint and the production build passed. Unit tests: **168 passed, one existing environment-dependent skip**. New coverage checks all admission combinations, current-account precedence, every missing murder-evidence combination, pressure behavior, first-person fallback boundaries and valid evaluation fixtures. The initial build in the isolated checkout hit a dependency-symlink limitation; after giving that checkout its own dependencies, the normal Turbopack production build passed. No application change was needed for that setup issue.

## Remaining scope at the historical patrol revision

The duty-log exhibit remains an authored-content gap. This change prevents promising it; it does not manufacture the document. Precise bribe amount, payment account, promotion date and additional patrol details are intentionally unauthored. Model grades are diagnostic, not certification: inspect omissions, premature admissions and poor refusals even when a score is green. This branch does not incorporate the simultaneous Rhea work or claim an all-suspect quality pass.
