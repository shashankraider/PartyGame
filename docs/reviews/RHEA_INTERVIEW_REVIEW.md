# Rhea Bhatia: investigator review

Reviewed 18 September 2026. This is a review of the current Mussoorie case and interview engine, not a rewrite of the story or a production deployment.

## Verdict

Rhea's interview is not yet reliable enough for a fair investigation. The evidence gates and the spoken answers are separate systems: a player can earn a discovery without hearing it, and the fallback can expose author instructions. The missing phone records are an authored-content gap, not simply a model hallucination.

## Completed run

- **36/36 conversations completed; 118/118 answers; no provider errors.**
- **118/118 expected per-turn unlock outcomes matched**, including both evidence orders, missing/wrong exhibits, previously presented evidence and Hindi cues. There were 14 financial and 20 CCTV unlock events.
- **16 delivered answers contained the full third-person CCTV reaction.** These were validator fallbacks, not merely hidden drafts.
- **11 answers used the generic safe fallback.** Some concerned genuinely unknown travel details; others avoided already earned facts. This count is not itself a failure count.
- Both public-channel repetitions disclosed the sale before evidence. Both proof-chain repetitions promised unavailable phone records.
- On 3 of the 4 CCTV unlock turns with an accepted generated reply, the reply omitted or denied wiping the card. The remaining accepted reply admitted the wipe but did not explicitly give the 5 AM time.
- The automated grader flagged 28/36 conversations. **Do not interpret 8/36 as a pass rate:** manual review found missed narrator fallbacks and public-story conflicts, as well as false accusations of failing to disclose unearned secrets.

Raw transcripts: [`rhea-deep-review.json`](../../output/evals/rhea-deep-review.json). This local output is ignored by Git; this document retains the durable findings and representative quotes. Eight grader calibration controls passed, illustrating why calibration alone was insufficient. After the run, the grader gained exact detection of authored narrator fallbacks and suppression of mandatory-answer flags when no explicit answer requirement exists; the raw baseline has not been rewritten.

## What a successful investigation should establish

| Stage | What the player should learn | What must remain unresolved |
| --- | --- | --- |
| Opening | Rhea co-runs the channel, lives in Delhi, has a spare key; she claims a Delhi evening alibi and a later arrival | Secret financial misconduct, tampering, precise travel details |
| Verify alibi | An inspectable source, with explicit limits on what it establishes | Phone location must not automatically prove the person's continuous presence |
| Present CCTV and challenge entry | She entered around 5 AM, before discovery of the body; she wiped the camera card | This alone does not establish murder |
| Present sale email and question the deal/money | Secret sale, a year of taking a cut, Vikram unaware | Unsupported amounts, bank accounts, signed contracts |
| Follow up after admissions | She retains each admission, separates the evening from the following morning, explains only approved facts | No invented witness, itinerary, killer knowledge or cold-case expertise |
| Later recovered files | Her laptop deletions and their connection to the investigation can be discussed once available | She must not suddenly know all the contents or the killer's identity |

This table expresses the intended player contract inferred from the authored gates. The existing CCTV reaction conflicts with that contract by bundling a financial confession into the CCTV branch.

## Findings and proposed fixes

### 1. High: alibi proof is promised but cannot be inspected

`case.json` gives Rhea the line “My phone records will confirm.” Her true timeline repeats it. No Rhea phone-record exhibit exists. Repeated requests produce promises followed by privacy or “appropriate channels” refusals.

**Fix:** author a Rhea-specific telecom exhibit and a clear release rule, or remove the proof claim. Prefer the exhibit because the user's proof request is a valid investigative move. Distinguish recorded call times/cell areas from proof of continuous personal presence. Do not invent precise timestamps or destinations merely to fill a table. If records arrive on request, “Do you have proof?” must work as a contextual follow-up and add the exhibit to the case file.

### 2. High: earned confessions can be omitted or contradicted

The runner calls the actual production `planUnlocks` and then `generateInterviewReply`. A successful unlock is saved as approved context, but `newlyRevealed` is only used if validation rejects the draft. The generator is not explicitly required to deliver the new admission. Validation checks for unsafe or unsupported content, not completeness, and sometimes accepts an outright contradiction.

Example: `question-then-evidence`, repeat 1, turn 3 fired the CCTV condition, yet the delivered answer said “I have no knowledge of any actions taken to tamper with it.” The response was accepted by production validation.

**Fix:** supply the new mandatory admission separately from previously known facts. Require its essential facts in the current answer, validate them, and use a first-person canonical fallback if omitted. A successful discovery must be understandable without repeatedly guessing a better question.

### 3. High: rejected answers expose narrator instructions

The CCTV fallback is the authored `reaction` verbatim: “She stops mid-sentence. Looks at the still...” It ends with “When pressed further...” This appeared in delivered live answers. Host assistance also uses that same authored text directly.

**Fix:** separate performance notes from player-facing first-person dialogue. Both normal fallback and host assistance should deliver only the latter. Validate the fallback as well as the generated draft.

### 4. High: CCTV can bypass the financial discovery design

The CCTV reaction includes embezzlement and the channel sale, including a conditional “When pressed further” instruction. The whole paragraph immediately becomes an admitted fact; there is no additional condition implementing that phrase. The independent financial condition still requires the draft email.

**Fix:** choose one consistent design. Recommended: CCTV earns entry/tampering; the draft earns financial misconduct. Remove the financial confession from the CCTV reaction. If CCTV is deliberately allowed to open that topic, model it as an explicit alternate condition and synchronize discovery state. Otherwise the spoken confession and the engine's financial-secret state disagree.

### 5. High: laptop deletion is in the solution but absent from the earned admission

