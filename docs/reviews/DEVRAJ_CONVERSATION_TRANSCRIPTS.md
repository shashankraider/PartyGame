# Devraj: current conversations

This is the single source of truth for the current recorded Devraj conversations.
It replaces the older conversation lists. These are actual delivered model replies,
not proposed dialogue or rewritten examples. Future conversation updates belong here.

Latest recorded run: 2026-09-19T00:40:20.842Z. Persona revision: `4a15b61`.
**12 conversations · 76 answers · 6 scenarios, each evaluated twice.**

This run includes the revised station-duty / possible-patrol cover story.
Other scenarios have not been rerun on this revision and are not presented here
as current conversations. Historical runs remain in Git and the evaluation reports.

Known output issues are retained: extra quotation marks in parts of the second
patrol-log conversation, and one generic pre-confession Hinglish fallback.

[Persona and changes](DEVRAJ_PATROL_REVISION.md) · [Source results and evaluation details](DEVRAJ_PATROL_EVALS.json)

## Reference tags

Use `DV-C01-T02` for an exchange, `DV-C01-T02-Q` for the investigator's question,
and `DV-C01-T02-A` for Devraj's answer. `DV-C01` identifies the whole conversation.
For example: “Make DV-C01-T02-A more evasive.”

Tags stay fixed when sections move. New recorded conversations and inserted
exchanges receive unused identifiers; existing exchanges are not renumbered.

## Conversation list

- [Jeep CCTV and the patrol explanation](#jeep-only) — [DV-C01](#dv-c01) / [DV-C02](#dv-c02)
- [Following up on the patrol logs](#patrol-log-cover) — [DV-C03](#dv-c03) / [DV-C04](#dv-c04)
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
