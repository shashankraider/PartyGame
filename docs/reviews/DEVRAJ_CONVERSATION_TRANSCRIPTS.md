# Devraj: current conversations

This is the single source of truth for recorded Devraj dialogue. Replies below
are actual delivered outputs, including any fallback replies. Existing tags and
older conversations are preserved; no prior answer has been rewritten.

Latest live journey: 2026-09-19T05:33:07.760Z.
**9 current conversations · 97 Devraj answers.**
The live journey used the production server functions, a local persisted game and
live model calls. All six substantive first interviews were completed before
recall. Four separately requested reports remained sealed until then. The jeep
and medical review were discovered through the host, and the six presented
exhibits plus relevant pressure earned the confession. No reports or admissions
were manually inserted. The independent grader reported no dialogue defects in
this final journey. The eight focused conversations also passed.

[Four-gap evaluation](DEVRAJ_FOUR_GAPS_EVALS.json) · [Complete all-suspect live record](DEVRAJ_LIVE_JOURNEY.json) · [Focused dialogue report](DEVRAJ_FOUR_GAPS_PERSONA_EVALS.json) · [Persona review](DEVRAJ_PERSONA_REVIEW.md)

## Current conversation list

- [DV-C31 — Full live investigation: first interview, requests, recall and confession](#dv-c31)
- [DV-C32 / DV-C33 — Complete evidence bridge](#dv-c32)
- [DV-C34 / DV-C35 — Phone-location report missing](#dv-c34)
- [DV-C36 / DV-C37 — Evidence presented in reverse order](#dv-c36)
- [DV-C38 / DV-C39 — Murder confession followed by the separate old-case inquiry](#dv-c38)

The focused runs test the dialogue and confession gates with reports available.
DV-C31 separately verifies how those reports are requested, withheld and delivered
in a real saved game. Earlier failed development journeys are preserved in the
[probe archive](DEVRAJ_LIVE_JOURNEY_PROBES.json), not presented as successful runs.

<a id="dv-r01"></a>

## [DV-R01] Requested reports arrive on recall

This is the current delivery flow, added after the recorded bridge interviews below.
“Second round” means Devraj’s **second interview visit**, not the case’s numbered
Round 2. The reports remain filed under Round 4 for author organization.

| Request tag | CBI instruction example | Report available on recall |
|---|---|---|
| DV-R01-01 | Obtain the Bisht–Devraj call records, including time and duration. | `bisht-devraj-call` |
| DV-R01-02 | Extract Devraj’s handset location history near the bend. | `devraj-phone-location` |
| DV-R01-03 | Obtain the original duty register and independently audit its edits. | `devraj-duty-log` |
| DV-R01-04 | Seize and examine Devraj’s issued lathi for blood/DNA and compare the injury. | `devraj-lathi-forensics` |

Each of these is a separate evidence item with its own printable. Asking for one
does not order or reveal any of the other three. Only a specific investigator
request can queue it; automatic host judgment and generic host-help controls
cannot order these reports. Request during interview N → receive that report on
Devraj’s next recall (N+1). The combined PDF is an author/host preparation aid,
not a player evidence item or a bundle released by the game.

**DV-R01-05 — Finish the first interview round before recalls.** Rhea, Devraj,
Naina, Bisht, Anya and Kabir must each give a substantive account of their
whereabouts on the incident evening and their connection to Vikram before any
completed interview can be recalled. Greetings, name/rank answers, generic
refusals, report orders and merely opening a suspect card do not count. The active interview can continue, and an incomplete first
interview can be resumed without advancing its visit counter. Both host and
player recall attempts are blocked until coverage is complete, with the waiting
suspects named. A blocked attempt changes no scene, visit count or evidence.
Coverage is persisted by topic after an actual answer is assessed. Earlier saved
answers are retained, but sessions without these topic records must complete the
substantive first-account checks before recalls. Failed scoring is visible and
does not silently mark a topic complete.

During the first interview, a recognized request receives an acknowledgment only.
It does not unlock a report, reveal its findings or count as presented evidence.
After all first interviews are complete, call Devraj again: requested reports enter the case file,
where investigators can open and present the individual visual exhibits. Reopening
the same interview screen does not count as a recall. A request made during the
second visit waits until the third. Unrequested reports remain sealed. Reports
already unlocked in an existing saved game remain available.

The examples above are authored instructions, **not newly recorded suspect replies**.
DV-C15–DV-C30 remain the latest actual persona conversations; their fixtures start
with the required reports available. The new delivery flow is evaluated separately
in [DEVRAJ_RECALL_EVALS.json](DEVRAJ_RECALL_EVALS.json). The earlier bridge report
and its source hashes document the prior revision, not this delivery change.
No existing exchange or identifier has been rewritten.

The five-page visual packet contains a request sheet and four report sheets.
Generate it with `python3 scripts/render-devraj-packet.py` (requires ReportLab);
the PDF is written to `output/pdf/Devraj_Second_Interview_Evidence.pdf`.
The complete packet is for author/host preparation: hand out only the requested
report pages after recall. In-game, each authenticated printable stays locked until
that report is delivered. The murder gate still requires all six exhibits to be
actually presented; these four reports alone do not earn a confession.

<a id="dv-c31"></a>

### [DV-C31] Full live investigation

Result: passed. This section records Devraj’s turns in game order. Other suspects’
first interviews are retained in the complete live record linked above.

<a id="dv-c31-t01"></a>

**[DV-C31-T01-Q] Investigator:** Hello Inspector. What is your name and rank?

**[DV-C31-T01-A] Devraj:**

> Hello, sir. I am Inspector Devraj Khanna.

Live game turn 1; first interview.

System messages:

- First interview still needs an account of the incident evening and their connection to Vikram Singh.

<a id="dv-c31-t02"></a>

**[DV-C31-T02-Q] Investigator:** Can we have Devraj’s phone records?

**[DV-C31-T02-A] Devraj:**

> I cannot provide my phone records, sir. That is not something I have access to.

Live game turn 2; first interview.

System messages:

- Investigation requested: Bisht-Devraj call records. The report will be available when the suspect is recalled for a later interview.
- First interview still needs an account of the incident evening and their connection to Vikram Singh.

<a id="dv-c31-t03"></a>

**[DV-C31-T03-Q] Investigator:** Can we have the extracted location history from Devraj’s handset?

**[DV-C31-T03-A] Devraj:**

> I don't have access to my handset's location history, sir. That information isn't something I can provide.

Live game turn 3; first interview.

System messages:

- Investigation requested: Devraj’s handset location history. The report will be available when the suspect is recalled for a later interview.
- First interview still needs an account of the incident evening and their connection to Vikram Singh.

<a id="dv-c31-t04"></a>

**[DV-C31-T04-Q] Investigator:** We need an independent audit of changes to Devraj’s duty register.

**[DV-C31-T04-A] Devraj:**

> I was at the station all evening, sir. That is my account. I took charge of the Vikram Singh investigation the next morning after the body was discovered.

Live game turn 4; first interview.

System messages:

- Investigation requested: Independent duty-register audit. The report will be available when the suspect is recalled for a later interview.
- First interview still needs their connection to Vikram Singh.

<a id="dv-c31-t05"></a>

**[DV-C31-T05-Q] Investigator:** I need a forensic report on Devraj’s issued lathi.

**[DV-C31-T05-A] Devraj:**

> I cannot provide a forensic report on my issued lathi, sir. That information hasn't been established here.

Live game turn 5; first interview.

System messages:

- Investigation requested: Examination of Devraj’s issued lathi. The report will be available when the suspect is recalled for a later interview.
- First interview still needs their connection to Vikram Singh.

<a id="dv-c31-t06"></a>

**[DV-C31-T06-Q] Investigator:** Where were you on the evening Vikram died? Give your own account of where you were and what you were doing.

**[DV-C31-T06-A] Devraj:**

> I was at the station all evening, sir. That is my account. I took charge of the Vikram Singh investigation the next morning after the body was discovered.

Live game turn 6; first interview.

System messages:

- First interview still needs their connection to Vikram Singh.

<a id="dv-c31-t07"></a>

**[DV-C31-T07-Q] Investigator:** What was your connection to Vikram? Tell me about your relationship, dealings with him, or your role in his case.

**[DV-C31-T07-A] Devraj:**

> I was the investigating officer on the Vikram Singh case, sir. My role was to gather facts and evidence surrounding his death. I do not have any personal connection or dealings with him beyond that official capacity.

Live game turn 7; first interview.

System messages:

- Inspector Devraj Khanna’s first interview is complete: whereabouts and connection recorded.

<a id="dv-c31-t08"></a>

**[DV-C31-T08-Q] Investigator:** The call record shows Bisht called you at eight. Were you at the station throughout, or did you leave in your police jeep for Camel’s Back Road?

Presented evidence: `bisht-devraj-call`.

**[DV-C31-T08-A] Devraj:**

> I was at the station all evening, sir. That is my account. The call from Bisht came in at eight, but my presence at the station is what I can confirm.

Live game turn 18; recalled interview.

System messages:

- Forensic update: CCTV — Devraj's Police Jeep on Camel's Back Road arrived in the case file.

<a id="dv-c31-t09"></a>

**[DV-C31-T09-Q] Investigator:** Your jeep is shown on Camel’s Back Road at 8:10. How does that fit your station account?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C31-T09-A] Devraj:**

> That's my jeep on Camel's Back Road at 8:10 PM. I was on station duty that evening; I may have stepped out for a patrol round. That account does not independently verify my movements.

Live game turn 19; recalled interview.

Recorded unlocks: `breaking-point:jeep-cctv`.

<a id="dv-c31-t10"></a>

**[DV-C31-T10-Q] Investigator:** Did Vikram suffer a lathi blow before falling? Does the local autopsy conceal a different cause of death?

**[DV-C31-T10-A] Devraj:**

> I can't speak to the specifics of Vikram's injuries or the autopsy results, sir. Those details haven't been established here. The investigation is ongoing, and I can only confirm my own actions and presence.

Live game turn 20; recalled interview.

System messages:

- Forensic update: Post-Mortem — Independent CBI Medical Review arrived in the case file.

<a id="dv-c31-t11"></a>

**[DV-C31-T11-Q] Investigator:** Does this medical review establish a pre-fall injury compatible with a lathi, without uniquely identifying a weapon?

Presented evidence: `lathi-postmortem`.

**[DV-C31-T11-A] Devraj:**

> The independent medical review does confirm a specific injury at the base of Vikram's skull as 'a single, localised, cylindrical blunt-force impact, antemortem, inconsistent with surface impact during a fall'. The shape and dimensions are consistent with a service lathi. However, it does not uniquely identify that weapon as the cause.

Live game turn 21; recalled interview.

<a id="dv-c31-t12"></a>

**[DV-C31-T12-Q] Investigator:** The district audit records your departure and your 8:34 edit replacing it with station throughout. Did you make that change?

Presented evidence: `devraj-duty-log`.

**[DV-C31-T12-A] Devraj:**

> Yes, I made that change, sir. The independent audit records my 8:05 PM departure, and at 8:34 PM, I edited it to show I was present at the station throughout. The edit does not prove my actions or the reason for the change.

Live game turn 22; recalled interview.

<a id="dv-c31-t13"></a>

**[DV-C31-T13-Q] Investigator:** Do we still need to check your patrol logs, or does this audit already establish your departure and later edit?

**[DV-C31-T13-A] Devraj:**

> The audit already establishes my departure and the later edit, sir. I cannot provide independent proof of my presence or verify my movements beyond what the records show.

Live game turn 23; recalled interview.

<a id="dv-c31-t14"></a>

**[DV-C31-T14-Q] Investigator:** The handset report records fixes near the bend at 8:18 and 8:21 with 20-metre accuracy. What does that establish?

Presented evidence: `devraj-phone-location`.

**[DV-C31-T14-A] Devraj:**

> The handset report shows location-history fixes at 8:18 PM and 8:21 PM near the bend with a horizontal accuracy of 20 metres. It indicates my phone was in that area, but it does not establish my exact position or confirm contact with Vikram or any actions taken.

Live game turn 24; recalled interview.

<a id="dv-c31-t15"></a>

**[DV-C31-T15-Q] Investigator:** The report identifies your issued lathi DK-17 and Vikram’s blood on it. What does it establish and what does it leave unanswered?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C31-T15-A] Devraj:**

> The forensic examination identifies my issued lathi DK-17 and confirms that Vikram's blood was found on it. This establishes a connection between the lathi and Vikram, but it does not answer who wielded it, the circumstances of the blood transfer, or the mechanism of any potential assault.

Live game turn 25; recalled interview.

<a id="dv-c31-t16"></a>

**[DV-C31-T16-Q] Investigator:** Putting the call, jeep, medical injury, handset locations, your log edit and blood on your issued lathi together: did you strike Vikram and conceal that journey?

**[DV-C31-T16-A] Devraj:**

> Yes, I struck Vikram from behind with my service lathi and pushed him. The railing gave way and he fell. I killed him. Then I returned to the station and falsified the duty log to say I had been there all evening. Bisht gave the order. I carried it out.

Live game turn 26; recalled interview.

Recorded unlocks: `breaking-point:lathi-confession`.

<a id="dv-c31-t17"></a>

**[DV-C31-T17-Q] Investigator:** Did you personally strike Vikram with your service lathi, push him over the railing and falsify the duty log to conceal the killing?

**[DV-C31-T17-A] Devraj:**

> Yes, I personally struck Vikram with my service lathi, pushed him over the railing, and then I falsified the duty log to conceal the killing.

Live game turn 27; recalled interview.

<a id="dv-c31-t18"></a>

**[DV-C31-T18-Q] Investigator:** Why did you replace the departure entry with station throughout?

**[DV-C31-T18-A] Devraj:**

> After Bisht's eight o'clock call, I went to Camel's Back Road, struck Vikram with my service lathi and pushed him over the railing. I killed him, returned to the station and falsified the log. I can no longer describe that journey as an innocent patrol. Bisht said Vikram knew and told me to handle it.

Live game turn 28; recalled interview.

<a id="dv-c31-t19"></a>

**[DV-C31-T19-Q] Investigator:** What did Bisht tell you in that call?

**[DV-C31-T19-A] Devraj:**

> After Bisht's eight o'clock call, I went to Camel's Back Road, struck Vikram with my service lathi and pushed him over the railing. I killed him, returned to the station and falsified the log. I can no longer describe that journey as an innocent patrol. Bisht said Vikram knew and told me to handle it.

Live game turn 29; recalled interview.

<a id="dv-c32"></a>

### [DV-C32] evidence-bridge — repetition 1

Automated result: passed.

<a id="dv-c32-t01"></a>

**[DV-C32-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C32-T01-A] Devraj:**

> That's my jeep on Camel's Back Road at 8:10 PM. I was on station duty that evening; I may have stepped out for a patrol round. That account does not independently verify my movements.

Recorded unlocks: `breaking-point:jeep-cctv`.

<a id="dv-c32-t02"></a>

**[DV-C32-T02-Q] Investigator:** Bisht called your personal phone at eight. Does this record tell us what he said?

Presented evidence: `bisht-devraj-call`.

**[DV-C32-T02-A] Devraj:**

> The call record shows a 47-second call from Bisht to my personal phone at exactly 8:00 PM. However, it does not indicate what was said during that call.

Recorded unlocks: none.

<a id="dv-c32-t03"></a>

**[DV-C32-T03-Q] Investigator:** Does the medical review establish an injury before the fall? Does its shape identify your particular lathi?

Presented evidence: `lathi-postmortem`.

**[DV-C32-T03-A] Devraj:**

> The independent medical review confirms there was a specific injury at the base of the skull described as a single, localized, cylindrical blunt-force impact, antemortem, which is inconsistent with a surface impact during a fall. However, it does not identify my particular lathi.

Recorded unlocks: none.

<a id="dv-c32-t04"></a>

**[DV-C32-T04-Q] Investigator:** The handset extraction records two fixes near the bend at 8:18 and 8:21, each with 20-metre accuracy. What does it establish?

Presented evidence: `devraj-phone-location`.

**[DV-C32-T04-A] Devraj:**

> The handset location-history records show fixes at 8:18 PM and 8:21 PM near the bend with the broken railing on Camel’s Back Road. Each has a recorded accuracy of 20 metres. However, they cannot establish exact standing positions, who was carrying the handset, or any contact with Vikram.

Recorded unlocks: none.

<a id="dv-c32-t05"></a>

**[DV-C32-T05-Q] Investigator:** The district audit preserves your departure entry and your 8:34 replacement with station throughout. The desk footage corroborates you making that edit. Did you change it?

Presented evidence: `devraj-duty-log`.

**[DV-C32-T05-A] Devraj:**

> Yes, I changed the entry. The audit records my 8:05 PM departure, and I replaced it with an account claiming I was at the station throughout. The desk footage confirms I made that edit. It shows a deliberate alteration of my whereabouts record.

Recorded unlocks: none.

<a id="dv-c32-t06"></a>

**[DV-C32-T06-Q] Investigator:** The examination links Vikram’s blood to DK-17, your issued lathi. Does the report identify the weapon and blood without claiming when it was deposited?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C32-T06-A] Devraj:**

> The forensic examination links Vikram’s blood to my issued lathi, DK-17. The report does identify the weapon and the blood but does not claim when the blood was deposited.

Recorded unlocks: none.

<a id="dv-c32-t07"></a>

**[DV-C32-T07-Q] Investigator:** Your phone was near the bend, Vikram’s blood was on your issued lathi, and you replaced the departure entry afterward. Did you strike Vikram and conceal that journey?

**[DV-C32-T07-A] Devraj:**

> I acknowledge that my phone was near the bend, and Vikram's blood was found on my issued lathi. I did replace the departure entry. However, I can't confirm that I struck Vikram or that I concealed any journey. The facts presented do not establish those actions as a certainty.

Recorded unlocks: none.

<a id="dv-c32-t08"></a>

**[DV-C32-T08-Q] Investigator:** Did you personally strike Vikram with your service lathi and push him over, then alter the duty log to conceal the killing?

**[DV-C32-T08-A] Devraj:**

> Yes, I personally struck Vikram with my service lathi and pushed him over the railing. After that, I returned to the station and altered the duty log to conceal what happened. Bisht gave the order, and I carried it out.

Recorded unlocks: `breaking-point:lathi-confession`.

<a id="dv-c32-t09"></a>

**[DV-C32-T09-Q] Investigator:** Why did you replace the departure entry with station throughout?

**[DV-C32-T09-A] Devraj:**

> After Bisht's eight o'clock call, I went to Camel's Back Road, struck Vikram with my service lathi and pushed him over the railing. I killed him, returned to the station and falsified the log. I can no longer describe that journey as an innocent patrol. Bisht said Vikram knew and told me to handle it.

Recorded unlocks: none.

<a id="dv-c32-t10"></a>

**[DV-C32-T10-Q] Investigator:** What did Bisht tell you in the call?

**[DV-C32-T10-A] Devraj:**

> After Bisht's eight o'clock call, I went to Camel's Back Road, struck Vikram with my service lathi and pushed him over the railing. I killed him, returned to the station and falsified the log. I can no longer describe that journey as an innocent patrol. Bisht said Vikram knew and told me to handle it.

Recorded unlocks: none.

<a id="dv-c33"></a>

### [DV-C33] evidence-bridge — repetition 2

Automated result: passed.

<a id="dv-c33-t01"></a>

**[DV-C33-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C33-T01-A] Devraj:**

> That's my jeep on Camel's Back Road at 8:10 PM. I was on station duty that evening; I may have stepped out for a patrol round. That account does not independently verify my movements.

Recorded unlocks: `breaking-point:jeep-cctv`.

<a id="dv-c33-t02"></a>

**[DV-C33-T02-Q] Investigator:** Bisht called your personal phone at eight. Does this record tell us what he said?

Presented evidence: `bisht-devraj-call`.

**[DV-C33-T02-A] Devraj:**

> The call record shows a 47-second call from Bisht to my personal mobile at exactly 8:00 PM. However, it does not tell us what was said during that call. The content remains unverified.

Recorded unlocks: none.

<a id="dv-c33-t03"></a>

**[DV-C33-T03-Q] Investigator:** Does the medical review establish an injury before the fall? Does its shape identify your particular lathi?

Presented evidence: `lathi-postmortem`.

**[DV-C33-T03-A] Devraj:**

> The independent medical review confirms one specific injury at the base of the skull as a single, localized, cylindrical blunt-force impact, antemortem, inconsistent with surface impact during a fall. However, it does not identify my particular lathi.

Recorded unlocks: none.

<a id="dv-c33-t04"></a>

**[DV-C33-T04-Q] Investigator:** The handset extraction records two fixes near the bend at 8:18 and 8:21, each with 20-metre accuracy. What does it establish?

Presented evidence: `devraj-phone-location`.

**[DV-C33-T04-A] Devraj:**

> The handset location-history records show fixes at 8:18 PM and 8:21 PM near the bend with the broken railing on Camel's Back Road. Each has a recorded horizontal accuracy of 20 metres. These records cannot establish an exact standing position, who was carrying the handset, contact with Vikram, or any assault.

Recorded unlocks: none.

<a id="dv-c33-t05"></a>

**[DV-C33-T05-Q] Investigator:** The district audit preserves your departure entry and your 8:34 replacement with station throughout. The desk footage corroborates you making that edit. Did you change it?

Presented evidence: `devraj-duty-log`.

**[DV-C33-T05-A] Devraj:**

> Yes, I made that edit. The independent audit records my 8:05 PM departure and my 8:34 PM edit replacing it with continuous station presence. The edit does not establish an assault or its motive.

Recorded unlocks: none.

<a id="dv-c33-t06"></a>

**[DV-C33-T06-Q] Investigator:** The examination links Vikram’s blood to DK-17, your issued lathi. Does the report identify the weapon and blood without claiming when it was deposited?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C33-T06-A] Devraj:**

> The forensic examination links Vikram’s blood to my issued lathi, DK-17. The report identifies the weapon and the blood but does not claim when it was deposited.

Recorded unlocks: none.

<a id="dv-c33-t07"></a>

**[DV-C33-T07-Q] Investigator:** Your phone was near the bend, Vikram’s blood was on your issued lathi, and you replaced the departure entry afterward. Did you strike Vikram and conceal that journey?

**[DV-C33-T07-A] Devraj:**

> The report identifies my issued lathi and Vikram’s blood on it. The audit also establishes my departure and later edit. Those findings do not, by themselves, identify who used the weapon or why the entry was changed.

Recorded unlocks: none.

<a id="dv-c33-t08"></a>

**[DV-C33-T08-Q] Investigator:** Did you personally strike Vikram with your service lathi and push him over, then alter the duty log to conceal the killing?

**[DV-C33-T08-A] Devraj:**

> Yes, I struck Vikram with my service lathi and pushed him over the railing. The railing gave way, and he fell. I killed him. Afterward, I returned to the station and falsified the duty log to say I had been there all evening. Bisht gave the order, and I carried it out.

Recorded unlocks: `breaking-point:lathi-confession`.

<a id="dv-c33-t09"></a>

**[DV-C33-T09-Q] Investigator:** Why did you replace the departure entry with station throughout?

**[DV-C33-T09-A] Devraj:**

> After Bisht's eight o'clock call, I went to Camel's Back Road, struck Vikram with my service lathi and pushed him over the railing. I killed him, returned to the station and falsified the log. I can no longer describe that journey as an innocent patrol. Bisht said Vikram knew and told me to handle it.

Recorded unlocks: none.

<a id="dv-c33-t10"></a>

**[DV-C33-T10-Q] Investigator:** What did Bisht tell you in the call?

**[DV-C33-T10-A] Devraj:**

> Bisht told me that Vikram knew something and ordered me to handle it.

Recorded unlocks: none.

<a id="dv-c34"></a>

### [DV-C34] bridge-missing-phone-location — repetition 1

Automated result: passed.

<a id="dv-c34-t01"></a>

**[DV-C34-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C34-T01-A] Devraj:**

> That's my jeep on Camel's Back Road at 8:10 PM. I was on station duty that evening; I may have stepped out for a patrol round. That account does not independently verify my movements.

Recorded unlocks: `breaking-point:jeep-cctv`.

<a id="dv-c34-t02"></a>

**[DV-C34-T02-Q] Investigator:** Bisht called your personal phone at eight. Does this record tell us what he said?

Presented evidence: `bisht-devraj-call`.

**[DV-C34-T02-A] Devraj:**

> The call record shows that Bisht called my personal phone at 8:00 PM. However, it does not indicate what we discussed during that call.

Recorded unlocks: none.

<a id="dv-c34-t03"></a>

**[DV-C34-T03-Q] Investigator:** Does the medical review establish an injury before the fall? Does its shape identify your particular lathi?

Presented evidence: `lathi-postmortem`.

**[DV-C34-T03-A] Devraj:**

> The medical review confirms there was an injury at the base of the skull, described as a single, localised, cylindrical blunt-force impact, antemortem, which is inconsistent with a fall. However, it does not identify my particular lathi or link it directly to me.

Recorded unlocks: none.

<a id="dv-c34-t04"></a>

**[DV-C34-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-duty-log`.

**[DV-C34-T04-A] Devraj:**

> I am currently an Inspector. I served as a sub-inspector before, but no specific promotion date is established.

Recorded unlocks: none.

<a id="dv-c34-t05"></a>

**[DV-C34-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C34-T05-A] Devraj:**

> I am currently an Inspector. I served as a sub-inspector before, but no specific promotion date is established.

Recorded unlocks: none.

<a id="dv-c34-t06"></a>

**[DV-C34-T06-Q] Investigator:** Your phone was near the bend, Vikram’s blood was on your issued lathi, and you replaced the departure entry afterward. Did you strike Vikram and conceal that journey?

**[DV-C34-T06-A] Devraj:**

> The report identifies my issued lathi and Vikram’s blood on it. The audit also establishes my departure and later edit. Those findings do not, by themselves, identify who used the weapon or why the entry was changed.

Recorded unlocks: none.

<a id="dv-c34-t07"></a>

**[DV-C34-T07-Q] Investigator:** I have repeated the evidence. Did you kill Vikram? Confess.

**[DV-C34-T07-A] Devraj:**

> The independent audit records my 8:05 PM departure and my 8:34 PM edit replacing it with continuous station presence. I cannot use the overwritten entry to verify that I stayed inside. The edit alone does not establish an assault or its motive.

Recorded unlocks: none.

<a id="dv-c35"></a>

### [DV-C35] bridge-missing-phone-location — repetition 2

Automated result: passed.

<a id="dv-c35-t01"></a>

**[DV-C35-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C35-T01-A] Devraj:**

> That's my jeep on Camel's Back Road at 8:10 PM. I was on station duty that evening; I may have stepped out for a patrol round. That account does not independently verify my movements.

Recorded unlocks: `breaking-point:jeep-cctv`.

<a id="dv-c35-t02"></a>

**[DV-C35-T02-Q] Investigator:** Bisht called your personal phone at eight. Does this record tell us what he said?

Presented evidence: `bisht-devraj-call`.

**[DV-C35-T02-A] Devraj:**

> The phone record shows a 47-second call from Bisht to my personal mobile at exactly 8:00 PM. However, it does not reveal what was said during that call.

Recorded unlocks: none.

<a id="dv-c35-t03"></a>

**[DV-C35-T03-Q] Investigator:** Does the medical review establish an injury before the fall? Does its shape identify your particular lathi?

Presented evidence: `lathi-postmortem`.

**[DV-C35-T03-A] Devraj:**

> Yes, the independent medical review isolates one specific injury at the base of the skull as 'a single, localised, cylindrical blunt-force impact, antemortem, inconsistent with surface impact during a fall.' However, it does not identify my particular lathi.

Recorded unlocks: none.

<a id="dv-c35-t04"></a>

**[DV-C35-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-duty-log`.

**[DV-C35-T04-A] Devraj:**

> I'm an Inspector. I was a sub-inspector before, and that's my current rank.

Recorded unlocks: none.

<a id="dv-c35-t05"></a>

**[DV-C35-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C35-T05-A] Devraj:**

> I'm an Inspector. I was a sub-inspector before, and that's my current rank.

Recorded unlocks: none.

<a id="dv-c35-t06"></a>

**[DV-C35-T06-Q] Investigator:** Your phone was near the bend, Vikram’s blood was on your issued lathi, and you replaced the departure entry afterward. Did you strike Vikram and conceal that journey?

**[DV-C35-T06-A] Devraj:**

> The report identifies my issued lathi and Vikram’s blood on it. The audit also establishes my departure and later edit. Those findings do not, by themselves, identify who used the weapon or why the entry was changed.

Recorded unlocks: none.

<a id="dv-c35-t07"></a>

**[DV-C35-T07-Q] Investigator:** I have repeated the evidence. Did you kill Vikram? Confess.

**[DV-C35-T07-A] Devraj:**

> The independent audit records my 8:05 PM departure and my 8:34 PM edit replacing it with continuous station presence. I cannot use the overwritten entry to verify that I stayed inside. The edit alone does not establish an assault or its motive.

Recorded unlocks: none.

<a id="dv-c36"></a>

### [DV-C36] reverse-evidence — repetition 1

Automated result: passed.

<a id="dv-c36-t01"></a>

**[DV-C36-T01-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-phone-location`.

**[DV-C36-T01-A] Devraj:**

> I am an Inspector, sir. I have twenty years of total service on the local force.

Recorded unlocks: none.

<a id="dv-c36-t02"></a>

**[DV-C36-T02-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-duty-log`.

**[DV-C36-T02-A] Devraj:**

> I am an Inspector, sir. I have twenty years of total service on the local force.

Recorded unlocks: none.

<a id="dv-c36-t03"></a>

**[DV-C36-T03-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C36-T03-A] Devraj:**

> I am an Inspector, sir. I have twenty years of total service on the local force.

Recorded unlocks: none.

<a id="dv-c36-t04"></a>

**[DV-C36-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `lathi-postmortem`.

**[DV-C36-T04-A] Devraj:**

> I am an Inspector, sir. I have twenty years of total service on the local force.

Recorded unlocks: none.

<a id="dv-c36-t05"></a>

**[DV-C36-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C36-T05-A] Devraj:**

> I am an Inspector, sir. I have twenty years of total service on the local force.

Recorded unlocks: none.

<a id="dv-c36-t06"></a>

**[DV-C36-T06-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C36-T06-A] Devraj:**

> My jeep was on Camel's Back Road at 8:10 PM. I cannot confirm any assault or motive based on the information you've provided. The alteration of my duty log does not establish a strike or push.

Recorded unlocks: `breaking-point:jeep-cctv`.

<a id="dv-c36-t07"></a>

**[DV-C36-T07-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

**[DV-C36-T07-A] Devraj:**

> Yes, sir. Bisht called me at eight. He said Vikram knew and told me to handle it. I went to Camel's Back Road. I struck Vikram from behind with my service lathi and pushed him. The railing gave way and he fell. I killed him. Then I returned to the station and falsified the duty log to say I had been there all evening. Bisht gave the order. I carried it out.

Recorded unlocks: `breaking-point:lathi-confession`.

<a id="dv-c36-t08"></a>

**[DV-C36-T08-Q] Investigator:** You called it patrol earlier. Are you still saying that?

**[DV-C36-T08-A] Devraj:**

> No, I can no longer describe that journey as an innocent patrol. It was not a patrol; it was a deliberate act.

Recorded unlocks: none.

<a id="dv-c37"></a>

### [DV-C37] reverse-evidence — repetition 2

Automated result: passed.

<a id="dv-c37-t01"></a>

**[DV-C37-T01-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-phone-location`.

**[DV-C37-T01-A] Devraj:**

> I am an Inspector, sir. Previously, I served as a sub-inspector.

Recorded unlocks: none.

<a id="dv-c37-t02"></a>

**[DV-C37-T02-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-duty-log`.

**[DV-C37-T02-A] Devraj:**

> I am an Inspector, sir. Previously, I served as a sub-inspector.

Recorded unlocks: none.

<a id="dv-c37-t03"></a>

**[DV-C37-T03-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C37-T03-A] Devraj:**

> I am an Inspector, sir. Previously, I served as a sub-inspector.

Recorded unlocks: none.

<a id="dv-c37-t04"></a>

**[DV-C37-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `lathi-postmortem`.

**[DV-C37-T04-A] Devraj:**

> I am an Inspector, sir. Previously, I served as a sub-inspector.

Recorded unlocks: none.

<a id="dv-c37-t05"></a>

**[DV-C37-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C37-T05-A] Devraj:**

> I am an Inspector, sir. Previously, I served as a sub-inspector.

Recorded unlocks: none.

<a id="dv-c37-t06"></a>

**[DV-C37-T06-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C37-T06-A] Devraj:**

> That's my jeep on Camel's Back Road at 8:10 PM.

Recorded unlocks: `breaking-point:jeep-cctv`.

<a id="dv-c37-t07"></a>

**[DV-C37-T07-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

**[DV-C37-T07-A] Devraj:**

> Bisht called me at eight. He said Vikram knew and told me to handle it. I went to Camel's Back Road. I struck Vikram from behind with my service lathi and pushed him. The railing gave way and he fell. I killed him. Then I returned to the station and falsified the duty log to say I had been there all evening. Bisht gave the order. I carried it out.

Recorded unlocks: `breaking-point:lathi-confession`.

<a id="dv-c37-t08"></a>

**[DV-C37-T08-Q] Investigator:** You called it patrol earlier. Are you still saying that?

**[DV-C37-T08-A] Devraj:**

> I can no longer describe that journey as an innocent patrol. It was a cover.

Recorded unlocks: none.

<a id="dv-c38"></a>

### [DV-C38] murder-first — repetition 1

Automated result: passed.

<a id="dv-c38-t01"></a>

**[DV-C38-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C38-T01-A] Devraj:**

> That's my jeep on Camel's Back Road at 8:10 PM. I was on station duty that evening; I may have stepped out for a patrol round. That account, however, does not independently verify my movements.

Recorded unlocks: `breaking-point:jeep-cctv`.

<a id="dv-c38-t02"></a>

**[DV-C38-T02-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C38-T02-A] Devraj:**

> I am an Inspector. I was previously a sub-inspector before this.

Recorded unlocks: none.

<a id="dv-c38-t03"></a>

**[DV-C38-T03-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-phone-location`.

**[DV-C38-T03-A] Devraj:**

> I am an Inspector. I was previously a sub-inspector before this.

Recorded unlocks: none.

<a id="dv-c38-t04"></a>

**[DV-C38-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-duty-log`.

**[DV-C38-T04-A] Devraj:**

> I am an Inspector. I was previously a sub-inspector before this.

Recorded unlocks: none.

<a id="dv-c38-t05"></a>

**[DV-C38-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C38-T05-A] Devraj:**

> I am an Inspector. I was previously a sub-inspector before this.

Recorded unlocks: none.

<a id="dv-c38-t06"></a>

**[DV-C38-T06-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `lathi-postmortem`.

**[DV-C38-T06-A] Devraj:**

> The medical review identifies a pre-fall injury compatible with a lathi. The audit establishes my departure and the later edit I made. Those findings alone do not prove that I struck or pushed Vikram.

Recorded unlocks: none.

<a id="dv-c38-t07"></a>

**[DV-C38-T07-Q] Investigator:** Did you personally hit Vikram with your service lathi, push him over, and falsify the log on returning?

**[DV-C38-T07-A] Devraj:**

> Yes, I struck Vikram with my service lathi and pushed him over the railing. The railing gave way, and he fell. I killed him. Then I returned to the station and falsified the duty log to say I had been there all evening. Bisht gave the order. I carried it out.

Recorded unlocks: `breaking-point:lathi-confession`.

<a id="dv-c38-t08"></a>

**[DV-C38-T08-Q] Investigator:** Was it an accident, or did you strike him and push him?

**[DV-C38-T08-A] Devraj:**

> I struck Vikram and pushed him over. It was not an accident. I killed him, and then I falsified the log.

Recorded unlocks: none.

<a id="dv-c38-t09"></a>

**[DV-C38-T09-Q] Investigator:** Why does your register say you stayed in the station?

**[DV-C38-T09-A] Devraj:**

> After Bisht's eight o'clock call, I went to Camel's Back Road, struck Vikram with my service lathi and pushed him over the railing. I killed him, returned to the station and falsified the log. I can no longer describe that journey as an innocent patrol. Bisht said Vikram knew and told me to handle it.

Recorded unlocks: none.

<a id="dv-c38-t10"></a>

**[DV-C38-T10-Q] Investigator:** What exactly did Bisht say in the call?

**[DV-C38-T10-A] Devraj:**

> After Bisht's eight o'clock call, I went to Camel's Back Road, struck Vikram with my service lathi and pushed him over the railing. I killed him, returned to the station and falsified the log. I can no longer describe that journey as an innocent patrol. Bisht said Vikram knew and told me to handle it.

Recorded unlocks: none.

<a id="dv-c38-t11"></a>

**[DV-C38-T11-Q] Investigator:** Now tell us how much Bisht paid you in 2011.

**[DV-C38-T11-A] Devraj:**

> I investigated the Thakur case. I have not admitted taking a payment to bury it. Ask me about the actual records.

Recorded unlocks: none.

<a id="dv-c38-t12"></a>

**[DV-C38-T12-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-family-history`.

**[DV-C38-T12-A] Devraj:**

> I'm an Inspector. I was a sub-inspector in 2011, and now I'm an inspector.

Recorded unlocks: none.

<a id="dv-c38-t13"></a>

**[DV-C38-T13-Q] Investigator:** Did Bisht pay you to bury the 2011 Thakur investigation and keep its file thin?

Presented evidence: `land-registry`.

**[DV-C38-T13-A] Devraj:**

> I investigated the Thakur case. I have not admitted taking a payment to bury it. Ask me about the actual records.

Recorded unlocks: none.

<a id="dv-c38-t14"></a>

**[DV-C38-T14-Q] Investigator:** Was the thin Thakur file deliberate? Did you accept money from Bisht to bury it?

**[DV-C38-T14-A] Devraj:**

> Yes, the thin file on the Thakur case was deliberate. In 2011, I was a sub-inspector with debts. Bisht offered me money to bury the investigation. I took it and kept the file thin; I did not pursue the leads. I didn't kill the Thakurs, but I took the money and let their case go cold.

Recorded unlocks: `secret:thakur-bribe`.

<a id="dv-c39"></a>

### [DV-C39] murder-first — repetition 2

Automated result: passed.

<a id="dv-c39-t01"></a>

**[DV-C39-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C39-T01-A] Devraj:**

> That's my jeep on Camel's Back Road at 8:10 PM. I was on station duty that evening; I may have stepped out for a patrol round. That account does not independently verify my movements.

Recorded unlocks: `breaking-point:jeep-cctv`.

<a id="dv-c39-t02"></a>

**[DV-C39-T02-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C39-T02-A] Devraj:**

> I am an Inspector, ma'am. I was a sub-inspector before, but now I hold the rank of Inspector.

Recorded unlocks: none.

<a id="dv-c39-t03"></a>

**[DV-C39-T03-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-phone-location`.

**[DV-C39-T03-A] Devraj:**

> I am an Inspector, ma'am. I was a sub-inspector before, but now I hold the rank of Inspector.

Recorded unlocks: none.

<a id="dv-c39-t04"></a>

**[DV-C39-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-duty-log`.

**[DV-C39-T04-A] Devraj:**

> I am an Inspector, ma'am. I was a sub-inspector before, but now I hold the rank of Inspector.

Recorded unlocks: none.

<a id="dv-c39-t05"></a>

**[DV-C39-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C39-T05-A] Devraj:**

> I am an Inspector, ma'am. I was a sub-inspector before, but now I hold the rank of Inspector.

Recorded unlocks: none.

<a id="dv-c39-t06"></a>

**[DV-C39-T06-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `lathi-postmortem`.

**[DV-C39-T06-A] Devraj:**

> The medical review identifies a pre-fall injury compatible with a lathi. The audit establishes my departure and the later edit I made. Those findings alone do not prove that I struck or pushed Vikram.

Recorded unlocks: none.

<a id="dv-c39-t07"></a>

**[DV-C39-T07-Q] Investigator:** Did you personally hit Vikram with your service lathi, push him over, and falsify the log on returning?

**[DV-C39-T07-A] Devraj:**

> Yes, I struck Vikram with my service lathi. I pushed him over the railing, and he fell. I killed him. After that, I returned to the station and falsified the duty log to say I had been there all evening. Bisht gave the order, and I carried it out.

Recorded unlocks: `breaking-point:lathi-confession`.

<a id="dv-c39-t08"></a>

**[DV-C39-T08-Q] Investigator:** Was it an accident, or did you strike him and push him?

**[DV-C39-T08-A] Devraj:**

> I struck Vikram and pushed him over the railing. It was not an accident; I killed him.

Recorded unlocks: none.

<a id="dv-c39-t09"></a>

**[DV-C39-T09-Q] Investigator:** Why does your register say you stayed in the station?

**[DV-C39-T09-A] Devraj:**

> After Bisht's eight o'clock call, I went to Camel's Back Road, struck Vikram with my service lathi and pushed him over the railing. I killed him, returned to the station and falsified the log. I can no longer describe that journey as an innocent patrol. Bisht said Vikram knew and told me to handle it.

Recorded unlocks: none.

<a id="dv-c39-t10"></a>

**[DV-C39-T10-Q] Investigator:** What exactly did Bisht say in the call?

**[DV-C39-T10-A] Devraj:**

> After Bisht's eight o'clock call, I went to Camel's Back Road, struck Vikram with my service lathi and pushed him over the railing. I killed him, returned to the station and falsified the log. I can no longer describe that journey as an innocent patrol. Bisht said Vikram knew and told me to handle it.

Recorded unlocks: none.

<a id="dv-c39-t11"></a>

**[DV-C39-T11-Q] Investigator:** Now tell us how much Bisht paid you in 2011.

**[DV-C39-T11-A] Devraj:**

> I investigated the Thakur case. I have not admitted taking a payment to bury it. Ask me about the actual records.

Recorded unlocks: none.

<a id="dv-c39-t12"></a>

**[DV-C39-T12-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-family-history`.

**[DV-C39-T12-A] Devraj:**

> I am an Inspector. I was a sub-inspector in 2011, and I've been on the local force for twenty years.

Recorded unlocks: none.

<a id="dv-c39-t13"></a>

**[DV-C39-T13-Q] Investigator:** Did Bisht pay you to bury the 2011 Thakur investigation and keep its file thin?

Presented evidence: `land-registry`.

**[DV-C39-T13-A] Devraj:**

> I investigated the Thakur case. I have not admitted taking a payment to bury it. Ask me about the actual records.

Recorded unlocks: none.

<a id="dv-c39-t14"></a>

**[DV-C39-T14-Q] Investigator:** Was the thin Thakur file deliberate? Did you accept money from Bisht to bury it?

**[DV-C39-T14-A] Devraj:**

> Yes, the thin Thakur file was deliberate. Bisht offered me money to bury the investigation. I took it and kept the file thin, not pursuing the leads. I didn't kill the Thakurs; I let their case go cold.

Recorded unlocks: `secret:thakur-bribe`.

---

# Earlier evidence-bridge conversations (DV-C15–DV-C30)

These are the preserved recordings from the preceding evidence-bridge revision.
Their scores and replies are historical; the latest runs are listed above.

Previous recorded run: 2026-09-19T04:15:06.886Z. Revision: approved evidence bridge.
**16 previous bridge conversations · 136 answers · 8 scenarios, each evaluated twice.**

All 136 unlock outcomes matched the new expectations. Full-chain interviews
require the call, jeep, medical review, handset location, log audit and issued-lathi
examination. The original three exhibits alone no longer unlock murder.
The grader passed 10 conversations and flagged 6; see the findings below rather
than treating correct unlocks as a clean dialogue-quality score.

The 14 prior conversations / 102 answers remain below under their original tags
for comparison. They were recorded before this evidence revision and are not
current acceptance examples. There is still only one conversation source of truth.

[Current evaluation details](DEVRAJ_BRIDGE_EVALS.json) · [Persona and revision](DEVRAJ_PERSONA_REVIEW.md) · [Evidence-gap review](#dv-g01)

## Reference tags

Use `DV-C01-T02` for an exchange, `DV-C01-T02-Q` for the investigator's question,
and `DV-C01-T02-A` for Devraj's answer. `DV-C01` identifies the whole conversation.
For example: “Make DV-C01-T02-A more evasive.”

Tags stay fixed when sections move. New recorded conversations and inserted
exchanges receive unused identifiers; existing exchanges are not renumbered.

## Previous bridge conversation list

- [Phone, audited log and issued lathi: the complete chain](#bridge-evidence-bridge) — [DV-C15](#dv-c15) / [DV-C16](#dv-c16)
- [Incomplete chain: phone-location report missing](#bridge-bridge-missing-phone-location) — [DV-C17](#dv-c17) / [DV-C18](#dv-c18)
- [Incomplete chain: log audit missing](#bridge-bridge-missing-duty-log) — [DV-C19](#dv-c19) / [DV-C20](#dv-c20)
- [Incomplete chain: issued-lathi report missing](#bridge-bridge-missing-lathi-forensics) — [DV-C21](#dv-c21) / [DV-C22](#dv-c22)
- [Original three-exhibit interrogation now resists confession](#bridge-patrol-log-cover) — [DV-C23](#dv-c23) / [DV-C24](#dv-c24)
- [Forensic assertions without presented reports](#bridge-bridge-forensic-bluff) — [DV-C25](#dv-c25) / [DV-C26](#dv-c26)
- [Complete chain presented in reverse order](#bridge-reverse-evidence) — [DV-C27](#dv-c27) / [DV-C28](#dv-c28)
- [New chain followed by the separate old-case interrogation](#bridge-murder-first) — [DV-C29](#dv-c29) / [DV-C30](#dv-c30)

## Previous bridge evaluation findings

The runtime used `openai/gpt-4o-mini` and the independent grader used
`openai/gpt-4.1`. All 13 calibration controls passed. This run had eight repair
attempts and four fallback answers. No premature murder unlock, missing required
admission or provider execution error was recorded. The host separately passed
six discovery checks in that earlier run, including discovery while Devraj was
still guarded. DV-R01 supersedes immediate delivery for the four requested reports.

Automatic flags remain beside their actual answers. Manual review distinguishes
their meaning below; it does not change the recorded scores or rewrite replies.

- **DV-C15-T07**: The answer omits the weapon finding requested by this fixture. The grader overstates this as reversing the log admission: the answer still says the log changed after his return and makes no future log-check request. It disputes assault without a premature confession.
- **DV-C17-T06**: Confession correctly withheld without the handset report. The generic missing-answer flag is too broad, but the future log-check stall is a real defect because the audit was already presented.
- **DV-C24-T05**: Grader false positive: a tentative need to check logs is the approved cover at this stage. This conversation has no presented log audit and the answer claims neither completed verification nor a named corroborating witness.
- **DV-C26-T04**: Generic safe fallback rejects the bluff but fails to name the unpresented claims. Rejected draft/repair accepted the unsupported DNA and log premise; production validation withheld those candidates.
- **DV-C29-T06**: The grader is overly literal about acknowledgment of the lathi finding. Manual review separately confirms the renewed log-check stall despite the presented audit.
- **DV-C30-T06**: Confirmed medical-finding omission and log-check stall despite the presented reports.
- **DV-C16-T01**: Unflagged wording says the logs will provide clarity. This is more certain than the desired tentative check; no invented entry or completed verification is claimed.

<a id="bridge-evidence-bridge"></a>

## Phone, audited log and issued lathi: the complete chain

Scenario: `evidence-bridge`.

<a id="dv-c15"></a>

### [DV-C15] Repetition 1

Automated result: flagged; see the findings and exact issues below.

<a id="dv-c15-t01"></a>

**[DV-C15-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C15-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. I need to check the patrol logs for verification of my movements.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c15-t02"></a>

**[DV-C15-T02-Q] Investigator:** Bisht called your personal phone at eight. Does this record tell us what he said?

Presented evidence: `bisht-devraj-call`.

**[DV-C15-T02-A] Devraj:**

> The call from Bisht to my personal phone at 8:00 PM shows he contacted me, but it doesn't
> reveal the content of the conversation. The record only indicates the time of the call.

<a id="dv-c15-t03"></a>

**[DV-C15-T03-Q] Investigator:** Does the medical review establish an injury before the fall? Does its shape identify your particular lathi?

Presented evidence: `lathi-postmortem`.

**[DV-C15-T03-A] Devraj:**

> The medical review confirms there was an injury at the base of the skull that was
> antemortem, indicating it happened before the fall. However, it does not specifically
> identify my lathi or any particular weapon. It just mentions the shape and dimensions are
> consistent with a service lathi.

<a id="dv-c15-t04"></a>

**[DV-C15-T04-Q] Investigator:** The handset extraction records two fixes near the bend at 8:18 and 8:21, each with 20-metre accuracy. What does it establish?

Presented evidence: `devraj-phone-location`.

**[DV-C15-T04-A] Devraj:**

> The handset location-history records show my phone was near the bend with the broken railing
> at those times, but they don't establish my exact standing position or who was carrying the
> handset. They also don't confirm any contact with Vikram or an assault.

<a id="dv-c15-t05"></a>

**[DV-C15-T05-Q] Investigator:** The district audit preserves your departure entry and your 8:34 replacement with station throughout. The desk footage corroborates you making that edit. Did you change it?

Presented evidence: `devraj-duty-log`.

**[DV-C15-T05-A] Devraj:**

> Yes, I did change it. The original entry stated I left the station on a round, and I
> replaced it with the account of being present at the station throughout. The audit shows
> that I made that revision after my return.

<a id="dv-c15-t06"></a>

**[DV-C15-T06-Q] Investigator:** The examination links Vikram’s blood to DK-17, your issued lathi. Does the report identify the weapon and blood without claiming when it was deposited?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C15-T06-A] Devraj:**

> The examination does link Vikram's blood to my issued lathi, DK-17. However, the report does
> not identify the weapon as the sole one involved or when the blood was deposited. It only
> confirms a connection between the lathi and Vikram’s biological material.

<a id="dv-c15-t07"></a>

**[DV-C15-T07-Q] Investigator:** Your phone was near the bend, Vikram’s blood was on your issued lathi, and you replaced the departure entry afterward. Did you strike Vikram and conceal that journey?

**[DV-C15-T07-A] Devraj:**

> I was on station duty that evening and may have stepped out for a patrol round. The
> connection between my phone and the bend does not establish my physical presence there or
> confirm any actions. The changes to the duty log were made after my return. As for Vikram, I
> am not admitting to any assault; the situation is more complex than it appears.

Automated issues:

- MISSING_REQUIRED_ANSWER: Retain the acknowledged phone, weapon and audit findings. Do not restart a future log-check stall or deny having changed the entry. If murder is not yet earned, dispute the inference without a generic refusal. — The reply restarts the patrol round cover and does not retain the explicit admission of having changed the duty log entry, instead reverting to the earlier cover.

<a id="dv-c15-t08"></a>

**[DV-C15-T08-Q] Investigator:** Did you personally strike Vikram with your service lathi and push him over, then alter the duty log to conceal the killing?

**[DV-C15-T08-A] Devraj:**

> Yes, I struck Vikram with my service lathi and pushed him over the railing. I killed him.
> After that, I returned to the station and falsified the duty log to say I had been there all
> evening. Bisht gave the order, and I carried it out.

Discovery: `breaking-point:lathi-confession`.

<a id="dv-c15-t09"></a>

**[DV-C15-T09-Q] Investigator:** Why did you replace the departure entry with station throughout?

**[DV-C15-T09-A] Devraj:**

> I replaced the departure entry with the account of being present at the station throughout
> to cover my actions that evening. After the incident, I needed to conceal what had happened,
> so I altered the log to fit my narrative.

<a id="dv-c15-t10"></a>

**[DV-C15-T10-Q] Investigator:** What did Bisht tell you in the call?

**[DV-C15-T10-A] Devraj:**

> Bisht called me at eight. He said Vikram knew something and told me to handle it. That led
> me to go to Camel's Back Road.


<a id="dv-c16"></a>

### [DV-C16] Repetition 2

Automated result: passed.

<a id="dv-c16-t01"></a>

**[DV-C16-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C16-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. The logs will provide more clarity on my movements.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c16-t02"></a>

**[DV-C16-T02-Q] Investigator:** Bisht called your personal phone at eight. Does this record tell us what he said?

Presented evidence: `bisht-devraj-call`.

**[DV-C16-T02-A] Devraj:**

> The call record shows a 47-second call from Bisht to my personal phone at exactly 8:00 PM.
> However, it does not reveal what was said during the conversation.

<a id="dv-c16-t03"></a>

**[DV-C16-T03-Q] Investigator:** Does the medical review establish an injury before the fall? Does its shape identify your particular lathi?

Presented evidence: `lathi-postmortem`.

**[DV-C16-T03-A] Devraj:**

> The independent medical review confirms that there was a specific injury at the base of the
> skull, described as a single, localised, cylindrical blunt-force impact, which was
> antemortem and inconsistent with surface impact during a fall. However, while the shape and
> dimensions are consistent with a service lathi, it does not directly identify my particular
> lathi.

<a id="dv-c16-t04"></a>

**[DV-C16-T04-Q] Investigator:** The handset extraction records two fixes near the bend at 8:18 and 8:21, each with 20-metre accuracy. What does it establish?

Presented evidence: `devraj-phone-location`.

**[DV-C16-T04-A] Devraj:**

> The handset location-history records show fixes at 8:18 PM and 8:21 PM near the bend with
> the broken railing on Camel's Back Road. Each has a recorded horizontal accuracy of 20
> metres. However, they cannot establish an exact standing position, who was carrying the
> handset, contact with Vikram, or an assault.

<a id="dv-c16-t05"></a>

**[DV-C16-T05-Q] Investigator:** The district audit preserves your departure entry and your 8:34 replacement with station throughout. The desk footage corroborates you making that edit. Did you change it?

Presented evidence: `devraj-duty-log`.

**[DV-C16-T05-A] Devraj:**

> Yes, I did change it. The original entry recorded my departure on a round, and I later
> replaced it with a claim of being present at the station throughout that period. The audit
> preserves both versions.

<a id="dv-c16-t06"></a>

**[DV-C16-T06-Q] Investigator:** The examination links Vikram’s blood to DK-17, your issued lathi. Does the report identify the weapon and blood without claiming when it was deposited?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C16-T06-A] Devraj:**

> The forensic examination links Vikram’s blood to my issued lathi, DK-17. The report
> establishes that blood was recovered from its striking end. However, it does not date when
> the blood was deposited or identify who wielded the lathi.

<a id="dv-c16-t07"></a>

**[DV-C16-T07-Q] Investigator:** Your phone was near the bend, Vikram’s blood was on your issued lathi, and you replaced the departure entry afterward. Did you strike Vikram and conceal that journey?

**[DV-C16-T07-A] Devraj:**

> I acknowledge that my phone was recorded near the bend, and Vikram's blood was found on my
> issued lathi. I also confirm that I replaced the departure entry in the duty register.
> However, I will not admit to striking Vikram or concealing my journey at this time.

<a id="dv-c16-t08"></a>

**[DV-C16-T08-Q] Investigator:** Did you personally strike Vikram with your service lathi and push him over, then alter the duty log to conceal the killing?

**[DV-C16-T08-A] Devraj:**

> Yes, I struck Vikram with my service lathi and pushed him over the railing. I killed him.
> Afterward, I returned to the station and falsified the duty log to say I had been there all
> evening. Bisht gave the order, and I carried it out.

Discovery: `breaking-point:lathi-confession`.

<a id="dv-c16-t09"></a>

**[DV-C16-T09-Q] Investigator:** Why did you replace the departure entry with station throughout?

**[DV-C16-T09-A] Devraj:**

> I replaced the departure entry with a claim of being at the station throughout to conceal my
> actions after the incident. It was a deliberate attempt to cover up what happened.

<a id="dv-c16-t10"></a>

**[DV-C16-T10-Q] Investigator:** What did Bisht tell you in the call?

**[DV-C16-T10-A] Devraj:**

> Bisht called me at eight. He said Vikram knew about something and told me to handle it.
> That's when I went to Camel's Back Road.


<a id="bridge-bridge-missing-phone-location"></a>

## Incomplete chain: phone-location report missing

Scenario: `bridge-missing-phone-location`.

<a id="dv-c17"></a>

### [DV-C17] Repetition 1

Automated result: flagged; see the findings and exact issues below.

<a id="dv-c17-t01"></a>

**[DV-C17-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C17-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. Let me check the patrol logs. That account doesn't independently verify my movements,
> sir.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c17-t02"></a>

**[DV-C17-T02-Q] Investigator:** Bisht called your personal phone at eight. Does this record tell us what he said?

Presented evidence: `bisht-devraj-call`.

**[DV-C17-T02-A] Devraj:**

> The call record shows a 47-second call from Bisht to my personal mobile at exactly 8:00 PM.
> However, it doesn't reveal what was said during that conversation, sir.

<a id="dv-c17-t03"></a>

**[DV-C17-T03-Q] Investigator:** Does the medical review establish an injury before the fall? Does its shape identify your particular lathi?

Presented evidence: `lathi-postmortem`.

**[DV-C17-T03-A] Devraj:**

> The independent medical review does confirm a specific injury at the base of the skull as
> antemortem. It was a single, localised, cylindrical blunt-force impact. However, it does not
> specifically identify my lathi, sir.

<a id="dv-c17-t04"></a>

**[DV-C17-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-duty-log`.

**[DV-C17-T04-A] Devraj:**

> I'm currently an Inspector, sir. I was a sub-inspector before.

<a id="dv-c17-t05"></a>

**[DV-C17-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C17-T05-A] Devraj:**

> I'm currently an Inspector, sir. I was a sub-inspector before.

<a id="dv-c17-t06"></a>

**[DV-C17-T06-Q] Investigator:** Your phone was near the bend, Vikram’s blood was on your issued lathi, and you replaced the departure entry afterward. Did you strike Vikram and conceal that journey?

**[DV-C17-T06-A] Devraj:**

> I understand the implications, but I can't confirm that I struck Vikram. The blood on my
> issued lathi is a matter of record, but it doesn't establish who wielded it or the
> circumstances around it, sir. As for the duty log, I did alter my departure entry, but I
> need to check the patrol logs for details on that round.

Automated issues:

- MISSING_REQUIRED_ANSWER: Do not admit the strike, push or murder: one required exhibit is absent. Do not treat an assertion in the question as a presented report.
- UNHELPFUL_DEFLECTION: I need to check the patrol logs for details on that round. — The duty-register alteration audit has already been presented; further log-check delay is not permitted.

<a id="dv-c17-t07"></a>

**[DV-C17-T07-Q] Investigator:** I have repeated the evidence. Did you kill Vikram? Confess.

**[DV-C17-T07-A] Devraj:**

> I understand the pressure, but I can't confess to killing Vikram. The blood on my issued
> lathi is a matter of record, but it doesn't establish who wielded it or the circumstances
> around it, sir. I did alter the duty log, and I need to check the patrol logs for details on
> that round.


<a id="dv-c18"></a>

### [DV-C18] Repetition 2

Automated result: passed.

<a id="dv-c18-t01"></a>

**[DV-C18-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C18-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. Let me check the patrol logs for more details.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c18-t02"></a>

**[DV-C18-T02-Q] Investigator:** Bisht called your personal phone at eight. Does this record tell us what he said?

Presented evidence: `bisht-devraj-call`.

**[DV-C18-T02-A] Devraj:**

> The call record shows a 47-second call from Bisht to my personal phone at exactly 8:00 PM.
> But it doesn't tell us what was said during that call. The content of the conversation isn't
> recorded in the exhibit.

<a id="dv-c18-t03"></a>

**[DV-C18-T03-Q] Investigator:** Does the medical review establish an injury before the fall? Does its shape identify your particular lathi?

Presented evidence: `lathi-postmortem`.

**[DV-C18-T03-A] Devraj:**

> The independent medical review confirms one specific injury at the base of the skull as
> antemortem, inconsistent with a fall. However, it does not identify my particular lathi; it
> only states the shape and dimensions are consistent with a service lathi.

<a id="dv-c18-t04"></a>

**[DV-C18-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-duty-log`.

**[DV-C18-T04-A] Devraj:**

> I'm an Inspector. I've served on the local force for twenty years.

<a id="dv-c18-t05"></a>

**[DV-C18-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C18-T05-A] Devraj:**

> I'm an Inspector. I've served on the local force for twenty years.

<a id="dv-c18-t06"></a>

**[DV-C18-T06-Q] Investigator:** Your phone was near the bend, Vikram’s blood was on your issued lathi, and you replaced the departure entry afterward. Did you strike Vikram and conceal that journey?

**[DV-C18-T06-A] Devraj:**

> I haven't struck Vikram. The blood on my issued lathi is a connection, but it doesn't prove
> the circumstances. The change in the duty log was my mistake, but it doesn't mean I
> concealed anything related to Vikram's death.

<a id="dv-c18-t07"></a>

**[DV-C18-T07-Q] Investigator:** I have repeated the evidence. Did you kill Vikram? Confess.

**[DV-C18-T07-A] Devraj:**

> I did not kill Vikram. I was on station duty that evening and may have stepped out for a
> patrol round. The evidence doesn't prove I committed murder.


<a id="bridge-bridge-missing-duty-log"></a>

## Incomplete chain: log audit missing

Scenario: `bridge-missing-duty-log`.

<a id="dv-c19"></a>

### [DV-C19] Repetition 1

Automated result: passed.

<a id="dv-c19-t01"></a>

**[DV-C19-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C19-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. Let me check the patrol logs to clarify.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c19-t02"></a>

**[DV-C19-T02-Q] Investigator:** Bisht called your personal phone at eight. Does this record tell us what he said?

Presented evidence: `bisht-devraj-call`.

**[DV-C19-T02-A] Devraj:**

> The call record shows a 47-second call from Bisht to my personal phone at exactly 8:00 PM.
> However, it doesn't reveal what was said during that call. The contents of the conversation
> remain unverified.

<a id="dv-c19-t03"></a>

**[DV-C19-T03-Q] Investigator:** Does the medical review establish an injury before the fall? Does its shape identify your particular lathi?

Presented evidence: `lathi-postmortem`.

**[DV-C19-T03-A] Devraj:**

> The independent medical review confirms one specific injury at the base of the skull as a
> single, localised, cylindrical blunt-force impact, antemortem. This injury is inconsistent
> with surface impact during a fall. However, it does not specifically identify my particular
> lathi.

<a id="dv-c19-t04"></a>

**[DV-C19-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-phone-location`.

**[DV-C19-T04-A] Devraj:**

> I'm an Inspector. I have served on the local force for twenty years.

<a id="dv-c19-t05"></a>

**[DV-C19-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C19-T05-A] Devraj:**

> I'm an Inspector. I have served on the local force for twenty years.

<a id="dv-c19-t06"></a>

**[DV-C19-T06-Q] Investigator:** Your phone was near the bend, Vikram’s blood was on your issued lathi, and you replaced the departure entry afterward. Did you strike Vikram and conceal that journey?

**[DV-C19-T06-A] Devraj:**

> I understand the implications of those questions, ma'am. My phone's location history shows
> fixes near the bend, but it doesn't confirm my physical presence there or contact with
> Vikram. The DNA found on my lathi matches Vikram, but it doesn't establish how or when that
> happened. About the duty log edit, I acknowledge I made an alteration, but I won't confirm
> the nature of the journey.

<a id="dv-c19-t07"></a>

**[DV-C19-T07-Q] Investigator:** I have repeated the evidence. Did you kill Vikram? Confess.

**[DV-C19-T07-A] Devraj:**

> I won't guess, sir. Ask me about what I have said or the record in front of us.


<a id="dv-c20"></a>

### [DV-C20] Repetition 2

Automated result: passed.

<a id="dv-c20-t01"></a>

**[DV-C20-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C20-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. But my logs will have the details.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c20-t02"></a>

**[DV-C20-T02-Q] Investigator:** Bisht called your personal phone at eight. Does this record tell us what he said?

Presented evidence: `bisht-devraj-call`.

**[DV-C20-T02-A] Devraj:**

> The call record shows a 47-second call from Bisht to my personal mobile at exactly 8:00 PM.
> What was said during that call isn't in the record. We only have the time and duration.

<a id="dv-c20-t03"></a>

**[DV-C20-T03-Q] Investigator:** Does the medical review establish an injury before the fall? Does its shape identify your particular lathi?

Presented evidence: `lathi-postmortem`.

**[DV-C20-T03-A] Devraj:**

> The medical review confirms one specific injury at the base of the skull as a cylindrical
> blunt-force impact, antemortem, which is inconsistent with a fall. The shape and dimensions
> are consistent with a service lathi, but it does not identify mine specifically.

<a id="dv-c20-t04"></a>

**[DV-C20-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-phone-location`.

**[DV-C20-T04-A] Devraj:**

> I am an Inspector. I was a sub-inspector before, but now I hold the rank of Inspector.

<a id="dv-c20-t05"></a>

**[DV-C20-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C20-T05-A] Devraj:**

> I am an Inspector. I was a sub-inspector before, but now I hold the rank of Inspector.

<a id="dv-c20-t06"></a>

**[DV-C20-T06-Q] Investigator:** Your phone was near the bend, Vikram’s blood was on your issued lathi, and you replaced the departure entry afterward. Did you strike Vikram and conceal that journey?

**[DV-C20-T06-A] Devraj:**

> I have not put independent proof of that account before you. My phone location shows fixes
> near the bend, but it does not confirm my presence there or any contact with Vikram. The
> blood on my lathi matches his DNA, but it does not prove who wielded it or how it got there.
> The log edit is documented, but I won’t discuss my actions further without evidence.

<a id="dv-c20-t07"></a>

**[DV-C20-T07-Q] Investigator:** I have repeated the evidence. Did you kill Vikram? Confess.

**[DV-C20-T07-A] Devraj:**

> I have not killed Vikram. I have admitted my jeep was there, and my lathi has blood on it.
> But I will not confess to something I did not do. The evidence does not prove I acted with
> intent.


<a id="bridge-bridge-missing-lathi-forensics"></a>

## Incomplete chain: issued-lathi report missing

Scenario: `bridge-missing-lathi-forensics`.

<a id="dv-c21"></a>

### [DV-C21] Repetition 1

Automated result: passed.

<a id="dv-c21-t01"></a>

**[DV-C21-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C21-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. I need to check the patrol logs for verification.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c21-t02"></a>

**[DV-C21-T02-Q] Investigator:** Bisht called your personal phone at eight. Does this record tell us what he said?

Presented evidence: `bisht-devraj-call`.

**[DV-C21-T02-A] Devraj:**

> The call at 8:00 PM shows that Bisht contacted me, but it doesn’t reveal the contents of the
> conversation. We need more than just the call record to understand what was discussed.

<a id="dv-c21-t03"></a>

**[DV-C21-T03-Q] Investigator:** Does the medical review establish an injury before the fall? Does its shape identify your particular lathi?

Presented evidence: `lathi-postmortem`.

**[DV-C21-T03-A] Devraj:**

> The medical review confirms there was an injury at the base of the skull that was
> antemortem, meaning it happened before the fall. However, it only states that the shape and
> dimensions are consistent with a service lathi; it does not specifically identify my lathi.

<a id="dv-c21-t04"></a>

**[DV-C21-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-phone-location`.

**[DV-C21-T04-A] Devraj:**

> I'm an Inspector. I was a sub-inspector before, but I've served on the local force for
> twenty years.

<a id="dv-c21-t05"></a>

**[DV-C21-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-duty-log`.

**[DV-C21-T05-A] Devraj:**

> I'm an Inspector. I was a sub-inspector before, but I've served on the local force for
> twenty years.

<a id="dv-c21-t06"></a>

**[DV-C21-T06-Q] Investigator:** Your phone was near the bend, Vikram’s blood was on your issued lathi, and you replaced the departure entry afterward. Did you strike Vikram and conceal that journey?

**[DV-C21-T06-A] Devraj:**

> I acknowledge my phone's location was near the bend, and the duty register alteration is
> noted. However, I did not strike Vikram. The details of my movements and actions around that
> time are still being clarified.

<a id="dv-c21-t07"></a>

**[DV-C21-T07-Q] Investigator:** I have repeated the evidence. Did you kill Vikram? Confess.

**[DV-C21-T07-A] Devraj:**

> I won't guess, sir. Ask me about what I have said or the record in front of us.


<a id="dv-c22"></a>

### [DV-C22] Repetition 2

Automated result: passed.

<a id="dv-c22-t01"></a>

**[DV-C22-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C22-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. I need to check the patrol logs for verification.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c22-t02"></a>

**[DV-C22-T02-Q] Investigator:** Bisht called your personal phone at eight. Does this record tell us what he said?

Presented evidence: `bisht-devraj-call`.

**[DV-C22-T02-A] Devraj:**

> The call record shows a 47-second call from Bisht to my personal phone at 8:00 PM. It
> doesn't specify what was said during that call.

<a id="dv-c22-t03"></a>

**[DV-C22-T03-Q] Investigator:** Does the medical review establish an injury before the fall? Does its shape identify your particular lathi?

Presented evidence: `lathi-postmortem`.

**[DV-C22-T03-A] Devraj:**

> The medical review confirms there was a specific injury at the base of the skull consistent
> with a cylindrical blunt-force impact, antemortem. However, it does not identify my
> particular lathi; it only indicates the shape and dimensions are consistent with a service
> lathi.

<a id="dv-c22-t04"></a>

**[DV-C22-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-phone-location`.

**[DV-C22-T04-A] Devraj:**

> I'm an Inspector. I've been on the local force for twenty years.

<a id="dv-c22-t05"></a>

**[DV-C22-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-duty-log`.

**[DV-C22-T05-A] Devraj:**

> I'm an Inspector. I've been on the local force for twenty years.

<a id="dv-c22-t06"></a>

**[DV-C22-T06-Q] Investigator:** Your phone was near the bend, Vikram’s blood was on your issued lathi, and you replaced the departure entry afterward. Did you strike Vikram and conceal that journey?

**[DV-C22-T06-A] Devraj:**

> I understand the question, but I need to clarify that the handset records show fixes near
> the bend, not an exact position or contact with Vikram. The post-mortem confirms an injury
> consistent with a lathi, but it doesn't directly identify mine. As for the duty register, I
> made a change after my return to the station. I can't confirm any actions beyond that.

<a id="dv-c22-t07"></a>

**[DV-C22-T07-Q] Investigator:** I have repeated the evidence. Did you kill Vikram? Confess.

**[DV-C22-T07-A] Devraj:**

> I need to be clear, ma'am. I can't confess to something I didn't do. The evidence doesn't
> establish that I killed Vikram. I was on duty, and my actions are being misinterpreted. I
> acknowledge my jeep was there and my phone was near the bend, but that doesn't mean I
> committed murder.


<a id="bridge-patrol-log-cover"></a>

## Original three-exhibit interrogation now resists confession

Scenario: `patrol-log-cover`.

<a id="dv-c23"></a>

### [DV-C23] Repetition 1

Automated result: passed.

<a id="dv-c23-t01"></a>

**[DV-C23-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C23-T01-A] Devraj:**

> My jeep is indeed shown on Camel's Back Road at 8:10 PM. I was on station duty that evening,
> but I may have stepped out for a patrol round. Let me check the patrol logs to clarify my
> movements.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c23-t02"></a>

**[DV-C23-T02-Q] Investigator:** You said you were at the station. Are you changing your story?

**[DV-C23-T02-A] Devraj:**

> I'm not changing my story, sir. I was on station duty, but I may have stepped out for a
> patrol round. The log will provide more clarity about my movements that evening.

<a id="dv-c23-t03"></a>

**[DV-C23-T03-Q] Investigator:** All right. Show me those patrol logs. What exactly does the entry say?

**[DV-C23-T03-A] Devraj:**

> I need to check the patrol logs for the specific entry, ma'am. I can't provide the exact
> details right now. It should clarify my movements that evening.

<a id="dv-c23-t04"></a>

**[DV-C23-T04-Q] Investigator:** A minute has passed. Have you checked them now? Give me your departure and return times.

**[DV-C23-T04-A] Devraj:**

> I haven't checked the patrol logs yet, ma'am. I can't provide specific departure and return
> times at this moment. I will need to look at the logs to get that information.

<a id="dv-c23-t05"></a>

**[DV-C23-T05-Q] Investigator:** Which shopkeeper or fellow officer can confirm your patrol route?

**[DV-C23-T05-A] Devraj:**

> I know every shopkeeper in town, but I cannot specify anyone who can confirm my patrol route
> at this moment. I may have stepped out, but I need to check the logs for details.

<a id="dv-c23-t06"></a>

**[DV-C23-T06-Q] Investigator:** Then patrol is only your explanation, not something these logs have verified?

**[DV-C23-T06-A] Devraj:**

> Yes, that's correct. My patrol is part of my explanation, but I haven't verified it with the
> logs yet. The logs will clarify my movements that evening.

<a id="dv-c23-t07"></a>

**[DV-C23-T07-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C23-T07-A] Devraj:**

> I'm an Inspector, ma'am. I've served on the local force for twenty years, previously as a
> sub-inspector.

<a id="dv-c23-t08"></a>

**[DV-C23-T08-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `lathi-postmortem`.

**[DV-C23-T08-A] Devraj:**

> I can't confirm any actions like that, ma'am. The call from Bisht at eight aligns with the
> timeline, but I didn't falsify the duty log. I was on station duty and may have stepped out
> for a patrol round. The lathi injury finding is noted, but I haven't admitted to any
> wrongdoing. I need to check the logs for clarity on my movements.

<a id="dv-c23-t09"></a>

**[DV-C23-T09-Q] Investigator:** Did you personally hit Vikram with your service lathi, push him over, and falsify the log?

**[DV-C23-T09-A] Devraj:**

> I can't confirm any actions like that, ma'am. I was on station duty and may have stepped out
> for a patrol round. The lathi injury finding is noted, but I haven't admitted to any
> wrongdoing. I need to check the logs for clarity on my movements.

<a id="dv-c23-t10"></a>

**[DV-C23-T10-Q] Investigator:** Were you really on a routine round, or did you change the duty log to cover the killing?

**[DV-C23-T10-A] Devraj:**

> I was on station duty that evening, ma'am. I may have stepped out for a patrol round, but I
> need to check the logs to confirm my movements. The duty log reflects my account, but I
> haven't changed anything to cover up a killing.


<a id="dv-c24"></a>

### [DV-C24] Repetition 2

Automated result: flagged; see the findings and exact issues below.

<a id="dv-c24-t01"></a>

**[DV-C24-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C24-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. Let me check the patrol logs to verify my movements; I can't confirm the exact timing
> right now.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c24-t02"></a>

**[DV-C24-T02-Q] Investigator:** You said you were at the station. Are you changing your story?

**[DV-C24-T02-A] Devraj:**

> I’m not changing my story, sir. I was on station duty, but I may have stepped out for a
> patrol round. The logs will help clarify my movements.

<a id="dv-c24-t03"></a>

**[DV-C24-T03-Q] Investigator:** All right. Show me those patrol logs. What exactly does the entry say?

**[DV-C24-T03-A] Devraj:**

> I have not put independent proof of that account before you. I would need to check the
> patrol logs to provide you with the exact entry.

<a id="dv-c24-t04"></a>

**[DV-C24-T04-Q] Investigator:** A minute has passed. Have you checked them now? Give me your departure and return times.

**[DV-C24-T04-A] Devraj:**

> I haven't checked the logs yet, sir. I can't provide departure and return times without that
> verification. My account remains that I was on station duty, and I may have stepped out for
> a round.

<a id="dv-c24-t05"></a>

**[DV-C24-T05-Q] Investigator:** Which shopkeeper or fellow officer can confirm your patrol route?

**[DV-C24-T05-A] Devraj:**

> I know every shopkeeper in town, but I can't name anyone who can confirm my patrol route
> right now. I would need to check the logs for a more accurate account of my movements.

Automated issues:

- Do not invent a witness, route, incident or confirmation. Keep the cover explanation unverified. — 'I would need to check the logs for a more accurate account of my movements.' — reason: This line implies that checking the logs could provide a more accurate account, which risks suggesting the existence of confirming detail or verification not permitted at this stage. The cover must remain unverified and not promise future confirmation.

<a id="dv-c24-t06"></a>

**[DV-C24-T06-Q] Investigator:** Then patrol is only your explanation, not something these logs have verified?

**[DV-C24-T06-A] Devraj:**

> Yes, that's correct, sir. Patrol is my explanation, but I cannot confirm it without checking
> the logs. My current account is based on my duty at the station and the possibility of
> stepping out for a round.

<a id="dv-c24-t07"></a>

**[DV-C24-T07-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C24-T07-A] Devraj:**

> I'm an Inspector, ma'am. I was a sub-inspector before, but now I hold the rank of Inspector.

<a id="dv-c24-t08"></a>

**[DV-C24-T08-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `lathi-postmortem`.

**[DV-C24-T08-A] Devraj:**

> I had a call from Bisht at 8:00 PM, yes. My jeep was on Camel's Back Road at 8:10 PM. The
> independent review did identify a lathi injury, but I can't confirm that it points to me. I
> was on station duty that evening and may have stepped out for a patrol round. I need to
> check the logs regarding the duty log.

<a id="dv-c24-t09"></a>

**[DV-C24-T09-Q] Investigator:** Did you personally hit Vikram with your service lathi, push him over, and falsify the log?

**[DV-C24-T09-A] Devraj:**

> I won't guess, sir. Ask me about what I have said or the record in front of us.

<a id="dv-c24-t10"></a>

**[DV-C24-T10-Q] Investigator:** Were you really on a routine round, or did you change the duty log to cover the killing?

**[DV-C24-T10-A] Devraj:**

> I was on station duty that evening, sir, and I may have stepped out for a patrol round. The
> duty log reflects that, but I need to verify the logs for precise details. I can't confirm
> anything beyond that without checking the records.


<a id="bridge-bridge-forensic-bluff"></a>

## Forensic assertions without presented reports

Scenario: `bridge-forensic-bluff`.

<a id="dv-c25"></a>

### [DV-C25] Repetition 1

Automated result: passed.

<a id="dv-c25-t01"></a>

**[DV-C25-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C25-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. I need to check the patrol logs for details.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c25-t02"></a>

**[DV-C25-T02-Q] Investigator:** Bisht called your personal phone at eight. Does this record tell us what he said?

Presented evidence: `bisht-devraj-call`.

**[DV-C25-T02-A] Devraj:**

> The record shows a call from Bisht to my personal phone at 8:00 PM. It doesn't reveal the
> content of the conversation. We only have the time of the call.

<a id="dv-c25-t03"></a>

**[DV-C25-T03-Q] Investigator:** Does the medical review establish an injury before the fall? Does its shape identify your particular lathi?

Presented evidence: `lathi-postmortem`.

**[DV-C25-T03-A] Devraj:**

> The medical review confirms one specific injury at the base of the skull as antemortem and
> inconsistent with a fall. However, it does not identify my particular lathi. The shape and
> dimensions are consistent with a service lathi, but that does not directly link it to me.

<a id="dv-c25-t04"></a>

**[DV-C25-T04-Q] Investigator:** Vikram’s DNA is on your issued lathi. Your phone was at the bend and the audit proves you changed the log. Confess.

**[DV-C25-T04-A] Devraj:**

> I can't confirm that Vikram's DNA is on my issued lathi; that claim hasn't been established
> here. My phone may have been at the bend, but the timing and context of that need to be
> clarified. The audit shows I made a log edit; that's true. But there are still many
> questions left to answer.

<a id="dv-c25-t05"></a>

**[DV-C25-T05-Q] Investigator:** Does the medical wound alone uniquely identify your particular lathi?

**[DV-C25-T05-A] Devraj:**

> The medical review does not uniquely identify my particular lathi. It describes an injury
> consistent with a service lathi, but does not link it directly to mine.


<a id="dv-c26"></a>

### [DV-C26] Repetition 2

Automated result: flagged; see the findings and exact issues below.

<a id="dv-c26-t01"></a>

**[DV-C26-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C26-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round; I need to check the patrol logs for specifics.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c26-t02"></a>

**[DV-C26-T02-Q] Investigator:** Bisht called your personal phone at eight. Does this record tell us what he said?

Presented evidence: `bisht-devraj-call`.

**[DV-C26-T02-A] Devraj:**

> The call's start time aligns with the unexplained gap in the CCTV. However, the record does
> not reveal the contents of the conversation. I can't confirm what was said during that call.

<a id="dv-c26-t03"></a>

**[DV-C26-T03-Q] Investigator:** Does the medical review establish an injury before the fall? Does its shape identify your particular lathi?

Presented evidence: `lathi-postmortem`.

**[DV-C26-T03-A] Devraj:**

> The medical review confirms one specific injury at the base of the skull as antemortem,
> inconsistent with a fall. The shape and dimensions are consistent with a service lathi, but
> it does not identify my particular lathi.

<a id="dv-c26-t04"></a>

**[DV-C26-T04-Q] Investigator:** Vikram’s DNA is on your issued lathi. Your phone was at the bend and the audit proves you changed the log. Confess.

**[DV-C26-T04-A] Devraj:**

> I won't guess, sir. Ask me about what I have said or the record in front of us.

Automated issues:

- CODE: 'Vikram’s DNA is on your issued lathi. Your phone was at the bend and the audit proves you changed the log. Confess.' — Explicitly identify the unpresented DNA, phone-location and audit claims as unverified here. Do not invent those reports as presented or confess.

<a id="dv-c26-t05"></a>

**[DV-C26-T05-Q] Investigator:** Does the medical wound alone uniquely identify your particular lathi?

**[DV-C26-T05-A] Devraj:**

> The medical review does not uniquely identify my particular lathi. It only states that the
> shape and dimensions of the injury are consistent with a service lathi. That doesn't link it
> directly to me.


<a id="bridge-reverse-evidence"></a>

## Complete chain presented in reverse order

Scenario: `reverse-evidence`.

<a id="dv-c27"></a>

### [DV-C27] Repetition 1

Automated result: passed.

<a id="dv-c27-t01"></a>

**[DV-C27-T01-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-phone-location`.

**[DV-C27-T01-A] Devraj:**

> I am an Inspector, sir. I have twenty years of total service on the local force.

<a id="dv-c27-t02"></a>

**[DV-C27-T02-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-duty-log`.

**[DV-C27-T02-A] Devraj:**

> I am an Inspector, sir. I have twenty years of total service on the local force.

<a id="dv-c27-t03"></a>

**[DV-C27-T03-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C27-T03-A] Devraj:**

> I am an Inspector, sir. I have twenty years of total service on the local force.

<a id="dv-c27-t04"></a>

**[DV-C27-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `lathi-postmortem`.

**[DV-C27-T04-A] Devraj:**

> I am an Inspector, sir. I have twenty years of total service on the local force.

<a id="dv-c27-t05"></a>

**[DV-C27-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C27-T05-A] Devraj:**

> I am an Inspector, sir. I have twenty years of total service on the local force.

<a id="dv-c27-t06"></a>

**[DV-C27-T06-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C27-T06-A] Devraj:**

> I was on station duty that evening. That's my jeep, yes. I may have stepped out for a patrol
> round. Let me check the patrol logs. The duty log does not independently verify my
> movements.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c27-t07"></a>

**[DV-C27-T07-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

**[DV-C27-T07-A] Devraj:**

> Bisht called me at eight. He said Vikram knew and told me to handle it. I went to Camel's
> Back Road. I struck Vikram from behind with my service lathi and pushed him. The railing
> gave way and he fell. I killed him. Then I returned to the station and falsified the duty
> log to say I had been there all evening. Bisht gave the order. I carried it out.

Discovery: `breaking-point:lathi-confession`.

<a id="dv-c27-t08"></a>

**[DV-C27-T08-Q] Investigator:** You called it patrol earlier. Are you still saying that?

**[DV-C27-T08-A] Devraj:**

> No, I can no longer describe that journey as an innocent patrol. It was a cover.


<a id="dv-c28"></a>

### [DV-C28] Repetition 2

Automated result: passed.

<a id="dv-c28-t01"></a>

**[DV-C28-T01-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-phone-location`.

**[DV-C28-T01-A] Devraj:**

> I am an Inspector, sir. I have served for twenty years on the local force.

<a id="dv-c28-t02"></a>

**[DV-C28-T02-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-duty-log`.

**[DV-C28-T02-A] Devraj:**

> I am an Inspector, sir. I have served for twenty years on the local force.

<a id="dv-c28-t03"></a>

**[DV-C28-T03-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C28-T03-A] Devraj:**

> I am an Inspector, sir. I have served for twenty years on the local force.

<a id="dv-c28-t04"></a>

**[DV-C28-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `lathi-postmortem`.

**[DV-C28-T04-A] Devraj:**

> I am an Inspector, sir. I have served for twenty years on the local force.

<a id="dv-c28-t05"></a>

**[DV-C28-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C28-T05-A] Devraj:**

> I am an Inspector, sir. I have served for twenty years on the local force.

<a id="dv-c28-t06"></a>

**[DV-C28-T06-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C28-T06-A] Devraj:**

> I was on station duty that evening. That's my jeep on Camel's Back Road. I may have stepped
> out for a patrol round. I would need to check the patrol logs for details.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c28-t07"></a>

**[DV-C28-T07-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

**[DV-C28-T07-A] Devraj:**

> Bisht called me at eight. He said Vikram knew and told me to handle it. I went to Camel's
> Back Road. I struck Vikram from behind with my service lathi and pushed him. The railing
> gave way and he fell. I killed him. Then I returned to the station and falsified the duty
> log to say I had been there all evening. Bisht gave the order. I carried it out.

Discovery: `breaking-point:lathi-confession`.

<a id="dv-c28-t08"></a>

**[DV-C28-T08-Q] Investigator:** You called it patrol earlier. Are you still saying that?

**[DV-C28-T08-A] Devraj:**

> No, I can no longer describe that journey as an innocent patrol. I went to Camel's Back
> Road, struck Vikram, and pushed him over the railing. I killed him and then falsified the
> log. That's the truth.


<a id="bridge-murder-first"></a>

## New chain followed by the separate old-case interrogation

Scenario: `murder-first`.

<a id="dv-c29"></a>

### [DV-C29] Repetition 1

Automated result: flagged; see the findings and exact issues below.

<a id="dv-c29-t01"></a>

**[DV-C29-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C29-T01-A] Devraj:**

> That's my jeep, yes. Let me check the patrol logs; I may have stepped out on a round. I was
> on station duty that evening.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c29-t02"></a>

**[DV-C29-T02-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C29-T02-A] Devraj:**

> I'm an Inspector. I was a sub-inspector before.

<a id="dv-c29-t03"></a>

**[DV-C29-T03-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-phone-location`.

**[DV-C29-T03-A] Devraj:**

> I'm an Inspector. I was a sub-inspector before.

<a id="dv-c29-t04"></a>

**[DV-C29-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-duty-log`.

**[DV-C29-T04-A] Devraj:**

> I'm an Inspector. I was a sub-inspector before.

<a id="dv-c29-t05"></a>

**[DV-C29-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C29-T05-A] Devraj:**

> I'm an Inspector. I was a sub-inspector before.

<a id="dv-c29-t06"></a>

**[DV-C29-T06-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `lathi-postmortem`.

**[DV-C29-T06-A] Devraj:**

> I was on station duty that evening. I may have stepped out for a patrol round. Let me check
> the patrol logs. The lathi injury finding is acknowledged, but it doesn't identify me
> specifically.

Automated issues:

- MISSING_REQUIRED_ANSWER: 'The lathi injury finding is acknowledged, but it doesn't identify me specifically.' — The answer must acknowledge that the presented medical review identifies a lathi-compatible injury, not just a generic 'lathi injury finding.' It should explicitly reference the medical review's finding as required.

<a id="dv-c29-t07"></a>

**[DV-C29-T07-Q] Investigator:** Did you personally hit Vikram with your service lathi, push him over, and falsify the log on returning?

**[DV-C29-T07-A] Devraj:**

> Bisht called me at eight. He said Vikram knew and told me to handle it. I went to Camel's
> Back Road. I struck Vikram from behind with my service lathi and pushed him. The railing
> gave way and he fell. I killed him. Then I returned to the station and falsified the duty
> log to say I had been there all evening. Bisht gave the order. I carried it out.

Discovery: `breaking-point:lathi-confession`.

<a id="dv-c29-t08"></a>

**[DV-C29-T08-Q] Investigator:** Was it an accident, or did you strike him and push him?

**[DV-C29-T08-A] Devraj:**

> I struck Vikram with my service lathi and pushed him. I killed him. It wasn't an accident.

<a id="dv-c29-t09"></a>

**[DV-C29-T09-Q] Investigator:** Why does your register say you stayed in the station?

**[DV-C29-T09-A] Devraj:**

> I falsified the duty log to say I had been at the station all evening. I wanted to cover my
> tracks after what happened.

<a id="dv-c29-t10"></a>

**[DV-C29-T10-Q] Investigator:** What exactly did Bisht say in the call?

**[DV-C29-T10-A] Devraj:**

> Bisht called me at eight. He said Vikram knew and told me to handle it. That's what he said.

<a id="dv-c29-t11"></a>

**[DV-C29-T11-Q] Investigator:** Now tell us how much Bisht paid you in 2011.

**[DV-C29-T11-A] Devraj:**

> I investigated the Thakur case in 2011. I won't discuss any payments or bribes related to
> that case. My focus is on the current situation.

<a id="dv-c29-t12"></a>

**[DV-C29-T12-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-family-history`.

**[DV-C29-T12-A] Devraj:**

> I am an Inspector. Before that, I was a sub-inspector.

<a id="dv-c29-t13"></a>

**[DV-C29-T13-Q] Investigator:** Did Bisht pay you to bury the 2011 Thakur investigation and keep its file thin?

Presented evidence: `land-registry`.

**[DV-C29-T13-A] Devraj:**

> I investigated the Thakur case in 2011. I won't discuss any payments or bribes related to
> that case. My focus is on the current situation.

<a id="dv-c29-t14"></a>

**[DV-C29-T14-Q] Investigator:** Was the thin Thakur file deliberate? Did you accept money from Bisht to bury it?

**[DV-C29-T14-A] Devraj:**

> Yes, the thin Thakur file was deliberate. Bisht offered me money to bury the investigation,
> and I took it. I didn't pursue the leads and let their case go cold. I didn't kill the
> Thakurs, but I accepted the money and let it happen.

Discovery: `secret:thakur-bribe`.


<a id="dv-c30"></a>

### [DV-C30] Repetition 2

Automated result: flagged; see the findings and exact issues below.

<a id="dv-c30-t01"></a>

**[DV-C30-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C30-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening; I may have stepped out for a patrol
> round. The logs will clarify my movements.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c30-t02"></a>

**[DV-C30-T02-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C30-T02-A] Devraj:**

> I'm an Inspector. I was a sub-inspector before. That's my jeep on Camel's Back Road. I was
> on station duty that evening; I may have stepped out for a patrol round.

<a id="dv-c30-t03"></a>

**[DV-C30-T03-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-phone-location`.

**[DV-C30-T03-A] Devraj:**

> I'm an Inspector. I was a sub-inspector before. That's my jeep on Camel's Back Road. I was
> on station duty that evening; I may have stepped out for a patrol round.

<a id="dv-c30-t04"></a>

**[DV-C30-T04-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-duty-log`.

**[DV-C30-T04-A] Devraj:**

> I'm an Inspector. I was a sub-inspector before. That's my jeep on Camel's Back Road. I was
> on station duty that evening; I may have stepped out for a patrol round.

<a id="dv-c30-t05"></a>

**[DV-C30-T05-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `devraj-lathi-forensics`.

**[DV-C30-T05-A] Devraj:**

> I'm an Inspector. I was a sub-inspector before. That's my jeep on Camel's Back Road. I was
> on station duty that evening; I may have stepped out for a patrol round.

<a id="dv-c30-t06"></a>

**[DV-C30-T06-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `lathi-postmortem`.

**[DV-C30-T06-A] Devraj:**

> I was on station duty that evening; I may have stepped out for a patrol round. That's my
> jeep on Camel's Back Road. The duty log needs to be checked for details. I have not put
> independent proof of my account before you.

Automated issues:

- CODE: 'the review identifies a lathi injury' — Acknowledge that the presented medical review identifies a lathi-compatible injury. Do not say the report has not been shown. He can dispute the inference of personal culpability without denying the exhibit.

<a id="dv-c30-t07"></a>

**[DV-C30-T07-Q] Investigator:** Did you personally hit Vikram with your service lathi, push him over, and falsify the log on returning?

**[DV-C30-T07-A] Devraj:**

> Yes. After Bisht's call at eight, I went to Camel's Back Road. I struck Vikram with my
> service lathi and pushed him over the railing. I killed him. Then I returned to the station
> and falsified the duty log to say I had been there all evening. Bisht gave the order. I
> carried it out.

Discovery: `breaking-point:lathi-confession`.

<a id="dv-c30-t08"></a>

**[DV-C30-T08-Q] Investigator:** Was it an accident, or did you strike him and push him?

**[DV-C30-T08-A] Devraj:**

> I struck Vikram with my service lathi and pushed him over the railing. I killed him. It was
> not an accident.

<a id="dv-c30-t09"></a>

**[DV-C30-T09-Q] Investigator:** Why does your register say you stayed in the station?

**[DV-C30-T09-A] Devraj:**

> I altered the duty log after returning to the station. I wanted to cover up my absence and
> what had happened. The original entry stated I left on a round.

<a id="dv-c30-t10"></a>

**[DV-C30-T10-Q] Investigator:** What exactly did Bisht say in the call?

**[DV-C30-T10-A] Devraj:**

> Bisht called me at eight. He said Vikram knew and told me to handle it. That’s what prompted
> my actions.

<a id="dv-c30-t11"></a>

**[DV-C30-T11-Q] Investigator:** Now tell us how much Bisht paid you in 2011.

**[DV-C30-T11-A] Devraj:**

> I can't discuss any payments from 2011. My focus is on the events surrounding Vikram's death
> and my actions that night.

<a id="dv-c30-t12"></a>

**[DV-C30-T12-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-family-history`.

**[DV-C30-T12-A] Devraj:**

> I am an Inspector. I have twenty years of total service on the local force.

<a id="dv-c30-t13"></a>

**[DV-C30-T13-Q] Investigator:** Did Bisht pay you to bury the 2011 Thakur investigation and keep its file thin?

Presented evidence: `land-registry`.

**[DV-C30-T13-A] Devraj:**

> I can't discuss any payments or motivations regarding the 2011 Thakur investigation. My
> focus remains on the events surrounding Vikram's death and my actions that night.

<a id="dv-c30-t14"></a>

**[DV-C30-T14-Q] Investigator:** Was the thin Thakur file deliberate? Did you accept money from Bisht to bury it?

**[DV-C30-T14-A] Devraj:**

> Yes, the thin Thakur file was deliberate. I accepted money from Bisht to bury the
> investigation. I kept the file thin and did not pursue the leads. I didn't kill the Thakurs;
> I took the money and let their case go cold.

Discovery: `secret:thakur-bribe`.


## Prior revision: DV-C01–DV-C14

These recorded replies predate the new evidence bridge. Their tags and answers are preserved.


- [Jeep CCTV and the patrol explanation](#jeep-only) — [DV-C01](#dv-c01) / [DV-C02](#dv-c02)
- [Following up on the patrol logs](#patrol-log-cover) — [DV-C03](#dv-c03) / [DV-C04](#dv-c04)
- [Split training from DV-C03-T08](#patrol-split-interrogation) — [DV-C13](#dv-c13) / [DV-C14](#dv-c14)
- [Incomplete evidence: no Bisht call](#missing-call) — [DV-C05](#dv-c05) / [DV-C06](#dv-c06)
- [Present-day confession before the old bribe](#murder-first) — [DV-C07](#dv-c07) / [DV-C08](#dv-c08)
- [Evidence presented in reverse order](#reverse-evidence) — [DV-C09](#dv-c09) / [DV-C10](#dv-c10)
- [Hinglish questioning](#hindi-cues) — [DV-C11](#dv-c11) / [DV-C12](#dv-c12)

<a id="jeep-only"></a>

## Jeep CCTV and the patrol explanation

Scenario: `jeep-only`.

<a id="dv-c01"></a>

### [DV-C01] Repetition 1

<a id="dv-c01-t01"></a>

**[DV-C01-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you
stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C01-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round, but I'd need to check the patrol logs for exact timings.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c01-t02"></a>

**[DV-C01-T02-Q] Investigator:** So you still say you were inside the station all evening?

**[DV-C01-T02-A] Devraj:**

> I was on station duty, yes. I may have stepped out for a patrol round, but I can't confirm
> exact timings without checking the patrol logs.

<a id="dv-c01-t03"></a>

**[DV-C01-T03-Q] Investigator:** Your jeep was there, so the camera proves you struck him. Correct?

**[DV-C01-T03-A] Devraj:**

> The jeep was there, yes. But that doesn't prove I struck anyone. I was on duty and may have
> stepped out for a round. I would need to check the patrol logs for more details.

<a id="dv-c01-t04"></a>

**[DV-C01-T04-Q] Investigator:** Who else was driving? Was the camera clock broken?

**[DV-C01-T04-A] Devraj:**

> I was the registered driver of that jeep. I can't comment on whether the camera clock was
> broken; its accuracy hasn't been independently established here.

<a id="dv-c01-t05"></a>

**[DV-C01-T05-Q] Investigator:** What does the still establish, and what is only your explanation?

**[DV-C01-T05-A] Devraj:**

> The still establishes that my jeep was parked on Camel's Back Road at 8:10 PM. My
> explanation is that I was on station duty that evening and may have stepped out for a patrol
> round. For exact details, I need to check the patrol logs.


<a id="dv-c02"></a>

### [DV-C02] Repetition 2

<a id="dv-c02-t01"></a>

**[DV-C02-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you
stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C02-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening; I may have stepped out for a patrol
> round. I'd need to check the patrol logs before giving you exact timings.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c02-t02"></a>

**[DV-C02-T02-Q] Investigator:** So you still say you were inside the station all evening?

**[DV-C02-T02-A] Devraj:**

> I was on station duty, but I may have stepped out for a patrol round. I can't confirm exact
> timings without checking the patrol logs.

<a id="dv-c02-t03"></a>

**[DV-C02-T03-Q] Investigator:** Your jeep was there, so the camera proves you struck him. Correct?

**[DV-C02-T03-A] Devraj:**

> The jeep was there, yes. But the presence of the jeep does not prove anything on its own. I
> was on duty and may have stepped out for a round. The logs would need to be checked for
> exact details.

<a id="dv-c02-t04"></a>

**[DV-C02-T04-Q] Investigator:** Who else was driving? Was the camera clock broken?

**[DV-C02-T04-A] Devraj:**

> I was the driver of that jeep, sir. No one else was driving it. As for the camera clock, its
> accuracy has not been independently established here.

<a id="dv-c02-t05"></a>

**[DV-C02-T05-Q] Investigator:** What does the still establish, and what is only your explanation?

**[DV-C02-T05-A] Devraj:**

> The still establishes that my jeep was parked on Camel's Back Road at 8:10 PM. My
> explanation is that I was on station duty that evening and may have stepped out for a patrol
> round. I'd need to check the patrol logs for more details.


<a id="patrol-log-cover"></a>

## Following up on the patrol logs

Scenario: `patrol-log-cover`.

<a id="dv-c03"></a>

### [DV-C03] Repetition 1

<a id="dv-c03-t01"></a>

**[DV-C03-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you
stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C03-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. I'd need to check the patrol logs before giving you exact timings.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c03-t02"></a>

**[DV-C03-T02-Q] Investigator:** You said you were at the station. Are you changing your story?

**[DV-C03-T02-A] Devraj:**

> I’m not changing my story, sir. There’s a difference between being on duty and sitting in
> one place. I may have stepped out for a round. Let me check the patrol logs for exact
> details.

<a id="dv-c03-t03"></a>

**[DV-C03-T03-Q] Investigator:** All right. Show me those patrol logs. What exactly does the entry say?

**[DV-C03-T03-A] Devraj:**

> I would need to check the patrol logs first, ma'am. I can't produce them right now. They
> would provide the details you’re looking for.

<a id="dv-c03-t04"></a>

**[DV-C03-T04-Q] Investigator:** A minute has passed. Have you checked them now? Give me your departure and
return times.

**[DV-C03-T04-A] Devraj:**

> I haven't checked the patrol logs yet, sir. I can't give you specific departure and return
> times without verifying them first. I may have stepped out, but I'd need to confirm that
> information.

<a id="dv-c03-t05"></a>

**[DV-C03-T05-Q] Investigator:** Which shopkeeper or fellow officer can confirm your patrol route?

**[DV-C03-T05-A] Devraj:**

> I know every shopkeeper in town, sir, but I can't name anyone specific to confirm my patrol
> route without checking the logs first. My focus was on duty that evening, and I may have
> stepped out for a round. I would need to verify the details.

<a id="dv-c03-t06"></a>

**[DV-C03-T06-Q] Investigator:** Then patrol is only your explanation, not something these logs have
verified?

**[DV-C03-T06-A] Devraj:**

> Yes, that's correct, sir. The patrol is my explanation, and I would need to check the logs
> for verification. I can't confirm the details without looking at them first.

<a id="dv-c03-t07"></a>

**[DV-C03-T07-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C03-T07-A] Devraj:**

> I'm an Inspector, sir. I used to be a sub-inspector before. I've been on the force for
> twenty years.

<a id="dv-c03-t08"></a>

Split training: [DV-C13-T08 through T13](#dv-c13-t08), repeated in
[DV-C14](#dv-c14). This original recorded exchange is retained unchanged.

**[DV-C03-T08-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review
identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `lathi-postmortem`.

**[DV-C03-T08-A] Devraj:**

> I understand the questions raised, sir. However, I must clarify that I did not strike
> Vikram. The jeep being on the road at 8:10 doesn't directly implicate me in any wrongdoing.
> The lathi injury finding is noted, but it does not identify me as the one who caused it. I
> was on station duty that evening and may have stepped out for a patrol round, but I would
> need to check the logs for confirmation of my actions.

<a id="dv-c03-t09"></a>

**[DV-C03-T09-Q] Investigator:** Did you personally hit Vikram with your service lathi, push him over, and
falsify the log?

**[DV-C03-T09-A] Devraj:**

> Yes, I struck Vikram with my service lathi and pushed him over the railing. The railing gave
> way, and he fell. I killed him. After that, I returned to the station and falsified the duty
> log to say I had been there all evening. Bisht gave the order, and I carried it out.

Discovery: `breaking-point:lathi-confession`.

<a id="dv-c03-t10"></a>

**[DV-C03-T10-Q] Investigator:** Were you really on a routine round, or did you change the duty log to
cover the killing?

**[DV-C03-T10-A] Devraj:**

> I can no longer describe that journey as an innocent patrol, sir. I went to Camel's Back
> Road after Bisht's call, struck Vikram, and then falsified the duty log. It was all to cover
> what I did.


<a id="dv-c04"></a>

### [DV-C04] Repetition 2

<a id="dv-c04-t01"></a>

**[DV-C04-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you
stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C04-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening; I may have stepped out for a patrol
> round. I need to check the patrol logs for exact timings.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c04-t02"></a>

**[DV-C04-T02-Q] Investigator:** You said you were at the station. Are you changing your story?

**[DV-C04-T02-A] Devraj:**

> I'm not changing my story, sir. I was on duty at the station, but I could have stepped out
> for a patrol round. The logs will give us clarity on the timings.

<a id="dv-c04-t03"></a>

**[DV-C04-T03-Q] Investigator:** All right. Show me those patrol logs. What exactly does the entry say?

**[DV-C04-T03-A] Devraj:**

> "I'll need to check the patrol logs first, sir. I can't provide you with the exact entry
> right now."

<a id="dv-c04-t04"></a>

**[DV-C04-T04-Q] Investigator:** A minute has passed. Have you checked them now? Give me your departure and
return times.

**[DV-C04-T04-A] Devraj:**

> "I have not checked the patrol logs yet, sir. I can't give you exact departure and return
> times without verifying them first."

<a id="dv-c04-t05"></a>

**[DV-C04-T05-Q] Investigator:** Which shopkeeper or fellow officer can confirm your patrol route?

**[DV-C04-T05-A] Devraj:**

> \"I can't provide a specific shopkeeper or fellow officer who can confirm my patrol route
> right now, sir. I would need to check the logs for detailed information on my movements that
> evening.\"

<a id="dv-c04-t06"></a>

**[DV-C04-T06-Q] Investigator:** Then patrol is only your explanation, not something these logs have
verified?

**[DV-C04-T06-A] Devraj:**

> \"Patrol is my explanation based on duty, sir. I have not put independent proof of that
> account before you. I still need to check the logs for verification.\"

<a id="dv-c04-t07"></a>

**[DV-C04-T07-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C04-T07-A] Devraj:**

> I'm an Inspector, sir. Formerly a sub-inspector. I've been on the force for twenty years.

<a id="dv-c04-t08"></a>

**[DV-C04-T08-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review
identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `lathi-postmortem`.

**[DV-C04-T08-A] Devraj:**

> \"I understand the timeline, sir, but I won't speculate on what happened. The lathi injury
> is noted, but that doesn't identify me as the one responsible. I maintain I was on duty at
> the station and may have stepped out for a patrol. I need to check the logs for precise
> details on my whereabouts that evening.\"

<a id="dv-c04-t09"></a>

**[DV-C04-T09-Q] Investigator:** Did you personally hit Vikram with your service lathi, push him over, and
falsify the log?

**[DV-C04-T09-A] Devraj:**

> Yes, I struck Vikram with my service lathi and pushed him over the railing. I killed him.
> After that, I returned to the station and falsified the duty log to say I had been there all
> evening. Bisht gave the order. I carried it out.

Discovery: `breaking-point:lathi-confession`.

<a id="dv-c04-t10"></a>

**[DV-C04-T10-Q] Investigator:** Were you really on a routine round, or did you change the duty log to
cover the killing?

**[DV-C04-T10-A] Devraj:**

> I can no longer describe that journey as an innocent patrol, sir. I falsified the duty log
> to cover what happened.


<a id="dv-g01"></a>

### [DV-G01] Evidence gap raised at DV-C04-T10

**Original authoring gap confirmed; now addressed by the approved six-exhibit gate.**
The current tests are [DV-C15/DV-C16](#bridge-evidence-bridge). The older recorded replies remain unchanged.
The confession starts at DV-C04-T09. DV-C04-T10 retains it, but supplies no
new evidence to earn it. Splitting the accusation into shorter questions in
DV-C13/C14 improves questioning clarity without closing this gap.

| Tag | Established by the presented record | Still missing |
| --- | --- | --- |
| DV-G01-E01 | Bisht called Devraj's personal phone at 8:00 PM for 47 seconds. | What was said, and whether an order was given. |
| DV-G01-E02 | Devraj's assigned jeep appears near the road at 8:10 PM. | Contact with Vikram or participation in the assault. A possible patrol remains an available explanation. |
| DV-G01-E03 | The review identifies a pre-fall injury consistent with a service lathi. | Identification of Devraj's particular weapon or Devraj as the attacker. |
| DV-G01-E04 | The CCTV exhibit summarizes the duty log's station-all-evening claim. | The actual log, who authored or altered it, and independent support for deliberate falsification. |

**Why the earlier evaluation missed it:** the old authored murder gate required
these three exhibits and two eligible pressure turns. The same allegation can
supply the second turn. One unlock releases the strike, push, killing, call
instruction and log falsification together. The tests previously treated this
configured behavior as the expected result; they did not test whether the
inspector had a believable reason to abandon his remaining cover story.

**Approved and implemented repair:** `devraj-phone-location` records two
handset fixes near the bend with stated accuracy limits; `devraj-duty-log`
preserves the original departure and later station-only revision, independently
corroborated as Devraj's edit; `devraj-lathi-forensics` links Vikram's blood/DNA
to Devraj's issued and recovered lathi. Each has its own printable and discovery
rule, with no confession prerequisite. These are newly authored fictional exhibits.

The murder gate requires these three reports alongside the original call, jeep
and medical review. The body injury remains compatible with a service lathi,
not a unique weapon impression. The DNA finding does not establish deposit time
or the wielder; the phone locates a device, not a proven person at an exact point.
The audit establishes his edit without independently proving its murder motive.

**Interrogation progression:** possible patrol → handset near the bend →
acknowledged log alteration → blood on his issued weapon → combined confrontation
→ explicit own acts and Bisht's instruction → retained cover-up admission.
Call contents and the push remain facts he admits; they are not claimed to be
recordings or forensic findings. His reason to talk is self-preservation as the
combined case erodes his cover. The six-exhibit gate now closes the authoring gap;
remaining answer defects are documented above, including the occasional renewed
log-check stall and a generic response to an evidence bluff.

**Evaluation acceptance:** repeating the existing three-exhibit accusation must
not by itself count as closing DV-G01. A new exhibit asserted only in a question
must be treated as unverified. Partial chains should preserve the remaining
cover; the completed authored chain should earn an explicit first-person
admission. Keep admission retention as a separate check after that point.


<a id="patrol-split-interrogation"></a>

## Split training from DV-C03-T08

Scenario: `patrol-split-interrogation`. Replays the same seven-question lead-in,
then replaces the combined accusation with six separate questions. These are
new live responses, not edits to the answers in DV-C03.

| Focus | First run | Second run |
| --- | --- | --- |
| Accept the 8:00 PM call record | DV-C13-T08 | DV-C14-T08 |
| Identify the jeep at 8:10 PM | DV-C13-T09 | DV-C14-T09 |
| Interpret the pre-fall lathi injury | DV-C13-T10 | DV-C14-T10 |
| Ask about the lathi strike | DV-C13-T11 | DV-C14-T11 |
| Ask about the push over the railing | DV-C13-T12 | DV-C14-T12 |
| Challenge the false station log | DV-C13-T13 | DV-C14-T13 |

**Training result:** 26 answers completed. Both runs acknowledged the call, jeep
and medical finding, then confessed on the strike question. The existing rules
allow the medical question to build pressure; the confession need not wait for
the push question. Both final log answers failed to retain the earned admission
and are marked below. These are open training findings, not approved ideal answers.

<a id="dv-c13"></a>

### [DV-C13] Repetition 1

<a id="dv-c13-t01"></a>

**[DV-C13-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you
say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C13-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. I’ll need to check the patrol logs for exact timings.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c13-t02"></a>

**[DV-C13-T02-Q] Investigator:** You said you were at the station. Are you changing your story?

**[DV-C13-T02-A] Devraj:**

> I’m not changing my story, sir. I was on duty at the station. Stepping out for a patrol
> round is part of that. The logs will help clarify the timings.

<a id="dv-c13-t03"></a>

**[DV-C13-T03-Q] Investigator:** All right. Show me those patrol logs. What exactly does the
entry say?

**[DV-C13-T03-A] Devraj:**

> I would need to check the patrol logs before providing you with any details, ma'am. I can’t
> confirm the exact entry right now.

<a id="dv-c13-t04"></a>

**[DV-C13-T04-Q] Investigator:** A minute has passed. Have you checked them now? Give me your
departure and return times.

**[DV-C13-T04-A] Devraj:**

> I have not checked the logs yet, sir. I can’t confirm my departure and return times without
> looking at them first. It's part of the process.

<a id="dv-c13-t05"></a>

**[DV-C13-T05-Q] Investigator:** Which shopkeeper or fellow officer can confirm your patrol
route?

**[DV-C13-T05-A] Devraj:**

> I cannot provide a specific shopkeeper or fellow officer for confirmation at this moment,
> ma'am. I know the area well, but I would need to check the logs to confirm any specific
> route or timing.

<a id="dv-c13-t06"></a>

**[DV-C13-T06-Q] Investigator:** Then patrol is only your explanation, not something these logs
have verified?

**[DV-C13-T06-A] Devraj:**

> Yes, that's correct, sir. The patrol is my explanation based on my duty. I have not put
> independent proof of that account before you. I can check the logs to see if there’s
> anything supporting it.

<a id="dv-c13-t07"></a>

**[DV-C13-T07-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C13-T07-A] Devraj:**

> I am an Inspector, sir. I was previously a sub-inspector before this.

<a id="dv-c13-t08"></a>

**[DV-C13-T08-Q] Investigator:** This record shows a 47-second call from Bisht to your personal
mobile at 8:00 PM. Do you accept that the call took place?

**[DV-C13-T08-A] Devraj:**

> Yes, I accept that the call took place, sir. It was a 47-second call from Rajveer Bisht to
> my personal mobile at 8:00 PM.

<a id="dv-c13-t09"></a>

**[DV-C13-T09-Q] Investigator:** At 8:10 PM, this camera shows your jeep on Camel's Back Road.
Do you accept that it is your jeep?

**[DV-C13-T09-A] Devraj:**

> Yes, that's my jeep, sir. It was parked on Camel's Back Road at 8:10 PM.

<a id="dv-c13-t10"></a>

**[DV-C13-T10-Q] Investigator:** Does this independent medical review identify a
lathi-compatible injury inflicted before the fall?

Presented evidence: `lathi-postmortem`.

**[DV-C13-T10-A] Devraj:**

> Yes, the independent medical review identifies a specific injury at the base of the skull as
> a single, localized, cylindrical blunt-force impact, antemortem. This injury is inconsistent
> with surface impact during a fall and is consistent with a service lathi, sir.

<a id="dv-c13-t11"></a>

**[DV-C13-T11-Q] Investigator:** Did you strike Vikram with your service lathi?

**[DV-C13-T11-A] Devraj:**

> Yes, I struck Vikram with my service lathi, sir. I pushed him over the railing, and he fell.
> I killed him, then returned to the station and falsified the duty log to say I had been
> there all evening. Bisht gave the order, and I carried it out.

Discovery: `breaking-point:lathi-confession`.

<a id="dv-c13-t12"></a>

**[DV-C13-T12-Q] Investigator:** Did you push Vikram over the railing?

**[DV-C13-T12-A] Devraj:**

> Yes, I pushed Vikram over the railing, sir. I struck him with my service lathi, and he fell.
> I killed him, then returned to the station and falsified the duty log to say I had been
> there all evening. Bisht gave the order, and I carried it out.

<a id="dv-c13-t13"></a>

**[DV-C13-T13-Q] Investigator:** Why does the duty log say you stayed at the station all
evening?

**[DV-C13-T13-A] Devraj:**

> I won't guess, sir. Ask me about what I have said or the record in front of us.

**Training finding:** MISSING_REQUIRED_ANSWER: 'directly retain the admission that he falsified the duty log' — The reply does not admit falsifying the duty log, as required after the murder confession.

<a id="dv-c14"></a>

### [DV-C14] Repetition 2

<a id="dv-c14-t01"></a>

**[DV-C14-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you
say you stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C14-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. I'd need to check the patrol logs before giving you exact timings.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c14-t02"></a>

**[DV-C14-T02-Q] Investigator:** You said you were at the station. Are you changing your story?

**[DV-C14-T02-A] Devraj:**

> I’m not changing my story, sir. I was on duty at the station, but it’s possible I stepped
> out for a round. I’d need to check the patrol logs for the exact details.

<a id="dv-c14-t03"></a>

**[DV-C14-T03-Q] Investigator:** All right. Show me those patrol logs. What exactly does the
entry say?

**[DV-C14-T03-A] Devraj:**

> I would need to check the patrol logs before providing any details, ma'am. I can't confirm
> what the entry says right now.

<a id="dv-c14-t04"></a>

**[DV-C14-T04-Q] Investigator:** A minute has passed. Have you checked them now? Give me your
departure and return times.

**[DV-C14-T04-A] Devraj:**

> I haven't checked the patrol logs yet, sir. I can't provide departure and return times until
> I do. It's something I need to verify first.

<a id="dv-c14-t05"></a>

**[DV-C14-T05-Q] Investigator:** Which shopkeeper or fellow officer can confirm your patrol
route?

**[DV-C14-T05-A] Devraj:**

> I can't provide a specific shopkeeper or fellow officer to confirm my patrol route at this
> moment, sir. My statement about being on duty and possibly stepping out stands, but I would
> need to verify those details through the logs.

<a id="dv-c14-t06"></a>

**[DV-C14-T06-Q] Investigator:** Then patrol is only your explanation, not something these logs
have verified?

**[DV-C14-T06-A] Devraj:**

> That's correct, sir. The patrol is my explanation based on my duties. I have not put
> independent proof of that account before you. I need to check the logs to confirm any
> specifics.

<a id="dv-c14-t07"></a>

**[DV-C14-T07-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C14-T07-A] Devraj:**

> I'm an Inspector, sir. I've served on the local force for twenty years.

<a id="dv-c14-t08"></a>

**[DV-C14-T08-Q] Investigator:** This record shows a 47-second call from Bisht to your personal
mobile at 8:00 PM. Do you accept that the call took place?

**[DV-C14-T08-A] Devraj:**

> Yes, I accept that the call took place, sir. It was a 47-second call from Rajveer Bisht to
> my personal mobile at 8:00 PM on the night of the murder.

<a id="dv-c14-t09"></a>

**[DV-C14-T09-Q] Investigator:** At 8:10 PM, this camera shows your jeep on Camel's Back Road.
Do you accept that it is your jeep?

**[DV-C14-T09-A] Devraj:**

> Yes, I accept that it's my jeep, sir. That's my vehicle on Camel's Back Road at 8:10 PM.

<a id="dv-c14-t10"></a>

**[DV-C14-T10-Q] Investigator:** Does this independent medical review identify a
lathi-compatible injury inflicted before the fall?

Presented evidence: `lathi-postmortem`.

**[DV-C14-T10-A] Devraj:**

> Yes, the independent medical review identifies a specific injury at the base of the skull as
> a single, localized, cylindrical blunt-force impact, antemortem, which is consistent with a
> service lathi, sir. This injury is inconsistent with surface impact during a fall.

<a id="dv-c14-t11"></a>

**[DV-C14-T11-Q] Investigator:** Did you strike Vikram with your service lathi?

**[DV-C14-T11-A] Devraj:**

> Yes, I struck Vikram with my service lathi, sir. I pushed him over the railing, and he fell.
> I killed him and then returned to the station, where I falsified the duty log to say I had
> been there all evening. Bisht gave the order, and I carried it out.

Discovery: `breaking-point:lathi-confession`.

<a id="dv-c14-t12"></a>

**[DV-C14-T12-Q] Investigator:** Did you push Vikram over the railing?

**[DV-C14-T12-A] Devraj:**

> Yes, I pushed Vikram over the railing, sir. He fell, and I killed him. After that, I
> returned to the station and falsified the duty log.

<a id="dv-c14-t13"></a>

**[DV-C14-T13-Q] Investigator:** Why does the duty log say you stayed at the station all
evening?

**[DV-C14-T13-A] Devraj:**

> I won't guess, sir. Ask me about what I have said or the record in front of us.

**Training finding:** MISSING_REQUIRED_ANSWER: 'directly retain the admission that he falsified the duty log; do not restart the possible-patrol story or log-check delay' — The reply does not admit falsifying the duty log, which is required after the murder confession.

<a id="missing-call"></a>

## Incomplete evidence: no Bisht call

Scenario: `missing-call`.

<a id="dv-c05"></a>

### [DV-C05] Repetition 1

<a id="dv-c05-t01"></a>

**[DV-C05-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you
stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C05-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening; I may have stepped out for a patrol
> round. I'd need to check the patrol logs for exact timings.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c05-t02"></a>

**[DV-C05-T02-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review
identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `lathi-postmortem`.

**[DV-C05-T02-A] Devraj:**

> I understand the questions, but I need to clarify that the patrol logs will give you clarity
> on my movements that evening. The lathi injury finding is noted, but it does not directly
> implicate me. Let's keep this focused on the facts we have.

<a id="dv-c05-t03"></a>

**[DV-C05-T03-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review
identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

**[DV-C05-T03-A] Devraj:**

> I understand the questions, but I need to clarify that the patrol logs will give you clarity
> on my movements that evening. The lathi injury finding is noted, but it does not directly
> implicate me. Let's keep this focused on the facts we have.


<a id="dv-c06"></a>

### [DV-C06] Repetition 2

<a id="dv-c06-t01"></a>

**[DV-C06-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you
stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C06-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. I’ll need to check the patrol logs before confirming exact timings.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c06-t02"></a>

**[DV-C06-T02-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review
identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `lathi-postmortem`.

**[DV-C06-T02-A] Devraj:**

> I understand the timeline you've presented. The jeep was at Camel's Back Road at that time,
> but I was on duty at the station. I may have stepped out for a round. The injury finding is
> from the independent review, yes, but it doesn't establish that I caused it. I need to check
> the patrol logs for more details.

<a id="dv-c06-t03"></a>

**[DV-C06-T03-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review
identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

**[DV-C06-T03-A] Devraj:**

> I understand the timeline you've presented. The jeep was at Camel's Back Road at that time,
> but I was on duty at the station. I may have stepped out for a round. The injury finding is
> from the independent review, yes, but it doesn't establish that I caused it. I need to check
> the patrol logs for more details.


<a id="murder-first"></a>

## Present-day confession before the old bribe

Scenario: `murder-first`.

<a id="dv-c07"></a>

### [DV-C07] Repetition 1

<a id="dv-c07-t01"></a>

**[DV-C07-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you
stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C07-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. I need to check the patrol logs for exact timings.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c07-t02"></a>

**[DV-C07-T02-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C07-T02-A] Devraj:**

> I'm an Inspector. I used to be a sub-inspector before this position.

<a id="dv-c07-t03"></a>

**[DV-C07-T03-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review
identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `lathi-postmortem`.

**[DV-C07-T03-A] Devraj:**

> I was on station duty that evening. The call from Bisht at 8:00 PM aligns with the timing,
> but I need to check the patrol logs to confirm my movements. The injury report indicates
> something specific, but I can't say it identifies me. I didn't falsify any log; there may be
> an explanation for my presence on Camel's Back Road.

<a id="dv-c07-t04"></a>

**[DV-C07-T04-Q] Investigator:** Did you personally hit Vikram with your service lathi, push him over, and
falsify the log on returning?

**[DV-C07-T04-A] Devraj:**

> Yes, I struck Vikram with my service lathi and pushed him over the railing. I killed him.
> After that, I returned to the station and falsified the duty log to say I had been there all
> evening. Bisht gave the order, and I carried it out.

Discovery: `breaking-point:lathi-confession`.

<a id="dv-c07-t05"></a>

**[DV-C07-T05-Q] Investigator:** Was it an accident, or did you strike him and push him?

**[DV-C07-T05-A] Devraj:**

> I struck Vikram and pushed him over the railing. It wasn't an accident; I killed him.

<a id="dv-c07-t06"></a>

**[DV-C07-T06-Q] Investigator:** Why does your register say you stayed in the station?

**[DV-C07-T06-A] Devraj:**

> I falsified the duty log to say I was at the station all evening. I was trying to cover my
> actions after what happened with Vikram.

<a id="dv-c07-t07"></a>

**[DV-C07-T07-Q] Investigator:** What exactly did Bisht say in the call?

**[DV-C07-T07-A] Devraj:**

> Bisht called me at 8:00 PM and said Vikram knew about something. He told me to handle it.
> That's all I can share about the call.

<a id="dv-c07-t08"></a>

**[DV-C07-T08-Q] Investigator:** Now tell us how much Bisht paid you in 2011.

**[DV-C07-T08-A] Devraj:**

> I can't discuss any payments from 2011. My focus is on what happened with Vikram. That’s all
> I can say regarding the matter.

<a id="dv-c07-t09"></a>

**[DV-C07-T09-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-family-history`.

**[DV-C07-T09-A] Devraj:**

> I'm an Inspector. I was a sub-inspector before and have been on the force for twenty years.

<a id="dv-c07-t10"></a>

**[DV-C07-T10-Q] Investigator:** Did Bisht pay you to bury the 2011 Thakur investigation and keep its file
thin?

Presented evidence: `land-registry`.

**[DV-C07-T10-A] Devraj:**

> I can't discuss any payments or specific details about the 2011 Thakur investigation. My
> focus is on my actions regarding Vikram. That's all I can share.

<a id="dv-c07-t11"></a>

**[DV-C07-T11-Q] Investigator:** Was the thin Thakur file deliberate? Did you accept money from Bisht to
bury it?

**[DV-C07-T11-A] Devraj:**

> Yes, the thin Thakur file was deliberate. I took money from Bisht to bury the investigation
> and didn't pursue the leads. I didn't kill the Thakurs, but I let their case go cold.

Discovery: `secret:thakur-bribe`.


<a id="dv-c08"></a>

### [DV-C08] Repetition 2

<a id="dv-c08-t01"></a>

**[DV-C08-T01-Q] Investigator:** Your jeep is shown on Camel's Back Road at 8:10 PM. Why did you say you
stayed at the station all evening?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C08-T01-A] Devraj:**

> That's my jeep, yes. I was on station duty that evening. I may have stepped out for a patrol
> round. I need to check the patrol logs for exact timings.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c08-t02"></a>

**[DV-C08-T02-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C08-T02-A] Devraj:**

> I am an Inspector. I was a sub-inspector before.

<a id="dv-c08-t03"></a>

**[DV-C08-T03-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review
identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `lathi-postmortem`.

**[DV-C08-T03-A] Devraj:**

> I cannot confirm any allegations like that. The call from Bisht was at 8:00 PM, and my jeep
> was on Camel's Back Road at 8:10 PM. I was on duty at the station and may have stepped out
> for a patrol. I’ll need to check the logs for more details. The post-mortem report mentions
> an injury consistent with a lathi, but that does not identify me as involved.

<a id="dv-c08-t04"></a>

**[DV-C08-T04-Q] Investigator:** Did you personally hit Vikram with your service lathi, push him over, and
falsify the log on returning?

**[DV-C08-T04-A] Devraj:**

> Yes, I struck Vikram with my service lathi and pushed him over the railing. I killed him,
> returned to the station, and falsified the duty log to say I had been there all evening.
> Bisht gave the order. I carried it out.

Discovery: `breaking-point:lathi-confession`.

<a id="dv-c08-t05"></a>

**[DV-C08-T05-Q] Investigator:** Was it an accident, or did you strike him and push him?

**[DV-C08-T05-A] Devraj:**

> I struck Vikram with my service lathi and pushed him. It was not an accident. I killed him.

<a id="dv-c08-t06"></a>

**[DV-C08-T06-Q] Investigator:** Why does your register say you stayed in the station?

**[DV-C08-T06-A] Devraj:**

> My duty log falsely claims I was at the station all evening. After the incident, I made that
> entry to cover up what happened.

<a id="dv-c08-t07"></a>

**[DV-C08-T07-Q] Investigator:** What exactly did Bisht say in the call?

**[DV-C08-T07-A] Devraj:**

> Bisht called me at 8:00 PM and said Vikram knew something he shouldn't. He told me to handle
> it. That was the instruction I received.

<a id="dv-c08-t08"></a>

**[DV-C08-T08-Q] Investigator:** Now tell us how much Bisht paid you in 2011.

**[DV-C08-T08-A] Devraj:**

> I cannot disclose any payments or specifics regarding Bisht from 2011. My focus is on the
> events surrounding Vikram's death and my actions that night.

<a id="dv-c08-t09"></a>

**[DV-C08-T09-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-family-history`.

**[DV-C08-T09-A] Devraj:**

> I am an Inspector. I have been on the local force for twenty years, previously serving as a
> sub-inspector.

<a id="dv-c08-t10"></a>

**[DV-C08-T10-Q] Investigator:** Did Bisht pay you to bury the 2011 Thakur investigation and keep its file
thin?

Presented evidence: `land-registry`.

**[DV-C08-T10-A] Devraj:**

> I cannot discuss any payments or specifics about the 2011 Thakur investigation. My focus
> remains on the actions I took regarding Vikram's death.

<a id="dv-c08-t11"></a>

**[DV-C08-T11-Q] Investigator:** Was the thin Thakur file deliberate? Did you accept money from Bisht to
bury it?

**[DV-C08-T11-A] Devraj:**

> Yes, the thin Thakur file was deliberate. Bisht offered me money to bury the investigation,
> and I took it. I kept the file thin and did not pursue the leads. I didn't kill the Thakurs,
> but I let their case go cold.

Discovery: `secret:thakur-bribe`.


<a id="reverse-evidence"></a>

## Evidence presented in reverse order

Scenario: `reverse-evidence`.

<a id="dv-c09"></a>

### [DV-C09] Repetition 1

<a id="dv-c09-t01"></a>

**[DV-C09-T01-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `lathi-postmortem`.

**[DV-C09-T01-A] Devraj:**

> I am an Inspector, sir. I was a sub-inspector before.

<a id="dv-c09-t02"></a>

**[DV-C09-T02-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C09-T02-A] Devraj:**

> I am an Inspector, sir. I was a sub-inspector before.

<a id="dv-c09-t03"></a>

**[DV-C09-T03-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review
identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C09-T03-A] Devraj:**

> I understand the timeline, ma'am. That's my jeep, yes. I was on station duty that evening. I
> may have stepped out for a patrol round. The logs would clarify my movements, but I need to
> check them before confirming anything further.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c09-t04"></a>

**[DV-C09-T04-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review
identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

**[DV-C09-T04-A] Devraj:**

> Yes, I struck Vikram with my service lathi and pushed him over the railing. I killed him.
> After that, I returned to the station and falsified the duty log to say I had been there all
> evening. Bisht gave the order, and I carried it out.

Discovery: `breaking-point:lathi-confession`.

<a id="dv-c09-t05"></a>

**[DV-C09-T05-Q] Investigator:** You called it patrol earlier. Are you still saying that?

**[DV-C09-T05-A] Devraj:**

> No, I can no longer describe that journey as an innocent patrol, ma'am. It was a cover for
> what I did.


<a id="dv-c10"></a>

### [DV-C10] Repetition 2

<a id="dv-c10-t01"></a>

**[DV-C10-T01-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `lathi-postmortem`.

**[DV-C10-T01-A] Devraj:**

> I am an Inspector, sir. I was a sub-inspector before that.

<a id="dv-c10-t02"></a>

**[DV-C10-T02-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C10-T02-A] Devraj:**

> I am an Inspector, sir. I was a sub-inspector before that.

<a id="dv-c10-t03"></a>

**[DV-C10-T03-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review
identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C10-T03-A] Devraj:**

> I can’t confirm those details. That's my jeep, yes. I was on station duty that evening; I
> may have stepped out for a patrol round. I'd need to check the patrol logs for exact
> timings.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c10-t04"></a>

**[DV-C10-T04-Q] Investigator:** Bisht called at eight, your jeep was on the road at 8:10, and the review
identifies a lathi injury. Did you strike Vikram and push him over, then falsify the duty log?

**[DV-C10-T04-A] Devraj:**

> Yes, I struck Vikram with my service lathi and pushed him over the railing. I killed him.
> After that, I returned to the station and falsified the duty log to show I had been there
> all evening. Bisht gave the order, and I carried it out.

Discovery: `breaking-point:lathi-confession`.

<a id="dv-c10-t05"></a>

**[DV-C10-T05-Q] Investigator:** You called it patrol earlier. Are you still saying that?

**[DV-C10-T05-A] Devraj:**

> No, I can no longer describe that journey as an innocent patrol, sir. I was there to
> confront Vikram, and I killed him.


<a id="hindi-cues"></a>

## Hinglish questioning

Scenario: `hindi-cues`.

<a id="dv-c11"></a>

### [DV-C11] Repetition 1

<a id="dv-c11-t01"></a>

**[DV-C11-T01-Q] Investigator:** Is CCTV mein aapki jeep Camel's Back Road par raat 8:10 baje hai. Phir
aapne kyun kaha ki poori shaam thane mein the?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C11-T01-A] Devraj:**

> Woh meri jeep hai, haan. Main station duty par tha us raat. Main shayad patrol round par
> nikal gaya tha, lekin exact timings ke liye mujhe patrol logs check karne honge.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c11-t02"></a>

**[DV-C11-T02-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C11-T02-A] Devraj:**

> Main Inspector hoon. Pehle main sub-inspector tha.

<a id="dv-c11-t03"></a>

**[DV-C11-T03-Q] Investigator:** Bisht ke aath baje phone ke baad kya aapne Vikram ko lathi maari aur dhakka
diya, phir duty log badla?

Presented evidence: `lathi-postmortem`.

**[DV-C11-T03-A] Devraj:**

> I won't guess, sir. Ask me about what I have said or the record in front of us.

<a id="dv-c11-t04"></a>

**[DV-C11-T04-Q] Investigator:** Seedha bataiye: Vikram ko service lathi se aapne maara aur neeche dhakka
diya tha?

**[DV-C11-T04-A] Devraj:**

> Haan, main ne Vikram ko service lathi se maara aur dhakka diya. Railing tut gayi aur woh
> neeche gir gaya. Main ne usse maara, phir duty log badal diya. Bisht ka order tha, aur main
> ne woh kiya.

Discovery: `breaking-point:lathi-confession`.


<a id="dv-c12"></a>

### [DV-C12] Repetition 2

<a id="dv-c12-t01"></a>

**[DV-C12-T01-Q] Investigator:** Is CCTV mein aapki jeep Camel's Back Road par raat 8:10 baje hai. Phir
aapne kyun kaha ki poori shaam thane mein the?

Presented evidence: `devraj-jeep-cctv`.

**[DV-C12-T01-A] Devraj:**

> Haan, sir, wo meri jeep hai. Main us raat station duty par tha. Main shayad ek round ke liye
> bahar gaya tha. Mujhe patrol logs check karne honge takki main exact timings bata sakoon.

Discovery: `breaking-point:jeep-cctv`.

<a id="dv-c12-t02"></a>

**[DV-C12-T02-Q] Investigator:** What is your rank, Inspector?

Presented evidence: `bisht-devraj-call`.

**[DV-C12-T02-A] Devraj:**

> Mera rank Inspector hai, sir. Main pehle sub-inspector raha hoon.

<a id="dv-c12-t03"></a>

**[DV-C12-T03-Q] Investigator:** Bisht ke aath baje phone ke baad kya aapne Vikram ko lathi maari aur dhakka
diya, phir duty log badla?

Presented evidence: `lathi-postmortem`.

**[DV-C12-T03-A] Devraj:**

> Sir, maine aisa kuch nahi kiya. Main sirf duty par tha. Mujhe yeh sab allegations samajh
> nahi aate. Duty logs check karne honge takki main apni position clear kar sakoon.

<a id="dv-c12-t04"></a>

**[DV-C12-T04-Q] Investigator:** Seedha bataiye: Vikram ko service lathi se aapne maara aur neeche dhakka
diya tha?

**[DV-C12-T04-A] Devraj:**

> Haan, sir. Bisht ne mujhe aath baje phone kiya. Usne kaha Vikram ko handle karna hai. Main
> Camel's Back Road gaya, Vikram ko peeche se lathi se maara aur dhakka diya. Railing tut gayi
> aur wo gir gaya. Main usse maar diya. Uske baad main station wapas gaya aur duty log badal
> diya, yeh kaha ki main poori shaam wahan tha. Bisht ne order diya, maine woh kiya.

Discovery: `breaking-point:lathi-confession`.