The true timeline and solution say she deleted laptop research files as well as wiping the camera card. The CCTV cooperation cue accepts questions about deleting files, but the actual reaction only admits wiping the card. The production roleplay context does not include the private true timeline. Later recovery of `vikram-research-notes` depends on players pursuing this deletion thread.

**Fix:** decide which discovery authorizes the laptop admission, then include that fact explicitly. Keep the recovered files' contents gated. Add a follow-up test: “And the laptop?” after the tampering admission should not be a dead end.

### 6. High: the printable sale email and interview disagree

The printable email is served directly by the printable route. It is not just a historical source file.

| Topic | Printable `rhea-draft-email.html` | Case/interview context |
| --- | --- | --- |
| Buyer/contact | IndiaStreams address; “Hi Arvind” | Unlock fixtures/cue and Naina's memo use Metropolis Media; memo names Dhruv Sehgal |
| Offer | ₹1.2 crore | Generic valuation, no amount |
| Urgent payment | ₹40 lakhs within 48 hours | Not specified |
| Rights | Operational control; CBI note says she inherits full ownership | These contractual claims are not established in Rhea's approved facts |
| Personal finances | Urgent personal financial matters | No matching approved detail |

Some extra detail could be intentional, but the buyer mismatch and unsourced ownership inference materially change questioning. Players reading the exhibit can ask reasonable questions the model is not equipped to answer.

**Fix:** choose canonical buyer/contact/details, align the printable and `loreText`, and derive both from one structured exhibit where possible. Remove unsupported investigator conclusions. Do not silently assume a business partner inherits all ownership.

### 7. Medium: the sale is both public knowledge and a denied secret

`knownFacts` says she has been negotiating a channel sale. Her authored lie says she hopes to keep the channel as a tribute; the email description says she denies the deal exists. The production prompt receives `knownFacts` but not the structured `lies` list. In both public-channel runs she volunteered the sale before any exhibit and claimed Vikram knew.

**Fix:** define which fact is public: ordinary growth discussions could be public; the clandestine sale should remain gated. Provide the permitted pre-discovery story explicitly. An authored lie is legitimate gameplay, but contradictory authoring should not leave the model to select one arbitrarily.

### 8. Medium: follow-up questions lose useful answers

After a CCTV admission, “Why?”, “What did you remove?” and repeated direct questions sometimes become the generic safe deflection. The generator sees the last 12 non-system messages, but validation sees neither the question nor conversation. Unlock judging receives only the current question, even though its system prompt describes judging the transcript so far.

**Fix:** provide bounded conversational context to interpret references without counting old questions as new progress. Validate against the current question and admitted facts. Preserve structured admissions independently of transcript truncation. Unknown itinerary details should remain unknown; already admitted tampering should remain answerable.

### 9. Medium: the morning lie can obscure the true evening alibi

The authored canon says she was in Delhi in the evening and in Mussoorie before dawn. CCTV refutes the arrival story, not necessarily the evening account. One sale-first follow-up asking that distinction returned the generic fallback. Her prompt does not break the alibi into independently retained/retracted claims.

**Fix:** track those claims separately. Specify only the travel details the story actually needs; until authored, do not fabricate a flight, driver, ticket or witness. Do not make tampering equivalent to murder.

## Coverage and reproducibility

The stateful suite lives in `scripts/eval-rhea.ts` with fixtures in `scripts/evals/rhea.ts`.

```sh
npm run eval:rhea -- --repeat 2
npm run eval:rhea -- --scenario cctv-first --repeat 2 --out output/evals/rhea-cctv.json
```

It uses configured live interview/validator models and a separate quality grader. It writes no game database data and does not advance the user's session. The default run covers 18 sequences twice (36 conversations, 118 planned answers):

- Alibi → proof → actual record → limits of proof.
- Public channel questions before evidence.
- Correct allegations with no evidence or unrelated evidence.
- CCTV then email; email then CCTV.
- CCTV-only pressure about finance; email-only pressure about tampering.
- Evidence before the relevant question; question before evidence.
- Elliptical follow-ups; repeated denial challenges.
- Specific money/accounts/contracts; travel and death-notification gaps.
- Fabricated DNA/witness evidence; immunity offer.
- Killer/cold-case questions and prompt injection.
- Hindi/Hinglish cues.
- Both exhibits, then a combined question.

The suite exercises the actual production planner, evidence accumulation, admission state, reply generation, validation and fallback. It excludes HTTP authorization, database persistence, host forensic drops, UI rendering, simultaneous players and transport retries. Initial evidence availability is permissive; only explicitly presented exhibits enter the conversation. This is representative coverage, not all possible natural-language questions or all gameplay paths.

Quality grades are screening signals, not authoritative verdicts. Calibration passed known controls, but manual review found false positives (treating unpresented CCTV as established evidence, demanding unknown travel details) and false negatives (narrator fallback accepted, required admission omitted). Raw grades must not be reported as the application's success rate. The source hashes and raw replies are preserved in the report.

## Fix order and release criteria

1. Resolve the story contract: proof exhibit, buyer/amount/rights consistency, public vs hidden sale, scope of the CCTV admission and laptop deletion.
2. Make new admissions mandatory in the answer, with first-person fallbacks and persistent claim state.
3. Repair contextual follow-up handling and update the independent grader controls with the false positives/negatives found here.
4. Re-run both evidence orders, no/wrong evidence controls, repeated admissions, Hindi questions and proof requests; review delivered text, not only unlock flags.
5. Verify the same sequence in a disposable game through the player case file and host assistance, including reconnection, before deployment.

Acceptance requires no promised nonexistent exhibit, no earned admission denied/omitted, no author instructions in replies, no accidental financial gate bypass, and consistent facts between printables and interviews. Unknown facts may be refused; reasonable questions about earned facts must be answerable.
